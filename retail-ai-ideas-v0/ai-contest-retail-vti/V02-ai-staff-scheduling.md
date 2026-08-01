# V02 — AI staff scheduling & labour optimisation

> **VTI source:** case studies *"AI-Powered Staff Scheduling for 10,000+ Employees"* (Japan) and
> *"Digital Scheduling for 200+ Stores"* (Korea) + "Workforce scheduling" under Retail ERP
> **Local model:** Chronos-2 (Apache-2.0) + OR-Tools CP-SAT (Apache-2.0) + `qwen3.5:4b` · **MiniMax:** yes, for NL constraint editing
> **New infra:** none · **GPU:** none · **Effort:** M–L (~4 weeks) · **Verdict:** ⭐ **best pick in this set**

## Pitch

Three steps, each individually boring, together worth real money:

1. **Forecast** transactions / footfall per store per 30-minute slot (Chronos-2, zero-shot, with covariates).
2. **Convert to labour requirement** — cashiers, floor staff, receiving — via measured service rates.
3. **Solve the roster** with OR-Tools CP-SAT under real constraints: contracts, availability, skills,
   Vietnamese labour rules, fairness, minimum rest.

Then an LLM sits on top so the store manager can *talk* to it — "Hà xin nghỉ chủ nhật", "thêm 1 người
ca chiều thứ 7", "tại sao ca này 3 người?" — and get a re-solved, explained roster.

## Why this is the strongest idea in the set

- **Two of VTI's five published case studies are scheduling.** That is the market telling you where the
  demand is. Nobody enters a contest with rostering because it isn't glamorous — which is exactly why it wins
  with judges who have run stores.
- **It is a solved optimisation problem with an unsolved input.** CP-SAT rostering is well-trodden; the
  reason retailers still do it in Excel is that they have no reliable demand forecast at slot granularity.
  V03 gives us the forecast. This idea is the payoff.
- **Zero AI risk on the hard part.** The solver is deterministic and provably feasible-or-not. The LLM only
  translates language into constraints and explains the result — it never decides who works.
- **The savings are measurable and immediate.** Labour is typically the largest controllable store cost
  after COGS. Over/under-staffing shows up in one week of data.

## Data — mostly there, one real gap

| Input | Source | Status |
| --- | --- | --- |
| Transactions per store per slot | `order-service` + `pos-service` (timestamps exist) | ✅ needs a slot-level aggregation view |
| Basket size / items per transaction (drives handling time) | `order-service` item lines | ✅ |
| Store metadata: format, area, opening hours | `channel-service` | ✅ |
| Promotion calendar (traffic driver) | `promotion-service` | ✅ |
| Holiday / Tet / payday calendar | none | ❌ **must create `dim_calendar`** — same table V03 needs, build once |
| Receiving / delivery schedule (back-of-house labour) | `purchase-service` | ✅ |
| **Employee roster: contracts, hours, skills, availability, leave** | **nothing** | ❌ **the real gap** |
| Attendance actuals | nothing (see [V10](V10-face-attendance.md)) | ❌ optional |

**The employee data model is the honest cost of this idea.** There is no HR service in this monorepo. You
need a minimal one: `employee`, `employee_skill`, `employee_availability`, `contract_terms`, `leave_request`,
`shift`, `shift_assignment`. That is a week of unglamorous CRUD — plan for it, don't discover it.

Keep it minimal and local: this is employee PII and it **never** goes to tier 2 (see
`00-model-stack.md` § 11 — use employee IDs in any escalated prompt).

## Architecture

See `diagrams/vti-02-staff-scheduling.drawio.png`.

```
Weekly (workflow-service flow)
  pgpool STANDBY ──▶ slot-level demand panel (30-min buckets × store)
                      + promo / holiday / payday covariates
                          ▼
              Chronos-2  (model sidecar, CPU, zero-shot + covariates)
                  transactions & items per slot, with quantile bands
                          ▼
              labour model:  headcount = f(txn rate, items/txn, service rate, role)
                  use the P70 quantile, not the mean — understaffing costs more than overstaffing
                          ▼
              OR-Tools CP-SAT roster solve
                  hard: coverage, contract hours, max consecutive days, min rest,
                        skill coverage (1 keyholder per shift), approved leave
                  soft: fairness, preference match, shift stability week-to-week,
                        minimise overtime cost
                          ▼
              draft roster (status = PROPOSED)
                          ▼
       Store manager UI (front-end)  ◀──▶  ai-service scheduling agent
                  NL edit → constraint delta → re-solve → diff view
                  "why 3 people?" → grounded explanation from the solve, not invented
                          ▼
              manager approves → published roster → notifications
```

## The LLM's job — narrow on purpose

