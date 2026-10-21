import reviewed from '@/data/reviewed-offers.json';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export interface ReviewedOffer {
    id: string; storeSlug: string; title: string; code: string; types: string[];
    conditions: string[]; minimumSpend?: number; sourceUrl: string;
    status: string; checkedAt: string; updatedAt: string;
}
export interface SavingsDefinition {
    slug: string; title: string; description: string; intro: string; published: boolean;
    sections: { title: string; paragraphs: string[] }[];
    checklist: string[];
    faqs: { question: string; answer: string }[];
}

export const SAVINGS_MIN_OFFERS = 5;
export const SAVINGS_MIN_STORES = 3;
export const SOURCE_MAX_AGE_MS = 7 * 86_400_000;
export const savingsDefinitions: SavingsDefinition[] = [
    {
        slug: 'skincare', published: true, title: 'Skincare Offers & Coupon Codes in India',
        description: 'Compare sourced skincare promotions from Indian brand stores. Check eligible products, combo requirements, gift thresholds and coupon conditions.',
        intro: 'Compare advertised skincare offers from brand websites, with the conditions beside each promotion. A larger headline discount does not always give the lowest total for the products you need.',
        sections: [
            { title: 'Compare the same basket before choosing a code', paragraphs: ['Start with the products, variants and pack sizes you planned to buy. Compare the amount due for that same basket after the code, shipping and payment charges. A combo can cost more overall if it adds products you would not otherwise purchase.', 'Illustrative calculation: a 15% discount on an eligible Rs.1,000 subtotal leaves Rs.850 before delivery or other fees. This is arithmetic, not a tested merchant cart. Do not apply another advertised reduction to that total unless the store explicitly allows the offers to combine.'] },
            { title: 'Separate price reductions, multi-buy deals and gifts', paragraphs: ['A percentage reduction changes the price of eligible items. A multi-buy offer requires the specified number of eligible products. A gift adds an item rather than reducing the amount paid. Compare these benefits separately instead of adding their advertised percentages or retail values together.', 'This collection concerns shopping conditions. It does not recommend skincare treatments or claim that a product is suitable for a particular skin condition.'] },
        ],
        checklist: ['Match the product variant and pack size before comparing totals.', 'Check whether the code covers individual items, selected products or combos.', 'Confirm the qualifying amount after discounts, plus delivery and payment fees.', 'Treat unknown expiry and stacking rules as unconfirmed.'],
        faqs: [
            { question: 'Are these skincare coupon codes checkout-tested?', answer: 'No. The listed wording was matched against the linked merchant page on the shown source-check date. An advertisement is not proof that a particular account or basket qualifies.' },
            { question: 'Can I combine a skincare code with a gift or another code?', answer: 'Only when the merchant permits it. Apply the eligible offer and confirm the final price and gift line items in the cart. This page does not assume that separate promotions stack.' },
        ],
    },
    {
        slug: 'free-gifts', published: true, title: 'Free Gift Offers with Online Shopping in India',
        description: 'Compare merchant-advertised shopping gifts, qualifying spend and multi-buy conditions. See source links and distinguish a freebie from a cash saving.',
        intro: 'Compare gifts advertised by online stores and see what purchase each requires. The gift is useful only if the qualifying order makes sense for you.',
        sections: [
            { title: 'Calculate the extra spend before chasing a gift', paragraphs: ['Use your planned qualifying basket, not a basket inflated to reach the promotion. Extra spend is the qualifying threshold minus your planned basket, with a minimum of zero. Check whether the store measures that threshold before or after discounts.', 'Illustrative example: moving a Rs.600 basket to a Rs.799 threshold requires Rs.199 more qualifying spend. A condition saying above Rs.799 can require more. The example does not establish any store’s current eligibility rule.'] },
            { title: 'A gift’s retail value is not a refund', paragraphs: ['An advertised gift value is not money deducted from the checkout total. Check whether you want the item, whether it is added automatically or must be selected, and whether substitutions or stock limits apply.', 'Two gift tiers are not automatically cumulative. Check which tier the cart receives, and review whether cancelling or returning a qualifying item changes the gift eligibility.'] },
        ],
        checklist: ['Read above versus at least in the qualifying spend condition.', 'Confirm whether gift tiers replace each other or combine.', 'Check the free item appears in the cart and does not add a charge.', 'Review stock, substitutions and the merchant’s return conditions.'],
        faqs: [
            { question: 'Do these free gifts require a purchase?', answer: 'The promotions in this collection are purchase-linked. Each listing shows the advertised threshold or multi-buy condition. They are not unconditional giveaways.' },
            { question: 'Does no coupon code mean the gift is guaranteed?', answer: 'No. The banner may not provide a code, but eligible products, qualifying spend and stock can still apply. Confirm the gift in the order summary before paying.' },
        ],
    },
    ...[
        ['first-order', 'First-Order Offers in India'], ['bank-card', 'Bank and Card Offers in India'],
        ['free-shipping', 'Free Shipping Offers in India'], ['combo-deals', 'Combo and Multi-Buy Offers in India'],
    ].map(([slug, title]) => ({ slug, title, published: false, description: '', intro: '', sections: [], checklist: [], faqs: [] })),
];

