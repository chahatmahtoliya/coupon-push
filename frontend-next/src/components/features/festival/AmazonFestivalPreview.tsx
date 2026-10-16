'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/components/common/SiteLink';
import { storesApi, trackClick } from '@/services/api';
import { festival2026 } from '@/data/amazon-festival-2026';
import { getFestivalCampaign, toFestivalProducts, type FestivalProduct } from '@/lib/festival-template';
import { compareCouponsByNewest } from '@/lib/coupon-order';
import type { StorePageData } from '@/types';
import styles from './AmazonFestivalPreview.module.css';

type Filter = 'all' | 'codes' | 'deals' | 'bank';
type Sort = 'featured' | 'latest' | 'price-low' | 'price-high';
type Offer = { id: string; title: string; subtitle: string; details: string; label: string; image?: string; code?: string; url: string; kind: 'coupon' | 'bank' | 'member'; source?: string };
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const savedKey = `cp-festival-${festival2026.slug}-saved`;

function categoryFor(product: FestivalProduct): string {
    const title = product.title.toLowerCase();
    if (/laptop|vivobook|macbook|notebook/.test(title)) return 'Laptops & computers';
    if (/\btv\b|television/.test(title)) return 'TV & appliances';
    if (/phone|mobile/.test(title)) return 'Mobiles & accessories';
    if (/washer|washing|kitchen|fryer|vacuum/.test(title) || product.category === 'home') return 'Home & kitchen';
    if (/serum|face wash|skincare|beauty|truffle/.test(title) || product.category === 'beauty') return 'Beauty & personal care';
    if (/watch|speaker|headphone|earbud/.test(title) || product.category === 'electronics') return 'Electronics';
    return product.categoryLabel;
}

function ProductImage({ src, title, className }: { src?: string; title: string; className?: string }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    return src && !failed
        ? <img className={className} src={src} alt={title} width="300" height="300" loading="lazy" onError={() => setFailed(true)} />
        : <span className={styles.imageFallback} role="img" aria-label={`${title} image unavailable`}><i className="fas fa-box-open" aria-hidden="true" /></span>;
}

function OfferRow({ offer }: { offer: Offer }) {
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    async function copy() {
        try { await navigator.clipboard.writeText(offer.code || ''); setCopied(true); setCopyFailed(false); }
        catch { setCopyFailed(true); }
    }
    return <article className={styles.offerRow} data-offer-id={offer.id}>
        <div className={styles.offerHeadline}><span className={`${styles.offerLabel} ${offer.kind === 'bank' ? styles.bankLabel : offer.kind === 'member' ? styles.memberLabel : ''}`}><i className={`fas ${offer.kind === 'bank' ? 'fa-credit-card' : offer.kind === 'member' ? 'fa-user' : 'fa-tag'}`} aria-hidden="true" />{offer.label}</span><h3>{offer.title}</h3><p>{offer.subtitle}</p></div>
        <div className={styles.offerVisual}>{offer.image ? <ProductImage src={offer.image} title={offer.subtitle} /> : <i className={`fas ${offer.kind === 'bank' ? 'fa-credit-card' : 'fa-box-open'}`} aria-hidden="true" />}</div>
        <div className={styles.offerDescription}><p>{offer.details}</p><span>Check eligibility on Amazon</span></div>
        <div className={styles.offerAction}>
            {offer.code ? <div className={styles.codeBox}><code>{offer.code}</code><button type="button" onClick={copy} aria-label={`Copy code ${offer.code}`}>{copied ? 'Copied' : 'Copy'}</button></div> : <a className={styles.orangeButton} href={offer.url} target="_blank" rel="noopener noreferrer" onClick={() => { if (/^\d+$/.test(offer.id)) void trackClick('coupon', Number(offer.id)); }}>View offer <i className="fas fa-arrow-right" aria-hidden="true" /></a>}
            {copyFailed && <small role="status">Copy manually: {offer.code}</small>}
            <details className={styles.offerDetails}><summary>Show details <i className="fas fa-chevron-down" aria-hidden="true" /></summary><p>{offer.details}</p>{offer.source && <a href={offer.source} target="_blank" rel="noopener noreferrer">View offer source <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></a>}</details>
        </div>
    </article>;
}

