import snapshotJson from '@/data/deployed-snapshot.json';
import type { Category, Coupon, Deal, HeroSlide, SeasonalOffer, Store, StorePageData } from '@/types';

interface HomepageSnapshot {
    initialFeaturedCoupons: Coupon[];
    initialLatestCoupons: Coupon[];
    initialFeaturedStores: Store[];
    initialFeaturedDeals: Deal[];
    initialAmazonCoupons: Coupon[];
    initialFlipkartCoupons: Coupon[];
    initialAjioCoupons: Coupon[];
    initialHeroSlides: HeroSlide[];
    initialSeasonalOffers: SeasonalOffer[];
}

interface DeployedSnapshot {
    homepage: HomepageSnapshot | null;
    storesPage: { initialStores: Store[] } | null;
    categoriesPage: { initialCategories: Category[] } | null;
    dealsPage: { initialDeals: Deal[] } | null;
    stores: Record<string, StorePageData>;
    categories: Record<string, unknown>;
    coupons: Record<string, Coupon | null>;
}

export const deployedSnapshot = snapshotJson as unknown as DeployedSnapshot;
