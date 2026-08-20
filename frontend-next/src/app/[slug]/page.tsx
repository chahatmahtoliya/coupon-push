import type { Metadata } from 'next';
import { storesApi } from '@/services/api';
import StorePageClient from '../store/[slug]/StorePageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

const fallbackStoreSlugs = [
    'flipkart', 'kapiva-coupon-code', 'ajio', 'myntra', 'zomato', 'swiggy', 'blinkit',
    'dominos', 'redbus', 'cetaphil-coupon-code', 'amazon', 'boat-lifestyle', 'hostinger',
    'amazon-prime-day-sale-2026', 'decathlon-coupon-code', 'derma-co-coupon-code',
    'lenovo', 'dot-key-coupon-codes', 'cetaphil',
];

export async function generateStaticParams() {
    try {
        const stores = await storesApi.getAll();
        return stores.map((store) => ({
            slug: store.slug,
        }));
    } catch (error) {
        console.error('Failed to fetch stores for static params:', error);
        return fallbackStoreSlugs.map((slug) => ({ slug }));
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    try {
        const data = await storesApi.getBySlug(slug);
        const storeName = data.store?.name || slug;
        const description = data.store?.description
            || `Find the latest ${storeName} coupon codes, promo codes, and verified offers on CouponPush.`;

        return {
            title: `${storeName} Coupons`,
            description,
            alternates: {
                canonical: `https://couponpush.com/${slug}`,
            },
        };
    } catch (_error) {
        return {
            title: 'Store Coupons',
            description: 'Find verified store coupon codes and promo offers on CouponPush.',
            alternates: {
                canonical: `https://couponpush.com/${slug}`,
            },
        };
    }
}

export default async function RootStorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let initialData = deployedSnapshot.stores[slug] || null;

    try {
        initialData = await storesApi.getBySlug(slug);
    } catch (error) {
        console.error(`Failed to fetch ${slug} store page:`, error);
    }

    return <StorePageClient initialData={initialData} slug={slug} />;
}
