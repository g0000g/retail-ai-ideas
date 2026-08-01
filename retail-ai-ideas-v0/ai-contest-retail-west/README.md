# AI Contest — Retail ideas for the Western market

Sixth idea set. Same treatment as the China rounds — **open-source solutions, feasible ideas, robotics
included** — aimed at the EU/US market.

| Document | What it holds |
| --- | --- |
| [00-west-regulation.md](00-west-regulation.md) | **The reason this folder exists.** EU AI Act (emotion-recognition ban live, Art. 50 transparency 2 Aug 2026, content marking 2 Dec 2026, high-risk employment deferred to Dec 2027 *if* the Omnibus is adopted), European Accessibility Act (**in force, already litigated**), Digital Product Passport/ESPR, Colorado AI Act, CCPA-ADMT |
| [00-west-market-research.md](00-west-market-research.md) | Warehouse robotics (Amazon €10B Europe, Symbotic↔Walmart, 85,000+ units deployed), **the Bossa Nova failure and its five lessons**, agentic commerce protocol stack (ACP + AP2 + UCP + Visa ICC), and the four ways the West differs from China |
| [00-west-oss-stack.md](00-west-oss-stack.md) | Western OSS + **the relicensing pattern** (Terraform/Redis/Elastic/Mongo/Grafana), Llama/Gemma/Mistral licence shapes, the **accessibility toolchain**, and the Article-26-to-component mapping |

## The one-line difference from every earlier folder

> **In China the binding constraint was where the data lives. In the West it is what the AI system is
> allowed to do, documented, logged, and provable — with dates and penalties already attached.**

Three constraints are **live right now**, not forthcoming:

| Live constraint | Since | Bite |
| --- | --- | --- |
| **Emotion-recognition ban** (AI Act) | Feb 2025 | absolute prohibition on inferring employee/candidate emotion — **kills a class of ideas outright** |
| **European Accessibility Act** | 28 Jun 2025 | **France issued legal notices Jul 2025; first lawsuits filed Nov 2025; Sweden and the Dutch ACM enforcing** |
| **AI literacy** (AI Act) | Feb 2025 | applies to deployers, not just providers |

And three land inside the contest horizon: **Art. 50 transparency (2 Aug 2026)**, **GPAI enforcement
(2 Aug 2026)**, **content marking (2 Dec 2026)**.

## The finding that changes an existing plan

**[`V02 AI staff scheduling`](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) — ranked "best pick" in
the VTI set — is a high-risk AI system in the EU.** Worker task allocation and performance monitoring sit
squarely in Annex III.

It is still buildable. It needs worker notification, human oversight that can actually change the outcome,
≥6-month logs, discriminatory-impact monitoring and a FRIA — **all of which
[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) already built for other reasons.**
→ [W07](W07-compliant-workforce-ai.md)

## The robotics finding that qualifies another one

**[`R01` shelf-scanning robot](../ai-contest-retail-china-r2/R01-shelf-scanning-robot.md) succeeded at
Simbe/Schnucks and failed at Bossa Nova/Walmart** — 500+ stores, cancelled Nov 2020, vendor laid off 50%
of staff. The three stated reasons were all non-technical: labour re-deployment flipped the ROI, **customers
were uncomfortable with six-foot robots in the aisle**, and simpler human methods were cheaper.

The lesson that generalises hardest: *"investment in fixed camera technologies … imperils the value
proposition of robotic shelf scanning."* → [W06](W06-fixed-camera-shelf-intelligence.md) builds the
**fixed-camera** version instead, and says why.

## The 10 ideas

| # | Idea | Driver | Effort | Verdict |
| --- | --- | --- | --- | --- |
| [W01](W01-eu-ai-act-compliance-layer.md) | **EU AI Act compliance layer** — inventory, classification, FRIA, logs, 3-clock incident reporting | regulation, multi-jurisdiction | M | ⭐ **the differentiator** |
| [W02](W02-accessibility-remediation-copilot.md) | **Accessibility remediation copilot** — EAA/WCAG 2.1 AA on the storefront | **already being litigated** | S–M | ⭐ **most urgent, cheapest** |
| [W03](W03-multi-protocol-agentic-commerce.md) | **Multi-protocol agentic merchant** — ACP + AP2 + UCP, Visa ICC | 75% of NRF retailers | M | ⭐ updates set-1 idea 03 |
| [W04](W04-digital-product-passport.md) | **Digital Product Passport readiness** — ESPR data architecture | delegated acts 2026–2030 | M | high |
| [W05](W05-warehouse-fleet-orchestration.md) | **Warehouse fleet orchestration**, Western vendors, back-of-house first | where automation pencils out | M | high |
| [W06](W06-fixed-camera-shelf-intelligence.md) | **Fixed-camera shelf intelligence** instead of a robot | the Bossa Nova lesson | M | ⭐ better than R01 for the West |
| [W07](W07-compliant-workforce-ai.md) | **Compliant workforce AI** — V02 rebuilt for Annex III | high-risk classification | M | ⭐ nobody else will do this |
| [W08](W08-last-mile-sidewalk-robots.md) | **Sidewalk/road delivery robots + micro-fulfilment** | Western last-mile | M | medium |
| [W09](W09-agent-discovery-optimisation.md) | **Agent discovery optimisation** — product data for AI agents | +4,700% genAI traffic YoY | S–M | ⭐ cheap, nobody treats it as a discipline |
| [W10](W10-circularity-returns-resale.md) | **Circularity: returns → resale → reporting** | CSRD/DPP + returns cost | M | high |

