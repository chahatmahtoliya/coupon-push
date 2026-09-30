'use client';

import Link from '@/components/common/SiteLink';
import { useEffect, useMemo, useState } from 'react';
import { CouponCard, FilterSidebar } from '@/components/features';
import { categoriesApi, couponsApi, storesApi } from '@/services/api';
import type { Coupon } from '@/types';

export interface CategoryPageData {
    coupons: Coupon[];
    stores: { name: string; slug: string; count: number }[];
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

export default function CategoryPageClient({ initialData, slug }: { initialData: CategoryPageData | null; slug: string }) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('popular');
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [discounts, setDiscounts] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [validity, setValidity] = useState('all');

    useEffect(() => {
        let active = true;
        Promise.all([couponsApi.getByCategoryFresh(slug), storesApi.getByCategoryFresh(slug).catch(() => []), categoriesApi.getAllFresh().catch(() => [])]).then(([coupons, stores, categories]) => {
            if (!active) return;
            const category = categories.find((item) => item.slug === slug);
            setData((current) => ({ coupons, stores: stores.map((store) => ({ name: store.name, slug: store.slug, count: store.coupon_count || 0 })), categoryName: category?.name || current?.categoryName || titleFromSlug(slug), categoryDescription: category?.description || current?.categoryDescription || '', categoryIcon: category?.icon || current?.categoryIcon || 'fa-tag' }));
        }).catch((error) => console.error('Failed to refresh category data:', error));
        return () => { active = false; };
    }, [slug]);
    useEffect(() => setPage(1), [sort, selectedStores, discounts, types, validity]);

    const coupons = data?.coupons || [];
    const stores = data?.stores || [];
    const name = data?.categoryName || titleFromSlug(slug);
    const description = data?.categoryDescription || `Browse active ${name} coupons, promo codes, and store deals in one place.`;
    const activeFilters = selectedStores.length + discounts.length + types.length + Number(validity !== 'all');
    const filtered = useMemo(() => {
        let result = [...coupons];
        if (selectedStores.length) result = result.filter((coupon) => selectedStores.includes(coupon.store_slug));
        if (discounts.length) result = result.filter((coupon) => coupon.discount_type === 'percentage' && discounts.some((range) => range === 'under10' ? coupon.discount_value < 10 : range === '10-25' ? coupon.discount_value >= 10 && coupon.discount_value < 25 : range === '25-50' ? coupon.discount_value >= 25 && coupon.discount_value < 50 : range === '50-75' ? coupon.discount_value >= 50 && coupon.discount_value < 75 : coupon.discount_value >= 75));
        if (types.length) result = result.filter((coupon) => (types.includes('code') && Boolean(coupon.code?.trim())) || (types.includes('percentage') && coupon.discount_type === 'percentage') || (types.includes('fixed') && coupon.discount_type === 'fixed') || (types.includes('freeshipping') && coupon.discount_type === 'freebie') || (types.includes('nocode') && !coupon.code));
        if (validity === 'new') result.sort((a, b) => b.id - a.id);
        if (validity === 'expiring') { const now = new Date(); const week = new Date(now.getTime() + 7 * 86400000); result = result.filter((coupon) => coupon.expiry_date && new Date(coupon.expiry_date) > now && new Date(coupon.expiry_date) <= week); }
        if (sort === 'newest') result.sort((a, b) => b.id - a.id);
        else if (sort === 'expiring') result.sort((a, b) => a.expiry_date ? b.expiry_date ? new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() : -1 : 1);
        else if (sort === 'discount') result.sort((a, b) => b.discount_value - a.discount_value);
        else result.sort((a, b) => b.click_count - a.click_count);
        return result;
    }, [coupons, selectedStores, discounts, types, validity, sort]);
    const totalPages = Math.ceil(filtered.length / 12);
    const visible = filtered.slice((page - 1) * 12, page * 12);

    return <div className="cp-category-page">
        <div className="cp-category-shell">
            <nav className="cp-category-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><Link href="/categories">Categories</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span>{name}</span></nav>
            <header className="cp-category-heading"><h1>{name}</h1><p>{description}</p></header>
            <div className="cp-category-toolbar">
                <details className="cp-category-filter-menu">
                    <summary><i className="fas fa-sliders" aria-hidden="true" /> Filters {activeFilters > 0 && <span className="cp-category-filter-count">{activeFilters}</span>}<i className="fas fa-chevron-down" aria-hidden="true" /></summary>
                    <div className="cp-category-filter-panel"><FilterSidebar stores={stores} selectedStores={selectedStores} selectedDiscounts={discounts} selectedTypes={types} validity={validity} onStoreChange={setSelectedStores} onDiscountChange={setDiscounts} onTypeChange={setTypes} onValidityChange={setValidity} /></div>
                </details>
                <div className="cp-category-chips" aria-label="Quick filters">
                    <button type="button" className={types.includes('code') ? 'active' : ''} aria-pressed={types.includes('code')} onClick={() => setTypes(types.includes('code') ? types.filter((type) => type !== 'code') : [...types, 'code'])}><i className="fas fa-tag" aria-hidden="true" />Promo code</button>
                    {stores.slice(0, 8).map((store) => <button type="button" key={store.slug} className={selectedStores.includes(store.slug) ? 'active' : ''} aria-pressed={selectedStores.includes(store.slug)} onClick={() => setSelectedStores(selectedStores.includes(store.slug) ? [] : [store.slug])}>{store.name}</button>)}
                </div>
                <label className="cp-category-sort"><span className="visually-hidden">Sort offers</span><i className="fas fa-arrow-down-wide-short" aria-hidden="true" /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popular">Sort by: Relevance</option><option value="newest">Newest first</option><option value="expiring">Expiring soon</option><option value="discount">Highest discount</option></select><i className="fas fa-chevron-down" aria-hidden="true" /></label>
            </div>
            <main className="cp-category-results"><p className="cp-category-count">{filtered.length} {filtered.length === 1 ? 'offer' : 'offers'} available{activeFilters ? ' with these filters' : ''}</p>
                {visible.length ? <><div className="coupon-grid-v2">{visible.map((coupon) => <CouponCard coupon={coupon} variant="category" key={coupon.id} />)}</div><Pagination currentPage={page} totalPages={totalPages} onPageChange={(next) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></> : <div className="cp-category-empty"><i className="fas fa-ticket-alt" aria-hidden="true" /><h2>No offers match these filters</h2><p>Try another store or clear the filters to see all current offers.</p><button type="button" onClick={() => { setSelectedStores([]); setDiscounts([]); setTypes([]); setValidity('all'); }}>Clear filters</button></div>}
            </main>
        </div>
    </div>;
}
