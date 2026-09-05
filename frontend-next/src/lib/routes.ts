import snapshot from '@/data/deployed-snapshot.json';

const STORE_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
    'amazon-prime-day-sale-2026': 'amazon',
    cetaphil: 'cetaphil-coupon-code',
};

export function getCanonicalStoreSlug(slug?: string | null): string {
    if (!slug) return '';
    return STORE_SLUG_REDIRECTS[slug] || slug;
}

export function isCanonicalStoreSlug(slug?: string | null): boolean {
    return Boolean(slug) && getCanonicalStoreSlug(slug) === slug;
}

export function getStorePath(slug?: string | null): string {
    const canonicalSlug = getCanonicalStoreSlug(slug);
    if (!canonicalSlug) return '/stores';
    // Newly uploaded stores are usable immediately; a release gives them an SEO URL.
    return Object.hasOwn(snapshot.stores, canonicalSlug)
        ? `/store/${canonicalSlug}`
        : `/stores/view/?slug=${encodeURIComponent(canonicalSlug)}`;
}

export function getCouponPath(id?: number | string | null): string {
    return id ? `/coupon/${id}` : '/';
}
