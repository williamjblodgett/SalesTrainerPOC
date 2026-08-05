const BASE = new URL("./", import.meta.url);
const packs = await fetch(new URL("data/industry-packs.json", BASE)).then((response) => {
  if (!response.ok) throw new Error("Industry library could not be loaded.");
  return response.json();
});

const defaultTranscript = `SYNTHETIC DEMONSTRATION TRANSCRIPT — no real customer data
Seller: Jordan, thanks for the time. We have ten minutes. Would it be useful to understand how your team produces the weekly forecast and decide whether a deeper workflow review makes sense?
Buyer: That works. We already report through our CRM, so I am skeptical that we need something else.
Seller: Understood. How does the forecast get assembled after the regional managers update the CRM?
Buyer: The regions still send spreadsheets in different formats. My operations team reconciles them before the leadership meeting.
Seller: What happens when those formats arrive late or the numbers do not align?
Buyer: Leadership questions the weekly forecast, and we burn most of Monday reconciling reports. I am frustrated, but a new tool cannot add more administration.
Seller: It sounds like consistency and trust matter more than replacing the CRM. Could we map where duplicate work occurs with your operations lead next week?
Buyer: Yes. Bring a simple integration view and include Maya from operations.`;

const initialState = {
  industryId: "b2b-saas",
  scenarioId: "operations-discovery",
  transcript: defaultTranscript,
  transcriptSources: [{ id: "synthetic-1", title: "Northstar discovery", content: defaultTranscript, status: "ready" }],
  persona: null,
  claimReviews: {},
  personaHistory: [],
  turns: [],
  score: null,
  startedAt: null,
};

const stored = JSON.parse(localStorage.getItem("suadence-demo") || "null");
const state = { ...initialState, ...(stored && typeof stored === "object" ? stored : {}) };
if (state.persona && !Array.isArray(state.persona.claims)) {
  state.persona = null;
  state.claimReviews = {};
  state.personaHistory = [];
}
const save = () => localStorage.setItem("suadence-demo", JSON.stringify(state));
const routeNames = ["dashboard", "transcripts", "personas", "industries", "scenarios", "practice", "results", "coaching", "analytics", "settings"];
const route = () => {
  const value = location.hash.replace(/^#\/?/, "").split("?")[0];
  return routeNames.includes(value) ? value : "dashboard";
};
const currentPack = () => packs.find((pack) => pack.id === state.industryId) || packs[0];
const currentScenario = () => currentPack().scenarios.find((item) => item.id === state.scenarioId) || currentPack().scenarios[0];
const clean = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const difficultyClass = (difficulty) => difficulty === "expert" || difficulty === "hard" ? "orange" : "green";
const toast = (message) => {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3200);
};

const nav = [
  ["OPERATE", [["dashboard", "Command center", "⌂"], ["transcripts", "Transcript lab", "≡"], ["analytics", "Revenue intelligence", "↗"]]],
  ["BUILD", [["personas", "AI personas", "◎"], ["industries", "Industry library", "▦"], ["scenarios", "Scenario studio", "◇"]]],
  ["ENABLE", [["practice", "Practice room", "▶"], ["results", "Evidence scorecard", "✓"], ["coaching", "Coaching advisor", "★"]]],
  ["GOVERN", [["settings", "Security & settings", "⚙"]]],
];

function frame(content) {
  const active = route();
  return `<div class="shell">
    <aside class="rail">
      <a class="brand" href="#/dashboard"><img src="./brand/suadence-logo.webp" alt="Suadence"></a>
      <div class="workspace"><small>DEMO WORKSPACE</small><b>Northstar Revenue Team</b><span>Synthetic data only · manager</span></div>
      <nav class="nav" aria-label="Demo application">${nav.map(([label, links]) => `<div><p class="nav-label">${label}</p>${links.map(([id, title, icon]) => `<a href="#/${id}" class="${active === id ? "active" : ""}"><span class="nav-icon">${icon}</span>${title}</a>`).join("")}</div>`).join("")}</nav>
      <a class="secure-link" href="https://github.com/williamjblodgett/SalesTrainerPOC" target="_blank" rel="noreferrer"><b>SECURE PRODUCT WORKSPACE</b>Real customer transcripts, authentication, and AI remain server-side. View the source and deployment status →</a>
    </aside>
    <section class="surface">
      <header class="topbar"><div class="synthetic"><button class="button-quiet mobile-menu" data-action="menu" aria-label="Open navigation">Menu</button><i></i><b>Interactive public demo</b><span>· no customer data leaves this browser</span></div><div class="top-actions"><button class="button-quiet" data-action="reset">Reset demo</button><a class="button" href="#/practice">Start practice →</a></div></header>
      <main class="main">${content}</main>
    </section>
  </div>`;
}

