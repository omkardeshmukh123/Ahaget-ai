import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <main className="pt-32 overflow-hidden">

<section className="max-w-[1440px] mx-auto px-8 mb-32">
<div className="flex flex-col lg:flex-row gap-16 items-center">
<div className="w-full lg:w-[60%]">
<h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9] mb-8 text-white">
                        Your users are <span className="text-primary italic">churning</span> right now.
                    </h1>
<p className="text-xl text-on-surface-variant max-w-xl mb-12 font-light leading-relaxed">
                        Tesseract AI is the invisible guide that walks users through your product in real-time. Stop guessing where they get stuck.
                    </p>
<div className="flex flex-wrap gap-6 items-center">
<button className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                            Start for free <span className="material-symbols-outlined">arrow_forward</span>
</button>
<button className="px-8 py-4 rounded-full font-bold border border-outline-variant/30 text-white hover:bg-surface-container transition-colors">
                            See pricing
                        </button>
</div>
</div>
<div className="w-full lg:w-[40%] relative">
<div className="glass-panel p-8 rounded-xl border border-outline-variant/10 shadow-2xl relative z-10">
<div className="flex items-center gap-3 mb-6">
<div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
<span className="text-xs uppercase tracking-widest font-bold text-primary">Tesseract Agent Active</span>
</div>
<div className="space-y-4">
<div className="bg-surface-container-high/50 p-4 rounded-lg rounded-tl-none max-w-[80%]">
<p className="text-sm">I noticed you haven't connected your CRM yet. Need help finding the API key?</p>
</div>
<div className="bg-primary/20 p-4 rounded-lg rounded-tr-none max-w-[80%] ml-auto">
<p className="text-sm text-primary">Yes, please. Where is it located?</p>
</div>
<div className="bg-surface-container-high/50 p-4 rounded-lg rounded-tl-none max-w-[90%]">
<p className="text-sm">Click the <span className="font-bold text-white">Settings</span> icon in the bottom left, then select <span className="font-bold text-white">Integrations</span>. I can highlight it for you!</p>
</div>
</div>
</div>

<div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
<div className="p-8 rounded-xl bg-surface-container-lowest border-t border-white/5">
<div className="text-4xl font-black text-primary mb-2">60%</div>
<div className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Users never finish onboarding</div>
</div>
<div className="p-8 rounded-xl bg-surface-container-low border-t border-white/5">
<div className="text-4xl font-black text-primary mb-2">3x</div>
<div className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Faster time-to-value achieved</div>
</div>
<div className="p-8 rounded-xl bg-surface-container border-t border-white/5">
<div className="text-4xl font-black text-primary mb-2">2 min</div>
<div className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Total time to install Tesseract</div>
</div>
</div>
</section>

