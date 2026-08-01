# I05 — Product data quality agent

> **Sources:** Oracle (*item attribute extraction from free-form descriptions, correcting short forms and
> misspellings*, feeding demand transference / customer decision trees / advanced clustering) ·
> NetSuite (*inconsistent product data and fragmented customer records prevent retailers acting on
> insights*) — **2/8 sources, but a prerequisite for four other plans**
> **Local model:** `bge-m3` (MIT) + `qwen3.5:4b` · **MiniMax:** rarely
> **New infra:** pgvector image swap · **GPU:** none · **Effort:** S–M (~2 weeks) · **Verdict:** ⭐ cheapest plan in any folder, unblocks the expensive ones

## Pitch

Supplier data arrives as free-form Vietnamese text: `"Sữa Meiji so 1 800g (hop thiec) - hang cty"`.
Our catalogue needs brand, product line, stage, net weight, packaging type, unit of measure, and a
category assignment — as **structured, enum-constrained attributes**.

This agent:

1. **Extracts** attributes from free-form supplier descriptions, correcting short forms and misspellings.
2. **Normalises** units, pack sizes, brand spellings and diacritic variants to a canonical form.
3. **Deduplicates** — finds the four SKUs that are actually the same product entered four times.
4. **Scores** every SKU's data completeness and flags what's missing, per category schema.

## Why this is the highest-leverage cheap plan

Oracle names attribute extraction as a *feeder* for demand transference, customer decision trees and store
clustering. That is the point: **four other plans silently depend on clean attributes**:

| Depends on clean attributes | Why |
| --- | --- |
| [I01 pricing](I01-price-markdown-optimization.md) | elasticity is fitted per *category × cluster*; wrong categories → wrong elasticities. Competitor product matching needs normalised brand + pack size. |
| [I03 assortment & space](I03-assortment-space-planogram.md) | substitution/transference is computed between *similar* items — similarity needs attributes |
| [I02 expiry markdown](I02-expiry-markdown-waste.md) | needs shelf life and pack size populated |
| [V06 marketplace sync](../ai-contest-retail-vti/V06-omnichannel-product-sync.md) | marketplace required attributes are mapped *from* ours; garbage in, rejected listing out |
| [V05 personalization](../ai-contest-retail-vti/V05-personalization-loyalty.md) | content-based cold start uses attribute text |

Build this first and everything downstream gets cheaper and better. It also costs less than any other plan
in the three folders.

## Distinct from N-02

[`../ai-contest-retail/02-catalog-enrichment.md`](../ai-contest-retail/02-catalog-enrichment.md) **creates**
catalogue data from a product image. I05 **cleans and structures data that already exists** — tens of
thousands of live SKUs with inconsistent text. Different input, different failure mode, same target schema.
They compose: N-02 for new SKUs, I05 for the back catalogue.

## Architecture

```
goods-service  existing SKU/SPU  (free-form names, sparse attributes)
        ▼
ai-service  data-quality pipeline    (batch, workflow-service flow)

 1 · NORMALISE  — deterministic first, no model
      Unicode NFC · diacritic-tolerant matching · whitespace/punctuation
      units: g/gr/gam/gram → g ·  ml/mL/l/lít → ml
      pack: "hop"/"hộp"/"box" → BOX ·  "lon"/"can" → CAN
      numbers: 1.234 vs 1,234 vs 1234  (VN thousand separator trap)
      → rules catch most of it. Do this BEFORE reaching for a model.

 2 · EXTRACT   — tier 0 qwen3.5:4b, JSON-schema-constrained
      input: the raw description + the CATEGORY'S OWN attribute schema
             (CategoryAttributeController) with its enum values
      output: {attribute: value, confidence, evidence_span}
      hard rule: an attribute with a value list can ONLY take a value from that list

 3 · VALIDATE  — deterministic
      enum membership · numeric ranges (net weight 0.1–25 kg)
      unit coherence (a 800g "lon" is plausible; an 800kg one is not)
      cross-field: pack_size × units_per_pack == total_quantity
      fail → repair loop (max 2) → escalate → or park as "needs human"

 4 · DEDUPE    — bge-m3 embeddings + pgvector + blocking
      block on (brand, net weight, category) then rank by embedding similarity
      barcode is the strongest signal when present — trust it over text
      → candidate duplicate clusters, HUMAN CONFIRMS the merge, always

 5 · SCORE     — completeness per SKU against its category schema
      0-100, with the missing required attributes named
        ▼
  Back-office data-quality dashboard
    worst categories · worst suppliers · duplicate clusters awaiting confirmation
    "fix these 20 SKUs to unblock pricing for this category"
        ▼
  SkuDraft + SkuAttributeValueDraft  →  SkuAuditController  →  live
  (the SAME human approval gate N-02 uses — nothing auto-writes to live SKUs)
```