const pageHead = (eyebrow, title, copy, actions = "") => `<header class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${copy}</p></div>${actions ? `<div class="actions">${actions}</div>` : ""}</header>`;

function dashboard() {
  return frame(`${pageHead("Revenue command center", "Make every conversation compound.", "This synthetic workspace demonstrates how one call becomes buyer intelligence, practice, coaching, and executive action.", '<a class="button-quiet" href="#/transcripts">Process a transcript</a><a class="button" href="#/practice">Run a simulation</a>')}
    <section class="metric-grid">
      <article class="card metric"><span>Revenue DNA</span><strong>87</strong><small>+6 this cycle</small></article>
      <article class="card metric"><span>Evidence coverage</span><strong>92%</strong><small>18 supported claims</small></article>
      <article class="card metric"><span>Practice completion</span><strong>84%</strong><small>42 sessions this month</small></article>
      <article class="card metric"><span>Industry simulations</span><strong>${packs.reduce((n, pack) => n + pack.scenarios.length, 0)}</strong><small>${packs.length} curated verticals</small></article>
    </section>
    <section class="grid-2"><div class="card"><div class="section-title"><h2>Advisor priorities</h2><span class="tag">Evidence linked</span></div><div class="list">
      <article class="row"><span class="row-mark">01</span><div><h3>Coach business-impact discovery</h3><p>Reps identify symptoms consistently but quantify consequences in only 44% of synthetic practice calls.</p></div><a class="button-quiet" href="#/coaching">Review</a></article>
      <article class="row"><span class="row-mark">02</span><div><h3>Refresh the CRM objection talk track</h3><p>The objection appears across three persona patterns and lacks a current evidence-backed asset.</p></div><a class="button-quiet" href="#/personas">Inspect</a></article>
      <article class="row"><span class="row-mark">03</span><div><h3>Launch industry practice sprint</h3><p>Choose from 35 scenarios grounded in seven distinct selling motions.</p></div><a class="button-quiet" href="#/industries">Choose</a></article>
    </div><aside class="card"><div class="section-title"><h2>Team readiness</h2><b>74%</b></div>${[["Discovery",82],["Business impact",58],["Listening",87],["Objections",69],["Next steps",76]].map(([name,value]) => `<div class="competency"><span>${name}</span><div class="progress"><i style="width:${value}%"></i></div><b>${value}</b></div>`).join("")}<article class="card insight"><span class="eyebrow">PROACTIVE ADVISOR</span><p>Run a 15-minute impact-discovery drill before the next pipeline review. It targets the largest measurable competency gap.</p></article></aside></section>`);
}

function industries() {
  return frame(`${pageHead("Curated practice library", "Seven industries. Thirty-five buyer conversations.", "Every pack includes five scenarios, buyer roles, realistic signals, grading priorities, and responsible-selling guardrails.")}
    <section class="industry-grid">${packs.map((pack) => `<article class="card industry-card" style="--accent:${pack.color}"><div class="industry-icon" style="background:${pack.color}">${pack.icon}</div><h2>${pack.name}</h2><p>${pack.description}</p><footer><span class="tag">5 simulations</span><button class="button-quiet" data-industry="${pack.id}">Explore →</button></footer></article>`).join("")}</section>`);
}

