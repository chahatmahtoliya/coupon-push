import images from '@/data/power-bank-images.json';
import type { Coupon } from '@/types';

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
export function capacity(offer: Coupon) {
    return Number(offer.title.match(/([\d,]+)\s*mAh/i)?.[1].replaceAll(',', '') || 0);
}
export function listedPower(offer: Coupon) {
    return Number(offer.description.match(/([\d.]+)W advertised power/i)?.[1] || 0);
}
export function withProductPhoto(offer: Coupon): Coupon {
    const photo = (images as Record<string, { image: string; source: string }>)[offer.id];
    // Do not reuse a photo if a refreshed listing now points to a different product.
    return !offer.image && photo?.source === offer.affiliate_link ? { ...offer, image: photo.image } : offer;
}
export function shoppingPicks(offers: Coupon[]) {
    const priced = offers.filter(item => item.sale_price && item.sale_price > 0).sort((a, b) => a.sale_price! - b.sale_price!);
    const budget = priced[0];
    const reserve = priced.find(item => capacity(item) === 20000 && item.id !== budget?.id);
    const power = [...priced].filter(item => item.id !== budget?.id && item.id !== reserve?.id && listedPower(item) > 0).sort((a, b) => listedPower(b) - listedPower(a) || a.sale_price! - b.sale_price!)[0];
    return [
        { label: 'Lowest listed price', note: 'A little backup. A lighter spend.', offer: budget },
        { label: '20,000mAh for less', note: 'More reserve for longer days.', offer: reserve },
        { label: 'Highest listed power', note: power ? `${listedPower(power)}W advertised · check port output` : '', offer: power },
    ].filter((pick): pick is typeof pick & { offer: Coupon } => Boolean(pick.offer));
}
