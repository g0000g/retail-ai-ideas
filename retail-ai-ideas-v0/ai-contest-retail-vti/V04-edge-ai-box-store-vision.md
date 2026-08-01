# V04 — Edge "AI box": shelf gaps, queues, heatmaps, footfall

> **VTI source:** "AI box technology", "Computer Vision", "Heatmaps and customer analytics", "Remote store monitoring", "IoT sensors for retail" — plus "ParkingX Smart LPR" folded in
> **Local model:** RT-DETRv2 (Apache-2.0) + ByteTrack (MIT), OpenVINO or Hailo runtime · **MiniMax:** no
> **New infra:** 1 edge box per demo store (~$150–300) · **GPU:** none in the datacentre · **Effort:** M (~3 weeks) · **Verdict:** ⭐ most demoable

## Pitch

A cheap box in the store turns one camera into four business signals, and sends **metadata only** — never
video — to the platform:

| Signal | Business action | Consumer |
| --- | --- | --- |
| **Shelf gap / out-of-stock facing** | task to store staff + reconciliation vs system stock | `stock-service` |
| **Queue length & wait time** | "open another till" alert to the store manager | notification + Grafana |
| **Footfall & dwell heatmap** | conversion rate (visitors → transactions), planogram decisions | analytics |
| **Vehicle plate at pickup bay** (ParkingX idea) | BOPIS order flipped to "customer arrived" | `order-service` O2O |

## Why this beats the NVIDIA VSS plan

The other set's shelf-video idea ([`../ai-contest-retail/09-shelf-video-intelligence.md`](../ai-contest-retail/09-shelf-video-intelligence.md))
was ranked lowest because it needed a validated topology of 2×RTX PRO 6000 and a live CCTV feed. Four
independent blockers.

Reframing it as VTI does — **an AI box at the edge** — removes three of them:

| Blocker in the VSS version | Here |
| --- | --- |
| Datacentre GPU | ❌ not needed. Intel N100 + OpenVINO (~$150) or RPi5 + Hailo-8L (~$250) runs RT-DETRv2 at a few FPS, which is plenty for shelf and queue analytics |
| Streaming video off-site (bandwidth) | ❌ not needed. Inference is local; only JSON metadata leaves. A few hundred bytes per second. |
| CCTV vendor API access | ❌ not needed. Use our own USB/IP camera on the box. |
| Elasticsearch 8.x backend | ❌ not needed. Metadata → MQTT → Kafka → Postgres. All already running. |
| Privacy | ⚠ **still real** — but far more defensible when no video ever leaves the store and no faces are recognised. See § Privacy. |

And the transport already exists: **Mosquitto MQTT is already the store-device channel** (the POS offline
sync uses it), so the edge box is just another MQTT publisher.

## Architecture

See `diagrams/vti-04-edge-ai-box.drawio.png`.

```
IN STORE (edge box, ~$150-300)
  camera → frame sampler (1-5 FPS, not 30)
     ├─ RT-DETRv2 (Apache-2.0, OpenVINO/Hailo)   person · shopping basket · shelf region · vehicle
     ├─ ByteTrack (MIT)                          track IDs for dwell time and queue duration
     ├─ shelf-gap detector                       ROI per shelf bay: occupancy ratio vs a reference frame
     └─ plate OCR (PaddleOCR, Apache-2.0)        pickup bay only
              ▼   JSON metadata only. Frames never leave the box.
        Mosquitto MQTT   store/{storeId}/vision/{signal}
              ▼
PLATFORM
  MQTT→Kafka bridge  ──▶  Kafka topic (schema registered in Apicurio, `mvn verify -Pschema-registry` gate)
              ├─▶ stock-service       shelf-gap event → reconciliation task
              ├─▶ order-service       plate matched → BOPIS "customer arrived"
              ├─▶ Postgres            footfall / dwell / queue time series
              └─▶ Grafana (LGTM already deployed)  live store dashboard + alert rules
```

**Two-pass verification for anything that raises an alert.** A single frame saying "shelf empty" is noise.
Require N consecutive samples over M seconds, plus a confirming re-check, before publishing. This is the one
genuinely useful idea to lift from the VSS blueprint (its "alert verification to reduce false positives"),
and it works just as well with a rules-based second pass as with a VLM.

## Shelf-gap detection, scoped honestly

Full planogram compliance ("is the right SKU in the right facing?") is a hard, expensive, per-store
annotation project. Do **not** promise it.

What is achievable in three weeks:
- Operator draws **shelf-bay ROIs** once per camera, in a small web tool.
- Per ROI, compute an **occupancy ratio** against a "full" reference frame (classical CV: edge density +
  background difference, no training needed). Below a threshold for N samples → gap event.
- The event says *"bay 3, shelf 2 looks empty"*, not *"SKU 12345 is out of stock"*. `stock-service` joins it
  to the planogram mapping if one exists, otherwise it's a staff task with a photo thumbnail.

