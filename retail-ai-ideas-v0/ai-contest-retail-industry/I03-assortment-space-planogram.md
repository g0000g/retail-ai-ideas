# I03 — Assortment, store clustering & planogram intelligence

> **Sources:** Oracle (*Assortment and Space Optimization Cloud Service*, *advanced clustering*,
> *customer decision trees*, *demand transference*, *size-ratio optimization accounting for stockouts*) ·
> NetSuite (assortment planning) · Innowise (visual merchandising) — **3/8 sources**
> **Local model:** `bge-m3` + clustering (scikit-learn) + OR-Tools · `qwen3.5:4b` for explanation
> **New infra:** none · **GPU:** none · **Effort:** M–L (~4 weeks) · **Verdict:** high — the "buy" half of Oracle's plan/buy/move/sell loop

## Pitch

Three questions every category manager answers badly in a spreadsheet:

1. **Which stores behave alike?** (store clustering) — a district-1 convenience store and a suburban
   hypermarket should not carry the same assortment.
2. **Which SKUs should each cluster carry?** (assortment) — including the harder question: *if we delist
   this SKU, how much of its demand transfers to a substitute and how much is simply lost?*
3. **How much shelf space does each SKU get, and where?** (space / planogram) — space allocated to
   contribution, not to habit.

## Why it belongs in the set

- It is the **"buy" step** of the plan → buy → move → sell loop. The three folders now cover
  forecast (V03), price/sell (I01), move (I08, V03 replenishment) — assortment is the missing one.
- Oracle sells it as a standalone product line, which is the clearest signal in the eight sources that
  retailers pay for it.
- It composes with [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md): the edge box already
  needs **shelf-bay ROIs drawn per camera**. Those ROIs are a planogram. One data model serves both — the
  camera verifies compliance with the plan the optimizer produced. That closes a genuinely satisfying loop
  and neither idea needs new hardware for it.

## The three models

### 1 · Store clustering
Cluster stores on behaviour, not geography: category sales mix, basket size, daypart profile, price-tier
mix, seasonality shape, store format and area. K-means / hierarchical on standardised features, with the
cluster count chosen by silhouette *and* by whether a category manager recognises the clusters. If they
don't recognise them, the features are wrong.

Output: `store_cluster` used by assortment, by [I01](I01-price-markdown-optimization.md)'s elasticity
fitting, and by [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md)'s cold-start.

### 2 · Demand transference — the hard, valuable part
When SKU A is delisted, some of its demand moves to a substitute, some disappears. Oracle names this
explicitly. Getting it approximately right is what separates a real assortment tool from a sales ranking.

Estimation, in order of cost:
- **Attribute similarity** (brand, sub-category, pack size, price tier, flavour/variant) via `bge-m3`
  embeddings over the *cleaned* attributes from [I05](I05-product-data-quality.md) → a substitutability prior.
- **Observed substitution during stockouts** — when A was out of stock, did B's sales rise at that store?
  This is a natural experiment we already have data for, and it's the most credible signal.
- **Basket co-occurrence with a negative sign** — items rarely bought together but bought by the same
  customers over time are substitutes; items bought together are complements. Both matter.

Report transference as a **range with a confidence**, never a point estimate. The whole delisting decision
hinges on it.

