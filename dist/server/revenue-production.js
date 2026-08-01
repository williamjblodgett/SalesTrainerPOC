export const productionSchemaStatements = [
  "CREATE TABLE IF NOT EXISTS connector_events (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, provider TEXT NOT NULL, external_event_id TEXT NOT NULL, event_type TEXT NOT NULL, payload_hash TEXT NOT NULL, status TEXT NOT NULL, call_id TEXT, received_at TEXT NOT NULL, processed_at TEXT, error_code TEXT)",
  "CREATE TABLE IF NOT EXISTS ingestion_jobs (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, provider TEXT NOT NULL, source_event_id TEXT, operation TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL, cursor TEXT, result_json TEXT NOT NULL, next_attempt_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS graph_entities (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, entity_type TEXT NOT NULL, canonical_label TEXT NOT NULL, normalized_label TEXT NOT NULL, evidence_count INTEGER NOT NULL, call_count INTEGER NOT NULL, avg_confidence REAL NOT NULL, status TEXT NOT NULL, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS graph_entity_evidence (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, entity_id TEXT NOT NULL, node_id TEXT NOT NULL, call_id TEXT NOT NULL, confidence REAL NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS graph_merge_candidates (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, canonical_entity_id TEXT NOT NULL, candidate_entity_id TEXT NOT NULL, similarity REAL NOT NULL, status TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS computed_intelligence_signals (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, data_scope TEXT NOT NULL, signal_key TEXT NOT NULL, signal_type TEXT NOT NULL, severity TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, owner_department TEXT NOT NULL, status TEXT NOT NULL, evidence_count INTEGER NOT NULL, confidence REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS computed_signal_evidence (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, signal_id TEXT NOT NULL, entity_id TEXT, call_id TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS demo_runs (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, call_id TEXT NOT NULL, template_key TEXT NOT NULL, label TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS deletion_tasks (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, request_id TEXT NOT NULL, system_name TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL, last_error TEXT, completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS rate_limit_buckets (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, actor TEXT NOT NULL, operation TEXT NOT NULL, window_start TEXT NOT NULL, request_count INTEGER NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS connector_events_external_idx ON connector_events(organization_id, provider, external_event_id)",
  "CREATE INDEX IF NOT EXISTS connector_events_status_idx ON connector_events(organization_id, status, received_at)",
  "CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON ingestion_jobs(organization_id, status, next_attempt_at)",
  "CREATE UNIQUE INDEX IF NOT EXISTS graph_entities_key_idx ON graph_entities(organization_id, entity_type, normalized_label)",
  "CREATE UNIQUE INDEX IF NOT EXISTS graph_entity_evidence_node_idx ON graph_entity_evidence(organization_id, node_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS graph_merge_pair_idx ON graph_merge_candidates(organization_id, canonical_entity_id, candidate_entity_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS computed_signal_key_idx ON computed_intelligence_signals(organization_id, data_scope, signal_key)",
  "CREATE INDEX IF NOT EXISTS computed_signal_status_idx ON computed_intelligence_signals(organization_id, data_scope, status, updated_at)",
  "CREATE UNIQUE INDEX IF NOT EXISTS demo_runs_call_idx ON demo_runs(organization_id, call_id)",
  "CREATE INDEX IF NOT EXISTS deletion_tasks_request_idx ON deletion_tasks(organization_id, request_id, status)",
  "CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_bucket_idx ON rate_limit_buckets(organization_id, actor, operation, window_start)",
];

