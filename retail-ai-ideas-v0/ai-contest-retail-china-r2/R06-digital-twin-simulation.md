# R06 — Digital twin: simulate the store before buying anything

> **Tier B — simulation only, zero hardware** · **Effort:** M (~2.5 weeks) · **Verdict:** ⭐ **do this first**

## Why this is the first thing to build

Every other robot idea in this folder has the same first question from a finance person: *how many robots,
where do they go, and what happens when they meet?* A digital twin answers all three **before** a
procurement conversation, for the cost of a developer's laptop.

It also de-risks the ideas themselves:
- [R01](R01-shelf-scanning-robot.md) — is the scan route feasible? how long does a full store take?
- [R02](R02-fleet-orchestration-openrmf.md) — where do fleets deadlock? do mutex groups fix it?
- [R04](R04-front-warehouse-picking.md) — how many picking robots for a 30-minute promise?
- [R05](R05-in-store-service-robot.md) — can a service robot reach every aisle with customers present?

**And it is the only idea here that is 100% buildable today with what we already have.**

## Simulator choice — and why not the flashy one

| Simulator | Verdict for us |
| --- | --- |
| **Gazebo Harmonic** | ✅ **The choice.** Native ROS 2 integration via `ros_gz_bridge`, realistic sensor plugins, large world-model library, good for large scenes. Our deployed navigation stack *is* ROS 2-native, and what we need is **layout and traffic simulation, not photorealism.** |
| **NVIDIA Isaac Sim / Isaac Lab** | 🟡 Best for **digital twins and synthetic perception data**; open-sourced 2025, PhysX + RTX, OpenUSD, ROS 2 Bridge. **Requires an NVIDIA GPU we don't have.** Reserve it for one purpose: generating synthetic shelf images if [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)'s gallery turns out weak. |
| **MuJoCo / MJX** | 🟡 For contact-rich manipulation and VLA evaluation → relevant only to [R08](R08-embodied-ai-manipulation.md). ⚠ RGB-D and 3D LiDAR need manual setup as of Jan 2026; rendering is functional, not photorealistic. |
| **Genesis** | 🟡 *"the most interesting newcomer"* — multi-physics with rigid, soft and fluid. Watch, don't bet. |
| **O3DE** | 🟡 Apache-2.0 + MIT, Open 3D Foundation — game-engine rendering **without NVIDIA lock-in**, if photorealism is ever needed on non-NVIDIA hardware. |
| **Genie Sim 3.0** — [AgibotTech/genie_sim](https://github.com/AgibotTech/genie_sim) | 🟡 AgiBot's platform, integrated with Isaac Sim; benchmarks for instruction following, spatial understanding, manipulation, **robustness under lighting/sensor/environment disturbance**, and **Sim2Real zero-shot**. ⚠ **MPL-2.0** on `geniesim_*` and `data_collection`; `scene_reconstruction` is **multi-licensed** — MPL is file-level copyleft, read it. |

**Honest caveat to state:** *"Gazebo worlds aren't always accurate representations of reality, which
complicates testing vision-based algorithms."* So the twin is for **navigation, traffic and capacity**
questions — not for validating perception accuracy. Perception is validated on real images
(C05's job) or on Isaac-generated synthetic data if we ever get a GPU.

## What the twin models

```
STORE / WAREHOUSE WORLD  (Gazebo Harmonic)
  floor plan → walls, fixtures, aisles, doors, lifts
  aisle widths            ← the 36-inch clearance constraint from R01 is checkable here
  charging docks, parking
  dynamic obstacles: customers, trolleys, pallets (spawned at configurable density)
        ▲
ROBOTS
  N × Nav2-driven bases with realistic footprints, speeds and sensor plugins
  heterogeneous "vendors" via separate ROS_DOMAIN_IDs (the free_fleet example pattern)
        ▲
FLEET
  Open-RMF traffic_editor map ← the SAME map artefact R02 uses in production
  mutex groups on congestion points
        ▲
WORKLOAD  — this is what makes it a business tool, not a robotics toy
  replay REAL task streams from our services:
    · I03 planogram changes    → scan tasks
    · V04 shelf-gap events     → targeted re-scans
    · order picks              → delivery tasks
    · C03 instant-retail orders → picking + handoff tasks
  driven by dim_calendar so 双11 / 春节 peaks are simulated, not averaged
        ▼
ANSWERS
  robots needed for a given SLA · route feasibility · scan time per store
  deadlock hotspots · charge-window planning · task latency distribution
  cost per task at vendor price points ($25k–50k/unit for goods-to-person)
```

**The key design choice: the RMF map artefact is shared between the twin and production.** The
`traffic_editor` map you simulate against is the same one the real fleet uses. That is what makes this a
digital *twin* rather than a separate model that drifts.

## Replay real workload, not synthetic

Anyone can simulate robots driving around. The thing that makes this credible is feeding it **our actual
event history**: a week of real planogram changes, shelf-gap events, order picks and instant-retail orders
from the Kafka topics, replayed at real timing. Then the answer to *"how many robots?"* is
**"three, to keep 95th-percentile task latency under 20 minutes on the week of 双11"** — which is a
sentence a CFO can act on.

## Build steps

1. **(2 days)** ROS 2 Jazzy + Gazebo Harmonic + `ros_gz_bridge` on a dev box. Reproduce a Nav2 demo world.
2. **(3 days)** Store world from a real floor plan: walls, fixtures, aisle widths, doors, docks.
   ⚠ **The floor plan is the prerequisite** — manual, ~one afternoon per store, and there is no shortcut.
3. **(2 days)** Robot models with realistic footprint, speed and sensors; multi-robot spawn.
4. **(3 days)** Open-RMF `traffic_editor` map over the same world; mutex groups at congestion points.
   Verify the map artefact is byte-identical to what [R02](R02-fleet-orchestration-openrmf.md) would deploy.
5. **(3 days)** **Workload replay harness** — read real events from Kafka (or a dump), emit RMF tasks at
   real timing, with `dim_calendar` peak scaling.
6. **(2 days)** Dynamic obstacles: customers and trolleys at configurable density, to compare off-peak vs
   trading-hours operation.
7. **(2 days)** Report generator: robots-vs-SLA curve, deadlock hotspot heatmap, task latency percentiles,
   cost per task at published vendor price bands.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No floor plan exists** | Step 2 is the gate. A hand-measured plan of one demo store is enough; say it's one store. |
| Twin says X, reality says Y | State the fidelity boundary explicitly: **navigation, traffic and capacity — not perception, not grasping.** Re-calibrate speeds and service times from real robot logs the moment one is available. |
| Simulation becomes a research project | Cap it: one store, one week of replayed workload, three questions (how many robots, where do they deadlock, what does it cost). |
| Gazebo world ≠ reality for vision | Acknowledged in the sources. Don't use the twin to validate perception. |
| Isaac Sim envy | Only if a GPU appears **and** C05's gallery is weak. Otherwise Gazebo answers the questions we actually have. |
| Genie Sim's MPL-2.0 | File-level copyleft — different obligations from Apache-2.0. If used, isolate it and record it in the register. |

## Demo script (2.5 minutes)

1. Store world in Gazebo with the real floor plan and aisle widths.
2. Replay **one real day** of planogram changes, gap events and order picks → tasks appear, robots move.
3. Run with **1 robot**: 95th-percentile task latency 71 minutes. Run with **3**: 18 minutes.
   *"Three robots, and here is the curve."*
4. Deadlock heatmap → one corridor lights up → enable an RMF **mutex group** → it clears.
5. Turn on trading-hours customer density → scan time doubles → *"which is why it runs off-peak."*
6. Point out the **same `traffic_editor` map** goes to the real fleet in [R02](R02-fleet-orchestration-openrmf.md).

## Effort

~17 dev-days, **zero hardware, zero licences to buy**. If only one thing is built from this folder, build
this — it is the prerequisite that makes every robot conversation concrete instead of aspirational.
