import type { Metadata } from 'next';
import type { Category } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
    title: 'Coupon Categories',
    description: 'Explore shopping categories for electronics, fashion, beauty, travel and more. Find coupons and offers for your next purchase.',
    alternates: { canonical: 'https://couponpush.com/categories/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/categories/',
        title: 'Coupon Categories',
        description: 'Explore shopping categories for electronics, fashion, beauty, travel and more. Find coupons and offers for your next purchase.',
    },
};

export default async function CategoriesPage() {
    const initialCategories: Category[] = deployedSnapshot.categoriesPage?.initialCategories || [];

    return <CategoriesPageClient initialCategories={initialCategories} />;
}
