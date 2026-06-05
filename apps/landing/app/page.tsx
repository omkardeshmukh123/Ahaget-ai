'use client';

import { useState, useEffect, useRef } from 'react';

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.ahaget.ai';
const SIGNUP_URL = `${DASHBOARD_URL}/register`;

// ─────────────────────────────────────────────────────────────────────────────
// ICONS (inline SVGs — no external icon library needed)
// ─────────────────────────────────────────────────────────────────────────────

function IconBot() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: 'https://docs.ahaget.ai' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-white/[0.08] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <img src="/logo-mark.png" alt="Ahaget" width={32} height={32} className="group-hover:opacity-90 transition-opacity duration-300" style={{objectFit:'contain'}} />
            <span className="text-white font-bold text-xl tracking-tight">Ahaget</span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={DASHBOARD_URL}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              Sign in
            </a>
            <a
              href={SIGNUP_URL}
              className="shimmer-btn inline-flex items-center gap-2 bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] hover:from-[#9B42F0] hover:to-[#8A2BE2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-glow hover:shadow-glow-lg"
            >
              Sign up free
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/[0.08] pt-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-white/60 hover:text-white text-sm font-medium transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={SIGNUP_URL}
              className="block w-full text-center bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white text-sm font-semibold px-4 py-2.5 rounded-lg mt-2"
              onClick={() => setMobileOpen(false)}
            >
              Sign up free
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET MOCKUP
// ─────────────────────────────────────────────────────────────────────────────

