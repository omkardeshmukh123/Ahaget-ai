const CASES = [
  {
    icon: '📊',
    category: 'Analytics SaaS',
    lifecycle: ['🚀 Activate: connect data → first dashboard', '⚡ Adopt: AI surfaces unused reports after 14d', '📈 Expand: 80% limit hit → upgrade pitch'],
    result: 'Users reach their first chart in 8 minutes. AI keeps them coming back for deeper features.',
  },
  {
    icon: '⚡',
    category: 'No-code / Automation',
    lifecycle: ['🚀 Activate: build first automation', '⚡ Adopt: AI introduces advanced triggers', '💡 Retain: 8-day nudge if no new workflow'],
    result: 'Users complete their first automation without reading the docs. Dormant users get a targeted re-engagement.',
  },
  {
    icon: '🗂️',
    category: 'Project Management',
    lifecycle: ['🚀 Activate: create project → invite teammate', '⚡ Adopt: AI surfaces time-tracking after week 2', '📈 Expand: team hitting seat limit → upgrade'],
    result: 'Teams reach collaborative momentum in session 1. AI drives breadth of feature usage over time.',
  },
  {
    icon: '💰',
    category: 'CRM',
    lifecycle: ['🚀 Activate: import contacts → log first deal', '⚡ Adopt: AI introduces automation sequences', '📈 Expand: heavy usage → Growth plan pitch'],
    result: 'Sales reps activate without IT help. AI employee moves them from manual to automated in week 2.',
  },
  {
    icon: '🛠️',
    category: 'Developer Tools',
    lifecycle: ['🚀 Activate: install SDK → first API call', '⚡ Adopt: AI surfaces webhooks after first week', '💡 Retain: if no call in 7 days → proactive nudge'],
    result: 'Developers hit working integration in one sitting. AI keeps them engaged with advanced features.',
  },
  {
    icon: '🎓',
    category: 'EdTech / LMS',
    lifecycle: ['🚀 Activate: upload first course', '⚡ Adopt: AI introduces quiz + certificate builder', '📈 Expand: first 10 students → Starter plan'],
    result: 'Instructors publish their first course without abandoning setup. AI drives adoption of monetisation features.',
  },
];

export default function UseCases() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Works for{' '}
            <span className="gradient-text">any B2B SaaS</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            The AI employee adapts to your product — activating users on day 1 and driving value throughout their entire lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CASES.map((c) => (
            <div
              key={c.category}
              className="rounded-2xl border border-white/10 bg-white/3 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-semibold text-zinc-300">{c.category}</span>
              </div>

              {/* Lifecycle stages */}
              <div className="space-y-2">
                {c.lifecycle.map((stage, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm text-zinc-400 leading-relaxed">{stage}</span>
                  </div>
                ))}
              </div>

              {/* Result */}
              <p className="text-xs text-zinc-500 border-t border-white/5 pt-3 leading-relaxed">
                {c.result}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-sm mt-10">
          Not seeing your category?{' '}
          <a href="mailto:hello@ahaget.ai" className="text-brand-400 hover:underline">
            Tell us what you're building.
          </a>
        </p>
      </div>
    </section>
  );
}
