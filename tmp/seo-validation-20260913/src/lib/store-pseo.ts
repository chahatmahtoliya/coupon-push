import type { Coupon } from '@/types';

export interface StorePseoSection {
    id: string;
    icon: string;
    title: string;
    paragraphs: string[];
    items?: Array<{ title: string; description: string }>;
}

export interface StorePseoFaq {
    question: string;
    answer: string;
}

export interface StorePseoContent {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    heroDescription: string;
    sections: StorePseoSection[];
    faqs: StorePseoFaq[];
}

interface StorePseoContext {
    slug: string;
    storeName: string;
    coupons: Coupon[];
    offerCount: number;
    codeCount: number;
    dealCount: number;
}

function bestPercentageDiscount(coupons: Coupon[]): number | null {
    const values = coupons
        .filter((coupon) => coupon.discount_type === 'percentage')
        .map((coupon) => Number(coupon.discount_value))
        .filter((value) => Number.isFinite(value) && value > 0 && value <= 100);
    return values.length ? Math.max(...values) : null;
}

function readableList(items: string[]): string {
    if (items.length < 2) return items[0] || 'hosting plans';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function hostingerProductTypes(coupons: Coupon[]): string[] {
    const copy = coupons.map((coupon) => `${coupon.title} ${coupon.description || ''}`).join(' ').toLowerCase();
    const products = [
        ['web hosting', /web hosting|premium hosting/],
        ['WordPress hosting', /wordpress/],
        ['VPS hosting', /\bvps\b/],
        ['domain offers', /domain/],
    ] as const;
    const matched = products.filter(([, pattern]) => pattern.test(copy)).map(([label]) => label);
    return matched.length ? matched : ['hosting plans'];
}

function buildHostingerProfile(context: StorePseoContext): StorePseoContent {
    const bestDiscount = bestPercentageDiscount(context.coupons);
    const discountPhrase = bestDiscount ? `Up to ${bestDiscount}% Off` : 'Current Hosting Deals';
    const products = readableList(hostingerProductTypes(context.coupons));
    const inventorySummary = context.offerCount
        ? `${context.offerCount} current offers are listed, including ${context.codeCount} coupon ${context.codeCount === 1 ? 'code' : 'codes'} and ${context.dealCount} online ${context.dealCount === 1 ? 'deal' : 'deals'}.`
        : 'No active offers are listed right now.';

    return {
        metaTitle: `Hostinger Coupon Code: ${discountPhrase}`,
        metaDescription: `Compare ${context.offerCount} Hostinger coupon codes and deals for web, WordPress, and VPS hosting. Check eligibility, billing terms, and renewal pricing before checkout.`,
        h1: 'Hostinger Coupon Codes & Hosting Deals',
        heroDescription: `Compare current Hostinger discounts for ${products}. Check the eligible plan, billing period, renewal price, and included features before you complete payment.`,
        sections: [
            {
                id: 'hostinger-offer-guide',
                icon: 'fa-server',
                title: 'Hostinger coupon and hosting offer guide',
                paragraphs: [
                    inventorySummary,
                    'The largest percentage is not always the lowest total cost. Compare the full amount due today with the plan length, renewal rate, taxes, and included services.',
                ],
            },
            {
                id: 'hostinger-checklist',
                icon: 'fa-list-check',
                title: 'What to check before choosing a Hostinger deal',
                paragraphs: ['Use this checklist to compare offers on the same terms.'],
                items: [
                    { title: 'Eligible product', description: 'Confirm whether the offer applies to web hosting, WordPress hosting, VPS, a website builder, or a domain.' },
                    { title: 'Billing period', description: 'Check the required subscription length and the total upfront payment, not only the monthly equivalent.' },
                    { title: 'Renewal price', description: 'Introductory and renewal prices can differ. Review the renewal amount shown at checkout.' },
                    { title: 'Included features', description: 'Compare storage, backups, SSL, email, domain eligibility, migration, and support for the selected plan.' },
                ],
            },
            {
                id: 'hostinger-redemption',
                icon: 'fa-ticket',
                title: 'How to use a Hostinger coupon code',
                paragraphs: [
                    'Choose an offer on this page and open it to review the code and eligibility details. Continue to Hostinger, select the matching product and billing period, and enter the code in the coupon or promotional field when one is provided.',
                    'Before paying, confirm that the discount appears in the order summary and compare the final payable total with the renewal terms. If the price does not change, return to the offer terms and check the product, region, and customer eligibility.',
                ],
            },
        ],
        faqs: [
            { question: 'How many Hostinger coupon codes and deals are available?', answer: inventorySummary },
            {
                question: 'Which Hostinger services have offers on this page?',
                answer: `The current offer titles cover ${products}. Availability can change, so confirm that the selected offer matches the product shown in your Hostinger cart.`,
            },
            {
                question: 'How do I choose the best Hostinger coupon?',
                answer: 'Compare the final upfront total for the same plan and billing period. Also check the renewal price, included features, customer eligibility, and whether a free domain or other benefit remains included.',
            },
            {
                question: 'Can existing Hostinger customers use these coupon codes?',
                answer: 'Eligibility depends on the individual offer. Review whether the terms apply to new purchases, selected plans, or existing customers before relying on the discount.',
            },
            {
                question: 'What should I do if a Hostinger coupon code does not work?',
                answer: 'Check the spelling, eligible product, billing period, region, and customer requirements. If the checkout total still does not change, try another currently listed offer and confirm its terms before payment.',
            },
        ],
    };
}

export function getStorePseoContent(context: StorePseoContext): StorePseoContent | null {
    if (context.slug === 'hostinger') return buildHostingerProfile(context);
    const profile = shoppingProfiles[context.slug];
    if (profile) {
        const heading = `${context.storeName} ${context.codeCount ? 'Coupon Codes & Offers' : 'Offers & Deals'}`;
        return {
            metaTitle: `${heading} in India | CouponPush`,
            metaDescription: `Compare ${context.storeName} offers with ${context.codeCount} listed codes. Review ${profile.focus}, exclusions and final checkout costs before ordering.`,
            h1: heading,
            heroDescription: `Compare ${context.storeName} savings for your basket. Check ${profile.focus} before choosing an offer.`,
            sections: [{ id: 'shopping-guide', icon: 'fa-list-check', title: `${context.storeName} offer checklist`, paragraphs: [
                context.offerCount ? `${context.offerCount} offers are listed, including ${context.codeCount} codes and ${context.dealCount} deals. Listed availability is not a guarantee that an offer applies to your account.` : 'No active offers are listed. Check the merchant for current availability.',
            ], items: profile.items }, { id: 'apply-code', icon: 'fa-ticket', title: `How to use a ${context.storeName} coupon code`, paragraphs: [
                `Choose a listed offer and review its conditions. Add eligible products on ${context.storeName}, enter the code if one is required, and confirm the discount in your order summary. An automatic deal does not need a code.`,
                'Compare the final payable amount, including delivery and payment fees, for the same products and quantities. If a code fails, check minimum spend, exclusions, expiry, account eligibility and app or website restrictions. Do not assume two offers can be combined.',
            ] }],
            faqs: profile.faqs,
        };
    }
    return null;
}

type ShoppingProfile = { focus: string; items: NonNullable<StorePseoSection['items']>; faqs: StorePseoFaq[] };
const shoppingProfiles: Record<string, ShoppingProfile> = {
    'kapiva-coupon-code': {
        focus: 'pack size, subscriptions and minimum spend',
        items: [
            { title: 'Compare matching packs', description: 'Check the product, quantity and pack size when comparing a coupon with a bundle price. A larger discount on a different pack is not a like-for-like saving.' },
            { title: 'One-time purchase or subscription', description: 'Confirm whether the price requires a recurring order. Review the renewal amount and cancellation terms before choosing a subscription.' },
            { title: 'Minimum spend', description: 'Check which products count toward the threshold and compare the total including delivery. A coupon is a price promotion, not evidence of a product’s health effects.' },
        ],
        faqs: [
            { question: 'How do I choose a Kapiva coupon code?', answer: 'Compare the final price for the same product and pack size. Check minimum spend, excluded products and whether the offer requires a subscription or new account.' },
            { question: 'Can I use a Kapiva code on a repeat order?', answer: 'Eligibility varies by promotion. Confirm whether the terms allow existing customers, subscriptions or repeat purchases before relying on the saving.' },
        ],
    },
    newme: {
        focus: 'first-order and sale-item restrictions',
        items: [
            { title: 'Eligible styles and sizes', description: 'Check the code against the exact style, colour and size in your basket. An offer for selected products may exclude other sale items.' },
            { title: 'App and first-order rules', description: 'Confirm whether the offer is app-only or requires a first purchase. Account eligibility and minimum spend can change the discount.' },
            { title: 'Total order cost', description: 'Include shipping and payment fees when comparing codes. Review returns and refund terms separately before buying extra items to reach a discount threshold.' },
        ],
        faqs: [
            { question: 'Does a NEWME coupon apply to sale items?', answer: 'Check the specific promotion and your cart. Some offers exclude already-discounted styles or selected collections; do not assume a code is an extra discount on every sale item.' },
            { question: 'Can I use a NEWME first-order code on the website?', answer: 'Confirm the channel in the offer terms. An app-only code may not work on the website, and a welcome offer may be tied to an eligible account.' },
        ],
    },
    pilgrim: {
        focus: 'bundle sizes and free-gift conditions',
        items: [
            { title: 'Full-size items and gifts', description: 'Separate the products you choose from automatically added gifts. Check each pack size when comparing a bundle with individual purchases.' },
            { title: 'Coupon exclusions', description: 'Check whether discounted kits, selected products or subscription purchases are excluded before applying a code.' },
            { title: 'Minimum cart and delivery', description: 'Compare the amount payable after coupon savings, shipping and payment fees. A free gift does not reduce the price of the products you intended to buy.' },
        ],
        faqs: [
            { question: 'Can I combine a Pilgrim coupon with a bundle offer?', answer: 'Check whether the specific bundle accepts additional codes. If it does not, compare the bundle and coupon prices for the same products and quantities.' },
            { question: 'Does a Pilgrim free-gift offer include full-size products?', answer: 'Read the gift description and pack size for the current promotion. Do not assume a free gift is the same size or value as a product you select yourself.' },
        ],
    },
    deconstruct: {
        focus: 'new-user eligibility and bundle conditions',
        items: [
            { title: 'New-user and first-order codes', description: 'Check whether the offer is limited to a first purchase or a particular account. A public code is not automatically a new-user discount.' },
            { title: 'Fixed-price bundles', description: 'For offers such as buy two at a fixed price, compare the same eligible products with their individual checkout prices. Confirm the bundle is currently offered before relying on a quoted amount.' },
            { title: 'Free products and Dcoins', description: 'Check which item becomes free, whether gifts are selected automatically, and whether rewards are usable only on a later purchase. Rewards are not an immediate cash discount.' },
        ],
        faqs: [
            { question: 'Is there a Deconstruct coupon code for a first order?', answer: 'First-order eligibility depends on the individual promotion. Review the listed offer and your account at checkout; do not assume every Deconstruct code is restricted to, or valid for, new users.' },
            { question: 'Does Deconstruct have a buy two at ₹599 coupon code?', answer: 'A fixed-price bundle can change or apply only to selected products. Check the current offer listing and merchant cart to see whether the bundle is available and whether it needs a code. This guide does not confirm a ₹599 promotion is active.' },
            { question: 'Can I use a Deconstruct coupon with a buy-one-get-one offer?', answer: 'Use the promotion terms to check stacking. A B1G1 offer, a fixed-price bundle and a percentage coupon may be alternatives. Compare the final total for the same items before choosing.' },
            { question: 'Why is my Deconstruct discount code not working?', answer: 'Check the eligible products, minimum spend, customer restrictions and expiry. Remove other promotions if they cannot combine, and confirm whether the code applies on the website or app.' },
        ],
    },
    snitch: {
        focus: 'first-order, student and payment eligibility',
        items: [
            { title: 'First order or existing customer', description: 'Read the customer requirement for each code. Check the minimum cart value after product discounts and whether sale items are excluded.' },
            { title: 'Student and influencer codes', description: 'A student discount may require an eligible account and verification. An influencer code can have product and customer restrictions; its name does not prove it works for every shopper.' },
            { title: 'Gift cards and prepaid orders', description: 'Compare the final payable total including shipping and payment fees. Confirm whether a gift card can be used with a coupon before buying one.' },
        ],
        faqs: [
            { question: 'Which Snitch coupon code can I use on my first order?', answer: 'Choose an offer whose terms include your account and products. Check minimum spend, sale exclusions and app restrictions before paying. The first-order label alone does not establish the final discount.' },
            { question: 'Is there a Snitch 50% off first-order code?', answer: 'A search result mentioning 50% off may refer to selected sale products rather than an additional first-order code. Only rely on a current listed promotion whose terms and checkout total confirm the saving.' },
            { question: 'Can existing users use Snitch influencer codes?', answer: 'It depends on the code. Check new-customer restrictions, eligible products and the minimum order amount. Do not assume an influencer code combines with student, bank or sale offers.' },
            { question: 'Can I combine a Snitch gift card and coupon?', answer: 'Read both the gift-card redemption rules and coupon terms before purchasing credit. Check exclusions and whether partial redemption or a second payment method is permitted.' },
        ],
    },
    foxtale: {
        focus: 'first-order, sunscreen and bundle eligibility',
        items: [
            { title: 'First-order coupons', description: 'Check customer eligibility, minimum spend and whether prepaid payment is required. A targeted voucher may not be a public first-order code.' },
            { title: 'B1G1, B2G2 and free gifts', description: 'Compare the number and size of full-size products you pay for and receive. Free gifts are not necessarily equivalent to choosing additional full-size products.' },
            { title: 'Sunscreens and FoxCoins', description: 'Check sunscreen exclusions on the selected code. FoxCoins are rewards for later redemption; review app restrictions and redemption limits separately from the immediate discount.' },
        ],
        faqs: [
            { question: 'Is there a Foxtale first-order coupon code?', answer: 'Check current listings for customer eligibility and minimum spend. Confirm that the discount applies to your account and cart before paying; this guide does not promise a separate welcome code.' },
            { question: 'What is the difference between Foxtale B1G1 and buy-two-get-two offers?', answer: 'B1G1 normally describes one qualifying paid item and one free item; B2G2 describes two paid and two free items. Product selection, sizes and free-item rules depend on the specific promotion. Additional gifts may be smaller samples, so compare what you actually receive.' },
            { question: 'Can I use a Foxtale coupon on sunscreen?', answer: 'Check whether the sunscreen, pack size and sale bundle are eligible. A sitewide description may still have exclusions. Confirm the discount on the exact items in your cart.' },
            { question: 'Can everyone use a Foxtale GPay voucher?', answer: 'A voucher distributed through a payment app may be targeted, single-use or account-specific. Check the voucher terms instead of assuming it is a public code.' },
            { question: 'Is Foxtale cashback the same as money off this order?', answer: 'Wallet rewards such as FoxCoins may apply to a future purchase and can have app-only redemption, expiry and caps. Compare the amount payable now separately from any future reward.' },
        ],
    },
};
