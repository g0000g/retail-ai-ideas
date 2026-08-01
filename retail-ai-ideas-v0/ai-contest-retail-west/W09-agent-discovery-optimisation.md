# W09 — Agent discovery optimisation (product data for AI agents)

> **Driver:** *"optimise product data for AI agent discovery"* — the explicit guidance from the agentic-commerce sources · **Effort:** S–M (~2 weeks) · **Verdict:** ⭐ cheap, and nobody treats it as a discipline yet

## The signal

| Fact | Source |
| --- | --- |
| Adobe: **generative-AI traffic to US retail sites grew +4,700% YoY**, Jul 2024 → Jul 2025 | [00-west-market-research.md](00-west-market-research.md) §3 |
| **75% of NRF 2026 retailers** implementing agentic commerce; **~1% of shoppers** using agents to buy | same |
| Merchant guidance, verbatim | *"prepare for both protocols, **optimise product data for AI agent discovery**, and ensure payment infrastructure supports delegated token-based transactions"* |
| Gap's CTO on UCP vs ACP | UCP *"gives merchants more control over the shopping experience"* — including **catalogue access and identity linking** |

Two of those three guidance clauses are covered by [W03](W03-multi-protocol-agentic-commerce.md).
**The middle one — product data for agents — is a separate discipline, and it has no owner anywhere in six
folders.** That is this plan.

## What "optimised for agents" actually means

An AI agent is not a shopper and not a search crawler. It is a **program with a budget, a constraint list
and no patience**, reading a catalogue to answer a question like *"a cotton shirt under €60, in stock in
Berlin, delivered by Friday, that fits like my last order."*

| A human shopper needs | A search crawler needs | **An agent needs** |
| --- | --- | --- |
| photos, reviews, feel | keywords, titles, schema.org | **structured, complete, machine-checkable attributes** |
| persuasion | relevance | **constraint satisfiability** — can it filter on this field? |
| a page | a URL | **an API, a feed, and a stable identifier** |
| brand story | meta description | **availability, price and delivery promise that are true right now** |

**The failure mode is silent.** An agent that cannot determine whether a shirt is cotton simply does not
return it. There is no bounce rate, no abandoned cart, no signal at all — the sale never enters the funnel.
That is the argument for doing this before the volume arrives.

## The four workstreams

### 1 · Attribute completeness against an agent-answerable question set
Not "fill every field" — **fill the fields agents filter on**. Derive the target set from real questions:
material, fit, size system, colour family, care, dimensions, weight, power, compatibility, allergens,
age suitability, certifications.

Measure **agent-answerability**: for a list of ~50 realistic constraint questions per category, what
fraction of the catalogue can be correctly included or excluded? That is a far better metric than
"completeness %", and it is the number to put on a slide.

Depends on [I05](../ai-contest-retail-industry/I05-product-data-quality.md) — dirty attributes are
unanswerable attributes.

### 2 · Machine surfaces
| Surface | Purpose |
| --- | --- |
| **schema.org Product / Offer / AggregateOffer** in the SSR storefront | still how most crawlers and some agents read a page — and we render server-side, so it is nearly free |
| **UCP catalogue access** | the agent-native path ([W03](W03-multi-protocol-agentic-commerce.md)) |
| **MCP tools** — `search_product`, `get_stock_availability`, `get_price_for_channel` | **already built in `ai-service`.** An agent that speaks MCP can already query us |
| **Feed** (Google Merchant-style) | the boring one that still drives volume |
| `/.well-known/agent-card.json` | capability advertisement |
| **`llms.txt`** ⚠ | an emerging convention for agent-readable site guidance — **unverified adoption**, cheap to add, do not build a business case on it |

**We are further along than we look**: `ai-service` is already an MCP server with product tools. The gap is
that nothing advertises it and the attribute quality behind it is untested.

### 3 · Truthfulness at agent latency
An agent will act on what it reads. So:
- price and availability in machine surfaces must be **live**, not cached overnight
- a delivery promise must be **computable per postcode**, not a generic "2–5 days"
- an out-of-stock item must say so, in the surface, at read time

This is the same rule as [C01](../ai-contest-retail-china/C01-digital-human-livestream.md)'s overlay
principle: **never bake a fact into a static artefact when the fact changes.**

### 4 · Measurement — instrument now, while it is cheap
Per the sources: *"instrument agent transaction flows now, while volumes are low enough to debug
properly."*

