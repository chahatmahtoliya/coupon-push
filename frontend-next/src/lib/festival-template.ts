import { festival2026, festivalFaqs } from '@/data/amazon-festival-2026';
import type { Coupon, Store } from '@/types';

export interface FestivalProduct {
    id: string;
    title: string;
    brand: string;
    category: string;
    categoryLabel: string;
    image: string;
    url: string;
    advertisedPrice: number | null;
    originalPrice: number | null;
    discountPercent: number | null;
    note: string;
    includesBankOffer: boolean;
    coupon?: string;
    code?: string;
    featured: boolean;
    sourceUrl?: string;
    checkedAt?: string;
}

export function safeFestivalUrl(value?: string | null, allowRelative = false): string {
    if (!value) return '';
    if (allowRelative && /^\/(?!\/)/.test(value)) return value;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? value : ''; } catch { return ''; }
}

function text(value?: string | null) { return (value || '').replace(/<[^>]*>/g, '').trim(); }

export function getFestivalCampaign(store: Store | null, slug: string) {
    const amazon = slug === festival2026.slug;
    const merchant = text(store?.merchant_name) || (amazon ? 'Amazon' : text(store?.name) || 'Store');
    const name = text(store?.name) || (amazon ? festival2026.name : 'Festival offers');
    return {
        name, merchant, slug, amazon,
        path: `/store/${slug}/`,
        logo: amazon && (!store?.logo || /placeholder/i.test(store.logo)) ? '/assets/home-ui/amazon-round.png' : safeFestivalUrl(store?.logo, true) || '/placeholder-store.png',
        intro: text(store?.short_description || store?.description) || 'A little festive planning. A better deal on what you love.',
        merchantUrl: safeFestivalUrl(store?.website_url) || (amazon ? festival2026.merchantUrl : ''),
        banner: safeFestivalUrl(store?.banner_image, true) || (amazon ? festival2026.banner : ''),
        startDate: store?.campaign_start_date || (amazon ? festival2026.startDate : ''),
        bankOffer: text(store?.campaign_bank_offer ?? (amazon ? '10% SBI instant discount' : '')),
        memberOffer: text(store?.campaign_member_offer ?? (amazon ? 'Up to 10% extra for Prime' : '')),
        sourceUrl: safeFestivalUrl(store?.campaign_source_url) || (amazon ? festival2026.announcementUrl : ''),
        faqs: amazon ? festivalFaqs : [
            { question: `How do I use ${merchant} offers?`, answer: 'Open the offer, check its terms and apply any coupon code at checkout. Confirm the final payable total before ordering.' },
            { question: 'Are these live checkout prices?', answer: 'The listed prices and terms are supplied by the store listing administrator. The merchant sets the current price, availability and final checkout total.' },
            { question: 'Can I combine a coupon and bank offer?', answer: 'Only count discounts actually applied in the final order summary. Minimum spends, card eligibility, offer caps and product exclusions can apply.' },
            { question: 'Does CouponPush sell these products?', answer: `CouponPush helps you find offers and sends you to ${merchant} to buy. The merchant handles payments, delivery, returns and warranty.` },
        ],
    };
}
export type FestivalCampaign = ReturnType<typeof getFestivalCampaign>;

export function toFestivalProducts(coupons: Coupon[], merchantUrl: string, now = new Date(), merchantName = ''): FestivalProduct[] {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const today = ['year','month','day'].map(type => parts.find(part => part.type === type)?.value).join('-');
    return coupons.filter(coupon => coupon.status !== 0 && coupon.status !== false &&
        (!coupon.start_date || coupon.start_date.slice(0, 10) <= today) &&
        (!coupon.expiry_date || coupon.expiry_date.slice(0, 10) >= today)
    ).flatMap(coupon => {
        const url = safeFestivalUrl(coupon.affiliate_link) || safeFestivalUrl(coupon.store_website_url) || merchantUrl;
        if (!url || !coupon.title) return [];
        const categorySlug = coupon.category_slug || '';
        const category = /^(home|kitchen|appliance)/i.test(categorySlug) ? 'home' : /^(beauty|health)/i.test(categorySlug) ? 'beauty' : /^(mobile|smartphone)/i.test(categorySlug) ? 'mobiles' : categorySlug || 'other';
        const price = coupon.sale_price === null || coupon.sale_price === undefined ? null : Number(coupon.sale_price);
        const original = Number(coupon.original_price);
        const originalPrice = Number.isFinite(original) && original > 0 && price !== null && price > 0 && original > price ? original : null;
        const extraDiscount = coupon.discount_type === 'percentage' && coupon.discount_value > 0 && coupon.discount_value <= 100 ? `${coupon.discount_value}% coupon — check eligibility` : 'Coupon offer — check eligibility';
        const couponLabel = text(coupon.coupon_label) || (coupon.code?.trim() ? `Code: ${coupon.code.trim()}` : coupon.coupon_type === 'offer' ? extraDiscount : '');
        return [{ id: String(coupon.id), title: text(coupon.title), brand: text(coupon.brand) || merchantName || text(coupon.store_name), category,
            categoryLabel: ({home:'Home & appliances',beauty:'Beauty',mobiles:'Mobiles'} as Record<string,string>)[category] || text(coupon.category_name) || 'Other offers',
            image: safeFestivalUrl(coupon.image, true) || '/placeholder-store.png', url,
            advertisedPrice: price !== null && Number.isFinite(price) && price >= 0 ? price : null,
            originalPrice, discountPercent: originalPrice && price !== null ? Math.round((1 - price / originalPrice) * 100) || null : null,
            note: text(coupon.description) || 'Check price and eligibility on the merchant website.', includesBankOffer: Boolean(Number(coupon.includes_bank_offer)),
            coupon: couponLabel || undefined, code: coupon.code?.trim() || undefined, featured: Boolean(Number(coupon.is_featured)),
            sourceUrl: safeFestivalUrl(coupon.source_url) || undefined, checkedAt: coupon.checked_at || undefined,
        }];
    });
}
