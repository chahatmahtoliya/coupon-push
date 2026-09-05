'use client';

import type { TouchEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Coupon, Deal, HeroSlide, SeasonalOffer, Store } from '@/types';
import { couponsApi, dealsApi, heroSlidesApi, seasonalOffersApi, storesApi, trackClick } from '@/services/api';
import { SeasonalBanner } from '@/components/features/SeasonalBanner';
import { TopTrendingCarousel } from '@/components/features/TopTrendingCarousel';
import { MaterialStoreCarousel } from '@/components/features/MaterialStoreCarousel';
import { getCouponPath, getStorePath } from '@/lib/routes';
import { getCouponCtaLabel, isCodeCoupon } from '@/utils/coupon';

interface HomePageClientProps {
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

type StoreKey = 'amazon' | 'flipkart' | 'ajio';

const storeSections: Array<{ key: StoreKey; slug: string; fallbackName: string; title: string }> = [
    { key: 'amazon', slug: 'amazon', fallbackName: 'Amazon', title: 'More ways to save: Amazon promo codes' },
    { key: 'flipkart', slug: 'flipkart', fallbackName: 'Flipkart', title: "Today's Top Flipkart Deals" },
    { key: 'ajio', slug: 'ajio', fallbackName: 'AJIO', title: "Today's Top AJIO Deals" },
];

const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://api.couponpush.com').replace(/\/$/, '');

function imageUrl(value?: string | null): string | null {
    if (!value) return null;
    if (value.startsWith('//')) return `https:${value}`;
    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if ((url.hostname === 'couponpush.com' || url.hostname === 'www.couponpush.com')
                && url.pathname.startsWith('/uploads/')) {
                return `${mediaBase}${url.pathname}${url.search}`;
            }
        } catch {
            return value;
        }
        return value;
    }
    if (value.startsWith('/uploads/')) return `${mediaBase}${value}`;
    if (value.startsWith('uploads/')) return `${mediaBase}/${value}`;
    try {
        const api = new URL(process.env.NEXT_PUBLIC_API_URL || 'https://api.couponpush.com/api');
        return `${api.origin}${value.startsWith('/') ? value : `/${value}`}`;
    } catch {
        return value;
    }
}

function discountLabel(coupon: Coupon): string {
    if (coupon.discount_value && Number(coupon.discount_value) !== 0) {
        if (coupon.discount_type === 'percentage') return `${Number(coupon.discount_value)}% OFF`;
        if (coupon.discount_type === 'fixed' || (coupon.discount_type as string) === 'flat') return `Rs.${Number(coupon.discount_value).toLocaleString('en-IN')} OFF`;
        return 'DEAL';
    }
    return isCodeCoupon(coupon) ? 'CODE' : 'DEAL';
}

function couponTarget(coupon: Coupon): string {
    if (coupon.code?.trim()) return getCouponPath(coupon.id);
    return coupon.affiliate_link || coupon.store_website_url || getStorePath(coupon.store_slug);
}

function isExternal(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

function BrandIdentity({ name, logo, slug, compact = false }: { name: string; logo?: string | null; slug?: string; compact?: boolean }) {
    const key = `${slug || ''} ${name || ''}`.toLowerCase();
    const brand = key.includes('boat') ? 'boat' : key.includes('amazon') ? 'amazon' : key.includes('ajio') ? 'ajio' : key.includes('flipkart') ? 'flipkart' : key.includes('myntra') ? 'myntra' : key.includes('zomato') ? 'zomato' : key.includes('swiggy') ? 'swiggy' : key.includes('kapiva') ? 'kapiva' : '';
    const normalizedLogo = imageUrl(logo);
    return (
        <span className={`cp-brand-identity ${compact ? 'compact' : ''}`}>
            {normalizedLogo && brand !== 'flipkart' ? (
                <>
                    <img src={normalizedLogo} alt={name} loading="lazy" decoding="async" onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'inline-flex';
                    }} />
                    <span className={`cp-brand-mark ${brand}`} style={{ display: 'none' }}>{name}</span>
                </>
            ) : <span className={`cp-brand-mark ${brand}`}>{name}</span>}
        </span>
    );
}

function EmptyState({ label }: { label: string }) {
    return <div className="cp-empty-state"><i className="fas fa-circle-info" aria-hidden="true" /><span>{label}</span></div>;
}

