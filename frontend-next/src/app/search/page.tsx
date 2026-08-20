'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CouponCard, StoreCard } from '@/components/features';
import { searchApi } from '@/services/api';
import type { SearchResults } from '@/types';

function SearchResultsView() {
    const query = useSearchParams().get('q') || '';
    const [results, setResults] = useState<SearchResults>({ stores: [], coupons: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'stores' | 'coupons'>('all');

    useEffect(() => {
        if (!query) { setLoading(false); return; }
        setLoading(true);
        searchApi.search(query).then(setResults).catch(console.error).finally(() => setLoading(false));
    }, [query]);

    const total = results.stores.length + results.coupons.length;
    const subtitle = query ? loading ? `Searching for “${query}”…` : `${total} results found for “${query}”` : 'Enter a search term to explore stores, coupons, and deals.';

    return <>
        <div className="breadcrumb-section"><div className="container"><div className="breadcrumb-content"><div className="breadcrumb-nav"><Link href="/">Home</Link><i className="fas fa-chevron-right" /><span>Search: “{query}”</span></div></div></div></div>
        <section className="page-header"><div className="container"><h1 className="page-title">Search Results</h1><p className="page-subtitle">{subtitle}</p><div className="search-tabs"><button className={`search-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All ({total})</button><button className={`search-tab ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}>Stores ({results.stores.length})</button><button className={`search-tab ${tab === 'coupons' ? 'active' : ''}`} onClick={() => setTab('coupons')}>Coupons ({results.coupons.length})</button></div></div></section>
        <section className="section section-gray"><div className="container">
            {loading ? <div className="coupon-grid-v2">{[1, 2, 3, 4, 5, 6].map((item) => <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }} key={item}><div className="skeleton" style={{ width: '50%', height: 18, marginBottom: 12 }} /><div className="skeleton" style={{ width: '80%', height: 12, marginBottom: 8 }} /><div className="skeleton" style={{ width: '35%', height: 12 }} /></div>)}</div> : total === 0 ? <div className="empty-state"><i className="fas fa-search" /><h3>No Results Found</h3><p>Try different keywords or browse our categories.</p><Link href="/" className="btn btn-primary">Go Home</Link></div> : <>
                {(tab === 'all' || tab === 'stores') && results.stores.length > 0 && <div className="search-section"><h2 className="search-section-title"><i className="fas fa-store" /> Stores</h2><div className="store-grid">{results.stores.map((store) => <StoreCard store={store} key={store.id} />)}</div></div>}
                {(tab === 'all' || tab === 'coupons') && results.coupons.length > 0 && <div className="search-section"><h2 className="search-section-title"><i className="fas fa-ticket-alt" /> Coupons</h2><div className="coupon-grid">{results.coupons.map((coupon) => <CouponCard coupon={coupon} key={coupon.id} />)}</div></div>}
            </>}
        </div></section>
    </>;
}

export default function SearchPage() {
    return <Suspense fallback={<div className="loading-container"><div className="spinner" /></div>}><SearchResultsView /></Suspense>;
}
