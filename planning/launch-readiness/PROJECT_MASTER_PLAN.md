# PROJECT MASTER PLAN — Ahaget
> Single source of truth. Updated whenever priorities shift. Last updated: 2026-06-01.

---

## Product Vision

Ahaget is a **B2B2C AI onboarding platform** — SaaS companies install a single script tag to give their users a context-aware AI onboarding agent inside their product. The agent guides new users through setup, drives feature adoption, handles support questions, and surfaces upsell opportunities — without requiring the SaaS company to build any of this themselves.

**Core insight:** The activation gap (signup → aha moment) is the single largest source of churn in SaaS. Ahaget is the infrastructure layer that closes it using AI.

---

## Current Architecture Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| API Server | Express 4.18, TypeScript, Node 20 | Running |
| Database | PostgreSQL 15 + Prisma 5.10 + pgvector | Running |
| Queue | BullMQ (Redis) + setTimeout fallback | Partial |
| Widget | Vite IIFE bundle, `cdn.ahaget.ai` | CDN NOT deployed |
| Dashboard | Next.js 14.1, App Router, Tailwind | Running |
| Landing | Next.js 14.1 static export | Running |
| LLM | OpenRouter (gpt-4o-mini / gpt-4o) | Running |
| Embeddings | OpenAI text-embedding-3-small | Running |
| Billing | Stripe (4 plans: Free/Starter/Growth/Scale) | Integrated |
| Email | Resend | Integrated |
| Error Tracking | Sentry | Integrated |
| Redis | Upstash (rate limiting) + ioredis (BullMQ) | Optional |
| Multilingual | Sarvam AI (10 Indian languages) | Optional |
| Deploy | Railway (backend) + Vercel (dashboard/landing) | NOT executed |

---

## Core Differentiators

1. **Agent does actions, not just answers** — the widget can fill forms, click buttons, navigate pages. Competitors (Appcues, Intercom) only show tooltips and checklists.
2. **MCP connector ecosystem** — agent can call external tools (databases, APIs) via Model Context Protocol during live flows.
3. **Context-aware routing** — pgvector KB + live DOM scanning + user history + live context injection from customer APIs.
4. **Goal mode** — free-form goal execution with ReAct loop (up to 12 turns).
5. **Indian market focus** — Sarvam AI integration for 10 Indian languages. No Western competitor has this.
6. **Upsell attribution** — revenue directly attributed to AI-initiated upgrade prompts.
7. **Self-healing selectors** — 8 fallback strategies when DOM changes break configured selectors.

---

## Customer Persona

**Primary (ICP): Series A–B SaaS companies with activation problem**

| Attribute | Description |
|-----------|-------------|
| Size | 10–200 employees |
| Funding | Seed to Series B |
| Activation metric | < 40% signup → aha moment |
| Team | Has a product team, no dedicated onboarding eng |
| Budget authority | Head of Product / VP Growth |
| Decision timeline | 2–4 weeks trial → paid |
| ACV | $1,200–$12,000/yr |

**Secondary: Enterprise SaaS (Scale tier)**

| Attribute | Description |
|-----------|-------------|
| Size | 200–2,000 employees |
| Need | Compliance (audit log, SSO), custom contract |
| ACV | $12,000–$120,000/yr |

**End-user (B2C layer):** New users of customer's SaaS product. Not decision-makers. Experience Ahaget only through the widget.

---

## Ideal Customer Profile (ICP)

Strongest signal for a qualified prospect:
- SaaS product with onboarding flow (signup → first value)
- 500–50,000 monthly active users
- Paying for Intercom, Appcues, or Pendo already (budget proven)
- Has a "time to activate" metric they track
- Uses React, Vue, or Angular (widget works best in SPAs)

---

## Pricing Strategy (Current)

| Plan | Price/mo | MTU | Messages | Agents | Target Customer |
|------|----------|-----|----------|--------|-----------------|
| Free | $0 | 100 | 1,000 | 3 | Developers evaluating |
| Starter | $99 | 1,000 | 5,000 | 10 | Early-stage startups |
| Growth | $299 | 10,000 | 25,000 | Unlimited | Growth-stage SaaS |
| Scale | $999 | Unlimited | ~Unlimited | Unlimited | Enterprise |

**INR pricing exists** (₹7,999 / ₹24,999 / ₹79,999) — good for Indian market.

**Pricing gaps:**
- No annual discount (20–30% discount is SaaS standard, drives 12-month commitment)
- No add-on MTU packs (lose growth customers who hit MTU before upgrading)
- No usage-based overage option
- No 14-day trial with credit card (only free tier exists)
- No seat-based pricing component for enterprise

