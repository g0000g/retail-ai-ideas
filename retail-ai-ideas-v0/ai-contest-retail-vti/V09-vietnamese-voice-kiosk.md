# V09 — Vietnamese voice kiosk / virtual receptionist

> **VTI source:** "Virtual Receptionist" (proprietary product), "Smart retail devices"
> **Local model:** **`vinai/PhoWhisper`** + viXTTS / Piper `vi_VN` + `qwen3.5:4b` · **MiniMax:** yes, for open-ended questions
> **New infra:** none (model sidecar) · **GPU:** none · **Effort:** M (~2.5 weeks) · **Verdict:** high — **Vietnamese is solved here**

## Pitch

A screen-and-microphone kiosk near the store entrance (or the same stack embedded in the POS for staff):

- *"Sữa Meiji 800g ở đâu?"* → aisle + shelf, on screen and spoken
- *"Có khuyến mãi gì cho hàng sữa không?"* → live offers from `promotion-service`
- *"Còn size 90 màu xanh không?"* → stock in this store + nearest store that has it
- *"Đơn hàng của số 0909…"* → order status (with a privacy step, see below)
- *"Nhà vệ sinh ở đâu?"* / *"Mấy giờ đóng cửa?"* → store info

## Why this succeeds where the NVIDIA voice plan hedged

The other set's voice idea ([`../ai-contest-retail/07-voice-pos-assistant.md`](../ai-contest-retail/07-voice-pos-assistant.md))
had a go/no-go decision gate because Vietnamese ASR quality on a generalist hosted model was unknown.

**PhoWhisper removes that gate.** It is Whisper fine-tuned by VinAI on **844 hours** of Vietnamese from
Common Voice-vi, VIVOS, VLSP 2020 and a private corpus of **26,000 speakers across all 63 provinces and
municipalities**, with noise augmentation applied to half the training set. That is not a generic
multilingual model that happens to include Vietnamese — it is built for regional accents in noisy
conditions, which is the in-store problem exactly.

Runs on CPU via `faster-whisper` (CTranslate2, int8). No GPU, no cloud, no per-minute ASR bill.

**Stated limitation, honestly:** on out-of-domain audio PhoWhisper-large reached **38.3% WER** on the
VietLyrics set. Read and conversational speech is its strength; singing, heavy overlap and shouting are not.
So: push-to-talk, a directional mic, and a hotword bias list for SKU and brand names.

## Architecture

```
Kiosk (browser on a cheap Android/x86 panel, or the POS Electron shell)
  push-to-talk mic  ──WebSocket audio──▶  voice sidecar (Python, CPU)
      ├─ VAD (silero, MIT)
      ├─ ASR   PhoWhisper-medium via faster-whisper int8
      │          + hotword/bias list: top 500 SKU names + brands per store
      ├─ intent + slots   qwen3.5:4b, schema-constrained  (tier 0)
      │          escalate open-ended questions to MiniMax-M2.5  (tier 2)
      ├─ tools ──▶ ai-service MCP :8120        search_product · get_stock_availability
      │                                         get_price_for_channel · get_applicable_promotions
      │            ──▶ store info table         aisle map · hours · facilities
      └─ TTS   viXTTS or Piper vi_VN
  screen: transcript + result cards + aisle map     speaker: spoken answer
```

**Screen-first, voice-second.** Always render the answer as cards on the display, then speak it. A noisy
store, a hard-of-hearing customer, or a mis-heard SKU code are all handled by the screen. This also means a
partial ASR failure degrades to "point at the right thing" instead of failing.

**Reuse, don't rebuild:** the MCP tools this needs are the same ones the other set's Retail Copilot defines
(`search_product`, `get_stock_availability`, `get_price_for_channel`, `get_applicable_promotions`). Build them
once in `ai-service`.

## Where the tiers split

| Turn type | Tier | Why |
| --- | --- | --- |
| ASR | tier 0 PhoWhisper | local, free, best-in-class for Vietnamese |
| Intent + slot extraction | tier 0 `qwen3.5:4b` | small, schema-constrained, validator behind it |
| Tool result → short spoken sentence | tier 0 | template + light generation; short outputs suit CPU throughput |
| Open-ended / multi-part question | **tier 2 MiniMax-M2.5** | genuine reasoning; also where a 4B on CPU is too slow for conversation |
| TTS | tier 0 | Piper is tiny and fast; viXTTS sounds better |

