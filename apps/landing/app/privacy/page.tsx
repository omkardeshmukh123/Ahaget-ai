'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const sections = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Ahaget, Inc. ("Ahaget", "we", "our", or "us") operates the website at ahaget.ai and the Ahaget AI widget platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and protect information about you when you use our Service.

By accessing or using the Service, you agree to this Privacy Policy. If you do not agree, please do not use the Service.

Last updated: June 2026.`,
  },
  {
    id: 'data-collected',
    title: '2. Information we collect',
    content: `We collect information in the following ways:

**Information you provide directly:**
• Account registration information (name, email, company name, password)
• Payment information (processed by Stripe — we do not store card numbers)
• Support messages and correspondence

**Information collected automatically:**
• Usage data about how you interact with the Ahaget dashboard
• Technical data: IP address, browser type, device type, operating system
• Cookie and session data (see Section 8 for cookie details)

**End-user data (collected on behalf of our customers):**
• User IDs, email addresses, and display names passed via widget attributes
• Behavioral events tracked through the JavaScript API (e.g., "feature_used")
• Session activity and engagement metrics
• Custom properties passed via the identify() method

Ahaget acts as a **data processor** for end-user data — we process it on behalf of our customers (data controllers). Our customers are responsible for obtaining consent from their own end-users to share this data with Ahaget.`,
  },
  {
    id: 'how-we-use',
    title: '3. How we use your information',
    content: `We use collected information to:

• Provide, operate, and maintain the Service
• Process payments and manage subscriptions
• Send transactional emails (account activation, password reset, invoices)
• Generate AI-powered churn risk scores and lifecycle insights for our customers
• Improve the accuracy of our ML models (using aggregated, anonymized data only)
• Send product updates and changelog notifications (opt-out available)
• Respond to support requests
• Detect fraud and ensure platform security
• Comply with legal obligations

We do **not** sell your data or your end-users' data to any third party. We do not use end-user data to train models for other customers.`,
  },
  {
    id: 'data-sharing',
    title: '4. Data sharing & third parties',
    content: `We share data only with the following categories of service providers, under strict data processing agreements:

| Provider | Purpose |
|---|---|
| Stripe | Payment processing |
| Railway / Render | Infrastructure hosting |
| Resend | Transactional email delivery |
| OpenRouter | AI model inference (anonymized prompts only) |
| Cloudflare | CDN and DDoS protection |
| Redis Cloud | Session and cache storage |

We do not share data with advertising networks, data brokers, or analytics resellers.

In the event of a merger, acquisition, or asset sale, we will provide notice before data is transferred.`,
  },
  {
    id: 'data-retention',
    title: '5. Data retention',
    content: `We retain data for the following periods:

• **Account data:** Duration of the subscription, plus 90 days after cancellation
• **End-user event data:** 24 months from collection, or until the customer deletes it
• **Payment records:** 7 years (required by Indian tax law)
• **Server logs:** 30 days rolling

You may request deletion of your account data at any time by emailing privacy@ahaget.ai. We will process deletion requests within 30 days.`,
  },
  {
    id: 'security',
    title: '6. Security',
    content: `We implement industry-standard security measures including:

• TLS 1.3 encryption for all data in transit
• AES-256 encryption for data at rest
• Regular security audits and penetration testing
• Role-based access controls within our team
• SOC 2 Type II certification (in progress, expected Q4 2026)

Despite these measures, no system is 100% secure. Please report security vulnerabilities to security@ahaget.ai.`,
  },
  {
    id: 'gdpr',
    title: '7. GDPR & data subject rights',
    content: `If you are located in the European Economic Area (EEA) or United Kingdom, you have rights under the General Data Protection Regulation (GDPR) including:

• **Right to access:** Request a copy of data we hold about you
• **Right to rectification:** Correct inaccurate personal data
• **Right to erasure:** Request deletion of your personal data ("right to be forgotten")
• **Right to restriction:** Request that we limit how we process your data
• **Right to data portability:** Receive your data in a machine-readable format
• **Right to object:** Object to processing based on legitimate interests
• **Right to withdraw consent:** Where processing is based on consent, withdraw it at any time

To exercise any of these rights, email privacy@ahaget.ai. We respond within 30 days.

**Legal basis for processing:** We process data under the following legal bases:
• Contract performance (providing the Service)
• Legitimate interests (fraud prevention, security, product improvement)
• Legal obligation (tax and regulatory compliance)
• Consent (marketing communications)

**Data transfers:** If we transfer data outside the EEA, we use Standard Contractual Clauses approved by the European Commission.`,
  },
  {
    id: 'cookies',
    title: '8. Cookies & tracking',
    content: `We use cookies and similar technologies for the following purposes:

**Essential cookies (cannot be disabled):**
• Session authentication token
• CSRF protection token
• Cookie consent preference

**Analytics cookies (opt-out available):**
• Dashboard usage analytics (first-party, no third-party analytics)

**The Ahaget widget (embedded in customer products):**
• Sets a first-party cookie on the customer's domain to maintain session state
• Does not set third-party cookies from the ahaget.ai domain on other websites
• No cross-site tracking

To manage cookie preferences, use the consent banner shown on your first visit. To opt out of all non-essential cookies, email privacy@ahaget.ai.`,
  },
  {
    id: 'children',
    title: '9. Children\'s privacy',
    content: `The Service is not directed to children under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact privacy@ahaget.ai and we will delete it promptly.`,
  },
  {
    id: 'changes',
    title: '10. Changes to this policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on our website at least 30 days before changes take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '11. Contact us',
    content: `For privacy-related questions, requests, or concerns:

**Email:** privacy@ahaget.ai
**General:** hello@ahaget.ai

Ahaget, Inc.
India`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">🔒 Privacy Policy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Last updated: June 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Table of contents */}
            <aside className="lg:w-56 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Contents</h3>
                <nav className="space-y-1.5">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-white/40 hover:text-white text-sm transition-colors leading-snug py-0.5"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Body */}
            <div className="flex-1 min-w-0 space-y-10">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/[0.06]">{section.title}</h2>
                  <div className="text-white/55 text-sm leading-relaxed whitespace-pre-line">
                    {section.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-white/80 mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('• ')) {
                        return <p key={i} className="pl-4 before:content-['•'] before:mr-2 before:text-[#8A2BE2]">{line.slice(2)}</p>;
                      }
                      if (line.includes('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={i} className={line.trim() === '' ? 'mt-2' : ''}>
                            {parts.map((part, j) =>
                              j % 2 === 1 ? <strong key={j} className="text-white/80 font-semibold">{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      if (line.includes('|') && line.includes('---')) return null;
                      if (line.startsWith('|') && line.includes('|')) {
                        const cells = line.split('|').filter(Boolean).map(s => s.trim());
                        const isHeader = section.content.split('\n').indexOf(line) < section.content.split('\n').findIndex(l => l.includes('---')) ;
                        return (
                          <div key={i} className={`flex gap-4 py-1.5 text-xs ${isHeader ? 'text-white/60 font-semibold border-b border-white/10 mb-1' : ''}`}>
                            {cells.map((cell, ci) => <span key={ci} className={ci === 0 ? 'w-32 flex-shrink-0 text-[#B06CF5]' : 'text-white/50'}>{cell}</span>)}
                          </div>
                        );
                      }
                      return line.trim() ? <p key={i} className="mb-1">{line}</p> : <div key={i} className="h-3" />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
