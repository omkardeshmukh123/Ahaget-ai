# Interview Prep — Ahaget: SaaS User Lifecycle Platform
> Fresher Interview at Cognizant | Prepared from actual codebase

---

## HOW TO USE THIS FILE
- Read the **English** answer first to understand the concept clearly.
- Read the **Hinglish** version to practice speaking naturally in a mixed-language interview.
- Questions marked with ⭐ are most likely to be asked.
- Questions marked with 🔥 are tricky cross-questions — prepare these especially.

---

## SECTION 1 — PROJECT INTRODUCTION

### ⭐ Q1. Tell me about your project.

**English:**
Ahaget is a multi-tenant B2B SaaS platform I built from scratch. It works as a 2-line embeddable AI widget that SaaS companies can add to their product. Once embedded, an AI agent guides end-users through onboarding steps, helps them use features, prevents churn, and even sends proactive messages when users go inactive. The backend is built with Express.js and TypeScript, the database is PostgreSQL managed through Prisma ORM, and the dashboard is Next.js. It also has Stripe billing and OpenAI-powered AI conversations.

**Hinglish:**
Ahaget ek multi-tenant B2B SaaS platform hai jo maine scratch se banaya. Yeh ek 2-line HTML snippet hai jo koi bhi SaaS company apne product mein add kar sakti hai. Jab end-user unke product use karta hai, toh ek AI agent automatically aa jaata hai — woh user ko onboard karta hai, features explain karta hai, aur agar user inactive ho toh proactive message bhi bhejta hai. Backend Express.js + TypeScript mein hai, database PostgreSQL + Prisma ORM hai, dashboard Next.js mein hai. Stripe se billing handle hoti hai aur OpenAI se AI conversations.

---

### ⭐ Q2. What problem does Ahaget solve?

**English:**
Traditional SaaS products lose users at the onboarding stage — users sign up, get confused, and leave without ever getting value. Ahaget solves this by embedding an AI agent directly into the product that actively guides users. Unlike tools like Appcues or Pendo which just show tooltips, Ahaget's AI agent can actually fill forms, click buttons, and navigate pages on behalf of the user.

**Hinglish:**
Traditional SaaS mein zyada users onboarding ke time hi chod dete hain — signup karte hain, confuse ho jaate hain, aur value liye bina hi chale jaate hain. Ahaget ek AI agent ko directly product ke andar embed karta hai. Appcues/Pendo jaise tools sirf tooltips dikhate hain, lekin Ahaget ka AI agent actually forms fill karta hai, buttons click karta hai, aur user ke behalf pe kaam karta hai.

---

## SECTION 2 — ARCHITECTURE & DESIGN

### ⭐ Q3. What is multi-tenancy? How did you implement it?

**English:**
Multi-tenancy means one application serves multiple customers (called tenants) from the same codebase and infrastructure, but each customer's data is completely isolated. In Ahaget, every paying customer is an `Organization`. Every database record — users, conversations, flows, events — has an `organizationId` field. All API queries always filter by `organizationId`, so Company A can never see Company B's data. Each organization also gets a unique `apiKey` for their widget.

**Hinglish:**
Multi-tenancy ka matlab hai — ek hi application multiple customers (tenants) ko serve karti hai same codebase se, lekin har customer ka data completely alag hota hai. Ahaget mein har paying customer ek `Organization` hai. Database ka har record — users, conversations, flows — mein `organizationId` field hai. Har API query mein `organizationId` se filter karte hain, toh Company A ka data Company B ko kabhi nahi dikhega. Aur har organization ko ek unique `apiKey` milti hai unke widget ke liye.

### 🔥 Cross Q: What if you forgot to add organizationId filter in a query?

**English:**
That would be a critical data leak bug — Company A would see Company B's data. To prevent this, all database queries use the authenticated `req.organization.id` (from API key) or `req.user.organizationId` (from JWT) that middleware injects. I never trust client-sent organizationId values directly.

**Hinglish:**
Yeh ek critical security bug hoga — ek company doosri ka data dekh sakti. Isliye sab queries mein middleware se aa raha `req.organization.id` ya `req.user.organizationId` use karta hun. Client se aaye organizationId pe kabhi trust nahi karta.

---

### ⭐ Q4. Explain your MVC architecture.