function scenarios() {
  const pack = currentPack();
  return frame(`${pageHead("Scenario studio", `${pack.name} practice`, "Select a complete synthetic scenario or change the industry. Buyer-private information and scorecards remain separated from the rep brief.", `<select id="industrySelect" aria-label="Industry">${packs.map((item) => `<option value="${item.id}" ${item.id === pack.id ? "selected" : ""}>${item.name}</option>`).join("")}</select>`)}
    <section class="card"><div class="section-title"><h2>${pack.sellerRole} · scenario catalog</h2><span class="tag green">Research-informed demo</span></div><div class="scenario-grid">${pack.scenarios.map((scenario) => `<article class="scenario"><div class="scenario-head"><div><h3>${scenario.title}</h3><span class="tag ${difficultyClass(scenario.difficulty)}">${scenario.difficulty}</span></div><span class="row-mark">${initials(scenario.buyer)}</span></div><p>${scenario.objective}</p><div class="scenario-foot"><span>${scenario.buyer} · ${scenario.buyerTitle}</span><button class="button-quiet" data-scenario="${scenario.id}">Practice</button></div></article>`).join("")}</div></section>
    <section class="grid-2"><article class="card"><div class="section-title"><h2>Buyer intelligence</h2><span class="tag">Buyer-private</span></div><div class="claim-grid">${pack.signals.map((signal, index) => `<div class="claim"><span>Signal ${index + 1}</span><b>${signal}</b><small class="confidence">Used only when naturally revealed</small></div>`).join("")}</div></article><article class="card"><div class="section-title"><h2>Responsible-selling guardrails</h2></div><div class="list">${pack.guardrails.map((item, index) => `<div class="row"><span class="row-mark">${index + 1}</span><div><h3>${item}</h3><p>Applied to evaluator evidence and unsupported-claim review.</p></div></div>`).join("")}</div></article></section>`);
}

function extractPersona(transcript, pack) {
  if (transcript.trim() !== defaultTranscript.trim() || pack.id !== "b2b-saas") throw new Error("The public demo supports only its verified synthetic fixture.");
  const lines = transcript.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const buyerLines = lines.filter((line) => /^buyer:/i.test(line)).map((line) => line.replace(/^buyer:\s*/i, ""));
  const claim = (label, pattern, support = "observed") => {
    const turnIndex = lines.findIndex((line) => /^buyer:/i.test(line) && pattern.test(line));
    const excerpt = turnIndex >= 0 ? lines[turnIndex].replace(/^buyer:\s*/i, "") : "";
    return { label, value: excerpt || "Unknown", support: excerpt ? support : "unknown", source: "Verified Northstar synthetic fixture", turnId: excerpt ? `T${turnIndex + 1}` : null, excerpt };
  };
  return {
    name: "Jordan Lee",
    title: "VP of Sales Operations",
    industry: pack.name,
    style: "Manager-authored synthetic template",
    priorities: [],
    pain: buyerLines[1],
    impact: buyerLines[2],
    objection: buyerLines[0],
    decision: buyerLines[3],
    confidence: 100,
    evidenceTurns: buyerLines.length,
    claims: [
      claim("Current workflow and pain", /regions still send spreadsheets/i),
      claim("Business and emotional impact", /leadership questions/i),
      claim("Surface objection", /already report through our crm/i),
      claim("Mutual next step", /bring a simple integration view/i),
      { label: "Communication style", value: "Direct, skeptical, time-conscious", support: "industry_template", source: "Manager-authored synthetic scenario", turnId: null, excerpt: "" },
    ],
  };
}

function personas() {
  const persona = state.persona;
  if (!persona) return frame(`${pageHead("Digital-twin personas", "Create buyers from what customers actually say.", "The persona engine clusters evidence, flags conflicts, and requires manager approval before a persona can power simulations.", '<a class="button" href="#/transcripts">Analyze a transcript →</a>')}<section class="card empty"><div><span class="eyebrow">NO PERSONA DRAFT YET</span><h2>Start with transcript evidence</h2><p>Use the included synthetic call to see the complete extraction and review workflow.</p><a class="button" href="#/transcripts">Open Transcript Lab</a></div></section>`);
  return frame(`${pageHead("Digital-twin persona", `${clean(persona.name)} · ${clean(persona.title)}`, "AI-generated draft · review required before publication.", '<button class="button-quiet" data-action="editPersona">Edit</button><button class="button" data-action="approvePersona">Approve persona</button>')}
    <section class="card persona-profile"><div class="avatar">${initials(persona.name)}</div><div><span class="tag">AI-generated · in review</span><h2>${clean(persona.name)}</h2><p>${clean(persona.title)} · ${clean(persona.industry)}</p><p><b>${clean(persona.style)}</b> · ${persona.confidence}% evidence confidence · ${persona.evidenceTurns} buyer turns</p></div></section>
    <section class="claim-grid">${[["Primary pain",persona.pain],["Business impact",persona.impact],["Likely objection",persona.objection],["Decision process",persona.decision],["Priorities",persona.priorities.join(" · ")],["Communication style",persona.style]].map(([label,value],index)=>`<article class="claim card"><span>${label}</span><b>${clean(value)}</b><div class="evidence">Evidence T${index+2} · “${clean(String(value).slice(0,105))}”</div><span class="confidence">${Math.max(58,persona.confidence-index*3)}% confidence</span></article>`).join("")}</section>`);
}

