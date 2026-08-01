# W03 — Multi-protocol agentic commerce merchant (ACP + AP2 + UCP)

> **Driver:** 75% of NRF 2026 retailers implementing; ~1% of shoppers using · **Effort:** M (~3 weeks) · **Verdict:** ⭐ supersedes set-1 idea 03

## What changed since [`N-03`](../ai-contest-retail/03-agentic-commerce-acp-ucp.md) was written

That plan treated ACP and UCP as **competing protocols to pick between**. The 2026 picture is different in
four material ways:

| Then | Now |
| --- | --- |
| ACP vs UCP, choose one | **They are different layers.** *"ACP is the commerce/checkout protocol, AP2 is the payment-consent protocol, and a full agentic purchase uses both."* ACP owns shopping, **AP2 owns governance and trust**, x402 handles machine payments |
| Google's AP2 is a vendor protocol | **AP2 v0.2 was donated to the FIDO Alliance on 28 April 2026** → community governance |
| ChatGPT Instant Checkout is the flagship surface | **That surface was shut down in March 2026.** The widely-cited **4% fee is of unconfirmed applicability** — verify live terms |
| Pick a protocol | **Visa Intelligent Commerce Connect** (8 Apr 2026) is a **protocol-agnostic on-ramp** accepting Visa TAP, Mastercard MPP, ACP and UCP simultaneously |

**Conclusion: build for more than one protocol, and put the adapter boundary in the right place.**

## The tension that decides how much to build

| Signal | Number |
| --- | --- |
| McKinsey, US agentic commerce by 2030 | **$1 trillion** |
| Shoppers currently using agents to buy (Morgan Stanley) | **~1%** |
| NRF 2026 retailers implementing agentic commerce | **75%** |
| Adobe: genAI traffic to US retail sites, Jul 2024 → Jul 2025 | **+4,700% YoY** |

> *"Infrastructure is way ahead of consumers."*

And the guidance that follows from it, quoted because it is the plan:
**"instrument agent transaction flows now, while volumes are low enough to debug properly."**

That is the honest framing for a contest: **this is not a revenue play in 2026, it is a readiness play** —
and readiness is cheap while volume is near zero.

## Architecture

```
External agents:  ChatGPT · Gemini · Claude · procurement bots · Visa ICC on-ramp
        ▼
DISCOVERY   /.well-known/agent-card.json · /.well-known/ucp
        ▼
ecommerce-bff  —  protocol surface
   ├─ ACP  (REST)          checkout_sessions · complete · cancel · post-purchase webhooks
   ├─ UCP  (A2A JSON-RPC)  agent cart · catalogue access · IDENTITY LINKING for loyalty
   └─ MCP                  browse-before-buy (ai-service tools, already built)
        ▼
AP2 CONSENT LAYER  —  the part N-03 did not have
   three signed MANDATES as W3C Verifiable Credentials:
      INTENT   what the user authorised the agent to do
      CART     what the agent actually assembled
      PAYMENT  the funding instrument and its limits
   verify the chain before fulfilling. Stablecoin rails are first-class in AP2.
        ▼
ONE ADAPTER LAYER → one internal AgenticCheckoutService
   validate SKUs → price for channel AGENT → promotion engine negotiates →
   reserve stock → payment → order (orderType = AGENT)
        ▼
Existing services, unchanged. Nothing forked, no fast path.
```

**Two design calls that matter:**

1. **Normalise early.** ACP, UCP and any future protocol map into **one internal checkout-session model**
   in the first 50 lines. Protocol churn then costs one adapter file, not a service.
2. **AP2 mandates are the authorization record.** An Intent/Cart/Payment mandate chain is *better evidence
   of consent than anything we have for human checkout* — verify it, store it, and use it for dispute
   handling. That is a genuinely new capability, not just compliance.

## Where the OPA gate goes

[`N-12`](../ai-contest-retail/12-ai-guardrails-opa.md)'s action gate is more important here than anywhere:
an autonomous agent with a payment token is the highest-consequence caller we will ever expose.

