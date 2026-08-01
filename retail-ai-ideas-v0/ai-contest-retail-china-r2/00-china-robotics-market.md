# China retail robotics — market research, with sources

Round 2 of the China research, focused on **robots**. Every claim carries its link. Read the caveat at the
bottom before quoting any number.

Snapshot: July 2026.

---

## 1 · Autonomous delivery vehicles (无人配送车) — the most commercially mature

| Fact | Source |
| --- | --- |
| China's unmanned logistics market projected at **¥263.4B by 2030**, annual growth **>40%** (China Research Institute of Industrial Economy) | [Seoul Economic Daily](https://en.sedaily.com/international/2026/04/07/no-drivers-seat-all-cargo-driverless-delivery-vehicles) |
| **Neolix (新石器)**: **17,000+ vehicles deployed**, targeting **50,000 by year-end**; **160M+ km driven**; RaaS subscription model; **#1 globally** in last-mile unmanned delivery (Road to Autonomy index, June 2026, 74.7 pts) — Meituan ranked 6th | [BigGo Finance](https://finance.biggo.com/news/eb4d072e-451b-4a57-9d23-afc07b4af43a) |
| **Zelos** caught up at **15,000 cumulative units**, 300+ Chinese cities, expanding to Singapore/Japan/Korea/Middle East on a **$400M Series B** | same |
| **RoboSense** (LiDAR, integrated with Neolix, JD, Meituan) took a **300,000-unit order from Neolix** | [Gasgoo](https://autonews.gasgoo.com/articles/news/robosense-secures-exclusive-300000-unit-order-from-neolix-2033480123796320257) |
| **Regulation exists**: 2023 guidelines from four ministries incl. MIIT permit **L3/L4 pilot operation on public roads with national-level legal status**; Shenzhen, Shanghai, Hangzhou passed ordinances; Beijing's pilot zone grew **160 → 600 km²** | [Seoul Economic Daily](https://en.sedaily.com/finance/2026/04/06/chinas-autonomous-delivery-vehicles-surge-ninefold-in-one) |
| **Meituan's model is hybrid**, not fully autonomous: unmanned vehicles move parcels to transfer stations, **couriers do the last hundred metres** | same |
| **Meituan Keeta Drone**: 70+ routes across Shenzhen, Beijing, Shanghai, Guangzhou, HK, Dubai; **880,000+ deliveries** as of March 2026 | same |

**The design lesson:** even the market leader runs a **hybrid** model. A plan that assumes the robot does
the whole journey is less credible than one that models the handoff. → [R03](R03-last-mile-robot-dispatch.md)

## 2 · Commercial service robots — Chinese vendors own the category

| Fact | Source |
| --- | --- |
| Global commercial service robot market grew at **37% CAGR 2021–2025**, projected **31.2% CAGR to 2030**. In 2025 **the top five companies worldwide were all Chinese**, together **>half the global market** | [Frost & Sullivan via Manila Times](https://www.manilatimes.net/2026/07/16/tmt-newswire/pr-newswire/pudu-robotics-ranked-no1-globally-in-four-commercial-service-robotics-dimensions-by-frost-sullivan/2385878) |
| **Pudu**: #1 globally in commercial service robotics revenue and shipments (~25% revenue / ~23% shipments), #1 in commercial cleaning robotics revenue; overseas sales doubled; preparing an HK IPO | same · [DC Velocity](https://www.dcvelocity.com/material-handling/pudu-robotics-debuts-commercial-cleaning-and-delivery-robots) |
| **Keenon**: **#1 worldwide in commercial service robot shipments in 2025** (IDC), leads the global delivery-robot market; SoftBank partnership pushed overseas to half of revenue | [Barchart](https://www.barchart.com/story/news/33523452/keenon-robotics-continues-global-lead-in-commercial-service-robot-market-securing-triple-no-1-rankings-idc-reports) |
| Both are **pivoting to embodied AI / humanoids** — Keenon showed humanoids at WAIC 2026, Pudu debuted the **PUDU D7** alongside next-gen embodied AI | [Sina](https://portal.sina.com.hk/finance/finance-prnewswire/prnasia/2026/07/18/1858236/global-commercial-service-robot-shipments-leader-keenon-puts-humanoids-to-work-at-waic-2026/) · [TipRanks](https://www.tipranks.com/news/private-companies/pudu-robotics-showcases-new-service-robot-lineup-at-waic-2026) |

**Why this matters to us:** the hardware is a **commodity with many suppliers**. Nobody should build a
robot. The scarce thing is the **software layer that makes a mixed fleet useful to a retailer**.
→ [R02](R02-fleet-orchestration-openrmf.md)

## 3 · Warehouse AMR — the software is the moat, not the hardware

| Fact | Source |
| --- | --- |
| **Geek+ (极智嘉)**: ~**56,000 AMRs** across ~40 countries, **800+ customers** incl. 60+ Fortune 500 (Walmart, Toyota, BMW), **75% repurchase rate**, **#1 global AMR share (6.0%)**; HKEx IPO July 2025 | [Robotics & Automation News](https://roboticsandautomationnews.com/2025/10/03/top-20-chinese-warehouse-robotics-companies-geekplus-turns-its-attention-to-domestic-competitors/95126/) |
| Its edge is **software**: the RMS scheduler coordinates **5,000 AMRs in a single warehouse**; Feb 2026 launched **Gino 1** ("world's first universal warehouse robot") and **Geek+ Brain**, an embodied-intelligence platform — a shift from *mobility* to *operation* | same |
| **Quicktron (快仓)**: 30+ countries, 1,000+ enterprise customers; first in China to coordinate **1,000 AMRs in one scenario** | same |
| **HAI Robotics (海柔创新)**: HAIPICK **ACR** series (autonomous case-handling), high-density storage, export ratio ~50% | same |
| **SEER (仙工智能)**: **24.8% global robot-controller share** in 2025 (45.2% in China); passed HKEx listing hearing June 2026 | same |
| **Price**: Chinese vendors are **40–60% below Western alternatives**. Goods-to-person shelf carriers **$25k–50k/unit**, transport AMRs $25k–80k, pallet AGVs $15k–50k, sorting robots $10k–30k; **full systems $500k–$5M** | [GrabaRobot](https://grabarobot.com/robots/warehouse-robot/) |
| **The selection criterion has shifted** from device performance to **system capability** — architecture, implementation experience, business model, global delivery. Gartner predicted that **by 2026 >40% of enterprises will require cross-brand scheduling** | [Robotics & Automation News](https://roboticsandautomationnews.com/2025/10/03/top-20-chinese-warehouse-robotics-companies-geekplus-turns-its-attention-to-domestic-competitors/95126/) |

**That last row is the single most actionable fact in this document.** Cross-brand scheduling is a pure
software problem, an open standard exists for it (Open-RMF), and it is exactly the gap a WMS-adjacent
platform is positioned to fill. → [R02](R02-fleet-orchestration-openrmf.md)

## 4 · Humanoids — real production, but not a retail use case yet

| Fact | Source |
| --- | --- |
| TrendForce: Chinese humanoid output up **94% in 2026**; **Unitree + AgiBot ≈ 80% of shipments**. Domestic shipments **~18,000 (2025) → 62,500 (2026)** | [TrendForce](https://www.trendforce.com/presscenter/news/20260409-13007.html) |
| 2025 baseline: **AgiBot 5,168 units** (39% global share, Omdia), Unitree ~5,500 self-reported; with UBTECH (~7%) and Leju (~5%), **Chinese firms ≈ 90% of global humanoid installations** | [DirectIndustry](https://emag.directindustry.com/2026/03/17/china-humanoid-robots-market-unitree-robotics-agibot-ubtech-leju-xpeng/) |
| **AgiBot produced its 10,000th humanoid on 30 March 2026** — the first 1,000 took ~2 years, **5,000→10,000 took 3 months** | [TechTimes](https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm) |
| **AgiBot opened its first offline store in Shanghai, 13 June 2026** — humanoids as *the product being sold*, not as store staff | same |
| **UBTech Walker S2** is deployed at BYD, Geely, FAW-VW, Dongfeng, Audi FAW, BAIC, Foxconn, SF Express; **Airbus signed Jan 2026**. ~1,000 units delivered — **all manufacturing, not retail** | [iFactory](https://ifactoryapp.com/industries/manufacturing-plant/chinese-humanoid-manufacturing-agibot-xpeng-ubtech-byd) |
| **Unitree** cleared IPO listing-committee review 1 June 2026; committing to **75,000 humanoids + 115,000 quadrupeds annually**; pushing Robot-as-a-Service | [TechTimes](https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm) |

**The honest read:** humanoid *production* is real and scaling fast; humanoid *retail-store work* is not
yet a deployed use case in the evidence. Anyone claiming otherwise in a contest deck is overreaching.
→ [R08](R08-embodied-ai-manipulation.md) treats it as a documented roadmap item, not a build.

## 5 · Shelf-scanning / inventory robots — a mature product category

| Fact | Source |
| --- | --- |
| **Simbe Tally 4.0** (announced 12 Jan 2026, shipping mid-2026): up to **12 hours runtime**, CV on NVIDIA infrastructure. Across **10 countries, ~60 retailers**, a decade of deployments in grocery, club, farm supply, home improvement | [Shelby Report](https://theshelbyreport.com/2026/01/14/simbe-introduces-improved-tally-4-0-shelf-scanning-robot/) |
| Ten-year totals claimed: **600M shelf gaps detected, 80M promotion errors fixed** | [PR Newswire](https://www.prnewswire.com/news-releases/simbe-marks-10-years-of-tally-the-robot-600m-shelf-gaps-detected-80-million-promotion-errors-fixed-and-a-new-era-of-retail-store-intelligence-302612437.html) |
| **RFID onboard**: Impinj Indy R2000 reader + 4 custom antennas, reads at **10–15 ft height, ~20 ft range** — validated with Schnuck Markets and Decathlon | [Impinj](https://www.impinj.com/library/blog/rain-rfid-enabled-tally-robot-automates-grocery-store-inventory) · [Simbe](https://www.simberobotics.com/about/newsroom/simbe-adds-rfid-scanner-to-tally-robot) |
| Third-party economics: full scan of a 45,000 sq ft grocery store in **<60 minutes**, **98%+ recognition** for trained SKUs, **2–3 scans/day vs once weekly manual**. **$30k–50k/store/year** cost against **$80k–300k+** benefit → **2–5× first-year return**. Needs **~36 inches of clear aisle**; usually run off-peak | [Robotomated](https://robotomated.com/learn/retail/retail-shelf-scanning-robots) |
| China-side, the focus is **warehouse 盘点 robots**: requirements include stable QR/barcode/RFID reads under reflection/occlusion/low contrast, **real-time WMS/ERP integration with discrepancy reports**, alarm-and-review workflow with evidence (images + confidence), obstacle avoidance, auditable logs. Recommended 2026 process: **"validate first, then deliver"** | [智科云](https://www.shzhikeyun.com/news/hydt/11425.html) |
| China produces **60–70% of global UHF RFID tags**; China UHF RFID market **¥8.462B in 2024** | [brrfid](http://www.brrfid.com/show-426.html) |
| A 2026 new-retail white paper puts the **global ESL market >$2.5B in 2026**, chain supermarkets saving **~¥3,000/store/month**, label error rate **<0.1%**, restocking timeliness up to **95%**; calls 2026 the **first year of scaled commercial deployment** for warehouse↔shelf restocking robots | [163.com summary](https://www.163.com/dy/article/L0JAGVM40518GUCC.html) |

**Why this is our best robot idea:** the robot is a **camera on wheels**. The value is in the perception
and the business integration — which is [C05 PP-ShiTu](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)
and [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md), both already planned.
→ [R01](R01-shelf-scanning-robot.md)

## 6 · Unmanned retail / smart vending (智能货柜)

| Fact | Source |
| --- | --- |
| **China holds 59.4% of the global intelligent vending market** in 2025 | [natlawreview / RobotAnno release](https://natlawreview.com/press-releases/china-leading-manufacturer-robotanno-showcases-global-unmanned-retail-growth) |
| China vending retail revenue **¥42.2B (2024) → ¥51.55B (2025) → ¥73.93B (2027)** | same |
| Intelligent vending segment globally **$15.51B (2025) → $37.52B (2031)**, 15.86% CAGR | same |
| **Anno Robot (RobotAnno)**, Shenzhen: AI coffee kiosks in **60+ countries**, claimed **98% brew consistency**, 24/7, zero staffing | [EIN Presswire](https://www.einpresswire.com/article/866232340/shenzhen-s-anno-robot-crowned-china-s-1-ai-coffee-robot-now-in-60-countries) |

⚠ **Source-quality warning:** nearly all of §6 traces back to a single vendor press release syndicated
across newswire aggregators. Treat the figures as directional and vendor-selected. The *structural* point
stands — unmanned retail is a real channel in China — but do not quote these numbers as research.

## 7 · Labour context (the actual driver)

- **13.3% of businesses report workforce gaps globally, rising to 25.3% in food services.**
- **China's intelligent manufacturing faces a 4.5M worker shortfall against 9M demand.**

Robots in Chinese retail are not primarily a novelty play. They are a **labour-substitution** play in a
market with a structural shortage — which is why the economics work there before they work elsewhere.

---

## Caveat

- §6 is vendor PR. §5's economics are third-party analysis, not audited. Market-size projections
  everywhere are forecasts.
- The Chinese SEO-farm problem from round 1 applies here too — some 2026 listicles still recommend
  products that have exited.
- **Every number here should be paired with our own measured baseline** before it appears in a claim.
  That is what [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) exists to produce.
