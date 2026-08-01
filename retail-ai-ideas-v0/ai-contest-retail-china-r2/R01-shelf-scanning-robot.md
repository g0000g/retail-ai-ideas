# R01 — Shelf-scanning robot: the robot is a camera on wheels

> **Tier C — one rented/borrowed robot for the demo** · **Effort:** M (~3 weeks on top of C05) · **Verdict:** ⭐ best demo in this folder

## Why the category is proven, and what that means for us

Simbe's Tally has ten years of deployment behind it:

| Fact | Source |
| --- | --- |
| **Tally 4.0** (Jan 2026, shipping mid-2026): up to **12 h runtime**, CV on NVIDIA infrastructure; **10 countries, ~60 retailers**, grocery/club/farm-supply/home-improvement | [Shelby Report](https://theshelbyreport.com/2026/01/14/simbe-introduces-improved-tally-4-0-shelf-scanning-robot/) |
| Ten-year claim: **600M shelf gaps detected, 80M promotion errors fixed** | [PR Newswire](https://www.prnewswire.com/news-releases/simbe-marks-10-years-of-tally-the-robot-600m-shelf-gaps-detected-80-million-promotion-errors-fixed-and-a-new-era-of-retail-store-intelligence-302612437.html) |
| **Full scan of a 45,000 sq ft grocery store in <60 min**, **98%+ recognition** for trained SKUs, **2–3 scans/day vs once weekly manual**. **$30k–50k/store/year** vs **$80k–300k+** benefit → **2–5× first-year return**. Needs **~36 in of clear aisle**; run **off-peak** | [Robotomated](https://robotomated.com/learn/retail/retail-shelf-scanning-robots) |
| Schnuck Markets was the **first grocer chain-wide**; BJ's the first wholesale club | [Simbe](https://www.simberobotics.com/) |

**The important observation: the robot is the least interesting part.** It is a camera on wheels running
off-peak. The value is in **perception + business integration**, and we have already planned both:

- **[C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)** — PP-ShiTuV2, *which SKU is this?*, **no retraining when new SKUs appear**
- **[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md)** — RT-DETRv2 + occupancy ROIs, *is there a gap?*
- **[I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md)** — *which SKU should be here?*

R01 adds **mobility**, and nothing else. That is why it is only ~3 weeks on top of C05.

## Architecture

```
ROBOT  (rented base — any Nav2-capable AMR, or a vendor unit with an API)
  ├─ Cartographer / AMCL localisation on a pre-built store map
  │    ("de facto standard for production AMRs … works well in structured
  │      indoor environments like warehouses" — and a supermarket aisle is one)
  ├─ Nav2 route following along the scan path
  ├─ camera mast (2–3 cameras, shelf-height coverage)
  └─ on-box compute
        ├─ RT-DETRv2  → shelf-bay occupancy / gaps        (V04)
        ├─ PP-ShiTuV2 → SKU identity per crop, vector retrieval  (C05)
        └─ MiniCPM-V 1.3B → optional VLM verification pass on-box
             (4×/16× visual token compression — see 00-oss-round2-additions.md §3)
        ▼  JSON metadata only. No video leaves the store.
  MQTT (Mosquitto — already the store-device channel)
        ▼
  MQTT → Kafka bridge (schema in Apicurio)
        ▼
  ├─ stock-service     count vs system stock → reconciliation task
  ├─ I03 planogram     compliance deviation → merchandising task
  ├─ price-service     ESL/label price vs system price → PROMOTION ERROR
  └─ Grafana           availability %, gap-hours, scan coverage

FLEET LAYER (R02) — the scan is just another RMF task:
  planogram published → scan route over changed aisles, overnight, low priority
  shelf-gap event     → targeted re-scan of that bay, within the hour
```

**Promotion-error detection is the sleeper feature.** Simbe's headline number is *80M promotion errors
fixed*, not gaps found. A wrong shelf label is a direct margin leak and a compliance issue, it is trivially
detectable once you can read the label and query `price-service`, and **no other plan in the five folders
catches it**.

## Scoping decisions that make this shippable

1. **Off-peak only.** ~36 inches of clear aisle is required, and SLAM benchmarks are explicit that
   *"mainstream SLAM and point-cloud registration methods typically assume static environments"* — a
   trading-hours aisle is worse than a warehouse. Night or early morning, like every deployed system.
2. **2D SLAM, not 3D.** Cartographer/AMCL on a flat store floor. FAST-LIO2 and friends earn their keep with
   ramps and mezzanines; a supermarket has neither.
3. **Rent or borrow one unit.** Do not buy a fleet for a contest. Vendors lend demo units; ask.
4. **Recognition thresholds are the deliverable**, not top-1 accuracy — report **precision at the
   auto-accept threshold** and the three-way decision (identified / confirm / unknown) from C05.

## Sample repos

| Layer | Repo | Licence |
| --- | --- | --- |
| Navigation | Nav2 (ROS 2 Jazzy) | Apache-2.0 / BSD |
| Localisation | **Cartographer** + AMCL | Apache-2.0 (verify) |
| Fleet | [open-rmf/rmf](https://github.com/open-rmf/rmf) · [free_fleet](https://github.com/open-rmf/free_fleet) | Apache-2.0 |
| Bridge reference | [Ekumen-OS/andino_rmf](https://github.com/Ekumen-OS/andino_rmf) | — |
| SKU identity | [PaddlePaddle/PaddleClas](https://github.com/PaddlePaddle/PaddleClas) PP-ShiTuV2 | **Apache-2.0** |
| Gap detection | RT-DETRv2 + ByteTrack | Apache-2.0 / MIT |
| On-box VLM | [OpenBMB/MiniCPM-V](https://github.com/openbmb/MiniCPM-V) | Apache-2.0 (verify) |
| Simulation first | Gazebo Harmonic + [R06](R06-digital-twin-simulation.md) | Apache-2.0 |
| Bootstrap data | SKU-110K · RP2K · Products-10K | public datasets |

## Build steps

**Phase 0 — simulate before renting (uses [R06](R06-digital-twin-simulation.md), 0 extra days)**
Route, coverage and scan-time estimates come out of the twin. Rent the robot only after the twin says the
route works.

**Phase 1 — mobility (6 days)**
1. Map the demo store with Cartographer; define the scan route as RMF waypoints.
2. Nav2 route following, off-peak schedule, docking/charging.
3. Register the robot as an RMF fleet ([R02](R02-fleet-orchestration-openrmf.md)) so the scan is a task,
   not a script.

**Phase 2 — perception on the move (5 days)**
4. Camera mast + capture triggered by waypoint, not by timer — position-tagged images are what make the
   output joinable to a planogram.
5. C05 pipeline on-box; V04 gap ROIs keyed to bay IDs from the I03 planogram.
6. N-of-M verification before publishing anything, as in V04.

**Phase 3 — business integration (5 days)**
7. MQTT→Kafka event with an Apicurio-registered schema.
8. `stock-service` reconciliation task; I03 compliance deviation; **price/label mismatch → promotion-error task**.
9. Grafana: availability %, gap-hours per aisle, scan coverage, promotion errors found.

**Phase 4 — measurement (3 days)**
10. Holdout per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md): scanned aisles vs
    manually-audited aisles. Primary metric **on-shelf availability**; secondary gap-hours, promotion
    errors, and staff hours saved.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No robot available** | Phase 0 + R06 give a full simulated demo. Rent one unit for the live segment; if none, present the twin and say so. |
| Catalogue gallery is studio renders, not shelf images | C05's known #1 risk — measure gallery quality first, add in-store gallery images |
| Aisle clearance <36 in | Survey the demo store before committing; some aisles will be excluded, report which |
| Customers/trolleys during scanning | Off-peak only. Person-overlap suppression on ROIs, as in V04. |
| Robot bumps a display | Speed limit, conservative inflation radius, and [R10](R10-robot-fleet-governance.md)'s incident registry from day one |
| Over-claiming accuracy | Report precision at the auto-accept threshold and the unknown-rate. "98%+ for SKUs in the training set" is Simbe's number, not ours. |
| Privacy | Products only, no faces. Same rules as V04. Signage. |
| Scope creep into buying a fleet | One unit, one store, one metric. |

## Demo script (3 minutes)

1. Twin first: the planned scan route and estimated coverage time, from [R06](R06-digital-twin-simulation.md).
2. The real robot runs a short aisle segment; on-screen: gaps detected, SKUs identified, one item honestly
   returned as **unknown**.
3. Back-office: reconciliation task raised in `stock-service` with a bay thumbnail.
4. **Promotion error:** shelf label says ¥19.9, `price-service` says ¥22.9 → task raised, with the value at risk.
5. Planogram compliance view against the [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) plan.
6. Show the scan is an **RMF task**, not a script — cancel it from the fleet console mid-run.
7. Slide: on-shelf availability, treated vs control aisles, next to Simbe's published economics as *context,
   not as our claim*.

## Effort

~19 dev-days **on top of [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)** and
assuming [R02](R02-fleet-orchestration-openrmf.md) exists. Standalone it would be roughly double — build the
perception and the fleet layer first.
