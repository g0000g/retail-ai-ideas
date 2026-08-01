# W07 — Compliant workforce AI (V02 rebuilt for Annex III)

> **Driver:** EU AI Act high-risk employment classification · **Effort:** M (~2.5 weeks on top of V02) · **Verdict:** ⭐ nobody else will do this

## The finding

**[`V02 AI staff scheduling`](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) — ranked "best pick" in
the VTI set — is a high-risk AI system in the EU.**

The AI Act sweeps in AI used for *"worker management, task allocation, performance monitoring or decisions
affecting the terms or continuation of work relationships."* Store-associate shift scheduling and task
allocation is exactly that. So is warehouse pick-rate monitoring, and so is CV screening for seasonal
hiring.

**Timeline:** the Digital Omnibus provisionally defers Annex III employment obligations to
**2 December 2027** — *but only if formally adopted before 2 August 2026.* If not, the original timeline
applies. ⚠ **Check this first** ([W01](W01-eu-ai-act-compliance-layer.md) step 1).

**This does not kill V02.** It adds seven obligations, six of which
[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) already built for other reasons.

## The prohibition that does kill something

> **Emotion recognition is an absolute prohibition, in force since February 2025.** An employer **may not**
> use AI that infers emotions of employees or candidates — e.g. by analysing facial expressions or tone of
> voice.

So, explicitly out of scope, permanently:
- ❌ sentiment scoring on staff calls or chats
- ❌ checkout-camera analytics repurposed onto cashiers
- ❌ "engagement" or "wellbeing" inference from video or voice
- ❌ tone analysis in the [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) NL constraint editor
  applied to *how* a manager phrased a request about a person

⚠ **The trap is repurposing.** A customer-facing sentiment feature pointed at staff becomes prohibited the
moment it does. [W01](W01-eu-ai-act-compliance-layer.md) step 8 audits for exactly this.

## The seven obligations, and where each lands

| Obligation | Implementation | New? |
| --- | --- | --- |
| **1 · Notify workers** a high-risk system is in use | notification surface in the roster app + a record per worker per version | **NEW** |
| **2 · Human oversight** with real power to intervene | V02 is already **propose-never-publish** — the manager approves. Make the override *binding and logged*. | mostly done |
| **3 · Monitor for discriminatory impact** | Evidently slice metrics: hours, night/weekend share, overtime, preferred-shift grants — by protected characteristic | **NEW** |
| **4 · Retain automated logs ≥ 6 months** | `ai_decision` (I06) — extend retention for this system | extend |
| **5 · FRIA** where required | versioned document, named owner, reviewed on material change | **NEW** |
| **6 · Follow the vendor's instructions** | we are the provider *and* deployer here — so **write the instructions**, which is also §7's artefact | **NEW** |
| **7 · Technical documentation** | model register + MLflow + the solver's constraint set as data | mostly done |

## The design changes to V02 itself

Four, and each is small:

**1 · Fairness becomes a monitored outcome, not just a soft objective.**
V02 already has fairness as a soft objective in the CP-SAT model (night/weekend equity). Add the
**measurement**: per-employee equity report, sliced, tracked over time, on the I06 scorecard. An
optimisation objective you don't measure is a claim.

**2 · The override must be able to change the outcome.**
"Human oversight" is not a review screen. If a manager rejects an assignment, the solver must **re-solve
with that as a constraint**, and the change must be logged with the reason. V02's NL constraint editor
already does this — it just needs to be recognised as the compliance mechanism it is.

**3 · Explanations become an obligation, not a nicety.**
`explain_shift` grounded on the **binding constraints** and the forecast slot value is what makes oversight
meaningful. A manager cannot oversee a decision they cannot interrogate. This was already the design —
now it has a legal reason.

**4 · Employee data never leaves.**
Already true in V02 (IDs only to any escalation tier). In the EU add GDPR: lawful basis, purpose
limitation, DPIA alongside the FRIA.

## Architecture