**English:**
MVC stands for Model-View-Controller.
- **Model** — Database schema defined in Prisma (`schema.prisma`). Tables like `Organization`, `User`, `OnboardingFlow` etc.
- **View** — The Next.js dashboard and the embeddable widget (TypeScript/Vite).
- **Controller** — Express.js route handlers in `src/controllers/`. Each controller file handles one domain — `auth.ts`, `billing.ts`, `flow.ts`, etc. Business logic is further split into `src/services/` (like `agent.ts`, `knowledge.ts`).

**Hinglish:**
MVC mein teen parts hain:
- **Model** — Prisma schema — jaise `Organization`, `User`, `OnboardingFlow` tables.
- **View** — Next.js dashboard aur embeddable widget.
- **Controller** — `src/controllers/` mein Express.js route handlers. Har controller ek domain handle karta hai — `auth.ts`, `billing.ts`, `flow.ts` etc. Complex logic ko `src/services/` mein alag rakha hai jaise `agent.ts`, `knowledge.ts`.

---

### ⭐ Q5. What is a monorepo? Why did you use it?

**English:**
A monorepo is a single Git repository that contains multiple related projects. My monorepo has 4 apps: `backend` (Express API), `dashboard` (Next.js), `widget` (embeddable TypeScript/Vite), and `landing` (marketing page). Benefits: shared TypeScript types across apps, one place to track all changes, easier to coordinate breaking changes between frontend and backend.

**Hinglish:**
Monorepo ek single Git repository hai jismein multiple projects hote hain. Mere paas 4 apps hain ek hi repo mein — `backend`, `dashboard`, `widget`, `landing`. Iske fayde: TypeScript types share ho sakti hain, sab changes ek jagah track hoti hain, aur jab backend mein kuch change hota hai toh frontend pe simultaneously update kar sakte hain bina alag repos manage kiye.

---

## SECTION 3 — REST API & EXPRESS.JS

### ⭐ Q6. What are RESTful APIs? How many did you build?

**English:**
REST (Representational State Transfer) APIs use HTTP methods to perform operations on resources:
- `GET` — Read data
- `POST` — Create data
- `PUT/PATCH` — Update data
- `DELETE` — Delete data

I built 24+ RESTful API endpoints grouped into domains: auth, conversations, events, analytics, billing, onboarding flows, sessions, knowledge base, escalations, triggers, proactive messaging, expansion/upsell, and more. Each route follows the pattern `/api/v1/<resource>`.

**Hinglish:**
REST APIs HTTP methods se kaam karti hain:
- `GET` — data padhna
- `POST` — data banana
- `PUT/PATCH` — data update karna
- `DELETE` — data delete karna

Maine 24+ endpoints banaye hain — auth, conversations, analytics, billing, onboarding, knowledge base, escalations, triggers, proactive messaging, upsell, etc. Sab routes `/api/v1/<resource>` pattern follow karte hain.

### 🔥 Cross Q: What is the difference between PUT and PATCH?

**English:**
`PUT` replaces the entire resource — you send the complete updated object. `PATCH` updates only the specific fields you send. For example, if a user has `name`, `email`, `role` — a `PATCH` with just `{name: "New"}` updates only name. A `PUT` would require all three fields.

**Hinglish:**
`PUT` poori resource replace karta hai — puri object bhejni padti hai. `PATCH` sirf specific fields update karta hai jo aapne bheje. Example: agar user mein `name`, `email`, `role` hain — `PATCH` mein sirf `{name: "New"}` bhejo toh sirf name update hoga. `PUT` mein teeno fields chaahiye honge.

---

### ⭐ Q7. How does Express.js middleware work? What middleware did you use?

**English:**
Middleware is a function that runs between the incoming request and the final route handler. It has access to `req`, `res`, and `next`. You call `next()` to pass control to the next middleware. I used:
- `helmet` — Sets security HTTP headers
- `cors` — Handles Cross-Origin requests
- `morgan` — Logs HTTP requests
- `express.json()` — Parses JSON request bodies
- `authenticateJWT` — Custom middleware that verifies JWT token before protected routes
- `authenticateApiKey` — Validates API key for widget endpoints
- `errorHandler` — Global error handler at the end of the chain

**Hinglish:**
Middleware ek function hai jo request aur final route handler ke beech mein run hota hai. `req`, `res`, `next` access karta hai. `next()` call karo toh agle middleware mein jaata hai. Maine use kiya:
- `helmet` — security HTTP headers
- `cors` — cross-origin requests handle karna
- `morgan` — HTTP request logging
- `express.json()` — request body parse karna
- `authenticateJWT` — custom middleware jo protected routes ke liye JWT verify karta hai
- `authenticateApiKey` — widget endpoints ke liye API key validate karta hai
- `errorHandler` — end mein global error handler

