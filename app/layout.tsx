// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CountsProvider } from '@/lib/CountsContext';
import { MobileGuard } from '@/components/MobileGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ledger',
  description: 'Invoice review queue',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MobileGuard>
          <CountsProvider>{children}</CountsProvider>
        </MobileGuard>
      </body>
    </html>
  );
}