# W02 — Accessibility remediation copilot (European Accessibility Act)

> **Driver:** EAA in force 28 Jun 2025 — **legal notices issued, lawsuits filed** · **Effort:** S–M (~2 weeks) · **Verdict:** ⭐ most urgent and cheapest plan in the folder

## Why this is the most urgent item in six folders

It is the only one where **enforcement has already produced litigation**:

| Event | When |
| --- | --- |
| EAA in force across the EU | **28 June 2025** |
| **France** issues formal legal notices to major retailers | **July 2025** |
| **Sweden** launches market surveillance | **October 2025** |
| **First EAA lawsuits filed in French Commercial Court** | **November 2025** |
| **Dutch ACM** actively enforcing e-commerce requirements | ongoing |

Scope catches us: *"services provided at a distance through websites and mobile apps at a consumer's
individual request with a view to concluding a consumer contract"* — **any business selling online to EU
consumers, regardless of where the company is located**, above **10 employees and €2M**.
Standard: **EN 301 549 / WCAG 2.1 Level AA minimum**. Penalties **up to €500,000 plus daily penalties** in
some jurisdictions. Contracts concluded before 28 Jun 2025 have until **28 June 2027**.

We own `ecommerce-front-end` (Angular SSR). It is squarely in scope. **And nobody else in a retail AI
contest will be talking about accessibility.**

## The honest limit, stated first

> **Automated tools catch roughly a third of WCAG issues.**

Keyboard traps, focus order, meaningful alt text, screen-reader flow and error recovery need **manual
testing with assistive technology**. A plan claiming automated scanning equals compliance is wrong, and the
French lawsuits will not be won with a Lighthouse score.

**So this is a remediation *copilot*, not an auto-fixer.** It finds, prioritises, drafts fixes, and proves
the fix — a human still reviews and a human still tests with a screen reader.

## Architecture

```
CI pipeline (Harness, already live at :3080)
        ▼
  SCAN — three engines, because they catch different things
    axe-core (Deque, MPL-2.0)      the de-facto WCAG rule engine
    Pa11y (LGPL-3.0)               CI-friendly runner
    Lighthouse (Apache-2.0)        score + regressions alongside performance
    IBM Equal Access (Apache-2.0)  second opinion, different rule set
        ▼
  DEDUPE + MAP to WCAG 2.1 AA success criteria and EN 301 549 clauses
        ▼
  PRIORITISE — by JOURNEY, not by count
    checkout > cart > PDP > search > listing > marketing pages
    an inaccessible checkout is a blocked sale; an inaccessible footer is not
        ▼
  AI REMEDIATION DRAFT   (tier 0 local model — no customer data involved)
    input:  the violating DOM fragment + the component source + the WCAG criterion
    output: a proposed Angular template/TS patch + the rationale + the criterion cited
    VALIDATOR: patch must parse · component must still compile ·
               re-scan must clear the violation and introduce no new one
        ▼
  DEVELOPER REVIEW — always. Draft PR, never auto-merge.
        ▼
  RE-SCAN in CI → regression gate: a merged PR may not increase violations
        ▼
  ACCESSIBILITY STATEMENT — generated from the current state, versioned
    (the EAA requires one, and it must be truthful)
```

**Angular is an advantage here.** Violations cluster in **components**, not pages — fix one shared
`<app-form-field>` and hundreds of page-level violations disappear. The AI's job is to find the *component*
behind the violations, which is exactly the kind of aggregation a model is good at and a scanner is not.

## What the AI actually adds over a plain scanner

