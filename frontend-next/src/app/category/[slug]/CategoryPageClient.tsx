'use client';

import Link from 'next/link';
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
    const icon = data?.categoryIcon?.replace(/^fas\s+/, '') || 'fa-tag';
    const verified = coupons.filter((coupon) => coupon.is_verified).length;
    const endingSoon = coupons.filter((coupon) => { if (!coupon.expiry_date) return false; const date = new Date(coupon.expiry_date); const now = new Date(); return date > now && date <= new Date(now.getTime() + 7 * 86400000); }).length;
    const activeFilters = selectedStores.length + discounts.length + types.length + Number(validity !== 'all');
    const filtered = useMemo(() => {
        let result = [...coupons];
        if (selectedStores.length) result = result.filter((coupon) => selectedStores.includes(coupon.store_slug));
        if (discounts.length) result = result.filter((coupon) => coupon.discount_type === 'percentage' && discounts.some((range) => range === 'under10' ? coupon.discount_value < 10 : range === '10-25' ? coupon.discount_value >= 10 && coupon.discount_value < 25 : range === '25-50' ? coupon.discount_value >= 25 && coupon.discount_value < 50 : range === '50-75' ? coupon.discount_value >= 50 && coupon.discount_value < 75 : coupon.discount_value >= 75));
        if (types.length) result = result.filter((coupon) => (types.includes('percentage') && coupon.discount_type === 'percentage') || (types.includes('fixed') && coupon.discount_type === 'fixed') || (types.includes('freeshipping') && coupon.discount_type === 'freebie') || (types.includes('nocode') && !coupon.code));
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

    return <>
        <div className="category-header-dark category-detail-hero"><div className="container"><nav className="category-breadcrumb"><Link href="/">HOME</Link><i className="fas fa-chevron-right" /><Link href="/categories">CATEGORIES</Link><i className="fas fa-chevron-right" /><span>{name.toUpperCase()}</span></nav><div className="category-detail-hero-inner"><div className="category-detail-icon"><i className={`fas ${icon}`} aria-hidden="true" /></div><div className="category-detail-copy"><span className="category-hero-kicker"><i className="fas fa-tag" aria-hidden="true" />Category deals</span><h1 className="category-header-title">{name} deals</h1><p className="category-header-description">{description}</p></div></div></div></div>
        <section className="category-page-section"><div className="container">
            <div className="category-result-bar"><div><span className="category-result-eyebrow">Available now</span><h2><span>{filtered.length}</span>{filtered.length === 1 ? ' coupon found' : ' coupons found'}</h2></div><div className="category-result-chips"><span><i className="fas fa-store" aria-hidden="true" />{stores.length} {stores.length === 1 ? 'store' : 'stores'}</span><span><i className="fas fa-circle-check" aria-hidden="true" />{verified} verified</span><span><i className="fas fa-clock" aria-hidden="true" />{endingSoon} ending soon</span>{activeFilters > 0 && <span className="category-filter-chip-active"><i className="fas fa-sliders" aria-hidden="true" />{activeFilters} active {activeFilters === 1 ? 'filter' : 'filters'}</span>}</div></div>
            <div className="category-page-layout"><FilterSidebar stores={stores} onSortChange={setSort} onStoreChange={setSelectedStores} onDiscountChange={setDiscounts} onTypeChange={setTypes} onValidityChange={setValidity} /><main className="category-main-content">{visible.length ? <><div className="coupon-grid-v2">{visible.map((coupon) => <CouponCard coupon={coupon} variant="category" key={coupon.id} />)}</div><Pagination currentPage={page} totalPages={totalPages} onPageChange={(next) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></> : <div className="empty-state"><i className="fas fa-ticket-alt" /><h3>No Coupons Found</h3><p>Try adjusting your filters or browse all coupons.</p><Link href="/" className="btn btn-primary">Browse All Coupons</Link></div>}</main></div>
        </div></section>
    </>;
}
