import type { Metadata } from 'next';
import { storesApi } from '@/services/api';
import StorePageClient from '../store/[slug]/StorePageClient';

export async function generateStaticParams() {
    try {
        const stores = await storesApi.getAll();
        return stores.map((store) => ({
            slug: store.slug,
        }));
    } catch (error) {
        console.error('Failed to fetch stores for static params:', error);
        return [];
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

export default function RootStorePage() {
    return <StorePageClient />;
}