```rego
allow if {
  input.principal.type == "agent"
  input.action == "complete_checkout"
  input.cart.total <= input.mandate.payment.limit        # AP2 Payment Mandate
  input.cart.items ⊆ input.mandate.cart.items           # AP2 Cart Mandate
  input.mandate.intent.verified == true                  # AP2 Intent Mandate
  input.cart.total <= input.session.budgetRemaining
}
```

**The mandate chain becomes policy input.** Cryptographically-signed consent, enforced by a policy engine
that already runs in production. That is the slide.

## Build steps

**Phase 1 — normalise and instrument (7 days)**
1. Internal `AgenticCheckoutSession` model + the state machine, protocol-agnostic. Redis-backed, TTL.
2. **Instrumentation first** — every agent interaction into `ai_decision` ([I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md))
   and OTel spans. *Debug while volumes are near zero.*
3. `AGENT` channel in `channel-service` so pricing, promotions, stock pool and finance reporting work
   unchanged — same pattern as N-03.

**Phase 2 — protocol adapters (8 days)**
4. **ACP** adapter: checkout sessions, idempotency on `complete`, ACP error taxonomy, post-purchase webhooks.
5. **UCP** adapter: `/.well-known/ucp`, agent-card, A2A JSON-RPC, **identity linking for loyalty** — the
   feature Gap's CTO cited as why UCP gives merchants more control.
6. Contract tests from an OpenAPI spec first, per the repo's `contract-testing` conventions.

**Phase 3 — AP2 consent (5 days)**
7. Verify Intent / Cart / Payment mandates as **W3C Verifiable Credentials**; store the chain against the order.
8. OPA rules over the mandate chain, fail closed.

**Phase 4 — payments and acceptance (4 days)**
9. Delegated payment token flow, **sandbox PSP only**. Note the on-ramps that exist —
   **Visa Intelligent Commerce Connect** (protocol-agnostic), Mastercard Agent Pay, Amex ACE — and pick one
   to document rather than integrate.

**Phase 5 — measurement (3 days)**
10. Agent transaction funnel: discovery → session → cart → mandate verified → complete. Failure reasons by
    protocol. This is the artefact worth having while volumes are 1%.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Protocol churn** — ACP still in beta, AP2 just changed governance | One adapter layer, one internal model. Pin versions in config. Churn costs one file. |
| **Building for 1% of shoppers** | Framed as readiness, not revenue. Phase 1's instrumentation is the deliverable; the rest is optional depth. |
| ChatGPT Instant Checkout shut down — the surface moved | Don't build for one surface. Discovery + protocol conformance is surface-independent. |
| Fee terms unclear | The 4% figure's applicability is **unconfirmed** after the March 2026 shutdown. Do not put it in a business case; verify with the provider. |
| Autonomous overspend | AP2 mandate limits + OPA + per-agent budget in Redis + sandbox PSP. Three independent caps. |
| Agent buys out of stock / at the wrong price | Existing reservation and pricing paths, no fast path — same rule as N-03 |
| Fragmentation by proprietary agents (Amazon, OpenAI, Google) | Named as a structural risk in the sources. Our answer: open standards + one internal model, so a proprietary surface is one more adapter |
| Scope creep into a payments product | Line: discovery, session, consent verification, order. Not acquiring, not settlement, not disputes. |

## Demo script (3.5 minutes)

1. An external agent discovers the merchant via `/.well-known/agent-card.json` — unprompted.
2. Natural-language purchase → ACP checkout session → the **real promotion engine** returns the best offer
   combination → the agent asks *why* → grounded explanation.
3. **The new part:** show the **AP2 mandate chain** — Intent, Cart, Payment as signed Verifiable
   Credentials — and OPA verifying that the cart is a subset of the Cart Mandate and within the Payment
   Mandate limit. Then tamper with the cart → **denied**, with the mandate clause cited.
4. Complete → cut to back-office: the order exists on channel `AGENT`, stock reserved, invoice queued.
5. Agent funnel dashboard: discovery → session → mandate verified → complete, with failure reasons.
6. One-line close: *"75% of NRF retailers are building this; 1% of shoppers use it. We instrumented it
   while it was cheap to debug."*

## Effort

~27 dev-days for all five phases. **Phase 1 alone (7 days) is the defensible minimum** — a normalised
internal model plus instrumentation, which is exactly what the market guidance says to do first.
