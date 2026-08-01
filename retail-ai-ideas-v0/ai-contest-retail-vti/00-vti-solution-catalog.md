# VTI retail catalogue — full inventory & verdict

Every item listed on <https://vti.com.vn/retail-software-solutions/> (July 2026 snapshot), mapped against
what this monorepo can actually build.

Legend — 🟢 mapped to an idea · 🟡 partially covered / needs a decision · 🔴 out of scope here

## 1 · Physical store & POS

| VTI item | We already have | Verdict |
| --- | --- | --- |
| Smart POS & In-Store Automation | `pos`, `pos-service`, `pos-offline-service`, `pos-installer`, MQTT resubscribe + offline sync live | 🟢 base exists |
| Retail POS systems | same | 🟢 exists |
| **Scan-and-go technology** | `BarcodeController` in goods-service, POS Electron app, `payment-service` | 🟢 [V01](V01-scan-and-go.md) |
| **Heatmaps and customer analytics** | nothing | 🟢 [V04](V04-edge-ai-box-store-vision.md) |
| **Remote store monitoring** | Mosquitto MQTT + OTel/LGTM already reach store devices | 🟢 [V04](V04-edge-ai-box-store-vision.md) |

## 2 · Supply chain & inventory

| VTI item | We already have | Verdict |
| --- | --- | --- |
| Inventory & Supply Chain Digitization | `stock-service`, `purchase-service`, `vendor-service` | 🟢 base exists |
| **Demand forecasting** | nothing | 🟢 [V03](V03-demand-forecast-chronos.md) — Chronos-2 |
| Real-time logistics | `DeliveryLogController`, `O2oFulfillmentController` in order-service | 🟡 tracking exists; route optimisation would be a new OR-Tools problem — out of scope for a contest |
| **Automated inventory management** (replenishment) | `purchase-service` | 🟢 [V03](V03-demand-forecast-chronos.md) PO suggestions |
| WMS-X Warehouse Management System | `stock-service` covers stock, not bin/task-level WMS | 🔴 building a WMS is not an AI contest entry |

## 3 · Customer engagement & loyalty

| VTI item | We already have | Verdict |
| --- | --- | --- |
| Custom CRM solutions | `customer-service` | 🟢 base exists |
| Loyalty program platforms | `promotion-service` (coupons, issued coupons), `tags-service` | 🟡 loyalty tiers/points are a gap; not an AI problem |
| Omnichannel engagement | `channel-service`, Shopee connector, `ecommerce-bff` | 🟢 base exists |
| **Personalization at scale** | nothing | 🟢 [V05](V05-personalization-loyalty.md) |

## 4 · Omnichannel (OMO) commerce

| VTI item | We already have | Verdict |
| --- | --- | --- |
| Ecommerce platform integration | `ecommerce-bff`, `ecommerce-front-end` (Angular SSR) | 🟢 exists |
| Mobile retail solutions | POS is Electron; no consumer mobile app | 🟡 V01 is designed to work as a PWA rather than needing a native app |
| Multi-channel order management | `order-service`, `channel-service`, order-type refactor in flight | 🟢 exists |
| **Product synchronization across channels** | Shopee connector | 🟢 [V06](V06-omnichannel-product-sync.md) |

## 5 · Retail AI solutions

| VTI item | Verdict |
| --- | --- |
| **AI-powered demand forecasting** | 🟢 [V03](V03-demand-forecast-chronos.md) |
| **IoT sensors for retail** | 🟢 [V04](V04-edge-ai-box-store-vision.md) — Mosquitto is already the store-device channel |
| AR/VR retail tools | 🔴 no headsets, no 3D catalogue, no shopper demand. WebXR try-on is a separate project. |
| **Smart retail devices** | 🟢 [V04](V04-edge-ai-box-store-vision.md) + [V09](V09-vietnamese-voice-kiosk.md) |
| **AI box technology** | 🟢 [V04](V04-edge-ai-box-store-vision.md) — this is the single most transferable idea on the page |
| **Computer Vision** | 🟢 [V04](V04-edge-ai-box-store-vision.md) |
| **Generative AI** | 🟢 [V06](V06-omnichannel-product-sync.md), [V07](V07-document-ai-procurement.md), [V08](V08-hq-branch-erp-reconciliation.md), [V09](V09-vietnamese-voice-kiosk.md), [V11](V11-analytics-copilot.md) |
| **Data analytics** | 🟢 [V11](V11-analytics-copilot.md) |

## 6 · Custom eCommerce software