| The LLM does | The LLM never does |
| --- | --- |
| Parse "Hà xin nghỉ chủ nhật" → `{employeeId, date, type: LEAVE}` | Decide the roster |
| Parse "cần thêm 1 thu ngân ca chiều T7" → a coverage-constraint delta | Override a labour law constraint |
| Explain a solve using the actual binding constraints and forecast numbers | Re-derive numbers from prose |
| Summarise what changed between roster v1 and v2 | Approve anything |

Tier 0 (`qwen3.5:4b`) handles the structured extraction — it's a small, schema-constrained task with a
validator behind it. Escalate to **MiniMax-M2.5** when a manager's request is multi-clause or ambiguous
("đổi ca Hà với Nam nhưng đừng để Nam làm 6 ngày liền"), which is a genuine multi-step reasoning task.
**Employee names are stripped to IDs before escalation.**

If the solver returns infeasible, that is a *feature*: report which constraints conflict, in Vietnamese,
and let the manager choose what to relax. Infeasibility explained beats a silently bad roster.

## Vietnamese labour constraints to encode

Encode as data, not code, so they can be reviewed:
- normal working hours per day/week and overtime caps
- minimum rest between shifts, weekly rest day
- night-shift premium windows
- overtime pay multipliers (weekday / weekend / holiday differ)
- probationary and part-time contract variants

⚠ These come from the Labour Code and its guiding decrees; **have HR/legal confirm the current numbers**
before the demo. Getting them wrong is worse than not modelling them. Store them in a
`labour_rule` table with an effective-date range.

## Build steps

**Phase 1 — employee data model (5 days)**
1. Minimal HR tables + CRUD + Flyway migrations. ⚠ Under Spring Boot 4 the split auto-config means a missing
   `spring-boot-flyway` module makes migrations **silently skip** — check the classpath.
2. Seed with realistic anonymised data for 3–5 demo stores.

**Phase 2 — slot demand forecast (5 days)**
3. `dim_calendar` (VN holidays, lunar new year window, paydays, school terms) — shared with [V03](V03-demand-forecast-chronos.md).
4. Slot-level aggregation views on the pgpool read standby.
5. Chronos-2 in the model sidecar with covariates. Baselines first: same-slot-last-week and 4-week average.
   Nothing ships that doesn't beat them. Metric: WAPE per store per daypart.

**Phase 3 — labour model + solver (7 days)**
6. Service-rate calibration: seconds per transaction and per item, per role. Derive from POS timestamps;
   let it be a **tunable knob per store** — real stores differ and a model can't see why.
7. CP-SAT model, constraints as data, cost objective. Solve time cap (30s); warm-start from last week's roster.
8. Infeasibility diagnosis → human-readable conflict report.

**Phase 4 — manager UI + agent (7 days)**
9. Roster grid, drag-to-edit, coverage-vs-forecast overlay, cost readout.
10. NL constraint editing via `ai-service` (tier 0 extraction → validator → re-solve). Diff view between versions.
11. `explain_shift` — grounded on the solve's binding constraints and the forecast slot values.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No HR data exists** | Phase 1 owns it. This is the idea's real cost — state it up front rather than being surprised in week 3. |
| Labour-rule accuracy | Rules as reviewable data with effective dates; HR/legal sign-off before demo |
| Managers won't trust an algorithmic roster | Propose-never-publish. Manager approves. Track override rate as the trust KPI — a falling override rate is the best metric slide available. |
| Slot-level forecast is noisy for small stores | Aggregate to hourly for low-volume stores; use quantile bands and staff to P70, not the mean |
| Fairness complaints ("tôi luôn bị ca đêm") | Fairness as an explicit soft objective + a per-employee equity report. This is also a strong ethics slide. |
| Solver blows up on 10k employees | Solve **per store per week**, not globally. That is how the real problem decomposes; it stays small. |
| Employee PII leaking to tier 2 | IDs only in escalated prompts; PII scrubber + OPA deny rule from [V12](V12-local-model-gateway.md) |
| Scope creep into full HRM (payroll, contracts, performance) | Hard line: rostering only. Payroll integration is an export, not a feature. |

## Demo script (4 minutes)

1. Store manager opens next week: forecast curve per day, coverage overlay, proposed roster, weekly labour cost.
2. Point at Saturday afternoon: forecast spike (payday + promotion in `dim_calendar`), staffing rises to match.
3. Type *"Hà xin nghỉ chủ nhật"* → parsed, re-solved in seconds, diff highlighted, cost delta shown.
4. Ask *"tại sao ca chiều thứ 7 cần 3 người?"* → explanation citing the forecast slot value, the service
   rate, and the keyholder-coverage constraint. Every number traceable.
5. Type an impossible request → infeasibility report naming the conflicting constraints, in Vietnamese.
6. Slide: forecast accuracy (WAPE vs baseline) + modelled labour-cost delta vs the manual roster for the
   same week. Two numbers, both defensible.

## Effort

~24 dev-days. Shares `dim_calendar`, the standby views and the Chronos-2 sidecar with
[V03](V03-demand-forecast-chronos.md) — building both is roughly 1.4×, not 2×.