**Nothing customer-identifying leaves the building.** The order-status flow is the one place PII appears —
handle it locally only, and require an on-screen confirmation of the last 4 digits rather than speaking a
phone number aloud in a public space (see § Privacy).

## Privacy — a public microphone needs rules

- **Push-to-talk only.** No always-listening. This also solves cost, CPU load, and most of the privacy
  objection at once.
- **No audio retention.** Transcribe, act, discard. Keep the text transcript only if the user opts in for a
  support case.
- **No voice identification**, no speaker embeddings, no gender/age inference from voice.
- **Order lookup in a public space:** never speak an address or full phone number. Ask for the last 4 digits
  on the touchscreen, show the result on screen only, auto-clear after 30 seconds.
- Signage in Vietnamese. Basis: Decree 13/2023/ND-CP and the Personal Data Protection Law in force from 2026
  — confirm with legal.

## Build steps

1. **(2 days)** Benchmark PhoWhisper (base/small/medium) on **50 real in-store utterances** — SKU names,
   sizes/colours, mixed VN/EN brands ("Meiji", "size ét", "ét-ku"), digits. Record WER per category. Choose
   the smallest model that clears the bar; measure CPU latency per utterance.
2. **(2 days)** Voice sidecar: VAD → ASR → text out, WebSocket, push-to-talk.
3. **(2 days)** Hotword/bias list built from each store's top-500 SKU and brand names. **This is the single
   highest-leverage accuracy fix for retail ASR** — do it before touching model size.
4. **(3 days)** Intent + slots (tier 0, schema-constrained) → MCP tool calls → result cards.
5. **(2 days)** TTS: Piper `vi_VN` first (fast, tiny), viXTTS as the quality option. Compare on a real speaker.
6. **(2 days)** Aisle-map / store-info data model + the map rendering. Small table, big perceived value.
7. **(2 days)** Barge-in, timeouts, "tôi chưa nghe rõ" fallback to on-screen keyboard, idle reset.
8. **(1 day)** Privacy behaviours: auto-clear, no-audio-retention, last-4-digits confirmation.

## Risks

| Risk | Mitigation |
| --- | --- |
| Store noise | Push-to-talk + directional mic + PhoWhisper's noise-augmented training. Test in a real noisy space, not an office. |
| SKU codes and digits mis-transcribed | Always echo on screen before acting; hotword bias; numeric entry on the touchscreen for anything that matters |
| Regional accent variation | PhoWhisper's 63-province corpus is the mitigation. Still: include southern, central and northern speakers in the 50-utterance benchmark. |
| CPU latency makes it feel sluggish | Measure in step 1. PhoWhisper-small/medium int8 + short outputs; stream the screen card before the audio finishes |
| viXTTS / F5-TTS licence unclear | Piper `vi_VN` is the safe default. Verify each TTS licence individually before shipping (`00-model-stack.md` § 10). |
| Kiosk misuse / children playing with it | Idle reset, profanity filter, no free-form chat mode — it answers store questions, not anything |
| **Aisle-map data doesn't exist** | It doesn't, and it's a manual data-entry job per store. One demo store's map is an afternoon. Say so; don't pretend it's automatic. |
| PII spoken aloud in public | Last-4-digits + screen-only + auto-clear |

## Reuse: same stack, three products

| Deployment | Change needed |
| --- | --- |
| Entrance kiosk (this plan) | — |
| **Voice for POS staff** (the other set's idea 07) | different prompt, adds `pos-mcp` draft-order tools, confirm-before-write |
| **Inbound phone / call-centre assist** | add a telephony bridge; PhoWhisper handles phone-bandwidth audio less well — expect a WER hit and re-benchmark |

Building V09 gets the other two at a large discount. That is worth a slide on its own.

## Demo script (3 minutes)

1. Ask in Vietnamese where a product is → aisle + shelf on screen, spoken, plus stock.
2. Follow up *"còn loại 400g không?"* → resolved in context.
3. Ask about promotions on that category → live offers from the real promotion engine.
4. Ask something outside scope → polite decline + on-screen options, no invention.
5. Have a second person with a different regional accent ask the same question → still works.
6. Show the network panel: **ASR and TTS never left the machine.** Then ask a long open-ended question and
   watch it escalate to MiniMax — with the token cost shown.

## Effort

~16 dev-days, and unlike the other set's voice plan there is **no go/no-go gate** — only a model-size choice
in step 1.