**Rules before models, hard.** Step 1 is deterministic and catches the majority of Vietnamese text mess
(diacritics, unit abbreviations, thousand separators). Reaching for an LLM to normalise `"800gr"` → `800 g`
is the wrong instinct and the wrong cost.

## Vietnamese-specific traps to encode

| Trap | Handling |
| --- | --- |
| Text entered without diacritics (`"sua meiji"`) | Diacritic-insensitive matching for lookup; canonical form always *with* diacritics |
| Same brand spelled 5 ways (`Meiji`, `MEIJI`, `Meiji Nhật`, `meiji jp`) | Brand alias table, seeded by the dedupe step, human-confirmed once and reused forever |
| `1.234.567,89` vs `1,234,567.89` | Locale-aware parsing, unit-tested. Same trap as [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md). |
| Unit ambiguity: `"1 thùng"` = how many? | Never guess. Park as needs-human unless `units_per_pack` is present. |
| Size in the name vs size in an attribute, disagreeing | Cross-field validation flags it; name is *not* authoritative |
| Parallel-import vs official-distributor variants of the same product | These are genuinely different SKUs (warranty, price). Dedupe must **not** merge them — treat the `hàng cty` / `xách tay` marker as a blocking attribute. |

That last one matters: an over-eager dedupe that merges official and parallel-import stock corrupts pricing
and stock. Blocking attributes are as important as similarity.

## Where each tier is used

| Step | Tier | Notes |
| --- | --- | --- |
| Normalise | none — rules | cheapest, most reliable |
| Attribute extraction | tier 0 `qwen3.5:4b`, enum-constrained + validator | |
| Embeddings for dedupe | tier 0 `bge-m3` | dense + sparse handles diacritic and named-entity variation |
| Genuinely ambiguous descriptions | tier 2 MiniMax-M2.5, rare | public catalogue text is fine to send |
| Dedupe *decision* | **human, always** | a wrong merge corrupts stock and pricing |

## Build steps

1. **(2 days)** Normalisation rules + unit tests. Measure how much of the mess it fixes alone — report that
   number, it's a good slide.
2. **(3 days)** Extraction: fetch the category attribute schema, enum-constrained structured output,
   validator, repair loop. Reuse the plumbing from N-02 if it exists.
3. **(2 days)** Completeness scoring per category schema + the data-quality dashboard.
4. **(3 days)** Dedupe: pgvector index, blocking keys (brand, weight, category, import-channel marker),
   candidate clusters, human confirmation UI, brand alias table.
5. **(2 days)** Write path through `SkuDraft` + `SkuAuditController` — same approval gate as N-02.
6. **(2 days)** Measurement: attribute completeness before/after, duplicate clusters resolved, and the
   downstream unblock ("category X now has enough attribute coverage to fit an elasticity").

## Risks

| Risk | Mitigation |
| --- | --- |
| **Wrong merge of two distinct SKUs** | Human confirms every merge; blocking attributes (import channel, pack size, barcode) prevent the common false merges; merges are reversible with an audit trail |
| Model invents an attribute value | Impossible to persist — enum constraint + validator. Worst case is a retry. |
| Extraction quality varies wildly by category | Measure per category; ship the categories that clear a bar and leave the rest for humans. Partial coverage honestly reported beats uniform mediocrity. |
| "Data quality" becomes an unbounded MDM project | Line: extract, normalise, dedupe-suggest, score. No golden-record engine, no survivorship rules, no data-governance workflow. |
| Nobody acts on the dashboard | Frame every finding as *"fix these 20 SKUs to unblock pricing for category X"* — a task with a payoff, not a scorecard |
| Barcode conflicts (same barcode, two SKUs) | Surface as a high-priority data incident; barcode is meant to be unique, so a conflict is a real error worth fixing |

## Demo script (2.5 minutes)

1. Data-quality dashboard: overall attribute completeness 41%; worst category named; 260 suspected
   duplicate clusters.
2. Take one raw supplier line — `"Sua Meiji so 1 800g (hop thiec) - hang cty"` — and run it:
   normalised → brand `Meiji`, stage `số 1`, net weight `800 g`, packaging `lon thiếc`,
   channel `hàng công ty`, category suggested. Confidence per field, evidence span highlighted.
3. Show a duplicate cluster of 4 SKUs → confirm the merge → and show a **near-duplicate the system refused
   to merge** because one is `xách tay` and one is `hàng công ty`. That refusal is the interesting part.
4. Approve through the existing SKU audit gate.
5. Before/after: completeness 41% → 88% for that category, and the note that
   [I01](I01-price-markdown-optimization.md) can now fit an elasticity for it.

## Effort

~14 dev-days. Do it **first** among the plans in this folder — I01, I02 and I03 all get cheaper and more
accurate on the other side of it.
