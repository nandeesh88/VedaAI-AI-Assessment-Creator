import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Create AI-powered question papers and assignments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="h-screen flex overflow-hidden bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
