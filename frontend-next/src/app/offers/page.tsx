'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SeasonalOffer, Coupon } from '@/types';
import { seasonalOffersApi } from '@/services/api';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { CouponModal } from '@/components/common/CouponModal';
import { getStorePath } from '@/lib/routes';

export default function OffersPage() {
    const [offers, setOffers] = useState<SeasonalOffer[]>(deployedSnapshot.homepage?.initialSeasonalOffers || []);
    const [loading, setLoading] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        seasonalOffersApi.getActive()
            .then(setOffers)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCouponClick = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setShowModal(true);
    };

    const formatDiscount = (coupon: Coupon): string => {
        if (!coupon.discount_value || coupon.discount_value === 0) return '';
        if (coupon.discount_type === 'percentage') return `${coupon.discount_value}% OFF`;
        if (coupon.discount_type === 'fixed') return `Rs.${coupon.discount_value} OFF`;
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

    return (
        <>
            <section className="all-stores-hero-react">
                <div className="container">
                    <div className="breadcrumb-nav breadcrumb-nav-light">
                        <Link href="/">Home</Link>
                        <i className="fas fa-chevron-right"></i>
                        <span>Seasonal Offers</span>
                    </div>

                    <div className="all-stores-hero-react-body">
                        <div>
                            <h1 className="all-stores-title-react">Seasonal deals worth checking before they expire</h1>
                            <p className="all-stores-subtitle-react">
                                Browse active festival campaigns, limited-time store offers, and handpicked coupons in one place.
                            </p>
                        </div>

                        <div className="all-stores-stats-react">
                            <span className="all-stores-stat-pill-react">{offers.length} Active Campaigns</span>
                            <span className="all-stores-stat-pill-react">
                                {offers.reduce((count, offer) => count + offer.coupons.length, 0)} Coupons
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="seasonal-page-coupons">
                <div className="container">
                    {offers.length > 0 ? (
                        offers.map((offer) => {
                            const endDate = new Date(offer.end_date);
                            const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            const gradientStyle = {
                                background: offer.gradient_start && offer.gradient_end
                                    ? `linear-gradient(135deg, ${offer.gradient_start} 0%, ${offer.gradient_end} 100%)`
                                    : offer.theme_color,
                            };

                            return (
                                <div key={offer.id} style={{ marginBottom: '2rem' }}>
                                    <div className="seasonal-page-hero" style={gradientStyle}>
                                        <div className="container">
                                            <div className="seasonal-page-hero-content">
                                                <div className="seasonal-page-info">
                                                    <h2 className="seasonal-page-title"><i className="fas fa-fire-alt"></i> {offer.name}</h2>
                                                    <p className="seasonal-page-description">{offer.description}</p>
                                                    {daysRemaining > 0 && (
                                                        <div className="seasonal-page-countdown">
                                                            <div className="countdown-box">
                                                                <span className="countdown-number">{daysRemaining}</span>
                                                                <span className="countdown-label">Days Left</span>
                                                            </div>
                                                            <p className="countdown-text">
                                                                Ends on {endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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

                                    <div className="section-header-new" style={{ marginTop: '1.5rem' }}>
                                        <div className="section-header-left">
                                            <h2>All {offer.name} Deals</h2>
                                            <p>{offer.coupons.length} offers available</p>
                                        </div>
                                    </div>

                                    <div className="coupon-grid-new">
                                        {offer.coupons.map((coupon) => (
                                            <div key={coupon.id} className="coupon-card-new">
                                                {coupon.is_verified && <span className="coupon-badge-new best">VERIFIED</span>}
                                                <div className="coupon-card-header-new">
                                                    <Link href={getStorePath(coupon.store_slug)} className="coupon-store-logo-link">
                                                        <img src={coupon.store_logo || '/placeholder-store.png'} alt={coupon.store_name} className="coupon-store-logo-new" />
                                                    </Link>
                                                    <div>
                                                        {formatDiscount(coupon) && <div className="coupon-discount-new">{formatDiscount(coupon)}</div>}
                                                        <h3 className="coupon-title-new">{coupon.title}</h3>
                                                    </div>
                                                </div>
                                                {coupon.description && <p className="coupon-description-new">{coupon.description}</p>}
                                                <div className="coupon-meta-new">
                                                    {coupon.is_verified && <span className="coupon-meta-item verified"><i className="fas fa-check-circle"></i> Verified</span>}
                                                    <span className="coupon-meta-item"><i className="fas fa-users"></i> {coupon.click_count} uses</span>
                                                </div>
                                                <div className="coupon-card-footer-new">
                                                    <Link href={getStorePath(coupon.store_slug)} className="coupon-store-link">{coupon.store_name}</Link>
                                                    <button
                                                        className={coupon.code ? 'btn-reveal-code' : 'btn-get-code-new btn-activate-new'}
                                                        onClick={() => handleCouponClick(coupon)}
                                                    >
                                                        {coupon.code ? (
                                                            <>
                                                                <span className="btn-reveal-text">GET CODE</span>
                                                                <span className="btn-reveal-peek">{coupon.code.slice(-4)}</span>
                                                            </>
                                                        ) : (
                                                            'Get Deal'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-fire"></i>
                            <h3>No Seasonal Offers Live Right Now</h3>
                            <p>We&apos;ll show festival campaigns and limited-time collections here as soon as they go live.</p>
                            <Link href="/" className="btn btn-primary">Browse Homepage</Link>
                        </div>
                    )}
                </div>
            </section>

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