### Recommended from this set

**W02 → W01 → W09, with W07 as the compliance showpiece.**

- **W02 first** because it is the only item here with **lawsuits already filed**, it is the cheapest plan in
  the folder, and it touches a frontend we own.
- **W01** is the differentiator, and six of the eight compliance items are already built by I06/I05.
- **W09** is genuinely cheap and answers the guidance the agentic-commerce sources give explicitly:
  *"optimise product data for AI agent discovery."* Nobody treats that as its own discipline yet.
- **W07** is the slide that separates this entry: *"here is our high-risk AI system, and here is the
  Article 26 evidence."*

Add **W06** if a store demo is wanted — it is the Bossa Nova lesson turned into a design, and explaining
*why we did not use a robot* is a stronger segment than a robot driving down an aisle.

## How this set relates to the other five

| This set | Elsewhere | Relationship |
| --- | --- | --- |
| W01 AI Act layer | [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) | **I06 already satisfies most of Article 26.** W01 adds classification, FRIA and the 3-clock incident path |
| W07 workforce AI | [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) | same plan, rebuilt with Annex III deployer obligations |
| W02 accessibility | `ecommerce-front-end` (Angular SSR) | new capability, existing frontend |
| W03 agentic | [N-03](../ai-contest-retail/03-agentic-commerce-acp-ucp.md) | N-03 predates AP2's FIDO donation and the ChatGPT Instant Checkout shutdown — **read W03 first** |
| W04 DPP | [I05](../ai-contest-retail-industry/I05-product-data-quality.md) | I05 with a regulatory deadline attached |
| W05 fleet | [R02](../ai-contest-retail-china-r2/R02-fleet-orchestration-openrmf.md) | same Open-RMF layer, Western vendors, back-of-house scope |
| W06 fixed cameras | [R01](../ai-contest-retail-china-r2/R01-shelf-scanning-robot.md) · [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) | **W06 is V04 without the robot** — and the evidence says that is often the right call in the West |
| W09 agent discovery | [V06](../ai-contest-retail-vti/V06-omnichannel-product-sync.md) · [I05](../ai-contest-retail-industry/I05-product-data-quality.md) | same product-data spine, a different consumer: the agent |
| W10 circularity | [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) · [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) | closes the loop those two open |
| Model choice | [`../ai-contest-retail-china/00-china-oss-stack.md`](../ai-contest-retail-china/00-china-oss-stack.md) | **Qwen3.6/DeepSeek/GLM have cleaner licences than Llama or Gemma**, and Chinese open weights are not export-restricted. Sovereignty may still be a procurement question — have both answers |

## Prerequisites

1. **Answer one question first:** *was the AI Act Digital Omnibus formally adopted before 2 August 2026?*
   Yes → high-risk employment obligations run to Dec 2027. No → the original August 2026 timeline applies.
   It moves a deadline by 16 months and it is a yes/no lookup.
2. **AI system inventory** — over half of organisations don't have one. It is the first deliverable of W01
   and a prerequisite for everything else here.
3. **`ai-service` off `:8109`** (Apicurio owns it) — same finding in all six folders.
4. **`pgvector/pgvector:pg16`** swap for retrieval.
5. **Accessibility baseline scan** of `ecommerce-front-end` — one afternoon, and it sizes W02.
6. **Licence register**, including the **relicensing watch-list** (Redis, Elasticsearch, Grafana) and the
   **conditional** entries (Llama MAU threshold, Gemma terms, Mistral per-model).

## Diagrams

`diagrams/*.drawio` source · `*.drawio.png` 2× raster with embedded XML · `*.svg` vector for slides.

| Diagram | File |
| --- | --- |
| Regulatory timeline + the 10 ideas mapped onto it | `diagrams/landscape-west.drawio.png` |
| W01 — EU AI Act compliance layer | `diagrams/west-01-ai-act.drawio.png` |
| W02 — Accessibility remediation copilot | `diagrams/west-02-accessibility.drawio.png` |
| W03 — Multi-protocol agentic commerce | `diagrams/west-03-agentic-commerce.drawio.png` |
| W06 — Fixed cameras vs. the robot that failed | `diagrams/west-06-fixed-camera.drawio.png` |
