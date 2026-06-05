'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const practices = [
  {
    icon: '🔐',
    title: 'Encryption everywhere',
    items: [
      'TLS 1.3 for all data in transit',
      'AES-256 encryption for data at rest',
      'End-to-end encrypted webhook payloads (HMAC-SHA256 signatures)',
      'API keys are hashed — even our staff can\'t see them',
    ],
  },
  {
    icon: '🛡️',
    title: 'Infrastructure security',
    items: [
      'Cloud infrastructure hosted on Railway + Render with strict network policies',
      'Cloudflare for DDoS mitigation and WAF protection',
      'Private VPC for all backend services — no public database exposure',
      'Secrets managed via environment vault — never committed to code',
      'Automated dependency vulnerability scanning (Dependabot)',
    ],
  },
  {
    icon: '🔑',
    title: 'Access controls',
    items: [
      'Role-based access control (RBAC) in the dashboard',
      'SSO / SAML support (Scale plan)',
      'Session tokens expire after 24 hours of inactivity',
      'API keys are scoped to specific resources and rate-limited',
      'Internally: principle of least privilege, MFA enforced for all staff',
    ],
  },
  {
    icon: '🏗️',
    title: 'Secure development',
    items: [
      'OWASP Top 10 addressed in every release cycle',
      'Automated SAST scanning on every pull request',
      'Dependency audits before every deployment',
      'Input validation and parameterized queries throughout',
      'Content Security Policy (CSP) headers on all web properties',
    ],
  },
  {
    icon: '📊',
    title: 'Monitoring & incident response',
    items: [
      '24/7 uptime monitoring with PagerDuty alerting',
      'Anomaly detection on authentication and API usage',
      'Comprehensive audit logs for all dashboard actions',
      'Incident response plan with <1 hour acknowledgment SLA',
      'Post-incident reports published for significant outages',
    ],
  },
  {
    icon: '🔄',
    title: 'Business continuity',
    items: [
      'Automated daily database backups with 30-day retention',
      'Point-in-time recovery for production databases',
      'Multi-region data replication (paid plans)',
      '99.9% uptime SLA for all paid tiers',
      'Disaster recovery plan tested quarterly',
    ],
  },
];

const compliance = [
  { name: 'GDPR', status: 'Compliant', desc: 'Full GDPR compliance including DPA, right to erasure, and data portability.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'SOC 2 Type II', status: 'In progress', desc: 'Audit in progress. Expected certification Q4 2026.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { name: 'ISO 27001', status: 'Roadmap', desc: 'Planned for 2027 following SOC 2 completion.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'CCPA', status: 'Compliant', desc: 'California Consumer Privacy Act compliance supported for US customers.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'PDPA (India)', status: 'Compliant', desc: 'Aligned with India\'s Digital Personal Data Protection Act 2023.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">🔒 Security</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Your data.{' '}
            <span className="gradient-text">Always protected.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-6">
            Security isn&apos;t a feature — it&apos;s the foundation. Here&apos;s exactly how we protect your data and your users&apos; data.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="glass rounded-full px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">✓ TLS 1.3</span>
            <span className="glass rounded-full px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">✓ AES-256</span>
            <span className="glass rounded-full px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">✓ GDPR compliant</span>
            <span className="glass rounded-full px-4 py-1.5 text-sm text-yellow-400 border border-yellow-500/20">⏳ SOC 2 in progress</span>
          </div>
        </div>
      </section>

      {/* Security practices */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-10 text-center">Security practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {practices.map((practice) => (
              <div key={practice.title} className="glass rounded-2xl p-6 border border-white/[0.06] hover:border-[#8A2BE2]/20 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{practice.icon}</span>
                  <h3 className="text-white font-bold">{practice.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {practice.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/50">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">Compliance & certifications</h2>
            <p className="text-white/40 max-w-lg mx-auto">We meet or exceed compliance requirements for global SaaS operations.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compliance.map((c) => (
              <div key={c.name} className={`rounded-2xl p-5 border ${c.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold">{c.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.bg} ${c.color} border ${c.bg.split(' ')[1]}`}>{c.status}</span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-10 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-black text-white mb-3">Responsible disclosure</h2>
            <p className="text-white/55 leading-relaxed mb-4">
              We take security vulnerabilities seriously. If you&apos;ve discovered a potential security issue in Ahaget, please report it privately.
            </p>
            <p className="text-white/40 text-sm mb-2">We commit to:</p>
            <ul className="text-white/50 text-sm space-y-1 mb-6">
              <li>✓ Acknowledge your report within 24 hours</li>
              <li>✓ Provide an initial assessment within 72 hours</li>
              <li>✓ Keep you updated on remediation progress</li>
              <li>✓ Credit your discovery (with your permission)</li>
            </ul>
            <a
              href="mailto:security@ahaget.ai"
              className="inline-flex items-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02]"
            >
              security@ahaget.ai
            </a>
            <p className="text-white/25 text-xs mt-4">PGP key available on request. Please do not disclose publicly until we&apos;ve resolved the issue.</p>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