That is genuinely useful and completely defensible. Optional stretch: crop the bay and ask a small VLM
(Qwen3-VL) *"is this shelf empty, partially stocked, or full?"* as the second verification pass — a handful
of calls per hour, so cost stays near zero.

## Privacy — decide this before writing code

Non-negotiables:
- **No face recognition, no face embeddings, no identity.** Person detection returns a box and a track ID
  that dies when the person leaves the frame. Nothing links a track to a human.
- **No video leaves the box.** No cloud upload, no recording by default. Thumbnails only for shelf gaps
  (a shelf, not a person), retained days not months.
- **Signage** at the entrance, in Vietnamese, per Decree 13/2023/ND-CP and the Personal Data Protection Law
  in force from 2026. Confirm the exact obligations with legal.
- **Staff monitoring is out of scope.** Do not build shrinkage-by-cashier or productivity-per-employee
  analytics for a contest. It has labour-relations consequences and it will be the first thing a thoughtful
  judge asks about. Declining to build it is a better answer than a mitigation.
- Plate recognition is limited to the **pickup bay**, matched only against plates the customer voluntarily
  registered with their BOPIS order, and deleted after the pickup.

## Hardware options

| Box | ~Cost | Runtime | Notes |
| --- | --- | --- | --- |
| Intel N100 mini-PC (16GB) | ~$150 | OpenVINO (Apache-2.0) | Cheapest, x86, easiest to develop on, no accelerator drama. A few FPS on RT-DETRv2-S is enough |
| RPi 5 + Hailo-8L HAT | ~$250 | Hailo SDK | More TOPS/watt, more integration work, vendor SDK |
| Reuse a spare laptop | $0 | OpenVINO | **Do this for the contest demo.** Buy hardware only if it goes to a pilot |

Start on a spare laptop. The demo is identical and the procurement cycle isn't in the critical path.

## Build steps

1. **(3 days)** Frame sampler + RT-DETRv2 via OpenVINO on a laptop. Verify FPS and mAP on our own footage.
2. **(2 days)** ByteTrack integration → dwell time, queue duration, footfall counts.
3. **(3 days)** ROI tool + occupancy-ratio shelf-gap detector + N-of-M verification.
4. **(2 days)** MQTT publisher, topic + payload schema, **registered in Apicurio like every other event**.
5. **(3 days)** MQTT→Kafka bridge; `stock-service` consumer raising a reconciliation task; Postgres sink for
   the time series.
6. **(3 days)** Grafana dashboard: live footfall, queue-time SLO, conversion rate, open shelf gaps. Alert
   rules ("queue > 4 people for > 3 min"). The LGTM stack is already deployed, so this is dashboard JSON.
7. **(2 days)** Plate OCR on the pickup bay → `order-service` O2O "customer arrived".
8. **(2 days)** Heatmap rendering in the back-office.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Camera angle / lighting** ruins accuracy | Fix the camera position once, calibrate ROIs per install. Budget a calibration step per store — the physical world needs tuning a model can't see. |
| False shelf-gap alerts destroy staff trust | N-of-M verification + optional VLM second pass. Report precision/recall on a labelled clip set, honestly. |
| Occlusion (shopper standing in front of the shelf) | Suppress ROI evaluation while a person box overlaps it. Cheap and effective. |
| **YOLO licence trap** | We use RT-DETRv2 (Apache-2.0) + ByteTrack (MIT). Ultralytics YOLO is AGPL-3.0 with a network clause — see `00-model-stack.md` § 10. Saying this out loud is a credibility win. |
| Privacy / labour objections | See § Privacy. No faces, no video egress, no staff monitoring, signage. |
| Edge box offline | Buffer metadata locally, publish on reconnect. Same pattern the POS offline sync already uses. |
| Plate OCR accuracy on VN plates | Restrict to registered plates for pending BOPIS orders — matching against a 5-plate candidate list is a far easier problem than open recognition. Fall back to a name/phone check. |

## Demo script (3 minutes — this is the segment people remember)

1. Live camera on a mock shelf. Remove a row of products → within ~15 seconds a **shelf-gap task appears in
   the back-office** with a thumbnail, and `stock-service` shows a reconciliation task. Real event, real path.
2. Walk three people into frame → queue length rises on the Grafana panel → the "open another till" alert fires.
3. Heatmap after two minutes of walking around — dwell concentrated where you stood.
4. Hold up a plate on paper at the "pickup bay" → the matching BOPIS order flips to *customer arrived*.
5. Show the network tab / MQTT payload: **JSON only, no frames.** Then show the licence register: RT-DETRv2
   Apache-2.0, ByteTrack MIT, PaddleOCR Apache-2.0. No AGPL, no non-commercial weights.

## Effort

~20 dev-days on a laptop; hardware only if it goes to pilot.
