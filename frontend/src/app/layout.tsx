import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { TTSProvider } from '@/components/providers/TTSProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sentra - Multi-Agent Project Dashboard',
  description: 'Real-time multi-project dashboard with voice boardroom planning system',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sentra" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`${inter.className} h-full overflow-hidden`}>
        <WebSocketProvider>
          <TTSProvider>
            <div className="h-full flex flex-col">
              {children}
            </div>
          </TTSProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}