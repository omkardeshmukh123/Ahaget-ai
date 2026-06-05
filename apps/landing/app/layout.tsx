import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Ahaget — AI Employee for SaaS User Lifecycle',
  description:
    'Ahaget is an embeddable AI widget that onboards, retains, and supports every user automatically. Drop 2 lines of code. Let AI handle the rest.',
  keywords: [
    'AI onboarding',
    'user lifecycle',
    'SaaS AI',
    'churn prevention',
    'AI support widget',
    'user retention',
  ],
  authors: [{ name: 'Ahaget' }],
  icons: {
    icon: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
  openGraph: {
    title: 'Ahaget — AI Employee for SaaS User Lifecycle',
    description:
      'Embeddable AI that onboards, retains, and supports every SaaS user automatically.',
    url: 'https://ahaget.ai',
    siteName: 'Ahaget',
    images: [{ url: '/logo-mark.png' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ahaget — AI Employee for SaaS',
    description: 'AI-powered user lifecycle platform. Onboard, retain, support — automatically.',
    images: ['/logo-mark.png'],
  },
  metadataBase: new URL('https://ahaget.ai'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="icon" href="/logo-mark.png" type="image/png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className="bg-background text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
