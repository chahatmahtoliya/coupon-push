import type { Metadata } from 'next';
import DealsPageClient from './DealsPageClient';
import { dealsApi } from '@/services/api';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export const metadata: Metadata = {
    title: "Today's Best Deals & Offers",
    description: 'Browse the latest featured shopping deals and verified offers on CouponPush.',
};

export default async function DealsPage() {
    let deals = deployedSnapshot.dealsPage?.initialDeals || [];
    try {
        deals = await dealsApi.getAll();
    } catch (error) {
        console.error('Failed to fetch deals:', error);
    }
    return <DealsPageClient initialDeals={deals} />;
}
