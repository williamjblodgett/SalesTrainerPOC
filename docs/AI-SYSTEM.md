# AI system

Three responsibilities remain intentionally separate:

1. Scenario Compiler converts structured manager inputs and untrusted reference material into a validated `ScenarioSpec`.
2. Buyer Actor receives private scenario state and transcript context, and returns only a visible buyer message plus private state updates.
3. Post-Call Evaluator runs only after completion and returns evidence linked to stable turn IDs. Application code calculates the weighted score.

All real providers use the Responses API and structured outputs validated with Zod. The buyer never sees the rubric, the evaluator never joins the conversation, and uploaded content is quoted as untrusted reference material. Model identifiers come only from environment configuration.

## Realtime voice

Browser voice uses WebRTC. The browser sends its SDP offer to a SalesSim server endpoint; that endpoint combines the offer with server-owned buyer instructions and opens the OpenAI Realtime call using the standard API key. The browser receives only the SDP answer. `OPENAI_REALTIME_MODEL` controls the model, and credential-free deployments fall back to a clearly bounded browser voice demonstration. Audio is not stored by default; transcript events feed the same post-call evaluator used by text sessions.
