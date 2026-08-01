# Western regulation — the constraint that shapes every idea in this folder

**This document is the reason the Western set exists.** In China the binding constraint was data residency;
in the West it is a stack of regulation that is **already in force, already being litigated, and carries
penalties in the tens of millions**.

Not legal advice — an engineering brief. **Have counsel confirm before shipping.**

Snapshot: July 2026.

---

## 1 · EU AI Act — the dominant constraint

### 1.1 The trap: "the deadline moved" ≠ "nothing applies"

On **7 May 2026** EU lawmakers reached political agreement on Digital Omnibus revisions, provisionally
**delaying high-risk AI obligations for employment decisions to 2 December 2027** — a 16-month
postponement covering new or substantially modified Annex III systems.

⚠ **But:** *"Should the Omnibus not be formally adopted prior to 2 August 2026, the provisions of the
original Act, including the high-risk obligations and their initially envisaged timeline, will take
effect."* Keep preparing for August 2026 out of caution.

**And the delay applies exclusively to Chapter III high-risk obligations.** These are unaffected:

| Obligation | Status | Retail impact |
| --- | --- | --- |
| **Emotion-recognition ban** | **In force since Feb 2025 — absolute prohibition** | An employer **may not** use AI inferring emotions of employees or candidates from facial expression or tone of voice. **This kills a whole class of ideas.** |
| **AI literacy** | providers *and deployers*, since Feb 2025 | staff training obligation, now |
| **Article 50 transparency** | **2 August 2026** | disclose AI interaction to customers |
| **Content marking / watermarking** | **2 December 2026** | AI-generated product copy, images, avatars |
| **GPAI enforcement + penalties** | **2 August 2026** | the paper-compliance year ends |

**Penalties: up to €35M or 7% of global revenue.**

### 1.2 The finding that changes an existing plan

AI used for **recruitment, selection, worker management, task allocation, performance monitoring or
decisions affecting terms of work** may be **high-risk**.

For retail that sweeps in:
- **store-associate shift scheduling and task allocation engines** → [`V02 AI staff scheduling`](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) **is a high-risk AI system in the EU**
- productivity / pick-rate monitoring in warehouses and stores
- CV screening for high-volume seasonal hiring
- promotion-ranking tools

V02 was ranked *"best pick"* in the VTI set. In the EU it is buildable — but only with the deployer
obligations in §1.3 built in from day one. → [W07](W07-compliant-workforce-ai.md)

### 1.3 Deployer obligations — engineering requirements, not policy statements

| Requirement | What it means in code |
| --- | --- |
| **Notify workers** a high-risk system is in use | a UI surface and a record of notification |
| **Human oversight**, with power to intervene | approve/override, and the override must actually change the outcome |
| **Monitor for discriminatory impact** | slice metrics by protected characteristics, on a schedule |
| **Retain automated logs ≥ 6 months** | `ai_decision` already does this — extend retention |
| **Fundamental Rights Impact Assessment (FRIA)** where required | a document, versioned, with an owner |
| Follow the vendor's instructions | vendors are legally required to provide them; keep them |

Article 26 requires **operational human-oversight controls and automatic event logging at appropriate
granularity** — *"policy statements and documented intent do not satisfy these requirements."*

**This is exactly what [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) built.**
The `ai_decision` registry, the human_action field, the override rate, the model register — all of it maps
onto Article 26. That is the single most valuable cross-set finding in six folders.

### 1.4 Two traps that catch retailers specifically

1. **Substantial modification makes you the provider.** *"An organisation that substantially modifies an
   existing AI system or adapts it for a specific high-risk purpose becomes the provider in legal terms,
   and full responsibility for technical documentation and conformity assessment shifts to that
   organisation."* Fine-tuning an open model for scheduling could do this. **Record what you changed.**
2. **Three incident clocks.** After an AI-related incident an organisation may have to report within
   **24 hours (NIS2), 72 hours (GDPR) and 15 days (AI Act)**. One incident, three deadlines, three
   recipients. Build the plumbing once.

### 1.5 Readiness reality
*"Over half of organizations lack systematic AI inventories,"* and harmonised technical standards arrived
**eight months late**. An AI inventory is table stakes and most companies don't have one.
→ [W01](W01-eu-ai-act-compliance-layer.md)

