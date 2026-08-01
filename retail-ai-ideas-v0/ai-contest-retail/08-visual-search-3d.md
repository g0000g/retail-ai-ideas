# Idea 08 — Visual search & 3D product view

> **Blueprint source:** `retail-shopping-assistant` (image search), `3d-object-generation` / TRELLIS (3D)
> **New infra:** vector store (pgvector) · **GPU:** required for the *good* version · **Effort:** M · **Verdict:** medium

## Pitch

Two features, one theme — the storefront understands pictures:

- **Visual search** — shopper photographs a product (or a competitor's shelf) → matching SKUs from our catalogue.
- **3D PDP** — generate a rotatable 3D model from existing product photos, embedded on the product page.

## Blocker to state up front

**NV-CLIP is deprecated on the NVIDIA cloud API.** The blueprint's image-search path therefore only works
with a *locally hosted* NV-CLIP NIM — which needs a GPU we don't have. Likewise TRELLIS (3D) is GPU-only.

So this idea has two honest versions:

### Version A — GPU-free, ships (recommended)
Use a **multimodal LLM as the bridge instead of a joint image-text embedder**:

```
photo ──▶ nemotron-3-nano-omni (hosted VLM)
             "describe this product: category, brand if visible, colour, size,
              packaging, key attributes"  → structured record
          ──▶ text embedding (llama-nemotron-embed-1b-v2) OR just the existing ES BM25 search
          ──▶ SKU candidates from goods-service
```

Slower and less precise than true CLIP-style retrieval, but it works today with zero GPU, and it composes
with the enrichment work in [Idea 02](02-catalog-enrichment.md) (same VLM, same structured-output plumbing).
For a catalogue with good text metadata — which ours has, ES-indexed via `es-mappings/goods_sku_v1.json` —
VLM-description → text search is surprisingly competitive.

Bonus: it explains itself. "I think this is infant formula, Meiji brand, 800g tin" is a *reviewable*
intermediate result. Pure embedding search is a black box.

### Version B — proper image embeddings, needs GPU
Local NV-CLIP (or an open CLIP/SigLIP as a substitute) → embed all catalogue images once → pgvector HNSW →
true image-to-image kNN. Better recall, real-time, but requires one GPU box. Document it as the upgrade
path; don't promise it for the contest.

## Architecture (Version A)

```
ecommerce-front-end  ──photo──▶  ecommerce-bff  ──▶ ai-service /v1/ai/visual-search
                                                      ├─▶ nemotron-3-nano-omni → structured product description
                                                      ├─▶ goods-service ES search (existing search_product tool)
                                                      └─▶ optional: embed description → pgvector over SKU text
                                                 ◀── ranked SKU candidates + "what I saw" explanation
```

Reuses the `search_product` MCP tool unchanged. The only new code is the VLM call and the ranking merge.

## 3D — scope honestly

TRELLIS needs a GPU, and 3D-from-photos quality on packaged retail goods (glossy tins, transparent bottles)
is mediocre. Options in order of preference:

1. **Skip 3D for the contest.** It adds a GPU dependency for a feature shoppers rarely use.
2. **Pre-generate 3–5 hero SKUs offline** on any GPU machine (a dev laptop with an RTX card, a one-off cloud
   GPU hour), commit the `.glb` files to MinIO, embed a `<model-viewer>` on the PDP. **The demo looks
   identical to a live pipeline** and costs a day. If 3D must be in the deck, do this.
3. Full pipeline — only if a GPU appears.

Option 2 is the right call: honest about being pre-generated, visually impressive, near-zero effort.

## Build steps

1. (3 days) `POST /v1/ai/visual-search` — image upload → VLM structured description.
2. (3 days) Rank-merge VLM-derived query terms with ES results; tune on 50 real photos.
3. (2 days) `ecommerce-front-end` camera capture + results grid + "what I saw" explanation chip.
4. (2 days, optional) pgvector text-embedding index over SKU descriptions for semantic recall on top of BM25.
5. (1 day, optional) Pre-generated `.glb` for 5 hero SKUs + `<model-viewer>` on the PDP.

## Risks

| Risk | Mitigation |
| --- | --- |
| **NV-CLIP cloud deprecation** | Version A as the default. Never build the demo on the deprecated path. |
| VLM misreads packaging / VN text on labels | Show the interpretation to the user and let them correct it — a text box pre-filled with the VLM's description. Turns a failure into a search refinement. |
| Latency (VLM + search ≈ 3–6s) | Skeleton UI + progressive results. Shoppers accept a few seconds for a photo search. |
| Poor recall on visually similar SKUs (same product, different size) | Return the SPU group and let the shopper pick the variant. `SpuController` / `SkuGroupController` already model this. |
| 3D quality on glossy/transparent packaging | Hand-pick the 5 hero SKUs. Matte boxes and toys work well; bottles don't. |

## Demo script (2 minutes)

1. Phone photo of a formula tin on a shelf → correct SKU ranked first, with "what I saw" shown.
2. Correct one wrong attribute in the interpretation box → results update.
3. Photo of a product we don't sell → honest "không tìm thấy sản phẩm tương tự" plus nearest category.
4. Open a hero SKU's PDP → rotate the 3D model.

## Effort

~10 dev-days for Version A + pre-generated 3D. Good **add-on** to [Idea 01](01-retail-copilot-mcp.md) —
weak as a standalone entry, strong as the third feature of a copilot demo.
