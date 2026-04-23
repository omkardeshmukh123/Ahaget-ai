'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const SECTIONS = [
  {
    label: 'AGENT',
    items: [
      { href: '/in-page-assistant', label: 'In-Page Assistant', icon: <SparkleIcon /> },
      { href: '/flows',             label: 'User Flows',        icon: <FlowIcon /> },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/dashboard',     label: 'Dashboard',     icon: <GridIcon /> },
      { href: '/conversations', label: 'Conversations', icon: <ChatIcon /> },
      { href: '/insights',      label: 'Insights',      icon: <InsightIcon /> },
      { href: '/users',         label: 'Users',         icon: <UsersIcon /> },
    ],
  },
  {
    label: 'INTEGRATIONS',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: <BookIcon /> },
      { href: '/mcp',       label: 'MCP',       icon: <ConnectIcon /> },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { href: '/branding',         label: 'Branding',  icon: <BrushIcon /> },
      { href: '/settings/general', label: 'Settings',  icon: <GearIcon /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, org, logout } = useAuthStore();

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--surface-low)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF857A, #EBAEE6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255,133,122,0.30)',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" fill="white" fillOpacity="0.95"/>
              <path d="M9 5L13 7.5V12.5L9 15L5 12.5V7.5L9 5Z" fill="white" fillOpacity="0.25"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Prism</span>
            {org && <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{org.name}</p>}
          </div>
        </div>

        {/* CTA */}
        <button
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 12px',
            background: 'linear-gradient(135deg, #FF857A, #EBAEE6)',
            color: '#3d1008',
            fontWeight: 600, fontSize: 12,
            borderRadius: 8,
            boxShadow: '0 0 18px rgba(255,133,122,0.22)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Edit in your app
        </button>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
        {SECTIONS.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10, fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 10px 6px',
            }}>
              {label}
            </p>
            {items.map(({ href, label: itemLabel, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? 'nav-item nav-active' : 'nav-item'}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ opacity: active ? 1 : 0.55, display: 'flex', flexShrink: 0 }}>{icon}</span>
                  {itemLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(70,69,84,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,133,122,0.2), rgba(235,174,230,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--coral)',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? user?.email}
            </p>
            <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ fontSize: 11, color: 'var(--muted)', background: 'none', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* ─── Micro icons ──────────────────────────────────────────────────────────── */
function SparkleIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z"/></svg>;
}
function FlowIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><path d="M11 18H8a2 2 0 01-2-2V9"/></svg>;
}
function GridIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ChatIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function InsightIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
function UsersIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function BookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
}
function ConnectIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
}
function BrushIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.85 0 3.5-2.02 3.5-3.04a3 3 0 00-2-2.02z"/></svg>;
}
function GearIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
