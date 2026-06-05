# 🧠 How Ahaget Works — Complete Plain-Language Guide

> Everything explained simply. What it does, why it exists, who benefits, and how to pitch it.

---

## 🎯 What is Ahaget? (The One-Line Answer)

**Ahaget puts an AI assistant inside your SaaS product that automatically guides every new user through onboarding — without you writing a single line of extra code.**

Think of it like hiring a 24/7 employee whose only job is to make sure every user who signs up to your product actually *uses* it, gets value from it, and doesn't churn.

---

## 🔑 The Problem Ahaget Solves

Imagine you build a SaaS product. 100 people sign up this week. But:
- **60 of them never complete setup** — they get confused and leave
- **30 of them use 1 feature** and never discover the rest
- **Only 10 become real power users** who stay and pay

This is the #1 problem for every SaaS company. Users drop off during onboarding. And you lose money.

**Ahaget fixes this.** It's an AI that appears inside your product and says "Hey, let me help you set this up" — and then actually walks them through it, step by step, answering questions, clicking buttons, filling forms — all automatically.

---

## How It Works — Step by Step (Super Simple)

```
YOU (SaaS founder)                    YOUR USER
       |                                    |
  1. Sign up to Ahaget                      |
  2. Paste 1 line of code                   |
     into your website              Signs up to your product
       |                                    |
       |                         Ahaget widget appears
       |                                    |
       |                         AI says: "Hi! Let me help
       |                          you get started..."
       |                                    |
       |                         User chats with AI
       |                         AI guides them step by step
       |                         User completes onboarding
       |                                    |
  You see full analytics             User becomes a customer
  on your dashboard                  who actually pays
```

**That's the whole product.** One snippet of code. Your users get a helpful AI. You get data.

---

## Every Feature Explained Simply

---

### AGENT SECTION — The Brain of Ahaget

#### 1. Agent Flows
**What it is:** A "flow" is like a step-by-step script the AI follows with your users.

**Simple example:**
- Step 1: "Welcome! Let me help you connect your data"
- Step 2: "Great! Now let's invite your first team member"
- Step 3: "Perfect! You're ready to go!"

**You can create multiple flows for different purposes:**
- **Onboarding** — for brand new users (most common)
- **Adoption** — teach users about a feature they haven't tried yet
- **Upsell** — AI suggests upgrading when the user is getting real value
- **Retention** — re-engage users who went quiet
- **Support** — answer common questions automatically

**Who benefits:** SaaS founders who want users to actually *use* their product instead of churning.

**How it works behind the scenes:** When a user visits your app, Ahaget checks which flow they should see, starts a conversation, and guides them through each step. It remembers where they left off, so if they come back tomorrow, it picks up where it stopped.

---

#### 2. Triggers
**What it is:** The rules that decide *when* the AI pops up.

**Examples you can set:**
- "Show after the user has been idle for 30 seconds"
- "Only show on the /dashboard page"
- "Never show more than 3 times to the same user"

**Simple analogy:** Like a smart sales associate in a store — they only approach you when you're standing still looking confused, not every second you walk in.

**Who benefits:** You get helpful prompts at exactly the right moment, not annoying pop-ups that drive users away.

---

#### 3. Playbook
**What it is:** The personality and rules for your AI assistant.

**You control:**
- **Name** — What is your AI called? (e.g., "Aria", "Max", "AI Assistant")
- **Language** — English, Hindi, Hinglish, Tamil, Bengali, and 8 Indian languages
- **Tone** — Friendly (warm, encouraging) / Formal (professional) / Concise (brief, direct) / Custom
- **Must Always Do** — Rules like "Always ask if the user wants more help before ending"
- **Must Never Do** — Rules like "Never share pricing without asking about their role first"
- **Escalation** — If the AI can't help, where does it send the user? (email, Slack, human support)

**Simple analogy:** Think of it as writing the employee handbook for your AI staff member.

**Who benefits:** You get an AI that talks exactly like your brand, in the user's language, with your business rules built in.

---

#### 4. A/B Experiments
**What it is:** You can create two versions of an onboarding flow and test which one gets more users to complete it.

**Simple example:**
- Version A: 5-step onboarding (original)
- Version B: 3-step onboarding (shorter)
- Ahaget automatically sends 50% of users to each version
- After 2 weeks, you see Version B had 40% higher completion
- You switch everyone to Version B

**How it works behind the scenes:** Ahaget uses a hash of the user's ID to deterministically assign them to A or B — so the same user always gets the same version, and it's fair.

