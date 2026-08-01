# Cross-source consensus matrix & coverage gap analysis

The point of reading eight industry sources is **not** to get eight lists. It is to find out which use
cases the market has actually converged on — and then to check which of those we have not planned yet.

Rows below are ordered by source count, with the deliberately-declined items grouped at the end.

Sources: **1** NetSuite · **2** InsiderOne · **3** Forbes/SAP · **4** EndearHQ · **5** Oracle ·
**6** Emarsys · **7** Innowise · **8** IBM

Coverage columns: **N** = the NVIDIA-blueprint set (`../ai-contest-retail/`) ·
**V** = the VTI set (`../ai-contest-retail-vti/`) · **I** = new plans in this folder.

---

## The matrix

| Use case | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Freq | Already covered by | Gap? |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- | --- |
| **Demand forecasting** | ● | ● | ● | ● | ● | ● | ● | ● | **8/8** | N-05, **V03** (Chronos-2) | ✅ covered |
| **Inventory management / replenishment** | ● | ● | ● | ● | ● | ● | ● | ● | **8/8** | V03 | ✅ covered |
| **Personalized recommendations** | ● | ● | | ● | ● | ● | ● | ● | **7/8** | **V05** | ✅ covered |
| **Chatbot / virtual shopping assistant** | ● | ● | | ● | | ● | ● | ● | **6/8** | **N-01**, V09 | ✅ covered |
| **Fraud detection** | | ● | | ● | | ● | ● | | **4/8** | N-10 (return abuse) | 🟡 partial — payment fraud is the PSP's job; return/promo abuse is ours |
| **Dynamic pricing / markdown optimization** | | ● | | ● | ● | ● | | | **4/8** | — | 🔴 **GAP → [I01](I01-price-markdown-optimization.md)** |
| **Visual search / image recognition** | ● | ● | | ● | | ● | ● | | **5/8** | N-08 | 🟡 partial (NV-CLIP deprecated; VLM workaround planned) |
| **Customer segmentation** | | ● | | ● | ● | ● | ● | | **5/8** | V05 | ✅ covered |
| **Supply chain & logistics / route optimization** | ● | ● | | | | ● | ● | ● | **5/8** | — | 🔴 **GAP → [I08](I08-delivery-route-optimization.md)** |
| **Generative content: descriptions, copy, creative** | ● | ● | | | | ● | ● | | **4/8** | N-02, V05, V06 | ✅ covered |
| **Voice commerce / voice-activated transactions** | | ● | | | | ● | ● | ● | **4/8** | **V09** (PhoWhisper) | ✅ covered |
| **Computer vision in store / loss prevention / merchandising** | | ● | | | | | ● | ● | **4/8** | **V04** (edge box) | ✅ covered |
| **Omnichannel / CDP data unification** | ● | ● | | | | | ● | | **3/8** | V05 + existing channel-service | 🟡 platform work, not an AI feature |
| **Automated / cashierless checkout** | ● | | | | | | ● | | **2/8** | **V01** (Scan & Go) | ✅ covered |
| **Sustainability / waste reduction / spoilage** | ● | ● | | | | | ● | | **3/8** | — | 🔴 **GAP → [I02](I02-expiry-markdown-waste.md)** |
| **Assortment planning / space / planogram / visual merchandising** | ● | | | | ● | | ● | | **3/8** | — | 🔴 **GAP → [I03](I03-assortment-space-planogram.md)** |
| **Returns prediction & prevention** | ● | | | | | ● | | | **2/8** | N-10 covers *abuse*, not *prevention* | 🔴 **GAP → [I04](I04-returns-prediction-prevention.md)** |
| **Product data quality / attribute extraction from free text** | ● | | | | ● | | | | **2/8** | N-02 covers *creation*, not *cleansing* | 🔴 **GAP → [I05](I05-product-data-quality.md)** |
| **Predictive / proactive customer service** | | | | | | ● | | | **1/8** | — | 🔴 **GAP → [I07](I07-proactive-service-orders.md)** |
| **AI governance: review decisions, measure impact, privacy** | ● | | | | | | ● | ● | **3/8** | N-12 covers *guardrails*, not *measurement* | 🔴 **GAP → [I06](I06-ai-governance-measurement.md)** |
| **AR / VR try-on** | | | | | | ● | ● | | **2/8** | declined in both sets | ⚪ still declined — no headsets, no 3D catalogue, weak ROI |
| **Email/campaign optimization: send-time, subject lines** | | ● | | | | ● | | | **2/8** | folds into V05 | ⚪ small, fold in |
| **Social media monitoring** | | | | | | ● | | | **1/8** | — | ⚪ out of scope — no social listening data source |
| **Warehouse robots / physical AI** | ● | ● | | | | | | ● | **3/8** | — | ⚪ out of scope — capex, not software |
| **Biometric verification** | | ● | | | | | ● | | **2/8** | V10 declined it | ⚪ declined on licence + privacy grounds |
| **Product design & development** | | | | | | | ● | | **1/8** | — | ⚪ we are a retailer's platform, not a brand |