<section className="py-20 border-y border-white/5 overflow-hidden bg-surface-container-lowest">
<p className="text-center text-xs uppercase tracking-[0.3em] font-bold text-white/30 mb-12">Trusted by teams at</p>
<div className="flex gap-16 items-center justify-center opacity-40 grayscale pointer-events-none px-8">
<img alt="Partner Logo" className="h-8 w-auto" data-alt="Minimalist abstract tech company logo with geometric shapes in white and grey" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1N7W72Yro8WDx-jEXZhhf7vVZlkNor9yQRKS95djTWzDjOm9sBAzU-kMzRv5lFZ6s-Y5KiYE3gOGUPZfm49Vl8rwFcUV7bDDTr-Pn1vXs36MwJ4PylIFC5vwC4ayreT7OCKxWabIoTQ38k0cja5rgzK5uYDk12Xc5syCOnZ0LWCGYHonrCK2wEggfeeVocNNP24AjBLa2o2Y5k9G3-r3CgiNELt1SzrnU7Gb3M9RNs2dHrsNAsKmibHoz4vpQ3PJccUqbFlgY8R0a"/>
<img alt="Partner Logo" className="h-8 w-auto" data-alt="Modern sans-serif typography logo for a global software infrastructure brand" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCXV3RcfYXQlBX2rOy0u9matAUoJSeQ3R1VCRBglbyupPzREIRQfcnlMxDIlu5PTS2qqgVKYEiSxdb53zGRYV6PbM0zGq0kiMW2ogq7Aj_x95MiFzNC9l9o4UOYbCZtQhIRPB-mvpW-bbh2FrgQJJSuW-UkF8sG8f1n5W4_Jf7pg70WcHvJjg1prIbNhCPDmt3IIj5nBNUkLvZUdCJ6eWEqXVGivNcIxQEbGTPdUTpdcAO7auw5Tf_nZGRRwtkPApiq9mUZ9T8o4JH"/>
<img alt="Partner Logo" className="h-8 w-auto" data-alt="Clean corporate logo with a stylized letter icon for a fintech startup" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHM6xkthuZiOA9lCtPeyVO3tdJyO3nTWznT-NRHLTUFUo_mZPucy9Rz1AOScA6E-kx8uq3hrhr5qHPcGWhv_gMtzitI0Ia_JZTSRRRzzfuKvEPYlPnbe1j5l4W2sKQ_4AxNd57p2IJJm5Vw1tAv_0JUgk9Sy274JR8rmSc1txA0axblvSs43aIvXYP6dfNm4wVgSSUESnoGR8G4zuqhFG5c0Q03M2BNB-tWszLKKoVOqYBPD9EH1GJNz3KtqHyRbYnPuA8-cZSl595"/>
<img alt="Partner Logo" className="h-8 w-auto" data-alt="Professional tech brand logo with a minimalist hex-shaped icon and bold text" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfdGx0DAsBYiNcXoef7jAhVUWiZy_hyw_GcMdh6FXCtQNfwfBEeGvimLVBoc491aRbFyioVfU23jn0WrKwzLXEB8Dr3a1uo1duYnzDU6oHVh0M_8ifDNmLIgzzTNuGolLGqIEE4FpmxFa-FblnmpFJBeIRAGu-_yUnEf4wRVTJq7ztzYbthNb-xFm1X0ZClZ3RSdgyjHgiYFxupp_wxLbBPXFvZpVobTwLD50uyiFjOmXxlMPvK94VT0EhbcC-HqJJ4CV_nzJrB6vI"/>
<img alt="Partner Logo" className="h-8 w-auto" data-alt="Futuristic software company logo using a sleek thin-line mark and spacing" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKXHHmdnKj0bFAUE9mZjVEQcPntqO5rFP8p3aZhzBq310rV_K-K--4yAMIJ6SloHmsinQ7C09E-JVjYoCZqp-Bjf1wIB15LAqjeQZPS0BIAU8UrFHrAnu2sMw2-as6m-sV3miz6oS9Kkw1b1X5Wo23WyX-mLIkXCAZkDIx5bopbAerJjxKcsM37GuYHf1u0o0o1Rpfsz6OXVDrMqnP4Fh7ywfRuUU9eubqyxuQ2E9RtPOqftFSOnSRP8mmkVyGC-vznOjw5kPOvS7O"/>
<img alt="Partner Logo" className="h-8 w-auto" data-alt="High-end consulting brand logo with classic serif font and premium feel" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuVy-08KHjuTHGh9jo5ZZcLspTr0_xdXQ9j4sl8fdNHjSf9OmCjBBiBuSp9HttL7c3h76R0SMWWS4E9SxInfJfmJ6EEDiGGuEa-Iky3_T5osY73LUYl0EErppE_aybhNu0u33wsBfE-kDgNxRGYehuCPWxS54wy62sYBYPv6Fqwg5jDqnxO5D8wNtw-Q6ra8rRUXDwlUdZQ4WEx75JubvEVs-BobGjhK6SNmr00b_wuQZ3XsIz6muOfDV-_holfq0UYuO9babS_XEP"/>
</div>
</section>

