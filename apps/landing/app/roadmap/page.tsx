'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

type Status = 'shipped' | 'in-progress' | 'planned' | 'future';

const statusConfig: Record<Status, { label: string; color: string; dot: string; bg: string }> = {
  shipped: { label: 'Shipped', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'in-progress': { label: 'In progress', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  planned: { label: 'Planned', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  future: { label: 'Future', color: 'text-white/40', dot: 'bg-white/20', bg: 'bg-white/5 border-white/10' },
};

const quarters = [
  {
    period: 'Q2 2026',
    subtitle: 'Foundation — shipped',
    items: [
      { title: 'Embeddable AI widget', desc: 'Drop 2 lines of HTML. AI takes care of the rest.', status: 'shipped' as Status, category: 'Core' },
      { title: 'Visual flow builder', desc: 'No-code drag-and-drop editor for onboarding flows.', status: 'shipped' as Status, category: 'Product' },
      { title: 'Churn risk scoring v1', desc: 'ML model identifying users at risk of churning.', status: 'shipped' as Status, category: 'AI' },
      { title: 'AI support chat', desc: 'Answers questions from your knowledge base.', status: 'shipped' as Status, category: 'AI' },
      { title: 'Multi-language (40+)', desc: 'Including Hindi and Hinglish natively.', status: 'shipped' as Status, category: 'Core' },
      { title: 'A/B testing for flows', desc: 'Experiment on onboarding variants statistically.', status: 'shipped' as Status, category: 'Growth' },
      { title: 'Referral program engine', desc: 'Built-in refer-a-friend flows with reward tracking.', status: 'shipped' as Status, category: 'Growth' },
    ],
  },
  {
    period: 'Q3 2026',
    subtitle: 'Intelligence — in progress',
    items: [
      { title: 'Churn scoring v2', desc: 'Session depth + NLP signals for 40%+ accuracy lift.', status: 'in-progress' as Status, category: 'AI' },
      { title: 'Proactive email sequences', desc: 'AI-drafted lifecycle emails triggered by behavior.', status: 'in-progress' as Status, category: 'Engagement' },
      { title: 'Segment builder', desc: 'Slice users by plan, activity, geography, and custom events.', status: 'in-progress' as Status, category: 'Analytics' },
      { title: 'Slack & Teams integration', desc: 'Get churn alerts and weekly digests in your team chat.', status: 'planned' as Status, category: 'Integrations' },
      { title: 'HubSpot / Salesforce sync', desc: 'Bi-directional CRM sync for sales team visibility.', status: 'planned' as Status, category: 'Integrations' },
      { title: 'Custom AI persona', desc: 'Name, tone, and style — branded AI agent, not generic bot.', status: 'planned' as Status, category: 'Product' },
      { title: 'Mobile SDK (iOS & Android)', desc: 'Native SDKs for mobile-first SaaS products.', status: 'planned' as Status, category: 'SDK' },
    ],
  },
  {
    period: 'Q4 2026',
    subtitle: 'Scale — coming soon',
    items: [
      { title: 'Predictive LTV scoring', desc: 'Which users are likely to upgrade? AI tells you.', status: 'planned' as Status, category: 'AI' },
      { title: 'White-label widget', desc: 'Fully remove Ahaget branding, use your domain.', status: 'planned' as Status, category: 'Enterprise' },
      { title: 'SOC 2 Type II certification', desc: 'Enterprise security compliance.', status: 'planned' as Status, category: 'Security' },
      { title: 'SSO / SAML', desc: 'Single sign-on for enterprise teams.', status: 'planned' as Status, category: 'Enterprise' },
      { title: 'Multi-product workspaces', desc: 'Manage multiple SaaS products from one Ahaget account.', status: 'planned' as Status, category: 'Product' },
      { title: 'AI conversation memory', desc: 'Widget remembers user history across sessions.', status: 'future' as Status, category: 'AI' },
    ],
  },
  {
    period: '2027',
    subtitle: 'The future',
    items: [
      { title: 'Autonomous growth agents', desc: 'AI that independently runs experiments, optimizes flows, and reports results.', status: 'future' as Status, category: 'AI' },
      { title: 'Voice widget', desc: 'Talk to your users\' AI assistant — not just chat.', status: 'future' as Status, category: 'Product' },
      { title: 'Marketplace', desc: 'Pre-built flows and templates from the community.', status: 'future' as Status, category: 'Product' },
      { title: 'API monetization layer', desc: 'Charge for premium AI features within your own product.', status: 'future' as Status, category: 'Growth' },
    ],
  },
];

const categoryColors: Record<string, string> = {
  Core: 'bg-[#8A2BE2]/15 text-[#B06CF5]',
  AI: 'bg-purple-500/15 text-purple-400',
  Product: 'bg-blue-500/15 text-blue-400',
  Growth: 'bg-pink-500/15 text-pink-400',
  Engagement: 'bg-orange-500/15 text-orange-400',
  Analytics: 'bg-cyan-500/15 text-cyan-400',
  Integrations: 'bg-teal-500/15 text-teal-400',
  SDK: 'bg-indigo-500/15 text-indigo-400',
  Enterprise: 'bg-yellow-500/15 text-yellow-400',
  Security: 'bg-red-500/15 text-red-400',
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">🗺️ Product Roadmap</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Where we&apos;re headed
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-6">
            A transparent look at what we&apos;ve shipped, what we&apos;re building right now, and what&apos;s coming. Updated every sprint.
          </p>

          {/* Status legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {(Object.entries(statusConfig) as [Status, typeof statusConfig[Status]][]).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-2 glass rounded-full px-3 py-1 border ${cfg.bg}`}>
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap grid */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {quarters.map((quarter) => (
            <div key={quarter.period}>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white">{quarter.period}</h2>
                <p className="text-white/40 text-sm mt-1">{quarter.subtitle}</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quarter.items.map((item) => {
                  const status = statusConfig[item.status];
                  return (
                    <div
                      key={item.title}
                      className={`glass rounded-2xl p-5 border transition-colors ${
                        item.status === 'in-progress'
                          ? 'border-yellow-500/20 bg-yellow-500/5'
                          : item.status === 'shipped'
                          ? 'border-emerald-500/10'
                          : 'border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${status.bg}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span className={status.color}>{status.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || 'bg-white/10 text-white/40'}`}>
                          {item.category}
                        </span>
                      </div>
                      <h3 className={`font-bold mb-1.5 text-sm ${item.status === 'future' ? 'text-white/50' : 'text-white'}`}>
                        {item.title}
                      </h3>
                      <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Request feature CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-10 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-white font-black text-2xl mb-3">Have a feature request?</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              We build based on what our customers actually need. Tell us what would make Ahaget 10x more valuable for you.
            </p>
            <a
              href="mailto:hello@ahaget.ai?subject=Feature Request"
              className="inline-flex items-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02]"
            >
              Request a feature →
            </a>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