```
V02 pipeline, unchanged:
  Chronos-2 slot forecast → labour model → OR-Tools CP-SAT roster (deterministic)
        ▼
  ⊕ COMPLIANCE WRAPPER (this plan)
     ├─ worker notification surface + record          (obligation 1)
     ├─ binding override → re-solve → logged reason   (obligation 2)
     ├─ fairness slice metrics → I06 scorecard        (obligation 3)
     ├─ ai_decision retention ≥6 months               (obligation 4)
     ├─ FRIA document, versioned, owned               (obligation 5)
     ├─ instructions-for-use, written                 (obligation 6)
     └─ technical documentation: model register +
        labour_rule + constraint set as reviewable data (obligation 7)
        ▼
  W01 ai_system row: risk_class = HIGH, annex_iii_category = employment_worker_management
      + ai_system_modification rows on every prompt/model/threshold change
```

**Note what is *not* in the wrapper: the solver.** OR-Tools CP-SAT is deterministic and its constraints are
reviewable data. **The most defensible thing about V02 under the AI Act is that the decision is made by a
constraint solver, not by a model** — the LLM only translates language into constraints and explains the
result. That is an argument worth making explicitly to a regulator, and it was a design choice made for
engineering reasons before the legal one existed.

## Build steps (on top of V02)

1. **(1 day)** ⚠ Omnibus adoption check → sets the deadline. Register the system in
   [W01](W01-eu-ai-act-compliance-layer.md)'s inventory as HIGH.
2. **(2 days)** Worker-notification surface + per-worker record, versioned with the system.
3. **(2 days)** Binding override: reject → re-solve with the rejection as a constraint → log reason and
   outcome. Unit-test that an override actually changes the published roster.
4. **(3 days)** Fairness slice metrics (Evidently) + the per-employee equity report + scorecard rows.
   ⚠ Collecting protected characteristics is itself a GDPR question — **use aggregate/voluntary data or
   proxy-free slices, and take advice.**
5. **(2 days)** FRIA: template, first assessment, owner, review trigger on material change.
6. **(2 days)** Instructions-for-use document + technical documentation pack from the model register,
   `labour_rule` table and the CP-SAT constraint set.
7. **(1 day)** Retention extension + the `ai_system_modification` hook on prompts, models and thresholds.
8. **(1 day)** Emotion-recognition audit of the workforce estate — and record that it found nothing.

## Risks

| Risk | Mitigation |
| --- | --- |
| **The Omnibus isn't adopted → Aug 2026 deadline** | Step 1. The wrapper is ~14 days; it can be delivered inside that window if needed |
| **Collecting protected characteristics for fairness monitoring is itself sensitive** | Real tension, and it is not ours to resolve alone. Options: aggregate-only, voluntary self-declaration, or proxy-free equity measures (night-shift share, weekend share, overtime distribution) that need no protected data at all. **Prefer the last.** |
| Works council / union objection | Notification, explanation and a binding override are the answer, and they are also the legal requirement. Involve them early — in several EU states this is not optional. |
| "Compliance theatre" | Every obligation here is a code artefact with a test: a notification record, a re-solve, a slice metric, a retention setting. Article 26 explicitly rejects documented intent. |
| Provider-status flip from fine-tuning | `ai_system_modification` rows + a review flag ([W01](W01-eu-ai-act-compliance-layer.md)) |
| Over-scoping to all HR | Line: **rostering and task allocation only.** No hiring, no performance review, no termination decisions — those are higher-consequence and out of scope by choice. |

## Demo script (2.5 minutes — the compliance showpiece)

1. W01 inventory: this system, **risk class HIGH, Annex III employment**, jurisdiction EU.
2. The roster app as a **worker** sees it: the notification that an AI system is used, what it does, and
   who to contact.
3. Manager rejects an assignment → **the solver re-solves** → the published roster actually changes →
   the reason is logged. *That is what "human oversight" means in code.*
4. Fairness view: night-shift and weekend distribution per employee over 12 weeks — **using no protected
   data at all**.
5. Article 26 evidence pack for this system in one screen: logs (retention shown), oversight mechanism,
   technical documentation, FRIA reference, notification records.
6. Close with the structural argument: **the roster is decided by a constraint solver whose rules are
   reviewable data. The model only translates language and explains. That is why this is defensible.**

## Effort

~14 dev-days on top of [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md), of which ~8 are new
artefacts and ~6 are extensions of I06. Build it **with** V02 in any EU deployment, not after.
