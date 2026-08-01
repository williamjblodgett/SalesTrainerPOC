# Connector implementation

## Supported ingestion boundary

Suadence exposes a provider-neutral, server-to-server ingestion seam:

`POST /api/revenue-os/connectors/{provider}/events`

Supported providers are `gong`, `chorus`, `zoom`, `teams`, and `salesforce`. Supported normalized events are `call.completed`, `transcript.ready`, and `call.deleted`.

Every request must include:

- `x-suadence-timestamp`: Unix seconds or milliseconds, no more than five minutes old
- `x-suadence-signature`: hex HMAC-SHA256 of `{timestamp}.{rawBody}` using `CONNECTOR_WEBHOOK_SECRET`
- a unique `eventId`
- an external call ID
- consent state of either `confirmed` or `quarantined` for transcript events

The gateway hashes the payload, deduplicates by organization/provider/event ID, validates the normalized envelope, applies consent gating, persists a job record, creates exactly 20 review-required assets for accepted calls, and audits the outcome without copying transcript content into the audit event. A source deletion event runs the local lineage cascade idempotently.

This is the stable production boundary for provider adapters. It is not a claim that a customer tenant has authorized a provider. The connector UI deliberately distinguishes:

- `connected/native`: secure upload is available
- `configuration_verified/oauth_ready`: client ID and secret exist; customer authorization is still required
- `pilot_only/manual_pilot`: no OAuth import is represented

## Provider adapter responsibilities

Each provider adapter must perform its own authorization and translate source events into the normalized envelope. Tokens belong in an encrypted server-side credential store and never in D1 rows returned to the browser. Adapters must implement cursor persistence, retry with provider-aware backoff, reconciliation, revocation, and least-privilege scopes.

Current official implementation references:

- Gong: [create an app](https://help.gong.io/docs/create-an-app-for-gong), [API introduction and rate limits](https://help.gong.io/apidocs/introduction-2), and [API access](https://help.gong.io/docs/receive-access-to-the-api)
- Microsoft Teams: [change notifications for call transcripts](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript)
- Zoom: [OAuth integrations](https://developers.zoom.us/docs/integrations/), [end-user authorization](https://developers.zoom.us/docs/integrations/end-user-auth/), [meeting APIs](https://developers.zoom.us/docs/api/meetings/), and [webhook verification](https://developers.zoom.us/changelog/platform/verification-changes-webhook/)
- Salesforce: [OAuth 2.0 web-server flow](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_web_server_flow_ca.htm&language=en_US&type=5)

Provider documentation and marketplace requirements change. Re-verify official guidance before implementing or releasing each adapter.

## Normalized transcript event example

```json
{
  "eventId": "provider-event-123",
  "eventType": "transcript.ready",
  "call": {
    "externalCallId": "provider-call-456",
    "title": "Discovery call",
    "accountName": "Example account",
    "durationSeconds": 1800,
    "consentStatus": "confirmed",
    "transcript": "Seller: ...\nBuyer: ..."
  }
}
```

Unknown consent must be mapped to `quarantined`, not guessed. Quarantined calls persist the normalized source record for an authorized reviewer but do not create assets or graph intelligence.

## Go-live checklist per connector

- Provider app approved and correct redirect URLs registered
- Client credentials present in the server secret store
- Customer admin authorization completed and revocable
- Least-privilege scopes reviewed by Security
- Webhook signature verification tested with replay and tamper cases
- Historical backfill cursor and rate-limit behavior tested
- Consent metadata mapping approved by customer Legal/Privacy
- Revocation and token-rotation runbook exercised
- Local deletion cascade tested
- Source-system retention responsibility stated in the DPA and customer runbook
- Tenant-isolation tests run against two authorized organizations
