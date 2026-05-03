'use client';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the AI employee on your staging environment. No card required.',
    limit: '100 lifecycle sessions / mo',
    features: [
      '100 AI-guided sessions',
      'Onboarding + support flows',
      'Activation funnel analytics',
      'Community support',
    ],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$99',
    period: 'per month',
    description: 'For early-stage SaaS getting users to first value.',
    limit: '1,000 sessions / mo',
    features: [
      '1,000 AI-guided sessions per month',
      'Onboarding + adoption flows',
      'Page actions (fill, click, navigate)',
      'Proactive in-app messaging',
      'Email support',
    ],
    cta: 'Start Starter',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$299',
    period: 'per month',
    description: 'Full lifecycle AI — activate, adopt, retain, expand.',
    limit: '10,000 sessions / mo',
    features: [
      '10,000 AI-guided sessions per month',
      'Everything in Starter',
      'Upsell flows + expansion MRR tracking',
      'Retention re-engagement (in-app + email)',
      'Lifecycle funnel analytics',
      'Priority support',
    ],
    cta: 'Start Growth',
    highlight: true,
  },
  {
    name: 'Scale',
    price: '$999',
    period: 'per month',
    description: 'For funded startups and growth-stage products.',
    limit: 'Unlimited sessions',
    features: [
      'Unlimited sessions',
      'Everything in Growth',
      'Revenue-share attribution reports',
      'White-glove flow setup',
      'SLA + dedicated Slack channel',
      'Custom contract / invoicing',
    ],
    cta: 'Contact us',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Priced on{' '}
            <span className="gradient-text">lifecycle value</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            One AI employee. One price. Activation, adoption, retention, and expansion — all included.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-brand-500 bg-brand-500/10 glow'
                  : 'border-white/10 bg-white/3'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">/{plan.period}</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-6 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300">
                {plan.limit}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <svg className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={
                  plan.cta === 'Contact us'
                    ? 'mailto:hello@ahaget.ai'
                    : (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000/register')
                }
                className={`block w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-colors ${
                  plan.highlight
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Lifecycle value callout */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/3 p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-white font-semibold mb-1">What does one session cover?</p>
            <p className="text-zinc-500 text-sm leading-relaxed">
              A session is one AI employee conversation — whether it's onboarding a new user,
              nudging a dormant user back in, explaining a feature, or pitching an upgrade.
              All lifecycle stages share the same session pool.
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="text-3xl font-black text-white">5×</p>
            <p className="text-xs text-zinc-500 mt-1">avg activation vs<br />no-AI baseline</p>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-sm mt-8">
          All plans include a 14-day money-back guarantee.{' '}
          <a href="mailto:hello@ahaget.ai" className="text-brand-400 hover:underline">
            Need a custom plan? Get in touch.
          </a>
        </p>
      </div>
    </section>
  );
}