function CouponHeroCard({ coupon, large = false }: { coupon: Coupon; large?: boolean }) {
    const target = couponTarget(coupon);
    const visual = imageUrl(coupon.image);
    return (
        <a href={target} target={isExternal(target) ? '_blank' : undefined} rel={isExternal(target) ? 'noopener noreferrer' : undefined} className={`${large ? 'cp-hero-main' : 'cp-promo-tile'} cp-live-hero-card`} aria-label={`${coupon.store_name}: ${coupon.title} (${discountLabel(coupon)})`} onClick={() => void trackClick('coupon', coupon.id)}>
            <div className="cp-live-hero-copy">
                <span>{coupon.is_featured ? 'Featured Deal' : coupon.is_verified ? 'Verified Deal' : 'Listed Deal'}</span>
                <h2>{large ? discountLabel(coupon) : coupon.store_name}</h2>
                <h3>{coupon.title}</h3>
                <p>{coupon.description || `Latest offer from ${coupon.store_name}`}</p>
                <strong>{getCouponCtaLabel(coupon)} <i className="fas fa-arrow-right" aria-hidden="true" /></strong>
            </div>
            <div className="cp-live-hero-visual">
                {visual ? <img src={visual} alt={`${coupon.store_name} offer: ${coupon.title}`} /> : <BrandIdentity name={coupon.store_name} logo={coupon.store_logo} slug={coupon.store_slug} compact />}
            </div>
        </a>
    );
}

function SlideHeroCard({ slide, large = false, onImageError }: { slide: HeroSlide; large?: boolean; onImageError: (url: string) => void }) {
    const target = slide.cta_url || '/deals';
    const visual = imageUrl(slide.image);
    const title = slide.heading || (visual ? '' : slide.badge_text || 'Featured Deal');
    const description = slide.subheading || (visual ? '' : 'Fresh savings picked for you');
    const cta = slide.cta_label || (visual ? '' : 'Shop Now');
    const hasOverlayContent = Boolean(slide.badge_text || title || description || cta);
    const ariaLabel = [slide.badge_text, slide.heading, slide.subheading].filter(Boolean).join(': ') || 'View featured CouponPush deal';
    return (
        <a href={target} target={isExternal(target) ? '_blank' : undefined} rel={isExternal(target) ? 'noopener noreferrer' : undefined} className={`${large ? 'cp-hero-main' : 'cp-promo-tile'} cp-live-hero-card${visual ? ' has-image' : ''}`} aria-label={ariaLabel}>
            {visual && <img src={visual} alt={slide.alt_text || ariaLabel} decoding={large ? 'sync' : 'async'} fetchPriority={large ? 'high' : 'auto'} onError={(event) => { event.currentTarget.style.display = 'none'; onImageError(visual); }} />}
            {hasOverlayContent && <div className="cp-live-hero-overlay">
                {slide.badge_text && <span>{slide.badge_text}</span>}
                {title && <h2>{title}</h2>}
                {description && <p>{description}</p>}
                {cta && <strong>{cta} <i className="fas fa-arrow-right" aria-hidden="true" /></strong>}
            </div>}
        </a>
    );
}

type HeroItem = { key: string; kind: 'slide'; slide: HeroSlide } | { key: string; kind: 'coupon'; coupon: Coupon };

function HeroItemCard({ item, large = false, onImageError }: { item: HeroItem; large?: boolean; onImageError: (url: string) => void }) {
    return item.kind === 'slide' ? <SlideHeroCard slide={item.slide} large={large} onImageError={onImageError} /> : <CouponHeroCard coupon={item.coupon} large={large} />;
}

