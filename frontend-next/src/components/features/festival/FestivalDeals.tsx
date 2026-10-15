'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FestivalCampaign, FestivalProduct as FestivalDeal } from '@/lib/festival-template';
import { trackClick } from '@/services/api';
type FestivalCategory = string;


const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function ProductCard({ deal, saved, onSave, merchant }: { deal: FestivalDeal; saved: boolean; onSave: () => void; merchant: string }) {
    const [failedImage, setFailedImage] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    useEffect(() => { setFailedImage(false); setCopied(false); setCopyFailed(false); }, [deal.image, deal.code]);
    async function copyCode() { try { await navigator.clipboard.writeText(deal.code || ""); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); } }
    return <article className="festival-product">
        <div className="festival-product-image">
            <span className="festival-product-label">{deal.coupon ? 'Extra coupon' : 'Festival deal'}</span>
            <a href={deal.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${deal.title} on ${merchant}`}>{failedImage ? <span className="festival-image-fallback"><i className="fas fa-box-open" aria-hidden="true" />{deal.brand}</span> : <img src={deal.image} alt={deal.title} width="500" height="500" loading="lazy" onError={() => setFailedImage(true)} />}</a>
            <button type="button" className="festival-save" aria-label={`${saved ? 'Unsave' : 'Save'} ${deal.title}`} aria-pressed={saved} onClick={onSave}><i className={`${saved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button>
        </div>
        <div className="festival-product-copy">
            <p className={`festival-product-discount${deal.discountPercent || deal.coupon ? ' has-offer' : ''}`}>{deal.discountPercent ? `${deal.discountPercent}% OFF` : deal.coupon ? 'Extra coupon available' : 'Advertised price'}</p>
            <p className="festival-product-price"><strong>{deal.advertisedPrice === null ? 'Check price' : rupees.format(deal.advertisedPrice)}</strong>{deal.originalPrice !== null && <del>{rupees.format(deal.originalPrice)}</del>}</p>
            <h3><a href={deal.url} target="_blank" rel="noopener noreferrer">{deal.title}</a></h3>
            {deal.code && <button type="button" className="festival-copy-code" onClick={copyCode} aria-label={`Copy code ${deal.code}`}>{copied ? 'Copied' : `Copy ${deal.code}`}</button>}
            {copyFailed && <small role="status">Copy this code manually: {deal.code}</small>}
            <a className="festival-product-cta" onClick={() => void trackClick('coupon', Number(deal.id))} href={deal.url} target="_blank" rel="noopener noreferrer" aria-label={`Shop ${deal.title} on ${merchant}`}><span>Shop deal</span><i className="fas fa-arrow-right" aria-hidden="true" /></a>
            <p className={`festival-product-highlight${deal.includesBankOffer ? ' is-bank' : ''}`}><i className={deal.includesBankOffer ? 'far fa-credit-card' : deal.coupon ? 'fas fa-ticket' : 'fas fa-tag'} aria-hidden="true" /><span>{deal.includesBankOffer ? 'Bank offer included' : deal.coupon ? 'Product-page coupon' : deal.categoryLabel}</span></p>
            <details className="festival-product-details"><summary>Offer details <i className="fas fa-chevron-down" aria-hidden="true" /></summary><p>{deal.coupon || deal.note}</p>{deal.coupon && <p>{deal.note}</p>}{deal.sourceUrl && <a className="festival-product-source" href={deal.sourceUrl} target="_blank" rel="noopener noreferrer">Source{deal.checkedAt ? ` · ${deal.checkedAt.slice(0, 10)}` : ''}</a>}</details>
        </div>
    </article>;
}

export default function FestivalDeals({ deals: festivalDeals, campaign }: { deals: FestivalDeal[]; campaign: FestivalCampaign }) {
    const storageKey = `cp-festival-${campaign.slug}-saved`;
    const festivalCategories = useMemo(() => [{ id: "all", label: "All deals" }, ...Array.from(new Map(festivalDeals.map(deal => [deal.category, {id: deal.category, label: deal.categoryLabel}])).values())], [festivalDeals]);
    const [category, setCategory] = useState<FestivalCategory>('all');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('featured');
    const [bankOnly, setBankOnly] = useState(false);
    const [couponOnly, setCouponOnly] = useState(false);
    const [savedOnly, setSavedOnly] = useState(false);
    const [saved, setSaved] = useState<string[]>([]);
    const featuredRef = useRef<HTMLDivElement>(null);
    const carouselStep = useRef(1);
    const [carousel, setCarousel] = useState({ page: 0, pages: 1 });
    const featuredDeals = useMemo(() => [...festivalDeals].sort((a,b) => Number(b.featured) - Number(a.featured)), [festivalDeals]);

    useEffect(() => {
        const row = featuredRef.current;
        if (!row) return;
        const update = () => {
            const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
            const itemWidth = row.querySelector('article')?.getBoundingClientRect().width || row.clientWidth;
            const stride = itemWidth + gap;
            const step = Math.max(1, Math.floor((row.clientWidth + gap) / stride)) * stride;
            carouselStep.current = step;
            const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
            const pages = step > 0 ? Math.ceil(maxScroll / step) + 1 : 1;
            const page = maxScroll > 0 && row.scrollLeft >= maxScroll - 3 ? pages - 1 : Math.floor((row.scrollLeft + step / 2) / step);
            setCarousel({ page: Math.min(page, pages - 1), pages });
        };
        const observer = new ResizeObserver(update);
        observer.observe(row); row.addEventListener('scroll', update, { passive: true }); update();
        return () => { observer.disconnect(); row.removeEventListener('scroll', update); };
    }, [featuredDeals]);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (Array.isArray(stored)) setSaved(stored.filter(id => typeof id === 'string' && festivalDeals.some(deal => deal.id === id)));
        } catch { /* Saving deals is optional. */ }
    }, [storageKey, festivalDeals]);

    function toggleSave(id: string) {
        setSaved(current => {
            const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
            try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the current session usable if storage is unavailable. */ }
            return next;
        });
    }

    const filtered = useMemo(() => festivalDeals.filter(deal =>
        (category === 'all' || deal.category === category) &&
        `${deal.title} ${deal.brand}`.toLowerCase().includes(query.trim().toLowerCase()) &&
        (!bankOnly || deal.includesBankOffer) && (!couponOnly || Boolean(deal.coupon)) && (!savedOnly || saved.includes(deal.id)),
    ).sort((a, b) => sort === 'price-low' ? (a.advertisedPrice ?? Infinity) - (b.advertisedPrice ?? Infinity) : sort === 'price-high' ? (b.advertisedPrice ?? -Infinity) - (a.advertisedPrice ?? -Infinity) : Number(Boolean(b.featured)) - Number(Boolean(a.featured))), [category, query, bankOnly, couponOnly, savedOnly, saved, sort]);
    const activeFilters = Number(bankOnly) + Number(couponOnly);

    function resetFilters() { setCategory('all'); setQuery(''); setBankOnly(false); setCouponOnly(false); setSavedOnly(false); }
    function browseCollection(nextCategory: FestivalCategory, coupons = false) {
        resetFilters(); setCategory(nextCategory); setCouponOnly(coupons);
        document.getElementById('festival-deals')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    function scrollFeatured(direction: number) {
        const next = Math.max(0, Math.min(carousel.pages - 1, carousel.page + direction));
        goToFeatured(next);
    }
    function goToFeatured(page: number) {
        const row = featuredRef.current;
        row?.scrollTo({ left: Math.min(page * carouselStep.current, row.scrollWidth - row.clientWidth), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }

    return <>
        <section className="festival-featured" aria-labelledby="festival-featured-title">
            <div className="festival-section-heading"><div><h2 id="festival-featured-title">Festival picks</h2><p>Find your next favourite for your home, tech and more.</p></div><button type="button" className="festival-inline-action" onClick={() => browseCollection('all')}>View all <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
            <div className="festival-featured-layout">
                <div className="festival-promo">
                    <span className="festival-promo-merchant">{campaign.merchant.toLowerCase() === 'amazon' && <i className="fab fa-amazon" aria-hidden="true" />}{campaign.merchant}</span>
                    <h3>{campaign.amazon ? <>Great Indian<br />Festival finds.</> : <>Your festival<br />starts here.</>}</h3>
                    <p>Discover deals for your everyday.<br />A little more for your wishlist.</p>
                    <button type="button" onClick={() => browseCollection('all')}>Shop all deals <i className="fas fa-arrow-right" aria-hidden="true" /></button>
                    {featuredDeals.length > 0 ? <div className="festival-promo-products" aria-hidden="true">{featuredDeals.slice(0, 3).map(deal => <img key={deal.id} src={deal.image} alt="" width="180" height="180" />)}</div> : campaign.banner && <img className="festival-promo-banner" src={campaign.banner} alt={`${campaign.name} banner`} width="2000" height="1125" />}
                </div>
                <div className="festival-featured-row" ref={featuredRef}>{featuredDeals.map(deal => <ProductCard key={deal.id} deal={deal} merchant={campaign.merchant} saved={saved.includes(deal.id)} onSave={() => toggleSave(deal.id)} />)}{!featuredDeals.length && <div className="festival-featured-placeholder"><i className="fas fa-box-open" aria-hidden="true" /><p>Festival offers will appear here as they are added.</p></div>}</div>
            </div>
            <div className="festival-carousel-footer"><div className="festival-carousel-dots" role="group" aria-label="Featured deal pages">{Array.from({length: carousel.pages}, (_, index) => <button type="button" key={index} aria-label={`Featured deals page ${index + 1}`} aria-pressed={carousel.page === index} onClick={() => goToFeatured(index)}><span /></button>)}</div><div className="festival-carousel-controls"><button type="button" disabled={carousel.page === 0} aria-label="Previous featured deals" onClick={() => scrollFeatured(-1)}><i className="fas fa-chevron-left" aria-hidden="true" /></button><button type="button" disabled={carousel.page === carousel.pages - 1} aria-label="Next featured deals" onClick={() => scrollFeatured(1)}><i className="fas fa-chevron-right" aria-hidden="true" /></button></div></div>
        </section>
        <section className="festival-coupons" aria-labelledby="festival-coupon-title">
            <div className="festival-section-heading"><h2 id="festival-coupon-title">A little extra off</h2><button type="button" className="festival-inline-action" onClick={() => browseCollection('all', true)}>See coupon offers <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
            <div className="festival-coupon-row"><div className="festival-coupon-intro"><i className="fas fa-ticket" aria-hidden="true" /><span>THE COUPON CORNER</span><h3>Small extras.<br />Better savings.</h3><p>Check the product-page coupon before checkout.</p><button type="button" onClick={() => browseCollection('all', true)}>Explore coupons <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
                {festivalDeals.filter(deal => deal.coupon).slice(0, 2).map(deal => <ProductCard key={deal.id} deal={deal} merchant={campaign.merchant} saved={saved.includes(deal.id)} onSave={() => toggleSave(deal.id)} />)}
                <div className="festival-bank-edit"><span className="festival-eyebrow">THE PAYMENT CHECK</span><i className="far fa-credit-card" aria-hidden="true" /><h3>Make your card count.</h3><p>{campaign.bankOffer ? <><strong>{campaign.bankOffer}</strong>. Check eligible cards, minimum spend and offer caps.</> : <>Compare eligible payment offers and check the final checkout total.</>}</p><a href={campaign.merchantUrl} target="_blank" rel="noopener noreferrer">Check on {campaign.merchant} <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></a></div>
            </div>
        </section>
        <section className="festival-collections" aria-labelledby="festival-collections-title"><div className="festival-section-heading"><h2 id="festival-collections-title">A festival for every wishlist</h2><p>Pick a collection. Find your next favourite.</p></div><div className="festival-collection-row">{[
            { category: 'electronics' as const, title: 'Upgrade your everyday', subtitle: 'Tech that earns its place.', items: festivalDeals.filter(deal => deal.category === 'electronics').slice(0, 2), icon: 'fas fa-bolt' },
            { category: 'home' as const, title: 'Bring the festival home', subtitle: 'A fresh start for your space.', items: festivalDeals.filter(deal => deal.category === 'home').slice(0, 2), icon: 'fas fa-house' },
            { category: 'beauty' as const, title: 'A little self-care', subtitle: 'Your routine, refreshed.', items: festivalDeals.filter(deal => deal.category === 'beauty').slice(0, 2), icon: 'fas fa-star' },
            { category: 'all' as const, title: 'Gifts worth a look', subtitle: 'Something for their wishlist.', items: festivalDeals.filter(deal => deal.featured).slice(0, 2).length ? festivalDeals.filter(deal => deal.featured).slice(0, 2) : festivalDeals.slice(0, 2), icon: 'fas fa-gift' },
        ].map((collection, index) => <button type="button" key={collection.title} className={`festival-collection festival-collection-${index}`} disabled={!collection.items.length} onClick={() => browseCollection(collection.category)}><div className="festival-collection-heading"><i className={collection.icon} aria-hidden="true" /><i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></div><h3>{collection.title}</h3><p>{collection.subtitle}</p><div className="festival-collection-images">{!collection.items.length && <span className="festival-collection-placeholder">New offers will appear here.</span>}{collection.items.map(deal => <span key={deal.id}><img src={deal.image} alt={deal.title} width="160" height="160" loading="lazy" /><small>{deal.brand}</small></span>)}</div><span className="festival-collection-link">Explore collection <i className="fas fa-arrow-right" aria-hidden="true" /></span></button>)}</div></section>
        <section id="festival-deals" className="festival-deals" aria-labelledby="festival-deals-title">
            <div className="festival-section-heading"><div><h2 id="festival-deals-title">All festival offers</h2><p>Your wishlist starts here.</p></div><button type="button" className={`festival-saved-toggle${savedOnly ? ' is-active' : ''}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><i className="far fa-heart" aria-hidden="true" /> Saved ({saved.length})</button></div>
            <div className="festival-toolbar">
                <label className="festival-search"><i className="fas fa-search" aria-hidden="true" /><input type="search" aria-label="Search festival deals" placeholder="Search a product or brand" value={query} onChange={event => setQuery(event.target.value)} /></label>
                <details className="festival-filter-menu"><summary><i className="fas fa-sliders" aria-hidden="true" /> Filters{activeFilters > 0 && <span>{activeFilters}</span>}</summary><div className="festival-filter-panel"><label><input type="checkbox" checked={bankOnly} onChange={event => setBankOnly(event.target.checked)} /> Price includes bank offer</label><label><input type="checkbox" checked={couponOnly} onChange={event => setCouponOnly(event.target.checked)} /> Extra coupon advertised</label><button type="button" onClick={() => { setBankOnly(false); setCouponOnly(false); }}>Clear filters</button></div></details>
                <label className="festival-sort"><span className="visually-hidden">Sort festival deals</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select></label>
            </div>
            <div className="festival-category-tabs" role="group" aria-label="Filter by category">{festivalCategories.map(item => <button type="button" key={item.id} className={category === item.id ? 'is-active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
            <p className="festival-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'offer' : 'offers'}{category !== 'all' ? ` in ${festivalCategories.find(item => item.id === category)?.label}` : ''}</p>
            {filtered.length ? <div className="festival-product-grid">{filtered.map(deal => <ProductCard key={deal.id} deal={deal} merchant={campaign.merchant} saved={saved.includes(deal.id)} onSave={() => toggleSave(deal.id)} />)}</div> : <div className="festival-empty"><i className="fas fa-search" aria-hidden="true" /><h3>{savedOnly && !saved.length ? 'Your shortlist starts here.' : festivalDeals.length ? 'No offers match these filters.' : 'No active offers right now.'}</h3><p>{savedOnly && !saved.length ? 'Tap a heart on any offer to save it on this device.' : festivalDeals.length ? 'Try another product, category or filter.' : 'Check back for new deals and coupons from this store.'}</p><button type="button" onClick={resetFilters}>Show all offers</button></div>}
            <p className="festival-price-note">Prices, coupons and eligibility are supplied by the listing administrator. Check each offer’s source when provided and confirm the current price on {campaign.merchant}. A listed offer is not a guarantee of the checkout total.</p>
        </section>
    </>;
}
