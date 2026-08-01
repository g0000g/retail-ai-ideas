# Idea 07 — Voice assistant for POS & store staff

> **Blueprint source:** `nemotron-voice-agent`
> **New infra:** none (cloud profile is CPU-only) · **GPU:** none · **Effort:** M (2.5 weeks) · **Verdict:** medium — Vietnamese ASR/TTS is the deciding risk

## Pitch

Hands-free store operation. A cashier with a customer in front of them and both hands on products says:

- *"còn size 90 màu xanh không?"* → stock across this store + nearby stores
- *"giá bao nhiêu sau khuyến mãi?"* → price + applied offers
- *"đơn hàng của số 0909…"* → order status
- *"tạo đơn nháp 2 cái SKU này"* → draft order via `pos-mcp`

Sub-second latency, barge-in interruption support, runs in the POS Electron shell's WebView.

## Why it's plausible here

- The blueprint's **cloud profile is explicitly CPU-only** — ASR, LLM, TTS all via NVIDIA hosted
  endpoints / NVCF. No GPU in the store, no GPU on our server.
- `pos-mcp` already exposes POS menu + draft-order tools on `:8110`. The voice agent's tool layer is done.
- The POS frontend is **Angular + Electron** — a WebRTC voice panel is a component, and Electron gives
  reliable mic access without browser permission friction.

## Architecture

```
POS (Angular + Electron)
  mic ──WebRTC/WebSocket──▶ voice-gateway (Pipecat container, CPU)
                                 ├─ ASR   parakeet-multilingual / nemotron-streaming (hosted)
                                 ├─ LLM   nemotron-3-nano-30b  ──tools──▶ ai-service MCP :8120
                                 │                                       pos-mcp     MCP :8110
                                 └─ TTS   magpie-multilingual (hosted)
  speaker ◀──────────────────────┘
```

Pipecat is Python — one container. It is a *media pipeline*, not business logic, so it doesn't pollute the
Java architecture. All business calls go through the existing MCP tool contracts.

## The Vietnamese problem — decide this in week 1

This is the whole feasibility question. Spend two days, not two weeks:

1. Record 50 real cashier utterances (product names, SKU codes, phone numbers, sizes/colours, mixed
   VN/English brand names — "Meiji", "size ét-xì-lờ", "sờ-ku").
2. Measure WER on `parakeet-multilingual` and `nemotron-streaming`.
3. Measure TTS naturalness on `magpie-multilingual` for Vietnamese.

**Decision gate:**

| Result | Action |
| --- | --- |
| WER < ~15% on product/number utterances | Build it |
| WER 15–30% | Build it **voice-in / text-out only** — display the answer on the POS screen, skip TTS. Removes the entire TTS risk and is arguably better UX in a noisy store. |
| WER > 30% | Drop the idea, reallocate to [Idea 01](01-retail-copilot-mcp.md) |

Additional mitigations that materially help:
- **Domain biasing / hotword list** — feed the store's top-500 SKU names + brand names to the ASR as bias
  terms. This is the single highest-leverage fix for retail ASR.
- Numbers and SKU codes are the worst case: always echo them on screen for visual confirmation before acting.
- Store noise: push-to-talk instead of always-listening. Also solves privacy and cost.

## Build steps

1. **(2 days) ASR/TTS benchmark + decision gate.** Do not skip.
2. (3 days) Pipecat container, WebRTC to Electron, push-to-talk.
3. (3 days) Tool wiring to `ai-service` + `pos-mcp`; short, transaction-oriented system prompt.
4. (2 days) On-screen transcript + result cards; confirm-before-write on any draft-order action.
5. (2 days) Barge-in, timeouts, graceful "tôi không nghe rõ" fallback to text input.
6. (2 days) ASR hotword biasing from the store's SKU list.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Vietnamese ASR accuracy** | The decision gate above. This is a go/no-go, not a mitigation. |
| Store background noise | Push-to-talk, headset mic, VAD tuning |
| Latency over the corporate network to hosted NIM | Measure early; the MITM proxy adds real overhead. Sub-second is the blueprint's number on a clean network. |
| Voice cost per store per day | Push-to-talk caps it. Estimate before piloting. |
| POS is offline-first — voice needs network | Detect offline and hide the voice affordance. Do **not** try to degrade gracefully mid-utterance; POS offline sync is already complex enough. |
| Customer privacy (recording in-store) | Push-to-talk only, no persistent audio storage, transcript retention policy |

## Demo script (3 minutes)

1. Cashier, hands full, push-to-talk: *"còn sữa Meiji 800g không?"* → stock across stores, spoken + on screen.
2. *"giá sau khuyến mãi?"* → follow-up resolved in context.
3. *"tạo đơn nháp 2 hộp"* → draft order, **confirmation prompt before it writes**.
4. Show the transcript panel and the OTel trace: voice → LLM → MCP → `stock-service`, one trace.
5. Say something ambiguous → it asks instead of guessing.

## Effort

~14 dev-days **after** a passing decision gate. Treat the 2-day benchmark as a separate, standalone spike:
it is cheap, and its result is useful regardless of whether this idea is chosen.
