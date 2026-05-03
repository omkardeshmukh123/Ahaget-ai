const STEPS = [
  {
    number: '01',
    title: 'Activate — get users to first value',
    description:
      'Define the steps your users need to complete to hit their aha moment. The AI guides every new user through setup — fills forms, highlights buttons, navigates pages. Users activate without getting stuck.',
    code: `// Onboarding flow example
Step 1: "Connect your data source"
  → AI asks: "What's your main source?"
  → Action: highlight the upload button
Step 2: "Create your first dashboard"
  → AI: fills the name field, advances
Step 3: "First insight" (milestone)
  → AI celebrates. User is activated. ✓`,
    color: 'from-purple-500/20 to-brand-500/20',
  },
  {
    number: '02',
    title: 'Adopt — drive breadth of usage',
    description:
      'After activation, Ahaget monitors which features the user has never visited. After 14 days it surfaces them contextually — "You\'ve been doing this manually. Here\'s a faster way." The AI sets it up for them.',
    code: `// Adoption trigger (auto-evaluated)
Trigger: feature_unused
  feature: "exports"
  days: 14
→ AI opens, explains exports,
  asks: "Want me to run one now?"
→ User says yes → AI navigates + clicks`,
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    number: '03',
    title: 'Expand — AI-attributed upsell revenue',
    description:
      'When a user hits 80% of their plan limit, the AI pitches an upgrade at the exact moment of need — not in a cold email. Conversions attributed to AI are tracked, giving you a clear ROI number.',
    code: `// Upsell trigger
Trigger: usage_threshold
  metric: "api_calls", threshold: 80
→ AI: "You've used 80% of your API limit.
  The Growth plan removes it entirely.
  Want to upgrade now?"
→ User: "Yes" → deep link to billing`,
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    number: '04',
    title: 'Retain — re-engage before they churn',
    description:
      'At 8 days inactive or churn score ≥ 50, the AI reaches out with a message specific to where they stopped — not a generic "we miss you" email. Back in the product, the widget resumes right where they left off.',
    code: `// Retention trigger
Trigger: inactivity, days: 8
→ Email: "You were on Step 2 of
   connecting your data source.
   Want to finish?"
   Link: /app?ahaget_resume=flow_id
→ Widget opens immediately on click`,
    color: 'from-orange-500/20 to-red-500/20',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            One AI employee.{' '}
            <span className="gradient-text">Full user lifecycle.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Configure your flows once. The AI runs them for every user, forever — from day 1 to renewal.
          </p>
        </div>

        <div className="space-y-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`relative rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-r ${step.color} p-px`}
            >
              <div className="rounded-2xl bg-[#0f0f11] p-8 flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <span className="text-5xl font-black text-white/10">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-400 leading-relaxed mb-4">{step.description}</p>
                  <div className="code-block px-4 py-3 text-sm text-zinc-300 overflow-x-auto">
                    <pre><code>{step.code}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