---

## SECTION 4 — AUTHENTICATION & SECURITY

### ⭐ Q8. How did you implement authentication? What is JWT?

**English:**
JWT (JSON Web Token) is a compact, self-contained token used for authentication. It has 3 parts separated by dots: Header (algorithm), Payload (user data), Signature (to verify it wasn't tampered). My flow:
1. User registers → password is hashed using `bcrypt` with salt rounds 12
2. On login → compare password with hash using `bcrypt.compare()`
3. If valid → sign a JWT containing `userId`, `organizationId`, `role`
4. On every protected API call → `authenticateJWT` middleware verifies the token
5. If valid → `req.user` is populated and route handler proceeds

**Hinglish:**
JWT (JSON Web Token) authentication ke liye ek compact token hai. Iske 3 parts hain dot se separate: Header (algorithm), Payload (user data), Signature (tamper-proof). Mera flow:
1. User register karta hai → password `bcrypt` se hash hota hai (salt rounds 12)
2. Login pe → `bcrypt.compare()` se password verify karte hain
3. Valid hone pe → `userId`, `organizationId`, `role` wala JWT sign karte hain
4. Har protected API call pe → `authenticateJWT` middleware token verify karta hai
5. Valid hai → `req.user` populate hota hai aur route proceed karta hai

### 🔥 Cross Q: Why bcrypt? Why not MD5 or SHA256?

**English:**
MD5 and SHA256 are fast hashing algorithms — that's bad for passwords because attackers can run millions of hashes per second (brute-force). Bcrypt is intentionally slow and has a configurable "cost factor" (salt rounds). Higher rounds = more time per hash = harder to brute-force. Salt is automatically added to prevent rainbow table attacks.

**Hinglish:**
MD5 aur SHA256 bahut fast hain — passwords ke liye yeh galat hai kyunki attacker per second millions of hashes try kar sakta hai. Bcrypt intentionally slow hai — "cost factor" (salt rounds) se aap control kar sakte ho kitna time lagega. Zyada rounds = zyada time = brute-force mushkil. Salt automatically add hota hai jo rainbow table attacks rokta hai.

### 🔥 Cross Q: What is the difference between Authentication and Authorization?

**English:**
- **Authentication** — "Who are you?" — verifying identity (login, JWT)
- **Authorization** — "What can you do?" — verifying permissions (role check, plan gate)

In Ahaget, JWT authentication proves who you are. Then `planGate` middleware checks if your organization's subscription plan allows access to a feature. That's authorization.

**Hinglish:**
- **Authentication** — "Tum kaun ho?" — identity verify karna (login, JWT)
- **Authorization** — "Tum kya kar sakte ho?" — permissions check karna (role check, plan gate)

Ahaget mein JWT authentication batata hai tum kaun ho. Phir `planGate` middleware check karta hai ki tumhare subscription plan mein yeh feature allowed hai ya nahi — yeh authorization hai.

---

### ⭐ Q9. How did you handle API security?

**English:**
Multiple layers:
1. `helmet` — Sets secure HTTP headers (CSP, X-Frame-Options, etc.)
2. Rate limiting — Login limited to 20 attempts per 15 minutes per IP
3. Input validation with `zod` — Every request body is validated against a strict schema before processing
4. JWT for dashboard, API Key for widget
5. CORS — Only allowed origins can make requests
6. `onDelete: Cascade` + `organizationId` filter — prevents data leaks between tenants

**Hinglish:**
Multiple layers:
1. `helmet` — secure HTTP headers (CSP, X-Frame-Options, etc.)
2. Rate limiting — Login ke liye 20 attempts per 15 min per IP
3. `zod` se input validation — har request body ko strict schema se validate karte hain
4. Dashboard ke liye JWT, widget ke liye API Key
5. CORS — sirf allowed origins se requests
6. `organizationId` filter — tenants ka data leak nahi hota

---

## SECTION 5 — POSTGRESQL & PRISMA ORM

### ⭐ Q10. What is Prisma ORM? Why use an ORM?

**English:**
Prisma is a type-safe ORM (Object Relational Mapper) for Node.js. It lets you interact with the database using TypeScript objects instead of raw SQL queries. Benefits:
1. Type safety — TypeScript knows the exact shape of every database record
2. Auto-generated client — `prisma generate` creates a client from `schema.prisma`
3. Migrations — `prisma migrate dev` creates and tracks schema changes
4. Readable queries — `prisma.user.findUnique({ where: { email } })` instead of `SELECT * FROM users WHERE email = ?`

**Hinglish:**
Prisma ek type-safe ORM (Object Relational Mapper) hai Node.js ke liye. Isse aap database ke saath TypeScript objects se baat karte ho, raw SQL ki jagah. Fayde:
1. Type safety — TypeScript ko pata hota hai har database record ka exact shape
2. Auto-generated client — `prisma generate` se client banta hai `schema.prisma` se
3. Migrations — `prisma migrate dev` se schema changes track hoti hain
4. Readable queries — `prisma.user.findUnique({ where: { email } })` — SQL likhne ki zaroorat nahi

### 🔥 Cross Q: What is a database transaction? Where did you use it?

**English:**
A transaction is a group of database operations that either ALL succeed or ALL fail together — it's atomic. I used `prisma.$transaction()` during user registration: creating the `Organization` and the `User` must both succeed. If user creation fails after the organization was created, the organization would be rolled back — no orphan data.

**Hinglish:**
Transaction ek group of database operations hai jो ya toh sab succeed hote hain ya sab fail — yeh atomic hai. Maine `prisma.$transaction()` use kiya user registration mein: `Organization` aur `User` dono ek saath banana tha. Agar `Organization` bana lekin `User` fail ho gaya, toh rollback ho jaata — koi orphan data nahi bachta.

---

### ⭐ Q11. How did you design the database schema? What relations did you create?

**English:**
Key models and relations:
- `Organization` → has many `User`, `EndUser`, `Conversation`, `OnboardingFlow` (one-to-many)
- `OnboardingFlow` → has many `OnboardingStep`, `UserOnboardingSession` (one-to-many)
- `UserOnboardingSession` → belongs to one `EndUser` and one `OnboardingFlow` (many-to-one)
- `Conversation` → has many `Message` (one-to-many)
- `FlowExperiment` → references two `OnboardingFlow` records as control and variant (self-referencing relation)

I used `@index` on foreign keys and frequently queried fields for performance, and `@@unique` for combinations like `[organizationId, externalId]` to prevent duplicate end-users.

**Hinglish:**
Key models aur relations:
- `Organization` → many `User`, `EndUser`, `Conversation`, `OnboardingFlow` (one-to-many)
- `OnboardingFlow` → many `OnboardingStep`, `UserOnboardingSession` (one-to-many)
- `Conversation` → many `Message` (one-to-many)
- `FlowExperiment` → ek flow control hai, doosra variant (self-referencing relation)

Performance ke liye foreign keys aur frequently queried fields pe `@index` lagaya. `@@unique` use kiya jaise `[organizationId, externalId]` toh duplicate end-users create na ho.

### 🔥 Cross Q: What is the difference between `@unique` and `@@unique`?

**English:**
`@unique` is on a single field — that field alone must be unique. `@@unique` is a composite unique constraint across multiple fields together. For example `@@unique([organizationId, externalId])` means the combination must be unique, not each field individually. So the same `externalId` can exist in two different organizations, but not twice in the same organization.

**Hinglish:**
`@unique` ek single field pe hota hai — woh field unique hona chahiye. `@@unique` multiple fields ka combination unique hona chahiye. Example: `@@unique([organizationId, externalId])` ka matlab hai yeh combination unique ho. Same `externalId` do alag organizations mein ho sakta hai, lekin ek hi organization mein twice nahi.

---

## SECTION 6 — STRIPE BILLING

### ⭐ Q12. How did you integrate Stripe? How do webhooks work?

**English:**
Stripe is used for subscription billing. Integration flow:
1. User clicks "Upgrade" → backend calls Stripe API to create a checkout session
2. User pays on Stripe-hosted page
3. Stripe sends a webhook event to `/api/v1/billing/webhook` — this is a POST request Stripe sends to my server
4. I verify the webhook signature using `stripe.webhooks.constructEvent()` to ensure it's from real Stripe
5. On `customer.subscription.updated` event → update the org's `planType`, `subscriptionStatus`, `currentPeriodEnd` in database

Important: The Stripe webhook handler must be registered BEFORE `express.json()` because it needs the raw request body for signature verification.

**Hinglish:**
Stripe subscription billing ke liye use kiya. Flow:
1. User "Upgrade" click karta hai → backend Stripe API call karta hai checkout session banane ke liye
2. User Stripe ke page pe pay karta hai
3. Stripe webhook event bhejta hai `/api/v1/billing/webhook` pe — yeh Stripe ka mera server pe POST request hai
4. `stripe.webhooks.constructEvent()` se signature verify karta hun — ensure karta hai yeh real Stripe se aaya
5. `customer.subscription.updated` event pe → org ka `planType`, `subscriptionStatus` database mein update karta hun

Important: Stripe webhook handler `express.json()` se PEHLE register karna padta hai kyunki raw request body chahiye signature verify karne ke liye.

### 🔥 Cross Q: Why verify the webhook signature?

**English:**
Anyone on the internet can POST to my `/billing/webhook` endpoint with a fake payload, claiming a user upgraded when they didn't. Stripe's signature verification uses a shared secret (`STRIPE_WEBHOOK_SECRET`) to cryptographically sign every webhook. If I verify the signature and it matches, I know the payload is genuinely from Stripe and hasn't been tampered with.

**Hinglish:**
Koi bhi internet pe mera `/billing/webhook` endpoint pe fake POST request bhej sakta hai — jaise ki keh de ki user ne pay kar diya jab actually nahi kiya. Stripe signature verification ek shared secret (`STRIPE_WEBHOOK_SECRET`) se har webhook ko cryptographically sign karta hai. Agar signature match kare, toh guarantee hai ki payload genuinely Stripe se aaya hai aur tamper nahi hua.

---

## SECTION 7 — AI / OPENAI INTEGRATION

### ⭐ Q13. How did you integrate OpenAI APIs? What is an AI agent?

**English:**
I used OpenAI's Chat Completion API to power an AI agent. An agent is an AI that can use "tools" — predefined functions it can call. My agent has 8 tools:
- `ask` — asks the user a clarifying question
- `fill` — fills a form field with a CSS selector
- `click` — clicks a button
- `navigate` — changes the page URL
- `highlight` — highlights an element on the page
- `complete` — marks current step as done
- `celebrate` — shows a success animation
- `escalate` — hands off to a human support agent

The agent decides which tool to call based on the conversation and the current step context. Results from tool calls are sent back to the AI for the next decision.

**Hinglish:**
Maine OpenAI Chat Completion API use kiya AI agent banane ke liye. Agent woh AI hai jiske paas "tools" hain — predefined functions jo woh call kar sakta hai. Mere agent ke 8 tools hain:
- `ask` — user se clarifying question
- `fill` — CSS selector se form field fill karna
- `click` — button click karna
- `navigate` — page URL change karna
- `highlight` — element highlight karna
- `complete` — step complete mark karna
- `celebrate` — success animation
- `escalate` — human support ko handoff

Agent conversation aur current step context dekh ke decide karta hai kaunsa tool call karna hai.

### 🔥 Cross Q: What is a CSS selector? How does the widget use it?

**English:**
A CSS selector is a pattern that identifies HTML elements on a page — like `#submit-btn` (by ID), `.form-input` (by class), `[data-testid="email"]` (by attribute). In Ahaget, when the AI calls the `fill` tool, it sends a selector like `#email-input`. The widget's JavaScript, running in the customer's browser, uses `document.querySelector(selector)` to find that element and fill it with the value.

**Hinglish:**
CSS selector ek pattern hai jo HTML elements identify karta hai — jaise `#submit-btn` (ID se), `.form-input` (class se), `[data-testid="email"]` (attribute se). Ahaget mein jab AI `fill` tool call karta hai, toh selector bhejta hai jaise `#email-input`. Widget ka JavaScript, jo customer ke browser mein run ho raha hai, `document.querySelector(selector)` se woh element find karta hai aur value fill karta hai.

---

### Q14. What is a Knowledge Base? How did you implement search?

**English:**
The Knowledge Base stores documentation articles that the AI searches when answering user questions. I implemented hybrid search:
1. **BM25** — keyword-based relevance scoring (standard text search)
2. **Vector/Semantic search** — each article has an embedding (a list of ~1536 numbers) generated by OpenAI's `text-embedding-3-small` model. When a user asks a question, we embed the question too and find articles with the closest vector distance (cosine similarity).

Hybrid means we combine both scores — BM25 catches exact keyword matches, vector catches meaning-based matches even if words differ.

**Hinglish:**
Knowledge Base mein documentation articles store hote hain jo AI user ke questions ke jawab dhundne ke liye search karta hai. Maine hybrid search implement kiya:
1. **BM25** — keyword-based relevance scoring (standard text search)
2. **Vector/Semantic search** — har article ka ek embedding hai (~1536 numbers ki list) jo OpenAI ke `text-embedding-3-small` se generate hota hai. Jab user kuch poochhe, toh uska bhi embedding banate hain aur closest articles dhundhte hain.

Hybrid matlab dono scores combine karte hain — BM25 exact keywords pakadta hai, vector meaning-based matches pakadta hai.

---

## SECTION 8 — NEXT.JS DASHBOARD

### ⭐ Q15. What is Next.js? How is it different from plain React?

**English:**
Next.js is a React framework with extra features:
1. **File-based routing** — create `pages/dashboard.tsx` and the route `/dashboard` is auto-created
2. **Server-Side Rendering (SSR)** — pages can be rendered on the server for better SEO and faster first load
3. **Static Generation (SSG)** — pages can be pre-rendered at build time
4. **API Routes** — you can write backend endpoints inside the Next.js app itself

Plain React is just a UI library — you have to manually set up routing (React Router), server rendering, etc. Next.js gives you all of this out of the box.

**Hinglish:**
Next.js ek React framework hai with extra features:
1. **File-based routing** — `pages/dashboard.tsx` create karo toh `/dashboard` route automatically ban jaata hai
2. **Server-Side Rendering** — pages server pe render ho sakti hain — better SEO aur faster first load
3. **Static Generation** — pages build time pe pre-render ho sakti hain
4. **API Routes** — Next.js app ke andar hi backend endpoints likh sakte ho

Plain React sirf UI library hai — routing (React Router), SSR manually setup karna padta hai. Next.js yeh sab out of the box deta hai.

---

### Q16. What analytics did you build in the dashboard?

**English:**
The analytics dashboard shows:
- Total conversations, active users, completion rates
- Step-level drop-off analysis (where users abandon the onboarding flow)
- A/B experiment results (which flow variant performs better)
- Churn score trends
- Proactive message open/click rates
- Upsell attribution — how much expansion MRR was generated by AI-initiated upsell flows

**Hinglish:**
Analytics dashboard mein show hota hai:
- Total conversations, active users, completion rates
- Step-level drop-off — kahan pe users onboarding chhod dete hain
- A/B experiment results — kaunsa flow variant better perform kiya
- Churn score trends
- Proactive message open/click rates
- Upsell attribution — AI-initiated upsell flows se kitna expansion MRR aaya

---

## SECTION 9 — TYPESCRIPT

### ⭐ Q17. Why TypeScript over JavaScript?

**English:**
TypeScript adds static type checking to JavaScript. Benefits:
1. **Catch errors at compile time** — if you pass a string where a number is expected, TypeScript throws an error before you even run the code
2. **Better IDE support** — autocomplete, inline documentation, refactoring tools
3. **Self-documenting code** — function signatures tell you what parameters are expected and what's returned
4. **Safer refactoring** — rename a field in one place and TypeScript tells you all the places that broke

In a project with 24+ API endpoints and 30+ database models, TypeScript prevented many runtime bugs.

**Hinglish:**
TypeScript JavaScript mein static type checking add karta hai. Fayde:
1. **Compile time pe errors** — string dene pe number expected hai toh TypeScript code run karne se pehle hi error deta hai
2. **Better IDE support** — autocomplete, documentation
3. **Self-documenting code** — function signature se pata chalta hai kya parameters chahiye aur kya return hoga
4. **Safe refactoring** — ek jagah field rename karo, TypeScript batata hai kahan kahan break hua

24+ API endpoints aur 30+ database models wale project mein TypeScript ne bahut runtime bugs prevent kiye.

---

## SECTION 10 — WEBSOCKET

### Q18. What is WebSocket? Why did you use it?

**English:**
WebSocket is a protocol that keeps a persistent, two-way connection between client and server. Unlike HTTP which is request-response (client asks, server answers, connection closes), WebSocket allows the server to push data to the client anytime without the client asking. I used WebSocket in Ahaget for real-time communication between the AI agent running on the backend and the widget running in the user's browser. When the AI decides to `fill` a form or `click` a button, that action is instantly sent to the widget via WebSocket.

**Hinglish:**
WebSocket ek protocol hai jo client aur server ke beech persistent two-way connection rakhta hai. HTTP mein client request karta hai, server respond karta hai, connection band ho jaata hai. WebSocket mein server kabhi bhi client ko data push kar sakta hai bina client ke request ke. Ahaget mein WebSocket use kiya backend pe AI agent aur browser mein widget ke beech real-time communication ke liye. Jab AI decide karta hai `fill` ya `click` karna, woh action turant WebSocket se widget ko bheja jaata hai.

---

## SECTION 11 — GENERAL CS CONCEPTS (Likely asked at Cognizant)

### ⭐ Q19. What is the difference between SQL and NoSQL?

**English:**
- **SQL** (PostgreSQL, MySQL) — structured data in tables with fixed schemas, uses relationships between tables, ACID compliant (Atomic, Consistent, Isolated, Durable). Best for complex queries and data integrity.
- **NoSQL** (MongoDB, Redis) — flexible schemas, stores documents/key-value/graphs, horizontally scalable. Best for unstructured data and high-volume reads.

I chose PostgreSQL because Ahaget's data is highly relational — organizations link to users link to sessions link to messages. Relational integrity (foreign keys, cascades) was critical.

**Hinglish:**
- **SQL** — tables mein structured data, fixed schema, relationships hoti hain, ACID compliant. Complex queries aur data integrity ke liye best.
- **NoSQL** — flexible schema, documents ya key-value store karta hai, horizontally scalable. Unstructured high-volume data ke liye best.

Maine PostgreSQL choose kiya kyunki Ahaget ka data highly relational hai — organizations → users → sessions → messages. Relational integrity (foreign keys, cascades) critical tha.

---

### ⭐ Q20. What is CORS? Why does it matter?

**English:**
CORS (Cross-Origin Resource Sharing) is a browser security mechanism. A browser blocks JavaScript on `site-a.com` from calling an API on `site-b.com` by default. The API server must explicitly say "I allow requests from site-a.com" by returning the `Access-Control-Allow-Origin` header. In Ahaget, the dashboard on `localhost:3000` needs to call the backend on `localhost:4000` — so I configured CORS to allow those origins. The widget is a special case — it can be embedded on any website, so the API key provides security instead of origin restriction.

**Hinglish:**
CORS ek browser security mechanism hai. Default mein browser `site-a.com` ke JavaScript ko `site-b.com` ki API call karne se rokta hai. API server ko explicitly kehna padta hai "main site-a.com se requests allow karta hun" `Access-Control-Allow-Origin` header return karke. Ahaget mein dashboard `localhost:3000` pe hai aur backend `localhost:4000` pe — toh CORS configure kiya un origins ke liye. Widget ek special case hai — woh kisi bhi website pe embed ho sakta hai, isliye API key se security milti hai origin restriction ki jagah.

---

### ⭐ Q21. What is rate limiting? Did you implement it?

**English:**
Rate limiting restricts how many requests a client can make in a given time window. It protects against brute-force attacks and API abuse. I implemented two types:
1. Login route — max 20 attempts per IP per 15 minutes (in-memory Map, production should use Redis)
2. General API rate limiting middleware using the `express-rate-limit` package

**Hinglish:**
Rate limiting restrict karta hai ki ek client kitne requests ek time window mein kar sakta hai. Brute-force attacks aur API abuse se protect karta hai. Maine do tarah ka implement kiya:
1. Login route — max 20 attempts per IP per 15 minutes (in-memory Map, production mein Redis)
2. General API rate limiting `express-rate-limit` package se

---

## SECTION 12 — BEHAVIORAL / HR QUESTIONS

### ⭐ Q22. What was the most challenging part of this project?

**English:**
The most challenging part was designing the multi-tenant data model. I had to ensure complete data isolation between organizations without making queries slow. Adding `@index` on `organizationId` on every table, designing proper cascade deletes, and ensuring every API route always filters by the authenticated organization took careful thought. Also, integrating WebSocket for real-time AI actions while maintaining session state was complex.

**Hinglish:**
Sabse challenging part tha multi-tenant data model design karna. Ensure karna tha ki organizations ka data completely isolated ho lekin queries slow na ho. Har table pe `organizationId` ka `@index`, proper cascade deletes, aur har API route mein authenticated organization se filter — yeh carefully sochna pada. Saath hi, real-time AI actions ke liye WebSocket integrate karna while session state maintain karna bhi complex tha.

---

### ⭐ Q23. What did you learn from building this project?

**English:**
I learned:
1. How to structure a production-grade Node.js backend — separation of concerns, controller vs service layer
2. Importance of database design — indexes, foreign keys, cascades make a huge difference in performance and reliability
3. Security is not optional — JWT, bcrypt, CORS, rate limiting, webhook signature verification — every layer matters
4. TypeScript catches bugs at compile time that would be painful to debug at runtime
5. How real SaaS billing works — Stripe webhooks, subscription lifecycles, plan gating

**Hinglish:**
Maine seekha:
1. Production-grade Node.js backend kaise structure karte hain — controller vs service layer separation
2. Database design kitni important hai — indexes, foreign keys, cascades performance aur reliability mein bada fark karte hain
3. Security optional nahi hai — JWT, bcrypt, CORS, rate limiting, webhook signature — har layer matter karta hai
4. TypeScript compile time pe woh bugs pakadta hai jo runtime pe debug karna painful hota
5. Real SaaS billing kaise kaam karti hai — Stripe webhooks, subscription lifecycle, plan gating

---

### Q24. Why did you choose this tech stack?

**English:**
- **Express.js** — minimal, flexible, widely used in industry, great for REST APIs
- **TypeScript** — type safety is essential for a large multi-domain codebase
- **PostgreSQL** — relational data model with ACID guarantees; best fit for multi-tenant SaaS with complex relationships
- **Prisma** — type-safe ORM, excellent Developer Experience, auto-migration tooling
- **Next.js** — React with SSR built-in, file-based routing, production-ready
- **Stripe** — industry standard for SaaS billing, excellent API and webhooks
- **OpenAI** — best-in-class LLM APIs for building AI agents

**Hinglish:**
- **Express.js** — minimal, flexible, industry mein widely used, REST APIs ke liye great
- **TypeScript** — large multi-domain codebase ke liye type safety essential hai
- **PostgreSQL** — relational data model, ACID guarantees, multi-tenant SaaS ke liye best fit
- **Prisma** — type-safe ORM, excellent Developer Experience, auto-migration
- **Next.js** — SSR built-in, file-based routing, production-ready
- **Stripe** — SaaS billing ka industry standard
- **OpenAI** — AI agents banane ke liye best LLM APIs

---

## SECTION 13 — QUICK FIRE DEFINITIONS (Cognizant rounds)

| Term | Brief Answer |
|------|-------------|
| **REST** | Architectural style for APIs using HTTP methods (GET/POST/PUT/DELETE) |
| **JWT** | JSON Web Token — signed token for stateless authentication |
| **ORM** | Object Relational Mapper — write DB queries in code language, not SQL |
| **Middleware** | Function that runs between request and route handler in Express |
| **CORS** | Browser security — server must allow cross-origin requests explicitly |
| **WebSocket** | Persistent bidirectional connection for real-time communication |
| **bcrypt** | Slow, salted password hashing algorithm — resistant to brute force |
| **Webhook** | Server-to-server HTTP callback when an event occurs (e.g., Stripe payment) |
| **Multi-tenancy** | One app serving multiple customers with isolated data |
| **Prisma** | Type-safe Node.js ORM for PostgreSQL/MySQL/SQLite |
| **TypeScript** | Typed superset of JavaScript — catches errors at compile time |
| **Monorepo** | Multiple projects in one Git repository |
| **MVC** | Model-View-Controller design pattern for code separation |
| **Rate limiting** | Restricting number of API requests per client per time window |
| **A/B Testing** | Comparing two variants to see which performs better |
| **Embedding** | Numerical vector representation of text for semantic search |
| **ACID** | Atomic, Consistent, Isolated, Durable — database transaction properties |
| **Index** | Database optimization structure for faster query lookup |
| **Cascade delete** | When parent record is deleted, all child records are also deleted |

---

## SECTION 14 — THINGS TO SAY CONFIDENTLY

1. "Maine yeh project production ke liye build kiya hai — v1.0.0 tag kiya hai GitHub pe."
2. "Mera GitHub repo public hai — omkardeshmukh123/Ahaget-ai"
3. "I followed MVC architecture — controllers are thin, business logic is in services."
4. "Security was a first-class concern — bcrypt, JWT, rate limiting, webhook signature verification."
5. "Database design was done with scalability in mind — proper indexes on all foreign keys."
6. "I used TypeScript throughout — it caught many bugs at compile time."
7. "The widget is fully embeddable — just 2 lines of HTML, served via jsDelivr CDN."

---

## SECTION 15 — QUESTIONS TO ASK THE INTERVIEWER

At the end of the interview, ask:
1. "What tech stack does your team use for backend services?"
2. "What does a typical onboarding journey look like for a fresher joining your team?"
3. "Are there opportunities to work on AI/ML integrations in the projects here?"

---

*Good luck! Preparation + confidence = success. You built something real — own it.*
