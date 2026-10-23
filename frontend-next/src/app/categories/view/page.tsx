import type { Metadata } from 'next';
import { Suspense } from 'react';
import LiveCategory from './LiveCategory';

export const metadata: Metadata = {
    title: 'Browse Category Offers',
    description: 'Browse the latest offers in your selected shopping category.',
    robots: { index: false, follow: true },
};

export default function CategoryViewPage() {
    return <Suspense fallback={<p className="cp-directory-shell">Loading category…</p>}><LiveCategory /></Suspense>;
}
