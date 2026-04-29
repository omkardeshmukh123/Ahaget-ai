"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#131313]/80 backdrop-blur-xl shadow-[0px_40px_80px_rgba(110,110,244,0.04)]' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/ahaget-logo-space.jpg" alt="Ahaget" width={40} height={40} className="rounded-lg object-cover" />
          <span className="text-xl font-bold tracking-tight text-white">AHAGET <span className="text-[#c1c1ff] font-light">AI</span></span>
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link className="font-manrope tracking-tight text-sm uppercase font-semibold text-white/60 hover:text-white transition-colors duration-300" href="/#features">Platform</Link>
          <Link className="font-manrope tracking-tight text-sm uppercase font-semibold text-white/60 hover:text-white transition-colors duration-300" href="/#solutions">Solutions</Link>
          <Link className="font-manrope tracking-tight text-sm uppercase font-semibold text-white/60 hover:text-white transition-colors duration-300" href="/docs">Developers</Link>
          <Link className="font-manrope tracking-tight text-sm uppercase font-semibold text-white/60 hover:text-white transition-colors duration-300" href="/pricing">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-in` : "http://localhost:3001/sign-in"}>
            <button className="text-white/60 font-manrope tracking-tight text-sm uppercase font-semibold hover:text-white transition-colors duration-300 scale-95 active:scale-90">Log In</button>
          </Link>
          <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"}>
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-manrope tracking-tight text-sm uppercase font-bold hover:brightness-110 transition-all scale-95 active:scale-90">Get Started</button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
