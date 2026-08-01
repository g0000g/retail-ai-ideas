# W06 — Fixed-camera shelf intelligence (the Bossa Nova lesson, built)

> **Driver:** *"Investment in fixed camera technologies … imperils the value proposition of robotic shelf scanning."* · **Effort:** M (~3 weeks) · **Verdict:** ⭐ better than a robot for the Western market

## The story this plan is built on

Walmart deployed **Bossa Nova** shelf-scanning robots in **500+ stores** from 2017, announced expansion to
**1,000 stores**, then **cancelled the contract in November 2020**. Bossa Nova laid off **50% of its
staff**. Three years earlier Walmart had called the robots *"50% more productive and three times faster
than a human"* at inventory-taking.

**All three stated reasons were non-technical:**

1. **Labour substitution flipped the ROI** — the pandemic put more workers in aisles picking for delivery,
   so *"they could scan shelves instead of the robots."*
2. **Customer discomfort** — Walmart US CEO John Furner worried about *"how customers reacted to the large,
   six-foot-tall machines scanning shelves while they shopped."*
3. **Simpler alternatives won** — *"simple and cost-effective ways to manage shelf products with workers."*

**What survived:** floor-cleaning robots that also upload inventory **stayed** (Brain Corp's niche), and
**Schnuck Markets expanded Simbe's Tally to 62 Midwest locations.**

→ [`00-west-market-research.md`](00-west-market-research.md) §2 for the full five lessons and sources.

## The design that follows

The recommended answer in the same reporting is explicit: **a hardware-agnostic approach combining
shelf-edge and ceiling cameras alongside autonomous robots gives more complete store coverage.**

So W06 is **[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) without the robot**, and with
the coverage problem solved by placement instead of motion:

| | Robot ([R01](../ai-contest-retail-china-r2/R01-shelf-scanning-robot.md)) | **Fixed cameras (W06)** |
| --- | --- | --- |
| Coverage | complete, but only when it passes | **continuous** on covered bays, **zero** elsewhere |
| Frequency | 2–3 scans/day | **continuous** — a gap is detected in minutes, not hours |
| Customer presence | **six-foot machine in the aisle** — the stated failure reason | **invisible** |
| Aisle clearance | needs ~36 in | irrelevant |
| Cost shape | $30k–50k/store/year (Simbe economics) | capex per camera, no vendor subscription, no aisle time |
| Failure mode | robot down → no data at all | one camera down → one bay blind |
| Blocked by shoppers | must wait or re-plan | occlusion suppression, same as V04 |
| Coverage of low-value aisles | free (it drives past) | **costs a camera** — this is the real trade-off |

**The honest trade-off: fixed cameras cost per bay, robots cost per store.** So the correct design is
**selective**: cameras on the bays where out-of-stock costs the most, and nothing on the long tail. That is
a merchandising decision driven by [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md)'s
contribution data — not a technology decision.

## Architecture

```
IN STORE
  shelf-edge + ceiling cameras on SELECTED bays
     (chosen by lost-sales-per-out-of-stock-hour, from I03 contribution × V03 forecast)
        ▼
  edge box — the same ~$150–300 Intel N100 + OpenVINO from V04
     ├─ RT-DETRv2 (Apache-2.0)     shelf-bay occupancy / gaps
     ├─ PP-ShiTuV2 (Apache-2.0)    which SKU is on the facing        ← C05, unchanged
     ├─ MiniCPM-V 1.3B             on-box verification pass          ← round-2 addition
     ├─ price/ESL label read       → PROMOTION-ERROR detection       ← R01's sleeper feature, kept
     └─ occlusion suppression      skip a bay while a person overlaps it
        ▼  JSON metadata only. No video leaves the store.
  MQTT (Mosquitto, already the store-device channel) → Kafka (Apicurio schema)
        ▼
  ├─ stock-service   gap → replenishment task, count → reconciliation
  ├─ I03 planogram   compliance deviation → merchandising task
  ├─ price-service   label vs system price → promotion-error task
  └─ Grafana         on-shelf availability, gap-hours per bay, promotion errors
```

**Everything below the camera is already planned.** V04 built the gap detection and the MQTT→Kafka path;
C05 built the SKU identity; I03 built the planogram. W06 changes **only the sensor placement** — and that
single change removes the three reasons Bossa Nova failed.

## The lesson that matters most, encoded

> **"Trust is the binding constraint. Solutions must be accurate, actionable and frequent, or vendors lose
> retailers' and associates' trust — inaccurate data creates additional work instead of freeing associates
> up."**

Three design rules fall out of it, and they are the difference between this working and this being ignored:

1. **Actionable, not informational.** Never emit *"bay 3 looks empty."* Emit *"replenish SKU-1234 in bay 3,
   12 units in the back room, estimated lost sales €48/hour."* A task with a quantity and a value, or
   nothing.
2. **A false positive costs more than a miss.** An associate walking to a full shelf loses trust
   permanently. **Tune the threshold for precision, not recall**, and report precision at the operating
   point — same rule as C05.
3. **Measure the response, not the detection.** The KPI is **gap-hours closed**, not gaps found. A
   detection nobody acts on is worse than no detection, because it cost someone a walk.

## Sample repos

| Layer | Repo | Licence |
| --- | --- | --- |
| Gap detection | RT-DETRv2 · ByteTrack | Apache-2.0 / MIT |
| SKU identity | [PaddlePaddle/PaddleClas](https://github.com/PaddlePaddle/PaddleClas) PP-ShiTuV2 | Apache-2.0 |
| Label OCR | [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Apache-2.0 |
| On-box VLM | [OpenBMB/MiniCPM-V](https://github.com/openbmb/MiniCPM-V) | Apache-2.0 ⚠ verify |
| Edge runtime | OpenVINO | Apache-2.0 |
| Transport | Mosquitto MQTT → Kafka | already deployed |

❌ **Not used:** Ultralytics YOLO (AGPL-3.0 network clause). Same exclusion as every other folder.

## Privacy — stricter in the EU than the China plan assumed

GDPR plus the AI Act's **emotion-recognition prohibition** make this tighter than
[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md)'s baseline:

| Rule | Note |
| --- | --- |
| **No face recognition, no biometric identification** | GDPR Art. 9 special category; and in-store biometric categorisation is an AI Act prohibited practice territory — do not go near it |
| **No emotion or sentiment inference, on customers or staff** | **absolute prohibition since Feb 2025** for employees/candidates; and pointless for customers. Audit for it ([W01](W01-eu-ai-act-compliance-layer.md) step 8) |
| **No staff monitoring** | declining to build it is the answer, as in V04 and R10 |
| Cameras point at **shelves**, not aisles | placement is the privacy control. A shelf-edge camera framing a bay sees products, not people |
| Person detection only for **occlusion suppression** | box-level, no tracking across frames, no identity, discarded immediately |
| Metadata only leaves the store | thumbnails of **shelves** for tasks, retained days not months |
| GDPR | DPIA before deployment, signage, lawful basis documented |

**Camera placement is the privacy argument.** A shelf-edge camera 40cm from a bay, framing the bay, is a
fundamentally different privacy proposition from a ceiling camera surveying an aisle — and it is also
better for the detection task. Design and compliance agree here, which is rare and worth saying.

## Build steps

1. **(2 days)** **Bay selection**: rank bays by lost-sales-per-out-of-stock-hour using
   [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) contribution ×
   [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) forecast. Produces the camera count and
   the capex number — **this is the business case, and it comes first.**
2. **(3 days)** Camera + edge-box install on the demo bays; calibration per install (the physical world
   needs tuning).
3. **(3 days)** Reuse V04's gap detection + C05's SKU identity on the fixed viewpoint. A fixed viewpoint is
   **easier** than a moving one — no motion blur, no localisation, stable ROIs.
4. **(2 days)** Occlusion suppression + N-of-M temporal verification.
5. **(3 days)** **Actionable task generation**: SKU + quantity + back-room stock + estimated lost sales.
   Into `stock-service`.
6. **(2 days)** Promotion-error detection from the label read vs `price-service`.
7. **(2 days)** GDPR DPIA, signage, retention job, and the W01 emotion-recognition audit entry.
8. **(2 days)** Measurement: **on-shelf availability** and **gap-hours closed**, treated bays vs control
   bays ([I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) holdout).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Cost per bay doesn't scale to a full store** | It isn't meant to. Selective by lost-sales value — step 1 is the gate, and the honest answer for the long tail is "no camera" |
| False positives destroy trust | Precision-tuned threshold, N-of-M verification, precision reported at the operating point |
| Detections nobody acts on | KPI is **gap-hours closed**, not gaps found. If the response rate is low, the tasks aren't actionable enough — fix the task, not the model |
| Lighting / planogram resets | Re-calibrate on planogram publish — I03 and the cameras are naturally coupled |
| GDPR / DPIA | Step 7, before deployment, not after |
| Someone asks "why not a robot?" | **That is the best question in the demo.** The answer is Bossa Nova, with the three reasons. |
| Fixed cameras are less flexible than a robot | True. Robots re-route; cameras don't. State it, and note the hybrid the sources actually recommend: cameras on high-value bays **plus** a cleaning robot that also uploads inventory — the configuration that survived at Walmart |

## Demo script (3 minutes)

1. Open with the story: **500 stores, cancelled, 50% layoffs — and the three reasons were labour economics,
   customer discomfort, and simpler alternatives.**
2. Bay-selection output: 40 cameras cover the bays representing 62% of out-of-stock lost sales. Here is the
   capex and the payback.
3. Live: remove a facing → **task appears in under a minute** with SKU, quantity, back-room stock and
   estimated lost sales per hour. Point out it is *actionable*, not informational.
4. Promotion error: shelf label €19.90 vs `price-service` €22.90 → task with the value at risk.
5. Occlusion: a shopper stands in front → the bay is suppressed, not falsely reported.
6. Privacy: the camera view — **it frames a shelf, not an aisle.** No faces, no tracking, metadata-only
   egress, DPIA on file, emotion inference audited and absent.
7. Close: **gap-hours closed**, treated vs control bays.

## Effort

~19 dev-days, reusing V04, C05 and I03 unchanged. Cheaper than R01 (no robot, no fleet layer, no
localisation) and, on the Western evidence, more likely to still be running in two years.
