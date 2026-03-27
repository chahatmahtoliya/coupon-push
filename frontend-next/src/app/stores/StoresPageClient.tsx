'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Store } from '@/types';
import { storesApi } from '@/services/api';
import { StoreCard } from '@/components/features';

export default function StoresPageClient() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        document.title = 'All Stores - CouponPush | Find Coupons by Brand';
        storesApi.getAll()
            .then(setStores)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredStores = stores.filter((store) =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedStores = filteredStores.reduce((acc, store) => {
        const letter = store.name.charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(store);
        return acc;
    }, {} as Record<string, Store[]>);

    const letters = Object.keys(groupedStores).sort();
    const activeLetter = searchQuery ? '' : (letters[0] || '');

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading stores...</p>
            </div>
        );
    }

    return (
        <>
            <section className="all-stores-hero-react">
                <div className="container">
                    <div className="breadcrumb-nav breadcrumb-nav-light">
                        <Link href="/">Home</Link>
                        <i className="fas fa-chevron-right"></i>
                        <span>All Stores</span>
                    </div>

                    <div className="all-stores-hero-react-body">
                        <div>
                            <h1 className="all-stores-title-react">Browse all coupon stores in one place</h1>
                            <p className="all-stores-subtitle-react">
                                Explore {stores.length}+ stores, search instantly, and jump by alphabet to find brand pages faster.
                            </p>
                        </div>

                        <div className="all-stores-tools-react">
                            <label className="stores-search stores-search-elevated">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="stores-search-input"
                                />
                            </label>
                            <div className="all-stores-stats-react">
                                <span className="all-stores-stat-pill-react">{stores.length}+ Stores</span>
                                {activeLetter && <span className="all-stores-stat-pill-react">Starting with {activeLetter}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="alphabet-filter alphabet-filter-react">
                        {letters.map((letter) => (
                            <a key={letter} href={`#letter-${letter}`} className="alphabet-item">
                                {letter}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-light">
                <div className="container">
                    {letters.map((letter) => (
                        <div key={letter} id={`letter-${letter}`} className="stores-letter-group">
                            <h2 className="letter-heading">{letter}</h2>
                            <div className="store-grid">
                                {groupedStores[letter].map((store) => (
                                    <StoreCard key={store.id} store={store} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredStores.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-store-slash"></i>
                            <h3>No Stores Found</h3>
                            <p>Try a different search term.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
