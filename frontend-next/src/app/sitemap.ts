import type { MetadataRoute } from 'next';
import { categoriesApi, storesApi } from '@/services/api';
import { getStorePath } from '@/lib/routes';

const baseUrl = 'https://couponpush.com';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = ['', '/stores', '/categories', '/deals', '/offers', '/about', '/contact', '/privacy-policy', '/terms'];
    const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
        url: `${baseUrl}${path}/`,
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7,
    }));

    try {
        const [stores, categories] = await Promise.all([storesApi.getAll(), categoriesApi.getAll()]);
        entries.push(
            ...stores.map((store) => ({ url: `${baseUrl}${getStorePath(store.slug)}/`, changeFrequency: 'daily' as const, priority: 0.8 })),
            ...categories.map((category) => ({ url: `${baseUrl}/category/${category.slug}/`, changeFrequency: 'weekly' as const, priority: 0.7 })),
        );
    } catch {
        // The core sitemap remains available when the coupon API is temporarily offline.
    }

    return entries;
}
