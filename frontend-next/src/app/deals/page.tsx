import type { Metadata } from 'next';
import DealsPageClient from './DealsPageClient';
import { dealsApi } from '@/services/api';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export const metadata: Metadata = {
    title: "Today's Best Deals & Offers",
    description: 'Browse current product deals and store offers on CouponPush. Check the merchant price and terms before buying.',
    alternates: { canonical: 'https://couponpush.com/deals/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/deals/',
        title: "Today's Best Deals & Offers",
        description: 'Browse current product deals and store offers on CouponPush. Check the merchant price and terms before buying.',
    },
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
