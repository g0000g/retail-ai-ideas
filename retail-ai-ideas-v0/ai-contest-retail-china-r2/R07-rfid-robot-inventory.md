# R07 — RFID + robot inventory count, fused with vision

> **Tier D — robot + tag infrastructure** · **Effort:** M (~3 weeks software) · **Verdict:** medium — strong where tagging already exists, uneconomic where it doesn't

## The evidence

| Fact | Source |
| --- | --- |
| **Tally carries RFID onboard**: Impinj **Indy R2000** reader + 4 custom antennas, reading at **10–15 ft height** with **~20 ft range** — validated with **Schnuck Markets** and **Decathlon** | [Impinj](https://www.impinj.com/library/blog/rain-rfid-enabled-tally-robot-automates-grocery-store-inventory) · [Simbe](https://www.simberobotics.com/about/newsroom/simbe-adds-rfid-scanner-to-tally-robot) |
| **China produces 60–70% of global UHF RFID tags**; China UHF RFID market **¥8.462B in 2024** | [brrfid](http://www.brrfid.com/show-426.html) |
| Chinese 盘点机器人 requirements: stable QR/barcode/RFID reads under **reflection, occlusion, low contrast**; **real-time WMS/ERP integration with discrepancy reports**; alarm-and-review workflow **with evidence (images + confidence)**; auditable logs. Recommended 2026 process: **"validate first, then deliver"** | [智科云](https://www.shzhikeyun.com/news/hydt/11425.html) |

## The honest economic gate

**RFID only pays where items are already tagged, or where item value justifies tagging.**

| Category | Verdict |
| --- | --- |
| Apparel, footwear, accessories | ✅ tagging is already standard (Decathlon is the reference) |
| Electronics, high-value health/beauty | ✅ item value carries the tag cost |
| Grocery, FMCG, fresh | ❌ **tag cost exceeds item margin.** Vision-only ([R01](R01-shelf-scanning-robot.md)) is the answer here |
| Mixed-format store | 🟡 tag the departments that pay, vision everywhere else — and **the robot carries both sensors on one pass**, which is the actual insight |

**Do not propose blanket RFID for a supermarket.** Proposing it selectively, with the margin argument
stated, is the difference between a credible plan and a vendor pitch.

## Why fuse RFID and vision instead of choosing

They fail differently, and the fusion is strictly better than either:

| | RFID | Vision (PP-ShiTuV2) |
| --- | --- | --- |
| Sees items **behind** other items | ✅ | ❌ occluded |
| Counts exactly | ✅ per-tag | ❌ estimates from facings |
| Works untagged | ❌ | ✅ |
| Knows **where on the shelf** | ⚠ coarse | ✅ bay-level position |
| Detects **misplaced** items | ✅ item is in the wrong zone | ✅ wrong SKU in a bay |
| Reads a **price label** | ❌ | ✅ → the promotion-error check from [R01](R01-shelf-scanning-robot.md) |

**Fusion rules:**
- RFID says *how many exist in this zone*; vision says *how many are visible and where*.
- **RFID count > visible count** → stock is in the backroom or buried → a *replenish the facing* task, not a
  reorder. This distinction is worth real money and neither sensor finds it alone.
- **Vision sees a SKU that RFID doesn't** → untagged item, or a tag failure → data-quality task.
- Disagreement above a threshold → human verification with **evidence attached** (image + confidence),
  which is exactly what the Chinese 盘点 requirements demand.

## Architecture

```
ROBOT (R01's platform — same base, one extra sensor)
  ├─ cameras     → RT-DETRv2 gaps (V04) + PP-ShiTuV2 identity (C05)
  ├─ RFID reader → tag EPCs per zone, with RSSI for coarse localisation
  └─ Nav2 + Cartographer, off-peak, RMF task (R02)
        ▼
  FUSION on-box
     zone-level reconciliation: RFID EPC set  ×  visual SKU counts  ×  system stock
     three-way discrepancy classification (see below)
        ▼  metadata only
  MQTT → Kafka (Apicurio-registered schema)
        ▼
  stock-service reconciliation task, WITH EVIDENCE
     image crop + confidence + EPC list + which sensor disagreed
        ▼
  alarm-and-review workflow → human confirms → outcome to ai_decision (I06)
```

**Three-way discrepancy classification** — the output that makes this actionable:

| System says | RFID says | Vision says | Conclusion |
| --- | --- | --- | --- |
| 12 | 12 | 4 visible | **replenish the facing** — stock exists, it's not on the shelf face |
| 12 | 3 | 3 | **real shortage** — investigate shrink or a receiving error |
| 12 | 12 | 12, wrong bay | **misplaced** — planogram deviation task ([I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md)) |
| 0 | 2 | 2 | **untracked stock** — receiving/data error |
| 12 | 0 | 12 | **tag failure** — the RFID programme itself needs attention |

## Build steps (software; hardware gated)

1. **(2 days)** **Economic gate**: which categories are tagged today, tag cost vs item margin, and the
   answer *"RFID for departments A and B, vision-only elsewhere."* Do this before anything else.
2. **(3 days)** RFID reader integration on [R01](R01-shelf-scanning-robot.md)'s platform; EPC → SKU mapping;
   RSSI-based zone assignment (coarse — do not promise shelf-level RFID localisation).
3. **(4 days)** **Fusion + three-way classification** on-box, with the confidence model per sensor.
4. **(3 days)** Evidence packaging: image crop, confidence, EPC list, disagreement type → the
   reconciliation task. This is what the Chinese requirement doc means by *alarm-and-review with evidence*.
5. **(3 days)** `stock-service` consumer + review workflow; outcomes to `ai_decision`
   ([I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md)).
6. **(2 days)** Measurement: **inventory accuracy** (cycle-count agreement), replenish-vs-reorder split,
   tag-failure rate, and staff hours saved. Holdout by department.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Tag economics don't work** | Step 1 gate. Selective by department, stated with the margin argument. |
| Reads through metal shelving / liquids / foil packaging | Known RFID physics. Report read-rate per department honestly; foil-packed FMCG is a poor RFID category and that is a fact, not a tuning problem. |
| RFID localisation over-promised | RSSI gives **zone**, not shelf position. Vision gives position. Say which does what. |
| Tag failure looks like shrink | The three-way table separates them — that separation is the deliverable |
| Needs the robot from [R01](R01-shelf-scanning-robot.md) | Sequence it: R01 first. A handheld RFID sled can prove the fusion logic with no robot at all — a good cheap first step. |
| Privacy | Product tags only. No customer-carried tags, no tracking of tagged items after purchase. Say so explicitly — RFID makes people ask. |
| Scope creep into an RFID programme | Line: read, fuse, classify, raise a task. We do not run tagging, encoding or supplier compliance. |

## Demo script (2 minutes)

1. Robot passes a tagged department; on screen: RFID EPC count, visual count, system stock.
2. **The case that only fusion finds:** system 12, RFID 12, visible 4 → *"stock exists but isn't on the
   facing"* → **replenish task**, not a reorder. Point out that a reorder here would have been wrong.
3. A real shortage (system 12, RFID 3, visible 3) → shrink investigation task with evidence attached.
4. A tag failure (RFID 0, vision 12) → routed to the RFID programme, not to stock.
5. Slide: inventory accuracy before/after by department, and the **economic gate** — which departments were
   deliberately left vision-only, with the margin reasoning.

## Effort

~17 dev-days of software, on top of [R01](R01-shelf-scanning-robot.md) and a tagging decision that is not
ours to make. The handheld-sled variant (no robot) is ~10 days and proves the fusion logic first.
