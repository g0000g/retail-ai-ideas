# R09 — 智能货柜 / unmanned retail as a channel

> **Tier A — pure software** · **Effort:** S–M (~2.5 weeks) · **Verdict:** high — small build, real new revenue surface

## The market — with a source-quality warning

| Fact | Source |
| --- | --- |
| **China holds 59.4% of the global intelligent vending market** (2025) | [RobotAnno release via natlawreview](https://natlawreview.com/press-releases/china-leading-manufacturer-robotanno-showcases-global-unmanned-retail-growth) |
| China vending retail revenue **¥42.2B (2024) → ¥51.55B (2025) → ¥73.93B (2027)** | same |
| Intelligent vending globally **$15.51B (2025) → $37.52B (2031)**, 15.86% CAGR | same |
| **Anno Robot** AI coffee kiosks in **60+ countries**, claimed 98% brew consistency, 24/7, zero staffing | [EIN Presswire](https://www.einpresswire.com/article/866232340/shenzhen-s-anno-robot-crowned-china-s-1-ai-coffee-robot-now-in-60-countries) |

⚠ **Nearly all of the above traces back to a single vendor press release syndicated across newswire
aggregators.** Treat the numbers as directional and vendor-selected. The *structural* point — unmanned
retail is a real, large channel in China — stands independently.

Labour context that is more solid: **13.3% of businesses report workforce gaps globally, rising to 25.3%
in food services**, and China's intelligent manufacturing faces a **4.5M worker shortfall against 9M
demand**. Unmanned retail in China is a labour-substitution play, not a novelty.

## The insight: a smart cabinet is a store with no staff

Everything the platform already does for a store applies — pricing, promotions, stock, orders, replenishment
— **if the cabinet is modelled as a location and a channel** rather than as a separate system.

That is the whole idea, and it is why this is Tier A and only 2.5 weeks: **almost no new logic, mostly
modelling.**

| Store concept | Cabinet equivalent |
| --- | --- |
| store (`channel-service`) | cabinet, with a GPS location and an operating window |
| SKU assortment | cabinet planogram — **20–60 facings**, so assortment choice matters far more than in a store |
| price by channel (`price-service`) | cabinet price — location-differentiated (office tower vs university) |
| promotion (`promotion-service`) | cabinet promotion, including **expiry markdown** ([I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md)) |
| stock (`stock-service`) | cabinet stock — telemetry, not a count |
| order (`order-service`) | vend transaction, `channel = VENDING` |
| replenishment (`purchase-service`) | route-based restock run |

## Where the AI actually earns its place

| Decision | Why it's hard, and which plan solves it |
| --- | --- |
| **What goes in 40 slots** | The most constrained assortment problem in retail. [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) clustering + transference, at extreme scarcity — one wrong facing is 2.5% of the machine. |
| **When to restock which cabinet** | A routing problem over telemetry, not a schedule. [I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md)'s VRP with cabinet stock as the demand signal. |
| **Price per location** | [I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md) elasticity per cabinet cluster — office towers and campuses behave differently |
| **Expiry** | Cabinets hold short-dated goods with no staff watching → [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) is *more* valuable here, not less |
| **Which cabinet earns its rent** | Site-level P&L: a poor location is the #1 failure mode in vending |
| **Cross-domain identity** | A customer who buys from a cabinet, a store and Douyin is one person → [C10](../ai-contest-retail-china/C10-cross-domain-reco-targeting.md) treats vending as another domain |

## Architecture

```
smart cabinet / AI coffee kiosk  (vendor hardware, vendor API or MQTT)
   telemetry: slot-level stock · temperature · door events · faults · vend events
        ▼
  MQTT (Mosquitto — already the store-device channel) → Kafka (Apicurio schema)
        ▼
channel-service   cabinet = location, with operating window + site metadata
price-service     cabinet price by cluster
promotion-service cabinet offers, incl. expiry markdown (I02)
stock-service     slot-level stock from telemetry
order-service     vend transaction, channel = VENDING
        ▼
  ├─ assortment per cabinet cluster        (I03, at 40-facing scarcity)
  ├─ restock route from telemetry          (I08 VRP)
  ├─ price per cluster                     (I01)
  ├─ expiry markdown                       (I02)
  ├─ cross-domain identity                 (C10 — vending is a domain)
  └─ site P&L: revenue vs rent vs restock cost per cabinet
        ▼
  fault handling → I07 proactive service (a jammed cabinet is a stockout with a customer waiting)
```

**Payment and the vend mechanism are the vendor's.** We own assortment, price, promotion, stock,
replenishment and the customer relationship — which is the same split as
[R02](R02-fleet-orchestration-openrmf.md): the hardware is theirs, the business decisions are ours.

## Build steps

1. **(3 days)** Cabinet as a location/channel in `channel-service`; site metadata (venue type, footfall
   proxy, rent); slot model in `stock-service`.
2. **(3 days)** Telemetry ingest via MQTT → Kafka with an Apicurio-registered schema; vend events →
   `order-service` with `channel = VENDING`. **Coordinate with the in-flight order-type refactor** rather
   than adding a parallel flag.
3. **(3 days)** Cabinet assortment optimiser — [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md)
   at 40-facing scarcity, with transference (a stockout in a cabinet has no substitute aisle to walk to).
4. **(3 days)** Restock routing from telemetry — [I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md)'s
   VRP, with "cabinet below threshold" as the demand.
5. **(2 days)** Cabinet cluster pricing ([I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md))
   + expiry markdown ([I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md)).
6. **(2 days)** Site P&L per cabinet; a "relocate or remove" recommendation list.
7. **(2 days)** Fault → [I07](../ai-contest-retail-industry/I07-proactive-service-orders.md) proactive
   service; measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   **revenue per cabinet-day**, stockout hours, restock cost per vend, waste.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Source quality on the market numbers** | Stated above. Quote the structural point, not the vendor's CAGR. |
| No cabinets exist in the business | Then it is a **channel plan** for a format the business could enter — and every component (I01/I02/I03/I08/C10) already exists for other reasons. Say which reading applies. |
| Vendor API variety | One adapter per vendor, same shape as an RMF fleet adapter. MQTT is the common denominator for telemetry. |
| Stockout invisible without telemetry | Telemetry is the prerequisite; a cabinet without it is a spreadsheet. Gate on it. |
| Shrink / vandalism | Out of scope for the software; note it in the site P&L as a cost line |
| Expiry in unattended machines | [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) matters more here — nobody is watching the dates |
| Scope creep into operating a vending business | Line: model the cabinet, decide assortment/price/restock, measure the site. We do not do machines, cash or maintenance. |

## Demo script (2 minutes)

1. Map of cabinets with live slot-level stock from telemetry.
2. Assortment for one cabinet cluster: 40 facings chosen from 8,000 SKUs, with the transference argument
   for two of them — *"in a cabinet, a stockout has no substitute aisle."*
3. Restock route for tomorrow built from telemetry, not from a fixed schedule — 3 vans instead of 5.
4. A cabinet with short-dated stock → [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md)
   markdown pushed to that cabinet only.
5. Site P&L: two cabinets flagged **"relocate — revenue below rent for 6 weeks"**.
6. Cross-domain: the same customer's cabinet purchases joining their store and Douyin history
   ([C10](../ai-contest-retail-china/C10-cross-domain-reco-targeting.md)).

## Effort

~18 dev-days, **zero hardware on our side**, and it reuses five existing plans rather than adding new
algorithms. The cheapest way in this folder to open a genuinely new revenue surface.
