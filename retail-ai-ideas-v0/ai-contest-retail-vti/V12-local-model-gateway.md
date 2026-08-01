# V12 — 3-tier model gateway: Ollama → (vLLM) → MiniMax

> **VTI item:** the foundation under every "Generative AI" / "Data analytics" claim on the page
> **New infra:** 1 Ollama container · **GPU:** none · **Effort:** S (~6 days) · **Verdict:** ⭐ build this first

## Pitch

One `LlmGateway` component in `ai-service`. Every AI feature calls it. It decides *where* the model runs:

```
tier 0  Ollama, on our rack, CPU        default — free, private, no egress
tier 1  vLLM 14–30B                     documented only, needs a GPU we don't have
tier 2  MiniMax API                      escalation — long reasoning, hard documents, agentic loops
```

The routing decision is logged, the cost is metered, the PII is stripped before anything leaves, and the
whole thing shows up on the Grafana stack that is already collecting three signals from 19 services.

## Why this is the first thing to build

Because it is the only piece all eleven other ideas share, and because *it is the argument*. Any team can
call an API. The differentiators here are:

- **Marginal cost 0 VND for the default tier.** A demo that costs nothing per query is a different pitch.
- **Data never leaves for the default tier.** Answers the Decree 13 / PDPL question instead of dodging it.
- **The escape hatch is honest.** Small local models genuinely can't do long-chain reasoning. Saying
  "and here is exactly when we pay for a bigger model, and how much that costs" is more credible than
  claiming a 4B model does everything.
- **It survives the proxy.** If the corporate MITM proxy blocks `api.minimax.io`, tier 0 still works. The
  NVIDIA-set plans are entirely dead in that scenario.

## Architecture

See `diagrams/vti-12-model-gateway.drawio.png`.

```
any AI feature  →  LlmGateway (ai-service)
                    │
                    ├─ 1. classify: task kind, expected output size, tool-loop depth
                    │      FunctionGemma 270M or a heuristic — this hop must be ~free
                    ├─ 2. cache lookup (Redis exact-hash; pgvector semantic if V11 lands)
                    ├─ 3. budget check (Redis token bucket: tenant / feature / session / day)
                    ├─ 4. PII scrubber  ── OPA rule denies escalation on flagged field types
                    │
                    ├─ tier 0 → http://ollama:11434/v1   qwen3.5:4b · gemma4:e4b · bge-m3 · reranker
                    ├─ tier 1 → (vLLM, if a GPU appears)
                    └─ tier 2 → https://api.minimax.io/v1   MiniMax-M2.5
                    │
                    └─ 5. metrics + OTel GenAI span attributes → Mimir / Tempo / Grafana
```

**All three tiers are OpenAI-compatible**, so this is one Spring AI `ChatClient` per named model plus a
selection strategy — not three integrations.

## Routing rules (start here, tune with data)

Escalate to tier 2 when **any** of:

| Trigger | Rationale |
| --- | --- |
| tool-loop depth > 3 | small models get lost; this is where they burn tokens without converging |
| input > ~6K tokens | CPU 4B context is the memory trap; long context is slow *and* worse |
| output needs > ~800 tokens of prose | tier 0 throughput makes this a bad experience |
| task class ∈ {multi-step reasoning, code, complex document extraction, negotiation} | measured weakness of 4B |
| tier-0 attempt failed schema validation twice | let the repair loop escalate rather than spin |
| user explicitly asked for "kỹ hơn" / retried | cheapest possible signal of dissatisfaction |

Never escalate when:
- the prompt carries customer PII, employee names, or supplier terms (see `00-model-stack.md` § 11) —
  **scrub or refuse**, not "escalate anyway"
- the answer is a cache hit
- the tenant/session budget is exhausted → degrade to tier 0 with an honest message

## Cost control, concretely

MiniMax output bills at ~4× input, so:
- hard `max_tokens` per feature, defaulting low
- stable prompt prefixes so cache reads apply (blended cost drops sharply on cache hits)
- `temperature=0.2, top_p=0.95` for analytical work — less rambling, fewer output tokens
- MiniMax-M2.5 at $0.15/$0.90 per M is the escalation target; **do not** self-host M2.7 commercially
  (Modified-MIT bars it), and don't reach for M3's >512K tier unless a prompt truly needs it