<section className="py-32 bg-[#0a0a0a]">
<div className="max-w-4xl mx-auto text-center px-8 mb-20">
<h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Most users give up before they ever succeed.</h2>
<p className="text-on-surface-variant text-lg">Traditional onboarding is linear. Real usage is chaotic. Tesseract fills the gap with intelligence.</p>
</div>
<div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
<div className="p-12 rounded-xl bg-surface-container-lowest flex flex-col justify-end min-h-[300px] group hover:bg-surface-container transition-colors duration-500">
<span className="text-6xl font-black text-white/10 group-hover:text-primary transition-colors mb-4">60%</span>
<p className="text-on-surface">Abandonment after the first dashboard view without guidance.</p>
</div>
<div className="p-12 rounded-xl bg-surface-container-lowest flex flex-col justify-end min-h-[300px] md:mt-12 group hover:bg-surface-container transition-colors duration-500">
<span className="text-6xl font-black text-white/10 group-hover:text-primary transition-colors mb-4">72%</span>
<p className="text-on-surface">Decrease in support tickets when AI agents proactively solve friction.</p>
</div>
<div className="p-12 rounded-xl bg-surface-container-lowest flex flex-col justify-end min-h-[300px] group hover:bg-surface-container transition-colors duration-500">
<span className="text-6xl font-black text-white/10 group-hover:text-primary transition-colors mb-4">$25k</span>
<p className="text-on-surface">Average lost revenue per month due to poor trial-to-paid conversion.</p>
</div>
</div>
</section>

<section className="space-y-0">

<div className="py-24 bg-surface rounded-t-xl">
<div className="max-w-[1440px] mx-auto px-8 flex flex-col lg:flex-row items-center gap-16">
<div className="w-full lg:w-1/2">
<div className="text-primary font-bold mb-4 flex items-center gap-2">
<span className="w-8 h-px bg-primary"></span> 01 INSTALLATION
                        </div>
<h3 className="text-4xl font-bold mb-6 font-display">Install 2 lines of code.</h3>
<p className="text-on-surface-variant text-lg mb-8">Deploy Tesseract as easily as a tracking pixel. It instantly maps your UI without manual tagging or complex selectors.</p>
</div>
<div className="w-full lg:w-1/2">
<div className="bg-surface-container-lowest p-6 rounded-xl border border-white/5 font-mono text-sm leading-relaxed shadow-2xl">
<div className="flex gap-2 mb-4">
<div className="w-3 h-3 rounded-full bg-error/40"></div>
<div className="w-3 h-3 rounded-full bg-tertiary/40"></div>
<div className="w-3 h-3 rounded-full bg-primary/40"></div>
</div>
<div className="text-on-surface/40 mb-1">&lt;script&gt;</div>
<div className="pl-4">
<span className="text-primary">window</span>.<span className="text-tertiary">tesseractSettings</span> = {"{"} <span className="text-on-surface-variant">app_id</span>: <span className="text-secondary">"px_8921"</span> {"}"};
                            </div>
<div className="pl-4">
<span className="text-primary">import</span> Tesseract AI <span className="text-primary">from</span> <span className="text-secondary">'@tesseract/agent'</span>;
                            </div>
<div className="pl-4">
                                Tesseract AI.<span className="text-tertiary">init</span>();
                            </div>
<div className="text-on-surface/40 mt-1">&lt;/script&gt;</div>
</div>
</div>
</div>
</div>

<div className="py-24 bg-surface-container-low rounded-t-xl">
<div className="max-w-[1440px] mx-auto px-8 flex flex-col lg:flex-row-reverse items-center gap-16">
<div className="w-full lg:w-1/2">
<div className="text-primary font-bold mb-4 flex items-center gap-2">
<span className="w-8 h-px bg-primary"></span> 02 OBSERVATION
                        </div>
<h3 className="text-4xl font-bold mb-6 font-display">Tesseract watches your users.</h3>
<p className="text-on-surface-variant text-lg mb-8">Our neural engine analyzes every click, hover, and rage-click to build a mental map of user intent and confusion points.</p>
</div>
<div className="w-full lg:w-1/2 relative">
<div className="aspect-video bg-surface-container rounded-xl overflow-hidden shadow-2xl relative">
<img alt="Heatmap visual" className="w-full h-full object-cover opacity-50" data-alt="Abstract UI dashboard with glowing neon heatmap overlays on buttons and navigation elements, dark mode aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3FMcXKXAD2rLaC35jtwFa4W0UCrdJUHledEn6mSeG63qkxamUHN_JDMFWnKQbiuZHfdNEg95_mwbpc3mWKe0fNL-0wVJdXLHICDxFp3ggMcrb8AhGJJI9E9iRWPuclG5iWcVlvO4lPVr73PuZfg3INHVkNVzNPlNmrQBE4IIW2i0HgUNJAxGztT88U7SOlrAKmMC86ZBM2vzRT4hmGlJI8OifaVBl9_Os2pnVl2dMnT4V65lxx2m2C8ITsdnX90GygTYPT8omp6m"/>
<div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
<div className="absolute top-1/2 left-1/3 w-20 h-20 bg-primary/20 border border-primary/40 rounded-full animate-ping"></div>
</div>
</div>
</div>
</div>

