# W04 — Digital Product Passport readiness (ESPR)

> **Driver:** ESPR (EU) 2024/1781 — delegated acts 2026–2030 · **Effort:** M (~3 weeks) · **Verdict:** high — [I05](../ai-contest-retail-industry/I05-product-data-quality.md) with a legal deadline

## The regulation, compressed

| Item | Detail |
| --- | --- |
| **Legal basis** | ESPR **Regulation (EU) 2024/1781**, in force since **18 July 2024** |
| **Scope** | expands sustainability requirements beyond energy-related products to **nearly all physical goods on the EU market** |
| **Mechanism** | product-specific **delegated acts, 2026 → 2030** |
| **Trigger** | **market placement, not company nationality** — applies to goods manufactured outside the EU |
| **First mandatory** | **batteries, from 2027** |
| **Priority sectors** | textiles, electronics, construction products, furniture — acts being finalised, so **2026 is the preparation year** |
| Indicative | iron & steel delegated act expected 2026; textiles/apparel ~2027 |
| **EU Registry** | one source indicates operational launch **by July 2026** ⚠ verify |
| **Methodology** | JRC released **JRC145830** on **19 March 2026** — the blueprint for future delegated acts |
| **Data** | material composition · substances of concern · environmental performance · durability · end-of-life. Textiles: **fibre-level traceability and recyclability** |

→ [`00-west-regulation.md`](00-west-regulation.md) §3 for sources.

## The honest framing

**This is not an AI project. It is a product-data project with a regulatory deadline, where AI does two
specific jobs.**

Saying that plainly is better than dressing it up, because the guidance from every source is the same:
*"consolidate product data (PIM/PLM) ahead of category-specific delegated acts."* That is
[I05](../ai-contest-retail-industry/I05-product-data-quality.md), which is already the cheapest plan in six
folders — now with a date attached.

**And the bonus that makes it fundable:** *"DPP infrastructure can serve double duty for ESG reporting,
emissions tracking and circular programmes from the same data investment."* One build, four uses:
DPP compliance, CSRD reporting, [W10](W10-circularity-returns-resale.md) circularity, and
[W09](W09-agent-discovery-optimisation.md) agent answerability.

## Where AI actually earns its place — two jobs, not ten

### Job 1 · Supplier-document extraction
DPP data does not exist in our systems. It arrives as **supplier PDFs, spec sheets, test reports,
declarations of conformity and material safety data** — the exact document mess that
[V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) and
[C08](../ai-contest-retail-china/C08-e-fapiao-automation.md) already built a pipeline for.

Same order of preference, same lesson:
```
1 · structured supplier feed (if any)  → parse, no model
2 · text-layer PDF                     → Tika/RAGFlow DeepDoc + rules
3 · scan / image                       → OCR + VLM cross-check, conflicts flagged
    + arithmetic/unit validators — a composition that doesn't sum to 100% is wrong, not uncertain
```

### Job 2 · Gap detection against the delegated-act schema
Given a product group's required data points, **which SKUs are missing what, and which supplier owns it?**
Output is a **supplier chase list**, not a dashboard — the value is a ranked set of emails someone can send.

**That is the whole AI contribution.** Everything else — the identifier, the carrier, the registry
submission, the access control — is engineering.

## Architecture

```
dpp_requirement(product_group, delegated_act_ref, data_point, unit,
                mandatory, effective_from, source_ref)      ← rules as reviewable DATA,
                                                              because delegated acts arrive over 4 years
        ▼
goods-service SKU/SPU  ×  vendor-service supplier
        ▼
  SUPPLIER DOCUMENT INTAKE  (MinIO, immutable, hash-deduped)
     structured feed → text PDF → scan   (in that order, always)
     extraction → validators → confidence + provenance per data point
        ▼
  dpp_data_point(sku_id, data_point, value, unit, source_doc_ref,
                 confidence, verified_by, verified_at, valid_until)
        ▼
  GAP ENGINE
     required (by product group × effective date)  −  present
     → supplier chase list, ranked by SKUs blocked × revenue × deadline proximity
        ▼
  PASSPORT ASSEMBLY
     stable product identifier · data carrier (QR / RAIN RFID) ·
     access control by audience (consumer / repairer / recycler / authority)
        ▼
  ├─▶ EU registry submission            ⚠ verify launch and interface
  ├─▶ consumer-facing passport page     ← must meet EAA/WCAG (W02) — it is a consumer surface
  ├─▶ CSRD / ESG reporting              same data
  ├─▶ W10 circularity                   repairability, recyclability, end-of-life
  └─▶ W09 agent answerability           material, durability, certifications
```

