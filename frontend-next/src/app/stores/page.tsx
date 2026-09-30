import type { Metadata } from 'next';
import type { Store } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { isCanonicalStoreSlug } from '@/lib/routes';
import StoresPageClient from './StoresPageClient';

export const metadata: Metadata = {
    title: 'All Coupon Stores',
    description: 'Browse stores on CouponPush and explore current coupons, promo codes, and deals by brand.',
    alternates: { canonical: 'https://couponpush.com/stores/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/stores/',
        title: 'All Coupon Stores',
        description: 'Browse stores on CouponPush and explore current coupons, promo codes, and deals by brand.',
    },
};

export default async function StoresPage() {
    const initialStores: Store[] = (deployedSnapshot.storesPage?.initialStores || [])
        .filter((store) => isCanonicalStoreSlug(store.slug));

    return <StoresPageClient initialStores={initialStores} />;
}
