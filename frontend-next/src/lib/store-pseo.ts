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
    return null;
}
