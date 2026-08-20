import type { Coupon } from '@/types';

export function hasCouponCode(coupon: Coupon): boolean {
    return Boolean(coupon.code?.trim());
}

export function isCodeCoupon(coupon: Coupon): boolean {
    const type = String(coupon.coupon_type || '').toLowerCase();
    return type ? type === 'code' || type === 'coupon' : hasCouponCode(coupon);
}

export function getCouponCtaLabel(coupon: Coupon): string {
    return isCodeCoupon(coupon) ? 'Get Coupon' : 'Get Deal';
}
