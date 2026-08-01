# Idea 04 — Ops RAG: grounded Q&A over documents *and* live business data

> **Blueprint source:** `rag` (primary), `ai-virtual-assistant` (structured/text-to-SQL retriever), `aiq` (citations, shallow/deep routing)
> **New infra:** pgvector image swap · **GPU:** none (hosted NIM) · **Effort:** M (3 weeks) · **Verdict:** high

## Pitch

Two retrievers behind one question box:

- **Unstructured** — SOPs, product manuals, promotion T&Cs, return policy, POS troubleshooting guides,
  supplier contracts. Answers cite the exact page.
- **Structured** — "how many orders were cancelled at store 12 last week and why?" → generated SQL against
  the **pgpool read standby**, never the primary.

The blueprint's own hybrid (Postgres+text-to-SQL for structured, Milvus for unstructured) is exactly this
shape. We have a better version of both halves already deployed.

## Why the structured half is safe here

`pgpool` CQRS read/write split is live on dev `:9999` and `goods-service` is already repointed (~97% of its
reads go to the standby). An analytical text-to-SQL agent is the ideal second consumer: read-only by
construction, tolerant of replica lag, and it cannot touch the primary even if the generated SQL is awful.

Guardrails on generated SQL:
- Connection is a **dedicated read-only Postgres role** on the standby. Not "we prompt it not to write" —
  the grant makes writes impossible.
- Allowlist of tables/views exposed to the model, plus a curated set of **reporting views** rather than raw
  entity tables. `OrderReportController` already implies these queries exist; lift them into views.
- `statement_timeout` + row cap. Query text always shown to the user next to the answer.

## Architecture

See `diagrams/idea-04-ops-rag.drawio.png`.

```
front-end (back-office) ──▶ back-office-bff ──▶ ai-service  /v1/ai/ask
                                                    │
                            router (intent: doc | data | both)
                            ├── doc  ─▶ embed(query) ─▶ pgvector top-k ─▶ rerank ─▶ LLM + citations
                            └── data ─▶ schema card ─▶ LLM → SQL ─▶ pgpool STANDBY (read-only role)
                                                          └─▶ result table + the SQL, shown to the user
Ingestion (one-off / on upload):
  MinIO PDFs ──▶ chunk + embed ──▶ pgvector   (job in workflow-service)
```

## Why pgvector, not Milvus or Elasticsearch

- The blueprint defaults to **Elasticsearch**, but that needs **ES 8.x** kNN. We run `elasticsearch:7.17.28`,
  and upgrading ES is a multi-service migration (`es-mappings/`, `es-client-starter`, 11 index definitions) —
  far bigger than this feature.
- Milvus means a new container (+ etcd), for a corpus of a few thousand chunks.
- pgvector = one image swap, one Flyway migration, joins against real business tables for free.

Ceiling: pgvector HNSW is comfortable to ~10⁶ vectors. Document corpus here is 10³–10⁴. Never a problem.

## Build steps

**Phase 1 — document RAG (7 days)**
1. `pgvector/pgvector:pg16`; Flyway: `ai_document`, `ai_document_chunk(embedding vector(2048))`, HNSW index.
   ⚠ Ensure `spring-boot-flyway` is on the classpath — under Spring Boot 4 the split auto-config means a
   missing module makes migrations **silently skip**.
2. PDF/DOCX ingestion — Apache Tika + a fixed-size-with-overlap chunker. Skip NeMo Retriever Extraction
   (it's a GPU NIM); Tika handles text-heavy SOPs fine. Tables in PDFs are the known weak spot — accept it.
3. `nvidia/llama-nemotron-embed-1b-v2` for embeddings, `nvidia/llama-nemotron-rerank-1b-v2` for reranking.
   Hybrid retrieval = pgvector cosine + Postgres `tsvector` BM25, then rerank. (This is the blueprint's
   "hybrid dense+sparse", done with two Postgres features instead of two services.)
4. Answer with mandatory citations `[doc, page]`. Refuse when top-k similarity is below a threshold —
   "không tìm thấy trong tài liệu" beats a confident guess.

**Phase 2 — structured retriever (6 days)**
5. Read-only role on the pgpool standby; reporting views; a schema card (table/column descriptions +
   3 example question→SQL pairs) fed to the model.
6. SQL generation with `EXPLAIN`-before-execute, row cap, timeout.
7. Render as a table + the SQL + a one-line NL summary.

**Phase 3 — routing, memory, UI (5 days)**
8. Intent router (doc / data / both / neither) — a cheap classification call, à la `aiq`'s shallow-vs-deep
   orchestration node.
9. Multi-turn memory in Redis; per-tenant document ACL enforced **before** retrieval, not after.
10. Angular panel in `front-end` with citation links opening the source page.

## Corpus candidates (all already exist as documents somewhere)

| Corpus | Owner | Value |
| --- | --- | --- |
| POS operation + troubleshooting SOP | store ops | Cuts helpdesk tickets; POS offline sync is genuinely confusing to staff |
| Return / after-sales policy | CS | `after-sales-service` decisions become explainable |
| Promotion T&Cs | marketing | Pairs with [Idea 06](06-promotion-copilot.md) |
| Product manuals | merchandising | Feeds FAQ generation in [Idea 02](02-catalog-enrichment.md) |
| Supplier/vendor contracts | purchasing | "what's our agreed lead time for vendor X?" |
| Internal API + integration docs | engineering | Honest but less impressive to judges |

## Risks

| Risk | Mitigation |
| --- | --- |
| Text-to-SQL gets a number wrong and someone believes it | Always show the SQL + row count; label the panel "draft analysis"; restrict to curated views so the joins are pre-vetted |
| Tables/charts inside PDFs extract badly with Tika | Accept for v1. Flag low-confidence extractions at ingest. GPU NeMo Retriever Extraction is the upgrade path. |
| Multi-tenant document leakage | Tenant filter in the vector query itself (`WHERE tenant_id = ?` alongside the ANN search), not a post-filter |
| Replica lag confuses "today's numbers" | Show the standby's replication lag in the answer footer |
| Embedding dimension churn | Store `model_version` on every chunk; re-embed by version, never mix |

## Demo script (3 minutes)

1. *"Quy trình xử lý đổi hàng quá 30 ngày là gì?"* → answer with cited policy page, opens the PDF at that page.
2. *"Tuần trước có bao nhiêu đơn bị huỷ ở cửa hàng 12, lý do gì?"* → generated SQL shown, table returned,
   one-line summary. Point out it ran on the **read standby**.
3. *"Chính sách này áp dụng cho đơn POS offline không?"* → both retrievers combine.
4. Ask something outside the corpus → it declines instead of inventing.

## Effort

~18 dev-days. Phase 1 alone (7 days) demos well; Phase 2 is what makes it distinct from every other RAG entry.
