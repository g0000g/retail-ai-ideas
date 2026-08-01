# AI Contest — Retail ideas from 8 industry sources (gap-driven)

Third idea set. Sources: eight industry articles on AI in retail —
[NetSuite](https://www.netsuite.com/portal/resource/articles/erp/retail-ai.shtml) ·
[InsiderOne](https://insiderone.com/ai-retail-trends/) ·
[Forbes/SAP](https://www.forbes.com/sites/sap/2024/04/19/artificial-intelligence-in-retail-6-use-cases-and-examples/) ·
[EndearHQ](https://endearhq.com/blog/7-real-world-examples-of-ai-in-retail) ·
[Oracle](https://www.oracle.com/ca-en/retail/ai-retail/) ·
[Emarsys](https://emarsys.com/learn/blog/ai-use-cases-in-e-commerce/) ·
[Innowise](https://innowise.com/blog/ai-in-retail/) ·
[IBM](https://www.ibm.com/think/topics/ai-in-retail).

## Method — and why this folder is shaped differently

These eight articles are **use-case lists that overlap heavily**. Producing 8 × 12 = 96 plans would have
produced ~80 duplicates of work already done in the two earlier sets. So:

1. **Each source is enumerated separately, in order** → [00-source-catalog.md](00-source-catalog.md),
   with fetch status stated honestly (four of eight returned HTTP 403 and were recovered via search, so
   their enumeration is partial — the Forbes piece yielded only 2 of its 6 use cases).
2. **Cross-source frequency analysis** → [00-consensus-matrix.md](00-consensus-matrix.md): 26 distinct use
   cases × 8 sources, plus a coverage column against the two existing plan sets.
3. **Only the gaps get new plans.** 8 of them, below.

The consensus matrix is the actual deliverable of this exercise. It answers a question neither earlier set
could: *is what we're building what the market has converged on?*

## The three sets together

| Set | Source | Angle |
| --- | --- | --- |
| [`../ai-contest-retail/`](../ai-contest-retail/README.md) | NVIDIA AI Blueprints (37 repos) | reference architectures, hosted NIM |
| [`../ai-contest-retail-vti/`](../ai-contest-retail-vti/README.md) | VTI retail catalogue | open weights local-first + MiniMax escalation |
| **this folder** | 8 industry analyst/vendor articles | **market consensus + gap fill** |
| [`../ai-contest-retail-china/`](../ai-contest-retail-china/README.md) | self-directed China research | China market + Chinese OSS stack + compliance |
| [`../ai-contest-retail-china-r2/`](../ai-contest-retail-china-r2/README.md) | China round 2 | **robotics** + more OSS, sorted by a hardware-feasibility ladder |
| [`../ai-contest-retail-west/`](../ai-contest-retail-west/README.md) | Western market | **regulation-led** — EU AI Act, EAA, DPP + Bossa Nova lesson |

Model policy here follows the VTI set: **Ollama / Hugging Face open weights by default, MiniMax API on
explicit escalation** — see [`../ai-contest-retail-vti/00-model-stack.md`](../ai-contest-retail-vti/00-model-stack.md).
Nothing in this folder needs a GPU.

## The 8 new plans

| # | Idea | Gap it fills | Sources demanding it | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| [I01](I01-price-markdown-optimization.md) | **Price & markdown optimization** — elasticity, competitor signal, lifecycle markdown | nothing in either set touched pricing | 4/8 incl. all of Oracle's product line | M–L | ⭐ **biggest gap, biggest numbers** |
| [I02](I02-expiry-markdown-waste.md) | **Expiry-driven markdown & waste reduction** | "sustainability" made concrete | 3/8 | M | ⭐ hard measurable outcome |
| [I03](I03-assortment-space-planogram.md) | **Assortment, store clustering & planogram intelligence** | Oracle's core product line | 3/8 | M–L | high |
| [I04](I04-returns-prediction-prevention.md) | **Returns prediction & prevention** (not abuse detection) | N-10 covers abuse only | 2/8 + the $816B stat | M | high |
| [I05](I05-product-data-quality.md) | **Product data quality agent** — attribute extraction from free-form supplier text, dedup, normalization | N-02 creates data, nothing cleans it | 2/8 | S–M | ⭐ cheapest, unblocks I01/I03 |
| [I06](I06-ai-governance-measurement.md) | **AI governance & impact measurement** — decision registry, holdout A/B, model register | every source's *challenges* list | 3/8 | S–M | ⭐ **the differentiator** |
| [I07](I07-proactive-service-orders.md) | **Proactive customer service** — predict the problem before the complaint | Emarsys "predictive customer service" | 1/8 | M | medium–high |
| [I08](I08-delivery-route-optimization.md) | **Delivery & route optimization** | declined earlier; reconsidered | 5/8 supply-chain mentions | M | medium |

### Recommended additions to the contest entry

**I05 → I01 → I02, plus I06 running underneath.**

- **I05 first** (~10 days) because clean attributes are a prerequisite for both pricing and assortment.
  It is also the cheapest plan in any of the three folders.
- **I01** is where the money and the quotable numbers are, and `price-service` + `promotion-service` +
  the promotion engine already exist.
- **I02** rides on I01's infrastructure for ~40% of the cost and produces the single most defensible
  metric in any of the three sets: *kilograms not thrown away*.
- **I06** is the slide that separates this entry from a demo. Every one of the eight sources lists
  "review AI decisions" and "measure real business impact" as the blocker — not model accuracy.

If only one thing is added from this folder: **I06**. It costs ~9 days and it retroactively improves
every plan in all three folders by giving them a measured result instead of a claim.

## Diagrams

`diagrams/*.drawio` source · `*.drawio.png` 2× raster with XML embedded · `*.svg` vector for slides.

| Diagram | File |
| --- | --- |
| Consensus matrix + coverage across all three sets | `diagrams/landscape-industry.drawio.png` |
| I01 — Price & markdown optimization | `diagrams/industry-01-price-markdown.drawio.png` |
| I02 — Expiry-driven markdown & waste | `diagrams/industry-02-expiry-waste.drawio.png` |
| I04 — Returns prediction & prevention | `diagrams/industry-04-returns.drawio.png` |
| I06 — AI governance & impact measurement | `diagrams/industry-06-governance.drawio.png` |

## Prerequisites (same as the other two sets)

1. Ollama container + `qwen3.5:4b`, `bge-m3` (see the VTI model stack).
2. MiniMax API key in OpenBao; egress test through the MITM proxy on day one.
3. **`ai-service` off port `:8109`** — Apicurio owns it on the dev server.
4. `pgvector/pgvector:pg16` image swap for anything doing retrieval.
5. **`dim_calendar`** — Tet, holidays, paydays. Shared by V02, V03, I01, I02, I03. Build once.
6. Read-only role on the **pgpool standby**; every analytical read in this folder goes there.

## A caution to carry into the deck

All eight sources are vendor or vendor-adjacent marketing (six are product pages). Their statistics are
evidence of **what the market is buying**, not evidence of what will happen here. Quote them with
attribution and pair each with our own measured baseline — which is exactly what
[I06](I06-ai-governance-measurement.md) exists to produce.
