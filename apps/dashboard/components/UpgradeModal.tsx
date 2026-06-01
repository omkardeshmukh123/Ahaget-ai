'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LockedDetail {
  feature: string;
  currentPlan: string;
  upgradeUrl: string;
}

const FEATURE_LABELS: Record<string, string> = {
  goalMode:          'Goal Mode',
  mcpConnectors:     'MCP Connectors',
  advancedAnalytics: 'Advanced Analytics',
  customPlaybook:    'Custom Playbook',
  apiAccess:         'API Access',
  whiteLabel:        'White Label',
  ssoSaml:           'SSO / SAML',
  prioritySupport:   'Priority Support',
};

export default function UpgradeModal() {
  const router = useRouter();
  const [detail, setDetail] = useState<LockedDetail | null>(null);

  useEffect(() => {
    function onLocked(e: Event) {
      setDetail((e as CustomEvent<LockedDetail>).detail);
    }
    window.addEventListener('plan:locked', onLocked);
    return () => window.removeEventListener('plan:locked', onLocked);
  }, []);

  if (!detail) return null;

  const featureLabel = FEATURE_LABELS[detail.feature] ?? detail.feature;
  const planLabel = detail.currentPlan.charAt(0).toUpperCase() + detail.currentPlan.slice(1);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={() => setDetail(null)}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: '40px 36px',
          maxWidth: 420, width: '100%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 44, marginBottom: 16, lineHeight: 1 }}>🔒</div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
          {featureLabel} requires an upgrade
        </h2>

        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 28px' }}>
          You're on the <strong>{planLabel}</strong> plan. Upgrade to unlock {featureLabel} and get access to the full Ahaget feature set.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => setDetail(null)}
            style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1px solid #e2e8f0',
              color: '#64748b', cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
          <button
            onClick={() => { setDetail(null); router.push('/settings/billing'); }}
            style={{
              padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: '#8A2BE2', border: 'none', color: '#fff', cursor: 'pointer',
            }}
          >
            Upgrade plan →
          </button>
        </div>
      </div>
    </div>
  );
}