| VTI item | Verdict |
| --- | --- |
| Intelligence e-commerce platforms / apps / digital commerce | 🟢 already the storefront; AI value lands via V01, V05, V06 |

## 7 · Retail ERP

| VTI item | We already have | Verdict |
| --- | --- | --- |
| Retail ERP Optimization | `odoo` in compose, `scripts/odoo-seed`, `sqlserver-nav2022` (Dynamics NAV) | 🟢 real integration targets already running |
| SAP services for retail | no SAP | 🔴 |
| **Odoo ERP consulting & implementation** | odoo container + seed data | 🟢 [V08](V08-hq-branch-erp-reconciliation.md) |
| **HQ & Branch Synchronization** | multi-tenant + channel model | 🟢 [V08](V08-hq-branch-erp-reconciliation.md) |
| **Finance and procurement management** | `purchase-service`, `payment-service` | 🟢 [V07](V07-document-ai-procurement.md) |
| **Accounting automation** | `einvoice-service` | 🟢 [V07](V07-document-ai-procurement.md) |
| **Workforce scheduling** | nothing | 🟢 [V02](V02-ai-staff-scheduling.md) |

## 8 · Proprietary VTI products

| Product | Verdict |
| --- | --- |
| **FaceX Smart Attendance** | 🟡 [V10](V10-face-attendance.md) — buildable, but licence + privacy gated. Read the analysis before committing. |
| **ParkingX Smart LPR** | 🟡 folded into [V04](V04-edge-ai-box-store-vision.md) as the curbside-pickup trigger — plate recognised → BOPIS order marked "customer arrived". Genuinely useful, small. |
| **Virtual Receptionist** | 🟢 [V09](V09-vietnamese-voice-kiosk.md) |
| MES-X Manufacturing Execution System | 🔴 we're not a factory |
| BusEye fleet management | 🔴 no fleet |
| Smart Meeting Management | 🔴 not retail |

## 9 · Enterprise services (VTI's delivery model, not products)

App development · migration · maintenance · AMS · cloud · IoT · embedded · cyber security ·
business automation · low-code (OutSystems / Power Platform / ServiceNow) · RPA · staff augmentation.

🔴 as contest ideas — these are services, not software. Two are worth noting anyway:
- **RPA / business automation** — we have `workflow-service` with 5 parity-tested flows. Every idea in this
  folder that needs orchestration uses it rather than adding an RPA tool.
- **Cyber security** — OPA + Keycloak + OpenBao are already deployed and become the authorization layer for
  AI actions (see the other set's guardrails plan).

## 10 · Case studies — the most useful part of the page

These are VTI's own published outcomes. They are the best available evidence for *which* retail AI
investments actually pay, and each maps to an idea here.

| Case study | Claim | Our idea | Why it transfers |
| --- | --- | --- | --- |
| **Scan&Go Super App for 500+ Supermarkets** (Japan) | scale | [V01](V01-scan-and-go.md) | We have barcode, POS, payment, stock. The AI part is small; the plumbing exists. |
| **Cloud Procurement System with 6× Lower Costs** (Japan) | 6× cost reduction | [V07](V07-document-ai-procurement.md) | Procurement cost collapses when document handling and 3-way match stop being manual. |
| **Digital Scheduling for 200+ Stores** (Korea) | scale | [V02](V02-ai-staff-scheduling.md) | Scheduling is a solved OR problem; the missing input is a demand forecast, which V03 provides. |
| **AI-Powered Staff Scheduling for 10,000+ Employees** (Japan) | scale | [V02](V02-ai-staff-scheduling.md) | Same. Two of five case studies being scheduling is a strong signal. |
| **AI Demand Forecasting Delivers 10% Higher Sales** (Japan) | +10% sales | [V03](V03-demand-forecast-chronos.md) | The number to quote in the pitch. Ours is cheaper to build than theirs was — Chronos-2 is zero-shot. |

## 11 · Segments served — use these to pick the demo dataset

Supermarkets & hypermarkets · convenience stores · drugstores & health retail · F&B retail · consumer goods.

Practical note: **drugstore / health retail** is the best demo segment for this platform. Infant formula and
supplements have strict Vietnamese labelling rules (good for compliance checks), high return rates (good for
risk scoring), strong Tet seasonality (good for forecasting), and expiry/shelf-life constraints (good for
replenishment). Pick one category and go deep rather than demoing a generic catalogue.

## Counts

- 🟢 mapped to one of the 12 ideas: **21 items**
- 🟡 partial / decision needed: **6**
- 🔴 out of scope: **~20** (mostly VTI's non-retail products and its services business)