function buyerReply(message) {
  const lower = message.toLowerCase();
  const scenario = currentScenario();
  const pack = currentPack();
  if (/rubric|score|prompt|hidden|system instruction/.test(lower)) return "I’m not sure why you’re asking me that. Are we going to discuss the business issue?";
  if (/how|process|currently|today|workflow/.test(lower)) return `We have a workable process, but ${pack.signals[0]} and ${pack.signals[1]} keep creating friction. I do not want another initiative that adds work.`;
  if (/impact|cost|consequence|what happens|why.*matter/.test(lower)) return `The biggest consequence is lost confidence and time. My team has to explain the same gaps repeatedly, and it delays decisions.`;
  if (/who|stakeholder|decision|approve|involved/.test(lower)) return "I would involve our operational owner and finance before we committed to a next step. They will want evidence and a practical implementation path.";
  if (/next|follow|meeting|schedule/.test(lower)) return "A focused working session could make sense if you bring a clear agenda and include the right operational owner.";
  if (/product|platform|solution|demo|feature/.test(lower) && state.turns.length < 5) return `We already have tools for this. I am concerned a new solution will create more administration, not less.`;
  return `Can you be more specific about what you want to understand regarding ${scenario.objective.toLowerCase()}?`;
}

function practice() {
  const scenario = currentScenario();
  const pack = currentPack();
  if (!state.turns.length) state.turns = [{ role: "buyer", content: `Thanks for joining. I have about ${scenario.difficulty === "easy" ? "twenty" : "ten"} minutes—what did you want to cover?`, at: Date.now() }];
  if (!state.startedAt) state.startedAt = Date.now();
  save();
  return frame(`${pageHead("Scripted synthetic simulation", scenario.title, "This Pages preview uses local illustrative buyer rules. The authenticated product uses the server-side stateful BuyerActor.", '<button class="button-quiet" data-action="newCall">Restart</button><button class="button danger" data-action="endCall">End call</button>')}
    <section class="practice-layout"><aside class="card brief"><span class="eyebrow">REP-VISIBLE BRIEF</span><h2>${scenario.buyer}</h2><p>${scenario.buyerTitle} · ${pack.name}</p><span class="tag ${difficultyClass(scenario.difficulty)}">${scenario.difficulty}</span><h3>Call objective</h3><p>${scenario.objective}</p><h3>Known facts</h3><ul><li>The meeting followed an initial outreach.</li><li>The buyer is time-conscious.</li><li>Your goal is a credible next step, not an automatic purchase.</li></ul><p class="evidence">Buyer pains, triggers, decision details, and the rubric remain server-private.</p></aside>
    <article class="card conversation"><header class="conversation-head"><div class="buyer-id"><div class="avatar">${initials(scenario.buyer)}</div><div><b>${scenario.buyer}</b><span>${scenario.buyerTitle} · scripted synthetic buyer</span></div></div><span class="timer" id="timer">00:00</span></header><div class="turns" id="turns">${state.turns.map((turn,index)=>`<div class="turn ${turn.role}"><div class="bubble">${clean(turn.content)}</div><small>${turn.role === "seller" ? "You" : scenario.buyer} · T${index+1}</small></div>`).join("")}</div><form class="composer" id="messageForm"><button class="voice" type="button" data-action="voice" aria-label="Dictate seller message">●</button><input id="messageInput" autocomplete="off" maxlength="1200" placeholder="Respond as the seller…" aria-label="Seller message"><button class="button" type="submit">Send</button></form></article></section>`);
}

