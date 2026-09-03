import type { Metadata } from 'next';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import { getCategoryPageDescription, getCategoryPageTitle } from '@/lib/seo';
import CategoryPageClient, { type CategoryPageData } from './CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import {
    hasIndexableCategoryContent,
    isCategoryInventoryIndexable,
    MIN_INDEXABLE_CATEGORY_COUPONS,
} from '@/lib/indexability';

const fallbackCategories = [
    'beauty-health', 'bus-tickets', 'electronics', 'entertainment', 'fashion-lifestyle',
    'food-dining', 'grocery', 'home-kitchen', 'hosting', 'proteins', 'smart-tvs', 'travel-hotels',
];

export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const categories = await categoriesApi.getAll();
        const indexableCategories = await Promise.all(categories
            .filter(isCategoryInventoryIndexable)
            .map(async (category) => {
                const snapshot = deployedSnapshot.categories[category.slug] as CategoryPageData | undefined;
                if (hasIndexableCategoryContent(snapshot)) return { slug: category.slug };

                try {
                    const coupons = await couponsApi.getByCategory(category.slug);
                    return coupons.length >= MIN_INDEXABLE_CATEGORY_COUPONS ? { slug: category.slug } : null;
                } catch {
                    return null;
                }
            }));

        return indexableCategories.filter((category): category is { slug: string } => Boolean(category));
    } catch {
        const snapshotCategories = deployedSnapshot.categoriesPage?.initialCategories || [];
        const indexableSnapshotCategories = snapshotCategories
            .filter(isCategoryInventoryIndexable)
            .filter((category) => hasIndexableCategoryContent(
                deployedSnapshot.categories[category.slug] as CategoryPageData | undefined,
            ))
            .map((category) => ({ slug: category.slug }));

        return indexableSnapshotCategories.length
            ? indexableSnapshotCategories
            : fallbackCategories.map((slug) => ({ slug }));
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const fallback = deployedSnapshot.categories[slug] as CategoryPageData | undefined;
    let name = fallback?.categoryName || slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let couponCount = fallback?.coupons?.length || 0;
    let indexable = hasIndexableCategoryContent(fallback);

    try {
        const [categories, coupons] = await Promise.all([
            categoriesApi.getAll(),
            indexable ? Promise.resolve(fallback?.coupons || []) : couponsApi.getByCategory(slug),
        ]);
        const category = categories.find((item) => item.slug === slug);
        name = category?.name || name;
        couponCount = coupons.length || category?.coupon_count || couponCount;
        indexable = hasIndexableCategoryContent({ coupons });
    } catch {
        // Use the last deployed snapshot when the API is unavailable during export.
    }

    const title = getCategoryPageTitle(name);
    const description = getCategoryPageDescription(name, couponCount);
    const canonical = `https://couponpush.com/category/${slug}/`;

    return {
        title,
        description,
        alternates: { canonical },
        robots: { index: indexable, follow: true },
        openGraph: { type: 'website', url: canonical, title, description },
    };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let initialData = (deployedSnapshot.categories[slug] as CategoryPageData | undefined) || null;
    if (!initialData) {
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
    }
    return <CategoryPageClient initialData={initialData} slug={slug} />;
}
