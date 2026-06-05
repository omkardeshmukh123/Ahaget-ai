'use client';
import { usePathname } from 'next/navigation';
import AhagetLogo from '@/components/AhagetLogo';

const STEPS = [
  { key: 'workspace',    label: 'Website URL' },
  { key: 'attribution', label: 'Discovery' },
  { key: 'description', label: 'Your product' },
  { key: 'install',     label: 'Install method' },
  { key: 'snippet',     label: 'Add snippet' },
  { key: 'verify',      label: 'Verify' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = STEPS.findIndex((s) => pathname?.includes(s.key));
  const activeStepLabel = STEPS[currentStep]?.label ?? '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50/30">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between gap-8">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <AhagetLogo size={28} showWordmark wordmarkColor="#0F0A1A" wordmarkSize={15} />
          </div>

          {/* Step progress — dots only, no inline labels */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex items-center">
                    {/* Step dot */}
                    <div
                      title={step.label}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        done
                          ? 'bg-brand-600 text-white shadow-sm'
                          : active
                          ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {done ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {/* Connector */}
                    {i < STEPS.length - 1 && (
                      <div className={`w-10 h-0.5 transition-colors duration-200 ${done ? 'bg-brand-300' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active step label — shown below the dots row */}
            {activeStepLabel && (
              <span className="text-[11px] font-semibold text-brand-600 tracking-wide uppercase">
                {activeStepLabel}
              </span>
            )}
          </div>

          {/* Step counter */}
          <div className="flex-shrink-0 text-xs font-medium text-slate-400 whitespace-nowrap">
            Step {Math.max(1, currentStep + 1)} of {STEPS.length}
          </div>

        </div>
      </header>

      {/* Content */}
      <main className="max-w-xl mx-auto px-6 py-14">
        {children}
      </main>
    </div>
  );
}
