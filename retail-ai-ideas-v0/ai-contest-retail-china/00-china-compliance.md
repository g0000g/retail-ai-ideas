# China compliance — the constraints that shape every idea in this folder

This is not a legal opinion. It is an engineering brief: what the rules require, what that means for
system design, and where to verify. **Have counsel confirm before shipping anything to the China market.**

Snapshot: July 2026.

---

## 1 · AI content labelling — 《人工智能生成合成内容标识办法》

**The single most design-relevant rule in this folder**, because half these ideas generate content.

- **In force 1 September 2025.** Issued jointly by **CAC (国家互联网信息办公室) + MIIT (工业和信息化部) +
  MPS (公安部) + NRTA (国家广播电视总局)**.
- **Companion mandatory national standard: GB 45438—2025**, effective the same day, defining labelling
  methods, application scenarios and formats.

### Two label types — you must implement both

| Type | Requirement |
| --- | --- |
| **显式标识 (explicit)** | Added *within the content or the interaction interface* via text, sound or graphics, in a way **users can clearly perceive**. |
| **隐式标识 (implicit)** | Added technically into the **file metadata**: attribute information about the generated content, **the provider's name or code, and a content ID**. Digital watermarking is encouraged. |

### Platform-side obligations

- Six major domestic social platforms announced **"AI-generated" explicit badges plus implicit metadata
  labelling** simultaneously. The flow is: **creators self-declare → platforms auto-detect and supplement**.
- Platforms must **verify labels at upload** and add **risk warnings** to unlabelled or suspected-AI content.
- **Deleting, altering or concealing AI labels is prohibited.**

### Scale context
**490+ large models have completed CAC filing nationally**, 240+ at provincial level; China's generative-AI
user base reached **230 million**.

### What this means for our design

1. Every AI-generated asset ([C01](C01-digital-human-livestream.md) video,
   [C04](C04-content-factory-douyin-xiaohongshu.md) copy/images, [C06](C06-virtual-tryon.md) try-on renders)
   must carry **both** labels **from the generation step**, not bolted on at publish time.
2. **Content ID + provider code must be minted at generation and persisted.** That is the same record the
   [`I06` decision registry](../ai-contest-retail-industry/I06-ai-governance-measurement.md) already
   stores — so implement it once and satisfy both.
3. A digital-human livestream is squarely in scope. Plan the on-screen badge into the stream layout, not
   as an afterthought.
4. **Do not build any feature whose value depends on the AI origin being hidden.** That is now illegal in
   this market, and it was always a bad idea.

