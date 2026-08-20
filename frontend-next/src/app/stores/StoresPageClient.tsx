'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StoreCard } from '@/components/features';
import { storesApi } from '@/services/api';
import type { Store } from '@/types';

export default function StoresPageClient({ initialStores }: { initialStores: Store[] }) {
    const [query, setQuery] = useState('');
    const [stores, setStores] = useState(initialStores);

    useEffect(() => {
        let active = true;
        storesApi.getAllFresh().then((fresh) => { if (active) setStores(fresh); }).catch((error) => console.error('Failed to refresh stores:', error));
        return () => { active = false; };
    }, []);

    const filtered = stores.filter((store) => store.name.toLowerCase().includes(query.toLowerCase()));
    const featuredCount = stores.filter((store) => store.is_featured).length;
    const offerCount = stores.reduce((sum, store) => sum + (store.coupon_count || 0), 0);
    const grouped = filtered.reduce<Record<string, Store[]>>((result, store) => {
        const letter = store.name.charAt(0).toUpperCase();
        (result[letter] ||= []).push(store);
        return result;
    }, {});
    const letters = Object.keys(grouped).sort();

    return <>
        <section className="all-stores-hero-react stores-directory-hero">
            <div className="container">
                <div className="breadcrumb-nav breadcrumb-nav-light"><Link href="/">Home</Link><i className="fas fa-chevron-right" /><span>All Stores</span></div>
                <div className="all-stores-hero-react-body">
                    <div><h1 className="all-stores-title-react">Stores</h1><p className="all-stores-subtitle-react">Find every brand page with active coupon codes, deals, and verified offers.</p></div>
                    <div className="all-stores-tools-react">
                        <label className="stores-search stores-search-elevated"><i className="fas fa-search" /><input type="text" placeholder="Search stores..." value={query} onChange={(event) => setQuery(event.target.value)} className="stores-search-input" />{query && <button type="button" className="stores-search-clear" aria-label="Clear search" onClick={() => setQuery('')}><i className="fas fa-times" /></button>}</label>
                        <div className="all-stores-stats-react"><span className="all-stores-stat-pill-react"><i className="fas fa-store" /> {stores.length} Stores</span><span className="all-stores-stat-pill-react"><i className="fas fa-ticket-alt" /> {offerCount} Offers</span>{featuredCount > 0 && <span className="all-stores-stat-pill-react"><i className="fas fa-star" /> {featuredCount} Featured</span>}</div>
                    </div>
                </div>
                <div className="alphabet-filter alphabet-filter-react">{letters.map((letter) => <a href={`#letter-${letter}`} className="alphabet-item" key={letter}>{letter}</a>)}</div>
            </div>
        </section>
        <section className="stores-directory-section"><div className="container">
            <div className="stores-directory-summary"><div><h2>{query ? `Results for “${query}”` : 'Browse by Brand'}</h2><p>{filtered.length} {filtered.length === 1 ? 'store' : 'stores'} available</p></div>{!query && letters.length > 0 && <span>Showing A-Z groups</span>}</div>
            <div className="stores-directory-list">{letters.map((letter) => <div id={`letter-${letter}`} className="stores-letter-group" key={letter}><div className="letter-heading-row"><h2 className="letter-heading">{letter}</h2><span>{grouped[letter].length} {grouped[letter].length === 1 ? 'store' : 'stores'}</span></div><div className="stores-directory-grid">{grouped[letter].map((store) => <StoreCard store={store} key={store.id} />)}</div></div>)}</div>
            {!filtered.length && <div className="empty-state"><i className="fas fa-store-slash" /><h3>No Stores Found</h3><p>Try a different search term.</p></div>}
        </div></section>
    </>;
}
