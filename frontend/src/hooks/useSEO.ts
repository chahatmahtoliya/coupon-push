import { useEffect } from 'react';

interface SEOConfig {
    title: string;
    description: string;
    url?: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
    schema?: object | object[];
}

// Decode HTML entities like &amp; &lt; &gt; &quot;
function decodeHTML(html: string): string {
    if (!html || typeof html !== 'string') return html;
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

/**
 * Custom hook to dynamically update SEO meta tags and JSON-LD schema
 * Optimized for long-tail keywords and low-competition search terms
 */
export function useSEO(config: SEOConfig) {
    useEffect(() => {
        const { title, description, url, image, type = 'website', schema } = config;
        const baseUrl = 'https://couponpush.com';
        const fullUrl = url || window.location.href;
        const ogImage = image || `${baseUrl}/assets/images/og-image.png`;

        // Decode HTML entities in title and description
        const decodedTitle = decodeHTML(title);
        const decodedDescription = decodeHTML(description);

        // Update document title
        document.title = decodedTitle;

        // Update or create meta tags
        const updateMeta = (property: string, content: string) => {
            let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
            if (!meta) {
                meta = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
            }
            if (!meta) {
                meta = document.createElement('meta');
                if (property.startsWith('og:') || property.startsWith('twitter:')) {
                    meta.setAttribute('property', property);
                } else {
                    meta.setAttribute('name', property);
                }
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', decodeHTML(content));
        };

        // Update basic meta tags
        updateMeta('description', decodedDescription);
        updateMeta('title', decodedTitle);

        // Update Open Graph tags
        updateMeta('og:title', decodedTitle);
        updateMeta('og:description', decodedDescription);
        updateMeta('og:url', fullUrl);
        updateMeta('og:image', ogImage);
        updateMeta('og:type', type);
        updateMeta('og:site_name', 'CouponPush');

        // Update Twitter Card tags
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', decodedTitle);
        updateMeta('twitter:description', decodedDescription);
        updateMeta('twitter:image', ogImage);
        updateMeta('twitter:url', fullUrl);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', fullUrl);

        // Inject JSON-LD schema
        if (schema) {
            const existingSchema = document.getElementById('dynamic-schema');
            if (existingSchema) {
                existingSchema.remove();
            }

            const schemaScript = document.createElement('script');
            schemaScript.id = 'dynamic-schema';
            schemaScript.type = 'application/ld+json';

            const schemas = Array.isArray(schema) ? schema : [schema];
            schemaScript.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
            document.head.appendChild(schemaScript);
        }

        return () => {
            const dynamicSchema = document.getElementById('dynamic-schema');
            if (dynamicSchema) {
                dynamicSchema.remove();
            }
        };
    }, [config.title, config.description, config.url, config.image, config.type, config.schema]);
}

/**
 * Generate SEO-optimized title for store pages
 * Targets long-tail keywords: "[Store] Coupon Codes [Month] [Year] - Working Promo Codes"
 */
export function getStorePageTitle(storeName: string): string {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${storeName} Coupon Codes ${month} ${year} - Working Promo Codes & Offers | CouponPush`;
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
    return `Best ${categoryName} Coupons & Discount Codes ${month} ${year} | CouponPush India`;
}

/**
 * Generate SEO-optimized description for category pages
 */
export function getCategoryPageDescription(categoryName: string, couponCount: number): string {
    return `Find ${couponCount}+ working ${categoryName} coupon codes and discount offers. Save big on ${categoryName.toLowerCase()} shopping with verified promo codes. Updated daily!`;
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
            'url': coupon.store_website || `https://couponpush.com/store/${coupon.store_slug}`
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
    rating?: number;
}, couponCount: number) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': store.name,
        'url': store.website_url || `https://couponpush.com/store/${store.slug}`,
        'logo': store.logo || 'https://couponpush.com/assets/images/logo.png',
        'description': store.description || `Find the best ${store.name} coupons and promo codes`,
        ...(store.rating && {
            'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': store.rating,
                'ratingCount': 1240,
                'bestRating': 5
            }
        }),
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
 * Use these patterns when creating new store/category pages
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

export default useSEO;
