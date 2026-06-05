'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const releases = [
  {
    version: 'v1.1.0',
    date: 'June 2026',
    tag: 'Latest',
    tagColor: 'bg-emerald-500/15 text-emerald-400',
    title: 'A/B testing, auto-optimize & referral program',
    description: 'Major feature release adding experimentation capabilities and growth loops.',
    changes: [
      { type: 'new', text: 'A/B testing for onboarding flows — split your audience and measure what converts better' },
      { type: 'new', text: 'Auto-optimize: AI automatically promotes winning flow variants after statistical significance' },
      { type: 'new', text: 'Referral program engine — built-in refer-a-friend flows with reward tracking' },
      { type: 'new', text: 'Churn scoring model v2 — 34% more accurate, now includes session depth signals' },
      { type: 'improved', text: 'Widget load time reduced from 180ms to 62ms (async preload)' },
      { type: 'improved', text: 'Dashboard analytics redesigned with cohort comparison view' },
      { type: 'improved', text: 'Knowledge base now supports PDF and Notion page imports' },
      { type: 'fixed', text: 'Fixed edge case where identify() was called before widget mount on SPAs' },
      { type: 'fixed', text: 'Fixed INR pricing display on mobile Pricing section' },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'May 2026',
    tag: 'Launch',
    tagColor: 'bg-[#8A2BE2]/20 text-[#B06CF5]',
    title: 'Ahaget is live 🎉',
    description: 'Initial public launch of the Ahaget AI widget and dashboard.',
    changes: [
      { type: 'new', text: 'Embeddable AI widget — drop 2 lines of HTML to get started' },
      { type: 'new', text: 'Visual flow builder — create onboarding, re-engagement, and churn prevention flows with no code' },
      { type: 'new', text: 'AI-powered support chat — answers questions from your knowledge base automatically' },
      { type: 'new', text: 'Churn risk scoring — real-time ML model flagging at-risk users' },
      { type: 'new', text: 'Proactive AI messaging — send contextual nudges based on user behavior' },
      { type: 'new', text: 'Multi-language support — English, Hindi, Hinglish + 37 more locales' },
      { type: 'new', text: 'Analytics dashboard — MAU, engagement, churn metrics, flow completion rates' },
      { type: 'new', text: 'JavaScript API (window.ahaget) for deeper integration' },
      { type: 'new', text: 'Webhook events for churn detection, flow completion, plan upgrades' },
      { type: 'new', text: 'Free tier — up to 250 MAU, forever free' },
    ],
  },
];

const typeStyles: Record<string, { dot: string; label: string; labelColor: string }> = {
  new: { dot: 'bg-[#8A2BE2]', label: 'New', labelColor: 'text-[#B06CF5]' },
  improved: { dot: 'bg-emerald-500', label: 'Improved', labelColor: 'text-emerald-400' },
  fixed: { dot: 'bg-yellow-500', label: 'Fixed', labelColor: 'text-yellow-400' },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">📋 Changelog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            What&apos;s new in Ahaget
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Every update, improvement, and fix — documented. We ship every week.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {releases.map((release, i) => (
              <div key={release.version} className="relative">
                {/* Timeline connector */}
                {i < releases.length - 1 && (
                  <div className="absolute left-6 top-14 bottom-[-3rem] w-px bg-gradient-to-b from-[#8A2BE2]/40 to-transparent" />
                )}

                {/* Version badge */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A2BE2] to-[#7B22C9] flex items-center justify-center shadow-glow text-white font-bold text-xs z-10 relative">
                    {release.version.split('.')[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-xl font-black text-white">{release.version}</h2>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${release.tagColor}`}>{release.tag}</span>
                      <span className="text-white/30 text-sm">{release.date}</span>
                    </div>
                    <h3 className="text-white/80 font-semibold mb-2">{release.title}</h3>
                    <p className="text-white/40 text-sm mb-6">{release.description}</p>

                    {/* Changes */}
                    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
                      {/* Group by type */}
                      {(['new', 'improved', 'fixed'] as const).map((type) => {
                        const items = release.changes.filter((c) => c.type === type);
                        if (!items.length) return null;
                        const style = typeStyles[type];
                        return (
                          <div key={type} className="border-b border-white/[0.04] last:border-0">
                            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${style.labelColor}`}>{style.label}</span>
                            </div>
                            <ul className="pb-4 space-y-2">
                              {items.map((change, idx) => (
                                <li key={idx} className="flex items-start gap-3 px-5">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                                  <span className="text-white/60 text-sm leading-relaxed">{change.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notification CTA */}
          <div className="mt-16 glass rounded-2xl p-8 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5 text-center">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-white font-bold text-lg mb-2">Stay in the loop</h3>
            <p className="text-white/50 text-sm mb-5">Get notified when we ship something new. No spam — just the good stuff.</p>
            <a href="mailto:hello@ahaget.ai?subject=Subscribe to changelog" className="inline-flex items-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02] text-sm">
              Subscribe to updates
            </a>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
