import type { Metadata } from 'next';
import type { Store } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { hasIndexableStoreContent } from '@/lib/indexability';
import StoresPageClient from './StoresPageClient';

export const metadata: Metadata = {
    title: 'All Coupon Stores',
    description: 'Browse all coupon stores on CouponPush and find verified deals, promo codes, and offers by brand.',
    alternates: { canonical: 'https://couponpush.com/stores/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/stores/',
        title: 'All Coupon Stores',
        description: 'Browse all coupon stores on CouponPush and find verified deals, promo codes, and offers by brand.',
    },
};

export default async function StoresPage() {
    const initialStores: Store[] = (deployedSnapshot.storesPage?.initialStores || [])
        .filter((store) => hasIndexableStoreContent(deployedSnapshot.stores[store.slug]));

    return <StoresPageClient initialStores={initialStores} />;
}
