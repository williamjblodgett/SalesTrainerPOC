# Persona QA report

## Automated coverage

The deterministic QA suite exercises the persona contract across all seven launch industries:

- Schema-valid persona creation for 7/7 industry packs.
- Stable speaker and turn normalization.
- Exact source, turn, and excerpt verification.
- Rejection of invented or mismatched evidence.
- Rejection of duplicate transcript source IDs.
- Rejection of seller-only and materially insufficient evidence.
- Prompt-injection turn quarantine.
- Cross-transcript budget-conflict detection.
- Evidence coverage bounds.
- Explicit consent or synthetic-data attestation.
- Human-review status before approval and publication.

The suite runs without customer data or an OpenAI key. Live-model persona evaluations should remain behind an explicit environment flag and compare results with manager-labeled fixtures.

## Findings and improvements applied

1. **Critical — seller-only transcripts could create a persona.** The engine now requires at least two usable buyer turns and returns a validation error instead of inventing buyer behavior.
2. **Critical — prompt-injection text could become persona evidence in mock mode.** Suspect instructions are quarantined and excluded from evidence and synthesis.
3. **High — duplicate source IDs could corrupt evidence lineage.** Boundary validation now rejects duplicate IDs.
4. **High — transcript consent was asserted by the browser.** Managers must attest processing authority or synthetic status, and the API enforces the attestation.
5. **High — the upload UI advertised unsupported formats.** It now accurately accepts TXT only until secure server parsing is implemented.
6. **Medium — managers had no evidence-quality preview.** The UI now displays usable buyer turns, total turns, quarantined instructions, and blocking evidence issues before generation.
7. **Medium — evidence matching was whitespace-fragile.** Citation comparison now normalizes whitespace while requiring an exact source-turn match.

## Remaining product risks

### Launch blockers

- Persist transcript sources, normalized segments, consent evidence, persona claims, and source links in one database transaction. The current API persists the persona draft but does not yet materialize the complete lineage tables.
- Add secure DOCX/PDF parsing, MIME verification, malware scanning, file-size enforcement on the server, and signed storage access.
- Add PII detection and redaction before provider calls, then prove deletion cascades remove derived claims.
- Run organization-isolation integration tests against a hosted Supabase database.

### High-value improvements

- Support multi-transcript collections with per-source status, removal, deduplication, and minimum-evidence guidance.
- Add evidence references to every persona field, not only the general `evidenceClaims` collection, so unsupported generated fields cannot be published.
- Expand conflict detection beyond budget to title, priorities, timing, stakeholders, pains, terminology, and buying process.
- Replace generic mock identity and stakeholder labels with manager-reviewed fields or clearly marked unknown values.
- Add a version comparison showing evidence added, removed, contradicted, or stale.
- Build human-labeled calibration sets for every industry and measure claim precision, citation accuracy, conflict recall, and manager edit distance.

### UX improvements

- Show transcript-level progress for parse, redact, extract, cluster, review, and publish.
- Let managers accept or reject individual claims before approving the persona.
- Explain why confidence changed and distinguish source diversity from claim confidence.
- Replace static persona cards with persisted drafts, approval state, evidence coverage, and last-reviewed dates.
- Add screen-reader announcements for extraction progress and publication success.
