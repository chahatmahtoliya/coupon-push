'use client';

import type { CSSProperties, TouchEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Coupon, Deal, HeroSlide, SeasonalOffer, Store } from '@/types';
import { couponsApi, dealsApi, heroSlidesApi, seasonalOffersApi, storesApi, trackClick } from '@/services/api';
import { CouponModal } from '@/components/common/CouponModal';
import { SeasonalBanner } from '@/components/features/SeasonalBanner';
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

const filters = ['Popular', 'Newest', 'Expiring Soon'] as const;
type CouponFilter = (typeof filters)[number];
type StoreKey = 'amazon' | 'flipkart' | 'ajio';

const storeSections: Array<{ key: StoreKey; slug: string; fallbackName: string; title: string }> = [
    { key: 'amazon', slug: 'amazon', fallbackName: 'Amazon', title: "Today's Top Amazon Deals" },
    { key: 'flipkart', slug: 'flipkart', fallbackName: 'Flipkart', title: "Today's Top Flipkart Deals" },
    { key: 'ajio', slug: 'ajio', fallbackName: 'AJIO', title: "Today's Top AJIO Deals" },
];

function imageUrl(value?: string | null): string | null {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    try {
        const api = new URL('https://couponpush.com/api');
        return `${api.origin}${value.startsWith('/') ? value : `/${value}`}`;
    } catch {
        return value;
    }
}

function discountLabel(coupon: Coupon): string {
    if (coupon.discount_value && Number(coupon.discount_value) !== 0) {
        if (coupon.discount_type === 'percentage') return `${Number(coupon.discount_value)}% OFF`;
        if (coupon.discount_type === 'fixed') return `Rs.${Number(coupon.discount_value).toLocaleString('en-IN')} OFF`;
        return 'DEAL';
    }
    return isCodeCoupon(coupon) ? 'CODE' : 'DEAL';
}

