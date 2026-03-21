import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { SeasonalOffer, Coupon } from '@/types';
import { CouponModal } from '@/components/common/CouponModal';
import { useSEO } from '@/hooks/useSEO';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/coupon-site/api';

export function SeasonalPage() {
    const { slug } = useParams<{ slug: string }>();
    const [offer, setOffer] = useState<SeasonalOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        fetch(`${API_BASE}/seasonal-offers.php?slug=${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOffer(data.data);
                } else {
                    setError(data.message || 'Offer not found');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    // SEO
    useSEO({
        title: offer ? `${offer.name} - Best Deals & Coupons | CouponPush` : 'Seasonal Deals & Coupons | CouponPush',
        description: offer?.description || 'Discover amazing seasonal deals and coupons. Save big with exclusive offers from top stores on CouponPush.',
        url: offer ? `https://couponpush.com/offers/${offer.slug}` : undefined,
        type: 'website'
    });

    const handleCouponClick = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setShowModal(true);
    };

    const formatDiscount = (coupon: Coupon): string => {
        if (!coupon.discount_value || coupon.discount_value === 0) return '';
        if (coupon.discount_type === 'percentage') {
            return `${coupon.discount_value}% OFF`;
        } else if (coupon.discount_type === 'fixed') {
            return `₹${coupon.discount_value} OFF`;
        }
        return '';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading seasonal offers...</p>
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="error-container">
                <i className="fas fa-exclamation-circle"></i>
                <h2>Offer Not Found</h2>
                <p>This seasonal offer doesn't exist or has ended.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        );
    }

    // Calculate countdown
    const endDate = new Date(offer.end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const gradientStyle = {
        background: offer.gradient_start && offer.gradient_end
            ? `linear-gradient(135deg, ${offer.gradient_start} 0%, ${offer.gradient_end} 100%)`
            : offer.theme_color
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb-content">
                        <div className="breadcrumb-nav">
                            <Link to="/">Home</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span>{offer.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="seasonal-page-hero" style={gradientStyle}>
                <div className="container">
                    <div className="seasonal-page-hero-content">
                        <div className="seasonal-page-info">
                            <h1 className="seasonal-page-title">
                                <i className="fas fa-fire-alt"></i> {offer.name}
                            </h1>
                            <p className="seasonal-page-description">{offer.description}</p>

                            {daysRemaining > 0 && (
                                <div className="seasonal-page-countdown">
                                    <div className="countdown-box">
                                        <span className="countdown-number">{daysRemaining}</span>
                                        <span className="countdown-label">Days Left</span>
                                    </div>
                                    <p className="countdown-text">
                                        Hurry! Offer ends on {endDate.toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {offer.banner_image && (
                            <div className="seasonal-page-banner">
                                <img src={offer.banner_image} alt={offer.name} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Coupons Grid */}
            <section className="seasonal-page-coupons">
                <div className="container">
                    <div className="section-header-new">
                        <div className="section-header-left">
                            <h2>All {offer.name} Deals</h2>
                            <p>{offer.coupons.length} offers available</p>
                        </div>
                    </div>

                    <div className="coupon-grid-new">
                        {offer.coupons.map((coupon) => (
                            <div key={coupon.id} className="coupon-card-new">
                                {coupon.is_verified && (
                                    <span className="coupon-badge-new best">VERIFIED</span>
                                )}
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
                                    <Link to={`/store/${coupon.store_slug}`} className="coupon-store-link">
                                        {coupon.store_name}
                                    </Link>
                                    {coupon.code ? (
                                        <button
                                            className="btn-reveal-code"
                                            onClick={() => handleCouponClick(coupon)}
                                        >
                                            <span className="btn-reveal-text">GET CODE</span>
                                            <span className="btn-reveal-peek">{coupon.code.slice(-4)}</span>
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-get-code-new btn-activate-new"
                                            onClick={() => handleCouponClick(coupon)}
                                        >
                                            Get Code
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {offer.coupons.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-ticket-alt"></i>
                            <h3>No Coupons Available</h3>
                            <p>Check back soon for new offers!</p>
                            <Link to="/" className="btn btn-primary">Browse All Coupons</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Coupon Modal */}
            {selectedCoupon && (
                <CouponModal
                    coupon={selectedCoupon}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedCoupon(null);
                    }}
                />
            )}
        </>
    );
}

export default SeasonalPage;
