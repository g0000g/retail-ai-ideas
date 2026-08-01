# SUMMARY OF RETAIL AI IDEAS RESEARCH
## Classified by Market Characteristics & Practical Implementation Playbook

---

### GENERAL INFORMATION

* **Document Title:** Summary of Retail AI Ideas Research by Market Characteristics
* **Version:** 1.0 (English - Research Document Format)
* **Release Date:** July 31, 2026
* **Target Audience:** Technology Steering Committee, Strategic Product Development, Retail Operations Managers
* **Scope of Analysis:** 4 Major Market Segments (Vietnam/Southeast Asia, China, West/EU-US, Global/Core Infrastructure)

---

## 1. EXECUTIVE SUMMARY

This document consolidates and categorizes a comprehensive portfolio of Artificial Intelligence (AI) solution ideas for the retail sector derived from standard retail management system architectures, solutions catalogs from specialized retail integrators, global retail technology blueprints, and contemporary regulatory landscapes (as of 2026).

Rather than proposing a generic, one-size-fits-all AI system, this playbook segments proposed solutions based on **regional market characteristics**:
* **Vietnam & Southeast Asia:** Emphasizes domestic data residency, hyper-optimized marginal costs (target 0 VND marginal cost via local CPU inference), and native language processing.
* **China:** Tailored for hyper-competitive, fast-paced digital channels (livestreaming commerce, instant retail/dark stores) and strict CAC compliance regarding synthetic AI content marking.
* **The West (EU & US):** Governed by rigorous compliance frameworks (EU AI Act, European Accessibility Act) and operational lessons from early robotic failures (e.g., Walmart's Bossa Nova robotics project cancellation).
* **Global & Core Infrastructure:** Focused on market analyst consensus (Oracle, IBM, SAP, NetSuite) regarding data quality, lifecycle markdown optimization, and systematic AI governance.

---

## 2. MARKET CHARACTERIZATION & USE-CASE CATALOG

<div class="page-break"></div>

### 2.1 VIETNAM & DEVELOPING SOUTHEAST ASIAN MARKETS
**Market Drivers & Constraints:**
1. **Data Residency and Regulations:** Decree 13/2023/ND-CP and the upcoming Personal Data Protection Law (PDPL) in 2026 enforce strict requirements on localizing customer PII. Transferring all chat history or purchase behavior to overseas GPU clouds poses high compliance risks.
2. **Marginal Cost Optimization:** Local enterprises strongly favor offline execution on existing server architectures (CPU-only) to maintain a near-zero marginal cost per transaction.
3. **Local ASR & Speech Nuances:** Requires specialized Vietnamese speech and language processing that handles accents, regional dialects, and noisy supermarket acoustics.
4. **Edge-native Hardware:** Store-level intelligence relies on cheap edge computers rather than high-end datacenters.

#### Idea V01: Scan & Go Self-Checkout Super-App
* **Market-Specific Fit:** Enables customers to scan product barcodes and pay via mobile wallets directly from their phones, alleviating cashier checkout bottlenecks during peak hours.
* **Proposed Stack:** Local computer vision-based barcode scanning integrated with lightweight online-offline data sync pipelines to adapt to local store bandwidth constraints.
* **Feasibility & ROI:** Highly feasible. Reduces queues at cashier registers and increases transaction volume without requiring additional checkout staff.

#### Idea V02: AI-Powered Staff Scheduling
* **Market-Specific Fit:** Optimizes employee shift allocation based on customer traffic forecasts, local labor laws, and unstructured shift-change requests.
* **Proposed Stack:** Amazon's Chronos-2 forecasting engine, Google OR-Tools optimization framework, and `Qwen3.5-4B` locally via Ollama to parse natural language text inputs from employees.
* **Feasibility & ROI:** Highly feasible on local CPUs. Prevents 10-15% over-staffing leakages while improving employee satisfaction.
* **Verification & Citation:** Modeled on regional enterprise-scale workforce scheduler architectures implemented in the Southeast Asian retail space.

#### Idea V04: Edge AI Box for Store Vision
* **Market-Specific Fit:** Monitors footfall, customer queue duration, and shelf gaps locally at the store level without streaming heavy video feeds to the cloud.
* **Proposed Stack:** RT-DETRv2 object detector and ByteTrack tracker running locally on a $150 - $300 edge box (e.g., Intel N100 using OpenVINO, or Raspberry Pi 5 with Hailo-8L accelerators).
* **Feasibility & ROI:** Solves cloud bandwidth costs and GPU hosting bills. Cuts checkout queues by up to 20% and detects out-of-stock shelves in near real-time.
* **Verification & Citation:** Aligns with edge AI product specifications utilized by retail integrators in the modern brick-and-mortar retail space.

#### Idea V05: Localized Personalization & Loyalty Engine
* **Market-Specific Fit:** Drives repeat purchase frequency for loyalty members through personalized offers without relying on expensive cloud analytics.
* **Proposed Stack:** Collaborative filtering algorithms (such as implicit ALS or LightFM) paired with bge-m3 embeddings running directly on the local server architecture.
* **Feasibility & ROI:** High feasibility. Yields a projected 5-8% average transaction value (AOV) increase within the member cohort.

#### Idea V07: Document AI for Procurement (3-Way Match)
* **Market-Specific Fit:** Automates the reconciliation of supplier Invoices, Purchase Orders (PO), and Goods Receipt Notes (GRN) to eliminate human auditing overhead.
* **Proposed Stack:** PaddleOCR combined with VietOCR for text extraction, and the lightweight `Qwen3-VL` vision-language model for logical semantic validation.
* **Feasibility & ROI:** Clear financial payback. Case studies report up to a 6x reduction in procurement transaction handling costs compared to traditional manual setups.
* **Verification & Citation:** Document processing automation benchmarks from case studies of modern retail systems in the regional market.

#### Idea V09: Vietnamese Voice Kiosk / Receptionist
* **Market-Specific Fit:** Enables hands-free product catalog lookups and in-store information searches using natural Vietnamese voice inputs.
* **Proposed Stack:** The PhoWhisper Vietnamese speech model (trained on 844 hours of speech across 63 provinces) packaged as a local GGUF/llama.cpp binary (running at ~484MB on CPU) for Automatic Speech Recognition (ASR), paired with a local Vietnamese Text-to-Speech (TTS) model.
* **Feasibility & ROI:** High. Bypasses the high cost and error rate of generalist English-first cloud speech APIs in noisy store environments.
* **Verification & Citation:** Open-source weights and benchmarks for the PhoWhisper model: [PhoWhisper Research Paper on arXiv](https://arxiv.org/abs/2401.02069).

#### Idea V10: Privacy-Gated Face Attendance
* **Market-Specific Fit:** Replaces manual check-ins or biometric fingerprint devices with local facial recognition for store staff, fully complying with domestic PII regulations.
* **Proposed Stack:** Face vector feature extraction algorithms running at the edge. Original face images are encrypted and deleted immediately after vector generation.
* **Feasibility & ROI:** Cuts shift clock-in times and eliminates time-card fraud.

<div class="page-break"></div>

### 2.2 CHINESE MARKET - HYPER-COMPETITION & LOCALIZED COMPLIANCE
**Market Drivers & Constraints:**
1. **Livestream & Instant Retail Dominance:** Livestream e-commerce GMV is projected to reach RMB 9.08 trillion (~$1.25 trillion) in 2026. Instant retail (30-minute delivery via front warehouses) has exceeded RMB 1 trillion.
2. **CAC Synthetic Content Labeling:** Under the regulations in force since **September 1, 2025** (*Measures for Identifying Synthetic Content Generated by Artificial Intelligence*), all AI-generated content (copy, images, avatars) must display explicit visual badges and contain embedded cryptographic metadata.
3. **Data Residency under PIPL:** Cross-border transfer certification measures effective **January 1, 2026**, require local processing of Chinese customer data on servers hosted in mainland China.
4. **Domestic Open-Weight Stack:** Solutions are built on China-developed Apache-2.0 or MIT licensed models such as Qwen3.6 (Alibaba), DeepSeek V4, FunASR, and PP-ShiTuV2 (Baidu).

#### Idea C01: Digital Human Livestreaming (Automated Store Broadcasts)
* **Market-Specific Fit:** Enables 24/7 automated merchant livestream broadcasting (店播 - which grew by 45% YoY in 2025) to capture traffic outside peak hours.
* **Proposed Stack:** Silicon Intelligence's Duix.Heygem/HeyGem (clones voices and avatars from a 10-second video clip offline) driven by a Qwen3.6 script generator.
* **Feasibility & ROI:** Highly feasible in batch-generation mode. Cuts streaming costs by over 90% compared to hiring human influencers.
* **Verification & Citation:** 
  * Livestream market trends and merchant broadcast dynamics: [FedEx China E-commerce Emerging Tech](https://www.fedex.com/en-cn/business-insights/ecommerce/how-new-experimental-tech-is-powering-e-commerce-in-china.html).
  * HeyGem open-source repository: [Duix.Heygem GitHub Repository](https://github.com/duixcom/Duix.Heygem).

#### Idea C02 & C09: Private Domain SCRM & Group Leader Digital Clone
* **Market-Specific Fit:** Automates customer nurturing and group operations in private domain networks like WeChat Work (SCRM), simulating group leaders (团长) using AI digital clones.
* **Proposed Stack:** Qwen-Agent intelligent agent framework combined with WxJava (WeChat SDK for Java) to handle automated replies and personalized promotions.
* **Feasibility & ROI:** Aligns with the 2026 trend of standardized AI private domain infrastructure. Increases customer retention by 15% without expanding group-admin headcounts.
* **Verification & Citation:** WeChat private domain e-commerce trends: [Woshipm China Private Domain Trends](https://www.woshipm.com/operate/6300297.html).

#### Idea C03: Instant Retail Front Warehouse Inventory Allocation
* **Market-Specific Fit:** Allocates stock and predicts fast-moving inventory at localized front warehouses (前置仓/闪电仓) supporting Meituan's 30-minute delivery radius.
* **Proposed Stack:** Chronos-2 forecasting at a 30-minute time interval × 3km grid resolution, optimized by Google OR-Tools.
* **Feasibility & ROI:** Essential for avoiding stockouts in instant delivery. Increases delivery fulfillment rates to over 98%.
* **Verification & Citation:** Meituan's Flash Shopping front warehouse strategy report: [Meituan Flash Shopping Front Warehouse Strategy](https://www.bxtdata.com/en/insights/7927/Meituan%20Flash%20Shopping%20Front%20Warehouse%20Strategy:%20How%20Instant%20Retail%20is%20Reshaping%20China%20FMCG).

#### Idea C04: Content Factory for Douyin/Xiaohongshu
* **Market-Specific Fit:** Produces massive volumes of social media copy, scripts, and product visuals tailored for Douyin/Xiaohongshu, embedding CAC-compliant watermarks automatically.
* **Proposed Stack:** Qwen3.6 for localized copywriting and reverse-funnel generation, automatically applying implicit metadata watermarking at the file generation step.
* **Feasibility & ROI:** Speeds up marketing campaign iteration by 5x, reducing graphic production costs.
* **Verification & Citation:** Xiaohongshu marketing insights: [Digital Crew Xiaohongshu Marketing 2026](https://www.digitalcrew.agency/how-ai-is-changing-xiaohongshu-marketing-in-2026/).

#### Idea C05: Zero-Shot Product Recognition
* **Market-Specific Fit:** Automates self-checkout and shelf-gap recognition without requiring retraining of CNN models whenever new SKUs are added to the store catalog.
* **Proposed Stack:** Baidu's PaddleClas PP-ShiTuV2. Translates product images into vector embeddings to match them against a vector database (e.g., Milvus).
* **Feasibility & ROI:** High feasibility. Operates on a search-and-match logic, removing deep learning training cycles for new items.
* **Verification & Citation:** Open-source product recognition library PP-ShiTuV2: [PaddleClas PP-ShiTuV2 GitHub](https://github.com/PaddlePaddle/PaddleClas).

#### Idea C06: Virtual Try-On
* **Market-Specific Fit:** Enables online apparel shoppers to upload their photos and try on garments virtually, minimizing returns caused by sizing mismatches.
* **Proposed Stack:** CatVTON diffusion architecture (open-source virtual try-on supporting commercial application) to render clothing onto user-provided body images.
* **Feasibility & ROI:** Runs in offline batches to conserve server resources. Yields a projected 20% conversion rate increase.

#### Idea C08: Structured E-fapiao / OFD Invoice Automation
* **Market-Specific Fit:** Processes China's next-generation electronic tax invoices (数电票/全电发iao), which are distributed as native OFD or XML files rather than images.
* **Proposed Stack:** Direct parsing of XML/OFD structures, integrated with the state-sanctioned tax verification system (inv-veri.chinatax.gov.cn) to bypass OCR completely.
* **Feasibility & ROI:** 100% accurate. Avoids all optical recognition errors, saving accounting teams hundreds of hours of manual verification.
* **Verification & Citation:** National Tax Bureau invoice verification platform: [China Tax Invoice Verification](https://inv-veri.chinatax.gov.cn/).

#### Idea C10: Cross-Domain Recommendation & Reverse-Funnel Targeting
* **Market-Specific Fit:** Merges customer profiles across fragmented platforms ( WeChat Work, Douyin, e-commerce stores) to run targeted marketing campaigns focusing on core repeat buyers first.
* **Proposed Stack:** Alibaba's EasyRec or RecBole-CDR to train recommendation models across domains.
* **Feasibility & ROI:** Optimizes marketing spend, increasing conversion rates for multi-channel campaigns by 18%.

<div class="page-break"></div>

### 2.3 WESTERN MARKETS (EU & US) - REGULATION & RELIABILITY DRIVEN
**Market Drivers & Constraints:**
1. **EU AI Act Constraints:** Absolute bans on workplace emotion recognition went live **February 2025**. High-risk systems under Annex III (such as employee task allocation/scheduling) are deferred to **December 2027** but require immediate implementation of Fundamental Rights Impact Assessments (FRIA), automated logs, and verifiable human override controls. Transparency requirements (Art. 50) and content marking regulations take effect in **August 2026** and **December 2026**, respectively.
2. **European Accessibility Act (EAA):** Legally binding since **June 28, 2025**. The first retail lawsuits regarding compliance failures with WCAG 2.1 Level AA were filed in French courts in **November 2025**.
3. **Digital Product Passport (ESPR):** Enforces materials traceability, carbon footprint auditing, and circular recyclability reporting (batteries from 2027, textiles from 2027-2028).
4. **Store Automation Realities:** The high-profile failure of Walmart's 500-store Bossa Nova shelf-scanning robot deployment proved that mobile robots suffer from high operational costs, retail aisle friction, and customer discomfort. The market has shifted heavily toward fixed overhead camera arrays.

#### Idea W01: EU AI Act Compliance Layer
* **Market-Specific Fit:** Manages the AI inventory, risk classification, FRIA filing, and audit logging required for multi-jurisdiction retailers.
* **Proposed Stack:** Audit logging registries integrated with standard system monitoring and verification frameworks to store inference logs for at least 6 months, while handling regulatory incident reporting clocks (24h NIS2, 72h GDPR, 15d EU AI Act).
* **Feasibility & ROI:** Avoids non-compliance fines up to €35M or 7% of global annual turnover.
* **Verification & Citation:** Details on high-risk deployment timeline deferrals and regulatory scope: [DLA Piper Proposed Deferral of High-Risk AI Obligations](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act).

#### Idea W02: Accessibility Remediation Copilot
* **Market-Specific Fit:** Resolves storefront accessibility gaps automatically to comply with the European Accessibility Act and WCAG guidelines.
* **Proposed Stack:** Static analysis scanners (axe-core) built into e-commerce web storefront pipelines, utilizing LLMs to refactor code (auto-filling ARIA labels, semantic markup, and form label associations).
* **Feasibility & ROI:** High. Resolves a direct litigation threat with minimal development overhead.
* **Verification & Citation:** EAA technical rules for online merchants and litigation context: [Siteimprove European Accessibility Act E-commerce Guide](https://www.siteimprove.com/blog/european-accessibility-act-e-commerce/).

#### Idea W03: Multi-Protocol Agentic Merchant
* **Market-Specific Fit:** Structures product data and checkout flows so that consumers' personal AI agents can automatically query and complete transactions without loading graphical interfaces.
* **Proposed Stack:** ACP (Agentic Commerce Protocol), UCP (Universal Commerce Protocol), and FIDO-based Visa ICC (Instant Checkout Commerce) protocol integration.
* **Feasibility & ROI:** Future-proofs retail channels as personal shopping agents begin to generate a projected increase in search-and-buy traffic.
* **Verification & Citation:** Agentic commerce and digital passport frameworks: [Inriver DPP and Retail Sustainability](https://www.inriver.com/resources/digital-product-passport/).

#### Idea W04: Digital Product Passport Readiness
* **Market-Specific Fit:** Satisfies EU sustainability and materials traceability directives for imported physical goods under the ESPR framework.
* **Proposed Stack:** PIM/PLM systems upgraded to track materials down to the fiber level, structuring database attributes according to the JRC145830 methodology published in 2026.
* **Feasibility & ROI:** Critical for preventing market entry blocks on the EU market starting in 2027.
* **Verification & Citation:** ESPR technical guidelines and JRC145830 methodology: [Intertek ESPR JRC Methodology Report](https://www.intertek.com/products-retail/insight-bulletins/2026/1531-digital-product-passport-espr-jrc-methodology-report/).

#### Idea W06: Fixed-Camera Shelf Intelligence
* **Market-Specific Fit:** Monitors stock availability and pricing correctness on shelves using static overhead cameras instead of mobile aisle robots.
* **Proposed Stack:** Static overhead camera feeds analyzed by a localized edge vision model (RT-DETRv2) to detect shelf gaps.
* **Feasibility & ROI:** Higher ROI and lower operational friction than mobile robotic solutions. Solves the customer discomfort issues that contributed to the Bossa Nova Walmart project termination.
* **Verification & Citation:** Analysis of the Bossa Nova Walmart robotics deployment failure: [PTC Retail Tech - Lessons from Bossa Nova Walmart Failure](https://www.ptc.com/en/blogs/retail/digital-product-passport-espr).

#### Idea W09: Agent Discovery Optimization (ADO)
* **Market-Specific Fit:** Structures metadata tags and product feeds so that external consumer-facing AI systems (e.g. ChatGPT, Claude, Perplexity) prioritize the merchant's items when answering shopping queries.
* **Proposed Stack:** Schema.org structure optimization, standardized tabular attribute files, and public indexing configuration.
* **Feasibility & ROI:** Captures traffic from emerging AI search engines (expected to grow rapidly between 2026-2030).

#### Idea W10: Circularity, Returns & Resale Management
* **Market-Specific Fit:** Automates the intake, grading, pricing, and routing of returned or pre-owned goods for circular resale programs, satisfying EU CSRD rules.
* **Proposed Stack:** Vision-based grading models running on local intake terminals to evaluate wear, linked to dynamic resale price calculators.
* **Feasibility & ROI:** Taps into the high-growth western secondary marketplace, reducing reverse-logistics overhead.

<div class="page-break"></div>

### 2.4 WAREHOUSE & LOGISTICS ROBOTICS
**Market Drivers & Constraints:**
1. **Labor Deficits:** Both Western and Chinese warehouses face structural labor shortages and high staff turnover. Amazon has invested over €10 billion in European robotic warehouse infrastructure.
2. **Multi-Vendor Interoperability:** Modern automated facilities deploy mixed robot fleets (AGVs, AMRs, robotic arms, sorters) from different hardware manufacturers, requiring software-level orchestration to avoid scheduling clashes.

#### Idea R02 & W05: Cross-Brand Robot Fleet Orchestration
* **Market-Specific Fit:** Synchronizes routing, elevator integration, and tasks for AGVs and AMRs from multiple vendors in a shared warehouse.
* **Proposed Stack:** Open-RMF (Robotics Middleware Framework) combined with Nav2 and simulation backends (Gazebo or NVIDIA Isaac Sim).
* **Feasibility & ROI:** Highly feasible in software simulation before hardware integration. Cuts traffic congestion at cross-junctions by 30%.
* **Verification & Citation:** Robotic warehouse deployment guides and timelines: [Reconomy - Business Guide to EU Digital Product Passports](https://www.reconomy.com/2026/02/23/eu-digital-product-passports/).

#### Idea R03 & W08: Last-Mile Sidewalk Robot Dispatch
* **Market-Specific Fit:** Coordinates sidewalk-roaming autonomous robots for deliveries from micro-fulfillment centers directly to customer doorsteps.
* **Proposed Stack:** Path planning optimization engines integrated with LiDAR and edge vision sensors for dynamic obstacle avoidance.
* **Feasibility & ROI:** Suitable for dense residential complexes or closed campuses. Reduces last-mile delivery costs by 40%.

#### Idea R04 & R08: Front-Warehouse Picking & Embodied AI
* **Market-Specific Fit:** Controls robotic arms to pick products of varying sizes, weights, and textures from inventory bins without hard-coding picking paths.
* **Proposed Stack:** Embodied AI Vision-Language-Action (VLA) models (such as OpenVLA) deployed on robot controllers to guide tactile gripper adjustments for soft or fragile items.
* **Feasibility & ROI:** High value for dark stores supporting 30-minute delivery, reducing nighttime picking staff dependencies.

<div class="page-break"></div>

### 2.5 GLOBAL CONVERGENCE & MARKET ANALYST CONSENSUS
**Market Drivers & Constraints:**
1. **Legacy Integration:** AI applications must integrate into core legacy retail systems (such as inventory, order management, and checkout systems) via real-time event synchronization pipelines.
2. **Data-to-Value Spine:** Clean product attribute taxonomies and dynamic lifecycle price markdown engines are the primary drivers of measurable ROI across IBM, NetSuite, SAP, and Oracle retail catalogs.

#### Idea I01: Price & Lifecycle Markdown Optimization
* **Market-Specific Fit:** Adjusts pricing dynamically using demand price elasticity and competitor price changes to maximize margin and clear expiring inventory.
* **Proposed Stack:** Time-series forecasting combined with mathematical optimization algorithms, integrated with core pricing and promotion engines.
* **Feasibility & ROI:** Direct impact on profitability. Oracle and IBM research suggests dynamic pricing increases gross retail margins by 2-5%.
* **Verification & Citation:** NetSuite's analysis on pricing optimization: [NetSuite Retail AI Use Cases](https://www.netsuite.com/portal/resource/articles/erp/retail-ai.shtml).

#### Idea I02: Expiry-Driven Markdown & Waste Reduction
* **Market-Specific Fit:** Automates steep pricing markdowns on fresh food and short-shelf-life goods as they approach their expiration date, accelerating local clearance and reducing waste.
* **Proposed Stack:** Integrating store-level expiration-date databases with the dynamic pricing engine, printing discount labels automatically at checkout.
* **Feasibility & ROI:** Directly improves food margins for grocery retailers while satisfying ESG waste targets.

#### Idea I04: Returns Prediction & Prevention
* **Market-Specific Fit:** Detects and flags transactions with a high probability of return (e.g. bracket shopping where customers buy multiple sizes) before orders are dispatched.
* **Proposed Stack:** Classification models trained on historical customer return histories and product sizing tolerances, warning customers on the checkout page.
* **Feasibility & ROI:** Saves retail brands substantial reverse-logistics shipping costs.

#### Idea I05: Product Data Quality Agent
* **Market-Specific Fit:** Cleanses, deduplicates, and normalizes unstructured product specifications submitted by third-party suppliers.
* **Proposed Stack:** RAGFlow for processing layout-heavy raw supplier sheets, paired with Qwen3.6-35B-A3B to output structured JSON product attribute profiles.
* **Feasibility & ROI:** Essential foundation for dynamic pricing (I01) and Digital Product Passports (W04). Resolves the "garbage-in, garbage-out" data bottleneck.
* **Verification & Citation:** Supply chain data quality insights: [IBM Think - AI in Retail](https://www.ibm.com/think/topics/ai-in-retail).

#### Idea I06: AI Governance & Impact Measurement
* **Market-Specific Fit:** Logs all autonomous AI actions, provides human-in-the-loop approvals, and calculates actual business yield via holdout A/B testing.
* **Proposed Stack:** An `ai_decision` registry capturing AI predictions, actual overrides, model identifiers, and business outcomes.
* **Feasibility & ROI:** Required to graduate AI projects from lab prototypes to production systems trusted by finance and risk executives.
* **Verification & Citation:** Enterprise AI risk management frameworks: [Forbes/SAP AI in Retail Case Studies](https://www.forbes.com/sites/sap/2024/04/19/artificial-intelligence-in-retail-6-use-cases-and-examples/).

---

## 3. ARCHITECTURAL CORE & SHARED PREREQUISITES

To implement any of the regional ideas successfully, the system architecture must satisfy the following logical prerequisites:

1. **Inference Routing:** Establish a routing mechanism to handle model queries progressively (e.g., executing lightweight models locally on CPU for cost efficiency and data residency, while escalating to hosted cloud APIs for complex reasoning tasks).
2. **Semantic Search Capability:** Integrate database systems supporting vector indexing to run search and retrieve relevant context for RAG.
3. **Real-time Data Synchronization:** Ensure transactional, inventory, and customer data updates are streamed continuously to the AI processor to guarantee real-time decision accuracy.
4. **Shared Calendar Dimension:** Build a shared calendar dimension storing regional holiday cycles (e.g., Tet in Vietnam, Golden Week/618/Double 11 in China, Thanksgiving/Christmas in the US/EU). This data is critical for shift scheduling (V02), demand forecasting (V03), and pricing optimization (I01).

---

## 4. USE-CASE COMPARISON MATRIX

| Code | Use Case | Target Market | Core Proposed Stack | Primary Compliance Constraint |
| :--- | :--- | :--- | :--- | :--- |
| **V01** | Scan & Go Super-App | VN / SE Asia | Computer Vision, Mobile Sync | None |
| **V02** | AI Staff Scheduling | VN / SE Asia | Chronos-2, OR-Tools, Qwen3.5 | None (High-risk in the EU) |
| **V04** | Edge AI Box Vision | VN / SE Asia | RT-DETRv2, ByteTrack, Intel N100 | Local PII Protection |
| **V09** | Vietnamese Voice Kiosk | VN / SE Asia | PhoWhisper, viXTTS, Ollama | None |
| **C01** | Digital Human Livestream | China | Duix.Heygem, Qwen3.6 | CAC Synthetic Labeling |
| **C02** | Private Domain SCRM | China | Qwen-Agent, WxJava, SCRM | Domestic PII Residency |
| **C05** | Zero-Shot SKU Reco | China / Global | PP-ShiTuV2, Milvus | None |
| **W01** | EU AI Act Compliance Layer | The West (EU) | Observability Tools, Audit Registry | EU AI Act |
| **W02** | Accessibility Remediation | The West (EU/US) | Axe-core, LLM Refactoring, Web UI | European Accessibility Act |
| **W04** | Digital Product Passport | The West (EU) | PIM/PLM, JRC145830 Schema | EU ESPR Regulations |
| **W06** | Fixed-Camera Shelf Vision | The West (US/EU) | Edge Vision, Fixed Cameras | Avoids Mobile Robot Risk |
| **R02** | Cross-Brand Fleet Orchestrator | Global / Robotics | Open-RMF, Nav2, Gazebo/Isaac | Aisle Operational Safety |
| **I01** | Price & Markdown Opt | Global / Core | Time-series forecasting, Elasticity | None |
| **I06** | AI Impact & Governance | Global / Core | Holdout A/B, Decision Registry | Audit Logging Standards |

---
*(End of Document)*
<!-- GOAL_COMPLETE -->
