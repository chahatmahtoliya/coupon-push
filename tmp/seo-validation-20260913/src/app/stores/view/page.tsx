import type { Metadata } from 'next';
import { Suspense } from 'react';
import LiveStore from './LiveStore';

export const metadata: Metadata = {
    title: 'Store Offers',
    description: 'Browse offers from newly added CouponPush stores.',
    robots: { index: false, follow: true },
};

export default function StoreViewPage() {
    return <Suspense fallback={<p className="container">Loading store offers…</p>}><LiveStore /></Suspense>;
}
