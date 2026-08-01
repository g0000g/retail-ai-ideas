# Idea 09 — Shelf & store video intelligence

> **Blueprint source:** `video-search-and-summarization` (VSS)
> **New infra:** GPU box + camera access · **GPU:** **required** · **Effort:** L · **Verdict:** low for this contest — include as a stretch/vision slide

## Pitch

Store cameras become a data source:

- **Out-of-stock / planogram gaps** — empty shelf facing detected → alert to store staff + an OOS signal to
  `stock-service` for reconciliation against system stock.
- **Queue length / wait time** — checkout congestion → staffing alert to the store manager.
- **Shrinkage / anomaly** — unusual behaviour at the shelf or POS, with **alert verification** (the VLM
  double-checks each detection) to keep false positives survivable.
- **Natural-language video search** — *"show me clips of aisle 3 between 6 and 7pm yesterday"*.

## Why it's the weakest fit — say so plainly

| Requirement | Reality here |
| --- | --- |
| GPU for VLM + CV tracking pipeline | **None available.** VSS's validated topology is 2×RTX PRO 6000. Hosted API covers the VLM Q&A, **not** the real-time detection/tracking pipeline. |
| Camera access | Store CCTV is usually a separate vendor system with no API and no network route to our infra |
| Elasticsearch backend | VSS writes metadata to ES; we run **7.17**, VSS targets a modern version |
| Privacy / legal | In-store video of customers and staff — needs real legal sign-off, not a hackathon waiver |
| Store network bandwidth | Streaming video off-site is not viable; this wants edge compute per store |

Four independent blockers, any one of which sinks a two-to-four week contest build.

## The version that *is* buildable

**Offline, on recorded clips, VLM-only, no CV pipeline:**

```
5–10 short clips (phone-recorded, own shelves, staff consent)
      │ frame sampling (ffmpeg, CPU)
      ▼
nemotron-3-nano-omni / cosmos VLM (hosted API)  →  per-frame structured verdict
      │   {shelfFullness: 0-1, gapDetected: bool, facingsVisible: n, queueLength: n}
      ▼
Postgres  →  Grafana panel (LGTM already deployed)  →  alert rule
      │
      └─▶ Kafka topic (schema-registered via Apicurio) → stock-service OOS reconciliation signal
```

This demonstrates the *business* loop — camera → OOS signal → stock reconciliation — without pretending to
have real-time CV. Frame-sampled hosted-VLM inference at, say, one frame per 30 seconds is cheap and
entirely honest.

**Cost note:** hosted VLM calls per frame add up fast. One frame / 30s / camera / 12h ≈ 1,440 calls per
camera-day. Fine for a demo, not for production — which is exactly the argument for edge GPU, and that's a
good slide.

## If it's chosen anyway — build order

1. (2 days) Record clips, get written staff consent, blur/avoid customers.
2. (3 days) ffmpeg frame sampler + hosted VLM structured-output verdicts.
3. (2 days) Postgres store + Grafana dashboard (the LGTM stack is already live, so this is a dashboard JSON).
4. (3 days) OOS event → Kafka topic → `stock-service` consumer that raises a reconciliation task.
   Register the event schema in Apicurio like every other event — the `mvn verify -Pschema-registry` gate applies.
5. (2 days) Alert verification: a second VLM pass on any positive detection, to cut false positives.
   This is VSS's actual insight and it's worth demonstrating even at small scale.
6. (2 days) NL clip search over the frame metadata (text search, not video search — be explicit about that).

## Risks

| Risk | Mitigation |
| --- | --- |
| **No GPU** | Frame-sampled hosted VLM. Accept: not real-time, not production-viable. |
| No CCTV API access | Own recorded clips. Do not promise a live camera feed you can't get. |
| Privacy / labour-relations issues | Own shelves, staff consent in writing, no customer faces, no retention. Shrinkage detection on staff is a **hard no** for a contest — drop that sub-feature entirely. |
| False positives destroy trust | Two-pass verification; report precision/recall honestly on a labelled clip set |
| Judges see through the "real-time" claim | Don't make it. Frame it as *"the business loop, proven on recorded clips; production needs edge GPU"* — that's a stronger position than an overclaim. |

## Verdict

**Do not make this the primary entry.** Use it as the closing "where this goes next" slide of an
[Idea 01](01-retail-copilot-mcp.md)/[02](02-catalog-enrichment.md) submission — one live OOS detection on a
recorded clip flowing into `stock-service` is a 45-second segment that costs ~8 days and buys a lot of
imagination. As a standalone entry it's four blockers deep.

## Effort

~14 dev-days for the honest offline version. Full VSS: not achievable without hardware procurement.
