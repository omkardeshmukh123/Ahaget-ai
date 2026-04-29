import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <>
      <body className="selection:bg-primary selection:text-on-primary">

<nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(193,193,255,0.04)]">
<div className="flex justify-between items-center px-12 py-6 max-w-[1440px] mx-auto">
<div className="text-2xl font-black tracking-tighter text-white">TESSERACT AI</div>
<div className="hidden md:flex gap-12">
<a className="font-['Manrope'] tracking-tight text-sm uppercase font-bold text-white/60 hover:text-white transition-colors duration-300" href="#">Product</a>
<a className="font-['Manrope'] tracking-tight text-sm uppercase font-bold text-white/60 hover:text-white transition-colors duration-300" href="#">Features</a>
<a className="font-['Manrope'] tracking-tight text-sm uppercase font-bold text-[#c1c1ff] border-b-2 border-[#c1c1ff] pb-1" href="#">Pricing</a>
<a className="font-['Manrope'] tracking-tight text-sm uppercase font-bold text-white/60 hover:text-white transition-colors duration-300" href="#">About</a>
</div>
<button className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all">
                Get started
            </button>
</div>
</nav>

<header className="relative pt-48 pb-32 px-12 overflow-hidden dot-grid">
<div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
<div className="space-y-8">
<h1 className="font-display font-extrabold text-7xl lg:text-8xl tracking-tighter leading-none">
                    Pricing that <br/> <span className="text-primary">grows with you.</span>
</h1>
<p className="text-on-surface-variant text-xl max-w-lg leading-relaxed font-light">
                    Start free. Pay only when you scale. No "Contact Sales" walls. Transparent infrastructure for modern onboarding.
                </p>
</div>
<div className="flex flex-col items-start lg:items-end gap-6">
<div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-full border border-outline-variant/10">
<button className="px-6 py-2 rounded-full text-sm font-bold bg-surface-container-highest text-on-surface transition-all">Monthly</button>
<button className="px-6 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:text-on-surface transition-all">Annual</button>
<span className="mr-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Save 20%</span>
</div>
</div>
</div>
</header>

<section className="px-12 py-24 bg-surface-container-lowest">
<div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

<div className="glass-panel p-12 rounded-xl flex flex-col gap-8 transition-all hover:translate-y-[-8px]">
<div className="space-y-4">
<h3 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface-variant">Free</h3>
<div className="flex items-baseline gap-1">
<span className="text-5xl font-black">$0</span>
<span className="text-on-surface-variant/60 font-medium">/mo</span>
</div>
<p className="text-sm text-on-surface-variant/80">Ideal for exploring the Tesseract ecosystem without risk.</p>
</div>
<ul className="space-y-5 flex-grow">
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> 3 agents
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> 100 users
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> Community support
                    </li>
</ul>
<button className="w-full py-4 rounded-full border border-outline-variant/30 font-bold hover:bg-surface-container-highest transition-all">Start building</button>
</div>

<div className="relative bg-surface-container-high p-12 rounded-xl flex flex-col gap-8 transition-all scale-105 rotate-[-1deg] shadow-[0_0_100px_rgba(110,110,244,0.15)] ring-1 ring-primary/30">
<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Most popular</div>
<div className="space-y-4">
<h3 className="font-display text-2xl font-bold uppercase tracking-widest text-primary">Pro</h3>
<div className="flex items-baseline gap-1">
<span className="text-5xl font-black text-white">$49</span>
<span className="text-primary/60 font-medium">/mo</span>
</div>
<p className="text-sm text-on-surface-variant">The standard for growing SaaS teams automating workflow.</p>
</div>
<ul className="space-y-5 flex-grow">
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 10 agents
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 2,500 users
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> MCP connectors
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Full analytics
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Email support
                    </li>
</ul>
<button className="w-full py-4 rounded-full bg-primary text-on-primary font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/10">Get Pro now</button>
</div>

<div className="glass-panel p-12 rounded-xl flex flex-col gap-8 transition-all hover:translate-y-[-8px]">
<div className="space-y-4">
<h3 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface-variant">Scale</h3>
<div className="flex items-baseline gap-1">
<span className="text-5xl font-black">$149</span>
<span className="text-on-surface-variant/60 font-medium">/mo</span>
</div>
<p className="text-sm text-on-surface-variant/80">Enterprise-grade control and compliance for large platforms.</p>
</div>
<ul className="space-y-5 flex-grow">
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> Unlimited agents
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> 10k users
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> Slack support
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> SSO &amp; SAML
                    </li>
<li className="flex items-center gap-3 text-sm text-on-surface">
<span className="material-symbols-outlined text-primary text-lg">check_circle</span> Custom SLA
                    </li>
</ul>
<button className="w-full py-4 rounded-full border border-outline-variant/30 font-bold hover:bg-surface-container-highest transition-all">Go Unlimited</button>
</div>
</div>
</section>