---

## Competitive Landscape

| Competitor | Strength | Ahaget Advantage |
|-----------|----------|-----------------|
| Appcues | UI polish, brand recognition | AI does actions, not just shows tooltips |
| Userflow | Clean UX, checklists | Agent understands context, MCP integration |
| Pendo | Enterprise relationships, analytics | 10x cheaper, faster to deploy |
| Intercom | Brand, support integration | Onboarding-native, DOM execution |
| Chameleon | Good A/B testing | Better AI, Indian market |
| Userpilot | SMB pricing | More powerful AI agent |

**Ahaget's defensible moat:** MCP + DOM execution + Indian language support + vertical AI specialization for onboarding.

---

## Current Technical Risks

| Risk | Severity | Impact | Mitigation Status |
|------|----------|--------|------------------|
| CDN not deployed | CRITICAL | Widget doesn't load | Not started |
| CORS allows all origins | CRITICAL | API exposed to any domain | Not fixed |
| Stub routes unauthenticated | HIGH | Unauthorized data access | Not fixed |
| In-memory rate limiters | HIGH | Bypass on multi-instance | Not fixed |
| DB auth values in plaintext | HIGH | Credential exposure | Not fixed |
| No team invite flow | HIGH | Can't add users | Not built |
| Widget JWT in localStorage | MEDIUM | XSS vulnerability | Not fixed |
| Single DB instance | MEDIUM | No failover | Acceptable for now |
| No graceful shutdown | MEDIUM | In-flight requests dropped | Not fixed |

---

## Current Business Risks

| Risk | Severity | Impact |
|------|----------|--------|
| No paying customers yet | CRITICAL | No revenue validation |
| No widget CDN live | CRITICAL | Product doesn't work |
| OpenRouter dependency | HIGH | Single LLM provider, no fallback |
| No logo/brand assets deployed | MEDIUM | Unprofessional first impression |
| 20+ stub routes visible | MEDIUM | Dashboard looks incomplete to customers |
| No support system | MEDIUM | Can't handle customer tickets |

---

## Launch Readiness Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product | 5/10 | Core works, activation gaps, stubs visible |
| Engineering | 6/10 | Good structure, missing prod hardening |
| Security | 4/10 | Multiple critical vulnerabilities |
| AI | 7/10 | Impressive depth, needs eval dashboard |
| UX/UI | 5/10 | Functional, needs empty states + polish |
| Growth | 3/10 | Almost nothing built |
| Infrastructure | 5/10 | Good foundation, not production-hardened |

**Overall Launch Score: 50 / 100**

**Honest assessment:** NOT ready to take paying customers today. With 1 week of focused work on P0 blockers, it can reach 70/100 — sufficient for early pilots with close oversight.

---

## Active Priorities

### P0 — Must fix before any customer (this week)
1. Deploy CDN and Railway + Vercel
2. Fix CORS to restrict to known origins
3. Add auth to stub routes
4. Fix in-memory rate limiter → Redis
5. Encrypt MCP/Integration credentials at rest
6. Add team invite flow
7. Remove stubs UI hint from sidebar

### P1 — First paying customers (30 days)
1. Empty state handling for all dashboard pages
2. Usage limit email notifications
3. Annual pricing + 14-day trial
4. Upgrade prompt when limits hit
5. Support system (Intercom or Crisp)
6. Docs site

### P2 — Scale to 100 customers (90 days)
1. SSO/SAML implementation
2. Referral program
3. Zapier/Make integration
4. Usage-based billing (overage MTU packs)

---

## Completed Milestones

- [x] v1.0.0 tagged (2026-05-23)
- [x] Pivot1 agent quality KPIs (eval logs, first-turn completion, p95 latency)
- [x] Widget choice cards + exec steps + proactive cards
- [x] Dashboard NewOrgWelcome empty state
- [x] pgvector + hierarchical context
- [x] MCP async path (McpPendingJob + BullMQ)
- [x] Upsell attribution model
- [x] A/B experiment data model (UI stubbed)
- [x] UserMemory + AgentEvalLog + BrandingConfig models

---

## Future Roadmap

| Phase | Timeframe | Focus |
|-------|-----------|-------|
| Launch Ready | Week 1 | P0 security + CDN + deployment |
| First Customers | Month 1 | Product polish, billing, docs |
| $10K MRR | Month 2–3 | Growth loops, referral, enterprise pilot |
| $50K MRR | Month 4–6 | SSO, Zapier, usage billing, SOC 2 |
| Series A prep | Month 7–12 | Enterprise expansion, white-label |
