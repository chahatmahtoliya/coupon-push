import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { couponsApi, dealsApi, heroSlidesApi, seasonalOffersApi, storesApi } from '@/services/api';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export const metadata: Metadata = {
    title: 'CouponPush - Best Coupons, Promo Codes & Deals 2026',
    description: 'Find verified coupon codes, exclusive deals, and promo codes for top stores including Amazon, Flipkart, Myntra, and Zomato.',
    alternates: { canonical: 'https://couponpush.com/' },
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
    );
}
