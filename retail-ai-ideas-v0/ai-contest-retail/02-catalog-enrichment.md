# Idea 02 — AI Catalog Enrichment (image → complete SKU)

> **Blueprint source:** `Retail-Catalog-Enrichment`
> **New infra:** none (MinIO exists) · **GPU:** none for the parts we keep · **Effort:** M (3 weeks) · **Verdict:** ⭐ best pick

## Pitch

A merchandiser uploads a product photo. The system returns a **ready-to-approve SKU draft**: Vietnamese +
English title, marketing description, extracted attributes mapped to the real category attribute schema,
a category suggestion, generated FAQs, and a compliance flag — landing directly in the SKU draft + audit
flow that `goods-service` already has.

This is the highest-ROI retail AI use case that exists, and it is boring in the best way: catalogue work is
the #1 manual cost in every retail operation, and the output is reviewable, so a wrong guess costs nothing.

## Why it fits this system unusually well

`goods-service` already models the exact shape the blueprint outputs:

| Blueprint output | Existing home |
| --- | --- |
| Title, description | `SkuDraftController`, `SpuController` |
| Structured attributes | `SkuAttributeValueDraftController`, `SpuAttributeValueController`, `CategoryAttributeController` |
| Category assignment | `CategoryController`, `CategoryDraftController` |
| Human approval gate | `SkuAuditController`, `SkuAuditSettingController` |
| Images | `MaterialController` + MinIO |
| Multilingual | needs one new column/table (see below) |

**The draft + audit workflow is the safety net.** Nothing AI-generated goes live without a human clicking
approve — which is also the answer to every "but hallucination?" question from judges.

## Pipeline (trimmed from 9 blueprint steps to 6)

See `diagrams/idea-02-catalog-enrichment.drawio.png`.

| # | Blueprint step | Keep? | How here |
| --- | --- | --- | --- |
| 1 | Image analysis (VLM) | ✅ | `nvidia/nemotron-3-nano-omni` hosted, image from MinIO presigned URL |
| 2 | Smart prompt planning (LLM) | ✅ | Merged into step 1's structured-output call — one call, not two |
| 3 | Multilingual copy (10 locales) | ✅ **scoped to VI + EN** | Structured output, both languages in one response |
| 4 | Cultural image variations (FLUX) | ❌ **dropped** | FLUX Kontext Dev is **non-commercial licence** + needs GPU. Not worth it. |
| 5 | Image quality assessment (VLM) | ✅ cheap | Same VLM call returns a `imageQualityScore` + reject reasons (blurry, watermark, wrong aspect) |
| 6 | 3D asset (TRELLIS) | ❌ **deferred** | GPU-locked → [Idea 08](08-visual-search-3d.md) stretch |
| 7 | FAQ generation | ✅ | LLM, optionally grounded on an uploaded product manual PDF |
| 8 | Compliance check (RAG over policy PDFs) | ✅ **this is the sleeper feature** | See below |
| 9 | ACP/UCP schema export | ✅ free | Feeds [Idea 03](03-agentic-commerce-acp-ucp.md) |

### The compliance check is the differentiator

Vietnamese retail has real, enforceable labelling rules — infant formula, cosmetics, food supplements,
medical devices, toys. Ingest the regulation PDFs + internal merchandising policy once, then every
generated SKU description is checked against them with citations, and flagged before it reaches the
storefront. Judges from a retail background will recognise this instantly as the thing that actually
blocks catalogue launches.

Implementation: `nvidia/llama-nemotron-embed-1b-v2` embeddings → pgvector → retrieve top-k policy clauses →
LLM verdict `{compliant, warnings[], citations[]}` stored on the draft.

## Architecture

```
Merchandiser (front-end)
   │ upload image(s) [+ optional manual PDF]
   ▼
goods-service  MaterialController ──▶ MinIO
   │ POST /v1/ai/enrich-sku  {materialId, categoryHint}
   ▼
ai-service  EnrichmentOrchestrator (Spring AI, structured output → Java record)
   ├─▶ VLM  nemotron-3-nano-omni      (describe + attributes + quality)
   ├─▶ LLM  nemotron-3-nano-30b       (VI/EN copy, FAQ)
   ├─▶ embed llama-nemotron-embed-1b  ─▶ pgvector policy index ─▶ compliance verdict
   └─▶ maps attributes onto CategoryAttribute schema fetched from goods-service
   │
   ▼ SkuDraft + SkuAttributeValueDraft + audit task
goods-service ──▶ SkuAuditController (human approve) ──▶ live SKU
                              │
                              └─▶ outbox → Kafka → ES reindex (existing CDC path)
```

