"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0e0e0e] w-full mt-0">
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-12 py-20 max-w-7xl mx-auto gap-16">
        <div className="space-y-6 max-w-xs">
          <div className="flex items-center gap-3">
            <Image src="/ahaget-logo-space.jpg" alt="Ahaget" width={36} height={36} className="rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight text-white">AHAGET <span className="text-[#c1c1ff] font-light">AI</span></span>
          </div>
          <p className="text-white/40 text-sm leading-relaxed">The intelligent onboarding agent for SaaS. Guides users through your product in real-time, automatically.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-1 justify-end w-full md:w-auto">
          <div className="space-y-4">
            <h4 className="text-primary font-bold text-xs uppercase tracking-widest">Product</h4>
            <ul className="space-y-2 text-white/40 text-sm">
              <li><Link className="hover:text-primary transition-all" href="/#features">Features</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/#integrations">Integrations</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/pricing">Enterprise</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-primary font-bold text-xs uppercase tracking-widest">Company</h4>
            <ul className="space-y-2 text-white/40 text-sm">
              <li><Link className="hover:text-primary transition-all" href="/contact">About</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/contact">Careers</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/blog">Blog</Link></li>
              <li><Link className="hover:text-primary transition-all" href="/contact">Press</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-primary font-bold text-xs uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-white/40 text-sm">
              <li><Link className="hover:text-primary transition-all" href="#">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-all" href="#">Terms of Service</Link></li>
              <li><Link className="hover:text-primary transition-all" href="#">Security</Link></li>
              <li><Link className="hover:text-primary transition-all" href="#">Status</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-12 pb-12 border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="font-inter text-xs tracking-wide text-white/40">© 2025 Ahaget. All rights reserved.</span>
        <div className="flex gap-6">
          <Link className="text-white/40 hover:text-primary transition-all" href="#"><span className="material-symbols-outlined">brand_awareness</span></Link>
          <Link className="text-white/40 hover:text-primary transition-all" href="#"><span className="material-symbols-outlined">share</span></Link>
          <Link className="text-white/40 hover:text-primary transition-all" href="#"><span className="material-symbols-outlined">public</span></Link>
        </div>
      </div>
    </footer>
  );
}