<div className="py-24 bg-surface-container rounded-t-xl">
<div className="max-w-[1440px] mx-auto px-8 flex flex-col lg:flex-row items-center gap-16">
<div className="w-full lg:w-1/2">
<div className="text-primary font-bold mb-4 flex items-center gap-2">
<span className="w-8 h-px bg-primary"></span> 03 INTERVENTION
                        </div>
<h3 className="text-4xl font-bold mb-6 font-display">AI guides them automatically.</h3>
<p className="text-on-surface-variant text-lg mb-8">Tesseract doesn't just watch. It steps in with context-aware chat, UI highlights, and proactive suggestions to get users to "Aha!" moments.</p>
</div>
<div className="w-full lg:w-1/2">
<div className="relative bg-surface-container-highest p-8 rounded-xl shadow-2xl">
<div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-4">
<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary">smart_toy</span>
</div>
<div className="font-bold">Tesseract Assistant</div>
</div>
<div className="space-y-4">
<div className="flex gap-2">
<div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
<div className="text-on-surface-variant text-sm bg-surface p-3 rounded-lg">I see you're trying to export. You need to verify your email first. Shall I resend the link?</div>
</div>
<button className="w-full py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">Resend Verification Email</button>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="py-32 max-w-[1440px] mx-auto px-8">
<h2 className="font-display text-4xl font-bold mb-16 text-center">Built for the next generation of SaaS.</h2>
<div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 h-auto md:h-[900px]">

<div className="md:col-span-2 md:row-span-1 bg-surface-container p-10 rounded-xl relative overflow-hidden group">
<div className="relative z-10">
<h4 className="text-2xl font-bold mb-4">AI that executes</h4>
<p className="text-on-surface-variant max-w-sm">Tesseract can click buttons, fill forms, and navigate workflows on behalf of the user to demonstrate value.</p>
</div>
<div className="absolute bottom-[-20%] right-[-10%] w-1/2 aspect-square bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
<span className="absolute bottom-8 right-8 material-symbols-outlined text-8xl text-white/5 group-hover:text-primary/20 transition-all duration-500">touch_app</span>
</div>

<div className="md:col-span-1 md:row-span-2 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between border-t border-white/5">
<div>
<h4 className="text-2xl font-bold mb-4">Session Replay</h4>
<p className="text-on-surface-variant">Watch exactly where users hesitated with AI-summarized "Confusion Maps."</p>
</div>
<div className="mt-8 rounded-lg overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all duration-500">
<img alt="Session Replay" className="w-full h-48 object-cover" data-alt="Close-up of a high-tech digital interface with intricate graphs and movement tracking paths on a dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlFQN5Y7eWzsaG8F_2MvnlhBFy6gorjUs2reUk8rZzv7CLroGonm07GLzmN9UuHjbJPGRn7DdnXOXvitpI7LYSEFNHlNO6r7kOMJ_qvDD67_Y9ky8epSX3Br77r5XffTZiTGWCpL0T5RO96OZXlOBb2e_0_FilHCHRGP_NsyLFDdjSRMsCPcShIYMEWtnOZSmALiUuzanzorBKRroATuOLc-zNVvbl5fwI6JsJpZlJBfb0MCE9I_29Y-x_TiPOPriJSm4fmciM2K4m"/>
</div>
</div>

<div className="md:col-span-1 md:row-span-1 bg-surface-container p-10 rounded-xl">
<span className="material-symbols-outlined text-primary mb-4">hub</span>
<h4 className="text-xl font-bold mb-2">MCP Connectors</h4>
<p className="text-on-surface-variant text-sm">Universal API standards to connect your docs, linear tasks, and slack.</p>
</div>

