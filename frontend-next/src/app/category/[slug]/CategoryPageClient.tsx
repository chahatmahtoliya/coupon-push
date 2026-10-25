'use client';

import Link from '@/components/common/SiteLink';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CouponCard, FilterSidebar } from '@/components/features';
import { PowerBankGuide } from '@/components/features/PowerBankGuide';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import { getCategoryPath } from '@/lib/routes';
import type { Category, Coupon } from '@/types';

export interface CategoryPageData {
    coupons: Coupon[];
    stores: { name: string; slug: string; count: number; logo?: string }[];
    categoryName: string;
    categoryDescription: string;
    categoryIcon: string;
}

function titleFromSlug(slug: string): string {
    return slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) for (let page = 1; page <= totalPages; page++) pages.push(page);
    else {
        pages.push(1);
        if (currentPage > 3) pages.push('…');
        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) if (!pages.includes(page)) pages.push(page);
        if (currentPage < totalPages - 2) pages.push('…');
        if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return <nav className="pagination" aria-label="Pagination"><button className="pagination-btn pagination-prev" onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><i className="fas fa-chevron-left" /></button><div className="pagination-pages">{pages.map((page, index) => typeof page === 'number' ? <button className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page)} aria-current={currentPage === page ? 'page' : undefined} key={index}>{page}</button> : <span className="pagination-ellipsis" key={index}>{page}</span>)}</div><button className="pagination-btn pagination-next" onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"><i className="fas fa-chevron-right" /></button></nav>;
}

function StoreMark({ name, logo }: { name: string; logo?: string }) {
    return <span className="cp-category-store-mark" aria-hidden="true">
        <span>{name.slice(0, 1)}</span>
        {logo && <img src={logo} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} />}
    </span>;
}