Long-running (VLM + image work is 5–20s per SKU, and bulk import is the real use case) → run it as a
**`workflow-service` flow**, not a synchronous HTTP call. Bulk mode: point it at a folder in MinIO,
get N drafts. `GoodsSyncLogController` already exists for progress/audit trails of bulk operations.

## Build steps

**Phase 1 — single-SKU enrichment (7 days)**
1. `ai-service`: `spring-ai-starter-model-openai`, multimodal `ChatClient` call with the MinIO image URL.
2. Structured output into a Java record — Spring AI 2.0 maps JSON-schema-constrained responses to records; no prompt-parsing.
3. Fetch the target category's attribute definitions from `goods-service` and inject them into the prompt so the model fills *our* schema, not a generic one. **This is what makes it usable rather than a toy.**
4. `POST /v1/ai/enrich-sku` → returns the draft payload.

**Phase 2 — write into the draft/audit flow (4 days)**
5. `goods-service`: new endpoint creating `SkuDraft` + `SkuAttributeValueDraft` from the enrichment result, with `source=AI` and the model/prompt version recorded for auditability.
6. Confidence per field; low-confidence fields highlighted in the audit UI instead of silently accepted.

**Phase 3 — compliance RAG (5 days)**
7. Swap `postgres:16-alpine` → `pgvector/pgvector:pg16`; Flyway migration for `ai_policy_chunk(embedding vector(2048), ...)`. **Remember the SB4 Flyway autoconfig gap — the service needs `spring-boot-flyway` on the classpath or migrations silently skip.**
8. Policy PDF ingestion job (chunk + embed). One-off admin endpoint is enough; no pipeline needed.
9. Compliance verdict + citations persisted on the draft.

**Phase 4 — bulk + UI (5 days)**
10. `workflow-service` flow for folder-level bulk enrichment, progress via `GoodsSyncLogController`.
11. Angular: upload → side-by-side "AI suggested / human edited" diff view in the audit screen.

## Models

| Role | Model | Hosted? |
| --- | --- | --- |
| Image understanding + attributes + quality | `nvidia/nemotron-3-nano-omni` | ✅ |
| Copy + FAQ | `nvidia/nemotron-3-nano-30b-a3b` | ✅ |
| Compliance embeddings | `nvidia/llama-nemotron-embed-1b-v2` | ✅ |
| Image variations (dropped) | FLUX Kontext Dev | ❌ non-commercial + GPU |
| 3D (deferred) | TRELLIS | ❌ GPU |

## Risks

| Risk | Mitigation |
| --- | --- |
| Attribute mapping accuracy on deep VN categories | Constrain to the fetched enum values per attribute; never free-text an attribute that has a value list. Measure per-category accuracy on 100 real SKUs. |
| Multilingual copy quality (VI) | Human audit gate is mandatory anyway. Track edit-distance between AI draft and approved version as the KPI — it's also a great metric slide. |
| Postgres image swap touches shared infra | `pgvector/pgvector:pg16` is a superset of the official image; the extension is opt-in per database. Coordinate — `scripts/` is local-only and not the deploy path for config. |
| Cost per SKU | ~1 VLM + 2 LLM calls ≈ cents. At 10k SKUs it's still trivial versus a merchandiser's time. Cache by image hash. |
| Policy PDFs don't exist yet in digital form | Start with internal merchandising guidelines (they exist) and 2–3 public regulations. Ten pages is enough for a convincing demo. |

## Demo script (4 minutes)

1. Drop a raw supplier photo of an infant-formula tin. 15 seconds later: VI+EN title, description,
   attributes filled against the real category schema, category suggested, 5 FAQs.
2. Show the compliance panel: **"⚠ missing mandatory age-range statement — Circular X, clause 4.2"** with
   the cited paragraph.
3. Merchandiser edits one field, clicks approve → SKU goes live → refresh the storefront, it's there.
   (The Kafka outbox → ES reindex path is existing infra, so this genuinely works.)
4. Bulk mode: 50 images → 50 drafts, progress bar, one reviewer.
5. Metric slide: minutes-per-SKU before vs after, plus AI-draft→approved edit distance.

## Effort

~21 dev-days. Phase 1+2 alone (11 days) is already a demoable entry.
