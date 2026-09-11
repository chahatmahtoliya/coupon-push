import type { Coupon } from '../types/index';

export type CatalogCoupon = Coupon & { categorySlugs: string[] };
export type CouponFilters = {
    q: string; stores: string[]; categories: string[];
    type: string; discount: string; verified: boolean; expiring: boolean; sort: string;
};
export const defaultFilters: CouponFilters = { q: '', stores: [], categories: [], type: 'all', discount: 'all', verified: false, expiring: false, sort: 'latest' };

export function readCouponFilters(params: URLSearchParams): CouponFilters {
    const option = (key: string, choices: string[], fallback: string) => choices.includes(params.get(key) || '') ? params.get(key)! : fallback;
    return {
        q: (params.get('q') || '').slice(0, 200),
        stores: [...new Set(params.getAll('store'))], categories: [...new Set(params.getAll('category'))],
        type: option('type', ['all', 'code', 'deal'], 'all'),
        discount: option('discount', ['all', 'percentage', 'fixed', 'cashback', 'freebie'], 'all'),
        verified: params.get('verified') === '1', expiring: params.get('expiring') === '1',
        sort: option('sort', ['latest', 'popular', 'ending'], 'latest'),
    };
}

export function couponFilterQuery(filters: CouponFilters): string {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    filters.stores.forEach(value => params.append('store', value));
    filters.categories.forEach(value => params.append('category', value));
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.discount !== 'all') params.set('discount', filters.discount);
    if (filters.verified) params.set('verified', '1');
    if (filters.expiring) params.set('expiring', '1');
    if (filters.sort !== 'latest') params.set('sort', filters.sort);
    return params.toString();
}

export function couponExpiry(coupon: Coupon): number {
    if (!coupon.expiry_date) return Infinity;
    const timestamp = Date.parse(`${coupon.expiry_date.slice(0, 10)}T23:59:59+05:30`);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function filterCoupons(coupons: CatalogCoupon[], filters: CouponFilters, now: number): CatalogCoupon[] {
    const query = filters.q.trim().toLocaleLowerCase();
    const timestamp = (value?: string | null) => Date.parse((value || '').replace(' ', 'T')) || 0;
    return coupons.filter(coupon => {
        const expiry = couponExpiry(coupon);
        const hasCode = Boolean(coupon.code?.trim());
        const discount = String(coupon.discount_type) === 'flat' ? 'fixed' : String(coupon.discount_type);
        return expiry >= now
            && (!query || `${coupon.title} ${coupon.store_name} ${coupon.description || ''} ${coupon.code || ''}`.toLocaleLowerCase().includes(query))
            && (!filters.stores.length || filters.stores.includes(coupon.store_slug))
            && (!filters.categories.length || coupon.categorySlugs.some(slug => filters.categories.includes(slug)))
            && (filters.type === 'all' || (filters.type === 'code' ? hasCode : !hasCode))
            && (filters.discount === 'all' || discount === filters.discount)
            && (!filters.verified || Boolean(coupon.is_verified))
            && (!filters.expiring || expiry <= now + 7 * 86400000);
    }).sort((a, b) => {
        if (filters.sort === 'popular') return (Number(b.click_count) || 0) - (Number(a.click_count) || 0) || b.id - a.id;
        if (filters.sort === 'ending') {
            const aExpiry = couponExpiry(a), bExpiry = couponExpiry(b);
            if (aExpiry !== bExpiry) return aExpiry < bExpiry ? -1 : 1;
        }
        return timestamp(b.created_at) - timestamp(a.created_at) || b.id - a.id;
    });
}
