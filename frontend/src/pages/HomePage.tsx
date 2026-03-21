import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Store, Coupon, Deal, SeasonalOffer } from '@/types';
import { storesApi, couponsApi, dealsApi, seasonalOffersApi, trackClick } from '@/services/api';
import { SeasonalBanner } from '@/components/features';
import { useSEO } from '@/hooks/useSEO';

export function HomePage() {
    const [featuredCoupons, setFeaturedCoupons] = useState<Coupon[]>([]);
    const [latestCoupons, setLatestCoupons] = useState<Coupon[]>([]);
    const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
    const [featuredDeals, setFeaturedDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);
    const [heroSlide, setHeroSlide] = useState(0);
    const [couponSort, setCouponSort] = useState<'popular' | 'newest' | 'expiring'>('popular');
    const [seasonalOffers, setSeasonalOffers] = useState<SeasonalOffer[]>([]);

    // SEO: Homepage with current month/year for freshness signals (low-hanging fruit keyword)
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    useSEO({
        title: `Best Coupon Codes & Promo Codes ${month} ${year} - CouponPush India`,
        description: `Find verified coupon codes, exclusive deals & promo codes for top stores like Amazon, Flipkart, Myntra. Save up to 70% with ${featuredCoupons.length || 100}+ active coupons. Updated daily!`,
        url: 'https://couponpush.com',
        type: 'website',
        schema: {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'Featured Coupon Codes',
            'description': `Top coupon codes and deals for ${month} ${year}`,
            'numberOfItems': featuredCoupons.length,
            'itemListElement': featuredCoupons.slice(0, 10).map((coupon, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': coupon.title,
                'url': `https://couponpush.com/coupon/${coupon.id}`
            }))
        }
    });

    // Hero slides data - Multi-card banners (CashKaro style)
    const heroSlides = [
        {
            image: '/images/amzn_p.png',
        },
        {
            image: '/images/dreds.png',
            ctaUrl: 'https://amzn.to/3MAp69Z'
        },
        {
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
            cashback: 'Flat 15% Cashback'
        },
        {
            image: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&h=400&fit=crop',
            cashback: 'Up to 12% Cashback'
        },
        {
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
            cashback: 'Flat 8% Cashback'
        },
        {
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop',
            cashback: 'Up to 5% Cashback'
        }
    ];

    useEffect(() => {
        const loadData = async () => {
            const errorList: string[] = [];

            try {
                const featured = await couponsApi.getFeatured(8);
                setFeaturedCoupons(featured);
            } catch (e) {
                console.error('Failed to load featured coupons:', e);
                errorList.push('Featured coupons');
            }

            try {
                const latest = await couponsApi.getLatest(12);
                setLatestCoupons(latest);
            } catch (e) {
                console.error('Failed to load latest coupons:', e);
                errorList.push('Latest coupons');
            }

            try {
                const stores = await storesApi.getFeatured(12);
                setFeaturedStores(stores);
            } catch (e) {
                console.error('Failed to load stores:', e);
                errorList.push('Stores');
            }

            try {
                const deals = await dealsApi.getFeatured(4);
                setFeaturedDeals(deals);
            } catch (e) {
                console.error('Failed to load deals:', e);
                errorList.push('Deals');
            }

            try {
                const seasonal = await seasonalOffersApi.getActive();
                setSeasonalOffers(seasonal);
            } catch (e) {
                console.error('Failed to load seasonal offers:', e);
                // Silently fail - seasonal offers are optional
            }

            setErrors(errorList);
            setLoading(false);
        };

        loadData();
    }, []);

    // Auto-slide hero banner (loop through positions, showing 3 slides at a time)
    const maxSlidePosition = Math.max(0, heroSlides.length - 3);
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroSlide((prev) => (prev >= maxSlidePosition ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [maxSlidePosition]);

    // Search handler - uncomment when search form is added
    // const handleSearch = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (searchQuery.trim()) {
    //         navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    //     }
    // };

    const handleDealClick = (coupon: Coupon) => {
        // Track click in background (no blocking navigation).
        void trackClick('coupon', coupon.id);
    };

    const getCouponDealUrl = (coupon: Coupon): string => {
        const couponWithAffiliate = coupon as Coupon & { affiliate_link?: string | null };
        return couponWithAffiliate.affiliate_link || coupon.store_website_url || `/store/${coupon.store_slug}`;
    };

    const renderCouponPricing = (coupon: Coupon) => {
        const originalPrice = coupon.original_price != null ? Number(coupon.original_price) : null;
        const salePrice = coupon.sale_price != null ? Number(coupon.sale_price) : null;

        if (originalPrice === null && salePrice === null) {
            return null;
        }

        const savings =
            originalPrice !== null && salePrice !== null && originalPrice > salePrice
                ? originalPrice - salePrice
                : null;

        return (
            <div className="coupon-price-display coupon-price-display-home">
                {originalPrice !== null && (
                    <span className="coupon-original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
                )}
                {salePrice !== null && (
                    <span className="coupon-sale-price">₹{salePrice.toLocaleString('en-IN')}</span>
                )}
                {savings !== null && (
                    <span className="coupon-savings-badge">Save ₹{savings.toLocaleString('en-IN')}</span>
                )}
            </div>
        );
    };

    const formatDiscount = (coupon: Coupon): string => {
        // Hide discount if value is 0 or empty
        if (!coupon.discount_value || coupon.discount_value === 0) {
            return '';
        }
        if (coupon.discount_type === 'percentage') {
            return `${coupon.discount_value}% OFF`;
        } else if (coupon.discount_type === 'fixed') {
            return `₹${coupon.discount_value} OFF`;
        }
        return 'DEAL';
    };

    const getBadgeType = (coupon: Coupon): string => {
        if (coupon.is_featured) return 'hot';
        if (coupon.is_verified) return 'best';
        return 'new';
    };

    const getBadgeText = (coupon: Coupon): string => {
        if (coupon.is_featured) return 'HOT';
        if (coupon.is_verified) return 'BEST';
        return 'NEW';
    };



    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading amazing deals...</p>
            </div>
        );
    }

    // Combine and sort coupons for display
    const baseCoupons = [...featuredCoupons, ...latestCoupons].slice(0, 12);

    // Sort coupons based on selected tab
    const allCoupons = [...baseCoupons].sort((a, b) => {
        switch (couponSort) {
            case 'popular':
                return (b.click_count || 0) - (a.click_count || 0);
            case 'newest':
                // Sort by ID descending (newer coupons have higher IDs)
                return b.id - a.id;
            case 'expiring':
                // Sort by expiry date ascending (soonest first)
                if (!a.expiry_date) return 1;
                if (!b.expiry_date) return -1;
                return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
            default:
                return 0;
        }
    }).slice(0, 8);

    return (
        <>
            <h1 className="visually-hidden">Best Coupon Codes, Promo Codes & Exclusive Deals in India</h1>
            {/* Debug info */}
            {errors.length > 0 && (
                <div style={{ background: '#fee2e2', padding: '10px', margin: '10px', borderRadius: '8px' }}>
                    <strong>API Errors:</strong> {errors.join(', ')} failed to load.
                    <br />
                    <small>Make sure XAMPP Apache is running and test: <a href="http://localhost/coupon-site/api/coupons.php" target="_blank">API Test</a></small>
                </div>
            )}

            {/* Hero Banner Section - Multi-Card Slider (CashKaro Style) */}
            <div className="hero-slider-simple">
                <div className="hero-slider-container">
                    <div
                        className="hero-slider-track"
                        style={{ transform: `translateX(-${heroSlide * (100 / 3)}%)` }}
                    >
                        {heroSlides.map((slide, index) => (
                            <div key={index} className="hero-slide-simple">
                                <img
                                    src={slide.image}
                                    alt={slide.cashback || 'Hero deal'}
                                    className="hero-slide-image"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/amzn_p.png';
                                    }}
                                />
                                <div className="hero-slide-overlay">
                                    <div className="hero-slide-content">
                                        {slide.cashback && (
                                            <span className="hero-slide-cashback">
                                                <i className="fas fa-tag"></i> {slide.cashback}
                                            </span>
                                        )}
                                        {slide.ctaUrl && (
                                            <a
                                                href={slide.ctaUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hero-slide-btn"
                                            >
                                                Shop Now
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    className="hero-nav-btn hero-nav-prev"
                    onClick={() => setHeroSlide(prev => prev === 0 ? heroSlides.length - 3 : prev - 1)}
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
                <button
                    className="hero-nav-btn hero-nav-next"
                    onClick={() => setHeroSlide(prev => prev >= heroSlides.length - 3 ? 0 : prev + 1)}
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>

            {/* Seasonal Offers Banner */}
            {seasonalOffers.length > 0 && (
                <SeasonalBanner offer={seasonalOffers[0]} />
            )}

            {/* Trending Coupons Section */}
            <section className="trending-section">
                <div className="container">
                    <div className="section-header-new">
                        <div className="section-header-left">
                            <h2>Trending Coupons</h2>
                            <p>Curated coupons from the most popular stores</p>
                        </div>
                        <div className="coupon-filter-tabs">
                            <button
                                className={`filter-tab ${couponSort === 'popular' ? 'active' : ''}`}
                                onClick={() => setCouponSort('popular')}
                            >
                                Popular
                            </button>
                            <button
                                className={`filter-tab ${couponSort === 'newest' ? 'active' : ''}`}
                                onClick={() => setCouponSort('newest')}
                            >
                                Newest
                            </button>
                            <button
                                className={`filter-tab ${couponSort === 'expiring' ? 'active' : ''}`}
                                onClick={() => setCouponSort('expiring')}
                            >
                                Expiring Soon
                            </button>
                        </div>
                    </div>

                    <div className="coupon-grid-new">
                        {allCoupons.map((coupon) => (
                            <div key={coupon.id} className="coupon-card-new">
                                <span className={`coupon-badge-new ${getBadgeType(coupon)}`}>
                                    {getBadgeText(coupon)}
                                </span>
                                <div className="coupon-card-header-new">
                                    <Link to={`/store/${coupon.store_slug}`} className="coupon-store-logo-link">
                                        <img
                                            src={coupon.store_logo || '/placeholder-store.png'}
                                            alt={coupon.store_name}
                                            className="coupon-store-logo-new"
                                        />
                                    </Link>
                                    <div>
                                        {formatDiscount(coupon) && (
                                            <div className="coupon-discount-new">{formatDiscount(coupon)}</div>
                                        )}
                                        <h3 className="coupon-title-new">{coupon.title}</h3>
                                    </div>
                                </div>
                                {coupon.description && (
                                    <p className="coupon-description-new">{coupon.description}</p>
                                )}
                                {renderCouponPricing(coupon)}
                                <div className="coupon-meta-new">
                                    {coupon.is_verified && (
                                        <span className="coupon-meta-item verified">
                                            <i className="fas fa-check-circle"></i> Verified
                                        </span>
                                    )}
                                    <span className="coupon-meta-item">
                                        <i className="fas fa-users"></i> {coupon.click_count} uses
                                    </span>
                                </div>
                                <div className="coupon-card-footer-new">
                                    <a
                                        href={getCouponDealUrl(coupon)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={coupon.code ? 'ticket-cta ticket-cta-code' : 'ticket-cta ticket-cta-deal'}
                                        onClick={() => handleDealClick(coupon)}
                                    >
                                        <i className={coupon.code ? 'fas fa-scissors' : 'fas fa-external-link-alt'}></i>
                                        {coupon.code ? 'GET COUPON' : 'GET DEAL'}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="load-more-btn">
                        Load More Coupons <i className="fas fa-chevron-down"></i>
                    </button>
                </div>
            </section>

            {/* Top Stores Section */}
            <section className="top-stores-section">
                <div className="container">
                    <div className="section-header-new">
                        <div className="section-header-left">
                            <h2>Top Stores</h2>
                        </div>
                        <Link to="/stores" className="category-pills-view-all">
                            View All Stores <i className="fas fa-chevron-right"></i>
                        </Link>
                    </div>

                    <div className="stores-scroll-container">
                        {featuredStores.slice(0, 9).map((store) => (
                            <Link key={store.id} to={`/store/${store.slug}`} className="store-card-new">
                                <img
                                    src={store.logo || '/placeholder-store.png'}
                                    alt={store.name}
                                    className="store-logo-new"
                                />
                                <h4 className="store-name-new">{store.name}</h4>
                                <span className="store-coupon-badge">
                                    {store.coupon_count} Coupons
                                </span>
                            </Link>
                        ))}
                        <Link to="/stores" className="store-card-new view-more-card">
                            <div className="view-more-icon">
                                <i className="fas fa-arrow-right"></i>
                            </div>
                            <span className="store-name-new">View More</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Top Deals Section */}
            {featuredDeals.length > 0 && (
                <section className="top-deals-section">
                    <div className="container">
                        <div className="section-header-new">
                            <div className="section-header-left">
                                <h2>Top Deals</h2>
                            </div>
                            <Link to="/deals" className="category-pills-view-all">
                                See More <i className="fas fa-chevron-right"></i>
                            </Link>
                        </div>

                        <div className="product-deals-grid">
                            {featuredDeals.map((deal) => (
                                <div key={deal.id} className="product-deal-card">
                                    <div className="product-deal-image">
                                        <img
                                            src={deal.image || '/placeholder-deal.png'}
                                            alt={deal.title}
                                            onError={(e) => {
                                                e.currentTarget.src = '/placeholder-deal.png';
                                            }}
                                        />
                                    </div>
                                    <div className="product-deal-content">
                                        <span className="product-deal-brand">{deal.store_name}</span>
                                        <h3 className="product-deal-title">{deal.title}</h3>
                                        {deal.description && (
                                            <p className="product-deal-price-info">{deal.description}</p>
                                        )}
                                        <div className="product-deal-badge">
                                            <i className="fas fa-tag"></i> Product at its best price
                                        </div>
                                        <div className="product-deal-footer">
                                            <a
                                                href={deal.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="product-deal-btn"
                                            >
                                                GET DEAL <i className="fas fa-arrow-right"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Store-Specific Deals (First Featured Store) */}
            {featuredStores.length > 0 && (
                <section className="store-deals-section">
                    <div className="container">
                        <div className="store-deals-header">
                            <img
                                src={featuredStores[0]?.logo || '/placeholder-store.png'}
                                alt={featuredStores[0]?.name}
                                className="store-deals-logo"
                            />
                            <h3 className="store-deals-title">
                                <i className="fas fa-fire"></i> Top {featuredStores[0]?.name} Deals
                            </h3>
                            <Link to={`/store/${featuredStores[0]?.slug}`} className="store-deals-link">
                                See All {featuredStores[0]?.name} <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="deals-grid-new">
                            {allCoupons.filter(c => c.store_id === featuredStores[0]?.id || true).slice(0, 4).map((coupon) => (
                                <div key={`store-${coupon.id}`} className="coupon-card-new">
                                    <span className={`coupon-badge-new ${getBadgeType(coupon)}`}>
                                        {getBadgeText(coupon)}
                                    </span>
                                    <div className="coupon-card-header-new">
                                        <Link to={`/store/${coupon.store_slug}`} className="coupon-store-logo-link">
                                            <img
                                                src={coupon.store_logo || '/placeholder-store.png'}
                                                alt={coupon.store_name}
                                                className="coupon-store-logo-new"
                                            />
                                        </Link>
                                        <div>
                                            {formatDiscount(coupon) && (
                                                <div className="coupon-discount-new">{formatDiscount(coupon)}</div>
                                            )}
                                            <h3 className="coupon-title-new">{coupon.title}</h3>
                                            {renderCouponPricing(coupon)}
                                        </div>
                                    </div>
                                    <div className="coupon-card-footer-new">
                                        <a
                                            href={getCouponDealUrl(coupon)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={coupon.code ? 'ticket-cta ticket-cta-code' : 'ticket-cta ticket-cta-deal'}
                                            onClick={() => handleDealClick(coupon)}
                                        >
                                            <i className={coupon.code ? 'fas fa-scissors' : 'fas fa-external-link-alt'}></i>
                                            {coupon.code ? 'GET COUPON' : 'GET DEAL'}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            {/* Store-Specific Deals (second Featured Store) */}
            {featuredStores.length > 0 && (
                <section className="store-deals-section">
                    <div className="container">
                        <div className="store-deals-header">
                            <img
                                src={featuredStores[1]?.logo || '/placeholder-store.png'}
                                alt={featuredStores[1]?.name}
                                className="store-deals-logo"
                            />
                            <h3 className="store-deals-title">
                                <i className="fas fa-fire"></i> Top {featuredStores[1]?.name} Deals
                            </h3>
                            <Link to={`/store/${featuredStores[1]?.slug}`} className="store-deals-link">
                                See All {featuredStores[1]?.name} <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="deals-grid-new">
                            {allCoupons.filter(c => c.store_id === featuredStores[1]?.id || true).slice(0, 4).map((coupon) => (
                                <div key={`store-${coupon.id}`} className="coupon-card-new">
                                    <span className={`coupon-badge-new ${getBadgeType(coupon)}`}>
                                        {getBadgeText(coupon)}
                                    </span>
                                    <div className="coupon-card-header-new">
                                        <Link to={`/store/${coupon.store_slug}`} className="coupon-store-logo-link">
                                            <img
                                                src={coupon.store_logo || '/placeholder-store.png'}
                                                alt={coupon.store_name}
                                                className="coupon-store-logo-new"
                                            />
                                        </Link>
                                        <div>
                                            {formatDiscount(coupon) && (
                                                <div className="coupon-discount-new">{formatDiscount(coupon)}</div>
                                            )}
                                            <h3 className="coupon-title-new">{coupon.title}</h3>
                                            {renderCouponPricing(coupon)}
                                        </div>
                                    </div>
                                    <div className="coupon-card-footer-new">
                                        <a
                                            href={getCouponDealUrl(coupon)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={coupon.code ? 'ticket-cta ticket-cta-code' : 'ticket-cta ticket-cta-deal'}
                                            onClick={() => handleDealClick(coupon)}
                                        >
                                            <i className={coupon.code ? 'fas fa-scissors' : 'fas fa-external-link-alt'}></i>
                                            {coupon.code ? 'GET COUPON' : 'GET DEAL'}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

export default HomePage;
