import type { Category, StorePageData } from '@/types';

export const MIN_INDEXABLE_CATEGORY_COUPONS = 3;

export function isCategoryInventoryIndexable(category: Category): boolean {
    return (category.coupon_count || 0) >= MIN_INDEXABLE_CATEGORY_COUPONS;
}

export function hasIndexableCategoryContent(data?: { coupons?: unknown[] } | null): boolean {
    return (data?.coupons?.length || 0) >= MIN_INDEXABLE_CATEGORY_COUPONS;
}

export function hasIndexableStoreContent(data?: StorePageData | null): boolean {
    return Boolean(data?.store) && (data?.coupons?.length || data?.store.coupon_count || 0) > 0;
}
