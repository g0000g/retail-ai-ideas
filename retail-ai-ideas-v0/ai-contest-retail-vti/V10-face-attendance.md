# V10 — Staff attendance & store-ops identity (FaceX equivalent)

> **VTI source:** "FaceX Smart Attendance Management" (proprietary product)
> **Local model:** see the licence analysis — this is the whole story
> **New infra:** none (or 1 edge box, shared with V04) · **GPU:** none · **Effort:** S–M · **Verdict:** ⚠ **licence and privacy gated — read before committing**

## Pitch

Staff check in and out at the store without a card or a PIN. Attendance feeds
[V02](V02-ai-staff-scheduling.md) so the roster is measured against reality: no-shows, late starts,
unrecorded overtime, and shift-swap drift all become visible.

## Read this first: two blockers, one technical, one not

### Blocker 1 — the licence, and it is a real one

**InsightFace (ArcFace) is the default open face-recognition stack, and it is not commercially usable
out of the box.** The split is:

- the **code** is MIT — no limitation for academic or commercial use
- the **training data and the models trained on that data are non-commercial research only**, and that
  covers both weights downloaded manually from the repo and the ones the Python library **auto-downloads**

So `pip install insightface` + a default `FaceAnalysis()` call is a non-commercial deployment. Commercial
licences do exist for the open model packages (`buffalo_l`, `buffalo_s`, `buffalo_m`, `antelopev2`) and for
proprietary closed models, via InsightFace's licensing contact. There is also a community position that
anything trained on InsightFace embeddings inherits the restriction — contested, but not a risk to take
casually. (Not legal advice; have counsel read the actual texts.)

**Options, in order of preference:**

| Option | Verdict |
| --- | --- |
| **A. Don't use face recognition.** QR/NFC badge + PIN, or a phone-based geofenced check-in | ✅ **Recommended for a contest.** Solves the business problem, zero licence risk, zero biometric exposure. The scheduling value in V02 comes from *attendance data*, not from *how* it was captured. |
| **B. Buy an InsightFace commercial licence** for `buffalo_l` | 🟡 Correct for production. Procurement lead time makes it wrong for a contest deadline. |
| **C. Find a permissively-licensed recogniser** and verify both weights and training data | 🟡 Possible, but every candidate needs the same two-part licence check (code *and* weights *and* data). Budget real time for this, and document the result in the model-licence register. |
| **D. Use InsightFace anyway "because it's a demo"** | ❌ No. The licence register is one of this submission's differentiators; violating it in the same deck destroys that. |

### Blocker 2 — biometric data of employees

Facial templates are biometric personal data. Under Decree 13/2023/ND-CP and Vietnam's Personal Data
Protection Law in force from 2026, this is a sensitive category with consent, purpose-limitation, retention
and impact-assessment obligations. Employees are also in an unequal bargaining position, which makes
"consent" legally weaker than it looks.

**Confirm the current obligations with legal before writing any code.** If the answer takes more than a
week, that is itself the answer for a contest timeline: build option A.

## Recommended build: option A (badge/PIN + anomaly detection)

Keep the *useful* part, drop the biometrics:

```
Staff check-in
   ├─ QR badge scan on the store tablet / POS   (or NFC)
   ├─ or phone check-in with a geofence + short-lived store QR
   ▼
attendance-service (or a module in pos-service)
   attendance_event(employeeId, storeId, type IN|OUT, ts, method, deviceId)
   ▼
   ├─▶ V02 scheduling: planned vs actual roster, coverage gaps in real time
   ├─▶ payroll export (CSV — an export, not an integration)
   └─▶ anomaly detection (rules + small model, on AGGREGATES not individuals)
         buddy-punching pattern: same device, N badges within M seconds
         impossible sequence: check-in at two stores overlapping
         chronic no-show / chronic overtime at a store level
```

Anomaly detection **at store/pattern level, not employee-scoring level.** Report "store 12 shows a
buddy-punching pattern on Saturday openings", not "employee X is suspicious". That distinction is both the
ethical position and the one that survives a works-council conversation.

**If face recognition is later licensed**, it drops in as an additional `method` value on the same
`attendance_event` — the data model doesn't change. Design for that, build option A now.

## What this unlocks in V02

This is the actual reason to build it:

| Signal | Use in scheduling |
| --- | --- |
| Actual vs planned start/end | calibrate the roster; measure real coverage rather than intended coverage |
| Actual service rate per person-hour | replaces the assumed service-rate constant in V02's labour model |
| No-show frequency by daypart | drives buffer staffing on high-risk slots |
| Unplanned overtime | a hard cost the optimiser can then minimise against real data |

V02's labour model currently uses an estimated service rate as a **tunable knob**. Attendance actuals turn
that knob into a measurement. That is a genuine accuracy improvement, and it doesn't need a face.

## Build steps (option A)

1. **(1 day)** Legal check-in on biometrics — even for option A, confirm attendance-data retention rules.
2. **(3 days)** `attendance_event` model + API; badge QR (rotating, signed) + PIN fallback; store-tablet screen.
3. **(2 days)** Geofenced phone check-in (short-lived store QR + device binding). Note: GPS is spoofable —
   the store QR is what actually binds location, the geofence is a secondary check.
4. **(2 days)** Planned-vs-actual view in the V02 manager UI; live coverage-gap indicator.
5. **(2 days)** Aggregate anomaly rules + a store-level report. No individual risk scores.
6. **(1 day)** Payroll CSV export.
7. **(1 day)** Model-licence register entry: *"face recognition deliberately not used — InsightFace
   weights are non-commercial; see V10"*. **Put this in the deck.** Declining a capability for a documented
   licence reason reads as engineering maturity, not as a gap.

## Risks

| Risk | Mitigation |
| --- | --- |
| **InsightFace non-commercial weights** | Option A avoids it entirely; register the decision |
| Biometric-data obligations | Option A avoids collecting biometrics |
| Buddy punching (the reason face recognition is attractive) | Rotating signed QR + device binding + aggregate pattern detection. Not as strong as biometrics — **say so** rather than overclaiming. |
| GPS spoofing on phone check-in | Store QR is the binding factor; geofence is secondary |
| Employee surveillance perception | Aggregate-only anomaly reporting; no individual scoring; transparent policy |
| Scope creep into HRM / payroll | Line: attendance events + planned-vs-actual + CSV export |

## Demo script (90 seconds — keep it short, it is a supporting act)

1. Staff scans a rotating badge QR on the store tablet → check-in recorded.
2. V02 manager view: planned roster vs actual, one late start highlighted, live coverage gap at 14:00.
3. Simulate buddy punching (3 badges, same device, 8 seconds) → **store-level** pattern flag, no individual
   accusation.
4. One slide: *"we did not use face recognition, and here is the licence and privacy reasoning."* This is the
   slide — it is the most defensible thing in the submission.

## Effort

~12 dev-days for option A. Face recognition adds a licence purchase and a legal review, neither of which
fits a contest timeline. **Ship option A; document why.**