function calculateScore() {
  const seller = state.turns.filter((turn) => turn.role === "seller");
  const checks = [
    [/agenda|time|cover|useful/, "Opening and agenda"],
    [/how|what|walk me|tell me/, "Question quality"],
    [/process|workflow|challenge|pain|friction/, "Pain discovery"],
    [/impact|cost|consequence|time|risk|leadership/, "Business-impact discovery"],
    [/sounds like|heard|understand|you mentioned/, "Active listening"],
    [/because|based on|relevant|connect/, "Relevant positioning"],
    [/next|follow|schedule|include|meeting/, "Next-step control"],
  ];
  const weights = [10,15,20,20,15,10,10];
  const criteria = checks.map(([pattern,name], index) => {
    const evidenceIndex = seller.findIndex((turn) => pattern.test(turn.content.toLowerCase()));
    const evidence = evidenceIndex >= 0 ? seller[evidenceIndex].content : "No transcript evidence found.";
    const score = evidenceIndex >= 0 ? (seller.length >= 4 ? 3 : 2) : 0;
    return { name, weight: weights[index], score, evidence, turnId: evidenceIndex >= 0 ? `S${evidenceIndex+1}` : "—" };
  });
  const overall = Math.round(criteria.reduce((sum,item)=>sum+(item.score/4)*item.weight,0));
  state.score = { overall, criteria, status: seller.length < 2 ? "insufficient_evidence" : "complete" };
  save();
}

function results() {
  if (!state.score) return frame(`${pageHead("Evidence scorecard", "Complete a practice call to see results.", "Scores are calculated independently from observable transcript evidence.", '<a class="button" href="#/practice">Start practice →</a>')}<section class="card empty"><div><h2>No completed call yet</h2><p>Your scorecard will preserve transcript evidence, rationale, and a specific next action for every criterion.</p></div></section>`);
  const score = state.score;
  return frame(`${pageHead("Illustrative synthetic results", score.status === "complete" ? "Local practice preview" : "More evidence required", "This Pages score is a transparent local heuristic for the synthetic demo—not the production evaluator.", '<a class="button-quiet" href="#/practice">Retry scenario</a><a class="button" href="#/coaching">Open coaching plan</a>')}
    <section class="card score-hero"><div class="score-ring" style="--score:${score.overall}%"><strong>${score.overall}</strong></div><div><span class="tag orange">SYNTHETIC HEURISTIC</span><h2>${currentScenario().title}</h2><p>${currentScenario().buyer} · ${currentPack().name} · ${state.turns.length} transcript turns</p><p><b>Production outcome:</b> Not evaluated in this static preview.</p></div></section>
    <section class="grid-2"><article class="card"><div class="section-title"><h2>Criterion evidence</h2><span class="tag">Weights total 100</span></div>${score.criteria.map((item)=>`<div class="criterion"><div><b>${item.name}</b><p>${item.weight}% weight · ${item.turnId}</p></div><div><div class="progress"><i style="width:${item.score/4*100}%"></i></div><p>“${clean(item.evidence.slice(0,145))}”</p></div><strong>${item.score}/4</strong></div>`).join("")}</article><aside class="card"><div class="section-title"><h2>Priority coaching</h2></div><div class="list">${score.criteria.filter(item=>item.score<3).slice(0,3).map((item,index)=>`<div class="row"><span class="row-mark">${index+1}</span><div><h3>${item.name}</h3><p>${item.score === 0 ? "Not demonstrated. Ask a direct, relevant question and follow the answer." : "Move beyond the topic mention to a specific, measurable discovery."}</p></div></div>`).join("")}</div><article class="card insight"><span class="eyebrow">NEXT DRILL</span><p>Practice moving from an observed symptom to operational and financial impact without leading the buyer.</p></article></aside></section>`);
}

function coaching() {
  return frame(`${pageHead("Proactive coaching advisor", "Coach the moment that changes the next call.", "Recommendations connect observed behaviors to a focused drill—not generic call summaries.", '<a class="button" href="#/practice">Launch recommended drill</a>')}
    <section class="grid-2"><article class="card"><div class="section-title"><h2>Recommended coaching plan</h2><span class="tag orange">High leverage</span></div><div class="list">${[["Observe","Reps hear workflow symptoms but move to positioning before impact is clear."],["Diagnose","The recurring gap is business-impact discovery, not product knowledge."],["Practice","Run the selected industry scenario and ask two consequence follow-ups."],["Verify","Require transcript evidence for impact, stakeholder, and next-step criteria."]].map(([title,copy],index)=>`<div class="row"><span class="row-mark">${index+1}</span><div><h3>${title}</h3><p>${copy}</p></div><span class="tag ${index===2?"green":""}">${index===2?"ready":"evidence"}</span></div>`).join("")}</div></article><aside class="card"><div class="section-title"><h2>Manager prompts</h2></div><div class="list">${["What did the buyer say that changed your hypothesis?","Which consequence matters to another stakeholder?","Where did you position before earning relevance?","What concrete commitment defines a good next step?"].map((item,index)=>`<div class="claim"><span>Prompt ${index+1}</span><b>${item}</b></div>`).join("")}</div></aside></section>`);
}

