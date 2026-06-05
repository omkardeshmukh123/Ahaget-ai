'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const sections = [
  {
    id: 'agreement',
    title: '1. Agreement to terms',
    content: `These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer", "you", or "your") and Ahaget, Inc. ("Ahaget", "we", "our", or "us") governing your use of the Ahaget platform, widget, API, and related services (collectively, the "Service").

By creating an account, embedding the widget, or using any part of the Service, you agree to these Terms. If you are using the Service on behalf of a company, you represent that you have the authority to bind that company to these Terms.

Last updated: June 2026.`,
  },
  {
    id: 'service',
    title: '2. The service',
    content: `Ahaget provides an AI-powered user lifecycle management platform including:

• An embeddable JavaScript widget for SaaS products
• A dashboard for building onboarding flows, campaigns, and knowledge bases
• AI-powered churn risk scoring and proactive messaging
• Analytics and reporting tools
• A REST API and webhook system

**Free tier:** We offer a free plan (up to 250 MAU) with no time limit. We reserve the right to modify free tier limits with 30 days' notice.

**Paid plans:** Starter, Growth, and Scale plans are billed monthly or annually. Billing begins when you upgrade and recurs until cancellation.`,
  },
  {
    id: 'accounts',
    title: '3. Accounts & eligibility',
    content: `To use the Service you must:

• Be at least 18 years old (or the age of majority in your jurisdiction)
• Provide accurate account information
• Maintain the security of your account credentials

You are responsible for all activity that occurs under your account. Notify us immediately at security@ahaget.ai if you suspect unauthorized access.

One account per person. You may not share login credentials across multiple individuals.`,
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable use',
    content: `You agree not to use the Service to:

• Violate any applicable law or regulation
• Collect data from users without proper disclosure and consent
• Send unsolicited or deceptive communications to end-users
• Reverse-engineer, decompile, or extract the widget source code
• Resell or white-label the Service without a written reseller agreement
• Attempt to circumvent rate limits, quotas, or security measures
• Use the Service in products targeting children under 16
• Engage in spam, phishing, or any fraudulent activity
• Process data in violation of GDPR, CCPA, or other applicable privacy laws

We reserve the right to suspend accounts that violate these restrictions without prior notice.`,
  },
  {
    id: 'data',
    title: '5. Data & privacy',
    content: `**Your data:** You retain ownership of all data you bring to or generate using the Service ("Customer Data"). We process Customer Data only to provide the Service as described in our Privacy Policy.

**End-user data:** You are responsible for obtaining appropriate consent from your end-users to collect and process their data through the Ahaget widget. You must maintain a compliant privacy policy on your product.

**Data processing agreement (DPA):** For customers subject to GDPR, we act as a data processor. A DPA is available upon request at privacy@ahaget.ai.

**Data deletion:** You may export or delete your data at any time from the dashboard. Upon account termination, we delete your data within 90 days unless legally required to retain it.`,
  },
  {
    id: 'payment',
    title: '6. Payment & billing',
    content: `**Billing cycle:** Paid plans are billed monthly or annually in advance. All prices are exclusive of applicable taxes.

**Currency:** Plans are available in USD (global) and INR (India). Prices are as displayed on our Pricing page.

**Payment processing:** Payments are processed by Stripe. By providing payment information, you authorize us to charge your payment method on a recurring basis.

**Failed payments:** If a payment fails, we will retry up to three times over 7 days, after which your account will be downgraded to the free tier (or suspended if below free tier usage).

**Refunds:** We do not offer refunds for partial billing periods. Annual plans may receive a prorated refund within 30 days of purchase if requested.

**Upgrades / downgrades:** Upgrades take effect immediately and are prorated. Downgrades take effect at the next billing cycle.`,
  },
  {
    id: 'cancellation',
    title: '7. Cancellation & termination',
    content: `**By you:** You may cancel your account at any time from the dashboard Settings page. Cancellation takes effect at the end of your current billing period. You retain access to paid features until then.

**By us:** We may suspend or terminate accounts that: (a) violate these Terms, (b) fail to pay after the grace period, (c) are involved in fraudulent activity, or (d) are inactive for more than 12 months (free tier only, with 30 days' notice).

**Effect of termination:** Upon termination, your right to use the Service ceases. We will provide data export access for 30 days after termination.`,
  },
  {
    id: 'ip',
    title: '8. Intellectual property',
    content: `**Ahaget IP:** The Service, including all software, AI models, designs, and documentation, is owned by Ahaget, Inc. and protected by intellectual property laws. These Terms do not transfer any ownership rights to you.

**Your IP:** You retain all rights to your Customer Data and any content you create using the Service.

**License to Ahaget:** By using the Service, you grant us a limited, non-exclusive license to process your Customer Data solely to provide the Service. We do not use your Customer Data to train AI models for other customers.

**Feedback:** Any feedback or suggestions you provide may be used by us to improve the Service without compensation or attribution.`,
  },
  {
    id: 'disclaimers',
    title: '9. Disclaimers & warranties',
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

We do not warrant that:
• The Service will be uninterrupted, error-free, or secure at all times
• AI predictions (including churn scores) will be accurate for every use case
• Results obtained through the Service will meet your specific business goals

We target 99.9% uptime for paid plans, measured monthly. Downtime credits are available per our SLA policy.`,
  },
  {
    id: 'liability',
    title: '10. Limitation of liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, AHAGET SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) $100 USD.

Some jurisdictions do not allow limitation of liability for certain damages. In those jurisdictions, our liability is limited to the maximum extent permitted by law.`,
  },
  {
    id: 'governing-law',
    title: '11. Governing law & disputes',
    content: `These Terms are governed by the laws of India, without regard to conflict of law principles.

Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration conducted in accordance with the Arbitration and Conciliation Act, 1996 of India. The seat of arbitration shall be Mumbai, India.

Notwithstanding the above, either party may seek injunctive relief in a court of competent jurisdiction for intellectual property infringement or breach of confidentiality obligations.`,
  },
  {
    id: 'changes',
    title: '12. Changes to terms',
    content: `We may update these Terms from time to time. We will notify you of material changes via email or dashboard notification at least 30 days before changes take effect.

Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms. If you disagree with the changes, you may cancel your account before they take effect.`,
  },
  {
    id: 'contact-legal',
    title: '13. Contact',
    content: `For legal inquiries:

**Email:** legal@ahaget.ai
**General:** hello@ahaget.ai

Ahaget, Inc.
India`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">📄 Terms of Service</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: June 2026 · Effective: June 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* ToC */}
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
                  <div className="text-white/55 text-sm leading-relaxed">
                    {section.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-white/80 mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('• ')) {
                        return <p key={i} className="pl-4 before:content-['•'] before:mr-2 before:text-[#8A2BE2] mb-1">{line.slice(2)}</p>;
                      }
                      if (line.includes('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={i} className="mb-1">
                            {parts.map((part, j) =>
                              j % 2 === 1 ? <strong key={j} className="text-white/80 font-semibold">{part}</strong> : part
                            )}
                          </p>
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
