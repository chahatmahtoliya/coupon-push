import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Search Coupons and Stores',
    description: 'Search CouponPush for stores, coupon codes, deals, and offers.',
    alternates: { canonical: 'https://couponpush.com/search/' },
    robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: Readonly<{ children: ReactNode }>) {
    return children;
}
