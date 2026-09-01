import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Seasonal Sales and Coupon Offers',
    description: 'Browse active festival sales, seasonal coupon campaigns, and limited-time offers on CouponPush.',
    alternates: { canonical: 'https://couponpush.com/offers/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/offers/',
        title: 'Seasonal Sales and Coupon Offers',
        description: 'Browse active festival sales, seasonal coupon campaigns, and limited-time offers on CouponPush.',
    },
};

export default function OffersLayout({ children }: Readonly<{ children: ReactNode }>) {
    return children;
}
