import type {
    ApiResponse,
    Category,
    Coupon,
    Deal,
    HeroSlide,
    HomepageStats,
    SearchResults,
    SeasonalOffer,
    Store,
    StorePageData,
} from '@/types';

import { readCatalogSnapshot } from '@/lib/snapshot-api';

const SERVER_API_BASE = process.env.API_URL || 'https://api.couponpush.com/api';
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.couponpush.com').replace(/\/$/, '');
const STORE_MEDIA_BASE = (process.env.NEXT_PUBLIC_STORE_MEDIA_URL || 'https://api.couponpush.com').replace(/\/$/, '');
const IMAGE_FIELDS = new Set(['logo', 'store_logo', 'image', 'banner_image', 'mobile_banner_image']);

function uploadBase(pathname: string): string {
    return /^\/uploads\/stores(?:\/|$)/i.test(pathname) ? STORE_MEDIA_BASE : MEDIA_BASE;
}

function getApiBase(): string {
    if (typeof window === 'undefined') return SERVER_API_BASE;
    return process.env.NEXT_PUBLIC_API_URL || SERVER_API_BASE;
}

function decodeHTML(value: string): string {
    if (!value) return value;

    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = value;
        return textarea.value;
    }

    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
    };

    return value
        .replace(/&(amp|lt|gt|quot|#039|apos|nbsp);/g, (entity) => entities[entity] || entity)
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function decodeHTMLInData(value: unknown): unknown {
    if (typeof value === 'string') return decodeHTML(value);
    if (Array.isArray(value)) return value.map(decodeHTMLInData);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, decodeHTMLInData(item)]),
        );
    }
    return value;
}

function normalizeAssetUrl(value: string): string {
    if (!value || value.startsWith('data:')) return value;
    if (/\/uploads\/stores\/placeholder\.png(?:[?#].*)?$/i.test(value)) return '/placeholder-store.png';
    if (value.startsWith('//')) return `https:${value}`;

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if ((url.hostname === 'couponpush.com' || url.hostname === 'www.couponpush.com')
                && url.pathname.startsWith('/uploads/')) {
                return `${uploadBase(url.pathname)}${url.pathname}${url.search}`;
            }
        } catch {
            return value;
        }
        return value;
    }

    if (value.startsWith('/uploads/')) return `${uploadBase(value)}${value}`;
    if (value.startsWith('uploads/')) return `${uploadBase(`/${value}`)}/${value}`;

    try {
        const base = new URL(SERVER_API_BASE);
        return `${base.origin}${value.startsWith('/') ? value : `/${value}`}`;
    } catch {
        return value;
    }
}

function normalizeAssetsInData(value: unknown): unknown {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(normalizeAssetsInData);
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                IMAGE_FIELDS.has(key) && typeof item === 'string'
                    ? normalizeAssetUrl(item)
                    : normalizeAssetsInData(item),
            ]),
        );
    }
    return value;
}