Sources: [Kiteworks — high-risk deployer deadline](https://www.kiteworks.com/regulatory-compliance/eu-ai-act-deadline-compliance/) ·
[Travers Smith — delay to compliance deadlines](https://www.traverssmith.com/knowledge/knowledge-container/eu-agrees-to-delay-key-ai-act-compliance-deadlines/) ·
[DLA Piper — Digital AI Omnibus deferral](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act) ·
[Global Privacy Watch — workplace AI](https://www.globalprivacywatch.com/2026/07/workplace-ai-how-employers-should-prepare-for-the-new-eu-ai-act-deadline/) ·
[artificialintelligenceact.eu — GPAI guidelines](https://artificialintelligenceact.eu/gpai-guidelines-overview/) ·
[Chapter V enforcement](https://artificialintelligenceact.eu/enforcement-of-chapter-v-under-the-eu-ai-act/) ·
[CSA — enterprise readiness gap](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-compliance-deadline-20/)

## 2 · European Accessibility Act — a *now* problem, already in litigation

**In force across the EU since 28 June 2025.** Directive (EU) 2019/882.

| Item | Detail |
| --- | --- |
| **Scope** | e-commerce services = *"services provided at a distance through websites and mobile apps at a consumer's individual request with a view to concluding a consumer contract"* — **any business selling online to EU consumers, regardless of where the company is located** |
| **Exemption** | microenterprises: applies to online stores with **≥10 employees and ≥€2M** turnover or balance sheet |
| **Standard** | **EN 301 549**, **WCAG 2.1 Level AA minimum**. EN 301 549 v4.1.1 incorporating **WCAG 2.2** expected |
| **In practice** | ARIA for dynamic cart functionality · checkout form fields with associated labels · keyboard navigation for payment and all interactive elements · **an accessibility statement is required** |
| **Transition** | service contracts concluded **before 28 June 2025** must comply by **28 June 2027** |
| **Penalties** | vary by country, **reportedly up to €500,000 plus daily penalties** |

**Enforcement is live, not theoretical:**
- **France** issued formal legal notices to major retailers, **July 2025**
- **Sweden** launched market surveillance, **October 2025**
- **First EAA lawsuits filed in French Commercial Court, November 2025**
- **Dutch ACM** actively enforcing e-commerce requirements

**Why this matters more than it looks:** we have **two Angular frontends** (`ecommerce-front-end` SSR
storefront, `front-end` back-office). The storefront is squarely in scope. Nobody in a retail AI contest
will be talking about accessibility — and it is the one regulation here where enforcement has already
produced lawsuits. → [W02](W02-accessibility-remediation-copilot.md)

Sources: [Bird & Bird — EAA guide for online retailers](https://www.twobirds.com/en/insights/2025/a-guide-to-navigating-the-european-accessibility-act-for-online-retailers-service-providers-and-plat) ·
[Accessible.org — EAA e-commerce requirements](https://accessible.org/eaa-ecommerce-services-requirements/) ·
[Siteimprove — technical guide](https://www.siteimprove.com/blog/european-accessibility-act-e-commerce/) ·
[Level Access — EAA 2026 compliance guide](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/)

## 3 · Digital Product Passport (ESPR) — a data-architecture problem

**Regulation (EU) 2024/1781, in force since 18 July 2024.** Expands sustainability requirements beyond
energy-related products to **nearly all physical goods on the EU market**.

| Item | Detail |
| --- | --- |
| **Mechanism** | product-specific **delegated acts between 2026 and 2030** |
| **Trigger** | **market placement, not company nationality** — applies to products manufactured outside the EU |
| **First** | **batteries, mandatory from 2027** |
| **Priority sectors** | textiles, electronics, construction products, furniture — delegated acts being finalised, making **2026 the year to begin active preparation** |
| Indicative | iron & steel delegated act adoption expected 2026; textiles/apparel ~2027 |
| **EU Registry** | one source indicates operational launch **by July 2026** ⚠ verify |
| **Data** | material composition · substances of concern · environmental performance · durability · end-of-life. For textiles: **fibre-level traceability and recyclability** |
| **Methodology** | JRC released **JRC145830** on 19 March 2026 — the blueprint for future delegated acts |

**The practical read: consolidate product data (PIM/PLM) ahead of category-specific delegated acts.**
That is [`I05 product data quality`](../ai-contest-retail-industry/I05-product-data-quality.md) with a
regulatory deadline attached — and **DPP infrastructure serves double duty for ESG reporting, emissions
tracking and circular programmes from the same data investment.**
→ [W04](W04-digital-product-passport.md)

Sources: [Inriver — DPP requirements and timeline](https://www.inriver.com/resources/digital-product-passport/) ·
[PTC — ESPR readiness](https://www.ptc.com/en/blogs/retail/digital-product-passport-espr) ·
[Intertek — JRC145830 methodology](https://www.intertek.com/products-retail/insight-bulletins/2026/1531-digital-product-passport-espr-jrc-methodology-report/) ·
[Reconomy — business guide](https://www.reconomy.com/2026/02/23/eu-digital-product-passports/)

## 4 · US — a patchwork, and it started biting in 2026

| Rule | Status | Note |
| --- | --- | --- |
| **Colorado AI Act** | **effective 1 June 2026** | **first US state to impose affirmative deployer obligations for high-risk AI** |
| **California CCPA "ADMT" rules** | in force | different approach to HR-tool coverage, but *"allows employers to leverage compliance efforts across frameworks"* |
| State privacy laws (CPRA et al.) | ongoing | patchwork |

**Design consequence:** build **one** control layer, map it to several regimes. The EU AI Act deployer
obligations are the strictest; satisfying them largely satisfies Colorado and CCPA-ADMT.
→ [W01](W01-eu-ai-act-compliance-layer.md) is explicitly multi-jurisdiction.

## 5 · The compliance checklist to ship with a Western entry

1. **AI system inventory** — every AI feature, its risk classification, its jurisdiction. *Over half of
   organisations don't have one.*
2. **Emotion recognition: audit and remove.** Customer-facing sentiment analytics repurposed onto staff
   (checkout camera analytics, call-centre tone scoring) is **already prohibited**.
3. **Article 50 transparency** by 2 Aug 2026 · **content marking** by 2 Dec 2026 — the same
   mint-at-generation pattern as China's 标识办法.
4. **Deployer controls** for any workforce AI: notification, human oversight, ≥6-month logs, FRIA,
   discrimination monitoring.
5. **Provider-status guard**: record every substantial modification to a model or system.
6. **Incident plumbing**: 24h NIS2 / 72h GDPR / 15d AI Act, from one event.
7. **EAA**: WCAG 2.1 AA on the storefront, accessibility statement published, remediation plan.
8. **DPP readiness**: product data consolidation, ahead of delegated acts.

**Six of these eight are already built by [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md)
and [I05](../ai-contest-retail-industry/I05-product-data-quality.md).** As in China, Western compliance is
mostly **re-use of the governance layer**, not a new project — but here it has a court date.
