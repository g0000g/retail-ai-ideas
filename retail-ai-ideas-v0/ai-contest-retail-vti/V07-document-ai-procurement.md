# V07 — Document AI: invoice / PO / GRN 3-way match

> **VTI source:** "Accounting automation", "Finance and procurement management" + case study *"Cloud Procurement System With 6X Lower Costs"* (Japan)
> **Local model:** PaddleOCR (Apache-2.0) + VietOCR + Qwen3-VL 4B · **MiniMax:** yes, for hard/messy documents
> **New infra:** none (model sidecar + pgvector optional) · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** ⭐ clearest ROI

## Pitch

Supplier sends a PDF/photo of an invoice. The system extracts it, matches it against the purchase order and
the goods-receipt note, and either **auto-approves** (all three agree within tolerance) or routes an
exception to AP with the discrepancy named.

That is where VTI's *"6× lower procurement costs"* comes from. Procurement cost is not software licences —
it is people re-typing documents and chasing mismatches.

## Why this is the clearest money slide in the set

- The baseline is measurable today: minutes per invoice × invoices per month × loaded cost. Every finance
  team knows this number.
- The output is **verifiable by construction** — a 3-way match either reconciles or it doesn't. Unlike a
  chat answer, there is a right answer, so "hallucination" isn't the objection.
- The failure mode is safe: an unmatched invoice goes to a human, exactly as today. Worst case is no worse
  than the status quo.
- We already own all three documents' systems: `purchase-service` (PO), `stock-service` (receipt),
  `einvoice-service` + `payment-service` (invoice, payment).

## Architecture

See `diagrams/vti-07-document-ai.drawio.png`.

```
Supplier email / upload / e-invoice XML
        ▼
   MinIO (raw document, immutable)
        ▼
ai-service  /v1/ai/extract-document        (workflow-service flow — async, not a request path)
   ├─ 0. classify document type            invoice | PO confirmation | GRN | credit note | contract
   ├─ 1. e-invoice XML present?  ──yes──▶  parse structurally. NO OCR. NO model. Done.
   │                                        (Vietnamese e-invoices are XML — always prefer this path)
   ├─ 2. PDF with a text layer?  ──yes──▶  Apache Tika + layout rules
   ├─ 3. scan / photo            ──────▶  PaddleOCR detect+recognise (+ VietOCR for VN text lines)
   │                                        table structure recognition for line items
   ├─ 4. structure to schema               tier 0 qwen3.5:4b, JSON-schema-constrained output
   │                                        validator: totals must add up, tax must compute, dates sane
   ├─ 5. repair loop (max 2)               validation errors fed back verbatim
   ├─ 6. still failing?          ──────▶  escalate: Qwen3-VL 4B, then MiniMax-M2.5
   └─ 7. per-field confidence + provenance (page, bbox, source text)
        ▼
   3-way match engine  (deterministic, NOT a model)
      invoice ↔ purchase-service PO ↔ stock-service goods receipt
      tolerances: qty, unit price, total, tax, currency, dates
        ├─ all match within tolerance ──▶ auto-approve → payment-service payable
        └─ mismatch ──▶ AP exception queue, discrepancy named and quantified
        ▼
   einvoice-service · purchase-service · payment-service     (existing)
```

**The XML fast path matters more than the AI.** Vietnamese e-invoices are structured XML. Any invoice that
arrives that way should never touch OCR or a model. Doing this first cuts the volume the AI must handle,
raises overall accuracy, and is two days of work. State it in the pitch — it signals engineering judgment
rather than model enthusiasm.

## Extraction schema (Vietnamese invoice reality)

```
seller:   name, taxCode (MST), address
buyer:    name, taxCode, address
invoice:  serial (ký hiệu), number (số hóa đơn), date, currency, exchangeRate
lines[]:  description, unit (đơn vị tính), quantity, unitPrice,
          amount, vatRate (0/5/8/10/KCT), vatAmount
totals:   subtotal, vatTotal, grandTotal, amountInWords
refs:     poNumber, deliveryNote, contractNumber
```

Two rules that catch most real errors:
1. **Arithmetic is a validator, not a model output.** `sum(lines.amount) == subtotal`,
   `subtotal + vatTotal == grandTotal`, `quantity × unitPrice == amount`. If the arithmetic fails, the
   extraction is wrong — reject and retry, don't persist.
2. **Tax code (MST) is the join key** to `vendor-service`, not the supplier name. Names are typed
   inconsistently; MST is checksummed and unique.

## Where each tier is used