export default function CategoryPageClient({ initialData, initialCategories = [], slug }: { initialData: CategoryPageData | null; initialCategories?: Category[]; slug: string }) {
    const [data, setData] = useState(initialData);
    const [categories, setCategories] = useState(initialCategories);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('popular');
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [discounts, setDiscounts] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [validity, setValidity] = useState('all');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [refreshState, setRefreshState] = useState<'loading' | 'ready' | 'error'>(initialData?.coupons.length ? 'ready' : 'loading');
    const [refreshAttempt, setRefreshAttempt] = useState(0);
    const resultsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let active = true;
        if (!initialData?.coupons.length) setRefreshState('loading');
        Promise.all([couponsApi.getByCategoryFresh(slug), storesApi.getByCategoryFresh(slug).catch(() => []), categoriesApi.getAllFresh().catch(() => [])]).then(([coupons, stores, categories]) => {
            if (!active) return;
            const category = categories.find((item) => item.slug === slug);
            if (categories.length) setCategories(categories);
            setData((current) => ({ coupons, stores: stores.map((store) => ({ name: store.name, slug: store.slug, count: store.coupon_count || 0, logo: store.logo })), categoryName: category?.name || current?.categoryName || titleFromSlug(slug), categoryDescription: category?.description || current?.categoryDescription || '', categoryIcon: category?.icon || current?.categoryIcon || 'fa-tag' }));
            setRefreshState('ready');
        }).catch((error) => { if (active) setRefreshState('error'); console.error('Failed to refresh category data:', error); });
        return () => { active = false; };
    }, [slug, refreshAttempt]);
    useEffect(() => setPage(1), [sort, selectedStores, discounts, types, validity, slug]);

    const coupons = data?.coupons || [];
    const stores = useMemo(() => {
        const inventory = new Map<string, { name: string; slug: string; count: number; logo?: string }>();
        for (const store of data?.stores || []) inventory.set(store.slug, { ...store, count: 0 });
        for (const coupon of coupons) {
            const store = inventory.get(coupon.store_slug);
            inventory.set(coupon.store_slug, { name: coupon.store_name, slug: coupon.store_slug, count: (store?.count || 0) + 1, logo: coupon.store_logo || store?.logo });
        }
        return [...inventory.values()].filter((store) => store.count > 0).sort((a, b) => b.count - a.count);
    }, [data?.stores, coupons]);
    const shortcuts = categories.filter((category) => category.coupon_count > 0 && getCategoryPath(category.slug) !== '/categories/').slice(0, 6);
    const name = slug === 'power-banks' ? 'Power Bank Deals' : data?.categoryName || titleFromSlug(slug);
    const description = slug === 'power-banks'
        ? 'Compare power bank deals from popular brands. Find your next portable charger by price, capacity and charging speed.'
        : data?.categoryDescription || `Browse active ${name} coupons, promo codes, and store deals in one place.`;
    const activeFilters = selectedStores.length + discounts.length + types.length + Number(validity !== 'all');
    const filtered = useMemo(() => {
        let result = [...coupons];
        if (selectedStores.length) result = result.filter((coupon) => selectedStores.includes(coupon.store_slug));
        if (discounts.length) result = result.filter((coupon) => coupon.discount_type === 'percentage' && discounts.some((range) => range === 'under10' ? coupon.discount_value < 10 : range === '10-25' ? coupon.discount_value >= 10 && coupon.discount_value < 25 : range === '25-50' ? coupon.discount_value >= 25 && coupon.discount_value < 50 : range === '50-75' ? coupon.discount_value >= 50 && coupon.discount_value < 75 : coupon.discount_value >= 75));
        if (types.length) result = result.filter((coupon) => (types.includes('code') && Boolean(coupon.code?.trim())) || (types.includes('percentage') && coupon.discount_type === 'percentage') || (types.includes('fixed') && ['fixed', 'flat'].includes(coupon.discount_type)) || (types.includes('freeshipping') && coupon.discount_type === 'freebie') || (types.includes('nocode') && !coupon.code?.trim()));
        if (validity === 'new') result.sort((a, b) => b.id - a.id);
        if (validity === 'expiring') { const now = new Date(); const week = new Date(now.getTime() + 7 * 86400000); result = result.filter((coupon) => coupon.expiry_date && new Date(coupon.expiry_date) > now && new Date(coupon.expiry_date) <= week); }
        if (sort === 'newest') result.sort((a, b) => b.id - a.id);
        else if (sort === 'expiring') result.sort((a, b) => a.expiry_date ? b.expiry_date ? new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() : -1 : 1);
        else if (sort === 'discount') result.sort((a, b) => b.discount_value - a.discount_value);
        else result.sort((a, b) => b.click_count - a.click_count);
        return result;
    }, [coupons, selectedStores, discounts, types, validity, sort]);
    const totalPages = Math.ceil(filtered.length / 12);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
    const clearFilters = () => { setSelectedStores([]); setDiscounts([]); setTypes([]); setValidity('all'); };
    const promoCount = coupons.filter((coupon) => Boolean(coupon.code?.trim())).length;

    return <div className="cp-category-page cp-category-explorer">
        <header className={`cp-category-hero${slug === 'power-banks' ? ' cp-power-bank-hero' : ''}`}>
            <div className="cp-category-shell">
                <nav className="cp-category-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><Link href="/categories">Categories</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">{name}</span></nav>
                <div className="cp-category-heading"><h1>{slug === 'power-banks' ? 'Power Bank Deals' : name}</h1><p>{description}</p></div>
                <div className="cp-category-hero-facts">
                    <span><i className="fas fa-ticket" aria-hidden="true" /><span><strong>{coupons.length}</strong> offers available</span></span>
                    <span><i className="fas fa-store" aria-hidden="true" /><span><strong>{stores.length}</strong> Stores</span></span>
                    <span><i className="fas fa-tag" aria-hidden="true" /><span><strong>{promoCount}</strong> Promo {promoCount === 1 ? 'code' : 'codes'}</span></span>
                </div>
            </div>
        </header>
        <div className="cp-category-shell">
            <nav className="cp-category-shortcuts" aria-label="Browse categories">
                {shortcuts.map((category) => <Link key={category.id} href={getCategoryPath(category.slug)} className={category.slug === slug ? 'active' : ''} aria-current={category.slug === slug ? 'page' : undefined}><span className="cp-category-shortcut-icon"><i className={`fas ${category.icon.replace(/^(?:fas|far)\s+/, '')}`} aria-hidden="true" /></span><span>{category.name}<small>{category.coupon_count} offers available</small></span><i className="fas fa-chevron-right" aria-hidden="true" /></Link>)}
                <Link href="/categories/" className="cp-category-all-link"><i className="fas fa-th-large" aria-hidden="true" /><span>Categories</span><i className="fas fa-arrow-right" aria-hidden="true" /></Link>
            </nav>
            {stores.length > 0 && <section className="cp-category-stores" aria-labelledby="category-stores-title">
                <div className="cp-category-section-heading"><h2 id="category-stores-title">Popular stores</h2><Link href="/stores/">Browse stores <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
                <div className="cp-category-store-list">{stores.slice(0, 8).map((store) => <button type="button" key={store.slug} className={selectedStores.includes(store.slug) ? 'active' : ''} aria-label={`Show ${store.count} ${store.count === 1 ? 'offer' : 'offers'} from ${store.name}`} aria-pressed={selectedStores.includes(store.slug)} onClick={() => setSelectedStores(selectedStores.includes(store.slug) ? [] : [store.slug])}><StoreMark name={store.name} logo={store.logo} /><span>{store.name}</span><small>{store.count} {store.count === 1 ? 'offer' : 'offers'}</small></button>)}</div>
            </section>}
            <div className="cp-category-layout">
                <aside className={`cp-category-sidebar${filtersOpen ? ' is-open' : ''}`} aria-label="Offer filters">
                    <button type="button" className="cp-category-mobile-filters" aria-expanded={filtersOpen} aria-controls="category-filter-body" onClick={() => setFiltersOpen(!filtersOpen)}><i className="fas fa-sliders" aria-hidden="true" />Filters{activeFilters > 0 && <span className="cp-category-filter-count">{activeFilters}</span>}<i className={`fas fa-chevron-${filtersOpen ? 'up' : 'down'}`} aria-hidden="true" /></button>
                    <div className="cp-category-sidebar-body" id="category-filter-body">
                        <div className="cp-category-sidebar-heading"><h2>Filters {activeFilters > 0 && <span className="cp-category-filter-count">{activeFilters}</span>}</h2><button type="button" onClick={clearFilters} disabled={!activeFilters}>Clear filters</button></div>
                        <FilterSidebar stores={stores} selectedStores={selectedStores} selectedDiscounts={discounts} selectedTypes={types} validity={validity} onStoreChange={setSelectedStores} onDiscountChange={setDiscounts} onTypeChange={setTypes} onValidityChange={setValidity} />
                    </div>
                </aside>
                <section className="cp-category-results" ref={resultsRef} aria-label={`${name} offers`}>
                    <div className="cp-category-discover" aria-label="Quick filters"><span><i className="fas fa-bolt" aria-hidden="true" />{name}</span><div><button type="button" className={!types.length ? 'active' : ''} aria-pressed={!types.length} onClick={() => setTypes([])}>All Active <small>{coupons.length}</small></button><button type="button" className={types.length === 1 && types[0] === 'code' ? 'active' : ''} aria-pressed={types.length === 1 && types[0] === 'code'} onClick={() => setTypes(['code'])}>Promo code <small>{promoCount}</small></button><button type="button" className={types.length === 1 && types[0] === 'nocode' ? 'active' : ''} aria-pressed={types.length === 1 && types[0] === 'nocode'} onClick={() => setTypes(['nocode'])}>Online deal <small>{coupons.length - promoCount}</small></button></div></div>
                    <div className="cp-category-results-heading"><h2>{name} <span>({filtered.length})</span></h2><label className="cp-category-sort"><span className="visually-hidden">Sort offers</span><i className="fas fa-arrow-down-wide-short" aria-hidden="true" /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popular">Sort by: Relevance</option><option value="newest">Newest first</option><option value="expiring">Expiring soon</option><option value="discount">Highest discount</option></select><i className="fas fa-chevron-down" aria-hidden="true" /></label></div>
                    <p className="cp-category-count" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'offer' : 'offers'} available{activeFilters ? ' with these filters' : ''}</p>
                    {visible.length ? <><div className="coupon-grid-v2">{visible.map((coupon) => <CouponCard coupon={coupon} variant="category" key={coupon.id} />)}</div><div className="cp-category-pagination"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(next) => { setPage(next); resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }} /><p>{(currentPage - 1) * 12 + 1}–{Math.min(currentPage * 12, filtered.length)} of {filtered.length} offers</p></div></> : <div className="cp-category-empty" role="status"><i className="fas fa-ticket-alt" aria-hidden="true" /><h2>{activeFilters ? 'No offers match these filters' : refreshState === 'loading' ? 'Loading category offers…' : refreshState === 'error' ? 'Offers could not be loaded' : 'No offers listed yet'}</h2><p>{activeFilters ? 'Try another store or clear the filters to see all current offers.' : refreshState === 'loading' ? 'Checking the latest offers for this category.' : refreshState === 'error' ? 'Check your connection and try again.' : 'Check back for new offers, or explore another shopping category.'}</p>{activeFilters ? <button type="button" onClick={clearFilters}>Clear filters</button> : refreshState === 'error' ? <button type="button" onClick={() => setRefreshAttempt(value => value + 1)}>Try again</button> : refreshState === 'ready' ? <Link href="/categories/">Explore categories</Link> : null}</div>}
                </section>
            </div>
            {slug === 'power-banks' && <PowerBankGuide offers={coupons} brands={stores} onSelectBrand={(brand) => { setSelectedStores([brand]); resultsRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' }); }} />}
        </div>
    </div>;
}
