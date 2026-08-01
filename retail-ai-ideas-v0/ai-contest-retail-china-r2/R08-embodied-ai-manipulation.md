# R08 — Embodied-AI replenishment arm (VLA)

> **Tier D — needs real hardware and GPUs** · **Effort:** L · **Verdict:** ⚠ **roadmap only — document, do not build**

## Why this is in the folder at all

Because the market data is genuinely striking and it belongs in a China deck — and because **saying no to it
with reasons is more credible than a slide of humanoids.**

| Fact | Source |
| --- | --- |
| Chinese humanoid output **+94% in 2026**; **Unitree + AgiBot ≈ 80% of shipments**. Domestic shipments **~18,000 (2025) → 62,500 (2026)** | [TrendForce](https://www.trendforce.com/presscenter/news/20260409-13007.html) |
| 2025 baseline: **AgiBot 5,168 units** (39% global share, Omdia); with Unitree, UBTECH, Leju, **Chinese firms ≈ 90% of global humanoid installations** | [DirectIndustry](https://emag.directindustry.com/2026/03/17/china-humanoid-robots-market-unitree-robotics-agibot-ubtech-leju-xpeng/) |
| **AgiBot's 10,000th humanoid on 30 Mar 2026** — first 1,000 took ~2 years, **5,000→10,000 took 3 months** | [TechTimes](https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm) |
| **AgiBot opened its first offline store in Shanghai, 13 June 2026** | same |
| **UBTech Walker S2** deployed at BYD, Geely, FAW-VW, Dongfeng, Audi FAW, BAIC, Foxconn, SF Express; **Airbus signed Jan 2026**; ~1,000 units | [iFactory](https://ifactoryapp.com/industries/manufacturing-plant/chinese-humanoid-manufacturing-agibot-xpeng-ubtech-byd) |
| **Unitree** cleared IPO review 1 Jun 2026; committing to **75,000 humanoids + 115,000 quadrupeds annually**; pushing **Robot-as-a-Service** | [TechTimes](https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm) |

## The honest read — and the reason this is roadmap, not build

**Every deployment in the evidence is manufacturing and logistics.** BYD, Geely, Foxconn, SF Express,
Airbus. **AgiBot's retail presence is a shop that sells robots**, not robots working in a shop.

**Humanoid retail-store work is not a deployed use case in the public record.** A contest deck claiming
otherwise is overreaching, and a judge who follows the market will know.

Add the technical gates:

| Gate | Reality |
| --- | --- |
| **Hardware** | a humanoid or a mobile manipulator, plus a store that will host it |
| **GPUs** | GR00T N1's pretraining alone was **~50K H100 hours**. Even *fine-tuning* RDT-1B is described as **expensive** |
| **Licences** | ⚠ *"'open source' is used loosely in this space, and several of these releases use restricted or non-commercial licences despite the label"* — and **weights and code are often licensed differently**. Same trap as IDM-VTON and InsightFace. |
| **Task suitability** | retail shelf replenishment is **deformable, cluttered, variable-lighting, human-adjacent** — close to the hardest end of manipulation |

## What the roadmap actually says

If a mobile manipulator ever arrives, this is the shortest credible path:

```
1 · SIMULATE FIRST — always
     Genie Sim 3.0 (AgibotTech/genie_sim, MPL-2.0 on the main packages, Isaac Sim integration)
     benchmarks: instruction following · spatial understanding · manipulation
                 robustness under lighting/sensor/environment disturbance · Sim2Real zero-shot
     or MuJoCo/MJX for contact-rich work — the default for VLA evaluation

2 · START FROM AN OPEN CHECKPOINT, don't pretrain
     SmolVLA      450M, trained entirely on PUBLIC community datasets — the reproducible baseline
     OpenVLA      7B, 970k episodes from Open X-Embodiment; supports LoRA fine-tuning;
                  OFT gives 25–50× faster inference, FAST tokeniser up to 15×
     GR00T N1     Eagle-2 VLM + DiT action head; data format BACKWARD-COMPATIBLE WITH LeRobot
     π0 / OpenPI  ~3B PaliGemma + 300M diffusion action expert, >10,000 h robot data
     RDT-1B/RDT2  bimanual diffusion; RDT2 targets zero-shot cross-embodiment

3 · SCOPE TO ONE TASK, NOT "REPLENISHMENT"
     e.g. "pick a single rigid boxed SKU from a tote and place it on a facing"
     rigid, uniform, known geometry — the easiest real retail manipulation there is
     NOT: bagged goods, produce, bottles, anything deformable

4 · DATA
     AgiBot World 2026 (open-sourced 7 Apr 2026) — collected 100% from REAL environments
     including commercial spaces, on the AGIBOT G2 platform, with digital-twin sim data via GenieSim
     ⚠ dataset licence terms unverified — check before any commercial use

5 · SDK / RUNTIME
     ioai-tech/robot_sdk — ROS 2 bridge across AgiBot + Unitree + EngineAI
     Unitree SDKs — BSD 3-Clause (the cleanest licence in this section)
     AimRT (AgiBot) — ROS-compatible runtime ⚠ licence unverified
```

**The one thing worth doing now, at zero cost:** the **licence audit**. Go through OpenVLA, RDT-1B,
GR00T N1, AgiBot World, SmolVLA and π0 — code licence *and* weight licence, separately — and record the
result in the register. That is a half-day, it is genuinely useful, and it is the reason this file exists.

## What to say in the deck instead of building it

> *Chinese humanoid production nearly doubled in 2026, and two firms hold ~80% of shipments. Every
> deployment we could verify is manufacturing or logistics — BYD, Foxconn, SF Express, Airbus. Retail
> store work is not a deployed use case yet. When it becomes one, the path is simulation-first in Genie Sim,
> fine-tuning an open checkpoint rather than pretraining, and one narrowly-scoped rigid-object task. Here is
> the licence audit of every candidate model, including the ones we would not be able to use.*

That paragraph is worth more than a rendering of a robot stacking shelves.

## Risks (of building it anyway)

| Risk | Reality |
| --- | --- |
| Hardware cost and availability | a mobile manipulator plus a host store |
| GPU cost | fine-tuning is expensive; pretraining is out of reach |
| **Licence** | several likely restricted; **code ≠ weights** |
| Task difficulty | deformable, cluttered, human-adjacent — near the hardest end |
| Safety | a manipulator near customers is a different regulatory conversation from a wheeled base → [R10](R10-robot-fleet-governance.md) is a prerequisite, not an add-on |
| Demo risk | manipulation demos fail live, often |
| **Opportunity cost** | the same weeks spent on [R02](R02-fleet-orchestration-openrmf.md) or [R06](R06-digital-twin-simulation.md) produce something shippable |

## Effort

**Not scheduled.** The licence audit is ~4 hours and should be done regardless. Everything else is gated on
hardware that does not exist in our environment — and on a use case the market has not yet validated in
retail.
