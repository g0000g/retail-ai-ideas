# C08 — 数电票 / 全电发票 automation

> **Reading:** 🇨🇳 SELL-IN · **Effort:** M (~3 weeks) · **GPU:** none · **Verdict:** ⭐ clearest ROI in this folder

## The best engineering decision in this plan is not to use AI

**全电发票 / 数电票 are OFD/XML-native, not scans.** They arrive as structured files.

> Parse the OFD/XML structured data directly, and reserve PaddleOCR + LLM for image fallbacks.

This is the same insight as the XML fast path in
[V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) — and in China it covers a *larger* share of
volume, because the tax authority is actively moving issuers onto fully digital invoicing. The **乐企**
platform is the direct enterprise↔tax-bureau channel enabling real-time issuance, validation and tracking,
and is the only sanctioned API route for large issuers.

**Order of preference, strictly:**

```
1 · 乐企 / structured e-fapiao channel   →  no parsing at all
2 · OFD / XML file                       →  structural parse. NO OCR. NO MODEL. NO COST.
3 · PDF with a text layer                →  text extraction + layout rules
4 · scan / photo                         →  PaddleOCR (+ LLM cross-check)  ← last resort
```

Report the volume split across those four paths. *"87% of our invoices never touch a model"* is a stronger
engineering slide than any accuracy number.

## Verification (查验) — do not invent a path

None of the open-source OCR projects do official verification. That requires:

