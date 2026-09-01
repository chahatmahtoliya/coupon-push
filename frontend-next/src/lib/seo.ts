/**
 * SEO utility functions for generating Schema.org structured data
 * and page metadata. Replaces the client-side useSEO hook.
 */

/**
 * Generate SEO-optimized title for store pages
 */
export function getStorePageTitle(storeName: string): string {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${storeName} Coupon Codes & Offers ${month} ${year} | CouponPush`;
}

/**
 * Generate SEO-optimized description for store pages
 */
export function getStorePageDescription(storeName: string, couponCount: number): string {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `✓ ${couponCount} verified ${storeName} coupon codes & promo codes for ${month} ${year}. Get exclusive discounts, deals & free shipping offers. Updated today!`;
}

/**
 * Generate SEO-optimized title for category pages
 */
export function getCategoryPageTitle(categoryName: string): string {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `Best ${categoryName} Coupons ${month} ${year}`;
}

/**
 * Generate SEO-optimized description for category pages
 */
export function getCategoryPageDescription(categoryName: string, couponCount: number): string {
    if (couponCount <= 0) {
        return `Browse ${categoryName.toLowerCase()} coupon codes and online offers on CouponPush.`;
    }

    return `Browse ${couponCount} active ${categoryName.toLowerCase()} coupon codes and discount offers from verified stores on CouponPush.`;
}

/**
 * Generate Offer schema for coupons (Google Rich Results)
 */
export function generateCouponSchema(coupon: {
    id: number;
    title: string;
    description?: string;
    code?: string;
    discount_value?: number;
    discount_type?: string;
    store_name?: string;
    store_slug?: string;
    store_website?: string;
    expiry_date?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Offer',
        'name': coupon.title,
        'description': coupon.description || coupon.title,
        'url': `https://couponpush.com/coupon/${coupon.id}`,
        'priceCurrency': 'INR',
        'availability': 'https://schema.org/InStock',
        ...(coupon.code && { 'offeredBy': coupon.code }),
        ...(coupon.expiry_date && { 'validThrough': coupon.expiry_date }),
        ...(coupon.discount_value && {
            'discount': coupon.discount_type === 'percentage'
                ? `${coupon.discount_value}%`
                : `₹${coupon.discount_value}`
        }),
        'seller': {
            '@type': 'Organization',
            'name': coupon.store_name || 'Store',
            'url': coupon.store_website || `https://couponpush.com/${coupon.store_slug}`
        }
    };
}

/**
 * Generate Store schema with AggregateOffer
 */
export function generateStoreSchema(store: {
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    website_url?: string;
}, couponCount: number) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': store.name,
        'url': store.website_url || `https://couponpush.com/store/${store.slug}/`,
        'logo': store.logo || 'https://couponpush.com/assets/images/logo.png',
        'description': store.description || `Browse current ${store.name} coupon codes and online offers.`,
        'offers': {
            '@type': 'AggregateOffer',
            'offerCount': couponCount,
            'priceCurrency': 'INR',
            'availability': 'https://schema.org/InStock'
        }
    };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url
        }))
    };
}

/**
 * Low-hanging fruit keyword patterns for coupon sites
 */
export const KEYWORD_PATTERNS = {
    store: [
        '{store} coupon code today',
        '{store} promo code {month} {year}',
        '{store} discount code working',
        '{store} first order coupon',
        '{store} offer code free shipping',
    ],
    category: [
        '{category} coupons India',
        'best {category} deals online',
        '{category} discount codes {year}',
        '{category} offers today',
    ],
    seasonal: [
        'Diwali sale coupon codes {year}',
        'Republic Day offers India',
        'Black Friday deals India {year}',
        'New Year sale coupons',
    ]
};