function analytics() {
  return frame(`${pageHead("Revenue intelligence", "Patterns leaders can act on.", "Synthetic cross-call signals show how the operating system connects training, buyer evidence, and content decisions.")}
    <section class="metric-grid"><article class="card metric"><span>Revenue DNA</span><strong>87</strong><small>Market-message alignment</small></article><article class="card metric"><span>Knowledge drift</span><strong>3</strong><small>Signals need review</small></article><article class="card metric"><span>Content gaps</span><strong>5</strong><small>Recurring unanswered questions</small></article><article class="card metric"><span>Coaching lift</span><strong>+12</strong><small>Points after targeted drills</small></article></section>
    <section class="grid-2"><article class="card"><div class="section-title"><h2>Signal prevalence</h2><span class="tag">Synthetic cohort</span></div>${[["Implementation burden",88],["Proof of measurable impact",76],["Existing-tool objection",69],["Change management",62],["Executive confidence",55]].map(([name,value])=>`<div class="competency"><span>${name}</span><div class="progress"><i style="width:${value}%"></i></div><b>${value}%</b></div>`).join("")}</article><aside class="card"><div class="section-title"><h2>Knowledge drift</h2></div><article class="card insight"><span class="eyebrow">MESSAGE ↔ MARKET</span><p>Approved messaging emphasizes automation, while recent buyer language emphasizes trust, adoption burden, and implementation proof. Review the talk track before the next practice sprint.</p></article></aside></section>`);
}

function settings() {
  return frame(`${pageHead("Security and settings", "Govern customer intelligence by design.", "The public demo stores only synthetic state on this device. Production controls live in the authenticated workspace.")}
    <section class="grid-2"><article class="card"><div class="section-title"><h2>Production control model</h2><span class="tag green">Designed</span></div><div class="list">${[["Tenant isolation","Organization-scoped records, RLS, and server-side membership resolution."],["Consent-aware ingestion","Source, purpose, consent, region, and retention travel with each transcript."],["Customer ownership","Export, deletion, and derived-data lineage remain customer-controlled."],["AI boundaries","Compiler, buyer actor, and evaluator are isolated responsibilities."],["Private voice","WebRTC session creation is server-mediated; raw audio is not stored by default."]].map(([title,copy],index)=>`<div class="row"><span class="row-mark">${index+1}</span><div><h3>${title}</h3><p>${copy}</p></div><span class="tag green">Ready design</span></div>`).join("")}</div></article><aside class="card form-grid"><span class="eyebrow">DEMO CONTROLS</span><h2>Local synthetic state</h2><p>This browser contains your selected scenario, synthetic transcript, draft persona, and practice turns.</p><button class="button-quiet" data-action="export">Export demo JSON</button><button class="button danger" data-action="reset">Delete and reset demo</button><p class="evidence">No API key, real transcript, hidden buyer object, or evaluation rubric is placed in this public bundle.</p></aside></section>`);
}

