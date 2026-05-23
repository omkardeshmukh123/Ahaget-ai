'use client';
import { usePathname } from 'next/navigation';

const STEPS = [
  { key: 'workspace',    label: 'Website URL' },
  { key: 'attribution', label: 'Discovery' },
  { key: 'description', label: 'Your product' },
  { key: 'install',     label: 'Install method' },
  { key: 'snippet',     label: 'Add snippet' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = STEPS.findIndex((s) => pathname?.includes(s.key));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Ahaget</span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 ${active ? '' : 'opacity-50'}`}>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done
                          ? 'bg-indigo-600 text-white'
                          : active
                          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {done ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-indigo-700' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-px ${done ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400">
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