**Who benefits:** Any SaaS company that wants to scientifically improve their onboarding rather than guessing.

---

### ANALYTICS SECTION — What's Happening With Your Users

#### 5. Dashboard (Main Analytics)
**What it is:** Your home base. Shows you the key numbers at a glance.

**What you see:**
- How many users started onboarding this week
- How many completed it
- Average number of messages per conversation
- Active users in the last 30 days
- Completion rate

**Who benefits:** Founders and growth teams who want a daily health check of their product.

---

#### 6. Conversations
**What it is:** A log of every single conversation the AI had with your users.

**You can see:**
- What the user asked
- What the AI answered
- Which step they were on
- Whether it went well or not

**Simple analogy:** Like reading the chat transcript from a support session — except these are happening with every single user, 24/7, automatically.

**Who benefits:** You discover real problems your users face. Things you never knew were confusing.

---

#### 7. Sessions
**What it is:** A "session" is one user's complete journey through your onboarding flow.

**You can see:**
- User ID, which flow they're on
- Which step they're currently stuck on
- How long they've been on each step
- Whether they finished or dropped off

**Simple analogy:** Like seeing the progress bar for each customer in your product.

**Who benefits:** Customer success teams who want to proactively reach out to users who are stuck.

---

#### 8. Escalations
**What it is:** When the AI can't solve a user's problem, it creates an "escalation" — a ticket that tells your human team "this user needs help."

**What triggers an escalation:**
- The AI detects the user is frustrated or confused after many attempts
- The user explicitly asks to speak to a human
- The AI's playbook rule says "always escalate billing questions"

**What you see:** A full ticket with: user ID, which step they were stuck on, what they said, and the last 6 messages of the conversation — so your human support agent has full context instantly.

**Who benefits:** Support teams who want warm handoffs instead of users rage-quitting.

---

#### 9. Failures
**What it is:** Cases where the AI completely failed — gave a wrong answer, hit an error, or the widget broke.

**Why it matters:** You want to know when your AI is letting users down so you can fix your flow steps or knowledge base.

**Who benefits:** Product teams who want to maintain quality as they scale.

---

#### 10. Insights (AI-Generated)
**What it is:** Ahaget automatically reads ALL user messages and groups them into smart categories:

| Category | What it means | Example |
|----------|--------------|---------|
| Pain Points | Users are stuck, frustrated, hitting errors | "I can't connect my account, it keeps failing" |
| Knowledge Gaps | Users asking how to do basic things | "How do I invite my team?" |
| Navigation Confusion | Users can't find things | "Where is the billing page?" |
| Frequent Questions | Same question asked over and over | "What's the difference between X and Y?" |
| Low Engagement | Conversations are too short — users giving up | Average less than 3 messages per conversation |

**Why it's valuable:** Instead of reading 10,000 chat messages, Ahaget reads them for you and tells you: "Hey, 47 users this month couldn't figure out how to connect their database. You should fix that step."

**Who benefits:** Product managers and founders who want to make data-driven product decisions.

---

#### 11. Choke Points (Most Important Analytics Feature)
**What it is:** The most important analytics page. It tells you exactly *which step* in your onboarding flow is causing the most users to quit.

**How it works:** Ahaget measures every single step:
- How many users started it
- How many completed it
- How many gave up (drop rate)
- How many times they tried before giving up (avg attempts)
- How long they were stuck (in seconds)
- How many negative reactions they gave

It then gives each step a severity score from 0–100:
- **Critical (70+)** — Fix this NOW, you're losing most users here
- **High (50–69)** — Significant drop-off
- **Medium (30–49)** — Noticeable friction
- **Low (0–29)** — Normal

It also shows **trend** — is the problem getting worse, improving, or stable compared to last period?

**Simple analogy:** It's like Google Analytics' funnel reports — but for your onboarding conversation, with AI-level detail.

**Who benefits:** Any founder who wants to know "where exactly am I losing users?"

---

#### 12. Selector Drift
**What it is:** When the AI tries to click a button or fill a form in your app, sometimes your developers change the UI and the button moves or gets a new name. Selector Drift detects this.

If the same button-target fails 3+ times in 24 hours, Ahaget alerts you so you can fix the flow step.

**Even cooler (Self-Healing):** Ahaget tries to *self-heal* — it looks for the button by its text, aria-label, or nearby elements, and still completes the action even if the original target changed. It logs whether it had to heal, failed, or worked fine.

