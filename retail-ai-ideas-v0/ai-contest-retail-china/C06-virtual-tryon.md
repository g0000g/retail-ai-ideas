# C06 — 虚拟试穿: virtual try-on

> **Reading:** 🧰 STACK · **Effort:** S–M (~2 weeks) · **GPU:** yes, but small (<8GB VRAM) and batch
> **Verdict:** medium — good demo, real licence trap, honest scope required

## Read the licence before the paper

**The model everyone cites as the best open virtual try-on is not usable commercially.**

| Model | Licence | Verdict |
| --- | --- | --- |
| **IDM-VTON** — [yisol/IDM-VTON](https://github.com/yisol/IDM-VTON) | **CC BY-NC-SA 4.0 — NON-COMMERCIAL** | ❌ **Do not ship.** ECCV 2024, ~4.6k stars, the most-recommended model in 2026 write-ups — and unusable in a product. |
| **CatVTON** — *"Concatenation Is All You Need"*, ICLR 2025 | verify in repo | ✅ **the pick, subject to verification** |
| **OOTDiffusion** — [levihsu/OOTDiffusion](https://github.com/levihsu/OOTDiffusion) | verify | ⚠ AAAI 2025, Xiao-i Research. **Does not support lower-body garments.** Tested only on Ubuntu 22.04. Weakest in head-to-head comparisons. |
| Index of the field | [Zheng-Chong/Awesome-Try-On-Models](https://github.com/Zheng-Chong/Awesome-Try-On-Models) | tracks IMAGDressing-v1, AnyFit, MMTryon, FLDM-VTON |

This is the same shape as the InsightFace trap in
[V10](../ai-contest-retail-vti/V10-face-attendance.md) and the Ultralytics-YOLO trap in
[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md): *the default choice is the one you can't
use.* Putting that on a slide is worth more than the feature itself.

## Why CatVTON is the right engineering choice anyway

Not just licence — the architecture is better suited to a real deployment:

- **899M total parameters, only 49M trainable** — it concatenates garment and person images spatially and
  passes them through a single network, rather than the two-parallel-UNet design.
- **Runs under 8GB VRAM**, 1024×768 output, **~35s per inference** on a GPU.
- In testing it **reproduced garment details more accurately than IDM-VTON**, though IDM-VTON produced more
  detailed textures overall.

The general trade-off: parallel-UNet designs preserve garment detail better but need more memory and
runtime; single-model designs are faster and more hardware-friendly. For a batch pipeline behind a PDP,
hardware-friendly wins.

Sources: [FASHN — comparing the top 4 open-source VTON models](https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models) ·
[fashiolabs 2026 comparison](https://fashiolabs.com/blog/open-source-virtual-try-on-compared) ·
[Miragic — top 4 VITON models compared](https://miragic.ai/company/blogs/top-4-open-source-virtual-try-on-viton-models-compared)

## Honest scoping — three decisions that make this shippable

1. **Batch, not real-time.** ~35s/inference is not a request-path latency. Pre-render a grid of
   *garment × model-body-type* combinations offline; serve them as static images on the PDP. The shopper
   picks the closest body type. This is how the feature should work anyway — it's faster and cheaper than
   uploading a photo.
2. **Optional "upload your own photo"** as a second tier: queued, notify when ready, retained briefly,
   deleted after. **A shopper's body photo is sensitive personal information** — see below.
3. **Apparel only, upper body first.** OOTDiffusion can't do lower body at all; even CatVTON is weakest on
   complex drape and patterned fabric. Pick the demo garments deliberately: plain tops and jackets work,
   pleated skirts and sheer fabrics don't.

## Architecture

```
OFFLINE (batch, GPU, nightly)
  goods-service garment images (MinIO)  ×  N standard model body types
        ▼
  CatVTON  →  rendered try-on images  →  MinIO
        ▼
  ⚠ 标识办法: implicit metadata (provider code + content ID) at generation
              + explicit "AI 生成" badge composited into the image
        ▼
  PDP: body-type selector → pre-rendered image. Instant.

OPTIONAL TIER (shopper photo)
  upload → consent gate → queue → CatVTON → notify → view
        ▼
  retention: short, explicit, deleted after. Never used for training.
```

## Compliance — this touches sensitive PI

| Requirement | Consequence |
| --- | --- |
| **AI labelling (标识办法, in force 1 Sep 2025)** | Rendered try-on images are AI-generated content. Explicit badge + implicit metadata, minted at generation. [CAC](https://www.cac.gov.cn/2025-03/14/c_1743654685899683.htm) |
| **PIPL** — a body photo is sensitive personal information | Explicit separate consent, stated purpose, **short retention, no training use, domestic processing**. See [00-china-compliance.md](00-china-compliance.md) §2. |
| Certification requires demonstrable controls | Encryption at rest, gated access, deletion job that actually runs and is audited |

**If the consent and retention story isn't ready, ship only the pre-rendered tier.** It delivers most of
the value with none of the exposure.

## Build steps

1. **(1 day)** **Licence verification** on CatVTON's actual repo LICENSE, recorded in the model register.
   If it doesn't clear, this plan stops here — and that outcome is itself a reportable result.
2. **(2 days)** CatVTON deployment; measure VRAM, latency, and quality on **our own garments**, not the demo set.
3. **(2 days)** Batch pipeline: garment × body-type grid, nightly, into MinIO.
4. **(1 day)** 标识 labelling at generation + persistence in `ai_decision`.
5. **(2 days)** PDP component: body-type selector, pre-rendered images, honest "AI 生成示意图" caption.
6. **(3 days, optional)** Shopper-upload tier: consent gate, queue, notify, retention/deletion job.
7. **(2 days)** Measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   A/B on conversion **and on return rate** — the return-rate side matters more, and links to
   [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| **IDM-VTON's non-commercial licence** | Not used. CatVTON, verified. Documented in the register. |
| CatVTON's licence also fails verification | Step 1 is a gate. Fall back to a commercial API or drop the feature — do not ship an unverified weight. |
| Render quality embarrasses the brand | Curate demo garments; human QC gate before publishing any rendered image; plain upper-body first |
| **The render increases returns** (customer expected the render, got the garment) | This is the real risk, and it's measurable. A/B on return rate; if returns rise, kill it. Ties directly to I04. |
| Body-photo privacy | Pre-rendered tier by default; explicit consent + short retention + no training use for the upload tier |
| Labelling non-compliance | At generation, both label types |
| Body-image sensitivity / representation | Offer a genuine range of body types, not one idealised model. Getting this wrong is a brand problem, not a technical one. |

## Demo script (2 minutes)

1. PDP: pick a body type → try-on image appears instantly (it was pre-rendered), with the **AI 生成 badge**.
2. Show the file metadata: provider code + content ID.
3. Upload tier: consent screen → queued → result → and the deletion timer visible.
4. **The slide that matters:** the licence register — IDM-VTON excluded as non-commercial, CatVTON verified,
   with the reasoning. Same slide pattern as V04's YOLO exclusion and V10's InsightFace exclusion.
5. A/B: conversion **and return rate**, with a CI.

## Effort

~13 dev-days including the optional upload tier. The weakest-value plan in this folder — build it only if
apparel is a real category for the demo, and only after step 1 passes.