export const demoTemplates = [
  {
    key: "forecast_confidence",
    name: "Forecast confidence discovery",
    accountName: "Northstar Systems (Synthetic)",
    buyerName: "Jordan Lee",
    buyerTitle: "VP Sales Operations",
    difficulty: "medium",
    pain: "Forecast reconciliation",
    impact: "Leadership distrust",
    objection: "CRM already reports",
    risk: "Administrative burden",
    nextStep: "Systems workflow review",
    color: "cyan",
  },
  {
    key: "security_review",
    name: "Enterprise security validation",
    accountName: "Atlas Health (Synthetic)",
    buyerName: "Priya Nair",
    buyerTitle: "Chief Information Security Officer",
    difficulty: "hard",
    pain: "Security review delays",
    impact: "Strategic deals stall in procurement",
    objection: "Data retention is too risky",
    risk: "Unclear deletion guarantees",
    nextStep: "Legal and security architecture review",
    color: "violet",
  },
  {
    key: "manager_adoption",
    name: "Manager adoption diagnostic",
    accountName: "Harbor Cloud (Synthetic)",
    buyerName: "Miguel Santos",
    buyerTitle: "SVP Customer Success",
    difficulty: "medium",
    pain: "Inconsistent manager coaching",
    impact: "New hires ramp slowly",
    objection: "Managers will not use another tool",
    risk: "Workflow adoption",
    nextStep: "Manager workflow pilot",
    color: "green",
  },
  {
    key: "budget_scrutiny",
    name: "Executive value conversation",
    accountName: "Everline Software (Synthetic)",
    buyerName: "Erin Walsh",
    buyerTitle: "Chief Financial Officer",
    difficulty: "expert",
    pain: "Unclear enablement return",
    impact: "Operating spend lacks executive confidence",
    objection: "The budget is frozen",
    risk: "Unproven commercial impact",
    nextStep: "Value hypothesis workshop",
    color: "amber",
  },
];

const supportedEventTypes = new Set(["call.completed", "transcript.ready", "call.deleted"]);
const supportedProviders = new Set(["gong", "chorus", "zoom", "teams", "salesforce"]);

export function normalizeEntityLabel(label) {
  return String(label || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|our|their|current)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function entitySimilarity(left, right) {
  const a = new Set(normalizeEntityLabel(left).split(" ").filter(Boolean));
  const b = new Set(normalizeEntityLabel(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return Math.round((intersection / union) * 100) / 100;
}

export function validateNormalizedConnectorEvent(input, provider) {
  if (!supportedProviders.has(provider)) return { ok: false, code: "provider_not_supported" };
  const eventId = String(input?.eventId || "").trim().slice(0, 160);
  const eventType = String(input?.eventType || "").trim();
  if (!eventId || !supportedEventTypes.has(eventType)) return { ok: false, code: "validation_failed" };
  const externalCallId = String(input?.call?.externalCallId || "").trim().slice(0, 160);
  if (!externalCallId) return { ok: false, code: "external_call_id_required" };
  if (eventType === "call.deleted") return { ok: true, eventId, eventType, externalCallId };
  const transcript = String(input?.call?.transcript || "").trim();
  const consentStatus = String(input?.call?.consentStatus || "").toLowerCase();
  if (transcript.length < 40 || transcript.length > 200000) return { ok: false, code: "transcript_invalid" };
  if (!new Set(["confirmed", "quarantined"]).has(consentStatus)) return { ok: false, code: "consent_invalid" };
  return {
    ok: true,
    eventId,
    eventType,
    externalCallId,
    call: {
      title: String(input.call.title || "Customer conversation").trim().slice(0, 120),
      accountName: String(input.call.accountName || "Unknown account").trim().slice(0, 120),
      durationSeconds: Math.max(0, Math.min(28800, Number(input.call.durationSeconds || 0))),
      consentStatus,
      transcript,
    },
  };
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value))));
}

export async function signConnectorPayload(secret, timestamp, body) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
}