function transcriptsV2() {
  const buyerTurns = defaultTranscript.split(/\n+/).filter((line) => /^buyer:/i.test(line.trim())).length;
  return frame(`${pageHead("Verified synthetic fixture", "See how governed evidence becomes a persona.", "GitHub Pages uses one locked synthetic transcript. It does not process uploaded customer data or claim to run the production AI extractor.")}
    <div class="workflow"><div class="done"><b>1 · Fixture</b>Verified synthetic call</div><div class="done"><b>2 · Privacy</b>No customer data</div><div class="done"><b>3 · Lineage</b>${buyerTurns} buyer turns</div><div><b>4 · Review</b>Manager simulation</div></div>
    <section class="grid-2"><form class="card form-grid" id="transcriptForm"><div class="section-title"><div><span class="eyebrow">SYNTHETIC DATA ONLY</span><h2>Northstar discovery fixture</h2></div><span class="tag green">Locked</span></div><label>Industry<input value="B2B SaaS" readonly></label><label>Transcript<textarea rows="16" readonly>${clean(defaultTranscript)}</textarea></label><div class="actions"><button class="button" type="submit">Load verified persona →</button></div></form><aside class="card"><span class="eyebrow">DEMO BOUNDARY</span><h2>What this proves</h2><p class="evidence">Every observed claim below uses a literal excerpt and stable turn from this fixture. The authenticated Next.js workspace handles real uploads, scanning, consent, retention, AI extraction, and tenant isolation.</p><div class="list">${["Observed claims quote exact buyer turns","Template content is labeled as template content","Unknown information is not invented","Every claim requires manager disposition","The public bundle contains no API key or customer data"].map((item,index)=>`<div class="row"><span class="row-mark">${index+1}</span><div><h3>${item}</h3></div></div>`).join("")}</div></aside></section>`);
}

function personasV2() {
  const persona = state.persona;
  if (!persona) return personas();
  const claims = persona.claims || [];
  const reviewed = Object.keys(state.claimReviews || {}).length;
  const history = state.personaHistory || [];
  return frame(`${pageHead("Verified synthetic persona", `${clean(persona.name)} · ${clean(persona.title)}`, `Curated fixture · ${reviewed} of ${claims.length} claims reviewed.`, '<button class="button-quiet" data-action="editPersona">View source fixture</button><button class="button" data-action="approvePersona">Approve reviewed persona</button>')}
    <section class="card persona-profile"><div class="avatar">${initials(persona.name)}</div><div><span class="tag">SYNTHETIC FIXTURE · in review</span><h2>${clean(persona.name)}</h2><p>${clean(persona.title)} · ${clean(persona.industry)}</p><p>This fixture demonstrates governance; it is not an AI extraction result.</p></div></section>
    <section class="claim-grid">${claims.map((item,index)=>`<article class="claim card"><div class="section-title"><span>${clean(item.label)}</span><span class="tag ${item.support === "observed" ? "green" : "orange"}">${clean(item.support)}</span></div><b>${clean(item.value)}</b>${item.excerpt ? `<div class="evidence">${clean(item.source)} · ${clean(item.turnId)} · “${clean(item.excerpt)}”</div>` : `<div class="evidence">${clean(item.source)} · not transcript evidence</div>`}<div class="claim-actions"><button class="button-quiet ${state.claimReviews?.[index] === "accepted" ? "selected" : ""}" data-claim="${index}" data-disposition="accepted">Accept ${clean(item.label)}</button><button class="button-quiet ${state.claimReviews?.[index] === "rejected" ? "selected reject" : ""}" data-claim="${index}" data-disposition="rejected">Reject ${clean(item.label)}</button></div></article>`).join("")}</section>
    <section class="card version-panel"><div class="section-title"><h2>Version history</h2><span class="tag">Immutable lineage</span></div>${history.length ? history.map((item,index)=>`<div class="version-row"><b>v${history.length-index}.0</b><span>${clean(item.summary)}</span><small>${clean(item.at)}</small></div>`).join("") : '<p class="evidence">Approve all claims to create version 1. Future transcript collections produce a side-by-side change record.</p>'}</section>`);
}

const pages = { dashboard, transcripts: transcriptsV2, personas: personasV2, industries, scenarios, practice, results, coaching, analytics, settings };
let timerHandle;
function render() {
  clearInterval(timerHandle);
  document.querySelector("#app").innerHTML = pages[route()]();
  bind();
  if (route() === "practice") {
    const turns = document.querySelector("#turns");
    if (turns) turns.scrollTop = turns.scrollHeight;
    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
      const timer = document.querySelector("#timer");
      if (timer) timer.textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
    };
    updateTimer(); timerHandle = setInterval(updateTimer, 1000);
  }
}

