# Data retention schedule

Status: product default proposal pending contractual and legal approval.

| Data class | Proposed default | Deletion behavior |
| --- | --- | --- |
| Raw voice audio | Not stored | Discard after live processing |
| Uploaded originals | Customer-selected | Delete object and derived lineage |
| Normalized transcripts | Until customer deletion or contract schedule | Delete transcript and dependent intelligence |
| Practice turns and evaluations | Contract schedule | Delete session lineage while retaining content-free audit metadata |
| Usage and security audit metadata | 12 months | Expire by policy unless legal hold applies |
| Backups | 35 days | Expire through backup lifecycle; report final expiry |

Production must support organization-specific overrides, legal holds, verified export, deletion completion records, and provider-side source confirmation.
