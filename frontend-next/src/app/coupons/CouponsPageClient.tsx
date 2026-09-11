'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/common/SiteLink';
import { CouponModal } from '@/components/common/CouponModal';
import { CouponDescription } from '@/components/common/CouponDescription';
import { getStorePath } from '@/lib/routes';
import { couponExpiry, couponFilterQuery, defaultFilters, filterCoupons, readCouponFilters, type CatalogCoupon, type CouponFilters } from '@/lib/coupon-filters';
import styles from './coupons.module.css';

const PAGE_SIZE = 18;
const discountLabels: Record<string, string> = { all: 'Any discount', percentage: 'Percentage off', fixed: 'Amount off', cashback: 'Cashback', freebie: 'Freebie' };

export default function CouponsPageClient({ coupons, categories, initialNow }: { coupons: CatalogCoupon[]; categories: { slug: string; name: string }[]; initialNow: number }) {
    const [filters, setFilters] = useState<CouponFilters>(defaultFilters);
    const [now, setNow] = useState(initialNow);
    const [limit, setLimit] = useState(PAGE_SIZE);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [storeSearch, setStoreSearch] = useState('');
    const [selected, setSelected] = useState<CatalogCoupon | null>(null);

    useEffect(() => {
        const restore = () => { setFilters(readCouponFilters(new URLSearchParams(window.location.search))); setLimit(PAGE_SIZE); };
        restore(); setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 60000);
        window.addEventListener('popstate', restore);
        return () => { window.removeEventListener('popstate', restore); window.clearInterval(timer); };
    }, []);

    function update(patch: Partial<CouponFilters>, replace = false) {
        const next = { ...filters, ...patch };
        setFilters(next); setLimit(PAGE_SIZE);
        const query = couponFilterQuery(next);
        window.history[replace ? 'replaceState' : 'pushState'](null, '', `/coupons/${query ? `?${query}` : ''}`);
    }
    const toggle = (field: 'stores' | 'categories', value: string) => update({ [field]: filters[field].includes(value) ? filters[field].filter(item => item !== value) : [...filters[field], value] });
    const active = useMemo(() => coupons.filter(coupon => couponExpiry(coupon) >= now), [coupons, now]);
    const stores = useMemo(() => [...new Map(active.map(coupon => [coupon.store_slug, coupon.store_name])).entries()].map(([slug, name]) => ({ slug, name, count: active.filter(coupon => coupon.store_slug === slug).length })).sort((a, b) => a.name.localeCompare(b.name)), [active]);
    const categoryOptions = categories.map(category => ({ ...category, count: active.filter(coupon => coupon.categorySlugs.includes(category.slug)).length })).filter(category => category.count);
    const results = useMemo(() => filterCoupons(coupons, filters, now), [coupons, filters, now]);
    const chips = [
        ...filters.stores.map(slug => ({ label: stores.find(store => store.slug === slug)?.name || slug, remove: () => toggle('stores', slug) })),
        ...filters.categories.map(slug => ({ label: categories.find(category => category.slug === slug)?.name || slug, remove: () => toggle('categories', slug) })),
        ...(filters.q ? [{ label: `Search: ${filters.q}`, remove: () => update({ q: '' }) }] : []),
        ...(filters.type !== 'all' ? [{ label: filters.type === 'code' ? 'Coupon codes' : 'No-code deals', remove: () => update({ type: 'all' }) }] : []),
        ...(filters.discount !== 'all' ? [{ label: discountLabels[filters.discount], remove: () => update({ discount: 'all' }) }] : []),
        ...(filters.verified ? [{ label: 'Marked verified', remove: () => update({ verified: false }) }] : []),
        ...(filters.expiring ? [{ label: 'Ends within 7 days', remove: () => update({ expiring: false }) }] : []),
    ];
    const reset = () => { update(defaultFilters); setStoreSearch(''); };

    return <div className={styles.page}>
        <div className={styles.shell}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">Coupons</span></nav>
            <header className={styles.heading}><div><h1>All coupons & deals</h1><p>Find an offer for your next order. Choose a store, narrow it down, and save.</p></div><span className={styles.total}>{active.length} offers across {stores.length} stores</span></header>
            <div className={styles.workspace}>
                <button className={styles.mobileFilter} aria-expanded={filtersOpen} aria-controls="coupon-filters" onClick={() => setFiltersOpen(!filtersOpen)}><i className="fas fa-sliders-h" aria-hidden="true" />{filtersOpen ? 'Hide filters' : 'Show filters'}{chips.length > 0 && ` (${chips.length})`}</button>
                <aside id="coupon-filters" className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`} aria-label="Filter coupons">
                    <div className={styles.filterHeading}><h2>Filters</h2><button onClick={reset} disabled={!chips.length}>Clear all</button></div>
                    <fieldset><legend>Offer type</legend>{[['all', 'All offers'], ['code', 'Coupon codes'], ['deal', 'No-code deals']].map(([value, label]) => <label className={styles.check} key={value}><input type="radio" name="offer-type" checked={filters.type === value} onChange={() => update({ type: value })} /><span>{label}</span></label>)}</fieldset>
                    <fieldset><legend>Stores</legend><input className={styles.storeSearch} type="search" aria-label="Find a store" placeholder="Find a store" value={storeSearch} onChange={event => setStoreSearch(event.target.value)} /><div className={styles.storeList}>{stores.filter(store => store.name.toLowerCase().includes(storeSearch.toLowerCase())).map(store => <label className={styles.check} key={store.slug}><input type="checkbox" checked={filters.stores.includes(store.slug)} onChange={() => toggle('stores', store.slug)} /><span>{store.name}</span><small>{store.count}</small></label>)}{!stores.some(store => store.name.toLowerCase().includes(storeSearch.toLowerCase())) && <p>No matching stores.</p>}</div></fieldset>
                    <fieldset><legend>Categories</legend>{categoryOptions.map(category => <label className={styles.check} key={category.slug}><input type="checkbox" checked={filters.categories.includes(category.slug)} onChange={() => toggle('categories', category.slug)} /><span>{category.name}</span><small>{category.count}</small></label>)}</fieldset>
                    <fieldset><legend>Discount type</legend><select aria-label="Discount type" value={filters.discount} onChange={event => update({ discount: event.target.value })}>{Object.entries(discountLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></fieldset>
                    <fieldset><legend>More options</legend><label className={styles.check}><input type="checkbox" checked={filters.verified} onChange={event => update({ verified: event.target.checked })} /><span>Marked verified</span></label><label className={styles.check}><input type="checkbox" checked={filters.expiring} onChange={event => update({ expiring: event.target.checked })} /><span>Ends within 7 days</span></label></fieldset>
                </aside>
                <section className={styles.results} aria-label="Coupon results">
                    <div className={styles.toolbar}><label className={styles.search}><i className="fas fa-search" aria-hidden="true" /><input type="search" aria-label="Search coupons" placeholder="Search stores, coupons or codes" value={filters.q} onChange={event => update({ q: event.target.value }, true)} /></label><label className={styles.sort}>Sort by<select value={filters.sort} onChange={event => update({ sort: event.target.value })}><option value="latest">Latest added</option><option value="popular">Most clicked</option><option value="ending">Ending soon</option></select></label></div>
                    {chips.length > 0 && <div className={styles.chips} aria-label="Applied filters">{chips.map((chip, index) => <button key={`${chip.label}-${index}`} onClick={chip.remove} aria-label={`Remove ${chip.label} filter`}>{chip.label}<i className="fas fa-times" aria-hidden="true" /></button>)}<button onClick={reset}>Clear all</button></div>}
                    <p className={styles.resultCount} role="status">{results.length ? `Showing ${Math.min(limit, results.length)} of ${results.length} offers` : 'No matching offers'}</p>
                    <div className={styles.grid}>{results.slice(0, limit).map(coupon => <article className={styles.card} key={coupon.id}>
                        <div className={styles.cardTop}><Link className={styles.store} href={getStorePath(coupon.store_slug)}><img src={coupon.store_logo || '/placeholder-store.png'} alt="" width="40" height="40" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/placeholder-store.png'; }} /><span>{coupon.store_name}</span></Link><span className={styles.type}>{coupon.code?.trim() ? 'CODE' : 'DEAL'}</span></div>
                        <h2>{coupon.title}</h2>
                        {coupon.description && <CouponDescription className={styles.description}>{coupon.description}</CouponDescription>}
                        <div className={styles.cardBottom}><span>{coupon.expiry_date ? `Ends ${new Date(couponExpiry(coupon)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}` : 'Expiry not listed'}</span><button onClick={() => setSelected(coupon)}>{coupon.code?.trim() ? 'Get coupon' : 'Get deal'}<i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
                    </article>)}</div>
                    {!results.length && <div className={styles.empty}><i className="fas fa-search" aria-hidden="true" /><h2>No offers match these filters</h2><p>Try another store or search term, or clear your filters to browse all available offers.</p><button onClick={reset}>Clear filters</button></div>}
                    {limit < results.length && <div className={styles.loadMore}><button onClick={() => setLimit(value => value + PAGE_SIZE)}>Show more offers <i className="fas fa-chevron-down" aria-hidden="true" /></button></div>}
                    <p className={styles.note}>Offers and eligibility can change. Check the merchant’s terms before ordering.</p>
                </section>
            </div>
        </div>
        <CouponModal coupon={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>;
}
