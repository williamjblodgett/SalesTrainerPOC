# Live text realism calibration

Copy `corpus.example.json` to the ignored `human-scored.json` file and populate it only with licensed or customer-authorized transcripts. Every evaluator case requires two distinct human reviewers and an adjudicated 0–4 score for every rubric criterion. Buyer paths and persona expectations also require two reviewers.

The release gate requires at least 50 evaluator transcripts, 10 buyer paths, and 10 persona cases. It fails if evaluator criterion MAE exceeds 0.6, overall-score MAE exceeds 8 points, expected-behavior recall is below 90%, any forbidden hidden behavior occurs, or buyer end-action accuracy is below 90%.

Run `pnpm calibrate:openai` with the OpenAI model variables and `OPENAI_API_KEY` set. The report contains case IDs and aggregate metrics, never transcript text. Only set `TEXT_REALISM_BENCHMARK_STATUS=passed` after the report passes and a sales leader signs off on response naturalness. Realtime voice additionally requires `ENABLE_REALTIME_VOICE=true`.
