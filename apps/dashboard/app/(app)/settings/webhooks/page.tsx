'use client';
import { useEffect, useState } from 'react';
import { api, Webhook } from '@/lib/api';

const EVENT_TYPES = [
  { value: 'onboarding_completed', label: 'Onboarding Completed', desc: 'Fires when a user finishes all steps in a flow' },
  { value: 'step_completed',       label: 'Step Completed',       desc: 'Fires each time a user completes a single step' },
  { value: 'user_escalated',       label: 'User Escalated',       desc: 'Fires when a session is handed off to a human agent' },
  { value: 'milestone_reached',    label: 'Milestone Reached',    desc: 'Fires when a user reaches a milestone step (first value)' },
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0].value);
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; status?: number; error?: string } | null>>({});

  useEffect(() => {
    api.webhooks.list()
      .then(setHooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await api.webhooks.create({ eventType, url });
      setNewSecret(created.secret);
      setHooks((prev) => [created, ...prev]);
      setUrl('');
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    const updated = await api.webhooks.toggle(id, enabled).catch(() => null);
    if (updated) setHooks((prev) => prev.map((h) => (h.id === id ? updated : h)));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook?')) return;
    await api.webhooks.delete(id).catch(() => null);
    setHooks((prev) => prev.filter((h) => h.id !== id));
  }

  async function handleTest(id: string) {
    setTestResults((prev) => ({ ...prev, [id]: null }));
    const result = await api.webhooks.test(id).catch((e: unknown) => ({ ok: false, error: String(e) }));
    setTestResults((prev) => ({ ...prev, [id]: result }));
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A0530', margin: 0 }}>Webhooks</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Receive real-time HTTP POST notifications when key events happen. Use these to connect Zapier, Make, or your own backend.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          + Add Webhook
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {newSecret && (
        <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 6 }}>Webhook created — copy your signing secret now. It won't be shown again.</p>
          <code style={{ fontSize: 12, background: '#D1FAE5', padding: '4px 8px', borderRadius: 4, color: '#064E3B', wordBreak: 'break-all' }}>{newSecret}</code>
          <button
            onClick={() => setNewSecret(null)}
            style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 14 }}>New Webhook</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Event</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, background: '#fff' }}
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>
                {EVENT_TYPES.find((et) => et.value === eventType)?.desc}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Endpoint URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="submit"
              disabled={creating}
              style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creating ? 0.6 : 1 }}
            >
              {creating ? 'Creating…' : 'Create Webhook'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: '#374151' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>Loading…</p>
      ) : hooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed #E5E7EB', borderRadius: 10 }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>No webhooks yet. Add one to start receiving events.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hooks.map((hook) => {
            const testResult = testResults[hook.id];
            return (
              <div key={hook.id} style={{
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 18px',
                opacity: hook.enabled ? 1 : 0.55,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#EDE9FE', color: '#6D28D9', borderRadius: 4, padding: '2px 7px' }}>
                        {EVENT_TYPES.find((et) => et.value === hook.eventType)?.label ?? hook.eventType}
                      </span>
                      {!hook.enabled && (
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>disabled</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380, margin: 0 }}>
                      {hook.url}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleTest(hook.id)}
                      style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#F9FAFB', cursor: 'pointer', color: '#374151' }}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggle(hook.id, !hook.enabled)}
                      style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#F9FAFB', cursor: 'pointer', color: '#374151' }}
                    >
                      {hook.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(hook.id)}
                      style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#FFF5F5', cursor: 'pointer', color: '#DC2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {testResult !== undefined && testResult !== null && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 6,
                    background: testResult.ok ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${testResult.ok ? '#6EE7B7' : '#FECACA'}`,
                    fontSize: 12,
                    color: testResult.ok ? '#065F46' : '#DC2626',
                  }}>
                    {testResult.ok
                      ? `Test delivered successfully (HTTP ${testResult.status})`
                      : `Test failed: ${testResult.error ?? `HTTP ${testResult.status}`}`}
                  </div>
                )}
                {testResults[hook.id] === null && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Sending test payload…</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Signature Verification</h3>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
          Every request includes an <code>X-Ahaget-Signature</code> header with value <code>sha256=&lt;hmac&gt;</code>.
          Compute <code>HMAC-SHA256(secret, raw_body)</code> and compare to verify authenticity.
          Your signing secret is shown once at creation time.
        </p>
      </div>
    </div>
  );
}
