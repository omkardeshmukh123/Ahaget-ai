'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  const user = useAuthStore((s) => s.user);
  const org = useAuthStore((s) => s.org);

  useEffect(() => {
    if (!websiteId) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [websiteId]);

  // Identify the user once auth is hydrated
  useEffect(() => {
    if (!websiteId || !window.$crisp || !user) return;

    if (user.email) {
      window.$crisp.push(['set', 'user:email', [user.email]]);
    }
    if (user.name) {
      window.$crisp.push(['set', 'user:nickname', [user.name]]);
    }
    if (org?.name) {
      window.$crisp.push(['set', 'session:data', [[['company', org.name], ['plan', org.planType ?? 'free']]]]);
    }
  }, [websiteId, user, org]);

  return null;
}