<section className="bg-surface-container py-12 px-12">
<div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
<h2 className="font-display text-3xl font-bold tracking-tight">Need more than Scale? <span className="text-on-surface-variant font-light">Let's build something custom.</span></h2>
<button className="group flex items-center gap-2 px-8 py-4 rounded-full border border-outline-variant/50 font-bold hover:bg-white hover:text-black transition-all">
                Book a call
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</section>

<section className="px-12 py-32 bg-surface">
<div className="max-w-[1440px] mx-auto">
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
<div className="bg-surface-container-low p-8 rounded-xl h-48 flex flex-col justify-between hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-primary text-3xl">lock_open</span>
<div>
<h4 className="font-bold text-lg">No hidden fees</h4>
<p className="text-xs text-on-surface-variant">What you see is what you pay.</p>
</div>
</div>
<div className="bg-surface-container-low p-8 rounded-xl h-64 flex flex-col justify-between hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-primary text-3xl">event_repeat</span>
<div>
<h4 className="font-bold text-lg">Cancel anytime</h4>
<p className="text-xs text-on-surface-variant">Prorated refunds on all plans.</p>
</div>
</div>
<div className="bg-surface-container-low p-8 rounded-xl h-56 flex flex-col justify-between hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
<div>
<h4 className="font-bold text-lg">SOC 2 in progress</h4>
<p className="text-xs text-on-surface-variant">Security is our priority.</p>
</div>
</div>
<div className="bg-surface-container-low p-8 rounded-xl h-44 flex flex-col justify-between hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-primary text-3xl">credit_card</span>
<div>
<h4 className="font-bold text-lg">Stripe-powered</h4>
<p className="text-xs text-on-surface-variant">Secure billing infrastructure.</p>
</div>
</div>
</div>
</div>
</section>

<section className="px-12 py-32 border-t border-outline-variant/10">
<div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
<div className="space-y-6">
<h2 className="font-display text-5xl font-extrabold tracking-tighter">Frequently <br/> asked</h2>
<a className="inline-flex items-center gap-2 text-primary font-bold group" href="#">
                    Can't find the answer? Chat with us
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">trending_flat</span>
</a>
</div>
<div className="space-y-4">

<div className="p-6 rounded-lg bg-surface-container-low/50 hover:bg-surface-container transition-colors cursor-pointer group">
<div className="flex justify-between items-center">
<span className="font-bold">What counts as a Monthly Tracked User (MTU)?</span>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
</div>
</div>
<div className="p-6 rounded-lg bg-surface-container-low/50 hover:bg-surface-container transition-colors cursor-pointer group">
<div className="flex justify-between items-center">
<span className="font-bold">Can I switch plans mid-cycle?</span>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
</div>
</div>
<div className="p-6 rounded-lg bg-surface-container-low/50 hover:bg-surface-container transition-colors cursor-pointer group">
<div className="flex justify-between items-center">
<span className="font-bold">How do MCP connectors work?</span>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
</div>
</div>
<div className="p-6 rounded-lg bg-surface-container-low/50 hover:bg-surface-container transition-colors cursor-pointer group">
<div className="flex justify-between items-center">
<span className="font-bold">Do you offer discounts for startups?</span>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
</div>
</div>
<div className="p-6 rounded-lg bg-surface-container-low/50 hover:bg-surface-container transition-colors cursor-pointer group">
<div className="flex justify-between items-center">
<span className="font-bold">Is there a limit on API calls?</span>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
</div>
</div>
</div>
</div>
</section>

<section className="px-12 py-24">
<div className="max-w-[1200px] mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-transparent p-1 bg-surface-container-high">
<div className="bg-surface-container-lowest rounded-lg py-20 px-12 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
<div className="space-y-4">
<h2 className="font-display text-4xl font-extrabold tracking-tight">Start free today.</h2>
<p className="text-on-surface-variant text-lg">No credit card required. Up and running in minutes.</p>
</div>
<button className="bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-white/10">
                    Create account
                </button>
</div>
</div>
</section>

<footer className="w-full py-24 px-12 bg-[#0e0e0e] mt-32 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#353535] before:to-transparent">
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 max-w-[1440px] mx-auto">
<div className="col-span-2">
<div className="text-xl font-bold text-white mb-4">TESSERACT AI</div>
<p className="text-white/40 text-xs tracking-widest uppercase font-['Inter']">© 2025 Tesseract AI. All rights reserved.</p>
</div>
<div className="flex flex-col gap-4">
<h5 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-2">Legal</h5>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Privacy</a>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Terms</a>
</div>
<div className="flex flex-col gap-4">
<h5 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-2">Resources</h5>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Docs</a>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Security</a>
</div>
<div className="flex flex-col gap-4">
<h5 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-2">Social</h5>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Twitter</a>
<a className="text-white/40 text-xs tracking-widest uppercase hover:text-[#c1c1ff] transition-all duration-300 hover:translate-x-1" href="#">Discord</a>
</div>
</div>
</footer>
</body>
    </>
  );
}
