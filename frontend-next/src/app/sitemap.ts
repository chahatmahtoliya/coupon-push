import type { MetadataRoute } from 'next';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import { getStorePath } from '@/lib/routes';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import {
    hasIndexableCategoryContent,
    hasIndexableStoreContent,
    isCategoryInventoryIndexable,
    MIN_INDEXABLE_CATEGORY_COUPONS,
} from '@/lib/indexability';

const baseUrl = 'https://couponpush.com';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = ['', '/stores', '/categories', '/deals', '/offers', '/about', '/contact', '/privacy-policy', '/terms'];
    const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
        url: `${baseUrl}${path}/`,
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7,
    }));

    let stores = deployedSnapshot.storesPage?.initialStores || [];
    let categories = deployedSnapshot.categoriesPage?.initialCategories || [];

    try {
        stores = await storesApi.getAll();
    } catch {
        // Keep the last deployed store inventory when the API is unavailable.
    }

    try {
        categories = await categoriesApi.getAll();
    } catch {
        // Keep the last deployed category inventory when the API is unavailable.
    }

    const indexableStores = (await Promise.all(stores.map(async (store) => {
        const snapshot = deployedSnapshot.stores[store.slug];
        if (hasIndexableStoreContent(snapshot)) return store;

        try {
            return hasIndexableStoreContent(await storesApi.getBySlug(store.slug)) ? store : null;
        } catch {
            return null;
        }
    }))).filter((store): store is NonNullable<typeof store> => Boolean(store));

    const indexableCategories = (await Promise.all(categories
        .filter(isCategoryInventoryIndexable)
        .map(async (category) => {
            const snapshot = deployedSnapshot.categories[category.slug] as { coupons?: unknown[] } | undefined;
            if (hasIndexableCategoryContent(snapshot)) return category;

            try {
                const coupons = await couponsApi.getByCategory(category.slug);
                return coupons.length >= MIN_INDEXABLE_CATEGORY_COUPONS ? category : null;
            } catch {
                return null;
            }
        }))).filter((category): category is NonNullable<typeof category> => Boolean(category));

    entries.push(
        ...indexableStores.map((store) => ({ url: `${baseUrl}${getStorePath(store.slug)}/`, changeFrequency: 'daily' as const, priority: 0.8 })),
        ...indexableCategories.map((category) => ({ url: `${baseUrl}/category/${category.slug}/`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    );

    return entries;
}