**Who benefits:** Any company where their product UI changes regularly — you don't want onboarding to break every time developers push a new design.

---

#### 13. Users Page
**What it is:** A list of every end user who has ever interacted with your Ahaget widget.

**You can see:**
- User ID and when they first appeared
- Which flows they've been through
- Their onboarding history
- Any metadata you passed (name, email, plan, role, segment)

**Who benefits:** Customer success teams who want a 360° view of each user's journey.

---

#### 14. Expansion MRR
**What it is:** Tracks how much extra revenue the AI is directly responsible for generating.

**How it works:** When the AI suggests an upgrade ("You've used 80% of your storage limit — want to upgrade?") and the user actually upgrades, Ahaget records that and tracks the MRR added.

**Metrics shown:**
- How many times an upsell was pitched
- How many converted
- Total attributed MRR added this month
- Conversion rate

**Simple analogy:** Like tracking commission for a salesperson — except the salesperson is the AI and it never sleeps.

**Who benefits:** Founders and revenue teams who want to prove that onboarding AI has a real ROI in dollars.

---

### INTEGRATIONS SECTION — Connecting Everything Together

#### 15. Interface Map
**What it is:** Ahaget automatically takes a snapshot of every page in your app and maps out all the buttons, links, forms, and inputs.

**Why:** So the AI knows your app. It can say "click the blue button that says 'Connect'" and actually find that button — even if your app updates.

**Simple analogy:** It's like giving the AI a map of your office before it starts working, so it knows where everything is.

**Who benefits:** Companies with complex apps where the AI needs to guide users through clicking things.

---

#### 16. Knowledge Base
**What it is:** Feed the AI everything it needs to know about your product.

**Three ways to add knowledge:**
1. **Add URL** — Paste your docs URL and Ahaget automatically crawls and indexes it. The AI searches this content when answering questions.
2. **Upload File** — Upload a PDF, Word doc, or text file (FAQ document, help guide)
3. **Write Article** — Write a knowledge article directly in the dashboard

**Page Scope:** You can say "this article only shows when the user is on the /billing page." So the AI gives the right context for where the user actually is.

**Who benefits:** Any company that has documentation, FAQs, or product guides they want the AI to use for answering user questions.

---

#### 17. MCP Connectors
**What it is:** You can plug Ahaget into your existing tools and databases, so the AI can pull live data and take real actions.

**Simple examples:**
- Connect to your billing system → AI knows the user's plan and can trigger upgrades
- Connect to your database → AI knows what features the user has set up
- Connect to Intercom → AI can create support tickets
- Connect to Salesforce → AI can update CRM when a user completes onboarding

**Who benefits:** Enterprise customers who want deep integration between Ahaget and their existing tech stack.

---

#### 18. Webhooks
**What it is:** Every time something important happens in Ahaget, it can send a notification to your server or Slack.

**Events that trigger webhooks:**
- A user finished a step
- A user finished the full onboarding flow
- A user hit their first "aha moment"
- A user needs a human (escalation)
- A user gave up and left (session abandoned)

**Simple example:** When a user completes onboarding, Ahaget sends a webhook, and your server automatically sends them a welcome gift card.

**Who benefits:** Technical teams who want Ahaget events to trigger actions in other systems.

---

#### 19. SSO (Single Sign-On)
**What it is:** Enterprise customers require employees to log in using their company Google/Microsoft/Okta account. SSO enables this.

**Who benefits:** Enterprise sales — companies with 50+ employees often won't buy software that doesn't support SSO. This is a sales unlocker.

---

### ACCOUNT SECTION — Managing Your Workspace

#### 20. Branding
**What it is:** Make the AI widget look like *your* product, not a third-party tool.

**What you can customize:**
- Widget color (6 quick presets or custom hex code)
- Header gradient (two-color gradient)
- Widget position (bottom-right or bottom-left corner)
- How long before the widget appears (default: 30 seconds of user inactivity)
- What name appears in the widget header

**Live preview:** Right on the branding page, you see exactly how the widget looks in real time as you change things.

**Who benefits:** Product companies that care about user experience and brand consistency.

---

#### 21. Settings
- **General** — Company name, AI instructions, copy your App ID snippet
- **Hosts** — Which domains are allowed to use your widget (security)
- **Members** — Invite teammates to your Ahaget dashboard
- **Advanced** — Advanced configuration options

---

