'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const AGENT_NAV = [
  { href: '/in-page-assistant', label: 'In-Page Assistant', icon: '✦' },
  { href: '/flows',             label: 'User Flows',        icon: '◈' },
];

const INTEGRATIONS_NAV = [
  { href: '/knowledge', label: 'Knowledge',   icon: '◫' },
  { href: '/mcp',       label: 'MCP',         icon: '◌' },
];

const ACCOUNT_NAV = [
  { href: '/branding',  label: 'Branding',  icon: '◆' },
  { href: '/settings/general', label: 'Settings',  icon: '◑' },
];

const ANALYTICS_NAV = [
  { href: '/dashboard',      label: 'Dashboard',     icon: '▦' },
  { href: '/conversations',  label: 'Conversations', icon: '◷' },
  { href: '/insights',       label: 'Insights',      icon: '◐' },
  { href: '/users',          label: 'Users',         icon: '◉' },
];

function NavSection({ title, items }: { title: string; items: { href: string; label: string; icon: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-1.5">{title}</p>
      <div className="space-y-0.5">
        {items.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`text-sm w-4 text-center flex-shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, org, logout } = useAuthStore();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-10">
      {/* Logo + workspace */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900">Prism</span>
            {org && <p className="text-[10px] text-slate-400 truncate">{org.name}</p>}
          </div>
        </div>
        {/* Edit in your app CTA */}
        <button className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Edit in your app
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <NavSection title="Agent" items={AGENT_NAV} />
        <NavSection title="Analytics" items={ANALYTICS_NAV} />
        <NavSection title="Integrations" items={INTEGRATIONS_NAV} />
        <NavSection title="Account" items={ACCOUNT_NAV} />
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{user?.name ?? user?.email}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-[11px] text-slate-400 hover:text-red-600 text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
