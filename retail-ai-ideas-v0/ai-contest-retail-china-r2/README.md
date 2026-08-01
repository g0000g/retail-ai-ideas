# AI Contest — China round 2: robotics + more open source

Fifth idea set. Round 2 of the China research, with **robots** as the explicit new dimension, plus the
open-source components round 1 missed.

| Document | What it holds |
| --- | --- |
| [00-china-robotics-market.md](00-china-robotics-market.md) | Market facts with sources: delivery robots (Neolix 17,000 units), service robots (top 5 globally are all Chinese), warehouse AMR (Geek+ 56,000 units), humanoids (AgiBot 10,000th unit), shelf-scanning economics, unmanned retail, labour shortage |
| [00-robotics-oss-stack.md](00-robotics-oss-stack.md) | **The robotics repo list** — Open-RMF, Nav2, Cartographer/FAST-LIO2, Gazebo/Isaac Sim/Genie Sim, AimRT, Unitree SDK, OpenVLA/GR00T/AgiBot World — with licences and the ⚠ unverified ones flagged |
| [00-oss-round2-additions.md](00-oss-round2-additions.md) | Non-robot additions: Milvus (Apache-2.0, LF graduated), Xinference, MiniCPM-V, the 2026 licence summary, **and what we could not verify** |

## The one thing that decides everything: we have no robots

We are a software company with a Spring Boot monorepo and no hardware. So the ideas are sorted by a
**feasibility ladder**, not by how impressive they sound:

| Tier | Hardware needed | Cost | Ideas |
| --- | --- | --- | --- |
| **A · Pure software** — integrate *someone else's* robots | none | ¥0 | [R02](R02-fleet-orchestration-openrmf.md) · [R03](R03-last-mile-robot-dispatch.md) · [R09](R09-unmanned-retail-channel.md) · [R10](R10-robot-fleet-governance.md) |
| **B · Simulation only** — prove it before buying | none | ¥0 | [R06](R06-digital-twin-simulation.md) |
| **C · One robot, rented or borrowed, for the demo** | 1 unit | low thousands $ | [R01](R01-shelf-scanning-robot.md) · [R05](R05-in-store-service-robot.md) |
| **D · Real fleet investment** — document, don't build | fleet | $500k–$5M | [R04](R04-front-warehouse-picking.md) · [R07](R07-rfid-robot-inventory.md) · [R08](R08-embodied-ai-manipulation.md) |

**Everything in tiers A and B is buildable in this contest with zero hardware budget.** That is the whole
point of the ladder, and stating it up front is more credible than a deck full of humanoids.

## The strategic read

Three facts from the research, put together:

1. **Chinese robot hardware is a commodity with many suppliers** — the top five commercial service robot
   companies worldwide are all Chinese, together >half the global market, at **40–60% below Western prices**.
2. **The vendors themselves say the moat is software** — Geek+'s edge is its RMS scheduler (5,000 AMRs in
   one warehouse) and it launched "Geek+ Brain", shifting *"from mobility to operation"*.
3. **Gartner predicted that by 2026 >40% of enterprises will require cross-brand scheduling** — and the
   selection criterion has moved from *device performance* to *system capability*.

→ **Nobody should build a robot. The scarce thing is the orchestration and business-integration layer over
a mixed fleet.** An open standard for exactly that exists (**Open-RMF**, Apache-2.0, backed by Intrinsic
and OSRF), and the search found **no retail-specific Open-RMF integration** — only warehouse/facility.

That gap is [R02](R02-fleet-orchestration-openrmf.md), and it is the most defensible idea in this folder.

## The 10 ideas