```
agent_interaction(
  ts, agent_identity,          -- from the agent card / user-agent / ACP or UCP session
  surface,                     -- schema.org · UCP · MCP · feed
  query_intent, constraints[], -- what it asked for
  results_returned, results_excluded_for_missing_attribute,   ← THE key metric
  session_id, outcome          -- browsed · carted · purchased · abandoned
)
```

**`results_excluded_for_missing_attribute` is the number that justifies the whole plan** — it converts a
data-quality problem into lost revenue, per SKU, per attribute.

## Architecture

```
goods-service catalogue  ──▶  I05 cleaning + normalisation
        ▼
  AGENT-ANSWERABILITY SCORER
     per category: ~50 constraint questions → % of SKUs correctly filterable
     → gap list: which attribute, how many SKUs, which questions it blocks
        ▼
  ├─▶ merchandising queue: "fill material on 340 SKUs → unblocks 12 agent questions"
  └─▶ N-02 / I05 enrichment for the ones a VLM can infer from images
        ▼
  MACHINE SURFACES
     schema.org (SSR) · UCP catalogue · MCP tools · feed · agent-card
     price + availability read LIVE from price-service / stock-service
        ▼
  agent_interaction instrumentation → I06 ai_decision + OTel
        ▼
  dashboard: agent traffic by surface · answerability by category ·
             exclusions by missing attribute · agent-attributed revenue
```

## Build steps

1. **(2 days)** Constraint-question set per demo category, written **with a merchandiser** — 50 realistic
   agent questions. This is the deliverable everything else scores against.
2. **(3 days)** Answerability scorer over the catalogue; gap list by attribute × question × SKU count.
3. **(2 days)** Route gaps into the [I05](../ai-contest-retail-industry/I05-product-data-quality.md)
   queue and the [N-02](../ai-contest-retail/02-catalog-enrichment.md) VLM enrichment path for
   image-inferable attributes.
4. **(2 days)** schema.org Product/Offer markup in the SSR storefront, **live** price and availability.
5. **(2 days)** Advertise what already exists: agent-card, MCP tool descriptions written *for an agent
   reader*, UCP catalogue endpoint stub ([W03](W03-multi-protocol-agentic-commerce.md) phase 2).
6. **(2 days)** `agent_interaction` instrumentation across all surfaces.
7. **(1 day)** Dashboard + the exclusion metric.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Building for 1% of shoppers** | Cost is ~12 days, the data work is needed for [W04 DPP](W04-digital-product-passport.md) and [V06 marketplace sync](../ai-contest-retail-vti/V06-omnichannel-product-sync.md) anyway, and the traffic signal is +4,700% YoY. Framed as readiness, measured honestly. |
| Agent traffic is hard to identify | Agent-card and protocol sessions are explicit; heuristics on user-agent are not. **Report identified agent traffic only**, and say what fraction is unattributable |
| `llms.txt` and similar conventions may not stick | ⚠ marked unverified. Cheap to add, no business case built on it |
| Optimising for agents degrades the human page | schema.org and SSR markup are invisible to humans. Do not let agent optimisation change copy or layout — that is SEO's mistake being repeated |
| Stale price/availability in a machine surface | Live reads, no overnight cache. Same rule as C01's overlays. |
| Scope creep into an SEO/GEO agency service | Line: attribute answerability, machine surfaces, instrumentation. Not content marketing, not link building. |

## Demo script (2 minutes)

1. Ask an agent a realistic constrained question against our catalogue: *"cotton shirt under €60, in stock
   in Berlin, delivered by Friday."*
2. **Before:** it returns 3 products. Show why — **340 SKUs were excluded because `material` is empty**,
   not because they didn't match.
3. Run the answerability scorer: category answerability 38%, top blocking attribute `material`, then `fit`.
4. Fill those attributes through the [I05](../ai-contest-retail-industry/I05-product-data-quality.md) +
   [N-02](../ai-contest-retail/02-catalog-enrichment.md) path, approved through the existing SKU audit gate.
5. **After:** the same question returns 47 products. Answerability 81%.
6. Dashboard: `results_excluded_for_missing_attribute` falling; agent traffic by surface.

The before/after in steps 2 and 5 is the whole pitch, and it takes 30 seconds to show.

## Effort

~14 dev-days, and it shares its data spine with [I05](../ai-contest-retail-industry/I05-product-data-quality.md),
[W04](W04-digital-product-passport.md) and [V06](../ai-contest-retail-vti/V06-omnichannel-product-sync.md) —
four regulatory and commercial drivers, one product-data investment.
