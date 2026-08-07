# Persona QA report

## Release result

The persona workflow now supports governed multi-transcript synthesis across all seven launch industries. The deterministic suite verifies 58 application contracts, including citation accuracy, field-level lineage, PII redaction, source diversity, conflict recall, unknown-field behavior, prompt-injection quarantine, consent attestation, and authorization contracts.

## Implemented safeguards

- TXT, DOCX, and PDF parsing occurs server-side with a 20 MB limit, extension/signature agreement, text-volume limits, and active-document marker quarantine.
- Email, phone, SSN, payment-card-like values, and credential-like tokens are redacted before an AI provider receives transcript text.
- Transcript sources, normalized turns, consent evidence, PII findings, persona drafts, source links, and usage metadata persist through one PostgreSQL function transaction.
- Each persona field is marked observed, inferred, or unknown. Observed fields must reference valid evidence claim IDs, and every evidence excerpt must match a stable source turn.
- Managers accept or reject every claim before approval. Published persona versions are immutable and can be compared side by side.
- Mock mode no longer invents buyer titles, KPIs, stakeholders, approval processes, or alternatives.
- Conflict detection covers budget, timeline, priority, and current-solution state.
- Transcript deletion cascades through normalized turns and source links. Persona drafts with no surviving source return to review.
- The public demo performs multi-source analysis locally with synthetic data. The private hosted app persists claim reviews and persona versions in organization-scoped storage.

## Calibration metrics

The launch calibration set covers financial services, B2B SaaS, healthcare and medical devices, cybersecurity, industrial and manufacturing, automotive retail, and residential real estate. Automated acceptance requires:

- 100% citation validity against supplied source turns.
- 100% required field-lineage coverage.
- 100% observed-field citation presence.
- Complete source diversity in the two-call calibration fixture.
- No invented buyer title or stakeholder list when those facts are absent.

Provider-backed model runs remain opt-in because model credentials and customer data are not required for normal CI.

## Remaining external launch gates

- Keep the hosted RLS suite in the release gate and expand it with every new tenant-owned table. All five migrations and 22/22 pgTAP checks passed on 2026-08-06.
- The canonical app now has a fail-closed Cloudmersive Advanced scanner adapter that blocks malware, invalid files, scripts, macros, password-protected files, unsafe archives, and mismatched formats. A real provider key and clean/quarantine production smoke test are still required; the built-in scanner remains development-only.
- Complete legal review of consent language, DPA, privacy notice, retention defaults, data residency, and subprocessors.
- Run `pnpm calibrate:openai` on the human-labeled, licensed transcript corpus. The committed gate requires two reviewers, 50 evaluator transcripts, 10 buyer paths, 10 persona cases, evidence fidelity, bounded score error, and zero forbidden-disclosure tolerance before voice can be enabled.
- Finish provider OAuth, asynchronous backfills, observability, incident response, SSO/SCIM, and production voice metering before enterprise GA.
