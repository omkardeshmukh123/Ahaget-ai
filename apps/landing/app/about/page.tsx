'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

export default function AboutPage() {
  const values = [
    {
      icon: '🤖',
      title: 'AI first, always',
      desc: 'Every feature is built with AI at the core — not bolted on. We believe autonomous AI agents are the future of SaaS operations.',
    },
    {
      icon: '⚡',
      title: 'Speed over perfection',
      desc: 'Ship fast, learn faster. We iterate weekly based on what real users need, not what looks good on a roadmap.',
    },
    {
      icon: '🌍',
      title: 'Global by default',
      desc: 'SaaS is borderless. Ahaget supports 40+ languages out of the box including Hindi and Hinglish because great UX knows no language barrier.',
    },
    {
      icon: '🔒',
      title: 'Privacy-first architecture',
      desc: 'We don\'t sell data. We don\'t monetize attention. Your users\' data is yours — always encrypted, always in your region.',
    },
    {
      icon: '🏗️',
      title: 'Developer respect',
      desc: 'We treat developers as first-class citizens. Two lines of HTML to get started. Full REST API. No "contact sales" gates.',
    },
    {
      icon: '💡',
      title: 'Founder empathy',
      desc: 'Built by founders who\'ve lost users to poor onboarding. We know the pain, so we built the cure.',
    },
  ];

  const stats = [
    { value: '250+', label: 'SaaS teams using Ahaget' },
    { value: '40+', label: 'Languages supported' },
    { value: '4 min', label: 'Average setup time' },
    { value: '99.9%', label: 'Uptime SLA' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[500px] h-[500px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">🏢 About Ahaget</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            We&apos;re building the{' '}
            <span className="gradient-text">AI employee</span>
            <br />every SaaS team needs
          </h1>
          <p className="text-white/55 text-xl max-w-2xl mx-auto leading-relaxed">
            Ahaget was born out of frustration. Too many great SaaS products lose users not because the product is bad — but because no one was there to onboard them, help them, or remind them why they signed up.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-white/40 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-8">Our story</h2>
          <div className="space-y-5 text-white/60 text-base leading-relaxed">
            <p>
              Every SaaS founder knows the churn panic — users sign up, poke around for a few minutes, and disappear. You send a drip email campaign. It gets ignored. You hire a customer success manager. They can&apos;t scale to thousands of users. You add a help widget. Users never click it.
            </p>
            <p>
              We built Ahaget because none of the existing solutions treated user lifecycle as an <em className="text-white">intelligent, continuous process</em>. Onboarding tools do onboarding. Support tools do support. Analytics tools just watch. Nobody connected the dots — until now.
            </p>
            <p>
              Ahaget is a single embeddable AI agent that does everything: it onboards new users with personalized flows, detects when someone is about to churn and intervenes proactively, answers support questions from your knowledge base in the user&apos;s language, and surfaces actionable analytics so you know exactly what to fix next.
            </p>
            <p>
              We&apos;re a small, focused team based in India, building for the world. We ship every week. We talk to customers every day. And we genuinely believe that in 5 years, every SaaS product will have an AI employee like Ahaget managing their user relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 relative">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">What we believe</h2>
            <p className="text-white/40 max-w-lg mx-auto">The principles that guide every product decision we make.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="glass glass-hover rounded-2xl p-6 border border-white/[0.06]">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-white font-bold mb-2">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">The team</h2>
            <p className="text-white/40">Small team, big ambitions.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
            {[
              { name: 'Omkar Deshmukh', role: 'Founder & CEO', initials: 'OD', gradient: 'from-[#8A2BE2] to-[#B06CF5]' },
              { name: 'Engineering Team', role: 'Backend & AI', initials: '⚙️', gradient: 'from-blue-500 to-cyan-500' },
              { name: 'We\'re hiring', role: 'Join the team →', initials: '+', gradient: 'from-emerald-500 to-teal-500', link: '/careers' },
            ].map((member) => (
              <div key={member.name} className="glass rounded-2xl p-6 border border-white/[0.06] text-center hover:border-[#8A2BE2]/30 transition-colors">
                {'link' in member && member.link ? (
                  <a href={member.link} className="block">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-2xl text-white font-bold mx-auto mb-4`}>
                      {member.initials}
                    </div>
                    <h3 className="text-white font-bold mb-1">{member.name}</h3>
                    <p className="text-[#B06CF5] text-sm">{member.role}</p>
                  </a>
                ) : (
                  <>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-2xl text-white font-bold mx-auto mb-4`}>
                      {member.initials}
                    </div>
                    <h3 className="text-white font-bold mb-1">{member.name}</h3>
                    <p className="text-white/40 text-sm">{member.role}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Press & Media</h2>
          <p className="text-white/50 mb-8">
            For press inquiries, partnership opportunities, or interview requests, reach out to our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:press@ahaget.ai"
              className="inline-flex items-center justify-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02]"
            >
              press@ahaget.ai
            </a>
            <a
              href="mailto:hello@ahaget.ai"
              className="inline-flex items-center justify-center gap-2 glass hover:bg-white/[0.08] text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/[0.1] hover:border-white/20 transition-all duration-200"
            >
              General inquiries
            </a>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
