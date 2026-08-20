export function getStorePath(slug?: string | null): string {
    return slug ? `/store/${slug}` : '/stores';
}

export function getCouponPath(id?: number | string | null): string {
    return id ? `/coupon/${id}` : '/';
}