### 3 · Space allocation
Given the assortment for a cluster and the fixture layout (bays, shelves, linear metres), allocate facings
to maximise contribution subject to:
- minimum facings for visibility (below it, an item effectively isn't stocked)
- **days-of-supply per facing** — a fast mover with one facing forces daily replenishment labour
- category adjacency and family blocking (customers shop by brand block)
- supplier/planogram agreements where they exist
- physical fit: pack dimensions vs shelf height and depth

OR-Tools (Apache-2.0) again; this is a knapsack-with-constraints, not an ML problem.

## Architecture

```
Monthly / seasonal (workflow-service flow)
  pgpool STANDBY
    ├─ order-service + pos-service: sales, baskets, dayparts per store
    ├─ goods-service: CLEANED attributes  ← depends on I05
    ├─ stock-service: stockout episodes (the natural experiment for transference)
    ├─ price-service: price tiers  ·  I01: elasticity by category × cluster
    ├─ channel-service: store format, area, opening hours
    └─ dim_calendar
                    ▼
  model sidecar (CPU)
    ├─ store clustering        (scikit-learn)
    ├─ substitutability matrix (bge-m3 attribute similarity + stockout-observed substitution)
    ├─ transference estimate   (range + confidence per candidate delist)
    └─ space optimizer         (OR-Tools: facings → contribution, under fixture constraints)
                    ▼
  ai_assortment_recommendation(cluster, sku, action LIST|DELIST|KEEP,
                               expected Δcontribution, transference range, confidence)
  ai_space_plan(cluster, fixture, bay, shelf, sku, facings)
                    ▼
  Category manager UI — review, adjust, approve
                    ▼
  ├─▶ goods-service / channel-service: assortment per cluster
  └─▶ planogram store  ──▶ shared with V04 edge box shelf-bay ROIs
                              camera verifies compliance with the approved plan
                    ▼
  ai-service tools: explain_delist · simulate_assortment · list_space_waste
```

## Build steps

**Phase 1 — clustering (5 days)**
1. Store feature panel on the read standby.
2. Clustering + cluster profiles in plain Vietnamese ("cửa hàng nhỏ, giỏ nhỏ, cao điểm trưa").
3. **Validation with a category manager.** If they can't name the clusters, iterate the features. This is a
   real gate, not a formality.

**Phase 2 — substitutability & transference (8 days)**
4. Attribute-similarity matrix via `bge-m3` over cleaned attributes (requires [I05](I05-product-data-quality.md)).
5. Stockout-episode extraction → observed substitution rates.
6. Transference model producing a range + confidence per candidate delist.
7. Backtest: for SKUs delisted historically, did realised category sales match the prediction?

**Phase 3 — assortment optimizer (7 days)**
8. LIST / DELIST / KEEP recommendations per cluster maximising expected contribution net of transference loss.
9. Constraints: category role (traffic driver vs margin), supplier minimums, must-stock (regulatory,
   own-brand, strategic), minimum assortment breadth per category.
10. Recommendation queue with projected Δcontribution and the transference range shown.

**Phase 4 — space (7 days)**
11. Fixture model: bays, shelves, linear metres, shelf height/depth per store format.
12. Facing allocation optimizer with days-of-supply and minimum-visibility constraints.
13. Planogram output — and **share the bay/shelf model with [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md)** so the camera's ROIs are the planogram's bays.

**Phase 5 — explanation + measurement (5 days)**
14. `explain_delist` grounded on the actual contribution, transference range and binding constraint.
15. Holdout: apply the new assortment in a subset of stores per cluster, keep the rest as control.
    Measure category contribution, not SKU sales — the whole point is that SKU sales *should* fall on a
    delisted item.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Delisting kills more demand than predicted** | Transference as a range with confidence; start with low-confidence-of-loss items (clear duplicates, tail SKUs with close substitutes); phased rollout with a holdout; reversible |
| Transference is genuinely hard to estimate | Say so. Use the stockout natural experiment as the primary evidence and report the backtest. A stated uncertainty range beats a confident wrong number. |
| **Fixture / planogram data doesn't exist** | It probably doesn't. Model one store format's fixtures by hand for the demo (an afternoon) and be explicit that a real rollout needs a fixture survey. Don't pretend it's automatic. |
| Clusters that don't match commercial intuition | Phase-1 gate with a category manager |
| Supplier agreements broken by an optimizer | Must-stock and supplier-minimum constraints as reviewable data, not as model preferences |
| Category-role blindness (delisting a traffic driver because its margin is low) | Category role is an explicit constraint; some SKUs exist to bring people in |
| Depends on I05 | Sequence it: I05 → I03. Attribute similarity over dirty attributes produces nonsense substitutes. |
| Scope creep into a full space-planning suite | Line: cluster, assort, allocate facings. No 3D shelf rendering, no store-layout design, no macro-space. |

## Demo script (3 minutes)

1. Store clusters on a map + their plain-language profiles. Category manager recognises them.
2. Assortment queue for one category × one cluster: 6 DELIST, 3 LIST, projected +4.2% category contribution.
3. Open a delist: *"92% of its demand transfers to SKU-X and SKU-Y (range 78–96%), net loss 8%, freed
   facings worth more"* — with the stockout-episode evidence shown.
4. Space plan for the cluster: facings before/after, and the item that lost a facing because its
   days-of-supply was 40.
5. **Close the loop:** the approved planogram bays become the edge box's shelf ROIs in
   [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) — the camera now reports compliance with
   the plan the optimizer produced.
6. Holdout slide: category contribution, treated clusters vs control.

## Effort

~32 dev-days, and it depends on [I05](I05-product-data-quality.md). Phases 1–3 (20 days) deliver clustering
and assortment without the space work, which is the majority of the value.
