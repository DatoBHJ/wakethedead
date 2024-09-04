import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import AddToHomeScreen from '@/components/AddToHomeScreen';
import { AI } from './action';
import { Providers } from '@/components/providers';

const meta = {
  title: 'Wake The Dead with AI',
  description: 'Breathe life into lifeless content! Transform any link into vibrant, handwritten-style notes with AI. Revive boring articles and dull videos into engaging, interactive learning experiences. Explore through chat, share knowledge instantly, and join a fun learning revolution. Paste a link, resurrect dead content, and dive into a world of lively, quick-witted exploration.',
};

export const metadata: Metadata = {
  ...meta,
  title: {
    default: 'Wake The Dead',
    template: `%s - Wake The Dead`,
  },
  manifest: '/manifest.json', 
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  twitter: {
    ...meta,
    card: 'summary_large_image',
    site: '@vercel',
  },
  openGraph: {
    ...meta,
    locale: 'en-US',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wake The Dead',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}
      >
        <Toaster />
        <AI>
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col flex-1 h-dvh">
              <main className="flex flex-col bg-muted/50 dark:bg-background h-full">
                {children}
              </main>
            </div>
          </Providers>
        </AI>
        <AddToHomeScreen />
        <Analytics />
      </body>
    </html>
  );
}

export const runtime = 'edge';