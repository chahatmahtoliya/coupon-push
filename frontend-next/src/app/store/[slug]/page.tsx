import type { Metadata } from 'next';
import { storesApi } from '@/services/api';
import StorePageClient from './StorePageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { hasIndexableStoreContent } from '@/lib/indexability';
import { getStorePseoContent } from '@/lib/store-pseo';

function cleanStoreName(name: string): string {
    return name
        .replace(/\s+(coupon|promo|discount)\s+codes?$/i, '')
        .replace(/\s+coupons?$/i, '')
        .trim() || name;
}

function cleanCustomTitle(title?: string): string {
    return (title || '').replace(/\s*[|\-]\s*CouponPush\s*$/i, '').trim();
}

function hasContent(value?: string): boolean {
    const text = (value || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 0;
}

function storeDescription(storeName: string, offerCount: number, codeCount: number, custom?: string): string {
    if (hasContent(custom)) return custom!.trim();
    const dealCount = Math.max(offerCount - codeCount, 0);
    return `Browse ${offerCount} active ${storeName} offers, including ${codeCount} coupon ${codeCount === 1 ? 'code' : 'codes'} and ${dealCount} online ${dealCount === 1 ? 'deal' : 'deals'}. Check current terms and expiry dates.`;
}

const fallbackStoreSlugs = [
    'flipkart', 'kapiva-coupon-code', 'ajio', 'myntra', 'zomato', 'swiggy', 'blinkit',
    'dominos', 'redbus', 'cetaphil-coupon-code', 'amazon', 'boat-lifestyle', 'hostinger',
    'amazon-prime-day-sale-2026', 'decathlon-coupon-code', 'derma-co-coupon-code',
    'lenovo', 'dot-key-coupon-codes', 'cetaphil',
];

export async function generateStaticParams() {
    try {
        const stores = await storesApi.getAll();
        return stores.map((store) => ({
            slug: store.slug,
        }));
    } catch (error) {
        console.error('Failed to fetch stores for static params:', error);
        return fallbackStoreSlugs.map((slug) => ({ slug }));
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const canonical = `https://couponpush.com/store/${slug}/`;
    let data = deployedSnapshot.stores[slug] || null;

    if (!data) {
        try {
            data = await storesApi.getBySlug(slug);
        } catch {
            // Use the last deployed snapshot when the API is unavailable during export.
        }
    }

    if (!data?.store) {
        return {
            title: 'Store Coupons',
            description: 'Find verified store coupon codes and promo offers on CouponPush.',
            alternates: { canonical },
            robots: { index: false, follow: true },
        };
    }

    const storeName = cleanStoreName(data.store.name);
    const offerCount = data.coupons?.length || data.store.coupon_count || 0;
    const codeCount = data.coupons?.filter((coupon) => Boolean(coupon.code) || coupon.coupon_type === 'code' || coupon.coupon_type === 'coupon').length || 0;
    const dealCount = Math.max(offerCount - codeCount, 0);
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const shortMonthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const pseo = getStorePseoContent({ slug, storeName, coupons: data.coupons || [], offerCount, codeCount, dealCount, monthYear, shortMonthYear });
    const customDescription = hasContent(data.store.meta_description) ? data.store.meta_description!.trim() : '';
    const description = customDescription || pseo?.metaDescription || storeDescription(storeName, offerCount, codeCount, data.store.description);
    const customTitle = cleanCustomTitle(data.store.meta_title);
    const title = customTitle && customTitle.toLowerCase().includes(storeName.toLowerCase()) && /(coupon|offer|deal|promo)/i.test(customTitle)
        ? customTitle
        : pseo?.metaTitle || `${storeName} Coupon Codes & Offers ${monthYear}`;

    return {
        title: pseo ? { absolute: title } : title,
        description,
        alternates: { canonical },
        robots: {
            index: hasIndexableStoreContent(data),
            follow: true,
            googleBot: { index: hasIndexableStoreContent(data), follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
        },
        openGraph: {
            type: 'website',
            url: canonical,
            title,
            description,
            images: data.store.logo ? [{ url: data.store.logo, alt: storeName }] : undefined,
        },
    };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let initialData = deployedSnapshot.stores[slug] || null;

    if (!initialData) {
        try {
            initialData = await storesApi.getBySlug(slug);
        } catch (error) {
            console.error(`Failed to fetch ${slug} store page:`, error);
        }
    }

    if (!initialData?.store) return <StorePageClient initialData={initialData} slug={slug} />;

    const canonical = `https://couponpush.com/store/${slug}/`;
    const storeName = cleanStoreName(initialData.store.name);
    const offerCount = initialData.coupons?.length || initialData.store.coupon_count || 0;
    const codeCount = initialData.coupons?.filter((coupon) => Boolean(coupon.code) || coupon.coupon_type === 'code' || coupon.coupon_type === 'coupon').length || 0;
    const dealCount = Math.max(offerCount - codeCount, 0);
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const shortMonthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const pseo = getStorePseoContent({ slug, storeName, coupons: initialData.coupons || [], offerCount, codeCount, dealCount, monthYear, shortMonthYear });
    const customDescription = hasContent(initialData.store.meta_description) ? initialData.store.meta_description!.trim() : '';
    const description = customDescription || pseo?.metaDescription || storeDescription(storeName, offerCount, codeCount, initialData.store.description);
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: pseo?.h1 || `${storeName} Coupon Codes & Offers`,
            description,
            url: canonical,
            isPartOf: { '@type': 'WebSite', name: 'CouponPush', url: 'https://couponpush.com/' },
            ...(initialData.store.updated_at ? { dateModified: initialData.store.updated_at } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://couponpush.com/' },
                { '@type': 'ListItem', position: 2, name: 'Stores', item: 'https://couponpush.com/stores/' },
                { '@type': 'ListItem', position: 3, name: `${storeName} Coupons`, item: canonical },
            ],
        },
        ...(pseo ? [{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: pseo.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
        }] : []),
    ];

    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <StorePageClient initialData={initialData} slug={slug} />
    </>;
}
