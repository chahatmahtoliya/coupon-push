import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { couponsApi, dealsApi, heroSlidesApi, seasonalOffersApi, storesApi } from '@/services/api';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export const metadata: Metadata = {
    title: 'CouponPush - Best Coupons, Promo Codes & Deals 2026',
    description: 'Compare coupon codes and shopping offers in India. Browse stores, check offer conditions and find savings for your next order.',
    alternates: { canonical: 'https://couponpush.com/' },
    openGraph: {
        type: 'website',
        url: 'https://couponpush.com/',
        title: 'CouponPush - Best Coupons, Promo Codes & Deals 2026',
        description: 'Compare coupon codes and shopping offers in India. Browse stores, check offer conditions and find savings for your next order.',
    },
};

async function safely<T>(request: Promise<T>, fallback: T): Promise<T> {
    try {
        return await request;
    } catch (error) {
        console.error('Homepage build-time data fetch failed:', error);
        return fallback;
    }
}

export default async function HomePage() {
    const recovered = deployedSnapshot.homepage;
    const [
        initialFeaturedCoupons,
        initialLatestCoupons,
        initialFeaturedStores,
        initialFeaturedDeals,
        amazon,
        flipkart,
        ajio,
        initialHeroSlides,
        initialSeasonalOffers,
    ] = await Promise.all([
        safely(couponsApi.getFeatured(8), recovered?.initialFeaturedCoupons || []),
        safely(couponsApi.getLatest(12), recovered?.initialLatestCoupons || []),
        safely(storesApi.getAll(), recovered?.initialFeaturedStores || []),
        safely(dealsApi.getFeatured(4), recovered?.initialFeaturedDeals || []),
        safely(storesApi.getBySlug('amazon'), deployedSnapshot.stores.amazon || null),
        safely(storesApi.getBySlug('flipkart'), deployedSnapshot.stores.flipkart || null),
        safely(storesApi.getBySlug('ajio'), deployedSnapshot.stores.ajio || null),
        safely(heroSlidesApi.getActive(), recovered?.initialHeroSlides || []),
        safely(seasonalOffersApi.getActive(), recovered?.initialSeasonalOffers || []),
    ]);

    return (
        <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
            { '@context': 'https://schema.org', '@type': 'WebSite', '@id': 'https://couponpush.com/#website', name: 'CouponPush', url: 'https://couponpush.com/' },
            { '@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://couponpush.com/#organization', name: 'CouponPush', url: 'https://couponpush.com/', logo: 'https://couponpush.com/assets/home-ui/logo-transparent.png' },
        ]).replace(/</g, '\\u003c') }} />
        <HomePageClient
            initialFeaturedCoupons={initialFeaturedCoupons}
            initialLatestCoupons={initialLatestCoupons}
            initialFeaturedStores={initialFeaturedStores}
            initialFeaturedDeals={initialFeaturedDeals}
            initialAmazonCoupons={amazon?.coupons || recovered?.initialAmazonCoupons || []}
            initialFlipkartCoupons={flipkart?.coupons || recovered?.initialFlipkartCoupons || []}
            initialAjioCoupons={ajio?.coupons || recovered?.initialAjioCoupons || []}
            initialHeroSlides={initialHeroSlides}
            initialSeasonalOffers={initialSeasonalOffers}
        />
        </>
    );
}
