import type { MetadataRoute } from 'next';
import type { Coupon } from '@/types';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import { getStorePath } from '@/lib/routes';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getLatestContentUpdate } from '@/lib/content-dates';
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
        let data = deployedSnapshot.stores[store.slug];
        if (data && hasIndexableStoreContent(data)) return { store, data };

        try {
            data = await storesApi.getBySlug(store.slug);
            return hasIndexableStoreContent(data) ? { store, data } : null;
        } catch {
            return null;
        }
    }))).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const indexableCategories = (await Promise.all(categories
        .filter(isCategoryInventoryIndexable)
        .map(async (category) => {
            let data = deployedSnapshot.categories[category.slug] as { coupons?: Coupon[] } | undefined;
            if (data && hasIndexableCategoryContent(data)) return { category, data };

            try {
                const coupons = await couponsApi.getByCategory(category.slug);
                data = { coupons };
                return coupons.length >= MIN_INDEXABLE_CATEGORY_COUPONS ? { category, data } : null;
            } catch {
                return null;
            }
        }))).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    entries.push(
        ...indexableStores.map(({ store, data }) => ({
            url: `${baseUrl}${getStorePath(store.slug)}/`,
            lastModified: getLatestContentUpdate(data.store, ...(data.coupons || [])),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        })),
        ...indexableCategories.map(({ category, data }) => ({
            url: `${baseUrl}/category/${category.slug}/`,
            lastModified: getLatestContentUpdate(category, ...(data.coupons || [])),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
    );

    return entries;
}