function WidgetMockup() {
  const messages = [
    { from: 'ai', text: "👋 Welcome! I'm your AI guide. Ready to get started?" },
    { from: 'user', text: 'Yes! What should I do first?' },
    { from: 'ai', text: '🚀 Let\'s connect your data source. It only takes 2 minutes!' },
    { from: 'ai', text: '✅ Great job! You\'ve completed onboarding. Here\'s what\'s next...' },
  ];

  return (
    <div className="relative animate-float">
      {/* Glow rings */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8A2BE2]/20 to-[#B06CF5]/20 blur-xl scale-110" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8A2BE2]/10 to-pink-500/10 blur-2xl scale-125" />

      {/* Widget container */}
      <div className="relative glass widget-glow rounded-2xl overflow-hidden w-80 md:w-96">
        {/* Widget header */}
        <div className="bg-gradient-to-r from-[#8A2BE2]/80 to-[#7B22C9]/80 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Ahaget AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white/70 text-xs">Online — here to help</p>
            </div>
          </div>
          <div className="ml-auto flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-surface px-4 py-2 border-b border-white/[0.06]">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Onboarding Progress</span>
            <span className="text-[#B06CF5] font-medium">75%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8A2BE2] to-[#B06CF5] rounded-full"
              style={{ width: '75%' }}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-surface p-4 space-y-3 h-52 overflow-hidden">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.from === 'ai'
                    ? 'bg-white/[0.07] text-white/80 rounded-tl-sm'
                    : 'bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white rounded-tr-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="bg-surface border-t border-white/[0.06] px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/30">
            Ask anything...
          </div>
          <button className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-1.5 flex items-center gap-1.5 animate-float-slow border border-emerald-500/30">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs text-white/80 font-medium">Churn risk detected</span>
      </div>
      <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-1.5 animate-float border border-[#8A2BE2]/30" style={{ animationDelay: '2s' }}>
        <span className="text-xs text-white/80 font-medium">+34% activation rate 📈</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const words = ['Onboards', 'Retains', 'Supports', 'Activates', 'Delights'];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-gradient-radial from-[#4B0082]/20 via-transparent to-transparent" />

      {/* Orbs */}
      <div className="orb w-[600px] h-[600px] bg-[#8A2BE2]/15 -top-40 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-purple-600/10 -bottom-20 -right-40" />
      <div className="orb w-[300px] h-[300px] bg-pink-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-[#8A2BE2]/30 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/70 font-medium">
                AI-powered user lifecycle — now in beta
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-in-up delay-100">
              <span className="text-white">The AI that</span>
              <br />
              <span
                key={wordIndex}
                className="gradient-text animate-fade-in"
                style={{ display: 'inline-block' }}
              >
                {words[wordIndex]}
              </span>
              <br />
              <span className="text-white">your users</span>
            </h1>

            {/* Sub */}
            <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up delay-200">
              Drop 2 lines of code into your SaaS. Ahaget&apos;s AI widget handles
              onboarding, prevents churn, answers questions, and drives adoption —{' '}
              <span className="text-white/80 font-medium">for every user, automatically.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-300">
              <a
                href={SIGNUP_URL}
                className="shimmer-btn group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] hover:from-[#9B42F0] hover:to-[#8A2BE2] text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Start free — no credit card
                <IconArrowRight />
              </a>
              <a
                href="#how-it-works"
                className="group inline-flex items-center justify-center gap-2.5 glass hover:bg-white/[0.08] text-white/80 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 border border-white/[0.12] hover:border-white/20"
              >
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#8A2BE2]/20 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white ml-0.5">
                    <path d="M6.3 2.841A1.5 1.5 0 004.5 4.11V19.89a1.5 1.5 0 002.36 1.228l13.5-8.88a1.5 1.5 0 000-2.538L6.86 2.87a1.5 1.5 0 00-.56-.029z" />
                  </svg>
                </span>
                See how it works
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start mt-10 animate-fade-in-up delay-400">
              {[
                { value: '10 min', label: 'to deploy' },
                { value: '3×', label: 'activation rate' },
                { value: '68%', label: 'churn reduced' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black gradient-text">{stat.value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Widget Mockup */}
          <div className="flex justify-center lg:justify-end animate-fade-in delay-500">
            <WidgetMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL PROOF / LOGOS
// ─────────────────────────────────────────────────────────────────────────────

function SocialProof() {
  const companies = [
    'Flowbase', 'Nexus HQ', 'Prismatic', 'LoopStack', 'Cloudwave',
    'Meridian', 'Synthio', 'Vaultify', 'Orbitly', 'Patchwork',
  ];

  return (
    <section className="py-16 border-y border-white/[0.06] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-surface/30 to-background" />
      <div className="relative max-w-7xl mx-auto px-4">
        <p className="text-center text-white/35 text-sm font-medium uppercase tracking-widest mb-10">
          Trusted by fast-growing SaaS teams worldwide
        </p>
        <div className="overflow-hidden relative">
          {/* Fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="marquee-inner">
            {[...companies, ...companies].map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-white/25 hover:text-white/50 transition-colors whitespace-nowrap"
              >
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white/40">{name[0]}</span>
                </div>
                <span className="text-sm font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote: "Ahaget cut our trial-to-paid conversion time by 40%. The AI handles onboarding questions we used to answer manually — and it's always on.",
    name: 'Rohan Kapoor',
    title: 'CEO, FlowBase',
    initials: 'RK',
    color: 'from-[#8A2BE2] to-[#B06CF5]',
  },
  {
    quote: "We saw a 60% drop in support tickets within a week of deploying Ahaget. Users now self-serve answers we used to field over email every day.",
    name: 'Priya Mehta',
    title: 'Head of Product, Nexus HQ',
    initials: 'PM',
    color: 'from-rose-500 to-pink-500',
  },
  {
    quote: "Ahaget surfaced a churn segment we had absolutely no visibility into. Three of those users upgraded after the AI reached out. Mind-blowing.",
    name: 'Arjun Singh',
    title: 'Founder, LoopStack',
    initials: 'AS',
    color: 'from-emerald-500 to-teal-500',
  },
];

function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/8 right-0 top-0 translate-x-1/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 border border-[#8A2BE2]/20">
            <span className="text-sm">⭐</span>
            <span className="text-sm text-[#B06CF5] font-medium">What teams are saying</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Real results. Real teams.
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Fast-growing SaaS teams trust Ahaget to run their user lifecycle on autopilot.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`glass glass-hover rounded-2xl p-7 flex flex-col transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-sm">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <IconBot />,
    title: 'AI Onboarding',
    description:
      'Personalized, context-aware onboarding flows that adapt to each user\'s role, goal, and behavior — fully automated.',
    color: 'from-[#8A2BE2] to-[#7B22C9]',
    glow: 'rgba(138,43,226,0.25)',
  },
  {
    icon: <IconShield />,
    title: 'Churn Prevention',
    description:
      'Detect at-risk users before they cancel. Ahaget proactively reaches out, resolves friction, and wins them back.',
    color: 'from-rose-500 to-pink-600',
    glow: 'rgba(244,63,94,0.25)',
  },
  {
    icon: <IconBell />,
    title: 'Proactive Messaging',
    description:
      'Send perfectly-timed in-app messages, nudges, and feature announcements based on each user\'s journey stage.',
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(249,115,22,0.25)',
  },
  {
    icon: <IconBook />,
    title: 'Knowledge Base',
    description:
      'Connect your docs, FAQs, and help content. Ahaget answers support questions instantly using your own knowledge.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    icon: <IconGlobe />,
    title: 'Hindi & Hinglish',
    description:
      'Built-in multilingual support including Hindi and Hinglish — reach Bharat\'s massive SaaS user base natively.',
    color: 'from-sky-500 to-blue-600',
    glow: 'rgba(14,165,233,0.25)',
  },
  {
    icon: <IconChart />,
    title: 'Analytics & Insights',
    description:
      'Deep lifecycle analytics: activation funnels, feature adoption rates, churn signals, and AI-generated action items.',
    color: 'from-purple-500 to-violet-600',
    glow: 'rgba(168,85,247,0.25)',
  },
];

function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 relative">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 border border-[#8A2BE2]/20">
            <IconZap />
            <span className="text-sm text-[#B06CF5] font-medium">Everything you need</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            One AI. Every user journey.
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Ahaget bundles six mission-critical user lifecycle capabilities into a single embeddable widget — no engineering resources required.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass glass-hover rounded-2xl p-6 relative overflow-hidden group transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow}, transparent 70%)` }}
              />

              {/* Icon */}
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-white">{feature.icon}</span>
              </div>

              <h3 className="relative text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="relative text-white/50 text-sm leading-relaxed">{feature.description}</p>

              {/* Arrow on hover */}
              <div className="relative mt-4 flex items-center gap-1 text-[#B06CF5] text-sm font-medium opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                <span>Learn more</span>
                <IconArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      step: '01',
      icon: <IconCode />,
      title: 'Paste 2 lines of code',
      description:
        'Add our lightweight widget script to your app. Works with React, Vue, Angular, plain HTML — anywhere.',
      code: `<script src="https://cdn.ahaget.ai/widget.js"
  data-key="YOUR_API_KEY">
</script>`,
      color: 'from-[#8A2BE2] to-[#7B22C9]',
    },
    {
      step: '02',
      icon: <IconZap />,
      title: 'Build flows in 5 minutes',
      description:
        'Use our no-code dashboard to create onboarding flows, churn alerts, and messaging campaigns visually.',
      color: 'from-violet-500 to-pink-500',
    },
    {
      step: '03',
      icon: <IconUsers />,
      title: 'AI handles every user',
      description:
        'Ahaget monitors, engages, and supports each user automatically — 24/7, at scale, in any language.',
      color: 'from-pink-500 to-orange-500',
    },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2D0075]/10 to-transparent" />
      <div className="orb w-[400px] h-[400px] bg-purple-600/10 -left-40 top-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 border border-[#8A2BE2]/20">
            <span className="text-purple-400 text-sm">⚡</span>
            <span className="text-sm text-purple-400 font-medium">Up in minutes</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            How it works
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From zero to an AI-powered user lifecycle in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting lines (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-gradient-to-r from-[#8A2BE2]/50 via-purple-500/50 to-pink-500/50" />

          {steps.map((step, i) => (
            <div
              key={step.step}
              className={`relative transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Step number */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white flex-shrink-0 shadow-glow`}>
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-white/10">{step.step}</span>
              </div>

              <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">{step.description}</p>

              {/* Code snippet for step 1 */}
              {step.code && (
                <div className="glass rounded-xl p-4 border border-white/[0.08] mt-4">
                  <pre className="text-emerald-400 text-xs leading-relaxed font-mono overflow-x-auto">
                    {step.code}
                  </pre>
                </div>
              )}

              {/* Optional visual for step 2 */}
              {i === 1 && (
                <div className="glass rounded-xl p-4 border border-white/[0.08] mt-4 space-y-2">
                  {['Onboarding Flow', 'Churn Alert Campaign', 'Feature Adoption Nudge'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white/60 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional visual for step 3 */}
              {i === 2 && (
                <div className="glass rounded-xl p-4 border border-white/[0.08] mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-xs">Active sessions</span>
                    <span className="text-emerald-400 text-xs font-bold">2,847 online</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[87%]" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceInr: '₹0',
    period: 'forever',
    description: 'Perfect for indie hackers and early-stage products.',
    highlight: false,
    cta: 'Start for free',
    features: [
      'Up to 250 MAU',
      '1 onboarding flow',
      'Basic widget',
      'Email support',
      'Community access',
    ],
  },
  {
    name: 'Starter',
    price: '$99',
    priceInr: '₹7,999',
    period: 'per month',
    description: 'For growing SaaS products ready to automate user success.',
    highlight: false,
    cta: 'Start Starter',
    features: [
      'Up to 2,500 MAU',
      'Unlimited flows',
      'Churn prevention alerts',
      'Knowledge base (10 docs)',
      'Hindi & Hinglish support',
      'Analytics dashboard',
      'Priority email support',
    ],
  },
  {
    name: 'Growth',
    price: '$299',
    priceInr: '₹24,999',
    period: 'per month',
    description: 'For scale-ups that want full AI automation across every user.',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Growth',
    features: [
      'Up to 15,000 MAU',
      'Everything in Starter',
      'AI proactive messaging',
      'Unlimited knowledge base',
      'A/B testing for flows',
      'Custom branding',
      'Slack support',
      'Advanced analytics + exports',
    ],
  },
  {
    name: 'Scale',
    price: '$999',
    priceInr: '₹79,999',
    period: 'per month',
    description: 'Enterprise-grade for high-volume SaaS businesses.',
    highlight: false,
    cta: 'Contact sales',
    features: [
      'Unlimited MAU',
      'Everything in Growth',
      'Dedicated AI training',
      'SSO / SAML',
      'SLA guarantee',
      'Custom integrations',
      'Dedicated CSM',
      'White-glove onboarding',
    ],
  },
];

function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [billing, setBilling] = useState<'usd' | 'inr'>('usd');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-24 relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="orb w-[500px] h-[500px] bg-[#8A2BE2]/8 right-0 top-0 translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">💰 Simple pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Start free. Scale as you grow.
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
            No setup fees. No long-term contracts. Cancel anytime.
          </p>

          {/* Currency toggle */}
          <div className="inline-flex items-center glass rounded-xl p-1 border border-white/[0.08]">
            <button
              onClick={() => setBilling('usd')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                billing === 'usd'
                  ? 'bg-[#8A2BE2] text-white shadow-glow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setBilling('inr')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                billing === 'inr'
                  ? 'bg-[#8A2BE2] text-white shadow-glow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              INR ₹
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 transition-all duration-700 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#8A2BE2]/20 to-[#7B22C9]/10 popular-ring'
                  : 'glass'
              } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8A2BE2] to-[#B06CF5] text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'gradient-text' : 'text-white'}`}>
                    {billing === 'usd' ? plan.price : plan.priceInr}
                  </span>
                </div>
                <p className="text-white/35 text-xs mt-1">{plan.period}</p>
              </div>

              {/* CTA */}
              <a
                href={plan.name === 'Scale' ? 'mailto:sales@ahaget.ai' : SIGNUP_URL}
                className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 mb-6 ${
                  plan.highlight
                    ? 'shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] hover:from-[#9B42F0] hover:to-[#8A2BE2] text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02]'
                    : 'glass hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/20'
                }`}
              >
                {plan.cta}
              </a>

              {/* Divider */}
              <div className="border-t border-white/[0.06] mb-4" />

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-[#B06CF5]' : 'text-emerald-500'}`}>
                      <IconCheck />
                    </span>
                    <span className="text-white/60 text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compare note */}
        <p className="text-center text-white/30 text-sm mt-8">
          All plans include SSL, 99.9% uptime SLA, and GDPR compliance. &nbsp;
          <a href="#" className="text-[#B06CF5] hover:text-[#C490F7] underline underline-offset-2">
            Compare all features →
          </a>
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA SECTION
// ─────────────────────────────────────────────────────────────────────────────

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4B0082]/20 via-[#7B22C9]/10 to-background" />
      <div className="orb w-[600px] h-[600px] bg-[#8A2BE2]/20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div
          className={`transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 border border-[#8A2BE2]/30">
            <span className="text-lg">🚀</span>
            <span className="text-sm text-[#C490F7] font-medium">Ready to deploy in minutes</span>
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span className="text-white">Stop losing users.</span>
            <br />
            <span className="gradient-text">Start keeping them.</span>
          </h2>

          <p className="text-white/55 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join hundreds of SaaS teams using Ahaget to automate their user lifecycle.
            Free to start, no credit card needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={SIGNUP_URL}
              className="shimmer-btn group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] hover:from-[#9B42F0] hover:to-[#8A2BE2] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Create free account
              <IconArrowRight />
            </a>
            <a
              href="mailto:hello@ahaget.ai"
              className="group inline-flex items-center justify-center gap-2 glass hover:bg-white/[0.08] text-white/70 hover:text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-200 border border-white/[0.12] hover:border-white/20"
            >
              Talk to us
            </a>
          </div>

          {/* Reassurance */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/35 text-sm">
            {[
              '✓ Free forever plan',
              '✓ No credit card required',
              '✓ Deploy in 10 minutes',
              '✓ Cancel anytime',
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  const columns = [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Changelog', href: '#' },
        { label: 'Roadmap', href: '#' },
        { label: 'Status', href: '#' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'SDKs', href: '#' },
        { label: 'Examples', href: '#' },
        { label: 'GitHub', href: '#' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Contact', href: 'mailto:hello@ahaget.ai' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'GDPR', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-surface/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/logo-mark.png" alt="Ahaget" width={28} height={28} style={{objectFit:'contain'}} />
              <span className="text-white font-bold text-lg">Ahaget</span>
            </a>
            <p className="text-white/40 text-sm leading-relaxed mb-4">
              The AI employee for SaaS user lifecycle management.
            </p>
            <div className="flex gap-3">
              {/* Twitter */}
              <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors border border-white/[0.08]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.737l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors border border-white/[0.08]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">
            © {new Date().getFullYear()} Ahaget, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-white/25 text-sm">
            <span>Made with</span>
            <span className="text-rose-500">♥</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <SocialProof />
      <TestimonialsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
