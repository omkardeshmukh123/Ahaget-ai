import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <>
      <main className="void-gradient pt-40 pb-20 px-6 md:px-12 max-w-[1440px] mx-auto">

<section className="flex flex-col md:flex-row justify-between items-start mb-32 gap-12">
<div className="max-w-2xl">
<h1 className="font-headline text-7xl md:text-8xl font-extrabold tracking-tighter text-on-background mb-8">
                    Let's talk<span className="text-primary">.</span>
</h1>
<p className="font-body text-xl md:text-2xl text-on-surface-variant leading-relaxed max-w-xl">
                    Whether you're Evaluating Tesseract, need help, or just want to say hi — we respond within a few hours.
                </p>
</div>
<div className="flex flex-col gap-4 mt-8 md:mt-24">
<div className="bg-surface-container border border-outline-variant/10 p-6 rounded-lg backdrop-blur-xl">
<p className="text-primary font-headline font-bold text-lg mb-1">Avg response time: 2 hours</p>
<p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Global Priority Support</p>
</div>
<div className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-lg ml-0 md:ml-8">
<p className="text-on-surface font-headline font-semibold text-lg mb-1">Team timezone: IST / EST overlap</p>
<p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Always active coverage</p>
</div>
</div>
</section>

<section className="grid grid-cols-1 lg:grid-cols-10 gap-12 mb-40">

<div className="lg:col-span-6 glass-card p-8 md:p-12 rounded-xl border border-primary/5">
<form className="space-y-8">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">Full Name</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 focus:outline-none focus:border-primary/50 transition-colors text-on-surface" placeholder="John Doe" type="text"/>
</div>
<div className="space-y-2">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">Work Email</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 focus:outline-none focus:border-primary/50 transition-colors text-on-surface" placeholder="john@company.com" type="email"/>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">Company</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 focus:outline-none focus:border-primary/50 transition-colors text-on-surface" placeholder="Acme Corp" type="text"/>
</div>
<div className="space-y-2">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">Role</label>
<input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 focus:outline-none focus:border-primary/50 transition-colors text-on-surface" placeholder="Product Manager" type="text"/>
</div>
</div>
<div className="space-y-4">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">What brings you here?</label>
<div className="flex flex-wrap gap-3">
<button className="px-5 py-2 rounded-full border border-outline-variant/20 hover:border-primary/50 text-sm font-medium transition-all text-on-surface-variant" type="button">Evaluating Tesseract</button>
<button className="px-5 py-2 rounded-full border border-primary bg-primary/10 text-primary text-sm font-medium transition-all" type="button">Pricing question</button>
<button className="px-5 py-2 rounded-full border border-outline-variant/20 hover:border-primary/50 text-sm font-medium transition-all text-on-surface-variant" type="button">Technical support</button>
<button className="px-5 py-2 rounded-full border border-outline-variant/20 hover:border-primary/50 text-sm font-medium transition-all text-on-surface-variant" type="button">Partnership</button>
<button className="px-5 py-2 rounded-full border border-outline-variant/20 hover:border-primary/50 text-sm font-medium transition-all text-on-surface-variant" type="button">Just curious</button>
</div>
</div>
<div className="space-y-2">
<label className="text-sm font-label uppercase tracking-widest text-on-surface-variant/60 ml-1">Message</label>
<textarea className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-4 focus:outline-none focus:border-primary/50 transition-colors text-on-surface resize-none" placeholder="Tell us how we can help..." rows={5}></textarea>
</div>
<button className="w-full md:w-auto bg-primary text-on-primary px-10 py-5 rounded-full font-headline font-bold text-lg hover:shadow-[0_0_30px_rgba(193,193,255,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3">
                        Send message 
                        <span className="material-symbols-outlined">arrow_forward</span>
</button>
</form>
</div>

<div className="lg:col-span-4 flex flex-col gap-6">
<div className="bg-surface-container-low p-8 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
<div>
<p className="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">Email us</p>
<p className="text-2xl font-headline font-semibold">hello@usetesseract.ai</p>
</div>
<span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">alternate_email</span>
</div>
<div className="bg-primary/5 border border-primary/10 p-8 rounded-xl">
<p className="text-sm font-label uppercase tracking-widest text-primary mb-2">Book a demo</p>
<p className="text-xl font-headline font-medium text-on-surface-variant mb-6">Deep dive into the engine with our specialists.</p>
<button className="flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
                        Schedule <span className="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<div className="bg-surface-container-low p-8 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