function HeroCarousel({ items, activeIndex, totalItems, canNavigate, isPaused, isRotationPaused, onNavigate, onSelect, onTogglePause, onImageError }: { items: HeroItem[]; activeIndex: number; totalItems: number; canNavigate: boolean; isPaused: boolean; isRotationPaused: boolean; onNavigate: (direction: number) => void; onSelect: (index: number) => void; onTogglePause: () => void; onImageError: (url: string) => void }) {
    return (
        <div className="cp-hero-carousel">
            {canNavigate && <>
                <button type="button" className="cp-hero-arrow cp-hero-arrow-prev" aria-label="Previous featured deals" onClick={() => onNavigate(-1)}><i className="fas fa-chevron-left" aria-hidden="true" /></button>
                <button type="button" className="cp-hero-arrow cp-hero-arrow-next" aria-label="Next featured deals" onClick={() => onNavigate(1)}><i className="fas fa-chevron-right" aria-hidden="true" /></button>
            </>}
            <div className="cp-hero-motion-stage">
                <div className="cp-hero-frame" key={`${activeIndex}-${items[0]?.key || 'empty'}`}>
                    {items[0] && <HeroItemCard item={items[0]} large onImageError={onImageError} />}
                    <div className="cp-hero-side">{items.slice(1, 3).map((item) => <HeroItemCard key={item.key} item={item} onImageError={onImageError} />)}</div>
                </div>
            </div>
            {canNavigate && <div className="cp-hero-toolbar">
                <span className="cp-hero-counter" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} <span>/</span> {String(totalItems).padStart(2, '0')}</span>
                <div className="cp-hero-pagination" role="group" aria-label="Choose featured deal">
                    {Array.from({ length: totalItems }, (_, index) => <button key={index} type="button" className={index === activeIndex ? 'active' : ''} aria-label={`Show featured deal ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => onSelect(index)} />)}
                </div>
                <span className="cp-hero-progress" aria-hidden="true"><span key={activeIndex} className={isRotationPaused ? 'is-paused' : ''} /></span>
                <button type="button" className="cp-hero-pause" aria-label={isPaused ? 'Resume featured deals' : 'Pause featured deals'} aria-pressed={isPaused} onClick={onTogglePause}><i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`} aria-hidden="true" /></button>
            </div>}
        </div>
    );
}

function BestDealCard({ deal }: { deal: Deal }) {
    const visual = imageUrl(deal.image);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    useEffect(() => { setLoaded(false); setFailed(false); }, [visual]);
    const hasImage = Boolean(visual && loaded && !failed);
    const target = deal.url || getStorePath(deal.store_slug);
    return (
        <a href={target} target={isExternal(deal.url || '') ? '_blank' : undefined} rel={isExternal(deal.url || '') ? 'noopener noreferrer' : undefined} className={`cp-deal-image-card cp-real-deal-card${hasImage ? '' : ' cp-real-deal-card-no-image'}`} onClick={() => void trackClick('deal', deal.id)}>
            {visual && !failed && <img className={loaded ? 'is-loaded' : ''} src={visual} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
            <div className="cp-real-deal-copy"><h3>{deal.title}</h3><p>{deal.description || deal.store_name}</p><span>Shop Now <i className="fas fa-arrow-right" aria-hidden="true" /></span></div>
        </a>
    );
}

function uniqueCoupons(coupons: Coupon[]): Coupon[] {
    const ids = new Set<number>();
    return coupons.filter((coupon) => !ids.has(coupon.id) && Boolean(ids.add(coupon.id)));
}

function chunks<T>(items: T[], size: number): T[][] {
    if (size <= 0) return [items];
    const result: T[][] = [];
    for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
    return result;
}

export default function HomePageClient(props: HomePageClientProps) {
    const [featuredCoupons, setFeaturedCoupons] = useState(props.initialFeaturedCoupons);
    const [latestCoupons, setLatestCoupons] = useState(props.initialLatestCoupons);
    const [stores, setStores] = useState(props.initialFeaturedStores);
    const [deals, setDeals] = useState(props.initialFeaturedDeals);
    const [storeCoupons, setStoreCoupons] = useState<Record<StoreKey, Coupon[]>>({ amazon: props.initialAmazonCoupons, flipkart: props.initialFlipkartCoupons, ajio: props.initialAjioCoupons });
    const [heroSlides, setHeroSlides] = useState(props.initialHeroSlides);
    const [seasonalOffers, setSeasonalOffers] = useState(props.initialSeasonalOffers);
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);
    const [heroInteracting, setHeroInteracting] = useState(false);
    const [failedHeroImages, setFailedHeroImages] = useState(() => new Set<string>());
    const storesPerPage = 14;
    const [storePage, setStorePage] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        seasonalOffersApi.getActiveFresh().then((data) => active && setSeasonalOffers(data)).catch((error) => console.error('Failed to refresh seasonal offers:', error));
        Promise.allSettled([
            couponsApi.getFeaturedFresh(16), couponsApi.getLatestFresh(16), storesApi.getAllFresh(), dealsApi.getFeaturedFresh(4),
            storesApi.getBySlugFresh('amazon'), storesApi.getBySlugFresh('flipkart'), storesApi.getBySlugFresh('ajio'), heroSlidesApi.getActiveFresh(),
        ]).then(([featured, latest, allStores, featuredDeals, amazon, flipkart, ajio, slides]) => {
            if (!active) return;
            if (featured.status === 'fulfilled') setFeaturedCoupons(featured.value);
            if (latest.status === 'fulfilled') setLatestCoupons(latest.value);
            if (allStores.status === 'fulfilled') setStores(allStores.value);
            if (featuredDeals.status === 'fulfilled') setDeals(featuredDeals.value);
            setStoreCoupons(current => ({
                amazon: amazon.status === 'fulfilled' ? amazon.value.coupons : current.amazon,
                flipkart: flipkart.status === 'fulfilled' ? flipkart.value.coupons : current.flipkart,
                ajio: ajio.status === 'fulfilled' ? ajio.value.coupons : current.ajio,
            }));
            if (slides.status === 'fulfilled') setHeroSlides(slides.value);
        });
        return () => { active = false; };
    }, []);

    const recentlyAddedCoupons = useMemo(() => uniqueCoupons(latestCoupons).slice(0, 18), [latestCoupons]);
    const recentlyAddedIds = useMemo(() => new Set(recentlyAddedCoupons.map((coupon) => coupon.id)), [recentlyAddedCoupons]);

    // Ranked top trending coupons, excluding the separate recently-added feed.
    const trendingCoupons = useMemo(() => {
        const sorted = uniqueCoupons([...featuredCoupons, ...latestCoupons])
            .filter((coupon) => !recentlyAddedIds.has(coupon.id))
            .sort((a, b) => {
                return (b.click_count || 0) - (a.click_count || 0);
            });
        const picked: Coupon[] = [];
        const storeKeys = new Set<string>();
        // First pass: unique stores
        sorted.forEach((coupon) => {
            const key = coupon.store_slug || coupon.store_name || String(coupon.store_id || coupon.id);
            if (picked.length < 18 && !storeKeys.has(key)) {
                storeKeys.add(key);
                picked.push(coupon);
            }
        });
        // Second pass: fill remaining
        sorted.forEach((coupon) => {
            if (picked.length < 18 && !picked.some((item) => item.id === coupon.id)) {
                picked.push(coupon);
            }
        });
        return picked;
    }, [featuredCoupons, latestCoupons, recentlyAddedIds]);

    const heroFallbackCoupons = useMemo(() => trendingCoupons.slice(0, 3), [trendingCoupons]);
    const validHeroSlides = useMemo(() => heroSlides.filter((slide) => { const url = imageUrl(slide.image); return !url || !failedHeroImages.has(url); }), [failedHeroImages, heroSlides]);
    const heroItems = useMemo<HeroItem[]>(() => validHeroSlides.length > 0 ? validHeroSlides.map((slide) => ({ key: `slide-${slide.id}`, kind: 'slide', slide })) : heroFallbackCoupons.map((coupon) => ({ key: `coupon-${coupon.id}`, kind: 'coupon', coupon })), [heroFallbackCoupons, validHeroSlides]);
    const visibleHeroItems = useMemo(() => heroItems.length === 0 ? [] : Array.from({ length: Math.min(3, heroItems.length) }, (_, offset) => heroItems[(heroIndex + offset) % heroItems.length]), [heroIndex, heroItems]);
    const storePages = useMemo(() => chunks(stores.filter((store) => Boolean(imageUrl(store.logo))), storesPerPage), [stores, storesPerPage]);
    const maxStorePage = Math.max(0, storePages.length - 1);

    useEffect(() => setHeroIndex(0), [heroItems.length]);
    useEffect(() => { if (heroItems.length <= 1 || heroPaused || heroInteracting) return; const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroItems.length), 4500); return () => window.clearInterval(timer); }, [heroInteracting, heroItems.length, heroPaused]);
    useEffect(() => setStorePage((page) => Math.min(page, maxStorePage)), [maxStorePage]);

    const markHeroFailed = useCallback((url: string) => setFailedHeroImages((current) => current.has(url) ? current : new Set(current).add(url)), []);
    const goToStorePage = (page: number) => setStorePage(Math.max(0, Math.min(maxStorePage, page)));
    const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        const end = event.changedTouches[0]?.clientX || 0;
        if (touchStart == null) return;
        const delta = touchStart - end; setTouchStart(null);
        if (Math.abs(delta) >= 35) goToStorePage(storePage + (delta > 0 ? 1 : -1));
    };

    return <>
        <h1 className="visually-hidden">CouponPush - Best Coupons, Promo Codes and Deals</h1>

        {/* Hero Banner Carousel */}
        <section className="cp-hero cp-shell" aria-label="Featured deals" onMouseEnter={() => setHeroInteracting(true)} onMouseLeave={() => setHeroInteracting(false)} onFocusCapture={() => setHeroInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeroInteracting(false); }}>
            {visibleHeroItems.length > 0 ? <HeroCarousel items={visibleHeroItems} activeIndex={heroIndex} totalItems={heroItems.length} canNavigate={heroItems.length > 1} isPaused={heroPaused} isRotationPaused={heroPaused || heroInteracting} onNavigate={(direction) => setHeroIndex((index) => direction > 0 ? (index + 1) % heroItems.length : (index - 1 + heroItems.length) % heroItems.length)} onSelect={setHeroIndex} onTogglePause={() => setHeroPaused((paused) => !paused)} onImageError={markHeroFailed} /> : <EmptyState label="No featured backend offers are available right now." />}
        </section>

        {/* Newly added coupons use the same carousel without trending ranks. */}
        {recentlyAddedCoupons.length > 0 && (
            <TopTrendingCarousel
                coupons={recentlyAddedCoupons}
                title="Newly added coupons"
                viewAllLink="/offers"
                showPromoBanner={false}
                showRanks={false}
            />
        )}

        {/* Top Trending Section with Material UI Product Cards Carousel & More Trending Deals Banner */}
        {trendingCoupons.length > 0 && (
            <TopTrendingCarousel
                coupons={trendingCoupons}
                title="Top trending"
                viewAllLink="/deals"
                showPromoBanner={true}
            />
        )}

        {/* Amazon Promo Codes Carousel */}
        {storeCoupons.amazon.length > 0 && (
            <MaterialStoreCarousel
                title="More ways to save: Amazon promo codes"
                coupons={storeCoupons.amazon}
                storeSlug="amazon"
                storeName="Amazon"
                storeLogo={storeCoupons.amazon[0]?.store_logo}
            />
        )}

        {/* Top Stores Section */}
        <section className="cp-section cp-shell cp-store-section">
            <div className="cp-section-head cp-section-head-inline"><h2>Top Stores</h2><Link href="/stores" className="cp-text-link">View all stores <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
            {storePages.length > 0 ? <div className="cp-store-carousel" onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={handleTouchEnd}>
                <button className="cp-store-nav cp-store-nav-prev" type="button" aria-label="Previous top stores" disabled={storePage === 0} onClick={() => goToStorePage(storePage - 1)}><i className="fas fa-chevron-left" aria-hidden="true" /></button>
                <div className="cp-store-viewport"><div className="cp-store-track" style={{ transform: `translateX(-${storePage * 100}%)` }}>{storePages.map((page, pageIndex) => <div key={pageIndex} className="cp-store-row">
                    {page.map((store) => <Link key={store.id} href={getStorePath(store.slug)} className="cp-store-card" aria-label={`${store.name} store`}><img src={imageUrl(store.logo) || '/placeholder-store.png'} alt={store.name} loading="lazy" decoding="async" onError={(event) => event.currentTarget.closest('.cp-store-card')?.classList.add('is-hidden')} /></Link>)}
                    {pageIndex === storePages.length - 1 && <Link href="/stores" className="cp-store-card cp-store-all" aria-label="View all stores"><span className="cp-grid-icon"><i /><i /><i /><i /></span></Link>}
                </div>)}</div></div>
                <button className="cp-store-nav cp-store-nav-next" type="button" aria-label="Next top stores" disabled={storePage >= maxStorePage} onClick={() => goToStorePage(storePage + 1)}><i className="fas fa-chevron-right" aria-hidden="true" /></button>
                {storePages.length > 1 && <div className="cp-store-dots" aria-label="Top store pages">{storePages.map((_, index) => <button key={index} type="button" className={index === storePage ? 'active' : ''} aria-label={`Show top stores page ${index + 1}`} onClick={() => goToStorePage(index)} />)}</div>}
            </div> : <EmptyState label="No featured stores returned from the backend." />}
        </section>

        {/* Seasonal Offers */}
        {seasonalOffers.length > 0 && <SeasonalBanner offer={seasonalOffers[0]} />}

        {/* Flipkart Deals Carousel */}
        {storeCoupons.flipkart.length > 0 && (
            <MaterialStoreCarousel
                title="Today's Top Flipkart Deals"
                coupons={storeCoupons.flipkart}
                storeSlug="flipkart"
                storeName="Flipkart"
                storeLogo={storeCoupons.flipkart[0]?.store_logo}
            />
        )}

        {/* Best Deals Today */}
        {deals.length > 0 && (
            <section className="cp-section cp-shell cp-best-deals">
                <div className="cp-section-head cp-section-head-inline"><h2>Best Deals Today</h2><Link href="/deals" className="cp-text-link">View all deals <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
                <div className="cp-deal-strip">{deals.slice(0, 4).map((deal) => <BestDealCard key={deal.id} deal={deal} />)}</div>
            </section>
        )}

        {/* AJIO Deals Carousel */}
        {storeCoupons.ajio.length > 0 && (
            <MaterialStoreCarousel
                title="Today's Top AJIO Deals"
                coupons={storeCoupons.ajio}
                storeSlug="ajio"
                storeName="AJIO"
                storeLogo={storeCoupons.ajio[0]?.store_logo}
            />
        )}
    </>;
}
