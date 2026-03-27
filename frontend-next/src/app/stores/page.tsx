import type { Metadata } from 'next';
import StoresPageClient from './StoresPageClient';

export const metadata: Metadata = {
    title: 'All Stores - CouponPush',
    description: 'Browse all coupon stores on CouponPush and find verified deals, promo codes, and offers by brand.',
    alternates: {
        canonical: 'https://couponpush.com/stores',
    },
};

export default function StoresPage() {
    return <StoresPageClient />;
}