Sources: [CAC — 四部门联合发布《人工智能生成合成内容标识办法》](https://www.cac.gov.cn/2025-03/14/c_1743654685899683.htm) ·
[CAC — 关于印发《标识办法》的通知](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm) ·
[PwC China — 合规解码 (PDF)](https://www.pwccn.com/zh/tmt/method-identifying-synthetic-content-generated-ai-sep2025.pdf) ·
[新华网 — 9月1日起AI生成合成内容必须添加标识](http://www.news.cn/tech/20250319/a572ec4366f149c1b0b04a07ebf4931b/c.html) ·
[政策解读 — 强化全流程管理](https://gaj.sjz.gov.cn/columns/8b1f0c74-b14b-4979-a0d1-77274c117892/202503/18/1a617395-1879-45b3-9e34-1e0c5c4eda2c.html)

## 2 · Personal information & cross-border transfer — PIPL

This is what decides **where inference runs**, and it is the reason the local-first tier from the VTI set
matters even more here than it did for Vietnam.

- **Measures for Certification of Cross-Border Personal Information Transfer** — issued by CAC + SAMR on
  **14 October 2025**, **effective 1 January 2026**. This completes the **three-pathway framework** for
  cross-border PI transfer under PIPL.
- The new certification route matters for mid-scale exporters **below the mandatory CAC security-assessment
  thresholds**: an authorised body reviews data-protection practices, the **PIPIA**, and operational
  controls, then issues a certificate that serves as the lawful basis under **PIPL Article 38**.
- **GB/T 46068-2025** (security certification requirements for cross-border PI processing) — effective
  **1 March 2026**.
- A second wave of supplementary national standards — technical controls, certification-body accreditation,
  sector rules, **encryption benchmarks, access-control specs, audit-logging standards** — becomes
  mandatory **1 July 2026**.
- **2026 Cybersecurity Law amendments** raised administrative penalties for non-compliant transfers and
  strengthened sectoral regulators. **Shanghai launched a cross-border transfer pilot in April 2026** with
  streamlined filing and faster approvals.
- **29 December 2025**: CAC required **annual filing of minors' personal-information protection compliance
  audits**, first deadline **31 January 2026** — including foreign companies processing minors' data to
  serve the China market. ⚠ Directly relevant if the demo category is **infant formula / baby products**,
  which is the category the VTI catalogue recommended.

### What this means for our design

| Rule | Engineering consequence |
| --- | --- |
| PI must not leave China without a lawful basis | **Inference on Chinese customer data runs inside China, full stop.** The tier-0 local model story from the VTI set stops being a cost optimisation and becomes the compliance architecture. |
| Certification requires demonstrable controls | Regulators want **engineering controls — tokenisation, anonymisation, gated access, encryption — not merely documented ones**. The PII scrubber + OPA deny rule from [V12](../ai-contest-retail-vti/V12-local-model-gateway.md) is exactly this, and it is auditable. |
| PIPIA per transfer | Keep a **current PIPIA on file for every transfer**. |
| Vendor contracts | Review and renegotiate to include **Chinese SCC clauses, audit rights, incident-response obligations**. |
| Audit-logging standards mandatory from July 2026 | The `ai_decision` registry from [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) is the natural place to satisfy this. Build it once. |

**The clean architectural answer for this market:** Qwen3 / DeepSeek / GLM served **inside China** —
either self-hosted or on a domestic cloud — with **no cross-border escalation tier at all** for anything
touching customer data. That is simpler than the VTI set's two-tier design, not more complex.

Sources: [China Briefing — cross-border data transfer certification measures](https://www.china-briefing.com/news/china-cross-border-data-transfer-certification/) ·
[KWM — key points on personal information export certification](https://www.kwm.com/us/en/insights/latest-thinking/chinas-cross-border-dataregime-key-points-on-personal-information-export-certification.html) ·
[Global Law Experts — PIPL cross-border transfer certification 2026](https://globallawexperts.com/pipl-crossborder-transfer-certification-china-2026/) ·
[Klea Legal — China data laws 2026](https://klealegal.com/newsroom/china-data-laws-2026-key-changes) ·
[Practical compliance checklist for CDP/CRM and AI platforms](https://globaladvisoryexperts.com/crossborder-data-transfer-china/)

⚠ Several of the 2026-dated sources above are **law-firm marketing pages**. Verify the July 2026 standards
timeline and the Shanghai pilot against **CAC primary sources** before relying on them.

## 3 · Platform rules (not law, but equally binding in practice)

| Rule | Source | Consequence |
| --- | --- | --- |
| **Douyin open platform requires an enterprise entity** — individual merchants are rejected | [抖音开放平台](https://developer.open-douyin.com/) | Business-licence prerequisite before any integration work starts |
| **Data scraping and non-compliant marketing prohibited** by the Douyin service agreement | same | Rules out scraping-based competitor price collection on that platform. [C10](C10-cross-domain-reco-targeting.md) and I01 use only marketplace-visible data. |
| **Scoped permissions per use case** — e-commerce transactions / content operations / user management | [OpenAPI 列表](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/list) | Apply for exactly what you need; expect review time in the plan |
| **Alibaba auto-downranks listings priced 15%+ below guidance** and notifies brand owners | market research §6 | Price governance is a **hard constraint** on any pricing optimiser, checked before listing |
| **乐企 is the sanctioned e-fapiao channel** for large issuers; 查验 only via the national platform | [inv-veri.chinatax.gov.cn](https://inv-veri.chinatax.gov.cn/) | [C08](C08-e-fapiao-automation.md) must not invent its own verification path |

## 4 · The compliance checklist to ship with the entry

1. **AI labelling** — explicit badge + implicit metadata (provider code + content ID) on every generated
   asset, minted at generation, persisted in `ai_decision`. GB 45438—2025 format.
2. **Residency** — customer PI never leaves China; inference domestic; documented in the residency table.
3. **PIPIA** on file per cross-border transfer, if any exists at all.
4. **Model & data licence register** — see [`00-china-oss-stack.md` §10](00-china-oss-stack.md), including
   the deliberate exclusions (IDM-VTON non-commercial, MiniMax M3 restricted, Kimi K3 revenue-gated).
5. **Audit logging** — `ai_decision` registry, aligned to the standards mandatory from 1 July 2026.
6. **Minors' data** — if the demo category is infant/baby, the annual compliance-audit filing applies.
7. **Platform permissions** — enterprise entity, scoped API permissions, no scraping.

Six of these seven are things [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) already
builds for other reasons. **Compliance in this market is mostly a re-use of the governance layer, not a new
project** — which is a good slide.
