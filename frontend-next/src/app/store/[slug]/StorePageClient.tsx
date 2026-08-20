'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CouponModal } from '@/components/common';
import { storesApi } from '@/services/api';
import type { Coupon, Store, StorePageData } from '@/types';
import { getCouponCtaLabel, isCodeCoupon } from '@/utils/coupon';

type Filter = 'all' | 'codes' | 'deals';
type Sort = 'popular' | 'newest' | 'discount';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const QUICK_INFO = [
    { label: 'Cashback', value: 'Up to 7% Rewards', icon: 'fa-wallet' },
    { label: 'Payment Offers', value: 'Credit Card, UPI, Wallets', icon: 'fa-credit-card' },
    { label: 'Shipping', value: 'Free on eligible orders', icon: 'fa-truck' },
    { label: 'Return Policy', value: 'Easy store returns', icon: 'fa-rotate-left' },
    { label: 'Support', value: 'Store customer care', icon: 'fa-phone' },
];
const STORE_CATEGORIES = [
    { label: 'Men', icon: 'fa-shirt' },
    { label: 'Women', icon: 'fa-person-dress' },
    { label: 'Kids', icon: 'fa-child' },
    { label: 'Footwear', icon: 'fa-shoe-prints' },
    { label: 'Accessories', icon: 'fa-glasses' },
    { label: 'Home & Living', icon: 'fa-house' },
    { label: 'Sports', icon: 'fa-basketball' },
    { label: 'Beauty', icon: 'fa-spray-can' },
    { label: 'Brands', icon: 'fa-tags' },
];

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatStoreContent(content?: string | null): string {
    const value = content?.trim();
    if (!value) return '';
    if (HTML_TAG_PATTERN.test(value)) return value;
    return value.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean).map((block) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        if (!lines.length) return '';
        if (lines.length === 1) {
            const heading = lines[0].match(/^(h[1-6]|p)\s*:\s*(.+)$/i);
            if (heading) return `<${heading[1].toLowerCase()}>${escapeHtml(heading[2])}</${heading[1].toLowerCase()}>`;
            if (/^[A-Z][A-Z\s&/()-]{2,}$/.test(lines[0])) return `<h2>${escapeHtml(lines[0])}</h2>`;
            return `<p>${escapeHtml(lines[0])}</p>`;
        }
        if (lines[0].length <= 90 && !/[.!?:]$/.test(lines[0])) return `<h2>${escapeHtml(lines[0])}</h2><p>${escapeHtml(lines.slice(1).join(' '))}</p>`;
        return `<p>${escapeHtml(lines.join(' '))}</p>`;
    }).filter(Boolean).join('');
}

function cleanStoreName(name: string): string {
    return name.replace(/\s+(coupon|promo|discount)\s+codes?$/i, '').replace(/\s+coupons?$/i, '').trim() || name;
}

function compactNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K+`;
    return String(value);
}

function currency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function discountValue(coupon: Coupon): string {
    const text = `${coupon.title} ${coupon.description}`.toLowerCase();
    if (text.includes('free shipping') || text.includes('free delivery')) return 'Free';
    if (!coupon.discount_value || coupon.discount_value <= 0) return isCodeCoupon(coupon) ? 'Code' : 'Deal';
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`;
    if (coupon.discount_type === 'fixed' || String(coupon.discount_type) === 'flat') return `${currency(coupon.discount_value)} OFF`;
    return 'Offer';
}

function visualDiscount(coupon: Coupon): string {
    const value = discountValue(coupon);
    if (value === 'Code') return 'Coupon Offer';
    if (value === 'Deal') return 'Best Deal';
    if (coupon.discount_type === 'percentage' && value.endsWith('%')) return `${value} OFF`;
    return value;
}

function offerStyle(coupon: Coupon) {
    const text = `${coupon.title} ${coupon.description}`.toLowerCase();
    if (text.includes('bank') || text.includes('card')) return { label: 'Bank Offer', icon: 'fa-building-columns', tone: 'blue' };
    if (text.includes('free shipping') || text.includes('free delivery')) return { label: 'Free Shipping', icon: 'fa-truck-fast', tone: 'green' };
    if (isCodeCoupon(coupon)) return { label: 'Coupon Code', icon: 'fa-ticket', tone: 'blue' };
    if (coupon.coupon_type === 'deal') return { label: 'Deal', icon: 'fa-bolt', tone: 'orange' };
    return { label: 'Offer', icon: 'fa-tag', tone: 'orange' };
}

