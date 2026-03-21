import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import type { Store, Coupon } from '@/types';
import { searchApi } from '@/services/api';
import { CouponCard, StoreCard } from '@/components/features';

interface SearchResults {
    stores: Store[];
    coupons: Coupon[];
}

export function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<SearchResults>({ stores: [], coupons: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'stores' | 'coupons'>('all');

    useSEO({
        title: query ? `Search results for "${query}" - CouponPush` : 'Search Coupons - CouponPush',
        description: `Find the best deals and coupons for ${query}. Browse our comprehensive collection of verified promo codes.`,
        url: `https://couponpush.com/search?q=${query}`
    });

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        setLoading(true);
        searchApi.search(query)
            .then(setResults)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [query]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Searching...</p>
            </div>
        );
    }

    const totalResults = results.stores.length + results.coupons.length;

    return (
        <>
            {/* Breadcrumb */}
            <div className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb-content">
                        <div className="breadcrumb-nav">
                            <Link to="/">Home</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span>Search: "{query}"</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Header */}
            <section className="page-header">
                <div className="container">
                    <h1 className="page-title">Search Results</h1>
                    <p className="page-subtitle">
                        {totalResults} results found for "{query}"
                    </p>

                    {/* Tabs */}
                    <div className="search-tabs">
                        <button
                            className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All ({totalResults})
                        </button>
                        <button
                            className={`search-tab ${activeTab === 'stores' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stores')}
                        >
                            Stores ({results.stores.length})
                        </button>
                        <button
                            className={`search-tab ${activeTab === 'coupons' ? 'active' : ''}`}
                            onClick={() => setActiveTab('coupons')}
                        >
                            Coupons ({results.coupons.length})
                        </button>
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="section section-gray">
                <div className="container">
                    {totalResults === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-search"></i>
                            <h3>No Results Found</h3>
                            <p>Try different keywords or browse our categories.</p>
                            <Link to="/" className="btn btn-primary">Go Home</Link>
                        </div>
                    ) : (
                        <>
                            {/* Stores Results */}
                            {(activeTab === 'all' || activeTab === 'stores') && results.stores.length > 0 && (
                                <div className="search-section">
                                    <h2 className="search-section-title">
                                        <i className="fas fa-store"></i> Stores
                                    </h2>
                                    <div className="store-grid">
                                        {results.stores.map((store) => (
                                            <StoreCard key={store.id} store={store} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Coupons Results */}
                            {(activeTab === 'all' || activeTab === 'coupons') && results.coupons.length > 0 && (
                                <div className="search-section">
                                    <h2 className="search-section-title">
                                        <i className="fas fa-ticket-alt"></i> Coupons
                                    </h2>
                                    <div className="coupon-grid">
                                        {results.coupons.map((coupon) => (
                                            <CouponCard key={coupon.id} coupon={coupon} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
}

export default SearchPage;
