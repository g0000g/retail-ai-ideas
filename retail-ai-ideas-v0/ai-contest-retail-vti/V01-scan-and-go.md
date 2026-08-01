# V01 — Scan & Go self-checkout

> **VTI source:** "Scan-and-go technology" + case study *"Scan&Go Super App for 500+ Supermarkets"* (Japan)
> **Local model:** RT-DETRv2 (Apache-2.0) + Qwen3-VL 4B · **MiniMax:** not needed
> **New infra:** none · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** ⭐ flagship, mostly plumbing we own

## Pitch

Shopper walks the aisle, scans with their own phone, pays in the app, shows an exit QR. No queue.

The AI is deliberately small and load-bearing in exactly two places:

1. **Barcode fallback** — damaged/missing/curved barcode, or loose produce with no barcode at all →
   camera frame → product recognition → SKU candidates → shopper confirms.
2. **Basket plausibility** — cheap, non-accusatory checks that make self-scan commercially safe
   (scan-avoidance, quantity mismatch, banana-trick style substitution).

## Why this platform is unusually ready

| Need | Already exists |
| --- | --- |
| Barcode → SKU | `goods-service` `BarcodeController` |
| Price for channel | `price-service` |
| Promotions on a live basket | `promotion-service` `PromotionCheckoutController` |
| Stock check | `stock-service` |
| Cart / draft order | `pos-mcp` draft-order tools, `pos-service` |
| Payment | `payment-service` |
| Order + receipt + e-invoice | `order-service`, `einvoice-service` |
| Offline tolerance | `pos-offline-service`, MQTT sync, IndexedDB conventions in the POS app |
| Store/channel model | `channel-service` |

Roughly 80% of a Scan&Go app is this list. The contest-visible part is the ~20% on top.

## Architecture

```
Shopper phone (PWA — camera + IndexedDB, no app store)
   │  barcode decoded on-device (BarcodeDetector API / ZXing)
   │  unknown item → single frame upload
   ▼
ecommerce-bff  /v1/scan/*
   ├─ resolve SKU        → goods-service BarcodeController
   ├─ price + promos     → price-service, promotion-service
   ├─ cart               → Redis session, TTL
   ├─ image fallback     → ai-service /v1/ai/recognize-product
   │                          RT-DETRv2 crop → Qwen3-VL 4B describe → bge-m3 match vs SKU text
   │                          → top-3 candidates, shopper picks
   ├─ basket risk        → rules + a small model (see below)
   └─ checkout           → payment-service → order-service (orderType = SCAN_GO)
   ▼
Exit QR  →  staff device / gate scans it  →  order verified, audit trail
```

**On-device first.** Barcode decoding happens in the browser (`BarcodeDetector` where available, ZXing
fallback). Only the *unrecognised* items cost a server round trip. That keeps the cost near zero and the
experience fast on a store's bad wifi.

## The product-recognition fallback, honestly scoped

Loose-produce recognition ("is this a mango or a papaya, and how many?") is a real, hard CV problem.
Do **not** promise general open-set recognition. Scope it:

- **Closed set of ~30–60 loose items** per store (produce, bakery, bulk). Fine-tune/prompt against *that*
  list, not the full catalogue.
- Return **top-3 with confidence**, shopper confirms. A confirmation tap is not a UX failure; it is how
  every real scale-based produce UI already works.
- Weight, where a scale exists, is a stronger signal than vision. Use both.
- Everything else falls back to a searchable list.

Pipeline: RT-DETRv2 crops the item → Qwen3-VL 4B returns a structured guess
(`{category, colour, shape, countEstimate}`) → embed with bge-m3 → match against the loose-item list.
Runs on CPU in the model sidecar, batched; 2–5s is acceptable for an item that had no barcode.

## Basket plausibility — design it to be non-accusatory

This is what makes self-scan viable, and it is also where teams get it ethically wrong.

| Signal | Source | Cost |
| --- | --- | --- |
| Scan duration vs item count (impossibly fast basket) | session events | free |
| High-value item scanned as low-value (barcode swap) | price delta vs typical category price | free |
| Quantity typed >> quantity typical for that SKU | order history stats | free |
| Exit-gate item count vs scanned count (if a gate camera exists) | [V04](V04-edge-ai-box-store-vision.md) | edge box |
| Repeat-offender pattern across sessions | aggregate, not per-basket | free |

**Rules:** the score triggers a *random-feeling* audit prompt ("cảm ơn bạn, mời kiểm tra ngẫu nhiên 3 món"),
never an accusation, never an automatic block. Rate-limit audits per shopper so honest customers aren't
punished. Log the score with its factors so a dispute can be reviewed. This is advisory scoring — the same
posture as the return-abuse plan in the other set.

## Build steps

**Phase 1 — the walking skeleton (7 days)**
1. PWA scan screen: camera, on-device barcode, item list, running total. Storefront Angular SSR conventions apply; IndexedDB pattern already exists in the POS app.
2. `ecommerce-bff` `/v1/scan/*`: resolve barcode → SKU + price + promo, cart in Redis.
3. Checkout → `payment-service` → order with `orderType = SCAN_GO`. **Coordinate with the in-flight
   order-type/status refactor** rather than adding a parallel flag.

**Phase 2 — exit control + receipts (4 days)**
4. Exit QR (signed, short-TTL) + a staff verification screen. Audit record per exit.
5. E-invoice via `einvoice-service`; receipt in the PWA.

**Phase 3 — recognition fallback (5 days)**
6. Curate the loose-item list per demo store.
7. `ai-service` `/v1/ai/recognize-product`; RT-DETRv2 + Qwen3-VL in the model sidecar; bge-m3 match.
8. Confirmation UI with top-3 and a search fallback.

**Phase 4 — basket risk + offline (5 days)**
9. Rule-based risk score + random-audit trigger + audit-rate limiter.
10. Offline behaviour: scanning works with no network, cart syncs on reconnect. **Payment must not be
    offline-capable** — that is where fraud lives. Reuse the existing offline-sync patterns; do not invent
    a second mechanism.

## Risks

| Risk | Mitigation |
| --- | --- |
| Shrinkage — the reason retailers hesitate | Advisory risk score + random audits + exit QR + optional gate camera. Be explicit that self-scan trades a shrinkage delta for labour cost; quote the audit rate you'd run. |
| Loose-produce recognition disappoints | Closed 30–60 item set, top-3 + confirm, weight as a second signal, searchable fallback. Never claim open-set. |
| Store wifi | On-device decode, offline cart, sync on reconnect |
| Payment offline | Explicitly unsupported. Cart offline, payment online. |
| iOS PWA camera limitations | Test early on real iOS Safari; ZXing fallback where `BarcodeDetector` is missing |
| Privacy of a gate camera | Signage, no face recognition in this idea, count-only metadata. See [V04](V04-edge-ai-box-store-vision.md). |

## Demo script (3.5 minutes)

1. Scan three barcoded items on a phone → live total with the real promotion engine applying an offer.
2. Scan a deliberately damaged barcode → image fallback → top-3 → confirm.
3. Pick up loose produce with no barcode → recognised, quantity confirmed.
4. Checkout → exit QR → staff device verifies → cut to back-office: the order is there, `SCAN_GO` channel,
   stock decremented, e-invoice queued. **Real data, not a mock.**
5. Replay a suspicious basket → random-audit prompt appears, with the factors visible in the audit log.
6. Turn wifi off mid-shop → keep scanning → turn it on → cart syncs.

## Effort

~21 dev-days. Phase 1+2 (11 days) already demos end-to-end; phases 3–4 are what make it an *AI* entry.
