# Idea 03 — Agentic Commerce: our storefront as an ACP/UCP merchant

> **Blueprint source:** `Retail-Agentic-Commerce`
> **New infra:** none · **GPU:** none (public NVIDIA endpoints are the blueprint default) · **Effort:** M (3 weeks) · **Verdict:** ⭐ most novel

## Pitch

Make the platform **sellable to AI agents, not just to humans.** An external agent (ChatGPT/Claude with
MCP, or another company's procurement bot) discovers our merchant via
`/.well-known/agent-card.json`, negotiates a cart, gets promotions applied, delegates payment, and
completes checkout — all over the **Agentic Commerce Protocol (ACP)** and **Universal Commerce Protocol
(UCP)**, with no human touching a browser.

## Why this is the highest-novelty entry available

ACP/UCP is the newest thing NVIDIA has shipped in this org. Anyone can clone the blueprint — but the
blueprint ships a **toy merchant API on port 8000 with a fake product list**. Almost no contest entrant
will have a real order management system behind it.

We have: real SKUs, real multi-channel pricing, a real promotion engine, real stock reservation, real
payment service, real after-sales. Plugging ACP into that is *the* demo.

## Protocol surface to implement

| Protocol | Transport | Endpoints |
| --- | --- | --- |
| **ACP** | REST + webhooks | `POST /checkout_sessions`, `GET/POST /checkout_sessions/{id}`, `POST /checkout_sessions/{id}/complete`, `POST /checkout_sessions/{id}/cancel`, post-purchase webhooks |
| **UCP** | JSON-RPC (A2A) | `GET /.well-known/ucp`, `GET /.well-known/agent-card.json`, `POST /a2a` |
| **MCP** | existing | Apps-SDK-style tools so an agent can browse before it buys |

## Architecture

See `diagrams/idea-03-agentic-commerce.drawio.png`.

```
External AI agent  ──MCP──▶  ai-service (browse/search tools, already built)
        │
        ├──ACP REST─────────▶ ecommerce-bff  /acp/*        ─┐
        └──UCP JSON-RPC─────▶ ecommerce-bff  /a2a          ─┤
                                                            │
                              AcpCheckoutSessionService ────┤
                                 ├─▶ goods-service    SKU validity
                                 ├─▶ price-service    channel price (new channel: AGENT)
                                 ├─▶ promotion-service PromotionCheckoutController  ← best-offer negotiation
                                 ├─▶ stock-service    availability + reserve
                                 ├─▶ order-service    create order (orderType = AGENT)
                                 └─▶ payment-service  delegated payment token
                                                            │
                              post-purchase webhook ◀───────┘  (order events off the existing Kafka outbox)
```

**Where it lives:** `ecommerce-bff`. It is already the storefront's edge (Spring Cloud Gateway / Feign
aggregator), already does JWT, and ACP is an *external-facing commerce API* — same class of thing.
`ai-service` stays the MCP/LLM side. Do **not** put protocol endpoints in `order-service`.

## The two design decisions that matter

1. **Agent as a channel, not a hack.** `channel-service` already models sales channels; `price-service`
   already prices per channel. Register `AGENT` as a channel and every downstream question ("what price?",
   "which promotions?", "which stock pool?") is answered by existing business logic instead of new
   if-statements. This also means finance can report on agent-driven revenue on day one.

2. **`orderType` for agent orders.** There is an in-flight order-type/status refactor (2-field model,
   staged deploy, increments 1 and 2a shipped). Add `AGENT` as an order type value in that model rather
   than inventing a parallel flag — check the current increment state before writing the migration.

## Build steps

**Phase 1 — ACP checkout sessions (8 days)**
1. `ecommerce-bff`: `AcpController` + `AcpCheckoutSessionService`. Session state in Redis with TTL (a checkout session is ephemeral — no new table).
2. Map ACP session lifecycle onto: validate SKUs → price → apply promotions → reserve stock → create order.
3. ACP-compliant error taxonomy; idempotency keys on `complete`.
4. Contract tests. The repo's `contract-testing` conventions (OpenAPI-as-contract) apply — write the ACP OpenAPI spec first, generate, verify.

**Phase 2 — UCP discovery + A2A (4 days)**
5. `/.well-known/ucp` and `/.well-known/agent-card.json` describing our capabilities (search, quote, checkout, order-status, returns).
6. `POST /a2a` JSON-RPC dispatcher over the same service layer.

**Phase 3 — payment delegation (4 days)**
7. `payment-service`: delegated-payment token flow per ACP (agent holds a scoped token, merchant charges).
   Sandbox PSP only. **Do not** wire a live acquirer for a contest.

**Phase 4 — NAT-style feature agents (4 days, optional but demo-rich)**
8. Promotion negotiation agent: agent asks "best price for this basket", `promotion-service` evaluates all
   applicable offers, LLM explains the chosen combination in natural language. Real negotiation, real engine.
9. Post-purchase agent: order events → Kafka → agent notified via ACP webhook ("shipped", "delayed", "return approved").

**Phase 5 — security (3 days)**
10. Agent identity via Keycloak client credentials; per-agent scopes and spend caps enforced through
    **OPA** (`opa-policy`). An agent must not be able to buy outside its budget or its allowed categories.
    This is the slide that separates a demo from a design.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Protocol spec churn** — ACP/UCP are weeks old | Pin to the blueprint's spec version and say so. Isolate all protocol mapping in one adapter class so a spec bump is one file. |
| Autonomous spend | Hard caps: per-agent, per-session, per-day, enforced in OPA + a `payment-service` ceiling. Sandbox PSP only. |
| Stock oversell from agent traffic | Reuse the existing reservation path; do not add a fast path. |
| Order-type refactor collision | Coordinate with increments 2b–2f before adding `AGENT` |
| Judges don't know what ACP is | Lead the demo with *"this is how ChatGPT will buy from a store in 2027"* — then show it working against a real OMS. |

## Demo script (5 minutes)

1. Point Claude/ChatGPT at our `.well-known/agent-card.json`. It discovers the merchant unprompted.
2. Natural language: *"buy 3 tins of formula for a 2-year-old, cheapest total including promotions, deliver to District 7."*
3. Agent searches (MCP) → opens ACP checkout session → promotion engine returns the best offer combination
   → agent asks *why* that combination → LLM explains the real promotion-engine decision.
4. Agent completes checkout with a delegated payment token.
5. Cut to the **back-office** — the order is there, channel `AGENT`, stock reserved, invoice queued. Not a mock.
6. Repeat with a second agent whose OPA budget is 200k → **denied**, with the policy reason.

## Effort

~23 dev-days. Phases 1+2 (12 days) are a complete standalone entry; 3–5 harden it.
