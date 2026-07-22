# AI system

Three responsibilities remain intentionally separate:

1. Scenario Compiler converts structured manager inputs and untrusted reference material into a validated `ScenarioSpec`.
2. Buyer Actor receives private scenario state and transcript context, and returns only a visible buyer message plus private state updates.
3. Post-Call Evaluator runs only after completion and returns evidence linked to stable turn IDs. Application code calculates the weighted score.

All real providers use the Responses API and structured outputs validated with Zod. The buyer never sees the rubric, the evaluator never joins the conversation, and uploaded content is quoted as untrusted reference material. Model identifiers come only from environment configuration.
