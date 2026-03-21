import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { SeasonalOffer, Coupon } from '@/types';
import { CouponModal } from '@/components/common/CouponModal';

interface SeasonalBannerProps {
    offer: SeasonalOffer;
}

export function SeasonalBanner({ offer }: SeasonalBannerProps) {
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [showModal, setShowModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCouponClick = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setShowModal(true);
    };

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    // Calculate days remaining
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
            <section className="seasonal-banner" style={gradientStyle}>
                <div className="container">
                    <div className="seasonal-banner-content">
                        {/* Header */}
                        <div className="seasonal-banner-header">
                            <div className="seasonal-banner-title-area">
                                <h2 className="seasonal-banner-title">
                                    <i className="fas fa-fire-alt"></i> {offer.name}
                                </h2>
                                <p className="seasonal-banner-description">{offer.description}</p>
                            </div>
                            <div className="seasonal-banner-meta">
                                {daysRemaining > 0 && (
                                    <div className="seasonal-countdown">
                                        <i className="fas fa-clock"></i>
                                        <span>{daysRemaining} days left</span>
                                    </div>
                                )}
                                <Link to={`/offers/${offer.slug}`} className="seasonal-view-all">
                                    View All <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>

                        {/* Scrollable Coupons */}
                        <div className="seasonal-coupons-wrapper">
                            <button className="seasonal-scroll-btn seasonal-scroll-left" onClick={scrollLeft}>
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            <div className="seasonal-coupons-track" ref={scrollRef}>
                                {offer.coupons.map((coupon) => (
                                    <div key={coupon.id} className="seasonal-coupon-card">
                                        <div className="seasonal-coupon-store">
                                            <img
                                                src={coupon.store_logo || '/placeholder-store.png'}
                                                alt={coupon.store_name}
                                                className="seasonal-coupon-logo"
                                            />
                                            <span>{coupon.store_name}</span>
                                        </div>
                                        <h4 className="seasonal-coupon-title">{coupon.title}</h4>
                                        {coupon.discount_value > 0 && (
                                            <div className="seasonal-coupon-discount">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% OFF`
                                                    : `₹${coupon.discount_value} OFF`}
                                            </div>
                                        )}
                                        <button
                                            className="seasonal-coupon-btn"
                                            onClick={() => handleCouponClick(coupon)}
                                        >
                                            {coupon.code ? 'Get Code' : 'Get Deal'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button className="seasonal-scroll-btn seasonal-scroll-right" onClick={scrollRight}>
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
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

export default SeasonalBanner;
