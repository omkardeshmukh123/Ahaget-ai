export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-1">
              <svg width="32" height="32" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#8A2BE2" fillRule="evenodd" clipRule="evenodd" d="M48.6 36A24 24 0 1 0 38 48.8L38 36ZM43 21A11 11 0 1 0 21 21A11 11 0 1 0 43 21Z"/>
              </svg>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Ahaget</span>
            </div>
            <p className="text-sm text-slate-500">AI-guided onboarding that converts</p>
          </div>
          {children}
        </div>
      </div>

      {/* Right — preview panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden px-12">
        {/* Background orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-white opacity-5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-15%] w-80 h-80 rounded-full bg-white opacity-5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-8 backdrop-blur-sm border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trusted by 500+ SaaS teams
          </div>

          {/* Fake assistant widget preview */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-8 text-left shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                P
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">Ahaget Assistant</p>
                <div className="bg-white/10 rounded-xl rounded-tl-none px-3.5 py-2.5">
                  <p className="text-white/90 text-sm leading-relaxed">
                    👋 Hi! It looks like you haven't connected your data source yet. Want me to walk you through it? It only takes 2 minutes.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-11">
              <button className="bg-white text-indigo-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-white/90 transition-colors">
                Yes, help me →
              </button>
              <button className="bg-white/10 text-white/80 text-xs font-medium px-3.5 py-1.5 rounded-lg border border-white/10">
                Not now
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
            Guide users to their<br/>first "aha" moment
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Ahaget's AI assistant appears inside your app and proactively helps users complete onboarding — no code changes needed.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            {[
              { value: '3.4×', label: 'higher conversion' },
              { value: '62%', label: 'less time to value' },
              { value: '91%', label: 'CSAT score' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
