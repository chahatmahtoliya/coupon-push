import type { Metadata } from 'next';
import type { Category } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { hasIndexableCategoryContent, isCategoryInventoryIndexable } from '@/lib/indexability';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
    title: 'Coupon Categories',
    description: 'Browse verified coupon codes and online deals by category.',
    alternates: { canonical: 'https://couponpush.com/categories/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/categories/',
        title: 'Coupon Categories',
        description: 'Browse verified coupon codes and online deals by category.',
    },
};

export default async function CategoriesPage() {
    const initialCategories: Category[] = (deployedSnapshot.categoriesPage?.initialCategories || [])
        .filter(isCategoryInventoryIndexable)
        .filter((category) => hasIndexableCategoryContent(
            deployedSnapshot.categories[category.slug] as { coupons?: unknown[] } | undefined,
        ));

    return <CategoriesPageClient initialCategories={initialCategories} />;
}
