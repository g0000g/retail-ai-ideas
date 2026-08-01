# Robotics open-source stack — repos, licences, and what each layer is for

**Verify every licence in the repo's own LICENSE file before shipping.** Several projects below split code
and weight licences, and several of the licence claims in secondary sources could not be confirmed — those
are marked ⚠ *unverified*.

Snapshot: July 2026.

---

## The layer cake

```
 APPLICATION      our services: stock · order · purchase · channel · ai-service
      ▲
 FLEET            Open-RMF          multi-vendor traffic, tasks, lifts, doors
      ▲
 NAVIGATION       Nav2              one robot, A → B, obstacle avoidance
      ▲
 LOCALISATION     Cartographer / FAST-LIO2 / AMCL
      ▲
 MIDDLEWARE       ROS 2  (or AimRT, ROS-compatible)
      ▲
 HARDWARE         Geek+ · Quicktron · HAI · Pudu · Keenon · Neolix · Unitree
                  ← we buy or rent. We never build.
```

**Our contribution is the top two boxes.** Everything below is commodity or open source.

## 1 · Fleet orchestration — Open-RMF

> *"Enables interoperability among heterogeneous robot fleets while managing robot traffic that share
> resources such as space, building infrastructure systems (lifts, doors) and other automation systems
> within the same facility. It also handles task allocation and conflict resolution."*

Backed by **Intrinsic** and **OSRF**; managed by the **Open Source Robotics Alliance** since 2024. Aims to
become *"the ROS of fleet management"*.

