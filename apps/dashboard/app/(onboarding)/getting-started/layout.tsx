'use client';
import { usePathname } from 'next/navigation';
import AhagetLogo from '@/components/AhagetLogo';

const STEPS = [
  { key: 'workspace',   label: 'Website URL',    desc: 'Your product domain' },
  { key: 'attribution', label: 'Discovery',       desc: 'How you found us' },
  { key: 'description', label: 'Your product',    desc: 'What you\'re building' },
  { key: 'install',     label: 'Install method',  desc: 'Add the widget' },
  { key: 'snippet',     label: 'Add snippet',     desc: 'Embed the code' },
  { key: 'verify',      label: 'Verify',          desc: 'Confirm it\'s live' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = Math.max(0, STEPS.findIndex((s) => pathname?.includes(s.key)));
  const progress = Math.round(((currentStep) / STEPS.length) * 100);

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left sidebar — dark branded panel ─────────────────────────────── */}
      <aside className="hidden lg:flex w-72 xl:w-80 flex-col flex-shrink-0 bg-gradient-to-b from-[#1A0A2E] via-[#2D1052] to-[#1A0A2E] relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[-60px] left-[-60px] w-52 h-52 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-40 h-40 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col h-full p-8">
          {/* Logo */}
          <div className="mb-10">
            <AhagetLogo size={30} showWordmark wordmarkColor="#fff" wordmarkSize={16} />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-white text-xl font-bold leading-snug mb-1">
              Set up your workspace
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Takes less than 5 minutes. No credit card required.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/40 text-xs font-medium">Progress</span>
              <span className="text-white/60 text-xs font-semibold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-violet-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <nav className="flex-1 space-y-1">
            {STEPS.map((step, i) => {
              const done   = i < currentStep;
              const active = i === currentStep;
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    active ? 'bg-white/10' : ''
                  }`}
                >
                  {/* Circle */}
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    done
                      ? 'bg-brand-500 text-white'
                      : active
                      ? 'bg-white text-brand-700 ring-2 ring-brand-400/50'
                      : 'bg-white/10 text-white/30'
                  }`}>
                    {done ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {/* Label */}
                  <div>
                    <p className={`text-sm font-semibold leading-none mb-0.5 ${
                      active ? 'text-white' : done ? 'text-white/60' : 'text-white/25'
                    }`}>
                      {step.label}
                    </p>
                    <p className={`text-xs leading-none ${
                      active ? 'text-white/50' : 'text-white/20'
                    }`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/25 text-xs leading-relaxed">
              🔒 Your data is encrypted and never shared with third parties.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right panel — form area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile-only top header */}
        <header className="lg:hidden border-b border-slate-100 bg-white px-6 py-4 flex items-center justify-between">
          <AhagetLogo size={26} showWordmark wordmarkColor="#0F0A1A" wordmarkSize={14} />
          <span className="text-xs font-medium text-slate-400">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </header>

        {/* Mobile step bar */}
        <div className="lg:hidden px-6 pt-4 pb-2">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-brand-600 font-semibold mt-1.5 uppercase tracking-wide">
            {STEPS[currentStep]?.label}
          </p>
        </div>

        {/* Form content */}
        <main className="flex-1 flex items-start justify-center px-8 py-16">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Desktop step counter at bottom */}
        <div className="hidden lg:block px-8 pb-8">
          <p className="text-xs text-slate-300">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
