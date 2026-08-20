import type { Metadata } from 'next';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import { getCategoryPageDescription, getCategoryPageTitle } from '@/lib/seo';
import CategoryPageClient, { type CategoryPageData } from './CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

const fallbackCategories = [
    'beauty-health', 'bus-tickets', 'electronics', 'entertainment', 'fashion-lifestyle',
    'food-dining', 'grocery', 'home-kitchen', 'hosting', 'proteins', 'smart-tvs', 'travel-hotels',
];

export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const categories = await categoriesApi.getAll();
        return categories.map((category) => ({ slug: category.slug }));
    } catch {
        return fallbackCategories.map((slug) => ({ slug }));
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const name = slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return { title: getCategoryPageTitle(name), description: getCategoryPageDescription(name, 0) };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let initialData = (deployedSnapshot.categories[slug] as CategoryPageData | undefined) || null;
    try {
        const [coupons, stores, categories] = await Promise.all([
            couponsApi.getByCategory(slug),
            storesApi.getByCategory(slug).catch(() => []),
            categoriesApi.getAll().catch(() => []),
        ]);
        const category = categories.find((item) => item.slug === slug);
        initialData = {
            coupons,
            stores: stores.map((store) => ({ name: store.name, slug: store.slug, count: store.coupon_count || 0 })),
            categoryName: category?.name || slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            categoryDescription: category?.description || '',
            categoryIcon: category?.icon || 'fa-tag',
        };
    } catch (error) {
        console.error(`Failed to fetch ${slug} category:`, error);
    }
    return <CategoryPageClient initialData={initialData} slug={slug} />;
}
