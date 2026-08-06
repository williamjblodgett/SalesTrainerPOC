# Incident response runbook

Status: operational draft. Assign named owners and validate the contacts before processing customer data.

## Severity

- SEV-1: confirmed cross-tenant exposure, credential compromise, destructive data loss, or active unauthorized access.
- SEV-2: material service degradation, failed deletion, scanner bypass, or sustained provider outage.
- SEV-3: contained defect without confirmed customer-data exposure.

## Response

1. Record the detection time, reporter, environment, and a content-free incident identifier.
2. Contain access, rotate affected credentials, disable compromised integrations, and preserve audit metadata.
3. Determine organizations, data classes, regions, and subprocessors involved without copying transcripts into the incident channel.
4. Notify the designated security, privacy, legal, executive, and customer-communications owners.
5. Apply contractual and jurisdictional notification timelines after counsel confirms applicability.
6. Restore from a verified recovery point, validate tenant isolation, and monitor for recurrence.
7. Publish a blameless post-incident review with corrective owners and due dates.

## Required launch evidence

- Named on-call and executive decision owners
- Tested alert route and escalation tree
- Credential-rotation exercise
- Backup restore and deletion-expiry exercise
- Customer and regulator notification templates approved by counsel
