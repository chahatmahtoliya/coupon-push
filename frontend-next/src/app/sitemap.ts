import type { MetadataRoute } from 'next';
import type { Coupon } from '@/types';
import { getStorePath } from '@/lib/routes';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getLatestContentUpdate } from '@/lib/content-dates';
import {
    hasIndexableCategoryContent,
    hasIndexableStoreContent,
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

    const indexableStores = Object.values(deployedSnapshot.stores)
        .filter(hasIndexableStoreContent).map(data => ({ store: data.store, data }));
    const indexableCategories = (deployedSnapshot.categoriesPage?.initialCategories || [])
        .map(category => ({ category, data: deployedSnapshot.categories[category.slug] as { coupons?: Coupon[] } }))
        .filter(({ data }) => hasIndexableCategoryContent(data));

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

    return entries.filter((entry, index) => entries.findIndex((candidate) => candidate.url === entry.url) === index);
}
