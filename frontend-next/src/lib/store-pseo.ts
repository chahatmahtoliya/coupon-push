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

// Editorial revision dates change when this copy is reviewed, never per build.
export function getStoreSeoUpdatedAt(slug: string): string | undefined {
    return ['amazon', 'flipkart', 'blinkit', 'the-derma-co'].includes(slug) ? '2026-10-21T00:00:00Z' : undefined;
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
            sections: [...(profile.sections || []), { id: 'shopping-guide', icon: 'fa-list-check', title: `${context.storeName} offer checklist`, paragraphs: [
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

export function getStoreFallbackFaqs(context: StorePseoContext): StorePseoFaq[] {
    const { storeName, coupons, offerCount, codeCount, dealCount } = context;
    const listedOffer = coupons[0];
    const nextExpiry = coupons
        .filter((coupon) => coupon.expiry_date && !Number.isNaN(Date.parse(coupon.expiry_date)))
        .sort((a, b) => Date.parse(a.expiry_date) - Date.parse(b.expiry_date))[0];

    return [
        {
            question: `How many ${storeName} coupon codes and deals are listed?`,
            answer: offerCount
                ? `This page currently lists ${offerCount} ${storeName} offers: ${codeCount} coupon ${codeCount === 1 ? 'code' : 'codes'} and ${dealCount} online ${dealCount === 1 ? 'deal' : 'deals'}. Check each offer's terms before ordering.`
                : `No active ${storeName} offers are listed right now. Check this page again or visit the merchant for current promotions.`,
        },
        codeCount ? {
            question: `How do I use a ${storeName} coupon code?`,
            answer: `Open a listed code offer, check its eligible products and customer conditions, then enter the code at ${storeName} checkout. Confirm the discount in the order total before paying.`,
        } : {
            question: `Do ${storeName} deals need a coupon code?`,
            answer: dealCount
                ? `The ${dealCount} listed online ${dealCount === 1 ? 'deal does' : 'deals do'} not require a code. Open the offer and confirm the price and eligibility at checkout.`
                : `There is no active ${storeName} code or deal listed on this page. Check the merchant's current terms before ordering.`,
        },
        {
            question: `What should I check before choosing a ${storeName} offer?`,
            answer: listedOffer
                ? `One listed offer is “${listedOffer.title}”. Check its eligible items, minimum spend, customer restrictions, delivery charges and final payable amount. A listing does not guarantee the offer will apply to your cart.`
                : `Compare the merchant's current price, delivery charges and offer conditions when new ${storeName} promotions become available.`,
        },
        {
            question: `When do ${storeName} offers expire?`,
            answer: nextExpiry
                ? `The earliest listed expiry is ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(nextExpiry.expiry_date))} for “${nextExpiry.title}”. Other offers may end at different times; confirm availability before checkout.`
                : `No active ${storeName} offer has a listed expiry date here. That does not guarantee continued availability; check the offer and merchant before checkout.`,
        },
    ];
}

type ShoppingProfile = { focus: string; sections?: StorePseoSection[]; items: NonNullable<StorePseoSection['items']>; faqs: StorePseoFaq[] };
const shoppingProfiles: Record<string, ShoppingProfile> = {
    amazon: {
        focus: 'product coupons, headphone variants and payment eligibility',
        sections: [{
            id: 'headphone-offers', icon: 'fa-headphones', title: 'Amazon headphone offers: code, coupon or sale price?',
            paragraphs: [
                'For headphones and earbuds, compare the exact model, colour, seller and included accessories. A discount on a different variant is not a like-for-like saving. A crossed-out list price also does not establish the lowest recent selling price.',
                'An Amazon product-page coupon and a checkout promo code are different types of offer. If a coupon is displayed on the selected listing, review and select it as instructed before checkout. Use a public code only when its terms include your item and account. This page does not confirm a universal headphone coupon code.',
                'Compare the amount due for the same basket after delivery and any eligible payment offer. Keep an instant discount separate from cashback payable later, and do not assume a bank benefit combines with a product coupon.',
            ],
        }],
        items: [
            { title: 'Exact item and seller', description: 'Match the headphone model, variant, condition and seller before comparing prices. Review the listing warranty and return or replacement terms.' },
            { title: 'Coupon versus promo code', description: 'Check whether the saving is a selectable product coupon, a public checkout code, a payment offer or a reduced selling price. Each has its own eligibility.' },
            { title: 'Checkout total', description: 'Review minimum spend, discount cap, payment method, delivery charges and the actual amount due. A historical sale listing is not proof that the campaign is still running.' },
        ],
        faqs: [
            { question: 'Is there an Amazon coupon code for headphones?', answer: 'No universal headphone code is confirmed by this guide. Check the exact headphone listing for a product coupon and use a public promo code only when its terms include that item. Confirm the final discount before paying.' },
            { question: 'Do Amazon product coupons need a code?', answer: 'A product coupon may be selected on the eligible listing without typing a public code. A checkout promo code requires a usable code and matching terms. Follow the instructions shown for your selected item.' },
            { question: 'Can an Amazon bank offer combine with a coupon?', answer: 'Read both promotions and check the order summary using the eligible payment method. Minimum spend, caps, card type and EMI requirements can change eligibility; this guide does not promise stacking.' },
            { question: 'Is an old Amazon sale price still available?', answer: 'A previously listed sale price is not a live price check. Open the exact product and variant, review current availability and confirm the payable total before ordering.' },
        ],
    },
    flipkart: {
        focus: 'earbud models, seller terms and bank-offer restrictions',
        sections: [{
            id: 'earbuds-offers', icon: 'fa-headphones', title: 'Flipkart earbuds offers: how to compare the real saving',
            paragraphs: [
                'Start with the exact earbud model and variant you want. Compare the seller, warranty, delivery cost and return or replacement policy as well as the displayed price. A large percentage off list price does not establish the best price for that model.',
                'Sale pricing, checkout coupons and bank offers are different savings. A bank price may depend on the card, minimum transaction amount, discount cap or EMI option. Check which benefit actually applies to your basket before comparing two offers.',
                'Text such as “coupon code activated” is a status label, not a code to paste at checkout. This page does not confirm a universal earbuds code. Use a code only when it is explicitly listed with matching eligibility and the order summary shows the saving.',
            ],
        }],
        items: [
            { title: 'Match the earbud variant', description: 'Compare the same model, colour and product condition. Check the seller and included warranty rather than comparing unrelated starting prices.' },
            { title: 'Separate payment benefits', description: 'Read the payment offer for card type, minimum spend, maximum saving and EMI requirements. Cashback earned later is different from money off the current order.' },
            { title: 'Confirm the final price', description: 'Check delivery charges and the total at checkout. Do not assume a category-wide headline applies to every earbud or stacks with another promotion.' },
        ],
        faqs: [
            { question: 'Is there a Flipkart coupon code for earbuds?', answer: 'This guide does not confirm a universal earbuds code. Compare current listings for the exact model and use a code only when its terms include your product and account. A product price reduction or bank offer may apply without a public code.' },
            { question: 'Is “coupon code activated” a valid Flipkart coupon?', answer: 'It is a status label, not a usable checkout code. Do not paste it into the promo-code field. Review the merchant offer and confirm any saving in the final order total.' },
            { question: 'Why is the Flipkart price higher at checkout?', answer: 'Compare the exact variant and seller, delivery charges and the conditions behind the advertised price. A price that includes a bank benefit may require an eligible card, transaction amount or payment option.' },
            { question: 'Can existing users use a Flipkart earbuds offer?', answer: 'Customer eligibility depends on the specific promotion. Check whether it is limited to a new account, selected users, a payment method or certain products; do not assume a sale label is a first-order coupon.' },
        ],
    },
    blinkit: {
        focus: 'account eligibility, payment requirements and delivery charges',
        items: [
            { title: 'New or existing account', description: 'Review whether the promotion is public, first-order only or targeted to a particular account. Use the offer shown for your signed-in account and delivery location.' },
            { title: 'Basket and payment rules', description: 'Check eligible products, minimum spend, discount cap and the required payment method. A reward credited later is not an instant reduction in this order.' },
            { title: 'Final delivered cost', description: 'Include delivery, handling and any other checkout charges when comparing offers. Check the total again after changing the delivery address or basket.' },
        ],
        faqs: [
            { question: 'Can existing users use a Blinkit coupon code?', answer: 'It depends on the offer and account. Check whether the terms specify new users, selected accounts or a required payment method, then confirm the saving in your signed-in checkout.' },
            { question: 'Why does a Blinkit coupon not apply?', answer: 'Check minimum spend, excluded products, delivery location, expiry, customer eligibility and payment method. A code found elsewhere may be targeted or no longer offered to your account.' },
            { question: 'Does a Blinkit discount cover delivery charges?', answer: 'Check the exact promotion and order breakdown. Do not assume an item discount also removes delivery or handling charges; compare the final delivered total.' },
        ],
    },
    'the-derma-co': {
        focus: 'buy-one-get-one terms, pack sizes and confirmed sale dates',
        items: [
            { title: 'Bundle eligibility', description: 'Check which products qualify and which item becomes free. Compare full-size packs separately from samples or gifts.' },
            { title: 'Sale end date', description: 'Use a dated merchant announcement or the terms of the specific promotion. Do not infer an end date from a previous campaign or another coupon site.' },
            { title: 'Coupon or bundle', description: 'Compare the payable amount for the same products and quantities. Confirm whether the bundle needs a code and whether another promotion can combine with it.' },
        ],
        faqs: [
            { question: 'What is the last date of The Derma Co buy-one-get-one sale?', answer: 'No current buy-one-get-one end date is confirmed by this guide. Check the official promotion for its dates and eligible products before planning an order. An expired listing does not establish a new sale date.' },
            { question: 'Can I use a Derma Co promo code with a buy-one-get-one offer?', answer: 'Read the terms for both offers and compare the final total for the same products. A bundle and a separate coupon may be alternatives; stacking is not confirmed here.' },
            { question: 'Does every Derma Co product qualify for a bundle?', answer: 'Check the eligible product list, pack sizes, gift rules and stock availability for the specific promotion. A sale headline alone does not establish that every item qualifies.' },
        ],
    },
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
