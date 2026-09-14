import type { Coupon } from '@/types';

export function offerSource(coupon: Coupon): string | null {
    try {
        const url = new URL(coupon.source_url || '');
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

export function offerCheckedDate(coupon: Coupon): string | null {
    const value = coupon.checked_at;
    if (!value || !/^\d{4}-\d{2}-\d{2}(?:$|[T ])/.test(value)) return null;
    const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10) || date > new Date()) return null;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function isCheckoutTested(coupon: Coupon): boolean {
    return Boolean(coupon.is_verified && coupon.verification_method === 'checkout_tested' && offerSource(coupon) && offerCheckedDate(coupon));
}

export function offerEvidenceLabel(coupon: Coupon): string {
    if (isCheckoutTested(coupon)) return 'Checkout tested';
    if (coupon.verification_method === 'merchant_advertised' && offerSource(coupon) && offerCheckedDate(coupon)) return 'Merchant advertised';
    return 'Not checkout tested';
}