## Metrics (Micrometer → Prometheus/Mimir → Grafana)

```
ai.llm.tokens{feature,model,tier,direction}      counter
ai.llm.cost.usd{feature,model,tier,tenant}       counter    tier 0 always 0 — that IS the slide
ai.llm.latency{feature,model,tier}               timer
ai.llm.route{tier,reason}                        counter
ai.llm.escalation.rate{feature}                  gauge      target < 15%
ai.llm.cache{feature,result}                     counter
ai.llm.pii.stripped{field_type}                  counter
ai.llm.budget.rejected{tenant,feature}           counter
```

Span attributes: use the OpenTelemetry **GenAI semantic conventions**
(`gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.system`) plus
`ai.llm.tier`. Standard names, not custom ones — Grafana's LLM panels read those keys.
⚠ The observability stack here has known version-pairing gotchas (appender ↔ SDK, semconv version) — check
the semconv version in use before pinning attribute names.

## Build steps

1. **(1 day)** `ollama` container on the dev server; pull `qwen3.5:4b` (q4_K_M), `gemma4:e4b`, `bge-m3`,
   `bge-reranker-v2-m3`. Measure tokens/sec and first-token latency for each. **Write the numbers down** —
   every other plan's UX decisions depend on them.
2. **(2 days)** `LlmGateway`: named model configs, tier selection strategy, retry/escalate, Redis
   exact-match cache, Redis token-bucket budgets.
3. **(1 day)** PII scrubber + OPA rule `ai.escalation` (fail closed). Unit test the "OPA down → refuse to
   escalate" path. That is the one test that must exist.
4. **(1 day)** Micrometer + OTel GenAI attributes; Grafana dashboard (cost/day per feature, tier mix,
   escalation rate, p95 latency per tier, cache hit rate).
5. **(1 day)** Alerts: daily spend threshold, escalation-rate spike (a good proxy for a prompt regression),
   tier-0 error rate, `api.minimax.io` unreachable → confirm graceful tier-0-only operation.

## Prompt/response logging (2 extra days, high value)

Log every call: `task_id`, tier, model, prompt hash, tokens, latency, tool calls, schema-validation
outcome, user feedback 👍/👎. Keep raw prompts only where the residency table allows; hash otherwise.

Two payoffs: (a) you can later prove *"X% of tier-2 calls would have been fine on tier 0"* — a measured
cost-reduction slide, no fine-tuning infrastructure required; (b) it is the dataset for a future LoRA on
`qwen3.5:4b` if a GPU ever appears.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Tier-0 throughput is worse than hoped** and everything escalates | Step 1 measures it before any UX is designed. If a 4B is too slow for streaming chat, tier 0 keeps the non-chat work (extraction, classification, embeddings, routing) — which is most of the value in this folder — and chat escalates by default. Say so plainly. |
| Ollama container competes for CPU with the 19 services on the same box | Pin CPU limits in compose. If contention shows up in Grafana, the model sidecar moves to its own host. Measure before optimising. |
| Escalation quietly becomes the default | `ai.llm.escalation.rate` alert with a hard target |
| Cache serves stale business data | **Never cache tool results — only pure-text completions.** Business data always goes live. This rule does not bend. |
| MiniMax spec/pricing churn | One adapter class; pin the model name in config, not code |
| `/anthropic` shim tool-call flakiness | Use the native OpenAI-compatible endpoint only |
| Reasoning tokens can't be disabled on M2.x | Budget for them; measure real vs. billed output |

## Demo script (90 seconds — use it as the opening, not the closing)

1. Grafana: tier mix pie — 88% tier 0, 12% MiniMax. Cost today: $0.31.
2. Ask a simple question → answer served locally, `ai.llm.tier=0`, cost 0.
3. Ask a hard multi-step question → watch it escalate in the trace, with `route.reason=tool_depth`.
4. Ask something containing a customer phone number → PII scrubber fires, escalation **denied by OPA**,
   answered locally. Show the audit line.
5. Kill network access to `api.minimax.io` → the system keeps working on tier 0.

Step 5 is the one judges remember: the system degrades instead of dying.

## Effort

~6 days, +2 for prompt logging. Everything else in this folder gets cheaper after it.