export async function verifyConnectorSignature({ secret, timestamp, signature, body, now = Date.now() }) {
  if (!secret || !timestamp || !signature) return false;
  const eventTime = Number(timestamp) * (String(timestamp).length <= 10 ? 1000 : 1);
  if (!Number.isFinite(eventTime) || Math.abs(now - eventTime) > 5 * 60 * 1000) return false;
  const expected = await signConnectorPayload(secret, timestamp, body);
  const supplied = String(signature).replace(/^sha256=/, "").toLowerCase();
  if (expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  return mismatch === 0;
}

function safeHint(value, fallback) {
  const clean = String(value || "").replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  return clean || fallback;
}

export function buildSyntheticTranscript(input = {}) {
  const template = demoTemplates.find((item) => item.key === input.templateKey) || demoTemplates[0];
  const quality = new Set(["strong", "mixed", "weak"]).has(input.sellerQuality) ? input.sellerQuality : "mixed";
  const account = safeHint(input.accountName, template.accountName);
  const buyer = safeHint(input.buyerName, template.buyerName);
  const role = safeHint(input.buyerTitle, template.buyerTitle);
  const opening = quality === "weak"
    ? "Seller: Thanks for taking the call. We replace manual systems with an AI platform that fixes the whole process."
    : "Seller: Thanks for the time. I would like to understand the current workflow, where it breaks down, and decide together whether a deeper session is worthwhile.";
  const discovery = quality === "strong"
    ? `Seller: Walk me through the current process and where ${template.pain.toLowerCase()} first becomes visible.\nBuyer: The team sees ${template.pain.toLowerCase()} every week.\nSeller: What does that change for the business and for you personally?\nBuyer: ${template.impact}. I am accountable when that happens.`
    : quality === "mixed"
      ? `Seller: How does the process work today?\nBuyer: We are dealing with ${template.pain.toLowerCase()}, although the team has workarounds.\nSeller: Is that frustrating?\nBuyer: It creates extra work, but I would rather focus on the business consequence.`
      : `Buyer: Before we start, I have ten minutes.\nSeller: Great, let me show you why our technology is different.\nBuyer: You have not asked how we work today.`;
  const objection = `Buyer: ${template.objection}. My concern is ${template.risk.toLowerCase()}.`;
  const close = quality === "strong"
    ? `Seller: I hear that the issue is not simply tooling; it is ${template.risk.toLowerCase()}. Would a ${template.nextStep.toLowerCase()} with the right stakeholders be a reasonable next step?\nBuyer: Yes. Send a short agenda and I will include the appropriate owner.`
    : quality === "mixed"
      ? `Seller: We can follow up with more information.\nBuyer: Send it over. I have not decided who else should be involved.`
      : `Seller: If I send pricing today, can we move forward?\nBuyer: No. This is not relevant enough to continue.`;
  return {
    transcript: `SYNTHETIC DEMONSTRATION TRANSCRIPT — no real customer data.\nAccount: ${account}\nBuyer: ${buyer}, ${role}\n${opening}\n${discovery}\n${objection}\n${close}`,
    hints: {
      persona: role,
      pain: template.pain,
      impact: template.impact,
      objection: template.objection,
      risk: template.risk,
      nextStep: template.nextStep,
    },
    template,
    quality,
    accountName: account,
    buyerName: buyer,
    buyerTitle: role,
  };
}

export function extractDeterministicNodes(callId, transcript, hints = {}) {
  const lower = String(transcript || "").toLowerCase();
  const detect = (provided, matches, fallback) => safeHint(provided || matches.find(([needle]) => lower.includes(needle))?.[1], fallback);
  const values = {
    persona: detect(hints.persona, [["security officer", "Chief Information Security Officer"], ["financial officer", "Chief Financial Officer"], ["customer success", "SVP Customer Success"]], "VP Sales Operations"),
    pain: detect(hints.pain, [["security review", "Security review delays"], ["manager coaching", "Inconsistent manager coaching"], ["enablement return", "Unclear enablement return"]], "Forecast reconciliation"),
    impact: detect(hints.impact, [["deals stall", "Strategic deals stall in procurement"], ["ramp slowly", "New hires ramp slowly"], ["executive confidence", "Operating spend lacks executive confidence"]], "Leadership distrust"),
    objection: detect(hints.objection, [["retention", "Data retention is too risky"], ["another tool", "Managers will not use another tool"], ["budget is frozen", "The budget is frozen"]], "CRM already reports"),
    risk: detect(hints.risk, [["deletion", "Unclear deletion guarantees"], ["workflow adoption", "Workflow adoption"], ["commercial impact", "Unproven commercial impact"]], "Administrative burden"),
    nextStep: detect(hints.nextStep, [["legal and security", "Legal and security architecture review"], ["manager workflow", "Manager workflow pilot"], ["value hypothesis", "Value hypothesis workshop"]], "Systems workflow review"),
  };
  const evidence = String(transcript || "").replace(/\s+/g, " ").slice(0, 220);
  return [
    ["persona", values.persona, .94], ["pain", values.pain, .92], ["impact", values.impact, .88],
    ["objection", values.objection, .91], ["risk", values.risk, .89], ["next_step", values.nextStep, .81],
  ].map(([type, label, confidence]) => ({ id: crypto.randomUUID(), callId, type, label, confidence, evidence }));
}

export function buildAssetDescriptor(type, call, nodes) {
  const byType = Object.fromEntries(nodes.map((node) => [node.type, node.label]));
  const persona = byType.persona || "buyer"; const pain = byType.pain || "customer pain"; const objection = byType.objection || "buyer objection";
  const titles = {
    customer_persona: `${persona} customer persona`, digital_twin: `${persona} digital twin`, roleplay: `${pain} discovery roleplay`,
    playbook: `${pain} playbook update`, talk_track: `${pain} talk track`, battle_card: `${objection} battle card`,
    follow_up: `${call.account_name} follow-up email`, manager_coaching: `${pain} coaching brief`, rep_scorecard: "Evidence-based rep scorecard",
    objection_library: `${objection} objection entry`, pain_map: `${pain} pain map`, voice_of_customer: `${pain} voice-of-customer brief`,
    message_angle: `${pain} campaign angle`, content_brief: `${objection} content brief`, product_signal: `${byType.risk || pain} product signal`,
    feature_request: `${byType.risk || pain} feature context`, success_plan: `${byType.impact || pain} success plan`, risk_alert: `${byType.risk || objection} risk alert`,
    executive_brief: `${call.account_name} executive brief`, knowledge_update: `${call.account_name} graph update`,
  };
  return {
    title: titles[type] || "Revenue intelligence asset",
    summary: `${persona}: ${pain}. Evidence connects ${byType.impact || "business impact"} to ${objection}.`,
  };
}

export async function syncGraphEntities(env, organizationId, nodes, now = new Date().toISOString()) {
  let linked = 0; let candidates = 0;
  for (const node of nodes) {
    const priorEvidence = await env.DB.prepare("SELECT id FROM graph_entity_evidence WHERE organization_id = ? AND node_id = ?").bind(organizationId, node.id).first();
    if (priorEvidence) continue;
    const normalized = normalizeEntityLabel(node.label);
    let entity = await env.DB.prepare("SELECT * FROM graph_entities WHERE organization_id = ? AND entity_type = ? AND normalized_label = ?").bind(organizationId, node.type, normalized).first();
    if (!entity) {
      const id = crypto.randomUUID();
      await env.DB.prepare("INSERT INTO graph_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, organizationId, node.type, node.label, normalized, 0, 0, 0, "active", now, now, now, now).run();
      entity = { id, evidence_count: 0, avg_confidence: 0 };
      const peers = await env.DB.prepare("SELECT id, canonical_label FROM graph_entities WHERE organization_id = ? AND entity_type = ? AND id != ? LIMIT 50").bind(organizationId, node.type, id).all();
      for (const peer of peers.results) {
        const similarity = entitySimilarity(node.label, peer.canonical_label);
        if (similarity >= .45 && similarity < 1) {
          const ordered = [peer.id, id].sort();
          await env.DB.prepare("INSERT OR IGNORE INTO graph_merge_candidates VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), organizationId, ordered[0], ordered[1], similarity, "review_required", null, null, now).run();
          candidates += 1;
        }
      }
    }
    const count = Number(entity.evidence_count || 0); const average = Number(entity.avg_confidence || 0); const nextAverage = ((average * count) + Number(node.confidence)) / (count + 1);
    await env.DB.batch([
      env.DB.prepare("UPDATE graph_entities SET evidence_count = evidence_count + 1, call_count = call_count + 1, avg_confidence = ?, last_seen_at = ?, updated_at = ? WHERE organization_id = ? AND id = ?").bind(nextAverage, now, now, organizationId, entity.id),
      env.DB.prepare("INSERT INTO graph_entity_evidence VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), organizationId, entity.id, node.id, node.callId, node.confidence, now),
    ]);
    linked += 1;
  }
  return { linked, candidates };
}

export async function rebuildGraphEntities(env, organizationId) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM graph_merge_candidates WHERE organization_id = ?").bind(organizationId),
    env.DB.prepare("DELETE FROM graph_entity_evidence WHERE organization_id = ?").bind(organizationId),
    env.DB.prepare("DELETE FROM graph_entities WHERE organization_id = ?").bind(organizationId),
  ]);
  const rows = await env.DB.prepare("SELECT n.id, n.call_id, n.node_type, n.label, n.confidence, n.evidence FROM knowledge_nodes n WHERE n.organization_id = ? AND NOT EXISTS (SELECT 1 FROM demo_runs d WHERE d.organization_id = n.organization_id AND d.call_id = n.call_id) ORDER BY n.created_at").bind(organizationId).all();
  const nodes = rows.results.map((row) => ({ id: row.id, callId: row.call_id, type: row.node_type, label: row.label, confidence: row.confidence, evidence: row.evidence }));
  return syncGraphEntities(env, organizationId, nodes);
}

function scopeClause(scope, alias = "n") {
  return scope === "demo"
    ? `EXISTS (SELECT 1 FROM demo_runs d WHERE d.organization_id = ${alias}.organization_id AND d.call_id = ${alias}.call_id)`
    : `NOT EXISTS (SELECT 1 FROM demo_runs d WHERE d.organization_id = ${alias}.organization_id AND d.call_id = ${alias}.call_id)`;
}

export async function recomputeIntelligenceSignals(env, organizationId, scope = "live", minimumEvidence = 3) {
  const threshold = Math.max(2, Math.min(20, Number(minimumEvidence || 3)));
  const rows = await env.DB.prepare(`SELECT node_type, label, COUNT(DISTINCT call_id) evidence_count, AVG(confidence) confidence FROM knowledge_nodes n WHERE organization_id = ? AND ${scopeClause(scope)} GROUP BY node_type, lower(label) HAVING COUNT(DISTINCT call_id) >= ?`).bind(organizationId, threshold).all();
  const now = new Date().toISOString(); const activeKeys = [];
  await env.DB.prepare("UPDATE computed_intelligence_signals SET status = 'closed', updated_at = ? WHERE organization_id = ? AND data_scope = ?").bind(now, organizationId, scope).run();
  for (const row of rows.results) {
    if (!new Set(["objection", "pain", "risk"]).has(row.node_type)) continue;
    const normalized = normalizeEntityLabel(row.label); const signalKey = `${row.node_type}:${normalized}`; activeKeys.push(signalKey);
    const evidenceCount = Number(row.evidence_count); const confidence = Number(row.confidence); const high = evidenceCount >= threshold + 2;
    let signalType; let title; let description; let owner;
    if (row.node_type === "objection") {
      const coverage = await env.DB.prepare(`SELECT COUNT(*) count FROM revenue_assets a WHERE a.organization_id = ? AND a.status = 'approved' AND a.asset_type IN ('battle_card','objection_library') AND lower(a.content_json) LIKE ? AND ${scope === "demo" ? "EXISTS" : "NOT EXISTS"} (SELECT 1 FROM demo_runs d WHERE d.organization_id = a.organization_id AND d.call_id = a.call_id)`).bind(organizationId, `%${String(row.label).toLowerCase()}%`).first();
      signalType = Number(coverage?.count || 0) ? "knowledge_drift" : "content_gap";
      title = signalType === "content_gap" ? `No approved response for: ${row.label}` : `Approved guidance needs review: ${row.label}`;
      description = `${evidenceCount} distinct calls contain this objection at ${Math.round(confidence * 100)}% average extraction confidence.`;
      owner = signalType === "content_gap" ? "Marketing" : "Enablement";
    } else {
      signalType = "product_signal"; title = `${row.label} is repeating across customer calls`;
      description = `${evidenceCount} distinct calls support this ${row.node_type} pattern at ${Math.round(confidence * 100)}% confidence.`; owner = "Product";
    }
    const existing = await env.DB.prepare("SELECT id, created_at FROM computed_intelligence_signals WHERE organization_id = ? AND data_scope = ? AND signal_key = ?").bind(organizationId, scope, signalKey).first();
    const id = existing?.id || crypto.randomUUID();
    await env.DB.prepare("INSERT INTO computed_intelligence_signals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(organization_id, data_scope, signal_key) DO UPDATE SET signal_type = excluded.signal_type, severity = excluded.severity, title = excluded.title, description = excluded.description, owner_department = excluded.owner_department, status = 'open', evidence_count = excluded.evidence_count, confidence = excluded.confidence, updated_at = excluded.updated_at").bind(id, organizationId, scope, signalKey, signalType, high ? "high" : "medium", title, description, owner, "open", evidenceCount, confidence, existing?.created_at || now, now).run();
    await env.DB.prepare("DELETE FROM computed_signal_evidence WHERE organization_id = ? AND signal_id = ?").bind(organizationId, id).run();
    const evidence = await env.DB.prepare(`SELECT n.call_id FROM knowledge_nodes n WHERE n.organization_id = ? AND n.node_type = ? AND lower(n.label) = lower(?) AND ${scopeClause(scope)} GROUP BY n.call_id LIMIT 20`).bind(organizationId, row.node_type, row.label).all();
    if (evidence.results.length) await env.DB.batch(evidence.results.map((item) => env.DB.prepare("INSERT INTO computed_signal_evidence VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), organizationId, id, null, item.call_id, now)));
  }
  return { scope, threshold, activeSignalCount: activeKeys.length, evaluatedPatterns: rows.results.length };
}

export async function checkRateLimit(env, organizationId, actor, operation, limit = 30, now = new Date()) {
  const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();
  const id = `${organizationId}:${actor}:${operation}:${windowStart}`;
  await env.DB.prepare("INSERT INTO rate_limit_buckets VALUES (?, ?, ?, ?, ?, 1, ?) ON CONFLICT(organization_id, actor, operation, window_start) DO UPDATE SET request_count = request_count + 1, updated_at = excluded.updated_at").bind(id, organizationId, actor, operation, windowStart, now.toISOString()).run();
  const bucket = await env.DB.prepare("SELECT request_count FROM rate_limit_buckets WHERE organization_id = ? AND actor = ? AND operation = ? AND window_start = ?").bind(organizationId, actor, operation, windowStart).first();
  return { allowed: Number(bucket?.request_count || 0) <= limit, remaining: Math.max(0, limit - Number(bucket?.request_count || 0)), resetAt: new Date(new Date(windowStart).getTime() + 60000).toISOString() };
}

export async function cascadeDeleteCall(env, organizationId, callId) {
  const call = await env.DB.prepare("SELECT id, provider FROM revenue_calls WHERE organization_id = ? AND id = ?").bind(organizationId, callId).first();
  if (!call) return { deleted: false, code: "not_found" };
  await env.DB.batch([
    env.DB.prepare("DELETE FROM asset_reviews WHERE organization_id = ? AND asset_id IN (SELECT id FROM revenue_assets WHERE organization_id = ? AND call_id = ?)").bind(organizationId, organizationId, callId),
    env.DB.prepare("DELETE FROM revenue_assets WHERE organization_id = ? AND call_id = ?").bind(organizationId, callId),
    env.DB.prepare("DELETE FROM knowledge_edges WHERE organization_id = ? AND call_id = ?").bind(organizationId, callId),
    env.DB.prepare("DELETE FROM graph_entity_evidence WHERE organization_id = ? AND call_id = ?").bind(organizationId, callId),
    env.DB.prepare("DELETE FROM knowledge_nodes WHERE organization_id = ? AND call_id = ?").bind(organizationId, callId),
    env.DB.prepare("DELETE FROM demo_runs WHERE organization_id = ? AND call_id = ?").bind(organizationId, callId),
    env.DB.prepare("UPDATE connector_events SET call_id = NULL, status = 'source_deleted', processed_at = ? WHERE organization_id = ? AND call_id = ?").bind(new Date().toISOString(), organizationId, callId),
    env.DB.prepare("DELETE FROM revenue_calls WHERE organization_id = ? AND id = ?").bind(organizationId, callId),
  ]);
  await rebuildGraphEntities(env, organizationId);
  await Promise.all([recomputeIntelligenceSignals(env, organizationId, "live", 3), recomputeIntelligenceSignals(env, organizationId, "demo", 2)]);
  return { deleted: true, provider: call.provider, providerReconciliationRequired: !new Set(["upload", "demo"]).has(call.provider) };
}

export async function resetDemoData(env, organizationId) {
  const runs = await env.DB.prepare("SELECT call_id FROM demo_runs WHERE organization_id = ?").bind(organizationId).all();
  for (const run of runs.results) await cascadeDeleteCall(env, organizationId, run.call_id);
  await env.DB.prepare("DELETE FROM computed_intelligence_signals WHERE organization_id = ? AND data_scope = 'demo'").bind(organizationId).run();
  return { deletedRuns: runs.results.length };
}