function bind() {
  document.querySelectorAll("[data-industry]").forEach((button) => button.addEventListener("click", () => {
    state.industryId = button.dataset.industry; state.scenarioId = currentPack().scenarios[0].id; save(); location.hash = "/scenarios";
  }));
  document.querySelector("#industrySelect")?.addEventListener("change", (event) => {
    state.industryId = event.target.value; state.scenarioId = currentPack().scenarios[0].id; save(); render();
  });
  document.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
    state.scenarioId = button.dataset.scenario; state.turns = []; state.score = null; state.startedAt = null; save(); location.hash = "/practice";
  }));
  document.querySelector("#transcriptForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const sources = [{ id: "verified-northstar-fixture", title: "Northstar synthetic discovery", content: defaultTranscript, status: "verified_synthetic" }];
    state.industryId = "b2b-saas";
    state.scenarioId = currentPack().scenarios[0].id;
    state.transcriptSources = sources;
    state.transcript = defaultTranscript;
    state.persona = extractPersona(state.transcript, currentPack());
    state.claimReviews = {};
    state.personaHistory = [];
    save(); location.hash = "/personas";
  });
  document.querySelectorAll("[data-remove-source]").forEach((button) => button.addEventListener("click", () => {
    state.transcriptSources = state.transcriptSources.filter((source) => source.id !== button.dataset.removeSource); save(); render();
  }));
  document.querySelectorAll("[data-claim]").forEach((button) => button.addEventListener("click", () => {
    state.claimReviews = { ...(state.claimReviews || {}), [button.dataset.claim]: button.dataset.disposition }; save(); render();
  }));
  document.querySelector("#messageForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#messageInput"); const message = input.value.trim();
    if (!message) return toast("Enter a seller response before sending.");
    state.turns.push({ role: "seller", content: message, at: Date.now() });
    state.turns.push({ role: "buyer", content: buyerReply(message), at: Date.now() });
    save(); render();
  });
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => action(button.dataset.action)));
}

function action(name) {
  if (name === "menu") return document.querySelector(".shell").classList.toggle("menu-open");
  if (name === "reset") { localStorage.removeItem("suadence-demo"); Object.assign(state, initialState); toast("Synthetic demo data reset."); return render(); }
  if (name === "sample") { state.industryId = "b2b-saas"; state.transcript = defaultTranscript; state.transcriptSources = [{ id: `synthetic-${Date.now()}`, title: "Northstar discovery", content: defaultTranscript, status: "verified_synthetic" }]; state.persona = null; state.personaHistory = []; save(); render(); return toast("Verified synthetic fixture restored."); }
  if (name === "addSource") { state.transcriptSources = [...(state.transcriptSources || []), { id: `synthetic-${Date.now()}`, title: `Discovery transcript ${(state.transcriptSources || []).length + 1}`, content: "", status: "empty" }]; save(); return render(); }
  if (name === "approvePersona") {
    const claimCount = state.persona?.claims?.length ?? 0;
    if (Object.keys(state.claimReviews || {}).length !== claimCount) return toast(`Accept or reject all ${claimCount} claims before approval.`);
    state.personaHistory = [{ summary: `${Object.values(state.claimReviews).filter((value) => value === "accepted").length} accepted claims · ${(state.transcriptSources || []).length} sources`, at: new Date().toLocaleDateString() }, ...(state.personaHistory || [])]; save(); render(); return toast("Persona approved. Immutable version and evidence lineage preserved.");
  }
  if (name === "editPersona") { location.hash = "/transcripts"; return; }
  if (name === "newCall") { state.turns=[]; state.score=null; state.startedAt=null; save(); return render(); }
  if (name === "endCall") { calculateScore(); location.hash="/results"; return; }
  if (name === "export") {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:"application/json"}); const link=document.createElement("a"); link.href=URL.createObjectURL(blob); link.download="suadence-synthetic-demo.json"; link.click(); URL.revokeObjectURL(link.href); return toast("Synthetic demo export downloaded.");
  }
  if (name === "voice") {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return toast("Voice input is not supported in this browser. Text practice remains available.");
    const recognition = new Recognition(); recognition.lang="en-US"; recognition.interimResults=false;
    const button=document.querySelector('[data-action="voice"]'); button.classList.add("listening");
    recognition.onresult=(event)=>{ document.querySelector("#messageInput").value=event.results[0][0].transcript; };
    recognition.onerror=()=>toast("Voice input stopped. Check microphone permission or continue with text.");
    recognition.onend=()=>button?.classList.remove("listening"); recognition.start();
  }
}

window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "/dashboard"; else render();
