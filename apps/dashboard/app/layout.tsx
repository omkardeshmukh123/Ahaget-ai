import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ahaget Dashboard',
  description: 'Manage your AI onboarding agent',
  icons: {
    icon: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