| Repo | Purpose |
| --- | --- |
| [open-rmf/rmf](https://github.com/open-rmf/rmf) | root repo — the whole platform |
| [open-rmf/rmf_ros2](https://github.com/open-rmf/rmf_ros2) | core algorithms + data structures as a ROS 2 distributed system |
| [open-rmf/rmf_demos](https://github.com/open-rmf/rmf_demos) | **start here** — includes a Nav2 + MoveIt! demo |
| [open-rmf/free_fleet](https://github.com/open-rmf/free_fleet) · [free_fleet_ros2](https://github.com/open-rmf/free_fleet_ros2) | Python fleet adapter using **zenoh** between robot and adapter |
| [open-rmf/fleet_adapter_template](https://github.com/open-rmf/fleet_adapter_template) | template for writing your own `full_control` adapter |
| [Ekumen-OS/andino_rmf](https://github.com/Ekumen-OS/andino_rmf) | **the reference we should copy** — a production Nav2 ↔ Open-RMF bridge |

**Features that matter on a dense retail/warehouse floor:**
- **Mutex Groups** — virtual "locks" on routes and locations that only one robot may occupy, *"mimicking
  air traffic control principles"* to manage congestion points.
- **Automatic re-localisation** after a lift transit, enabling "set and forget" multi-floor operation.
- **Dynamic charger/parking assignment** based on situational need rather than fixed allocation.
- **zenoh config lets you filter and rate-limit by topic** — relevant when store wifi is the network.

**What an adapter must implement** (from the template docs):
1. **Kinematic transformation** — facility map coordinates → the robot's local frame, with scale/rotation/offset.
   `reference_coordinates` needs two sets of `[x,y]` for the same locations in RMF and robot frames;
   **minimum 4 matching waypoints recommended.**
2. **Navigation command mapping** — high-level `PathRequest` → Nav2 actions.
3. **State synchronisation** — continuously publish `FleetState` (battery, mode, position) back with
   minimal delay.

**Versions:** core RMF libraries are supported on **ROS 2 Humble, Iron and Jazzy** with distro-specific
branches. Current examples target `ros-jazzy-nav2-bringup`.

⚠ The search found **no retail-specific Open-RMF integration** — only warehouse/facility. That is the gap
[R02](R02-fleet-orchestration-openrmf.md) fills, and it is also why nobody else will have it in a contest.

Sources: [Open-RMF](https://www.open-rmf.org/) · [Ekumen — Nav2 + Open-RMF](https://ekumenlabs.com/blog/posts/nav2-open-rmf-fleet-coordination/) · [Ekumen — deep dive](https://ekumenlabs.com/blog/posts/deep-dive-into-openrmf/) · [Fleet adapter tutorial](https://osrf.github.io/ros2multirobotbook/integration_fleets_adapter_tutorial.html)

**The line worth quoting in a deck:** *"Nav2 gets a single robot from A to B while dodging obstacles, but
without a central brain, robots become their own biggest obstacles — deadlocks at narrow doorways and
traffic jams in busy corridors."*

## 2 · Navigation & middleware

| Component | Notes |
| --- | --- |
| **ROS 2** (Humble / Jazzy) | the middleware everything above assumes |
| **Nav2** | the standard ROS 2 navigation stack — single-robot A→B |
| **AimRT** — [AimRT/AimRT](https://github.com/AimRT/AimRT) | **AgiBot's** high-performance runtime for modern robotics. Modern C++, lightweight, unifies end-side / edge / cloud. **Plug-in interface compatible with ROS 2, HTTP, gRPC**, supporting progressive upgrade of existing systems. Positioned as improving on ROS in performance, stability and deployment flexibility *while staying ROS-compatible*. ⚠ **licence unverified — check LICENSE** |
| [ioai-tech/robot_sdk](https://github.com/ioai-tech/robot_sdk) | ROS 2 SDK bridging **AgiBot + Unitree + EngineAI** — hardware abstraction, motion control, sensors, RL example. `agibot/` (aimdk_msgs), `unitree/` (unitree_sdk2 submodule + ament wrapper) |
| **Unitree SDKs** — [unitreerobotics](https://github.com/orgs/unitreerobotics/repositories) | several repos under **BSD 3-Clause**. Ecosystem includes XR teleoperation and `unitree_il_lerobot` (LeRobot fork) |

## 3 · Localisation / SLAM

| Approach | Repos | Fit |
| --- | --- | --- |
| **2D LiDAR SLAM** | **Cartographer** (Google, graph-based, ~7.1k ★) · GMapping · Hector | *"de facto standard for production AMRs due to robustness, loop closure and active maintenance — works well in structured indoor environments like warehouses"*. **This is the retail-store answer.** Cartographer is Apache-2.0 (verify) |
| **Localisation on a prior map** | **AMCL** + scan-to-map particle filters | What production fleets actually run — localise against a pre-built map rather than continuously extending it, *to avoid drift accumulation and map inconsistency* |
| **3D LiDAR-inertial** | **FAST-LIO2** (HKUST, ~2.7k ★) · **LIO-SAM** (MIT, ~3.4k ★) · Point-LIO · Faster-LIO · VoxelMap | Needed only with ramps, mezzanines or strong vertical structure. Benchmarks single out **FAST-LIO2, Faster-LIO and VoxelMap** as performing notably well |
| **Comparison harness** | [engcang/SLAM-application](https://github.com/engcang/SLAM-application) | side-by-side install + config for ~20 SLAM systems on Gazebo and real data |
| **Index** | [introlab/rtabmap wiki — open-source SLAM list](https://github.com/introlab/rtabmap/wiki/List-of-Open-Source-SLAM-projects) | star counts and activity per project |

⚠ **Two gotchas worth knowing before writing code:**
- **LIO-SAM needs two extra per-point fields beyond x,y,z** — a **timestamp** and a **ring number** — used
  to de-skew the cloud. Missing them is a common first-day failure.
- Benchmarks flag that **mainstream SLAM assumes static environments**, and warehouse sequences with
  moving pedestrians are a known weak point. A retail aisle during opening hours is worse than a warehouse.
  → run robots **off-peak**, which is what Simbe does anyway.

Sources: [Autoware — available open-source SLAM](https://tier4.github.io/autoware-documentation/latest/how-to-guides/integrating-autoware/creating-maps/open-source-slam/) · [AMR development 2026](https://essenn.associates/blog-autonomous-mobile-robot-development.html) · [MSSP benchmark](https://arxiv.org/pdf/2407.14102)

## 4 · Simulation — the layer that makes this feasible without buying robots

| Simulator | Licence / status | When to use |
| --- | --- | --- |
| **NVIDIA Isaac Sim / Isaac Lab** | **open-sourced in 2025** (Isaac Sim 5.0) | **Best for digital twins and synthetic perception data.** GPU physics (PhysX), RTX ray-traced rendering, ROS 2 Bridge, built on **OpenUSD**. Isaac Lab is the thin RL layer on top. ⚠ needs an NVIDIA GPU |
| **Gazebo Harmonic** | open source | **When the deployed stack is ROS 2-native.** Native `ros_gz_bridge`, realistic sensor plugins, large world library, good for big outdoor scenes. Slower than MuJoCo on contact-rich sim; worlds *"aren't always accurate representations of reality"* |
| **MuJoCo** (+ MJX) | open source | Contact-rich manipulation, grasping, VLA evaluation. ⚠ **RGB-D and 3D LiDAR support exists but needs manual setup** as of Jan 2026, and rendering is functional but not photorealistic |
| **Genesis** | — | *"the most interesting newcomer"* — multi-physics with rigid, soft and fluid |
| **O3DE** | **Apache-2.0 + MIT**, Open 3D Foundation | game-engine-grade renderer **without NVIDIA hardware lock-in** |
| **Genie Sim 3.0** — [AgibotTech/genie_sim](https://github.com/AgibotTech/genie_sim) | **MPL-2.0** for `source/geniesim_*` and `source/data_collection`; `source/scene_reconstruction` is **multi-licensed** | AgiBot's platform, integrated with **NVIDIA Isaac Sim**. Benchmarks: instruction following, spatial understanding, manipulation, **robustness under lighting/sensor/environment disturbance**, and **Sim2Real zero-shot**. Deep integration with the **RLinf** RL framework. Ships a `geniesim` CLI (docker, ROS 2 build, bootstrap, status, doctor, deploy) |

**The practical 2026 stack for a warehouse/retail digital twin:** Isaac Sim for photorealistic scene +
synthetic perception data → Isaac Lab or MuJoCo/MJX for policy training → **Gazebo Harmonic if the deployed
navigation stack is ROS 2-native**. For us, the deployed stack *is* ROS 2-native, and we mostly need
**layout and traffic simulation, not photorealism** → **Gazebo is the cheap correct answer**, with Isaac Sim
reserved for synthetic perception data if [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)'s
gallery turns out to be weak.

Sources: [Choosing a robotics simulator in 2026](https://robotforge.org/tutorials/simulators/choosing-a-simulator-2026) · [Best robot simulators for ROS 2](https://www.godrift.ai/blogs/best-robot-simulators-ros2) · [Isaac Sim paper](https://arxiv.org/pdf/2606.03551) · [AgiBot Genie Sim 3.0](https://www.agibot.com/article/231/detail/55.html)

## 5 · Embodied AI / VLA models — the research frontier, not a 2026 retail build

| Model | What it is | Licence |
| --- | --- | --- |
| **OpenVLA** — [openvla.github.io](https://openvla.github.io/) | **7B** VLA pretrained on **970k robot episodes** from Open X-Embodiment; SigLIP + DinoV2 vision → projector → **Llama-2-7B** backbone predicting tokenised actions. Supports arbitrary **RLDS** datasets, FSDP + FlashAttention 1B–34B, full/partial/**LoRA** fine-tuning. Follow-ups: **OFT** (25–50× faster inference, bimanual high-frequency control) and the **FAST** action tokeniser (up to 15× faster) | ⚠ verify |
| **RDT-1B** | diffusion foundation model for **bimanual manipulation** (ICLR 2025). *"Fine-tuning on custom data is expensive but inference is fast."* Successor **RDT2** targets zero-shot cross-embodiment by scaling UMI data | ⚠ verify |
| **NVIDIA GR00T N1** — [NVIDIA/Isaac-GR00T](https://github.com/NVIDIA/Isaac-GR00T) | open foundation model for generalist humanoids; dual-system — **Eagle-2 VLM (System 2) + DiT action head (System 1)**. Trained on ~3.3K h real robot data (OXE, **AgiBot-Alpha**), 1.7K h synthetic, 2.5K h human video (~**50K H100 hours**). **Data format is backward-compatible with LeRobot** | ⚠ NVIDIA custom licence — verify |
| **AgiBot World / GO-1** — [agibot-world/AgiBotWorld2026](https://huggingface.co/datasets/agibot-world/AgiBotWorld2026) | large-scale manipulation dataset + GO-1 model (IROS 2025). **AGIBOT WORLD 2026 open-sourced 7 Apr 2026**, collected **100% from real environments** — commercial spaces, homes — on the **AGIBOT G2** platform, with digital-twin sim data released via GenieSim | ⚠ dataset terms — verify |
| **SmolVLA** (HuggingFace LeRobot) | **450M** params, trained entirely on **public community datasets** — the lightweight reproducible option. SmolVLM + compact transformer action expert using flow matching | ⚠ verify |
| **π0 / OpenPI** | Physical Intelligence's π0 — ~3B PaliGemma VLM + 300M diffusion action expert, pretrained on **>10,000 hours** of robot data | ⚠ verify |
| **WholebodyVLA** — [OpenDriveLab/WholebodyVLA](https://github.com/OpenDriveLab/WholebodyVLA) | ICLR 2026, unified latent VLA for whole-body loco-manipulation | ⚠ verify |

⚠ **The licence warning that matters most in this section:** *"'open source' is used loosely in this space,
and several of these releases use restricted or non-commercial licences despite the label."* Check the
`LICENSE` file **and** the HF model card separately — **weights and code are often licensed differently**.
This is the same trap as IDM-VTON and InsightFace in the earlier folders.

→ [R08](R08-embodied-ai-manipulation.md) treats this as a documented roadmap with a hardware gate, not a build.

## 6 · Consolidated licence register — robotics additions

| Component | Licence | Commercial | Note |
| --- | --- | --- | --- |
| Open-RMF (all repos) | Apache-2.0 | ✅ | verify per-repo |
| Nav2 / ROS 2 | Apache-2.0 / BSD | ✅ | |
| Cartographer | Apache-2.0 | ✅ | verify |
| LIO-SAM / FAST-LIO2 | BSD-family | ⚠ verify | |
| Gazebo Harmonic | Apache-2.0 | ✅ | |
| Isaac Sim / Isaac Lab | open-sourced 2025 | ⚠ verify + needs NVIDIA GPU | |
| MuJoCo | Apache-2.0 | ✅ | |
| O3DE | Apache-2.0 + MIT | ✅ | no vendor lock-in |
| **Genie Sim** | **MPL-2.0** (parts); `scene_reconstruction` multi-licensed | ⚠ read carefully | MPL is file-level copyleft — different obligations from Apache |
| Unitree SDKs | **BSD 3-Clause** | ✅ | |
| AimRT | ⚠ **unverified** | ⚠ | check before adopting |
| OpenVLA / RDT-1B / GR00T / AgiBot World / SmolVLA / π0 | ⚠ **unverified, several likely restricted** | ⚠ | code ≠ weights; check both |

Add these rows to the model-and-data licence register required by
[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).