<div>
<p className="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">Chat on Slack</p>
<p className="text-2xl font-headline font-semibold">Join Community</p>
</div>
<span className="material-symbols-outlined text-primary">forum</span>
</div>
<div className="bg-surface-container-low p-8 rounded-xl">
<p className="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-4">Based in</p>
<div className="flex gap-12">
<div>
<p className="font-headline font-bold text-on-surface">Bengaluru</p>
<p className="text-sm text-on-surface-variant">India HQ</p>
</div>
<div>
<p className="font-headline font-bold text-on-surface">San Francisco</p>
<p className="text-sm text-on-surface-variant">US Ops</p>
</div>
</div>
</div>
</div>
</section>

<section className="mb-40 overflow-hidden">
<h2 className="font-headline text-4xl font-bold mb-16 px-4">Meet the team</h2>
<div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start px-4">

<div className="w-full md:w-72 bg-surface-container-high rounded-xl overflow-hidden transition-transform hover:-translate-y-2">
<div className="h-64 bg-surface-container-highest relative overflow-hidden">
<img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" data-alt="professional portrait of a creative director with dramatic noir lighting and minimal dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApmeRpcwqEYYhfGW7jdC91tgk4CY3Vo2mDH0KQ5iDrRC_2aNADds92kdUsz3Mdmm4pSuc-doGCWTNmMmX8vCqyGflczSjLlvnmXlJrGqMChp5FAc1xexp9epiEdqtIOdeSRlCXPyd2eLnyHQhTfFsw8jDNPD1Wt6GQ_2mnLT1IG5_nzgtHymcrMykCLCKFjAvnjy2NbvcvEFvG_x5EzHv1BB2QEWRhwriWe_icSqa4Wd0q0rMCUeScdgt8zHQyrVNYiVZkBXGSCvsl"/>
</div>
<div className="p-6">
<p className="font-headline font-bold text-xl">Arjun K.</p>
<p className="text-primary text-sm font-label uppercase tracking-widest mb-4">Founder &amp; Product</p>
<p className="text-on-surface-variant text-sm italic">"Building the future, one prompt at a time."</p>
</div>
</div>

<div className="w-full md:w-72 bg-surface-container-high rounded-xl overflow-hidden mt-0 md:mt-12 transition-transform hover:-translate-y-2">
<div className="h-80 bg-surface-container-highest relative overflow-hidden">
<img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" data-alt="close-up portrait of a female software engineer in a modern workspace with neon blue reflections" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJY7LZqsUFbsdzKuwxurvNKW5KhpS8owPmQTJj9ewD_HPZsWSgWB6O4eIzre9X0Jc-ZgJmY7yDbXiCddE4Pa7lLxIxE97AN6CcAh3zYCYsMsjCyjFSxuvhToIWqh5td17tAoFGGSWx_skIbnhtR8m1-XYTpMC3sByQIgOHh3hRN9PXxwX3g8lUsKgBb2eFi0PSRCdwxnyi-SE1JdqdRoBUQQjyBcURoN2ty1gM7yGpVvBzCVboxbqC_pXU7vRHDCGMNQHeItCr4YPO"/>
</div>
<div className="p-6">
<p className="font-headline font-bold text-xl">Sarah L.</p>
<p className="text-primary text-sm font-label uppercase tracking-widest mb-4">Engineering Head</p>
<p className="text-on-surface-variant text-sm italic">"Making AI feel like magic but run like clockwork."</p>
</div>
</div>