| Scanner gives | Copilot adds |
| --- | --- |
| a list of DOM violations | **the component** responsible, and the blast radius of fixing it |
| a WCAG criterion ID | a **drafted patch** in our Angular idiom, with the criterion cited |
| pass/fail | **journey-weighted priority** — checkout first |
| nothing on alt text | **draft alt text from the product image + attributes** ([I05](../ai-contest-retail-industry/I05-product-data-quality.md)'s cleaned data), for a human to approve |
| nothing on writing | plain-language rewrites of error messages, which is a WCAG requirement people forget |

**Alt text is the sleeper.** Every product image needs meaningful alternative text; a catalogue of tens of
thousands of SKUs cannot be hand-written. A VLM draft grounded on the real SKU attributes, reviewed in
bulk, is a genuine unlock — and it reuses [N-02](../ai-contest-retail/02-catalog-enrichment.md)'s pipeline
unchanged.

⚠ **But: never auto-publish alt text.** Wrong alt text is worse than none — it actively misleads a
screen-reader user. Human approval, same gate as the SKU draft/audit flow.

## Sample repos

| Tool | Licence | Role |
| --- | --- | --- |
| [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | **MPL-2.0** ⚠ file-level copyleft — read it | primary rule engine |
| [pa11y/pa11y-ci](https://github.com/pa11y/pa11y-ci) | LGPL-3.0 ⚠ | CI runner |
| [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) | Apache-2.0 ⚠ | CI score + regression |
| [IBMa/equal-access](https://github.com/IBMa/equal-access) | Apache-2.0 ⚠ | second rule set |
| Playwright | Apache-2.0 | drive the journeys being scanned — **already a skill available in this repo** |
| local LLM (Qwen3.6 / Phi) | Apache-2.0 / MIT | patch drafting; no customer data involved, so tier 0 throughout |

## Build steps

1. **(1 day)** **Baseline scan** of `ecommerce-front-end` across the six key journeys. This sizes
   everything and is worth doing even if nothing else is built.
2. **(2 days)** CI integration in Harness: axe-core + Pa11y + Lighthouse on a Playwright-driven journey
   walk; results into a violations table with WCAG/EN 301 549 mapping.
3. **(2 days)** **Component attribution** — group violations by the Angular component that produced them;
   rank by blast radius × journey weight.
4. **(3 days)** Remediation drafting: DOM fragment + component source + criterion → patch proposal;
   validator (parses, compiles, re-scan clears it, no new violations); **draft PR, never auto-merge**.
5. **(2 days)** **Alt-text generation** for the catalogue, grounded on SKU attributes, into the existing
   SKU audit approval flow. Bulk review UI.
6. **(1 day)** **Regression gate** in CI: a PR may not increase the violation count on the priority journeys.
7. **(1 day)** **Accessibility statement** generator — versioned, truthful, published, as the EAA requires.
8. **(1 day)** Manual-testing checklist for the third that automation cannot catch, with a named owner and
   a schedule. **Say out loud that this exists.**

## Risks

| Risk | Mitigation |
| --- | --- |
| **Claiming compliance from automated scans** | The one-third limit is stated in the deck, in the statement, and in the plan. Manual testing has an owner and a schedule. |
| AI patch breaks the UI | Validator: parses, compiles, re-scan clears, no new violations — plus a human review and normal CI |
| **Wrong alt text is worse than none** | Human approval via the existing SKU audit gate; never auto-publish |
| axe-core MPL-2.0 obligations | File-level copyleft. Use it as a tool in CI, don't vendor modified files into the product without reading it. Record it in the register. |
| Fixing footers while checkout stays broken | Journey weighting is built into the prioritiser, not left to judgement |
| EN 301 549 v4.1.1 / WCAG 2.2 lands mid-build | Rules are data in axe-core; a ruleset bump is a version pin, not a rewrite. ⚠ verify whether v4.1.1 has published |
| Back-office (`front-end`) is out of EAA scope | Correct — EAA covers consumer services. Do the storefront. But note that employee-facing accessibility is a separate (and decent) reason to do it anyway |

## Demo script (2.5 minutes)

1. Baseline: **N violations across the checkout journey**, mapped to WCAG 2.1 AA criteria and EN 301 549
   clauses.
2. **Component attribution**: 62% of them come from **three shared components**. Fix three files, clear
   hundreds of page-level violations.
3. Open one: the copilot's drafted Angular patch, the criterion cited, the validator's re-scan result →
   **draft PR opened**, developer reviews and merges.
4. Regression gate blocks a deliberately-broken PR in CI.
5. Bulk alt-text review: 200 SKUs drafted from real attributes, merchandiser approves in one pass.
6. Generated **accessibility statement**, and the **manual-testing checklist** — with the honest line:
   *"automation catches about a third; here is who tests the rest, and when."*

## Effort

**~13 dev-days.** Cheapest plan in this folder, aimed at the only regulation here that has already produced
lawsuits, on a frontend we already own. Step 1 alone (one day) is worth doing regardless of the contest.
