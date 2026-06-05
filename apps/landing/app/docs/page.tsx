'use client';

import { useState } from 'react';
import { InnerNav, InnerFooter } from '../../components/inner-layout';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'api' | 'sdks' | 'examples'>('quickstart');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const scriptSnippet = `<script
  src="https://cdn.ahaget.ai/widget.js"
  data-key="YOUR_API_KEY"
  data-user-id="{{user.id}}"
  data-user-email="{{user.email}}"
  data-user-name="{{user.name}}"
  data-plan="{{user.plan}}"
  defer>
</script>`;

  const reactSnippet = `import { useEffect } from 'react';
import { useUser } from './hooks/useUser';

export function AhagetWidget() {
  const user = useUser();

  useEffect(() => {
    if (!user) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.ahaget.ai/widget.js';
    script.setAttribute('data-key', process.env.NEXT_PUBLIC_AHAGET_KEY!);
    script.setAttribute('data-user-id', user.id);
    script.setAttribute('data-user-email', user.email);
    script.setAttribute('data-user-name', user.name);
    script.setAttribute('data-plan', user.plan);
    script.defer = true;
    document.body.appendChild(script);

    return () => { document.body.removeChild(script); };
  }, [user]);

  return null;
}`;

  const apiSnippet = `// Identify a user (optional — widget auto-detects from data attributes)
window.ahaget?.identify({
  userId: 'usr_123',
  email: 'alice@example.com',
  name: 'Alice',
  plan: 'growth',
  createdAt: '2026-01-15T08:00:00Z',
  properties: {
    company: 'Acme Inc',
    mrr: 299,
  }
});

// Track a custom event
window.ahaget?.track('feature_used', { featureName: 'export_csv' });

// Manually trigger an onboarding flow
window.ahaget?.startFlow('onboarding-v2');

// Open knowledge base
window.ahaget?.openHelp();`;

  const webhookSnippet = `POST https://your-server.com/webhooks/ahaget

{
  "event": "churn_risk_detected",
  "userId": "usr_123",
  "score": 0.87,
  "reason": "7 days inactive, feature adoption < 30%",
  "timestamp": "2026-06-05T14:30:00Z"
}`;

  const features = [
    { icon: '⚡', title: 'Sub-100ms load', desc: 'Async, non-blocking widget script.' },
    { icon: '🔒', title: 'Zero PII on CDN', desc: 'User data stays in your region.' },
    { icon: '🌍', title: 'Multi-language', desc: 'English, Hindi, Hinglish + 40 more.' },
    { icon: '🎨', title: 'Fully customizable', desc: 'Match your brand colors & fonts.' },
    { icon: '📊', title: 'Real-time analytics', desc: 'Session-level user insights.' },
    { icon: '🔗', title: 'Webhook events', desc: 'Push churn alerts to your stack.' },
  ];

  const tabs = [
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'api', label: 'API Reference' },
    { id: 'sdks', label: 'SDKs' },
    { id: 'examples', label: 'Examples' },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">📖 Developer Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Build in minutes,<br />
            <span className="gradient-text">not weeks</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            Two lines of HTML. Full AI-powered user lifecycle. No engineering sprint required.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="glass rounded-full px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">✓ Works with any frontend</span>
            <span className="glass rounded-full px-4 py-1.5 text-sm text-blue-400 border border-blue-500/20">✓ 10-minute setup</span>
            <span className="glass rounded-full px-4 py-1.5 text-sm text-purple-400 border border-purple-500/20">✓ REST API available</span>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl p-4 border border-white/[0.06] flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold">{f.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="border-b border-white/[0.06] flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#8A2BE2] text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {/* QUICK START */}
        {activeTab === 'quickstart' && (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Installation</h2>
              <p className="text-white/50 mb-6">Add the widget script just before your closing <code className="text-[#B06CF5]">&lt;/body&gt;</code> tag. Replace attribute values with your user's actual data.</p>

              <div className="relative glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <span className="ml-2 text-white/30 text-xs font-mono">index.html</span>
                  </div>
                  <button
                    onClick={() => copy(scriptSnippet, 'script')}
                    className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    {copied === 'script' ? (
                      <><span className="text-emerald-400">✓</span> Copied</>
                    ) : (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>Copy</>
                    )}
                  </button>
                </div>
                <pre className="p-5 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">{scriptSnippet}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">React / Next.js</h3>
              <p className="text-white/50 mb-4">Use this pattern to inject the widget with user context from your auth session.</p>
              <div className="relative glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="text-white/30 text-xs font-mono">AhagetWidget.tsx</span>
                  <button onClick={() => copy(reactSnippet, 'react')} className="text-xs text-white/40 hover:text-white transition-colors">
                    {copied === 'react' ? <span className="text-emerald-400">✓ Copied</span> : 'Copy'}
                  </button>
                </div>
                <pre className="p-5 text-sm font-mono text-blue-300 overflow-x-auto leading-relaxed">{reactSnippet}</pre>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5">
              <h3 className="text-white font-bold mb-3">Configuration attributes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-left border-b border-white/[0.06]">
                      <th className="pb-3 pr-6 font-medium">Attribute</th>
                      <th className="pb-3 pr-6 font-medium">Type</th>
                      <th className="pb-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      { attr: 'data-key', type: 'string', desc: 'Your Ahaget API key (required)' },
                      { attr: 'data-user-id', type: 'string', desc: 'Unique identifier for the user' },
                      { attr: 'data-user-email', type: 'string', desc: "User's email address" },
                      { attr: 'data-user-name', type: 'string', desc: "User's display name" },
                      { attr: 'data-plan', type: 'string', desc: "User's subscription plan" },
                      { attr: 'data-locale', type: 'string', desc: 'Preferred language (e.g. "hi", "en")' },
                      { attr: 'data-theme', type: 'light | dark', desc: 'Widget color scheme (default: dark)' },
                      { attr: 'data-position', type: 'string', desc: 'Widget position: bottom-right, bottom-left' },
                    ].map((row) => (
                      <tr key={row.attr}>
                        <td className="py-3 pr-6 text-[#B06CF5] font-mono text-xs">{row.attr}</td>
                        <td className="py-3 pr-6 text-white/40 font-mono text-xs">{row.type}</td>
                        <td className="py-3 text-white/60 text-xs">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* API REFERENCE */}
        {activeTab === 'api' && (
          <div id="api-reference" className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">JavaScript API</h2>
              <p className="text-white/50 mb-6">After the widget loads, <code className="text-[#B06CF5]">window.ahaget</code> exposes a client-side API for deeper integration.</p>
              <div className="relative glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="text-white/30 text-xs font-mono">widget-api.js</span>
                  <button onClick={() => copy(apiSnippet, 'api')} className="text-xs text-white/40 hover:text-white transition-colors">
                    {copied === 'api' ? <span className="text-emerald-400">✓ Copied</span> : 'Copy'}
                  </button>
                </div>
                <pre className="p-5 text-sm font-mono text-yellow-200 overflow-x-auto leading-relaxed">{apiSnippet}</pre>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">REST API</h2>
              <p className="text-white/50 mb-4">Base URL: <code className="text-[#B06CF5]">https://api.ahaget.ai/v1</code></p>

              <div className="space-y-4">
                {[
                  { method: 'GET', path: '/users', desc: 'List all users with lifecycle scores' },
                  { method: 'GET', path: '/users/:id', desc: 'Get a single user with full profile' },
                  { method: 'POST', path: '/users/:id/identify', desc: 'Update user attributes' },
                  { method: 'POST', path: '/events', desc: 'Track a custom event server-side' },
                  { method: 'GET', path: '/flows', desc: 'List all onboarding flows' },
                  { method: 'POST', path: '/flows/:id/trigger', desc: 'Manually trigger a flow for a user' },
                  { method: 'GET', path: '/analytics/churn', desc: 'Get churn risk scores' },
                  { method: 'GET', path: '/analytics/engagement', desc: 'Get engagement metrics' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="glass rounded-xl p-4 border border-white/[0.06] flex items-center gap-4">
                    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md flex-shrink-0 ${
                      endpoint.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>{endpoint.method}</span>
                    <code className="text-white/80 text-sm font-mono flex-1">{endpoint.path}</code>
                    <span className="text-white/40 text-sm hidden sm:block">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Webhooks</h3>
              <p className="text-white/50 mb-4">Ahaget sends signed POST requests to your endpoint for key lifecycle events.</p>
              <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="text-white/30 text-xs font-mono">webhook payload example</span>
                </div>
                <pre className="p-5 text-sm font-mono text-purple-300 overflow-x-auto leading-relaxed">{webhookSnippet}</pre>
              </div>
              <p className="text-white/40 text-sm mt-3">Events: <code className="text-[#B06CF5]">churn_risk_detected</code>, <code className="text-[#B06CF5]">onboarding_completed</code>, <code className="text-[#B06CF5]">feature_adopted</code>, <code className="text-[#B06CF5]">plan_upgraded</code></p>
            </div>
          </div>
        )}

        {/* SDKs */}
        {activeTab === 'sdks' && (
          <div id="sdks" className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">SDKs & Libraries</h2>
              <p className="text-white/50 mb-8">Official and community-maintained packages for popular frameworks and languages.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { name: 'JavaScript / TypeScript', tag: 'Official', icon: '🟨', pkg: 'npm install @ahaget/js', status: 'stable', version: 'v1.2.0' },
                { name: 'React', tag: 'Official', icon: '⚛️', pkg: 'npm install @ahaget/react', status: 'stable', version: 'v1.2.0' },
                { name: 'Next.js', tag: 'Official', icon: '▲', pkg: 'npm install @ahaget/next', status: 'stable', version: 'v1.1.0' },
                { name: 'Vue 3', tag: 'Official', icon: '💚', pkg: 'npm install @ahaget/vue', status: 'beta', version: 'v0.9.0' },
                { name: 'Python', tag: 'Official', icon: '🐍', pkg: 'pip install ahaget', status: 'stable', version: 'v1.0.0' },
                { name: 'Node.js', tag: 'Official', icon: '🟢', pkg: 'npm install ahaget', status: 'stable', version: 'v1.2.0' },
                { name: 'Angular', tag: 'Community', icon: '🔴', pkg: 'npm install @ahaget/angular', status: 'beta', version: 'v0.7.0' },
                { name: 'Ruby on Rails', tag: 'Community', icon: '💎', pkg: 'gem install ahaget', status: 'coming soon', version: '—' },
              ].map((sdk) => (
                <div key={sdk.name} className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-[#8A2BE2]/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sdk.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{sdk.name}</h3>
                        <span className={`text-xs ${sdk.tag === 'Official' ? 'text-[#B06CF5]' : 'text-white/40'}`}>{sdk.tag}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sdk.status === 'stable' ? 'bg-emerald-500/15 text-emerald-400' :
                      sdk.status === 'beta' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-white/10 text-white/40'
                    }`}>{sdk.status}</span>
                  </div>
                  <code className="text-xs font-mono text-white/50 bg-white/[0.04] px-3 py-2 rounded-lg block">{sdk.pkg}</code>
                  <p className="text-white/30 text-xs mt-2">{sdk.version}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-6 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5">
              <h3 className="text-white font-bold mb-2">Build your own integration?</h3>
              <p className="text-white/50 text-sm">The Ahaget REST API follows OpenAPI 3.0. Download the spec to generate a client in any language.</p>
              <a href="mailto:hello@ahaget.ai" className="inline-flex items-center gap-2 mt-4 text-sm text-[#B06CF5] hover:text-white transition-colors font-medium">
                Request OpenAPI spec →
              </a>
            </div>
          </div>
        )}

        {/* EXAMPLES */}
        {activeTab === 'examples' && (
          <div id="examples" className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Example integrations</h2>
              <p className="text-white/50 mb-8">Copy-paste starting points for common integration patterns.</p>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: 'Next.js App Router (recommended)',
                  lang: 'tsx',
                  code: `// app/layout.tsx
import { AhagetProvider } from '@ahaget/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AhagetProvider apiKey={process.env.NEXT_PUBLIC_AHAGET_KEY} />
      </body>
    </html>
  );
}`,
                  color: 'text-blue-300',
                },
                {
                  title: 'Identify user after login',
                  lang: 'ts',
                  code: `// Trigger after successful auth
import { ahaget } from '@ahaget/js';

async function onLoginSuccess(user: User) {
  await ahaget.identify({
    userId: user.id,
    email: user.email,
    name: user.displayName,
    plan: user.subscription.plan,
    createdAt: user.createdAt,
  });

  // Optional: start welcome flow for new users
  if (user.isNew) {
    ahaget.startFlow('welcome-onboarding');
  }
}`,
                  color: 'text-emerald-300',
                },
                {
                  title: 'Track feature adoption',
                  lang: 'ts',
                  code: `// Track whenever a user uses a key feature
function onExportCSV(data: CsvData) {
  // ... your export logic

  window.ahaget?.track('feature_used', {
    featureName: 'csv_export',
    rowCount: data.rows.length,
    timestamp: new Date().toISOString(),
  });
}`,
                  color: 'text-yellow-300',
                },
              ].map((ex) => (
                <div key={ex.title} className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                    <span className="text-white/60 text-sm font-medium">{ex.title}</span>
                    <span className="text-white/30 text-xs font-mono">.{ex.lang}</span>
                  </div>
                  <pre className={`p-5 text-sm font-mono overflow-x-auto leading-relaxed ${ex.color}`}>{ex.code}</pre>
                </div>
              ))}
            </div>

            <div className="text-center py-8">
              <p className="text-white/40 mb-4">More examples on GitHub</p>
              <a
                href="https://github.com/ahaget"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 glass hover:bg-white/[0.08] text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/[0.1] hover:border-white/20 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        )}
      </div>

      <InnerFooter />
    </div>
  );
}
