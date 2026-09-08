import type { Metadata } from 'next';
import './globals.css';
import NextAuthProvider from '@/components/providers/NextAuthProvider';
import SmoothScroll from '@/components/SmoothScroll';

export const metadata: Metadata = {
  title: 'CANDELA — Your Feminine Scent',
  description: 'Premium feminine fragrance and lifestyle brand. Discover body mists, perfume oils, artisan candles, and more.',
  keywords: 'candela, perfume, fragrance, body mist, candles, feminine, luxury',
  openGraph: {
    title: 'CANDELA — Your Feminine Scent',
    description: 'Premium feminine fragrance and lifestyle brand.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Great+Vibes&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextAuthProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </NextAuthProvider>
      </body>
    </html>
  );
}
