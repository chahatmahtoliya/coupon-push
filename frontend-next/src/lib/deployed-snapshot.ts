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

const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.couponpush.com').replace(/\/$/, '');
const IMAGE_FIELDS = new Set(['logo', 'store_logo', 'image', 'banner_image', 'mobile_banner_image']);

function normalizeSnapshotAsset(value: string): string {
    if (!value || value.startsWith('data:')) return value;
    if (value.startsWith('//')) return `https:${value}`;

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if ((url.hostname === 'couponpush.com' || url.hostname === 'www.couponpush.com')
                && url.pathname.startsWith('/uploads/')) {
                return `${MEDIA_BASE}${url.pathname}${url.search}`;
            }
        } catch {
            return value;
        }
        return value;
    }

    if (value.startsWith('/uploads/')) return `${MEDIA_BASE}${value}`;
    if (value.startsWith('uploads/')) return `${MEDIA_BASE}/${value}`;
    return value;
}

function normalizeSnapshotMedia(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(normalizeSnapshotMedia);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [
            key,
            IMAGE_FIELDS.has(key) && typeof item === 'string'
                ? normalizeSnapshotAsset(item)
                : normalizeSnapshotMedia(item),
        ]));
    }
    return value;
}

export const deployedSnapshot = normalizeSnapshotMedia(snapshotJson) as DeployedSnapshot;