#### 22. Billing
**Plans:**
| Plan | Price | Monthly Users | AI Agents | Messages |
|------|-------|--------------|-----------|---------|
| Free | Rs.0 | 100 | 3 | 1,000/mo |
| Starter | ~Rs.8,200/mo | 1,000 | 10 | 5,000/mo |
| Growth | ~Rs.25,000/mo | 10,000 | Unlimited | 25,000/mo |
| Scale | ~Rs.83,000/mo | Unlimited | Unlimited | Unlimited |

---

## Special Features That Make Ahaget Unique

### AI Memory
The AI remembers things the user told it in previous conversations. If a user said "I'm a developer" in step 2, the AI remembers that in step 5 and adjusts its suggestions accordingly.

### Multi-Language Support (Indian Languages)
The AI supports English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, and Malayalam. It automatically detects what language the user writes in and responds in that same language. **This is a huge differentiator for Indian SaaS companies.**

### Smart Intent Detection
When a user visits a page in your app, Ahaget automatically detects which onboarding step is most relevant to that page and jumps to it. So if a user goes directly to the billing page, the AI skips to the billing-related step instead of starting from step 1.

### Different Flows for Different Users
You can have different onboarding flows for different types of users:
- A "developer" gets one flow (more technical)
- A "manager" gets a different flow (less technical, more strategy)
- A "free plan" user gets a shorter flow
- An "enterprise" user gets a more detailed flow
All automatic — based on metadata you pass when the user logs in.

### Proactive Messaging
The AI can reach out to users who have gone quiet — like a follow-up: "Hey, you were setting up your integration 3 days ago. Need help finishing it?" This runs automatically every day.

---

## How to Explain Ahaget to Your First Customers

### To a SaaS Founder (30-second pitch):
> "Every SaaS company loses 60–80% of users during onboarding. Ahaget puts an AI inside your product that guides each user through setup, answers their questions, and never takes a day off. You paste one line of code, set up your steps, and the AI does the rest. You see everything in the dashboard — who completed onboarding, who got stuck, why they dropped off, and what to fix."

### To a Technical CTO/Developer:
> "It's a widget script tag plus a dashboard. You connect it via your app_id, pass user metadata — role, plan, segment — and the AI personalises the experience per user. Full webhook support, MCP connector SDK, REST API, A/B experiment framework, and detailed analytics on every step."

### To an Enterprise Buyer:
> "We support SSO via WorkOS, HMAC-signed webhooks, MCP connectors to your existing APIs, multi-language support including all major Indian regional languages, role-based team access, audit logs for every AI action, and white-label branding."

### To an Investor:
> "We're the onboarding layer for Indian SaaS. One script tag, AI-powered, no-code setup. We track the entire user lifecycle from sign-up to upsell, with measurable MRR attribution. The data moat builds over time — every conversation teaches the AI to be better for that specific product."

---

## The Real Benefit for the Customer — Before vs After

| Without Ahaget | With Ahaget |
|---------------|------------|
| 60% of users drop off during onboarding | AI guides every user to completion |
| You find out users are confused from support tickets weeks later | You see exactly which step causes drop-off, in real time |
| Human onboarding calls needed for complex features | AI handles it 24/7 automatically |
| Users churn because they never got value | Users hit their "aha moment" faster |
| No data on what users actually struggle with | Full analytics: questions asked, time stuck, drop rates |
| One-size-fits-all onboarding | Different flows for developers, managers, free vs paid users |
| English-only support | Hindi, Hinglish + 8 Indian languages |
| Upsells happen randomly | AI pitches upgrades at the right moment, tracks revenue |

---

## Summary — What Ahaget Actually Is

**Ahaget = An AI employee whose entire job is to make sure every user of your SaaS gets value, completes onboarding, and stays.**

You get 5 things:
1. **The Widget** — AI chat interface that appears inside your app automatically
2. **The Flows** — Step-by-step onboarding scripts the AI follows for each user
3. **The Analytics** — Exactly where users succeed and where they fail, with severity scores
4. **The Integrations** — Connect to your docs, APIs, CRMs, and tools
5. **The Intelligence** — Automatic insights, self-healing, multi-language, memory, proactive outreach

Your customer gets:
- Less time to value (they understand the product faster)
- More features discovered (AI shows them things they would have missed)
- Fewer support tickets (AI answers common questions instantly)
- Higher conversion to paid (upsells at the right moment)
- Higher retention (users who complete onboarding stay longer)

**The one-line marketing message: "Ahaget turns sign-ups into power users — automatically."**
