# C09 — 团长数字分身: group-leader digital clone

> **Reading:** 📘 PLAYBOOK · **Effort:** M (~2.5 weeks) · **GPU:** none · **Verdict:** medium–high — small build, and it rides on C02

## The source claim

> LLM-based agents can now **simulate private-domain group leaders (团长)**, acting as **"digital clones"**
> for platforms' millions of leaders.
> — [人人都是产品经理, 2026年品牌私域电商发展6大趋势](https://www.woshipm.com/operate/6300297.html) (trend #1: AI as standard operating infrastructure)

## Why the 团长 role survived even as the platforms died

Worth understanding before building anything, because it explains *what* to clone:

- **Duoduo Maicai is the sole national survivor**, ~62% share, **100,000+ village-level pickup points**,
  per-order fulfilment cost **~¥0.7–1** (~60% below industry average).
- **Meituan Youxuan exited** (¥77.7B of new-initiatives losses 2020–2022). **Xingsheng** retrenched from
  18 provinces to 3, and rolled out a "community partner" model said to raise **团长 income ~25%**.
  **Taocaicai closed.** **JD re-entered** as 京东拼拼.
- When Duoduo Maicai entered Nanchang, **its first move was to poach Xingsheng's group leaders.**

**The platforms were substitutable. The 团长 was not.** The leader is a trusted neighbour with a group
chat — and that is a *relationship*, which is why 私域 and community group buying are the same problem.

Sources: [36氪 — 社区团购，倒在了2026年？](https://36kr.com/p/3645726402957189) ·
[36Kr EN — eight years of the group-buying wars](https://eu.36kr.com/en/p/3895307402722308) ·
[KrASIA](https://kr-asia.com/after-the-cash-burn-what-remains-of-chinas-community-group-buying-boom)

## What the "clone" actually is — and what it must not be

**Not** a fake person impersonating a real 团长. That is a trust and legal problem, and the labelling rules
now make it non-viable anyway.

**It is an assistant that does the 团长's repetitive work**, with the leader's name on it and the leader in
control:

| 团长 task | Frequency | Clone does |
| --- | --- | --- |
| Post today's offer to the group | daily | drafts the post from real SKU/price/stock, in the leader's tone |
| Answer "有货吗 / 多少钱 / 什么时候到" | constant | drafts a grounded reply; leader sends |
| Nudge people who ordered last week but not this week | weekly | builds the list, drafts the message |
| Chase pickup (order arrived, not collected) | daily | reminder list + message |
| Collect and forward complaints | ad hoc | structures the complaint, routes to `after-sales-service` |
| Report tomorrow's demand up the chain | daily | aggregates group signals → forecast input for [C03](C03-instant-retail-front-warehouse.md) |

**The last row is the sleeper value.** A 团长's group chat contains *pre-order demand signal* that no
transaction system sees — people asking for things before they buy. Feeding that into the forecast is
worth more than the message drafting.

## Architecture

```
WeCom / group chat (via C02's SCRM layer + WxJava)
        ▼
团长 assistant (Qwen-Agent, Apache-2.0)
  ├─ tone profile per leader — learned from their own past messages, with consent
  ├─ MCP tools → goods · price · stock · promotion · order services
  ├─ task engine: daily post · reply draft · re-order nudge · pickup chase · complaint intake
  ├─ VALIDATOR: no invented price/stock/ETA · no invented promise · correct order refs
  └─ demand-signal extractor → "3 people asked for X" → C03 forecast covariate
        ▼
团长 approves / edits / discards — ALWAYS. Nothing auto-sends in a community group.
        ▼
ai_decision registry (I06): accepted / edited / discarded per message type
```

**Disclosure design:** the assistant drafts, the human sends — so the message genuinely *is* from the
团长 and the 标识办法 disclosure question is largely avoided. **If any message is ever auto-sent, it must
carry an AI disclosure.** Keep human-send as the default precisely to stay on the simple side of that line.

## Sample repos

| Component | Repo | Licence |
| --- | --- | --- |
| WeChat/WeCom SDK (Java) | [binarywang/WxJava](https://github.com/binarywang/WxJava) | — |
| SCRM layer | [openscrm/api-server](https://github.com/openscrm/api-server) | Apache-2.0 |
| SCRM + AI reference | [IYque/Iyque-SCRM](https://github.com/IYque/Iyque-SCRM) | Apache-2.0 (retain logos) |
| Agent | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Apache-2.0 |
| LLM | Qwen3.6 | Apache-2.0 |
| Mini-program mall (group order / 拼团) | litemall | — |

Almost all of this is [C02](C02-private-domain-wecom-agent.md)'s infrastructure. **C09 is a role-specific
task pack on top of C02**, not a separate system — which is why it is only ~2.5 weeks.

## Build steps

1. **(2 days)** 团长 role model: leader ↔ group ↔ pickup point ↔ served customers ↔ commission.
   (`channel-service` can host pickup points as locations.)
2. **(2 days)** Tone profile per leader from their own past messages, **with written consent**.
3. **(3 days)** Task pack: daily offer post, reply drafts, re-order nudge, pickup chase — each grounded on
   live data, each validated.
4. **(2 days)** Complaint intake → structured → `after-sales-service`.
5. **(3 days)** **Demand-signal extractor** from group chat → aggregated, anonymised counts → forecast
   covariate for [C03](C03-instant-retail-front-warehouse.md)/[V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md).
6. **(2 days)** Leader console: today's drafts, approve/edit/send, commission view.
7. **(2 days)** Measurement: draft-acceptance rate, group order rate, pickup rate, leader time saved
   (self-reported), and forecast improvement from the demand-signal covariate.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Impersonation / trust breach** | Human sends, always. Tone assistance with consent, never autonomous posting as a person. |
| Group-chat content is personal information | **Aggregate and anonymise the demand signal** — counts, not quotes, not names. Domestic processing only, per [00-china-compliance.md](00-china-compliance.md) §2. |
| Leader consent for tone learning | Written, scoped, revocable — same standard as the avatar consent in [C01](C01-digital-human-livestream.md) |
| Over-messaging the group | Hard cap per group per day; the leader's own judgment overrides |
| **The business doesn't run a 团长 network** | Then this is a plan for a *future* channel, or a reference for the VN equivalent (chợ/cư dân group admins, which exist and behave identically). Say which. |
| Platform consolidation risk | The research shows platforms died and leaders survived. Build for the leader relationship, not for a platform's API. |
| Scope creep into a full group-buying platform | Line: assist the leader. No settlement engine, no commission payout, no logistics network. |

## Demo script (2 minutes)

1. Tomorrow's group post drafted in the leader's own tone, with **real price and real stock**, awaiting approval.
2. A customer asks in the group *"还有鸡蛋吗？"* → grounded reply draft with live stock; leader taps send.
3. Re-order nudge list: 14 customers who ordered last week and not this week, with drafted messages.
4. **The interesting one:** *"6 people asked about 车厘子 this week and we don't stock it"* → surfaced as a
   demand signal, feeding the forecast and the assortment queue.
5. Slide: draft-acceptance rate, group order rate, and the forecast delta from the group-chat covariate.

## Effort

~16 dev-days **on top of [C02](C02-private-domain-wecom-agent.md)**. Standalone it doesn't make sense —
the WeCom, SCRM and agent layers are shared.
