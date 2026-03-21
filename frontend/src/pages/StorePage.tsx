import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Store, Coupon } from '@/types';
import { storesApi } from '@/services/api';
import { CouponCard } from '@/components/features';
import {
    useSEO,
    generateStoreSchema,
    generateBreadcrumbSchema,
    generateCouponSchema
} from '@/hooks/useSEO';

interface StorePageData {
    store: Store;
    coupons: Coupon[];
    related_stores: Store[];
}

export function StorePage() {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<StorePageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'codes' | 'deals'>('all');

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        storesApi.getBySlug(slug)
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    // Derive a display name from slug for use BEFORE API data loads
    const displayName = data?.store?.name || (slug
        ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Store');

    // SEO: Dynamic meta tags and Schema.org structured data
    const store = data?.store;
    const coupons = data?.coupons || [];

    const suffix = store?.h1_suffix || null;
    const titleSuffix = suffix ? suffix : 'Coupon Codes & Promo Codes';

    useSEO({
        title: store
            ? `${store.name} ${titleSuffix} | CouponPush`
            : `${displayName} ${titleSuffix} | CouponPush`,
        description: store?.description || '',
        url: `https://couponpush.com/store/${slug}`,
        image: store?.logo || undefined,
        type: 'website',
        schema: store ? [
            // Store/Organization schema
            generateStoreSchema(store, coupons.length),
            // Breadcrumb schema
            generateBreadcrumbSchema([
                { name: 'Home', url: 'https://couponpush.com' },
                { name: 'Stores', url: 'https://couponpush.com/stores' },
                { name: `${store.name} Coupons`, url: `https://couponpush.com/store/${store.slug}` }
            ]),
            // First 5 coupon offers as schema
            ...coupons.slice(0, 5).map(coupon => generateCouponSchema({
                id: coupon.id,
                title: coupon.title,
                description: coupon.description,
                code: coupon.code,
                discount_value: coupon.discount_value,
                discount_type: coupon.discount_type,
                store_name: store.name,
                store_slug: store.slug,
                store_website: store.website_url,
                expiry_date: coupon.expiry_date
            }))
        ] : undefined
    });

    // Data for rendering (use defaults when loading)
    const storeData = data?.store;
    const couponsData = data?.coupons || [];
    const related_stores = data?.related_stores || [];

    const filteredCoupons = couponsData.filter((coupon) => {
        if (filter === 'codes') return !!coupon.code;
        if (filter === 'deals') return !coupon.code;
        return true;
    });

    const couponCodes = couponsData.filter((c) => !!c.code).length;
    const dealOffers = couponsData.filter((c) => !c.code).length;

    return (
        <>
            {/* Breadcrumb - Always visible with slug-derived name */}
            <div className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb-content">
                        <div className="breadcrumb-nav">
                            <Link to="/">Home</Link>
                            <i className="fas fa-chevron-right"></i>
                            <Link to="/stores">Stores</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span>{displayName} Coupons</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Store Hero Banner - Always visible */}
            <div className="store-hero-v3">
                <div className="container">
                    <div className="store-hero-v3-inner">
                        {/* Store Logo */}
                        <div className="store-hero-v3-logo">
                            {storeData ? (
                                <img
                                    src={storeData.logo || '/placeholder-storeData.png'}
                                    alt={storeData.name}
                                />
                            ) : (
                                <div className="skeleton skeleton-logo" style={{ width: 80, height: 80, borderRadius: 12, background: '#e0e0e0' }}></div>
                            )}
                        </div>

                        {/* Store Info */}
                        <div className="store-hero-v3-content">
                            <div className="store-hero-v3-main">
                                <div className="store-hero-v3-info">
                                    <h1 className="store-hero-v3-title">
                                        {displayName}
                                        {suffix && (
                                            <span className="store-hero-v3-mobile-subtitle"> {suffix}</span>
                                        )}
                                    </h1>
                                    <p className="store-hero-v3-description">
                                        {storeData?.description || ''}
                                    </p>
                                </div>

                                {storeData?.website_url && (
                                    <div className="store-hero-v3-actions">
                                        <a
                                            href={storeData.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-visit-website-v3"
                                        >
                                            Visit Website <i className="fas fa-external-link-alt"></i>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <section className="store-main-section">
                <div className="container">
                    <div className="row">
                        {/* Sidebar Filters */}
                        <div className="col-lg-3">
                            <div className="filter-card d-none d-lg-block">
                                <div className="filter-header">
                                    <h4>Filter & Sort</h4>
                                    <button className="filter-reset" onClick={() => setFilter('all')}>
                                        Reset
                                    </button>
                                </div>

                                <div className="filter-group">
                                    <h5>DISCOUNT TYPE</h5>
                                    <label className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filter === 'all' || filter === 'codes'}
                                            onChange={() => setFilter(filter === 'codes' ? 'all' : 'codes')}
                                        />
                                        <span className="filter-checkbox-mark"></span>
                                        Coupon Codes ({couponCodes})
                                    </label>
                                    <label className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filter === 'all' || filter === 'deals'}
                                            onChange={() => setFilter(filter === 'deals' ? 'all' : 'deals')}
                                        />
                                        <span className="filter-checkbox-mark"></span>
                                        Deals & Offers ({dealOffers})
                                    </label>
                                </div>
                            </div>

                            {/* Similar Stores */}
                            {related_stores.length > 0 && (
                                <div className="filter-card mt-4">
                                    <h4 className="filter-title-simple">Similar Stores</h4>
                                    <div className="similar-stores-list">
                                        {related_stores.map((relatedStore) => (
                                            <Link
                                                key={relatedStore.id}
                                                to={`/store/${relatedStore.slug}`}
                                                className="similar-store-item"
                                            >
                                                <img
                                                    src={relatedStore.logo || '/placeholder-storeData.png'}
                                                    alt={relatedStore.name}
                                                />
                                                <div className="similar-store-info">
                                                    <span className="similar-store-name">{relatedStore.name}</span>
                                                    <span className="similar-store-count">
                                                        {relatedStore.coupon_count} Coupons
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="col-lg-9">
                            <div className="coupons-header">
                                <h2>
                                    All Active Coupons{' '}
                                    {!loading && <span className="coupons-count">({filteredCoupons.length} Offers)</span>}
                                </h2>
                            </div>

                            {/* Loading State - Skeleton Cards */}
                            {loading && (
                                <div className="coupon-list">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="coupon-card-skeleton" style={{
                                            background: '#fff',
                                            borderRadius: 12,
                                            padding: 20,
                                            marginBottom: 16,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        }}>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                <div style={{ width: 60, height: 60, borderRadius: 8, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ width: '70%', height: 16, borderRadius: 4, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 }}></div>
                                                    <div style={{ width: '50%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Error State */}
                            {!loading && (error || !data) && (
                                <div className="empty-state">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <h3>Store Not Found</h3>
                                    <p className="empty-state-text">
                                        The store you're looking for doesn't exist or is currently unavailable.
                                    </p>
                                    <Link to="/stores" className="btn btn-primary">Browse All Stores</Link>
                                </div>
                            )}

                            {/* Loaded Content */}
                            {!loading && data && (
                                <>
                                    {filteredCoupons.length === 0 ? (
                                        <div className="empty-state">
                                            <i className="fas fa-ticket-alt"></i>
                                            <h3>No Coupons Found</h3>
                                            <p className="empty-state-text">
                                                There are no active coupons matching your filter.
                                            </p>
                                            <button className="btn btn-primary" onClick={() => setFilter('all')}>
                                                Show All Coupons
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="coupon-list">
                                            {filteredCoupons.map((coupon) => (
                                                <CouponCard key={coupon.id} coupon={coupon} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Store Info Section - Only shows when admin has added content */}
                            {(storeData?.about_content || storeData?.howto_content || storeData?.terms_content) && (
                                <div className="store-info-section">
                                    {/* Section 1: About Store */}
                                    {storeData?.about_content && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header">
                                                <i className="fas fa-info-circle"></i>
                                                <h3>About {displayName}</h3>
                                            </div>
                                            <div className="store-info-body">
                                                <div dangerouslySetInnerHTML={{ __html: storeData.about_content }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 2: How to Use Coupons */}
                                    {storeData?.howto_content && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header">
                                                <i className="fas fa-tag"></i>
                                                <h3>How to Use {displayName} Coupons & Promo Codes</h3>
                                            </div>
                                            <div className="store-info-body">
                                                <div dangerouslySetInnerHTML={{ __html: storeData.howto_content }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 3: Terms & Conditions */}
                                    {storeData?.terms_content && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header">
                                                <i className="fas fa-file-contract"></i>
                                                <h3>{displayName} Coupon Terms & Conditions</h3>
                                            </div>
                                            <div className="store-info-body">
                                                <div dangerouslySetInnerHTML={{ __html: storeData.terms_content }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default StorePage;
