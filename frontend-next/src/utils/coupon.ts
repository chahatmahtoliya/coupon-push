import type { Coupon } from '@/types';

export function hasCouponCode(coupon: Coupon): boolean {
    return Boolean(coupon.code?.trim());
}

export function isCodeCoupon(coupon: Coupon): boolean {
    return hasCouponCode(coupon);
}

export function getCouponCtaLabel(coupon: Coupon): string {
    return isCodeCoupon(coupon) ? 'Get Coupon' : 'Get Deal';
}