**Two design calls:**
1. **Requirements are data, not code.** Delegated acts land over four years, per product group. A
   `dpp_requirement` table with effective dates means a new act is a data load, not a release.
2. **Provenance per data point, not per product.** A regulator asks *"where did this recycled-content
   figure come from?"* The answer must be a document reference, a confidence and a verifier — the same
   provenance pattern as [N-02](../ai-contest-retail/02-catalog-enrichment.md)'s SKU drafts.

## Build steps

1. **(2 days)** ⚠ **Scope gate:** which of our product groups are actually in a published or imminent
   delegated act? If none are near, this is a *readiness* plan and should say so. Batteries are first
   (2027); textiles/electronics/furniture are priority.
2. **(3 days)** `dpp_requirement` model + load the JRC145830-derived data points for one demo product group.
3. **(4 days)** Supplier document intake + extraction, **reusing V07/C08's pipeline unchanged** — format
   routing, validators, confidence, provenance.
4. **(3 days)** `dpp_data_point` store + the gap engine + the **supplier chase list**, ranked.
5. **(3 days)** Passport assembly: identifier, QR carrier, audience-scoped access.
6. **(2 days)** Consumer passport page in the SSR storefront — **WCAG 2.1 AA from the start**
   ([W02](W02-accessibility-remediation-copilot.md)); retrofitting accessibility onto a new page is a
   self-inflicted wound.
7. **(2 days)** Export paths: CSRD/ESG, [W10](W10-circularity-returns-resale.md),
   [W09](W09-agent-discovery-optimisation.md).
8. **(1 day)** ⚠ Registry interface investigation — **do not build against an unverified spec.**

## Risks

| Risk | Mitigation |
| --- | --- |
| **Building against unfinalised delegated acts** | Requirements as data with effective dates. Build the *machinery*, load one group's *rules*. Step 1 is the honesty gate. |
| **Suppliers don't have the data either** | This is the real blocker, and it is not solvable by us. The chase list is the deliverable; the honest metric is **supplier response rate**, not coverage. Say so. |
| Registry spec unverified | Step 8. Do not integrate against a spec found in a blog post. |
| Extraction errors in regulated data | Provenance + confidence + human verification for mandatory points. **Never auto-publish a mandatory data point** — same gate as N-02's SKU audit. |
| Scope creep into a PIM/PLM product | Line: requirements, extraction, gaps, passport assembly. We do not build master data management. |
| Consumer passport page fails EAA | Built accessible from day one (step 6) |
| Treated as pure cost | The double-duty argument: DPP + CSRD + circularity + agent answerability from one data investment. Lead with that. |

## Demo script (2.5 minutes)

1. `dpp_requirement` for one product group, with the delegated-act reference and effective date — **rules
   as reviewable data**.
2. Drop a supplier spec sheet → extracted data points with **provenance and confidence per point**; two
   flagged for human verification.
3. Gap engine: *"87 SKUs missing recycled-content; supplier X owns 61 of them"* → **chase list generated**,
   ranked by revenue × deadline.
4. Assembled passport: QR → consumer view (accessible), repairer view, recycler view — **audience-scoped
   from the same record**.
5. The double-duty slide: the same data feeding CSRD, [W10](W10-circularity-returns-resale.md) and
   [W09](W09-agent-discovery-optimisation.md).
6. Honest close: **supplier response rate is the metric that decides whether this succeeds**, and it is not
   a technical problem.

## Effort

~20 dev-days, of which ~7 are saved if [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md)'s
document pipeline and [I05](../ai-contest-retail-industry/I05-product-data-quality.md) exist. Sequence:
I05 → W04.
