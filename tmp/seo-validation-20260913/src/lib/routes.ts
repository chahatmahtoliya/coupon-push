import snapshot from '@/data/deployed-snapshot.json';
import storeRedirects from '@/data/store-redirects.json';

const STORE_SLUG_REDIRECTS: Readonly<Record<string, string>> = storeRedirects;

export function getCanonicalStoreSlug(slug?: string | null): string {
    if (!slug) return '';
    return STORE_SLUG_REDIRECTS[slug] || slug;
}

export function isCanonicalStoreSlug(slug?: string | null): boolean {
    return Boolean(slug) && getCanonicalStoreSlug(slug) === slug;
}

export function getStorePath(slug?: string | null): string {
    const canonicalSlug = getCanonicalStoreSlug(slug);
    if (!canonicalSlug) return '/stores/';
    // Newly uploaded stores are usable immediately; a release gives them an SEO URL.
    return Object.hasOwn(snapshot.stores, canonicalSlug)
        ? `/store/${canonicalSlug}/`
        : `/stores/view/?slug=${encodeURIComponent(canonicalSlug)}`;
}

export function getCouponPath(id?: number | string | null): string {
    return id ? `/coupon/${id}/` : '/';
}

export function getCategoryPath(slug?: string | null): string {
    const data = slug ? (snapshot.categories as Record<string, { coupons?: unknown[] }>)[slug] : null;
    return data?.coupons?.length ? `/category/${slug}/` : '/categories/';
}