function usageLabel(count = 0): string {
    if (count >= 1000) {
        const thousands = count / 1000;
        return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k used`;
    }
    return `${count} used`;
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
                <span>{coupon.is_featured ? 'Featured Deal' : 'Verified Deal'}</span>
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
    const ariaLabel = [slide.badge_text, slide.heading, slide.subheading].filter(Boolean).join(': ') || 'View featured CouponPush deal';
    return (
        <a href={target} target={isExternal(target) ? '_blank' : undefined} rel={isExternal(target) ? 'noopener noreferrer' : undefined} className={`${large ? 'cp-hero-main' : 'cp-promo-tile'} cp-live-hero-card${visual ? ' has-image' : ''}`} aria-label={ariaLabel}>
            {visual && <img src={visual} alt={slide.alt_text || ariaLabel} decoding={large ? 'sync' : 'async'} fetchPriority={large ? 'high' : 'auto'} onError={(event) => { event.currentTarget.style.display = 'none'; onImageError(visual); }} />}
            <div className="cp-live-hero-overlay">
                {slide.badge_text && <span>{slide.badge_text}</span>}
                {title && <h2>{title}</h2>}
                {description && <p>{description}</p>}
                {cta && <strong>{cta} <i className="fas fa-arrow-right" aria-hidden="true" /></strong>}
            </div>
        </a>
    );
}

type HeroItem = { key: string; kind: 'slide'; slide: HeroSlide } | { key: string; kind: 'coupon'; coupon: Coupon };

function HeroItemCard({ item, large = false, onImageError }: { item: HeroItem; large?: boolean; onImageError: (url: string) => void }) {
    return item.kind === 'slide' ? <SlideHeroCard slide={item.slide} large={large} onImageError={onImageError} /> : <CouponHeroCard coupon={item.coupon} large={large} />;
}

function HeroCarousel({ items, activeIndex, canNavigate, onNavigate, onImageError }: { items: HeroItem[]; activeIndex: number; canNavigate: boolean; onNavigate: (direction: number) => void; onImageError: (url: string) => void }) {
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
        </div>
    );
}

function TrendingCouponCard({ coupon }: { coupon: Coupon }) {
    const [modalCoupon, setModalCoupon] = useState<Coupon | null>(null);
    const target = couponTarget(coupon);
    const coded = isCodeCoupon(coupon);
    const cta = <><span className="cp-mini-cta-label">{getCouponCtaLabel(coupon).toUpperCase()}</span><span className="cp-mini-cta-reveal" aria-hidden="true" /><span className="cp-mini-cta-shine" aria-hidden="true" /></>;
    return <>
        <article className="cp-coupon-card">
            <div className="cp-coupon-top">
                <Link href={getStorePath(coupon.store_slug)} aria-label={`${coupon.store_name} store`}><BrandIdentity name={coupon.store_name} logo={coupon.store_logo} slug={coupon.store_slug} /></Link>
                <span className="cp-discount-pill">{discountLabel(coupon)}</span>
            </div>
            <h3>{coupon.title}</h3>
            {coupon.description && <p>{coupon.description}</p>}
            <div className="cp-coupon-meta">
                {coupon.is_verified && <span className="verified"><i className="fas fa-check-circle" aria-hidden="true" /> Verified</span>}
                <span><i className="fas fa-users" aria-hidden="true" /> {usageLabel(coupon.click_count)}</span>
                {coded ? <button type="button" className="cp-mini-cta" onClick={() => setModalCoupon(coupon)}>{cta}</button> : <a href={target} target={isExternal(target) ? '_blank' : undefined} rel={isExternal(target) ? 'noopener noreferrer' : undefined} className="cp-mini-cta" onClick={() => void trackClick('coupon', coupon.id)}>{cta}</a>}
            </div>
        </article>
        <CouponModal coupon={modalCoupon} isOpen={Boolean(modalCoupon)} onClose={() => setModalCoupon(null)} />
    </>;
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

function ProductCouponCard({ coupon }: { coupon: Coupon }) {
    const target = couponTarget(coupon);
    const couponImage = imageUrl(coupon.image);
    const storeLogo = imageUrl(coupon.store_logo);
    const [failed, setFailed] = useState(false);
    const hasCouponImage = Boolean(couponImage && !failed);
    const visual = hasCouponImage ? couponImage : storeLogo;
    useEffect(() => setFailed(false), [couponImage, storeLogo]);
    return (
        <article className="cp-product-card">
            <div className="cp-product-top"><span>{discountLabel(coupon)}</span><Link href={getCouponPath(coupon.id)} aria-label={`Open ${coupon.title}`}><i className="far fa-heart" aria-hidden="true" /></Link></div>
            <div className="cp-product-image">{visual ? <img src={visual} alt={hasCouponImage ? '' : coupon.store_name} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <BrandIdentity name={coupon.store_name} logo={coupon.store_logo} slug={coupon.store_slug} compact />}</div>
            <h3>{coupon.title}</h3>
            <p><i className="fas fa-star" aria-hidden="true" /> {coupon.is_verified ? 'Verified' : 'Deal'} <span>|</span> {usageLabel(coupon.click_count)}</p>
            <a href={target} target={isExternal(target) ? '_blank' : undefined} rel={isExternal(target) ? 'noopener noreferrer' : undefined} className="cp-product-cta" onClick={() => void trackClick('coupon', coupon.id)}>View Deal <i className="fas fa-arrow-right" aria-hidden="true" /></a>
        </article>
    );
}

function StoreDealsSection({ config, coupons, slide, cardsPerView, onSlideChange }: { config: (typeof storeSections)[number]; coupons: Coupon[]; slide: number; cardsPerView: number; onSlideChange: (slide: number) => void }) {
    if (coupons.length === 0) return null;
    const maxSlide = Math.max(0, coupons.length - cardsPerView);
    const dots = Array.from({ length: Math.max(1, maxSlide + 1) }, (_, index) => index);
    const name = coupons[0]?.store_name || config.fallbackName;
    const logo = coupons[0]?.store_logo;
    const slug = coupons[0]?.store_slug || config.slug;
    return (
        <section className="cp-amazon cp-store-deals cp-shell" aria-label={config.title}>
            <button className="cp-slider-arrow cp-slider-prev" type="button" aria-label={`Previous ${name} deals`} disabled={slide === 0} onClick={() => onSlideChange(Math.max(0, slide - 1))}><i className="fas fa-chevron-left" aria-hidden="true" /></button>
            <button className="cp-slider-arrow cp-slider-next" type="button" aria-label={`Next ${name} deals`} disabled={slide >= maxSlide} onClick={() => onSlideChange(Math.min(maxSlide, slide + 1))}><i className="fas fa-chevron-right" aria-hidden="true" /></button>
            <div className="cp-amazon-head">
                <Link href={getStorePath(slug)} className="cp-store-deal-logo" aria-label={`${name} store`}><BrandIdentity name={name} logo={logo} slug={slug} compact /></Link>
                <div><h2>{config.title}</h2></div>
                <Link href={getStorePath(slug)} className="cp-outline-button">View all deals <i className="fas fa-arrow-right" aria-hidden="true" /></Link>
            </div>
            <div className="cp-product-viewport" style={{ '--cp-amazon-per-view': cardsPerView } as CSSProperties}>
                <div className="cp-product-track" style={{ transform: `translateX(calc(-${slide} * (100% / ${cardsPerView})))` }}>
                    {coupons.map((coupon) => <div key={coupon.id} className="cp-product-slide"><ProductCouponCard coupon={coupon} /></div>)}
                </div>
            </div>
            <div className="cp-carousel-dots" aria-hidden="true">{dots.map((dot) => <button key={dot} type="button" className={dot === slide ? 'active' : ''} onClick={() => onSlideChange(dot)} aria-label={`Show ${name} deal slide ${dot + 1}`} />)}</div>
        </section>
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
    const [storeCoupons, setStoreCoupons] = useState<Record<StoreKey, Coupon[]>>({ amazon: props.initialAmazonCoupons.slice(0, 8), flipkart: props.initialFlipkartCoupons.slice(0, 8), ajio: props.initialAjioCoupons.slice(0, 8) });
    const [heroSlides, setHeroSlides] = useState(props.initialHeroSlides);
    const [seasonalOffers, setSeasonalOffers] = useState(props.initialSeasonalOffers);
    const [filter, setFilter] = useState<CouponFilter>('Popular');
    const [productSlides, setProductSlides] = useState<Record<StoreKey, number>>({ amazon: 0, flipkart: 0, ajio: 0 });
    const [cardsPerView, setCardsPerView] = useState(4);
    const [heroIndex, setHeroIndex] = useState(0);
    const [failedHeroImages, setFailedHeroImages] = useState(() => new Set<string>());
    const [storesPerPage, setStoresPerPage] = useState(12);
    const [storePage, setStorePage] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        seasonalOffersApi.getActiveFresh().then((data) => active && setSeasonalOffers(data)).catch((error) => console.error('Failed to refresh seasonal offers:', error));
        Promise.all([
            couponsApi.getFeaturedFresh(8), couponsApi.getLatestFresh(12), storesApi.getAllFresh(), dealsApi.getFeaturedFresh(4),
            storesApi.getBySlugFresh('amazon'), storesApi.getBySlugFresh('flipkart'), storesApi.getBySlugFresh('ajio'), heroSlidesApi.getActiveFresh(),
        ]).then(([featured, latest, allStores, featuredDeals, amazon, flipkart, ajio, slides]) => {
            if (!active) return;
            setFeaturedCoupons(featured); setLatestCoupons(latest); setStores(allStores); setDeals(featuredDeals);
            setStoreCoupons({ amazon: amazon.coupons.slice(0, 8), flipkart: flipkart.coupons.slice(0, 8), ajio: ajio.coupons.slice(0, 8) });
            setHeroSlides(slides);
        }).catch((error) => console.error('Failed to refresh homepage backend data:', error));
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const resize = () => {
            const width = window.innerWidth;
            if (width <= 620) { setCardsPerView(1); setStoresPerPage(6); }
            else if (width <= 760) { setCardsPerView(2); setStoresPerPage(8); }
            else if (width <= 1100) { setCardsPerView(3); setStoresPerPage(10); }
            else { setCardsPerView(4); setStoresPerPage(12); }
        };
        resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
    }, []);

    const trendingCoupons = useMemo(() => {
        const sorted = uniqueCoupons([...featuredCoupons, ...latestCoupons]).sort((a, b) => {
            if (filter === 'Newest') return (b.id || 0) - (a.id || 0);
            if (filter === 'Expiring Soon') {
                if (!a.expiry_date) return 1;
                if (!b.expiry_date) return -1;
                return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
            }
            return (b.click_count || 0) - (a.click_count || 0);
        });
        const picked: Coupon[] = [];
        const storeKeys = new Set<string>();
        sorted.forEach((coupon) => { const key = coupon.store_slug || coupon.store_name || String(coupon.store_id || coupon.id); if (picked.length < 6 && !storeKeys.has(key)) { storeKeys.add(key); picked.push(coupon); } });
        sorted.forEach((coupon) => { if (picked.length < 6 && !picked.some((item) => item.id === coupon.id)) picked.push(coupon); });
        return picked;
    }, [featuredCoupons, latestCoupons, filter]);

    const heroFallbackCoupons = useMemo(() => trendingCoupons.slice(0, 3), [trendingCoupons]);
    const validHeroSlides = useMemo(() => heroSlides.filter((slide) => { const url = imageUrl(slide.image); return !url || !failedHeroImages.has(url); }), [failedHeroImages, heroSlides]);
    const heroItems = useMemo<HeroItem[]>(() => validHeroSlides.length > 0 ? validHeroSlides.map((slide) => ({ key: `slide-${slide.id}`, kind: 'slide', slide })) : heroFallbackCoupons.map((coupon) => ({ key: `coupon-${coupon.id}`, kind: 'coupon', coupon })), [heroFallbackCoupons, validHeroSlides]);
    const visibleHeroItems = useMemo(() => heroItems.length === 0 ? [] : Array.from({ length: Math.min(3, heroItems.length) }, (_, offset) => heroItems[(heroIndex + offset) % heroItems.length]), [heroIndex, heroItems]);
    const storePages = useMemo(() => chunks(stores.filter((store) => Boolean(imageUrl(store.logo))), storesPerPage), [stores, storesPerPage]);
    const maxStorePage = Math.max(0, storePages.length - 1);

    useEffect(() => setHeroIndex(0), [heroItems.length]);
    useEffect(() => { if (heroItems.length <= 1) return; const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroItems.length), 4500); return () => window.clearInterval(timer); }, [heroItems.length]);
    useEffect(() => setStorePage((page) => Math.min(page, maxStorePage)), [maxStorePage]);
    useEffect(() => setProductSlides((current) => {
        const next = { ...current }; let changed = false;
        storeSections.forEach(({ key }) => { const max = Math.max(0, storeCoupons[key].length - cardsPerView); if (next[key] > max) { next[key] = 0; changed = true; } });
        return changed ? next : current;
    }), [cardsPerView, storeCoupons]);

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
        <section className="cp-hero cp-shell" aria-label="Featured deals">
            {visibleHeroItems.length > 0 ? <HeroCarousel items={visibleHeroItems} activeIndex={heroIndex} canNavigate={heroItems.length > 1} onNavigate={(direction) => setHeroIndex((index) => direction > 0 ? (index + 1) % heroItems.length : (index - 1 + heroItems.length) % heroItems.length)} onImageError={markHeroFailed} /> : <EmptyState label="No featured backend offers are available right now." />}
        </section>

        {seasonalOffers.length > 0 && <SeasonalBanner offer={seasonalOffers[0]} />}

        <section className="cp-section cp-shell">
            <div className="cp-section-head">
                <div><h2>Trending Coupons</h2><p>Handpicked coupons from top stores</p></div>
                <div className="cp-filter-tabs" role="tablist" aria-label="Sort trending coupons">
                    {filters.map((label, index) => <button key={label} id={`coupon-tab-${index}`} type="button" role="tab" className={filter === label ? 'active' : ''} aria-selected={filter === label} aria-controls="trending-coupons-panel" tabIndex={filter === label ? 0 : -1} onClick={() => setFilter(label)} onKeyDown={(event) => {
                        let next = index; if (event.key === 'ArrowRight') next = (index + 1) % filters.length; else if (event.key === 'ArrowLeft') next = (index - 1 + filters.length) % filters.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = filters.length - 1; else return;
                        event.preventDefault(); setFilter(filters[next]); document.getElementById(`coupon-tab-${next}`)?.focus();
                    }}>{label}</button>)}
                </div>
            </div>
            {trendingCoupons.length > 0 ? <div id="trending-coupons-panel" className="cp-coupon-grid" role="tabpanel" aria-labelledby={`coupon-tab-${filters.indexOf(filter)}`} tabIndex={0}>{trendingCoupons.map((coupon) => <TrendingCouponCard key={coupon.id} coupon={coupon} />)}</div> : <div id="trending-coupons-panel" role="tabpanel"><EmptyState label="No live coupons returned from the backend." /></div>}
            <Link href="/deals" className="cp-text-link">View all deals <i className="fas fa-arrow-right" aria-hidden="true" /></Link>
        </section>

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

        <section className="cp-section cp-shell cp-best-deals">
            <div className="cp-section-head cp-section-head-inline"><h2>Best Deals Today</h2><Link href="/deals" className="cp-text-link">View all deals <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
            {deals.length > 0 ? <div className="cp-deal-strip">{deals.slice(0, 4).map((deal) => <BestDealCard key={deal.id} deal={deal} />)}</div> : <EmptyState label="No featured deals returned from the backend." />}
        </section>

        {storeSections.map((config) => <StoreDealsSection key={config.key} config={config} coupons={storeCoupons[config.key]} slide={productSlides[config.key]} cardsPerView={cardsPerView} onSlideChange={(slide) => setProductSlides((current) => ({ ...current, [config.key]: slide }))} />)}
    </>;
}