- **[国家税务总局全国增值税发票查验平台](https://inv-veri.chinatax.gov.cn/)** — the official 查验 route
- or a **licensed 服务商 API**
- **乐企** for large issuers

The open-source repos only extract the fields you feed *into* verification: 发票号码, 开票日期, 金额, 校验码.
Design the pipeline as **extract → verify via the official channel → match**, never **extract → trust**.

## The design to copy

**[stone16/Invoice-Manager](https://github.com/stone16/Invoice-Manager)** uses **OCR + LLM dual-source
verification**: both run **in parallel**, cross-check each field, and **conflicts are auto-flagged**.
PaddleOCR with prompts tuned for 增值税发票; supports Qwen / DeepSeek / GLM among others; Docker Compose,
self-hosted; and **works OCR-only with no LLM configured**.

That last property is the important one — the LLM is an *optional cross-checker*, not a dependency. It is
the right posture for a financial document.

## Architecture

```
INTAKE
  乐企 channel · supplier email · upload · 抖店/platform settlement docs
        ▼
  MinIO — raw file, immutable, hash-deduplicated
        ▼
ROUTE BY FORMAT
  ├─ OFD / XML   → structural parse                          (no model)
  ├─ text PDF    → text extraction + per-supplier templates   (no model)
  └─ scan/photo  → PaddleOCR  ∥  Qwen3.6 vision cross-check → conflicts flagged
        ▼
VALIDATE — arithmetic, not a model output
  数量 × 单价 = 金额  ·  Σ 明细 = 金额合计  ·  金额 + 税额 = 价税合计
  税率 ∈ {0, 1%, 3%, 6%, 9%, 13%, 免税}   ·  校验码 format
  fail → repair loop (max 2) → escalate → park as needs-human. NEVER persist a failed extraction.
        ▼
VERIFY — official channel only
  查验平台 / 服务商 API / 乐企  →  真伪 + 状态 (正常 / 作废 / 红冲)
        ▼
MATCH — deterministic 3-way, the same engine as V07
  发票 ↔ purchase-service PO ↔ stock-service 入库单
  join on 纳税人识别号 (统一社会信用代码), never on supplier name
  tolerances as per-supplier data
        ▼
  all match + high confidence + under threshold → auto-approve → payment-service 应付
  mismatch → AP exception queue with the discrepancy named and quantified in ¥
```

**Reuse the match engine.** [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) already
specifies it for Vietnamese invoices. Same engine, different document adapters. Build once.

## China-specific fields and traps

```
销售方: 名称 · 纳税人识别号(统一社会信用代码) · 地址电话 · 开户行及账号
购买方: 同上
发票:   发票号码 · 开票日期 · 数电票号码(20位) · 校验码
明细[]: 货物或应税劳务名称 · 规格型号 · 单位 · 数量 · 单价 · 金额 · 税率 · 税额
合计:   金额合计 · 税额合计 · 价税合计(大写/小写)
状态:   正常 / 作废 / 红冲   ← must be re-checked, not captured once
```

| Trap | Handling |
| --- | --- |
| **红冲 (credit note) after the fact** | An invoice verified as 正常 today can be 红冲 tomorrow. **Re-verify before payment**, not only at intake. |
| **纳税人识别号 is the join key** | Names are typed inconsistently; 统一社会信用代码 is unique and checksummed. Same rule as MST in V07. |
| 数电票号码 is 20 digits, different from legacy 发票号码 | Separate field, separate validation |
| 大写金额 (Chinese numerals) vs 小写 | Cross-validate the two; a mismatch is a strong fraud/error signal |
| Multiple tax rates in one invoice | Per-line 税率, never a single invoice-level rate |
| Bank-account change on a supplier | Classic invoice-fraud vector — flag any change vs `vendor-service` |

## Sample repos

| Repo | What to take |
| --- | --- |
| **[stone16/Invoice-Manager](https://github.com/stone16/Invoice-Manager)** | **The OCR ∥ LLM dual-verification design.** PaddleOCR + Qwen/DeepSeek/GLM, Docker Compose, works without an LLM |
| [guanshuicheng/invoice](https://github.com/guanshuicheng/invoice) | 增值税发票 OCR as a Flask microservice; fields 发票代码/号码/开票日期/校验码/金额 |
| [zhangandin/ocr_invoice](https://github.com/zhangandin/ocr_invoice) | Verification-oriented — only the 4 fields 查验 needs. Ships 7 trained models. ⚠ old stack (TF 1.8) |
| [inmine2/InvoiceOCRer](https://github.com/inmine2/InvoiceOCRer) | PaddleOCR + PyQt5 + fitz → Excel |
| [sanluan/einvoice](https://github.com/sanluan/einvoice) | 电子普票 + 电子专票 |
| [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Apache-2.0 — detection, recognition, **table structure** |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0 — DeepDoc for the messy-PDF minority |

## Build steps

1. **(3 days)** Intake + MinIO + hash dedup. **OFD/XML structural parser first** — before any model work.
   Measure the format split immediately; it sizes everything else.
2. **(2 days)** Text-PDF path with per-supplier templates for the top suppliers (80/20 applies hard).
3. **(4 days)** Scan path: PaddleOCR ∥ Qwen3.6 cross-check per the Invoice-Manager design; conflicts flagged.
4. **(2 days)** Arithmetic validator + repair loop. Locale traps: 大写/小写, per-line 税率.
5. **(3 days)** Verification integration (查验平台 / 服务商 / 乐企) + **re-verify before payment** for 红冲.
6. **(4 days)** 3-way match — reuse V07's engine; join on 统一社会信用代码; per-supplier tolerances;
   auto-approve gate (all-match **and** high-confidence **and** under an amount threshold).
7. **(3 days)** AP review UI: original page with **bounding boxes** beside extracted fields, click a field
   to highlight its box, amber for low confidence. This single detail is what makes AP staff trust it.
8. **(2 days)** Fraud checks: duplicate hash, 号码 uniqueness, supplier bank-account change.
9. **(2 days)** Measurement: minutes/invoice, auto-approval rate, per-field accuracy **by path**, and the
   format split. Holdout per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Building OCR for documents that are already structured** | Format routing first; report the split; OCR is the last path, not the first |
| **红冲 after verification** | Re-verify immediately before payment, not only at intake |
| Wrong auto-approval pays the wrong amount | Tight tolerances; auto-approve only on all-match + high confidence + under threshold; full audit with model/prompt version |
| Verification API access / quota | Licensed 服务商 or 乐企 — an onboarding task with lead time, not a coding task. Start it early. |
| OCR quality on phone photos | Structured paths cover most volume; amber-flag low confidence; never auto-approve a low-confidence extraction |
| Supplier terms are commercially sensitive | Domestic inference only; tokenise identifiers if any external model is ever used |
| Scope creep into full AP automation | Line: extract → verify → match → route. No payment execution, no dunning, no GL posting. |

## Demo script (3 minutes)

1. Drop an **OFD 数电票** → parsed structurally in milliseconds, matched to its PO and 入库单,
   auto-approved. *"No OCR. No model. No cost."*
2. Drop a **phone photo** of a paper invoice → PaddleOCR ∥ Qwen3.6 → fields with bounding boxes,
   one conflict auto-flagged where the two sources disagreed.
3. Verification against the official platform → 正常. Then show an invoice that came back **红冲** and was
   blocked before payment.
4. A short-delivery mismatch: 发票 120 vs 入库 118 → exception queue with the ¥ impact.
5. Slide: **format split** (how much never touched a model), minutes/invoice before vs after,
   auto-approval rate.

## Effort

~25 dev-days, of which ~6 are saved if [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md)'s
match engine already exists. Steps 1 + 6 alone (7 days) produce a working 3-way match on structured
invoices — a complete entry with almost no model risk.
