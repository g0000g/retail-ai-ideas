# Idea 11 — LLM Router & AI cost governance on the existing LGTM stack

> **Blueprint source:** `llm-router`, `data-flywheel` (concept only — deprecated upstream)
> **New infra:** 1 container (or 0, see below) · **GPU:** none for the lazy version · **Effort:** S (1 week) · **Verdict:** high — force multiplier, not a standalone entry

## Pitch

Every AI feature in this folder calls an LLM. Put one governed hop in front of all of them:

- **Route by complexity/task** — trivial turns to `nemotron-3-nano-30b`, hard reasoning to
  `nemotron-3-super-120b`. Same answers, a fraction of the cost.
- **Budget & quota** — per tenant, per feature, per user session. Hard stop, not a warning email.
- **Observability** — tokens, cost, latency, cache hit rate, model mix, per feature, on **Grafana dashboards
  that already exist** because OTel is wired into all 19 services.
- **Semantic + exact cache** — repeat questions cost nothing.

## Why it matters for the contest specifically

Judges discount demos that would obviously bankrupt the company. A live dashboard showing *"this demo cost
$0.42, average $0.004 per shopper conversation, 63% served by the cheap model, 31% cache hits"* converts a
prototype into something that reads as production-ready. It is the cheapest credibility available.

It also protects against the single most likely operational failure of an AI feature: an unbounded
tool-calling loop quietly burning the API key.

## Two versions

### Version A — Java gateway, zero new containers (recommended)
The NVIDIA blueprint routes with a **Triton-hosted prompt classifier** — that needs a GPU (V100/4GB) and a
new service. Skip it. A `LlmGateway` component inside `ai-service` does the same job:

| Blueprint feature | Lazy equivalent |
| --- | --- |
| Triton prompt classifier | Heuristics first (turn length, tool-call depth, feature id, history length), escalate on retry/low confidence. Optionally one cheap LLM classification call. |
| OpenAI-compatible proxy | Spring AI `ChatClient` with multiple named models + a selection strategy |
| Cost tracking | Micrometer counters → Prometheus/Mimir → Grafana. Already deployed. |
| Budget enforcement | Redis token bucket per `tenant:feature:session` |
| Caching | Redis exact-match on prompt hash; semantic cache via pgvector if [Idea 04](04-ops-rag-assistant.md) lands |

Heuristic routing captures most of the savings. Add the classifier only if measurements show the heuristics
misrouting.

### Version B — the actual blueprint
Deploy `llm-router` (Triton + router controller) as an OpenAI-compatible proxy; point every service's
`spring.ai.openai.base-url` at it. Cleaner separation, works for non-Java callers (the Pipecat voice
container in [Idea 07](07-voice-pos-assistant.md), the Python forecast job in
[Idea 05](05-demand-forecast-replenishment.md)). Needs 1 small GPU. Document as the upgrade.

## Metrics to emit (Micrometer, from `ai-service`)

```
ai.llm.tokens{feature,model,direction=in|out}     counter
ai.llm.cost.usd{feature,model,tenant}             counter
ai.llm.latency{feature,model}                     timer
ai.llm.route{from_model,to_model,reason}          counter
ai.llm.cache{feature,result=hit|miss}             counter
ai.llm.tool.calls{feature,tool,status}            counter
ai.llm.budget.rejected{tenant,feature}            counter
ai.llm.guardrail.blocked{feature,category}        counter   ← from Idea 12
```

Trace attributes on every LLM span: `gen_ai.request.model`, `gen_ai.usage.input_tokens`,
`gen_ai.usage.output_tokens`, `gen_ai.system` — the OpenTelemetry **GenAI semantic conventions**. Use the
standard names, not custom ones: Grafana's LLM panels and any future OTel tooling read those keys.
⚠ The observability stack here has known **version-pairing gotchas** (appender ↔ SDK, semconv version) —
check the semconv version in use before pinning attribute names.

## Build steps

1. (2 days) `LlmGateway` in `ai-service`: named model configs, heuristic routing strategy, one entry point every feature calls.
2. (1 day) Micrometer instrumentation + OTel GenAI span attributes.
3. (1 day) Grafana dashboard: cost/day per feature, model mix, p95 latency, cache hit rate, budget rejections.
4. (1 day) Redis token-bucket budgets + exact-match response cache.
5. (1 day) Alert rules: daily spend threshold, error-rate spike, sudden model-mix shift (a good proxy for a prompt regression).

## Data-flywheel angle (concept, ~2 extra days)

`data-flywheel` is deprecated, but its idea is free to steal: **log every prompt/response with a
`task_id`**, and you can later measure whether a cheaper model would have sufficed. Do the logging now —
it costs a table and a Kafka topic — and the "we measured a 40% cost reduction opportunity" slide writes
itself, no NeMo Customizer required.

Log: `task_id`, model, prompt hash, tokens, latency, tool calls, user feedback (👍/👎), final outcome. Keep the
raw prompt only where privacy allows; hash it otherwise.

## Risks

| Risk | Mitigation |
| --- | --- |
| Router sends a hard query to the weak model → bad answer | Escalation on low confidence / user retry / tool-loop depth > N. Measure escalation rate; it's the tuning signal. |
| Cost tracking drifts from the real NVIDIA invoice | Reconcile monthly; treat the dashboard as an estimate and label it as such |
| Caching returns stale prices/stock | **Never cache tool results — only cache pure-text LLM completions.** Business data always goes live. This is the one rule that must not bend. |
| Budget rejection breaks the UX mid-conversation | Degrade to a cached/canned response with a clear message, not an HTTP 500 |
| One more indirection to debug | Same trace, same OTel span tree. Add `ai.llm.route.reason` as a span attribute so routing decisions are visible in Tempo. |

## Effort

~6 dev-days. Do it **alongside** whichever idea is chosen, not instead of one. It makes every other demo
better and it's the thing that makes a judge believe you'd actually deploy this.