<div className="md:col-span-1 md:row-span-1 bg-surface-container p-10 rounded-xl">
<span className="material-symbols-outlined text-primary mb-4">auto_stories</span>
<h4 className="text-xl font-bold mb-2">Knowledge Base</h4>
<p className="text-on-surface-variant text-sm">Sync your existing Notion or GitBook docs to train your agent in seconds.</p>
</div>

<div className="md:col-span-1 md:row-span-1 bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
<span className="material-symbols-outlined text-2xl mb-2">translate</span>
<h5 className="font-bold">Multilingual</h5>
</div>
<div className="md:col-span-1 md:row-span-1 bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
<span className="material-symbols-outlined text-2xl mb-2">splitscreen</span>
<h5 className="font-bold">A/B Testing</h5>
</div>
<div className="md:col-span-1 md:row-span-1 bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center">
<span className="material-symbols-outlined text-2xl mb-2">support_agent</span>
<h5 className="font-bold">Escalation</h5>
</div>

<div className="md:col-span-1 md:row-span-1 bg-primary text-on-primary p-10 rounded-xl flex flex-col justify-center">
<h4 className="text-2xl font-black italic mb-2">99.9%</h4>
<p className="font-bold text-sm uppercase">Uptime for your users</p>
</div>
</div>
</section>

<section className="py-32 bg-surface-container-lowest rounded-t-[48px]">
<div className="max-w-[1440px] mx-auto px-8">
<div className="text-center mb-20">
<h2 className="font-display text-4xl font-bold mb-4">Simple, transparent pricing.</h2>
<p className="text-on-surface-variant">Choose the plan that fits your growth stage.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">

<div className="p-10 rounded-xl bg-surface-container border border-white/5">
<div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Free</div>
<div className="text-4xl font-black mb-6">$0 <span className="text-lg font-normal text-on-surface-variant">/mo</span></div>
<ul className="space-y-4 mb-10 text-on-surface-variant">
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> 100 Monthly Active Users</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Basic UI Guidance</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> 7-day analytics</li>
</ul>
<button className="w-full py-4 rounded-full border border-outline-variant/30 font-bold hover:bg-white/5">Get Started</button>
</div>

<div className="p-12 rounded-xl bg-surface-container-highest border-2 border-primary shadow-[0px_40px_80px_rgba(110,110,244,0.1)] relative scale-105 z-10">
<div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full">Recommended</div>
<div className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Pro</div>
<div className="text-5xl font-black mb-6">$49 <span className="text-lg font-normal text-on-surface-variant">/mo</span></div>
<ul className="space-y-4 mb-10">
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> 5,000 Monthly Active Users</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> AI Agent Execution</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Custom Knowledge Base</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Session Replay Analysis</li>
</ul>
<button className="w-full py-4 rounded-full bg-primary text-on-primary font-bold hover:brightness-110">Start Pro Trial</button>
</div>

<div className="p-10 rounded-xl bg-surface-container border border-white/5">
<div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Scale</div>
<div className="text-4xl font-black mb-6">$149 <span className="text-lg font-normal text-on-surface-variant">/mo</span></div>
<ul className="space-y-4 mb-10 text-on-surface-variant">
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> 50,000 Monthly Active Users</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Dedicated Success Manager</li>
<li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Custom Domain Proxy</li>
</ul>
<button className="w-full py-4 rounded-full border border-outline-variant/30 font-bold hover:bg-white/5">Talk to Sales</button>
</div>
</div>
</div>
</section>

<section className="py-40 relative overflow-hidden bg-primary">
<div className="absolute inset-0 opacity-20 pointer-events-none">
<div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)]"></div>
</div>
<div className="max-w-[1440px] mx-auto px-8 text-center relative z-10">
<h2 className="text-5xl md:text-7xl font-display font-black text-on-primary mb-12 tracking-tighter">Ready to fix your funnel?</h2>
<button className="bg-white text-black px-12 py-6 rounded-full text-xl font-black hover:scale-110 transition-transform shadow-2xl">
                    Start for free <span className="material-symbols-outlined align-middle ml-2">arrow_forward</span>
</button>
<p className="mt-8 text-on-primary/60 font-medium">No credit card required. 2 minute setup.</p>
</div>
</section>
</main>
    </>
  );
}
