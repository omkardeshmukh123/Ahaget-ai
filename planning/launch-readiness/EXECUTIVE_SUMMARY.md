# EXECUTIVE SUMMARY — Ahaget Launch Readiness
> For founder review. Brutally honest. Last updated: 2026-06-01.

---

## Overall Verdict

**Do not take paying customers today.** Ahaget has a technically impressive AI core, but several launch-blocking gaps in security, deployment, and product completeness would embarrass you in front of a paying customer or enterprise pilot within the first hour. With 1 week of focused execution on the P0 list below, you can reach a defensible launch position.

---

## Top 10 Launch Blockers

| # | Blocker | Why It's Critical |
|---|---------|-----------------|
| 1 | **CDN (`cdn.ahaget.ai`) not deployed** | The widget script referenced in every welcome email doesn't load. The product simply doesn't work. |
| 2 | **Railway + Vercel deployment not executed** | The backend and dashboard are only running locally. There is no production URL. |
| 3 | **CORS allows all origins** | `index.ts:93` explicitly falls through with `cb(null, true)` for unrecognized origins. Any website on the internet can call your API. |
| 4 | **Stub routes have no authentication** | `/api/v1/followup`, `/api/v1/churn`, `/api/v1/autooptimize`, `/api/v1/benchmarks`, `/api/v1/optimize`, `/api/v1/experiments` are mounted without auth middleware. Any unauthenticated caller can hit them. |
| 5 | **MCP connector auth values stored in plaintext** | `McpConnector.authValue` and `IntegrationConfig.credentials` store bearer tokens and API keys as plain text in PostgreSQL. One DB read = all your customers' credentials. |
| 6 | **In-memory rate limiter** | `actRateLimit` in `session.ts:935` is a `Map` in process memory. On Railway (which horizontal-scales), each instance has its own counter. Limit is trivially bypassed by opening two tabs. |
| 7 | **Monthly message limit counted inconsistently** | `/session/act` does a DB count directly; `/session/act/stream` also does its own DB count. The `enforceMessageLimit` Redis middleware exists but is not applied to these routes. Counts diverge. |
| 8 | **No team invite flow** | `User.role` exists but there is no `POST /api/v1/auth/invite` endpoint. Customers cannot add their teammates to the dashboard. This is a Day 1 ask from any real customer. |
| 9 | **A/B experiments, auto-optimize, follow-up are fully stubbed** | The dashboard shows these as real menu items. Customers will click them, see "coming soon" responses, and lose trust immediately. Either hide them or label them "beta." |
| 10 | **No graceful shutdown handler** | Server doesn't catch `SIGTERM`. Railway deployments kill the process mid-request. LLM calls, DB writes, and BullMQ jobs are dropped silently. |

---

## Top 10 Security Concerns

| # | Vulnerability | Severity | Exploit |
|---|--------------|----------|---------|
| 1 | CORS wildcard | CRITICAL | Any origin can make authenticated API calls using a stolen JWT |
| 2 | Plaintext credentials in DB | CRITICAL | `SELECT auth_value FROM mcp_connectors` leaks all customer API keys |
| 3 | Stub routes unauthenticated | HIGH | Data enumeration, abuse |
| 4 | Prompt injection via DOM | HIGH | Attacker injects instructions into page DOM; widget sends them to agent |
| 5 | Escalation webhook SSRF | HIGH | Customer sets `escalationWebhook` to `http://169.254.169.254/...`; no IP guard |
| 6 | JWT in localStorage | MEDIUM | XSS in dashboard reads `localStorage.oai_token` and hijacks session |
| 7 | No rate limit on auth endpoints | MEDIUM | Brute-force magic link tokens or password |
| 8 | No Stripe idempotency keys | MEDIUM | Double webhook delivery upgrades org twice / creates duplicate subscriptions |
| 9 | No webhook signature on selector alerts | MEDIUM | Anyone can POST to your escalation webhook URL |
| 10 | DOM scanner sends full page content | LOW | Could leak PII from customer pages to Ahaget servers |

---

## Top 10 Growth Opportunities