function DealCard({ product, saved, onSave }: { product: FestivalProduct; saved: boolean; onSave: () => void }) {
    return <article className={styles.dealCard} data-coupon-id={product.id}>
        <div className={styles.productImage}>
            {product.discountPercent ? <span className={styles.discountBadge}>{product.discountPercent}% OFF</span> : product.coupon ? <span className={styles.couponBadge}>Extra coupon</span> : null}
            <button type="button" className={styles.saveButton} onClick={onSave} aria-label={`${saved ? 'Unsave' : 'Save'} ${product.title}`} aria-pressed={saved}><i className={`${saved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button>
            <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${product.title} on Amazon`}><ProductImage src={product.image} title={product.title} /></a>
        </div>
        <h3><a href={product.url} target="_blank" rel="noopener noreferrer">{product.title}</a></h3>
        <p className={styles.productNote}>{product.coupon || 'Amazon festival offer'}</p>
        <p className={styles.price}><strong>{product.advertisedPrice === null ? 'Check price' : money.format(product.advertisedPrice)}</strong>{product.originalPrice !== null && <del>{money.format(product.originalPrice)}</del>}</p>
        <a className={styles.orangeButton} href={product.url} target="_blank" rel="noopener noreferrer" onClick={() => void trackClick('coupon', Number(product.id))}>View deal <i className="fas fa-arrow-right" aria-hidden="true" /></a>
        <details className={styles.productDetails}><summary>Offer details <i className="fas fa-chevron-down" aria-hidden="true" /></summary><p>{product.note}</p>{product.includesBankOffer && <p>Advertised price includes a bank offer. Check card eligibility.</p>}{product.sourceUrl && <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">Offer source{product.checkedAt ? ` · ${product.checkedAt.slice(0, 10)}` : ''}</a>}</details>
    </article>;
}

export default function AmazonFestivalPreview({ initialData }: { initialData: StorePageData | null }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<Sort>('featured');
    const [category, setCategory] = useState('all');
    const [query, setQuery] = useState('');
    const [saved, setSaved] = useState<string[]>([]);
    const [savedOnly, setSavedOnly] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [railPosition, setRailPosition] = useState({ left: false, right: false });
    const railRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLElement>(null);
    const [tabIndicator, setTabIndicator] = useState<{ left: number; width: number } | null>(null);
    const campaign = useMemo(() => getFestivalCampaign(data?.store || null, festival2026.slug), [data]);
    const products = useMemo(() => toFestivalProducts(data?.coupons || [], campaign.merchantUrl, new Date(), campaign.merchant), [data, campaign.merchantUrl, campaign.merchant]);
    const codeCount = products.filter(product => product.code).length;
    const rawCoupons = useMemo(() => new Map((data?.coupons || []).map(coupon => [String(coupon.id), coupon])), [data]);
    const orderedProducts = useMemo(() => [...products].sort((a, b) => {
        if (sort === 'latest') return compareCouponsByNewest(rawCoupons.get(a.id) || { id: Number(a.id) }, rawCoupons.get(b.id) || { id: Number(b.id) });
        if (sort === 'price-low') return (a.advertisedPrice ?? Infinity) - (b.advertisedPrice ?? Infinity);
        if (sort === 'price-high') return (b.advertisedPrice ?? -Infinity) - (a.advertisedPrice ?? -Infinity);
        return Number(b.featured) - Number(a.featured);
    }), [products, sort, rawCoupons]);
    const couponProducts = orderedProducts.filter(product => product.coupon || product.code);

    useEffect(() => {
        let active = true;
        setError('');
        storesApi.getBySlugFresh(festival2026.slug).then(result => {
            if (result?.store?.slug !== festival2026.slug || !Array.isArray(result.coupons) || result.coupons.some(coupon => Number(coupon.store_id) !== Number(result.store.id))) throw new Error('Invalid store response');
            if (active) setData(result);
        }).catch((reason: unknown) => {
            if (!active) return;
            if (reason instanceof Error && /API Error: (404|410)/.test(reason.message)) setData(null);
            setError('We could not refresh these offers. Please try again.');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [attempt]);

    useEffect(() => {
        try { const ids: unknown = JSON.parse(localStorage.getItem(savedKey) || '[]'); if (Array.isArray(ids)) setSaved(ids.filter((id): id is string => typeof id === 'string')); }
        catch { /* Saving is optional when browser storage is unavailable. */ }
    }, []);

    const categories = useMemo(() => [...new Set(products.map(categoryFor))].map(name => ({ name, products: products.filter(product => categoryFor(product) === name) })), [products]);
    const visibleProducts = useMemo(() => orderedProducts.filter(product =>
        (filter !== 'codes' || Boolean(product.code)) && (filter !== 'bank' || product.includesBankOffer) &&
        (category === 'all' || categoryFor(product) === category) && (!savedOnly || saved.includes(product.id)) &&
        `${product.title} ${product.brand}`.toLowerCase().includes(query.trim().toLowerCase()),
    ), [orderedProducts, filter, category, savedOnly, saved, query]);
    const allOffers: Offer[] = [
        ...couponProducts.map(product => ({ id: product.id, title: product.coupon || 'Coupon code available', subtitle: product.title, details: product.note, label: product.code ? 'Coupon code' : 'Product coupon', image: product.image, code: product.code, url: product.url, kind: 'coupon' as const, source: product.sourceUrl })),
        ...(campaign.bankOffer ? [{ id: 'bank', title: campaign.bankOffer, subtitle: 'Eligible SBI cards & EMI', details: 'Check eligible cards, minimum spend, discount caps and product exclusions before paying. Bank benefits are not automatically combined with every listed price.', label: 'Bank offer', url: campaign.merchantUrl, kind: 'bank' as const, source: campaign.sourceUrl }] : []),
        ...(campaign.memberOffer ? [{ id: 'member', title: campaign.memberOffer, subtitle: 'Amazon Prime member benefits', details: 'Benefits vary by product and offer. Check membership eligibility and the final order summary on Amazon.', label: 'Member offer', url: campaign.merchantUrl, kind: 'member' as const, source: campaign.sourceUrl }] : []),
    ];
    const offers = allOffers.filter(offer => filter === 'all' || (filter === 'codes' && Boolean(offer.code)) || (filter === 'bank' && offer.kind === 'bank'));

    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return;
        const update = () => setRailPosition({ left: rail.scrollLeft > 8, right: rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 8 });
        const observer = new ResizeObserver(update); observer.observe(rail); rail.addEventListener('scroll', update, { passive: true }); update();
        return () => { observer.disconnect(); rail.removeEventListener('scroll', update); };
    }, [visibleProducts, showAll]);

    useEffect(() => {
        const tabs = tabsRef.current;
        if (!tabs) return;
        const update = () => {
            const active = tabs.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
            if (active) setTabIndicator({ left: active.offsetLeft, width: active.offsetWidth });
        };
        const observer = new ResizeObserver(update);
        observer.observe(tabs);
        tabs.querySelectorAll('button').forEach(button => observer.observe(button));
        update();
        return () => observer.disconnect();
    }, [filter]);

    function toggleSaved(id: string) {
        setSaved(current => { const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id]; try { localStorage.setItem(savedKey, JSON.stringify(next)); } catch { /* Preserve session state. */ } return next; });
    }
    function reset() { setFilter('all'); setCategory('all'); setQuery(''); setSavedOnly(false); }
    function scrollDeals(direction: number) {
        const rail = railRef.current;
        rail?.scrollBy({ left: direction * rail.clientWidth * .85, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    const activeSaved = products.filter(product => saved.includes(product.id)).length;
    const start = /^\d{4}-\d{2}-\d{2}$/.test(campaign.startDate || '') ? new Date(`${campaign.startDate}T12:00:00`) : null;
    const startLabel = start && Number.isFinite(start.getTime()) ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(start) : '';
    return <div className={styles.page}>
        <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><Link href="/stores/">Stores</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">Amazon festival</span></nav>
            <header className={styles.hero}>
                <div className={styles.merchantLogo}><img src="/assets/festival-2026/amazon-mark.svg" alt="Amazon" width="112" height="112" /><svg className={styles.heroSpark} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0 10 6 16 8 10 10 8 16 6 10 0 8 6 6Z" /></svg></div>
                <div className={styles.heroCopy}><h1>{campaign.name}</h1><p className={styles.subtitle}>Amazon festival deals, coupons & offers</p><p className={styles.intro}>{campaign.intro}</p><div className={styles.heroFacts}><span><i className="fas fa-tag" aria-hidden="true" /><strong>{products.length}</strong> active offers</span><span><i className="fas fa-ticket" aria-hidden="true" /><strong>{couponProducts.length}</strong> product coupons</span>{startLabel && <span><i className="far fa-calendar" aria-hidden="true" />Started {startLabel}</span>}</div></div>
                <a className={styles.visitButton} href={campaign.merchantUrl} target="_blank" rel="noopener noreferrer">Visit Amazon <i className="fas fa-arrow-right" aria-hidden="true" /></a>
            </header>
            <nav ref={tabsRef} className={styles.tabs} aria-label="Filter Amazon festival offers">{([{ id: 'all', label: 'All offers' }, { id: 'codes', label: 'Coupon codes' }, { id: 'deals', label: 'Deals' }, { id: 'bank', label: 'Bank offers' }] as { id: Filter; label: string }[]).map(tab => <button type="button" key={tab.id} aria-pressed={filter === tab.id} onClick={() => { setFilter(tab.id); setCategory('all'); setQuery(''); setSavedOnly(false); }}>{tab.label}</button>)}<a href="#amazon-festival-about">About</a>{tabIndicator && <span className={styles.tabIndicator} aria-hidden="true" style={{ transform: `translateX(${tabIndicator.left}px) scaleX(${tabIndicator.width})` }} />}</nav>
            {(loading || error) && <div className={styles.feedStatus} role="status"><span>{loading ? 'Loading the latest Amazon offers…' : `${error}${data ? ' Showing the last published offers.' : ''}`}</span>{error && <button type="button" onClick={() => { setLoading(true); setAttempt(value => value + 1); }}>Try again</button>}</div>}
            {filter !== 'deals' && <section className={styles.section} aria-labelledby="amazon-coupon-heading">
                <div className={styles.sectionHeading}><div><h2 id="amazon-coupon-heading">{filter === 'codes' ? 'Amazon festival coupon codes' : filter === 'bank' ? 'Amazon festival bank offers' : 'Amazon festival coupons & offers'}</h2><p>Check the conditions before you apply an offer at checkout.</p></div><label className={styles.sort}>Sort by<select value={sort} onChange={event => setSort(event.target.value as Sort)} aria-label="Sort Amazon festival offers"><option value="featured">Featured</option><option value="latest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
                <div className={styles.offerList}>{offers.map(offer => <OfferRow key={offer.id} offer={offer} />)}</div>
                {!offers.length && <div className={styles.empty}><i className="fas fa-ticket" aria-hidden="true" /><h3>{filter === 'codes' ? 'No coupon codes listed right now.' : 'No matching offers right now.'}</h3><p>{filter === 'codes' ? 'These festival offers currently use product-page coupons or direct deals.' : 'Check back for new Amazon festival offers.'}</p><button type="button" onClick={() => { reset(); setFilter('deals'); }}>Browse festival deals <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>}
            </section>}
            {filter !== 'codes' && <section id="amazon-festival-deals" className={styles.section} aria-labelledby="amazon-deals-heading">
                <div className={styles.sectionHeading}><div><h2 id="amazon-deals-heading">{filter === 'bank' ? 'Deals with a bank offer included' : 'Today’s best deals on Amazon'}</h2><p>Compare listed prices and confirm the current offer on Amazon.</p></div><button className={styles.textButton} type="button" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer deals' : 'View all deals'}<i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
                <div className={styles.dealToolbar}><label className={styles.search}><i className="fas fa-search" aria-hidden="true" /><input type="search" aria-label="Search Amazon festival deals" placeholder="Search a product or brand" value={query} onChange={event => { setQuery(event.target.value); setShowAll(true); }} /></label><button type="button" className={styles.savedFilter} aria-pressed={savedOnly} onClick={() => { setSavedOnly(value => !value); setShowAll(true); }}><i className="far fa-heart" aria-hidden="true" /> Saved ({activeSaved})</button>{filter === 'deals' && <label className={styles.sort}>Sort by<select value={sort} onChange={event => setSort(event.target.value as Sort)} aria-label="Sort Amazon festival offers"><option value="featured">Featured</option><option value="latest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>}</div>
                {category !== 'all' && <div className={styles.activeCategory}><span>{category} · {visibleProducts.length} {visibleProducts.length === 1 ? 'offer' : 'offers'}</span><button type="button" onClick={() => setCategory('all')} aria-label="Clear category filter"><i className="fas fa-times" aria-hidden="true" /></button></div>}
                {visibleProducts.length ? <div className={styles.railShell}><div ref={railRef} className={showAll ? styles.productGrid : styles.productRail}>{visibleProducts.map(product => <DealCard key={product.id} product={product} saved={saved.includes(product.id)} onSave={() => toggleSaved(product.id)} />)}</div>{!showAll && railPosition.left && <button type="button" className={`${styles.railArrow} ${styles.railPrevious}`} onClick={() => scrollDeals(-1)} aria-label="Previous Amazon festival deals"><i className="fas fa-chevron-left" aria-hidden="true" /></button>}{!showAll && railPosition.right && <button type="button" className={`${styles.railArrow} ${styles.railNext}`} onClick={() => scrollDeals(1)} aria-label="Next Amazon festival deals"><i className="fas fa-chevron-right" aria-hidden="true" /></button>}</div> : <div className={styles.empty}><i className="fas fa-search" aria-hidden="true" /><h3>{savedOnly ? 'Your shortlist starts here.' : 'No deals match these filters.'}</h3><p>{savedOnly ? 'Tap a heart on any product to save it on this device.' : 'Try another product, category or offer type.'}</p><button type="button" onClick={reset}>Show all offers</button></div>}
                <p className={styles.priceNote}>Listed prices are supplied by the listing administrator. Check the seller, variant, coupon and payment eligibility on Amazon before buying.</p>
            </section>}
            {filter === 'all' && categories.length > 0 && <section className={styles.section} aria-labelledby="amazon-category-heading"><div className={styles.sectionHeading}><div><h2 id="amazon-category-heading">Shop by category</h2><p>Find Amazon festival deals across the categories in this collection.</p></div></div><div className={styles.categoryGrid}>{categories.map(item => <button type="button" key={item.name} className={styles.categoryCard} aria-pressed={category === item.name} onClick={() => { setCategory(item.name); setSavedOnly(false); setQuery(''); setShowAll(true); document.getElementById('amazon-festival-deals')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}><div className={styles.categoryImage}><ProductImage src={item.products[0].image} title="" /></div><strong>{item.name}</strong><span>{item.products.length} {item.products.length === 1 ? 'offer' : 'offers'}</span></button>)}</div></section>}
            <section id="amazon-festival-about" className={`${styles.section} ${styles.about}`} aria-labelledby="amazon-about-heading"><div><h2 id="amazon-about-heading">About Amazon Great Indian Festival</h2><p>{campaign.intro}</p><p>Compare product offers, available coupons and eligible payment benefits. Confirm the current price, seller, variant and final payable total on Amazon. Exchange credits and future cashback have separate conditions.</p>{campaign.sourceUrl && <a className={styles.sourceLink} href={campaign.sourceUrl} target="_blank" rel="noopener noreferrer">Amazon campaign announcement <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></a>}</div><div className={styles.aboutFacts}><div><i className="fas fa-tag" aria-hidden="true" /><strong>{products.length}</strong><span>Active offers</span></div><div><i className="fas fa-ticket" aria-hidden="true" /><strong>{codeCount}</strong><span>Coupon codes</span></div><div><i className="fas fa-layer-group" aria-hidden="true" /><strong>{categories.length}</strong><span>Categories</span></div></div></section>
            <section id="store-ui-faqs" className={styles.section} aria-labelledby="amazon-faq-heading"><div className={styles.sectionHeading}><h2 id="amazon-faq-heading">Frequently asked questions</h2></div><div className={styles.faqGrid}>{campaign.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<i className="fas fa-chevron-down" aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div></section>
            <p className={styles.disclosure}>Availability and offer terms can change. Amazon sets the final checkout total. Images and trademarks belong to their owners. CouponPush is independent of Amazon. <Link href="/terms/">Affiliate disclosure</Link> · <Link href="/store/amazon/">Browse all Amazon offers</Link></p>
        </div>
    </div>;
}