async function fetchApi<T>(endpoint: string, fresh = false): Promise<T> {
    if (typeof window === 'undefined') {
        const catalog = readCatalogSnapshot(endpoint);
        if (catalog !== undefined) return catalog as T;
    }
    const separator = endpoint.includes('?') ? '&' : '?';
    const cacheBuster = fresh ? `${separator}_=${Date.now()}` : '';
    const response = await fetch(`${getApiBase()}${endpoint}${cacheBuster}`, fresh || typeof window !== 'undefined'
        ? { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } }
        : { next: { revalidate: 3600 }, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const payload = (await response.json()) as ApiResponse<T>;
    if (!payload.success) {
        throw new Error(payload.message || 'API request failed');
    }

    return normalizeAssetsInData(decodeHTMLInData(payload.data)) as T;
}

export const storesApi = {
    getAll: () => fetchApi<Store[]>('/stores.php'),
    getAllFresh: () => fetchApi<Store[]>('/stores.php', true),
    getFeatured: (limit = 8) => fetchApi<Store[]>(`/stores.php?featured=1&limit=${limit}`),
    getFeaturedFresh: (limit = 8) => fetchApi<Store[]>(`/stores.php?featured=1&limit=${limit}`, true),
    getBySlug: (slug: string) => fetchApi<StorePageData>(`/store.php?slug=${encodeURIComponent(slug)}`),
    getBySlugFresh: (slug: string) => fetchApi<StorePageData>(`/store.php?slug=${encodeURIComponent(slug)}`, true),
    getByCategory: (categorySlug: string) =>
        fetchApi<Store[]>(`/stores.php?category=${encodeURIComponent(categorySlug)}`),
    getByCategoryFresh: (categorySlug: string) =>
        fetchApi<Store[]>(`/stores.php?category=${encodeURIComponent(categorySlug)}`, true),
};

export const couponsApi = {
    getById: (id: number) => fetchApi<Coupon>(`/coupon.php?id=${id}`),
    getByIdFresh: (id: number) => fetchApi<Coupon>(`/coupon.php?id=${id}`, true),
    getFeatured: (limit = 8) => fetchApi<Coupon[]>(`/coupons.php?featured=1&limit=${limit}`),
    getFeaturedFresh: (limit = 8) => fetchApi<Coupon[]>(`/coupons.php?featured=1&limit=${limit}`, true),
    getLatest: (limit = 12) => fetchApi<Coupon[]>(`/coupons.php?latest=1&limit=${limit}`),
    getLatestFresh: (limit = 12) => fetchApi<Coupon[]>(`/coupons.php?latest=1&limit=${limit}`, true),
    getByStore: (storeId: number) => fetchApi<Coupon[]>(`/coupons.php?store_id=${storeId}`),
    getByStoreSlug: (slug: string, limit = 12, latest = false) =>
        fetchApi<Coupon[]>(`/coupons.php?store_slug=${encodeURIComponent(slug)}&limit=${limit}${latest ? '&latest=1' : ''}`),
    getByStoreSlugFresh: (slug: string, limit = 12, latest = false) =>
        fetchApi<Coupon[]>(`/coupons.php?store_slug=${encodeURIComponent(slug)}&limit=${limit}${latest ? '&latest=1' : ''}`, true),
    getByCategory: (categorySlug: string) =>
        fetchApi<Coupon[]>(`/coupons.php?category=${encodeURIComponent(categorySlug)}`),
    getByCategoryFresh: (categorySlug: string) =>
        fetchApi<Coupon[]>(`/coupons.php?category=${encodeURIComponent(categorySlug)}`, true),
};

export const categoriesApi = {
    getAll: () => fetchApi<Category[]>('/categories.php'),
    getAllFresh: () => fetchApi<Category[]>('/categories.php', true),
};

export const dealsApi = {
    getFeatured: (limit = 6) => fetchApi<Deal[]>(`/deals.php?featured=1&limit=${limit}`),
    getFeaturedFresh: (limit = 6) => fetchApi<Deal[]>(`/deals.php?featured=1&limit=${limit}`, true),
    getAll: () => fetchApi<Deal[]>('/deals.php'),
};

export const seasonalOffersApi = {
    getActive: () => fetchApi<SeasonalOffer[]>('/seasonal-offers.php?active=true'),
    getActiveFresh: () => fetchApi<SeasonalOffer[]>('/seasonal-offers.php?active=true', true),
    getBySlug: (slug: string) =>
        fetchApi<SeasonalOffer>(`/seasonal-offers.php?slug=${encodeURIComponent(slug)}`),
};

export const heroSlidesApi = {
    getActive: () => fetchApi<HeroSlide[]>('/hero-slides.php?active=true'),
    getActiveFresh: () => fetchApi<HeroSlide[]>('/hero-slides.php?active=true', true),
};

export const searchApi = {
    search: (query: string) => fetchApi<SearchResults>(`/search.php?q=${encodeURIComponent(query)}`),
};

export const statsApi = {
    getHomepage: () => fetchApi<HomepageStats>('/stats.php'),
};

export async function trackClick(type: 'coupon' | 'deal', id: number): Promise<void> {
    try {
        await fetch(`${getApiBase()}/track-click.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, id }),
        });
    } catch (error) {
        console.error('Track click error:', error);
    }
}
