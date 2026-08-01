# C05 — 商品识别: shelf & checkout recognition with PP-ShiTu

> **Reading:** 🧰 STACK (works in any market) · **Effort:** M (~3 weeks) · **GPU:** optional — PicoDet targets CPU/mobile
> **Verdict:** ⭐ the best technical fit to retail in any of the four folders

## The property that makes this the right choice

**PP-ShiTuV2 needs no model retraining when new SKUs appear.**

Recognition is done by **vector retrieval**, not classification: detect the object, embed the crop, look it
up in a gallery index. A new SKU means **adding gallery embeddings — "add and use immediately"**. PaddleClas
documents this explicitly as the reason it is deployable in supermarkets, where SKU churn is constant.

Every classification-based product recogniser dies on this exact problem. A retrain-per-SKU pipeline is a
non-starter in retail, and it is why most shelf-vision projects quietly stall after the pilot.

Sources: [PaddlePaddle/PaddleClas](https://github.com/PaddlePaddle/PaddleClas) ·
[PP-ShiTu mainbody detection docs](https://github.com/PaddlePaddle/PaddleClas/blob/release/2.6/docs/zh_CN/training/PP-ShiTu/mainbody_detection.md)

## What it delivers

| Use case | Value |
| --- | --- |
| **Shelf SKU audit** | *which* products are on the shelf, in what quantity, in which facing — planogram compliance, not just "is there a gap" |
| **Checkout assist / self-scan fallback** | camera识别 when the barcode is damaged, missing, or the item is loose — the fallback in [V01](../ai-contest-retail-vti/V01-scan-and-go.md), done properly |
| **Receiving / inventory count** | photograph a pallet or a shelf, get a count |
| **Competitor shelf survey** | photograph a competitor's shelf, get their assortment (own-store first; respect location rules) |

## How it composes with what we already planned

| Question | Answered by | Model |
| --- | --- | --- |
| *Is there a gap on this shelf?* | [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) | RT-DETRv2 + ROI occupancy (Apache-2.0 / MIT) |
| ***Which SKU is this?*** | **C05 (this)** | **PP-ShiTuV2 (Apache-2.0)** |
| *Is the planogram being followed?* | V04 ROIs + C05 identities + [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) plan | both |

The three together close a loop nothing else in the four folders closes: **the optimizer produces a
planogram → the camera reports which SKUs are actually there → deviations become tasks.**

## Architecture

See `diagrams/china-05-product-recognition.drawio.png`.

```
GALLERY BUILD  (one-off per SKU, then incremental — this is the whole trick)
  goods-service SKU images (MaterialController → MinIO)
        ▼
  PP-ShiTuV2 feature model → embedding per image
        ▼
  vector index (Faiss inside PaddleClas, or pgvector to reuse our existing store)
        ▼
  NEW SKU → embed → insert → USABLE IMMEDIATELY. No retraining.

INFERENCE  (edge box or store tablet)
  image
   ├─ 1 · mainbody detection   PicoDet / PP-YOLOE+ (PaddleDetection) — class-agnostic crops
   ├─ 2 · feature extraction   PP-ShiTuV2 → embedding per crop
   ├─ 3 · vector retrieval     top-k from the gallery + similarity threshold
   └─ 4 · decision
          high confidence          → SKU identified
          low / ambiguous          → top-3 + human confirm (staff tap, or shopper tap in self-scan)
          below floor              → "unknown item" — NEVER guess
        ▼
  results → MQTT (Mosquitto, already the store-device channel) → Kafka → platform
        ▼
  ├─ stock-service     shelf audit → count discrepancy task
  ├─ I03 planogram     compliance deviation
  └─ V01 scan & go     barcode fallback identification
```

**Barcode still wins when present.** Vision is the fallback, not the primary. A barcode is a exact key;
an embedding is a similarity. Design the decision order accordingly.

## Sample repos

| Component | Repo | Licence | Notes |
| --- | --- | --- | --- |
| **Recognition system** | [PaddlePaddle/PaddleClas](https://github.com/PaddlePaddle/PaddleClas) | **Apache-2.0** | PP-ShiTuV2: mainbody detection + feature learning + vector retrieval. Recall@1 **+~8 points** over V1. Demo apps include 商品识别 and bottled-beverage recognition. |
| **Detector** | [PaddlePaddle/PaddleDetection](https://github.com/PaddlePaddle/PaddleDetection) | Apache-2.0 | PicoDet (**CPU/mobile-targeted** — this is why the edge box works), PP-YOLOE+ |
| **End-to-end tutorial** | [ColugoMum/Goods_Recognition](https://github.com/ColugoMum/Goods_Recognition) | — | Full training + deployment walkthrough. Advises **~200 annotated images per class**, COCO conversion, and **RandomErasing augmentation when occlusion is severe** — exactly the dense-shelf condition |
| Gap detection (complementary) | RT-DETRv2 + ByteTrack | Apache-2.0 / MIT | from [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) |

**Public datasets to bootstrap:** **SKU-110K** (dense shelf detection), **RP2K** and **Products-10K**
(retrieval gallery). Use these to prove the pipeline before collecting a single in-store image.

## Build steps

1. **(2 days)** Stand up PP-ShiTuV2 + PicoDet from PaddleClas; reproduce the
   [Goods_Recognition](https://github.com/ColugoMum/Goods_Recognition) walkthrough end-to-end on public data.
2. **(3 days)** Gallery builder from `goods-service` product images in MinIO. **The image quality of the
   existing catalogue is the gating factor — measure it first.** Many catalogues have one white-background
   render per SKU and nothing else; that is a weak gallery for shelf conditions.
3. **(3 days)** Collect ~200 images/class for the demo category on a real shelf (angles, lighting,
   occlusion). Add RandomErasing per the tutorial's advice.
4. **(3 days)** Retrieval threshold tuning + the **three-way decision** (identified / confirm / unknown).
   Report **precision at the auto-accept threshold**, not just top-1 accuracy — the operating point is the
   deliverable.
5. **(3 days)** Edge deployment: PicoDet on the same box as [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md)
   (Intel N100 + OpenVINO, or the spare laptop for the demo). Measure FPS and per-image latency.
6. **(3 days)** MQTT → Kafka event with an **Apicurio-registered schema** (`mvn verify -Pschema-registry`
   gate applies, same as every other event).
7. **(2 days)** `stock-service` consumer: shelf count vs system stock → reconciliation task with a thumbnail.
8. **(2 days)** Self-scan fallback hook into [V01](../ai-contest-retail-vti/V01-scan-and-go.md): top-3 + confirm.
9. **(2 days)** "New SKU, zero retraining" demo path — add a SKU, index it, recognise it, on stage.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Catalogue images are studio renders, shelf images are not** | Measure gallery quality in step 2. Add in-store gallery images per SKU; the gallery can mix sources. This is the most likely cause of disappointing accuracy. |
| Visually near-identical variants (same product, 400g vs 800g) | Return the SPU group and let the human pick the variant — `SpuController` / `SkuGroupController` already model this. Trying to distinguish them visually is a losing battle. |
| Dense shelf occlusion | RandomErasing augmentation (the tutorial's own advice); N-of-M temporal verification from V04 |
| Lighting / angle per store | Fixed camera position, calibrated once per install — the same "leave the calibration knob" rule as V04 |
| Gallery drift as packaging changes | Re-index on packaging change; keep `gallery_version` per embedding and never mix versions |
| Over-claiming "AI checkout" | It is a **fallback and an audit tool**, not a replacement for barcodes. Say so. |
| Privacy | Product recognition only. No faces, no people. Same rules as V04. |

## Demo script (3 minutes)

1. Photograph a real shelf → detected crops → identified SKUs with confidence, and one item correctly
   returned as **"unknown"** rather than guessed.
2. Shelf count vs `stock-service` → discrepancy task raised in back-office.
3. **The moment that lands:** create a brand-new SKU, add three photos, index it, and photograph it on the
   shelf — **recognised immediately, no training run.** Time it on stage.
4. Self-scan: damaged barcode → camera fallback → top-3 → confirm → added to cart at the real price.
5. Planogram view: which facings match the [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md)
   plan and which don't.
6. Licence slide: PaddleClas Apache-2.0, PaddleDetection Apache-2.0 — no AGPL, no non-commercial weights.

## Effort

~23 dev-days. Steps 1–4 (11 days) prove the recognition; 5–9 connect it to the business.