<div className="w-full md:w-72 bg-surface-container-high rounded-xl overflow-hidden mt-0 md:-mt-8 transition-transform hover:-translate-y-2">
<div className="h-64 bg-surface-container-highest relative overflow-hidden">
<img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" data-alt="portrait of a confident tech leader in a dark tailored suit with architectural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXtPLH_azhgqdwcfvFnC954tdqBf4JXOLNsMscacd45g0JUd0-e7fgMVhZno1iaM1bnlzosBHEjGwZ2t_leHgHkOtJLzMR7DYvGJvmcNDhstp0w-E6cCG_qD_Q9hRmPKyc6dj3nUbqLfPd-5X04J4xambZEKX7io3og8IZRt28FSPHd94FSc4g-IZ_N_PcT-tP6bXAL_mxi9V-9DUzynth1KcbmHuhygioXcgEz-_dFjJh7xUKaDVFfwUFxJ9oMuu0nIuh3kuF5x0h"/>
</div>
<div className="p-6">
<p className="font-headline font-bold text-xl">Marcus V.</p>
<p className="text-primary text-sm font-label uppercase tracking-widest mb-4">Customer Success</p>
<p className="text-on-surface-variant text-sm italic">"Your success is my only metric."</p>
</div>
</div>

<div className="w-full md:w-72 bg-surface-container-high rounded-xl overflow-hidden mt-0 md:mt-16 transition-transform hover:-translate-y-2">
<div className="h-72 bg-surface-container-highest relative overflow-hidden">
<img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" data-alt="professional portrait of a product designer in a minimalist dark studio setting with soft indigo lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnifqE1UBdvUSEJUuRO10BQRdNeH1uluRKemQ3KFM9gC1VDZJvv5yEc5U8oDPywTSLVocEhA4blvQ7fnfv3Zg3HNFXfAtywRKwtG3ZzUCUIQPj6GeIIZoA7QY8_NOExVE0i-V8c9Wu89GTBo5V3uMmRmka18Ir-dtIaSd5gS6mASoNZ7B5oZ2iSqIIJ2vVzrJndAK-ZUcOwWkkqexfXz5glYjV0bRjpRJiA0lOgFAaHgVs55E1v9o-nuGwqZZtef_I9WSbhxsg2VSN"/>
</div>
<div className="p-6">
<p className="font-headline font-bold text-xl">Elena R.</p>
<p className="text-primary text-sm font-label uppercase tracking-widest mb-4">Design Partner</p>
<p className="text-on-surface-variant text-sm italic">"Designing the void between data and human."</p>
</div>
</div>
</div>
</section>

<section className="max-w-3xl mb-40">
<h2 className="font-headline text-3xl font-bold mb-12">Common questions</h2>
<div className="space-y-0">
<div className="group py-6 border-b border-outline-variant/10 cursor-pointer">
<div className="flex justify-between items-center mb-2">
<h3 className="text-xl font-headline font-medium group-hover:text-primary transition-colors">How long does integration take?</h3>
<span className="material-symbols-outlined text-primary group-hover:rotate-45 transition-transform">add</span>
</div>
<p className="text-on-surface-variant/80 hidden group-hover:block transition-all">Most SaaS platforms go live in under 48 hours with our zero-code injection layer.</p>
</div>
<div className="group py-6 border-b border-outline-variant/10 cursor-pointer">
<div className="flex justify-between items-center mb-2">
<h3 className="text-xl font-headline font-medium group-hover:text-primary transition-colors">Do you offer custom pricing?</h3>
<span className="material-symbols-outlined text-primary group-hover:rotate-45 transition-transform">add</span>
</div>
<p className="text-on-surface-variant/80 hidden group-hover:block transition-all">Yes, we provide enterprise-grade licensing for high-volume platforms and startups alike.</p>
</div>
<div className="group py-6 border-b border-outline-variant/10 cursor-pointer">
<div className="flex justify-between items-center mb-2">
<h3 className="text-xl font-headline font-medium group-hover:text-primary transition-colors">Can I use Tesseract for free?</h3>
<span className="material-symbols-outlined text-primary group-hover:rotate-45 transition-transform">add</span>
</div>
<p className="text-on-surface-variant/80 hidden group-hover:block transition-all">Absolutely. Our free tier allows you to test Tesseract on up to 100 monthly active users.</p>
</div>
</div>
</section>

<section className="mb-40 text-center py-32 rounded-xl bg-surface-container relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
<div className="relative z-10">
<h2 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter mb-10">Ready to get started?</h2>
<button className="bg-white text-background px-12 py-6 rounded-full font-headline font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
                    Create your agent
                </button>
</div>
</section>
</main>
    </>
  );
}