| # | Idea | Tier | Key repo / vendor | Effort | Verdict |
| --- | --- | :-: | --- | --- | --- |
| [R01](R01-shelf-scanning-robot.md) | **Shelf-scanning robot** — the robot is a camera on wheels | C | [open-rmf](https://github.com/open-rmf/rmf) + Nav2 + [PP-ShiTuV2](https://github.com/PaddlePaddle/PaddleClas) | M | ⭐ best demo |
| [R02](R02-fleet-orchestration-openrmf.md) | **Cross-brand fleet orchestration** over Geek+/Quicktron/HAI/Pudu | **A** | [Open-RMF](https://github.com/open-rmf/rmf) + [andino_rmf](https://github.com/Ekumen-OS/andino_rmf) | M | ⭐ **most defensible** |
| [R03](R03-last-mile-robot-dispatch.md) | **Last-mile robot & drone dispatch** into `order-service` | **A** | Neolix / Zelos / Keeta Drone APIs | S–M | ⭐ cheapest real win |
| [R04](R04-front-warehouse-picking.md) | **前置仓 goods-to-person picking orchestration** | D | Geek+ RMS / HAI ACR | M–L | high value, gated |
| [R05](R05-in-store-service-robot.md) | **In-store service robot** as a moving kiosk | C | Pudu / Keenon + [C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) agent | M | medium |
| [R06](R06-digital-twin-simulation.md) | **Digital twin — simulate the store before buying anything** | **B** | Gazebo Harmonic · [genie_sim](https://github.com/AgibotTech/genie_sim) · Isaac Sim | M | ⭐ **do this first** |
| [R07](R07-rfid-robot-inventory.md) | **RFID + robot inventory count**, fused with vision | D | Impinj-class reader + PP-ShiTu | M | medium |
| [R08](R08-embodied-ai-manipulation.md) | **Embodied-AI replenishment arm** (VLA) | D | OpenVLA / GR00T / AgiBot World | L | ⚠ roadmap only |
| [R09](R09-unmanned-retail-channel.md) | **智能货柜 / unmanned retail as a channel** | **A** | vending + [C10](../ai-contest-retail-china/C10-cross-domain-reco-targeting.md) | S–M | high |
| [R10](R10-robot-fleet-governance.md) | **Robot fleet safety & incident governance** | **A** | extends [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) | S | ⭐ differentiator |

### Recommended from this set

**R06 → R02 → R03, with R10 underneath and R01 as the on-stage demo.**

- **R06 first** because it costs nothing and de-risks everything else. A store digital twin in Gazebo
  answers "how many robots, what routes, where do they deadlock" *before* a procurement conversation.
- **R02** is the defensible one: cross-brand orchestration, an open standard nobody has applied to retail,
  and Gartner's own prediction as the market evidence.
- **R03** is the cheapest thing here that touches real revenue — a robot-dispatch integration in
  `order-service` with no robot of our own.
- **R10** is the robot analogue of I06: an incident registry, safety zones, and human-robot rules. Every
  robot deployment conversation ends here, and almost no contest entry will have it.
- **R01** on one rented base is the segment people remember, and it reuses
  [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md) unchanged.

## How this set relates to the other four

| This set | Elsewhere | Relationship |
| --- | --- | --- |
| R01 shelf robot | [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md) PP-ShiTu · [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) edge box | **The robot is the camera platform.** Perception is already planned; R01 adds mobility. |
| R01 / R07 | [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) planogram | closes the loop: optimizer plans → robot verifies → deviations become tasks |
| R04 前置仓 picking | [C03](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md) instant retail | C03 decides *what to stock and who serves the order*; R04 is the physical picking inside |
| R03 last-mile | [I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md) routing | robots become a **vehicle type** in the same VRP, with different constraints |
| R05 service robot | [C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) · [V09](../ai-contest-retail-vti/V09-vietnamese-voice-kiosk.md) | same agent + tool layer, on a moving platform instead of a fixed kiosk |
| R09 vending | [C10](../ai-contest-retail-china/C10-cross-domain-reco-targeting.md) cross-domain | vending is another domain in the cross-domain matrix |
| R10 governance | [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) | same registry, robot-specific event types and safety rules |
| Milvus (round 2) | pgvector decision | **pgvector still stands** for our scale. Milvus only if the image gallery exceeds ~10⁷ vectors, or via 源雀's existing dependency. |
| MiniCPM-V (round 2) | V04 / R01 edge verification · C01 interaction | 1.3B multimodal with 4×/16× token compression → the **on-box** VLM. Full-duplex variant is a candidate for C01's missing real-time path. |

## Prerequisites

1. **ROS 2 (Humble or Jazzy)** on a dev box + Gazebo Harmonic. Free, no hardware. This is the entire
   prerequisite for R06.
2. **A store floor plan** — needed for the twin and for RMF's `traffic_editor` map. Manual, one afternoon
   per store.
3. **`ai-service` off `:8109`** (Apicurio) — same finding in all five folders.
4. **`dim_calendar`** with 春节/618/双11 — shared with sets 2–4.
5. **A robot vendor conversation** before tier C/D anything. Rental or a loan unit for a demo is normal in
   this industry; ask.
6. **Licence register rows** for every robotics component — see
   [00-robotics-oss-stack.md §6](00-robotics-oss-stack.md), including the ⚠ unverified ones.

## Diagrams

`diagrams/*.drawio` source · `*.drawio.png` 2× raster with embedded XML · `*.svg` vector for slides.

| Diagram | File |
| --- | --- |
| Robotics landscape + the feasibility ladder | `diagrams/landscape-china-r2.drawio.png` |
| R02 — cross-brand fleet orchestration (Open-RMF) | `diagrams/r2-02-fleet-orchestration.drawio.png` |
| R01 — shelf-scanning robot pipeline | `diagrams/r2-01-shelf-robot.drawio.png` |
| R06 — digital twin / simulation-first | `diagrams/r2-06-digital-twin.drawio.png` |
| R03 — last-mile robot & drone dispatch | `diagrams/r2-03-last-mile.drawio.png` |

---

> **Western counterpart:** [`../ai-contest-retail-west/`](../ai-contest-retail-west/README.md) — same treatment for the
> EU/US market. Binding constraint flips from **where the data lives** (PIPL) to **what the AI system is allowed to
> do** (EU AI Act), and the store-robotics conclusion flips too: **Bossa Nova's cancelled 500-store deployment**
> argues for fixed cameras over a mobile robot in the West. Also carries the **European Accessibility Act**, which
> is the only regulation across all six folders that has already produced lawsuits.
