import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/style.css';
import '@/styles/homepage.css';
import '@/styles/store-hero.css';
import '@/styles/seo.css';
import { Footer, Header } from '@/components/layout';
import { ScrollToTop } from '@/components/common';

export const metadata: Metadata = {
    metadataBase: new URL('https://couponpush.com'),
    title: {
        default: 'CouponPush - Best Coupons, Promo Codes & Deals 2026',
        template: '%s | CouponPush',
    },
    description:
        'Find verified coupon codes, exclusive deals, and promo codes for top stores including Amazon, Flipkart, Myntra, and Zomato.',
    applicationName: 'CouponPush',
    authors: [{ name: 'CouponPush' }],
    keywords: ['coupon codes', 'promo codes', 'discount codes', 'deals', 'offers', 'coupons India'],
    robots: { index: true, follow: true },
    icons: {
        icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
        shortcut: '/icon.svg',
        apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
        type: 'website',
        siteName: 'CouponPush',
        url: 'https://couponpush.com',
        title: 'CouponPush - Best Coupons, Promo Codes & Deals 2026',
        description: 'Find verified coupon codes, exclusive deals, and promo codes for top stores including Amazon, Flipkart, Myntra, and Zomato.',
        images: [{ url: '/assets/images/logo.png', alt: 'CouponPush' }],
    },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <head>
                <link rel="dns-prefetch" href="https://api.fontshare.com" />
                <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
                <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
                <link rel="preconnect" href="https://api.fontshare.com" />
                <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=clash-display@500,600,700&display=swap" />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                />
                <meta name="mitgo-verification" content="baeeba74-8ae3-4835-8306-bbec73818051" />
            </head>
            <body>
                <div className="app">
                    <ScrollToTop />
                    <Header />
                    <main className="main-content">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
