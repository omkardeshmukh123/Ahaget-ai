'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const openRoles = [
  {
    title: 'Senior Full-Stack Engineer',
    type: 'Full-time',
    location: 'Remote (India)',
    team: 'Engineering',
    teamColor: 'bg-blue-500/15 text-blue-400',
    description: 'Build the core platform — widget runtime, dashboard, and AI pipeline. You\'ll own features end-to-end.',
    tags: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis'],
  },
  {
    title: 'ML Engineer — Churn & Lifecycle AI',
    type: 'Full-time',
    location: 'Remote (India)',
    team: 'AI / ML',
    teamColor: 'bg-purple-500/15 text-purple-400',
    description: 'Own our churn prediction model, proactive messaging AI, and user segmentation intelligence. Work with real SaaS data at scale.',
    tags: ['Python', 'PyTorch', 'Scikit-learn', 'LLMs', 'Embeddings'],
  },
  {
    title: 'Growth Marketing Lead',
    type: 'Full-time',
    location: 'Remote (India / Global)',
    team: 'Marketing',
    teamColor: 'bg-pink-500/15 text-pink-400',
    description: 'Drive our go-to-market strategy. SEO, content, developer community, product-led growth loops. Own the funnel from awareness to activation.',
    tags: ['SEO', 'Content', 'PLG', 'Analytics', 'SaaS'],
  },
];

const perks = [
  { icon: '🌍', title: 'Fully remote', desc: 'Work from anywhere. We judge by output, not hours.' },
  { icon: '💰', title: 'Competitive pay', desc: 'Market-rate salary + equity for early team members.' },
  { icon: '📚', title: 'Learning budget', desc: '₹50,000/year for courses, books, conferences, or tools.' },
  { icon: '⚡', title: 'Fast & flat', desc: 'No bureaucracy. Your work ships to production weekly.' },
  { icon: '🚀', title: 'Equity upside', desc: 'Meaningful early-stage equity with a 4-year vest.' },
  { icon: '🎯', title: 'Ownership mindset', desc: 'We hire owners, not executors. You drive your domain.' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[500px] h-[500px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">🚀 Careers at Ahaget</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Help us build the future of{' '}
            <span className="gradient-text">SaaS user lifecycle</span>
          </h1>
          <p className="text-white/55 text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            We&apos;re a small, high-conviction team building something ambitious. If you love solving hard problems and want your work to matter from day one, read on.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-white/40">
            <span className="glass rounded-full px-4 py-1.5 border border-white/[0.06]">🏠 Remote-first</span>
            <span className="glass rounded-full px-4 py-1.5 border border-white/[0.06]">📍 India-based</span>
            <span className="glass rounded-full px-4 py-1.5 border border-white/[0.06]">🌱 Early stage</span>
            <span className="glass rounded-full px-4 py-1.5 border border-white/[0.06]">💼 {openRoles.length} open roles</span>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="py-16 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Why Ahaget?</h2>
            <p className="text-white/40 max-w-lg mx-auto">
              We&apos;re at the intersection of AI and SaaS — building the AI employee that every B2B product will eventually need.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((perk) => (
              <div key={perk.title} className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-[#8A2BE2]/20 transition-colors">
                <div className="text-2xl mb-3">{perk.icon}</div>
                <h3 className="text-white font-bold mb-1.5 text-sm">{perk.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white mb-2">Open roles</h2>
            <p className="text-white/40">All positions are fully remote. We care about impact, not timezones.</p>
          </div>

          <div className="space-y-5">
            {openRoles.map((role) => (
              <div key={role.title} className="glass rounded-2xl p-6 border border-white/[0.06] hover:border-[#8A2BE2]/30 transition-all duration-200 group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${role.teamColor}`}>{role.team}</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/40 text-xs">{role.type}</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/40 text-xs">{role.location}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg group-hover:text-[#B06CF5] transition-colors">{role.title}</h3>
                  </div>
                  <a
                    href={`mailto:jobs@ahaget.ai?subject=Application: ${role.title}`}
                    className="flex-shrink-0 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02] inline-block text-center"
                  >
                    Apply now
                  </a>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-4">{role.description}</p>
                <div className="flex flex-wrap gap-2">
                  {role.tags.map((tag) => (
                    <span key={tag} className="text-xs glass px-2.5 py-1 rounded-full text-white/40 border border-white/[0.06]">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General application CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-10 border border-white/[0.08] text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-white font-black text-2xl mb-3">Don&apos;t see the right role?</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              We&apos;re always looking for exceptional people. Send us a note about what you&apos;d love to build with us.
            </p>
            <a
              href="mailto:jobs@ahaget.ai"
              className="inline-flex items-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02]"
            >
              jobs@ahaget.ai
            </a>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