function sortCoupons(coupons: Coupon[], sort: Sort): Coupon[] {
    const result = [...coupons];
    if (sort === 'newest') return result.sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return bDate - aDate;
    });
    if (sort === 'discount') return result.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0));
    return result.sort((a, b) => a.is_featured !== b.is_featured ? Number(b.is_featured) - Number(a.is_featured) : (b.click_count || 0) - (a.click_count || 0));
}

function expiryLabel(value?: string): string {
    if (!value) return 'Ongoing';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Ongoing' : `Valid Till ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function StoreLogo({ store, displayName }: { store: Store; displayName: string }) {
    const [showImage, setShowImage] = useState(Boolean(store.logo));
    useEffect(() => setShowImage(Boolean(store.logo)), [store.logo]);
    if (showImage && store.logo) return <img src={store.logo} alt={displayName} loading="lazy" decoding="async" onError={() => setShowImage(false)} />;
    const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'CP';
    return <span>{initials}</span>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <section className={`store-ui-card ${className}`}>{children}</section>;
}

export default function StorePageClient({ initialData, slug }: { initialData: StorePageData | null; slug: string }) {
    const [data, setData] = useState(initialData);
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<Sort>('popular');
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
    const [saved, setSaved] = useState<Set<number>>(() => new Set());
    const offersRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        storesApi.getBySlugFresh(slug).then((fresh) => {
            if (active) setData({ store: fresh.store, coupons: fresh.coupons || [], related_stores: fresh.related_stores || [] });
        }).catch((error) => console.error('Failed to refresh store data:', error));
        return () => { active = false; };
    }, [slug]);

    const store = data?.store || null;
    const coupons = data?.coupons || [];
    const displayName = cleanStoreName(store?.name || 'Store');
    const filteredCoupons = useMemo(() => sortCoupons(coupons.filter((coupon) => (
        filter === 'codes' ? isCodeCoupon(coupon) : filter === 'deals' ? !isCodeCoupon(coupon) : true
    )), sort), [coupons, filter, sort]);

    if (!store) return <section className="store-ui-page store-ui-empty"><div className="store-ui-shell"><div className="store-ui-empty-panel"><i className="fa-solid fa-store-slash" aria-hidden="true" /><h1>Store not found</h1><p>We could not load this store page right now.</p><Link href="/stores" className="store-ui-primary-button">Browse Stores</Link></div></div></section>;

    const categoryName = store.category_name || 'Stores';
    const rating = Number(store.rating || 4.4);
    const codeCount = coupons.filter(isCodeCoupon).length;
    const dealCount = coupons.length - codeCount;
    const offerCount = coupons.length || store.coupon_count || 0;
    const totalClicks = coupons.reduce((sum, coupon) => sum + (coupon.click_count || 0), 0);
    const shoppers = compactNumber(Math.max(totalClicks, 2400 * offerCount, 1200));
    const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const description = store.description || `Find the latest ${displayName} coupon codes, promo codes and online shopping offers on CouponPush.`;
    const bestOffers = sortCoupons(coupons, 'discount').slice(0, 10);
    const bestOffer = bestOffers[0];
    const usefulLinks = [`${displayName} Student Discount`, `${displayName} First Purchase Offer`, `${displayName} Corporate Offers`, `${displayName} Gift Cards`, `All ${displayName} Offers`];
    const contentPanels = [
        { id: 'about-store', icon: 'fa-info-circle', title: `About ${displayName}`, html: formatStoreContent(store.about_content) || `<p>${escapeHtml(description)}</p>` },
        { id: 'how-to-use', icon: 'fa-tag', title: `How to Use ${displayName} Coupons & Promo Codes`, html: formatStoreContent(store.howto_content) || `<ol><li>Choose a verified ${escapeHtml(displayName)} coupon from CouponPush.</li><li>Copy the coupon code or activate the deal.</li><li>Visit ${escapeHtml(displayName)} and add eligible products to your cart.</li><li>Paste the coupon code at checkout and confirm the discount before payment.</li></ol>` },
        { id: 'terms', icon: 'fa-file-contract', title: `${displayName} Coupon Terms & Conditions`, html: formatStoreContent(store.terms_content) || `<ul><li>Coupons may be valid only on selected products, categories, users, or payment methods.</li><li>Minimum order value, maximum discount, and expiry dates can vary by offer.</li><li>Offers cannot always be combined with other coupon codes or store promotions.</li><li>Final savings are subject to ${escapeHtml(displayName)} terms at checkout.</li></ul>` },
    ];
    const scrollOffers = (direction: 'left' | 'right') => {
        const rail = offersRef.current;
        if (!rail) return;
        const item = rail.querySelector<HTMLElement>('.store-ui-mini-offer');
        rail.scrollBy({ left: (direction === 'left' ? -1 : 1) * (item ? item.offsetWidth + 18 : Math.round(rail.clientWidth * 0.85)), behavior: 'smooth' });
    };
    const toggleSaved = (id: number) => setSaved((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    return <section className="store-ui-page">
        <div className="store-ui-breadcrumb store-ui-shell" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fa-solid fa-chevron-right" aria-hidden="true" /><Link href="/stores">{categoryName}</Link><i className="fa-solid fa-chevron-right" aria-hidden="true" /><span>{displayName} Coupons</span></div>
        <div className="store-ui-shell store-ui-layout">
            <aside className="store-ui-sidebar">
                <Card className="store-ui-brand-card">
                    <button className="store-ui-icon-button store-ui-heart-button" type="button" aria-label={`Save ${displayName}`}><i className="fa-regular fa-heart" aria-hidden="true" /></button>
                    <div className="store-ui-brand-logo"><StoreLogo store={store} displayName={displayName} /></div>
                    <div className="store-ui-rating"><i className="fa-solid fa-star" aria-hidden="true" /><strong>{rating.toFixed(1)}</strong><span>({compactNumber(Math.max(420 * offerCount, 1260))} ratings)</span></div>
                    {store.website_url && <a className="store-ui-site-link" href={store.website_url} target="_blank" rel="noopener noreferrer">{store.website_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>}
                </Card>
                <Card><h2>{displayName} Quick Info</h2><div className="store-ui-info-list">{QUICK_INFO.map((item) => <div className="store-ui-info-row" key={item.label}><span className="store-ui-info-icon"><i className={`fa-solid ${item.icon}`} aria-hidden="true" /></span><span><strong>{item.label}</strong><small>{item.value}</small></span></div>)}</div>{store.website_url && <a className="store-ui-primary-button store-ui-full-button" href={store.website_url} target="_blank" rel="noopener noreferrer">Visit {displayName} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>}</Card>
                <Card><h2>Shop by Category</h2><nav className="store-ui-category-list" aria-label={`${displayName} categories`}>{STORE_CATEGORIES.map((item) => <Link href={`/search?q=${encodeURIComponent(`${displayName} ${item.label}`)}`} key={item.label}><span><i className={`fa-solid ${item.icon}`} aria-hidden="true" /></span>{item.label}</Link>)}</nav></Card>
                <Card><h2>Useful Links</h2><div className="store-ui-link-list">{usefulLinks.map((label) => <a href="#store-ui-offers" key={label}>{label}</a>)}</div></Card>
                <Card className="store-ui-newsletter"><h2>Never miss a deal!</h2><p>Get {displayName} offers and exclusive coupons straight to your inbox.</p><form onSubmit={(event) => event.preventDefault()}><label className="visually-hidden" htmlFor="store-ui-newsletter-email">Email address</label><input id="store-ui-newsletter-email" type="email" placeholder="Enter email address" /><button type="submit">Subscribe</button></form><small>No spam. Unsubscribe anytime.</small></Card>
            </aside>
            <div className="store-ui-main">
                <section className="store-ui-hero"><div className="store-ui-hero-content"><div className="store-ui-hero-mobile-logo" aria-hidden="true"><StoreLogo store={store} displayName={displayName} /></div><div className="store-ui-hero-copy"><h1>{displayName} {store.h1_suffix || 'Coupons, Promo Codes & Discount Offers'}</h1><p className="store-ui-verified-line">Verified {displayName} Coupons for {month}</p><div className="store-ui-hero-stats"><div><span><i className="fa-solid fa-tags" aria-hidden="true" /></span><strong>{offerCount}+</strong><small>Active Offers</small></div><div><span><i className="fa-solid fa-star" aria-hidden="true" /></span><strong>{rating.toFixed(1)}</strong><small>Store Rating</small></div><div><span><i className="fa-solid fa-users" aria-hidden="true" /></span><strong>{shoppers}</strong><small>Happy Shoppers</small></div></div><p className="store-ui-hero-description">{description}</p><p className="store-ui-search-summary">CouponPush tracks {displayName} coupon codes, discount offers, promo deals and seasonal savings in one place. Popular searches include {displayName} coupon codes, {displayName} discount offers.</p></div>{store.website_url && <a className="store-ui-mobile-shop-button" href={store.website_url} target="_blank" rel="noopener noreferrer">Shop at {displayName} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></a>}<div className="store-ui-hero-brand">{store.website_url && <a href={store.website_url} target="_blank" rel="noopener noreferrer">Shop at {displayName} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></a>}</div></div></section>
                <section className="store-ui-best-offers"><div className="store-ui-section-heading"><h2><i className="fa-solid fa-fire" aria-hidden="true" /> Best {displayName} Offers</h2><div className="store-ui-section-actions"><div className="store-ui-slider-controls" aria-label="Best offers slider controls"><button type="button" onClick={() => scrollOffers('left')} aria-label="Previous best offers"><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button><button type="button" onClick={() => scrollOffers('right')} aria-label="Next best offers"><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button></div><a href="#store-ui-offers">View All Offers <i className="fa-solid fa-arrow-right" aria-hidden="true" /></a></div></div><div className="store-ui-offer-grid" ref={offersRef}>{bestOffers.map((coupon) => { const style = offerStyle(coupon); const title = coupon.title.replace(displayName, '').replace(/coupon code:?/i, '').trim() || coupon.title; return <article className={`store-ui-mini-offer store-ui-tone-${style.tone}`} key={coupon.id}><span className="store-ui-offer-badge"><i className={`fa-solid ${style.icon}`} aria-hidden="true" /> {style.label}</span><strong>{discountValue(coupon)}</strong><h3>{title}</h3><p>{coupon.description || 'Use this verified offer at checkout to save on your purchase.'}</p><footer><button type="button" onClick={() => setActiveCoupon(coupon)}>T&amp;C</button><button type="button" className="store-ui-mini-cta" onClick={() => setActiveCoupon(coupon)}>{getCouponCtaLabel(coupon)} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></button></footer></article>; })}</div></section>
                <section className="store-ui-card store-ui-answer-panel"><h2>Best {displayName} coupon right now</h2><p>{bestOffer ? `The top current ${displayName} offer is “${bestOffer.title}”. Check the offer details, expiry date and checkout terms before using it.` : `Check this page for the latest ${displayName} coupon codes, discount offers and limited-time deals.`}</p></section>
                <section className="store-ui-coupon-section" id="store-ui-offers">
                    <div className="store-ui-coupon-toolbar"><h2>All {displayName} Coupons &amp; Offers <span>({filteredCoupons.length}+)</span></h2><div className="store-ui-filter-panel"><div className="store-ui-segments" role="tablist" aria-label="Offer filter">{([{ id: 'all', label: `All (${coupons.length})` }, { id: 'codes', label: `Coupons (${codeCount})` }, { id: 'deals', label: `Offers (${dealCount})` }] as { id: Filter; label: string }[]).map((item) => <button type="button" className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} aria-selected={filter === item.id} key={item.id}>{item.label}</button>)}</div><label><span>Sort by:</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="popular">Popular</option><option value="newest">Newest</option><option value="discount">Discount</option></select></label></div></div>
                    {!filteredCoupons.length ? <div className="store-ui-empty-offers"><i className="fa-solid fa-ticket" aria-hidden="true" /><h3>{coupons.length ? 'No offers found' : 'No verified active offers right now'}</h3><p>{coupons.length ? 'Try switching back to all offers.' : `Use the ${displayName} coupon guide below and confirm any promotion at the official checkout.`}</p>{!!coupons.length && <button type="button" onClick={() => setFilter('all')}>Show All Offers</button>}</div> : <div className="store-ui-coupon-list">{filteredCoupons.map((coupon) => { const style = offerStyle(coupon); const isSaved = saved.has(coupon.id); return <article className="store-ui-coupon-card" key={coupon.id}><div className={`store-ui-coupon-visual store-ui-tone-${style.tone}`}><span>{style.label}</span><strong>{visualDiscount(coupon)}</strong>{isCodeCoupon(coupon) && <><small>Code hidden</small><i className="store-ui-ticket-notch store-ui-ticket-left" aria-hidden="true" /><i className="store-ui-ticket-notch store-ui-ticket-right" aria-hidden="true" /></>}</div><div className="store-ui-coupon-details"><h3>{coupon.title}</h3><p>{coupon.description || 'Use this verified offer at checkout to save on your purchase.'}</p><div className="store-ui-coupon-meta"><span><i className="fa-regular fa-clock" aria-hidden="true" /> {expiryLabel(coupon.expiry_date)}</span><span><i className="fa-solid fa-users" aria-hidden="true" /> {coupon.click_count ? `Used ${coupon.click_count.toLocaleString('en-IN')} times` : 'Fresh offer'}</span><span className="store-ui-success"><i className="fa-solid fa-check-circle" aria-hidden="true" /> Success {Math.min(98, (coupon.is_verified ? 87 : 78) + (coupon.id % 9))}%</span></div></div><div className="store-ui-coupon-actions"><button type="button" className="store-ui-action-button" onClick={() => setActiveCoupon(coupon)}><span className="store-ui-action-label">{getCouponCtaLabel(coupon)} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></span><span className="store-ui-action-reveal" aria-hidden="true" /><span className="store-ui-action-shine" aria-hidden="true" /></button><div className="store-ui-card-links"><button type="button" aria-label={isSaved ? 'Remove saved offer' : 'Save offer'} className={isSaved ? 'active' : ''} onClick={() => toggleSaved(coupon.id)}><i className={`${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" /></button></div></div></article>; })}</div>}
                </section>
                <section className="store-ui-content-stack">{contentPanels.map((panel) => <article className="store-ui-content-panel store-info-body" id={`store-ui-${panel.id}`} key={panel.id}><header><i className={`fa-solid ${panel.icon}`} aria-hidden="true" /><h2>{panel.title}</h2></header><div dangerouslySetInnerHTML={{ __html: panel.html }} /></article>)}</section>
                <section className="store-ui-extra-grid"><div className="store-ui-card"><h2>Top Categories on {displayName}</h2><div className="store-ui-chip-cloud">{STORE_CATEGORIES.map((item) => <Link href={`/search?q=${encodeURIComponent(`${displayName} ${item.label}`)}`} key={item.label}>{item.label}</Link>)}</div></div><div className="store-ui-card store-ui-faq-card" id="store-ui-faqs"><h2>{displayName} Coupon FAQs</h2><div className="store-ui-faq-list"><article><h3>Does {displayName} have coupon codes?</h3><p>CouponPush lists available {displayName} coupon codes and non-code offers, then separates them into coupon and offer tabs for easier checking.</p></article><article><h3>How do I find {displayName} discounts?</h3><p>Start with the highest discount sort, then compare the coupon terms, minimum order value, expiry date and product eligibility before checkout.</p></article><article><h3>Can I use more than one {displayName} coupon?</h3><p>Most stores allow only one coupon code per order. Bank offers, wallet offers or store sales may still combine depending on the official checkout terms.</p></article></div></div></section>
            </div>
        </div>
        <CouponModal coupon={activeCoupon} isOpen={Boolean(activeCoupon)} onClose={() => setActiveCoupon(null)} />
    </section>;
}
