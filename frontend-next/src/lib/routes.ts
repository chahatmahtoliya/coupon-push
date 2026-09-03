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
    return canonicalSlug ? `/store/${canonicalSlug}` : '/stores';
}

export function getCouponPath(id?: number | string | null): string {
    return id ? `/coupon/${id}` : '/';
}