export function eligibleReviewedOffers(offers: ReviewedOffer[], now = new Date()): ReviewedOffer[] {
    const seen = new Set<string>();
    return offers.filter(offer => {
        const checked = Date.parse(offer.checkedAt);
        const store = deployedSnapshot.stores[offer.storeSlug]?.store;
        let source: URL, merchant: URL;
        try { source = new URL(offer.sourceUrl); merchant = new URL(store?.website_url || ''); } catch { return false; }
        const code = offer.code.trim().toLowerCase();
        const key = `${offer.storeSlug}|${code ? `code:${code}` : `title:${offer.title.trim().replace(/\s+/g, ' ').toLowerCase()}`}`;
        if (seen.has(key) || !store || source.protocol !== 'https:' || source.username || source.password
            || source.hostname.replace(/^www\./, '') !== merchant.hostname.replace(/^www\./, '')
            || offer.status !== 'advertised' || !Number.isFinite(checked) || checked > now.getTime()
            || now.getTime() - checked > SOURCE_MAX_AGE_MS || !offer.title.trim() || offer.conditions.length < 2) return false;
        seen.add(key); return true;
    });
}

export function getReviewedOffers(now = new Date()) {
    return eligibleReviewedOffers(reviewed.offers as ReviewedOffer[], now);
}
export function buildSavingsPage(definition: SavingsDefinition, offers: ReviewedOffer[]) {
    const matching = offers.filter(offer => offer.types.includes(definition.slug));
    const stores = [...new Set(matching.map(offer => offer.storeSlug))];
    const hasEditorial = definition.intro.length >= 100 && definition.sections.length >= 2 && definition.faqs.length >= 2;
    const eligible = matching.length >= SAVINGS_MIN_OFFERS && stores.length >= SAVINGS_MIN_STORES && hasEditorial;
    const lastModified = [new Date('2026-10-21T00:00:00Z').getTime(), ...matching.map(offer => Date.parse(offer.updatedAt)).filter(Number.isFinite)];
    return { ...definition, offers: matching, stores, eligible, path: `/offers/${definition.slug}/`, lastModified: new Date(Math.max(...lastModified)).toISOString() };
}
export function getSavingsPages(now = new Date()) {
    const offers = getReviewedOffers(now);
    return savingsDefinitions.map(definition => buildSavingsPage(definition, offers));
}
export function getSavingsLinksForStore(slug: string) {
    return getSavingsPages().filter(page => page.eligible && page.stores.includes(slug));
}
export function reviewedStoreName(slug: string) {
    return deployedSnapshot.stores[slug]?.store.name || slug;
}
