import type { Coupon } from '@/types';

const placeholderCodes = new Set([
    'COUPON CODE ACTIVATED', 'CODE ACTIVATED', 'DEAL ACTIVATED',
    'NO CODE REQUIRED', 'NO COUPON REQUIRED', 'NO CODE', 'N/A',
]);

export function getCouponCode(coupon: Pick<Coupon, 'code'>): string {
    const code = coupon.code?.trim() || '';
    const label = code.toUpperCase().replace(/[\s_-]+/g, ' ');
    return placeholderCodes.has(label) ? '' : code;
}

export function hasCouponCode(coupon: Coupon): boolean {
    return Boolean(getCouponCode(coupon));
}

export function isCodeCoupon(coupon: Coupon): boolean {
    return hasCouponCode(coupon);
}

export function getCouponCtaLabel(coupon: Coupon): string {
    return isCodeCoupon(coupon) ? 'Get Coupon' : 'Get Deal';
}