| # | Opportunity | Potential Impact |
|---|------------|-----------------|
| 1 | **Annual billing (-20%)** | 30–40% of SaaS customers choose annual; dramatically improves cash flow |
| 2 | **14-day free trial with credit card** | Industry standard; converts 3–5x better than free tier alone |
| 3 | **Usage overage packs** | Customers who hit MTU limits churn instead of paying; give them a $49 MTU pack option |
| 4 | **Referral program** | B2B referral programs generate 16% of revenue at median SaaS companies |
| 5 | **"Powered by Ahaget" badge** | Viral B2B2C loop — end-users see brand, some are startup founders themselves |
| 6 | **Usage notification emails** | "You're at 80% of your message limit" → upgrade CTA → ~15% conversion |
| 7 | **Zapier/Make integration** | Unlocks "no-code" buyer persona; mentioned in competitor comparisons |
| 8 | **In-product success stories** | Show completion rate improvements vs. baseline to trigger upgrade |
| 9 | **Content moat: Indian SaaS market** | Only AI onboarding tool with 10 Indian languages. Write for this market explicitly. |
| 10 | **YC deal (standard terms)** | $500K investment + network = first 20 customers + credibility signal |

---

## Top 10 Product Improvements

| # | Improvement | Impact |
|---|------------|--------|
| 1 | **Empty states on every dashboard page** | New customers see blank tables and assume the product is broken. Each page needs a helpful "get started" empty state. |
| 2 | **Widget install verification** | The install flow ends with a code snippet. There's no "test this now" button that confirms the widget loaded. Customers get stuck here. |
| 3 | **Flow preview in dashboard** | Admins can't preview their flow without installing the widget. Add a preview iframe or sandbox. |
| 4 | **Usage notification emails** | Build the "80%/100% limit reached" email sequences. This is both retention and upgrade tooling. |
| 5 | **Sidebar grouping** | 20+ sidebar items with no hierarchy makes the dashboard feel like a feature dump. Group into 4 sections: Build / Monitor / Optimize / Settings. |
| 6 | **Upgrade prompt in dashboard** | When a feature is gated, the current UX is a 403 error. Replace with a beautiful upgrade prompt with a CTA. |
| 7 | **Team invite flow** | `User.role` exists; build the invite-by-email flow. Without it, solo founders can't collaborate with their team. |
| 8 | **Session replay UI** | `sessionReplay` is gated on Starter+, but the sessions page doesn't actually replay conversations. Build the timeline view. |
| 9 | **Docs site** | There is no public documentation. Customers cannot self-serve answers. Every question becomes a support ticket. |
| 10 | **Onboarding completion metric on dashboard** | The home dashboard shows "active sessions" but not the most important metric: "% of users who completed onboarding this week." |

---

## Estimated Path to First 100 Customers

### Week 1 — Launch blocker fix (not visible to customers)
- Fix all P0 security and deployment issues
- Deploy CDN + Railway + Vercel
- Result: Product actually works for paying customers

### Month 1 — First 10 customers
- Build: team invite, empty states, usage notifications, docs
- Sales: Personal outreach to 50 SaaS founders in network
- Goal: 3–5 paying customers at $99–$299/mo
- Revenue: $500–$1,500 MRR

### Month 2 — First 25 customers
- Launch on Product Hunt
- Build: annual billing, 14-day trial, upgrade prompts
- Content: "AI onboarding for Indian SaaS" blog post
- Goal: 15–25 paying customers
- Revenue: $3,000–$7,500 MRR

### Month 3 — First 50 customers
- Build: Zapier integration, referral program
- Sales: YC application + network referrals
- Goal: 40–50 paying customers
- Revenue: $8,000–$15,000 MRR

### Month 4–6 — First 100 customers
- Build: SSO, enterprise contracts, white-label option
- Sales: enterprise pilot (1 company at $10K ACV)
- Goal: 80–100 paying customers
- Revenue: $20,000–$40,000 MRR

**Key assumption:** Each customer acquired validates product-market fit. Iteration speed matters more than perfection.

---

## What Will Kill This Startup

1. **Staying in dev mode too long** — Shipping to zero customers is not a launch. The P0 list is small. Do it this week.
2. **Ignoring security** — One data breach with a customer's end-user data (PII in DOM scans, credentials in DB) = company destroyed.
3. **Building more features instead of talking to customers** — The stub routes hint at this already. Ship the P0 list, then call 10 customers before building anything new.
4. **OpenRouter single dependency** — If OpenRouter goes down or changes pricing, the product dies. Add a fallback to direct Anthropic/OpenAI within 30 days.
5. **Underpricing** — $99/mo for AI onboarding that saves $200K/yr in eng costs is laughably cheap. Increase prices with early customer validation.
