import type { Metadata } from 'next';
import type { Coupon } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import CouponsPageClient from './CouponsPageClient';

export const metadata: Metadata = {
    title: 'All Coupons & Deals — Browse by Store and Category',
    description: 'Browse CouponPush coupon codes and deals. Filter by store, category and offer type, or sort by newest, most clicked and ending soon.',
    alternates: { canonical: 'https://couponpush.com/coupons/' },
    openGraph: { url: 'https://couponpush.com/coupons/', title: 'All Coupons & Deals | CouponPush', description: 'Find coupon codes and deals by store, category and offer type.' },
};

export default function CouponsPage() {
    const categories = (deployedSnapshot.categoriesPage?.initialCategories || []).map(category => ({ slug: category.slug, name: category.name }));
    const categoryIds = new Map<number, string[]>();
    for (const [slug, data] of Object.entries(deployedSnapshot.categories)) {
        for (const coupon of (data as { coupons?: Coupon[] }).coupons || []) {
            categoryIds.set(coupon.id, [...(categoryIds.get(coupon.id) || []), slug]);
        }
    }
    // Store inventories are the complete prepared catalog; homepage sections are limited subsets.
    const unique = new Map(Object.values(deployedSnapshot.stores).flatMap(data => data.coupons).map(coupon => [coupon.id, coupon]));
    const coupons = [...unique.values()].map(coupon => ({ ...coupon, categorySlugs: categoryIds.get(coupon.id) || [] }));
    return <CouponsPageClient coupons={coupons} categories={categories} initialNow={Date.now()} />;
}
