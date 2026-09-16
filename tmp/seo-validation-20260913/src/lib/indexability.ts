import { isCanonicalStoreSlug } from '@/lib/routes';
import type { Category, Coupon, StorePageData } from '@/types';

export const MIN_INDEXABLE_CATEGORY_COUPONS = 3;

function normalizedText(value?: string | null): string {
    return (value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z0-9#]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isUsefulStoreCopy(value?: string | null): boolean {
    const text = normalizedText(value);
    if (text.length < 60 || text.split(/\s+/).length < 8) return false;
    return !/^(test+|demo|placeholder|coming soon|tess+)/i.test(text);
}

function isValidMerchantUrl(value?: string | null): boolean {
    if (!value) return false;
    try {
        const url = new URL(value);
        return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
    } catch {
        return false;
    }
}

export function isCouponCurrentlyActive(coupon: Coupon, now = new Date()): boolean {
    if (!coupon.expiry_date) return true;
    const expiry = new Date(`${coupon.expiry_date.slice(0, 10)}T23:59:59`);
    return !Number.isNaN(expiry.getTime()) && expiry.getTime() >= now.getTime();
}

export function getActiveCoupons(coupons?: Coupon[] | null, now = new Date()): Coupon[] {
    return (coupons || []).filter((coupon) => isCouponCurrentlyActive(coupon, now));
}

export function isCategoryInventoryIndexable(category: Category): boolean {
    return (category.coupon_count || 0) >= MIN_INDEXABLE_CATEGORY_COUPONS;
}

export function hasIndexableCategoryContent(data?: { coupons?: unknown[] } | null): boolean {
    return getActiveCoupons((data?.coupons || []) as Coupon[]).length >= MIN_INDEXABLE_CATEGORY_COUPONS;
}

export function hasIndexableStoreContent(data?: StorePageData | null): boolean {
    if (!data?.store || !isCanonicalStoreSlug(data.store.slug)) return false;

    const activeCoupons = getActiveCoupons(data.coupons);
    if (!activeCoupons.length || !isValidMerchantUrl(data.store.website_url)) return false;

    const customCopy = [
        data.store.description,
        data.store.about_content,
        data.store.howto_content,
        data.store.terms_content,
    ].some(isUsefulStoreCopy);

    // A deeper live inventory is useful in its own right. Smaller inventories
    // need meaningful merchant-specific copy before they enter the index.
    return activeCoupons.length >= MIN_INDEXABLE_CATEGORY_COUPONS || customCopy;
}