## What the matrix actually says

**1. The top of the list was already the top of our list.** Demand forecasting and inventory appear in
8/8 sources; recommendations in 7/8; chatbots in 6/8. All three were already the strongest picks in the two
earlier sets. That is confirmation, not new information — but it is worth one slide, because it means the
work already planned is aimed at what the market has converged on rather than at what is novel.

**2. Pricing is the single biggest hole.** Dynamic pricing / markdown optimization appears in 4 sources
including Oracle's entire product line (Lifecycle Pricing Optimization; Promotion, Markdown and Offer
Optimization) and carries the loudest numbers in the set (Amazon repricing 2.5M times a day; revenue +20%,
profit +22%). Neither earlier set touches it, despite `price-service` and `promotion-service` both being
live. **This is the highest-value new plan in the folder.**

**3. Oracle's page is worth more than the other seven combined** for gap-finding, because it names
operational products rather than themes: assortment & space optimization, demand transference, customer
decision trees, store clustering, size-ratio optimization accounting for stockouts, item-attribute
extraction from free-form descriptions. Four of the eight new plans here came from that one page.

**4. Sustainability turns out to be a pricing problem.** Three sources list waste reduction as a trend;
in a Vietnamese grocery/drugstore context the mechanism is concrete — near-expiry stock either gets marked
down at the right time or gets thrown away. That makes [I02](I02-expiry-markdown-waste.md) an extension of
[I01](I01-price-markdown-optimization.md), not a separate ESG initiative, and it has a hard measurable
outcome (kg wasted, margin recovered) rather than a soft one.

**5. Every source that mentions challenges mentions the same three.** NetSuite: *review AI decisions*,
*measure real business impact*, *connect promotions with available inventory*. Innowise: *ethical AI and
data privacy*. IBM: CV compliance. Forbes/SAP: *investment in both technology and people*. Nobody's
challenge list is about model accuracy. → [I06](I06-ai-governance-measurement.md).

**6. The IBM source independently validates a design decision we already made.** Its compliance note —
footfall and queue counting need no personal data, but face recognition and shopper tracking need explicit
notice, a legal basis and usually a privacy impact assessment — is exactly the line drawn in
[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) and
[V10](../ai-contest-retail-vti/V10-face-attendance.md). Cite it in the deck.

## Consolidated coverage after this folder

| Status | Count | Notes |
| --- | --- | --- |
| ✅ Covered by an existing plan | 10 use cases | N and V sets |
| 🔴 New plan in this folder | **8** | I01–I08 |
| 🟡 Partial / platform work | 4 | fraud (PSP boundary), visual search (NV-CLIP), CDP, email micro-optimization |
| ⚪ Deliberately declined, with a stated reason | 5 | AR/VR, social listening, warehouse robots, biometrics, product design |

**26 distinct industry use cases; 21 planned or deliberately declined with reasons.** That completeness
table is itself a good contest slide — it shows the entry was scoped against the market rather than against
whatever seemed fun to build.
