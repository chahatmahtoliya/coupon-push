import type { Metadata } from 'next';
import { storesApi } from '@/services/api';
import type { Store } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import StoresPageClient from './StoresPageClient';

export const metadata: Metadata = {
    title: 'All Stores - CouponPush',
    description: 'Browse all coupon stores on CouponPush and find verified deals, promo codes, and offers by brand.',
    alternates: {
        canonical: 'https://couponpush.com/stores',
    },
};

export default async function StoresPage() {
    let initialStores: Store[] = deployedSnapshot.storesPage?.initialStores || [];
    try {
        initialStores = await storesApi.getAll();
    } catch (error) {
        console.error('Failed to fetch stores:', error);
    }
    return <StoresPageClient initialStores={initialStores} />;
}