| Step | Tier | Why |
| --- | --- | --- |
| XML parse | none | structured already |
| Text-layer PDF | none | Tika + rules |
| OCR | tier 0, local | PaddleOCR/VietOCR on CPU. No egress — invoices contain supplier terms |
| Structure → schema | tier 0 `qwen3.5:4b` | schema-constrained, validator behind it, cheap |
| Hard scan / handwriting / rotated table | tier 0 Qwen3-VL 4B → **tier 2 MiniMax-M2.5** | genuinely needs a bigger model |
| 3-way match | none | deterministic business logic |

**Residency:** supplier pricing and terms are commercially sensitive. Per `00-model-stack.md` § 11,
escalation for these documents needs sign-off, and buyer/supplier identifiers should be tokenised before a
tier-2 call. Log every escalation with what was stripped.

## Build steps

**Phase 1 — the boring high-value path (5 days)**
1. Document intake: upload + email-drop → MinIO, immutable, hash-deduplicated.
2. **E-invoice XML parser** → schema. Ship this before any model.
3. Tika text-layer path + layout rules for the common supplier templates (2–3 suppliers cover most volume).

**Phase 2 — OCR + structuring (6 days)**
4. PaddleOCR detect/recognise + table-structure recognition in the model sidecar; VietOCR for Vietnamese
   text lines; benchmark both on ~100 real invoices and record per-field accuracy.
5. `qwen3.5:4b` schema-constrained structuring + the arithmetic validator + repair loop.
6. Escalation ladder to Qwen3-VL then MiniMax-M2.5, with the reason logged.

**Phase 3 — 3-way match (5 days)**
7. Match engine + tolerance configuration (per supplier, as data).
8. `purchase-service` / `stock-service` lookups; MST join to `vendor-service`.
9. Auto-approve path → `payment-service` payable; exception queue otherwise.

**Phase 4 — AP review UI (4 days)**
10. Side-by-side: original document page with **bounding boxes** next to extracted fields. Low-confidence
    fields highlighted amber. Click a field → the box highlights on the page. This single UI detail is what
    makes AP staff trust the system.
11. Discrepancy view: "invoice qty 120 vs GRN 118 vs PO 120 — short delivery, VND 240,000".
12. Corrections captured as labelled data for future template rules.

**Optional (3 days) — contract/policy check**
13. pgvector index over supplier contracts; flag invoices whose unit price exceeds the contracted price or
    whose payment terms differ. This is the "procurement savings" story made concrete, and it reuses the
    retrieval work from the other set's compliance idea.

## Risks

| Risk | Mitigation |
| --- | --- |
| OCR accuracy on poor scans / phone photos | XML and text-layer paths first (they need no OCR); measure per-field accuracy and publish it; amber-flag low confidence. Never auto-approve a low-confidence extraction. |
| Table structure across many supplier templates | Per-supplier template rules for the top suppliers; model fallback for the long tail. 80/20 applies hard here. |
| **Wrong auto-approval pays the wrong amount** | Tolerances tight by default; auto-approve only when all three documents agree *and* every field is high-confidence *and* the amount is under a threshold. Everything else is human-reviewed. Full audit trail with the model/prompt version. |
| Diacritics and VN number formats (`1.234.567,89`) | Explicit locale-aware parsing, unit-tested. This is a classic silent bug. |
| Supplier terms leaving the building | Residency table + tokenisation + sign-off for tier-2 escalation |
| Fraudulent / duplicate invoices | Hash dedup + MST/invoice-number uniqueness check + bank-account-change detection (a real invoice-fraud vector worth mentioning) |
| Scope creep into full AP automation | Line: extract + match + route. Payment execution, dunning and reconciliation reports are out. |

## Demo script (3.5 minutes)

1. Drop a **real Vietnamese e-invoice XML** → parsed instantly, matched to its PO and GRN, auto-approved.
   Point out: no OCR, no model, no cost. *"The best AI decision here was not to use AI."*
2. Drop a **phone photo** of a paper invoice → OCR → structured fields with bounding boxes; two amber fields.
3. This one has a short delivery: 118 received vs 120 invoiced → exception queue with the discrepancy and
   the VND impact.
4. Drop a deliberately bad scan → tier 0 fails validation twice → escalates to MiniMax-M2.5 → succeeds.
   Show the escalation log and the token cost: a fraction of a cent.
5. Optional: an invoice priced above the contracted rate → contract-check flag with the cited clause.
6. Slide: minutes-per-invoice before vs after, auto-approval rate, per-field extraction accuracy.

## Effort

~20 dev-days, +3 for the contract check. Phases 1+3 alone (10 days) already produce a working 3-way match on
XML invoices — a complete, demoable entry with almost no model risk.
