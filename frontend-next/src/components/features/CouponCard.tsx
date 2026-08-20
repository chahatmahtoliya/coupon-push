'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Coupon } from '@/types';
import { CouponModal } from '@/components/common/CouponModal';
import { getStorePath } from '@/lib/routes';

interface CouponCardProps {
    coupon: Coupon;
    variant?: 'default' | 'category';
}

export function CouponCard({ coupon, variant = 'default' }: CouponCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [clickCount, setClickCount] = useState(coupon.click_count);

    const formatDiscount = (): { text: string; color: string } | null => {
        if (!coupon.discount_value || coupon.discount_value === 0) {
            return null;
        }

        if (coupon.discount_type === 'percentage') {
            return {
                text: `${coupon.discount_value}% OFF`,
                color: 'var(--primary)'
            };
        } else if (coupon.discount_type === 'fixed') {
            return {
                text: `₹${coupon.discount_value} OFF`,
                color: '#22C55E'
            };
        }
        return {
            text: 'FREE SHIP',
            color: 'var(--gray-800)'
        };
    };

    const getBadge = (): { text: string; class: string } | null => {
        if (coupon.is_verified) {
            return { text: '✓ VERIFIED', class: 'badge-verified' };
        }
        if (coupon.is_featured) {
            return { text: '🔥 HOT', class: 'badge-hot' };
        }
        return null;
    };

    const getExpiryText = (): string => {
        if (!coupon.expiry_date) return 'Ongoing';

        const expiry = new Date(coupon.expiry_date);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Expires today';
        if (diffDays === 1) return 'Expires tomorrow';
        if (diffDays <= 7) return `Ends in ${diffDays} days`;
        if (diffDays <= 14) return `Valid until ${expiry.toLocaleDateString('en-US', { weekday: 'long' })}`;

        return expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatUsageCount = (count: number): string => {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k used`;
        }
        return `${count} used`;
    };

    const handleClick = () => {
        setClickCount(prev => prev + 1);
        setShowModal(true);
    };

    const badge = getBadge();
    const hasCode = coupon.code && coupon.code.trim() !== '';
    const discount = formatDiscount();

    // Category page variant
    if (variant === 'category') {
        return (
            <>
                <div className="coupon-card-v2">
                    <Link href={getStorePath(coupon.store_slug)} className="coupon-card-v2-store-badge">
                        {coupon.store_logo ? (
                            <img src={coupon.store_logo} alt={coupon.store_name} loading="lazy" decoding="async" width="56" height="56" />
                        ) : (
                            <span>{coupon.store_name?.charAt(0) || 'S'}</span>
                        )}
                    </Link>

                    {badge && (
                        <div className={`coupon-card-v2-badge ${badge.class}`}>
                            {badge.text}
                        </div>
                    )}

                    <div className="coupon-card-v2-content">
                        <h3 className="coupon-card-v2-title">{coupon.title}</h3>
                        <div className="coupon-card-v2-offer-area">
                            {(coupon.original_price || coupon.sale_price) && (
                                <div className="coupon-price-display">
                                    {coupon.original_price && <span className="coupon-original-price">₹{coupon.original_price.toLocaleString('en-IN')}</span>}
                                    {coupon.sale_price && <span className="coupon-sale-price">₹{coupon.sale_price.toLocaleString('en-IN')}</span>}
                                    {coupon.original_price && coupon.sale_price && <span className="coupon-savings-badge">Save ₹{(coupon.original_price - coupon.sale_price).toLocaleString('en-IN')}</span>}
                                </div>
                            )}
                            {coupon.description && <p className="coupon-card-v2-description">{coupon.description.length > 80 ? coupon.description.substring(0, 80) + '...' : coupon.description}</p>}
                        </div>

                        <div className="coupon-card-v2-footer">
                            <div className="coupon-card-v2-meta">
                                {coupon.expiry_date && <span className="coupon-card-v2-expiry"><i className="fas fa-clock" aria-hidden="true"></i>{getExpiryText()}</span>}
                                <span className="coupon-card-v2-uses">
                                    {formatUsageCount(clickCount)}
                                </span>
                            </div>

                            {hasCode ? (
                                <button className="ticket-cta ticket-cta-code" onClick={handleClick}>
                                    <i className="fas fa-scissors" aria-hidden="true"></i> GET COUPON
                                </button>
                            ) : (
                                <button className="ticket-cta ticket-cta-deal" onClick={handleClick}>
                                    <i className="fas fa-external-link-alt" aria-hidden="true"></i> GET DEAL
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <CouponModal
                    coupon={coupon}
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                />
            </>
        );
    }

    // Default variant
    return (
        <>
            <div className="coupon-card">
                {badge && (
                    <div className={`coupon-badge ${badge.class}`}>
                        {badge.text}
                    </div>
                )}

                <div className="coupon-visual">
                    {coupon.image ? (
                        <img src={coupon.image} alt={coupon.title} className="coupon-product-image" loading="lazy" decoding="async" />
                    ) : discount ? (
                        <div className="coupon-discount-visual" style={{ color: discount.color }}>
                            {discount.text}
                        </div>
                    ) : (
                        <div className="coupon-discount-visual" style={{ color: 'var(--primary)' }}>
                            DEAL
                        </div>
                    )}
                </div>

                <div className="coupon-card-content">
                    <div className="coupon-card-body">
                        <h3 className="coupon-title">{coupon.title}</h3>
                        {(coupon.original_price || coupon.sale_price) && (
                            <div className="coupon-price-display">
                                {coupon.original_price && (
                                    <span className="coupon-original-price">₹{coupon.original_price.toLocaleString('en-IN')}</span>
                                )}
                                {coupon.sale_price && (
                                    <span className="coupon-sale-price">₹{coupon.sale_price.toLocaleString('en-IN')}</span>
                                )}
                                {coupon.original_price && coupon.sale_price && (
                                    <span className="coupon-savings-badge">
                                        Save ₹{(coupon.original_price - coupon.sale_price).toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        )}
                        {coupon.description && (
                            <p className="coupon-description">{coupon.description}</p>
                        )}
                        <div className="coupon-meta">
                            {coupon.expiry_date && (
                                <span className="coupon-expiry">
                                    <i className="fas fa-clock" aria-hidden="true"></i> Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                                </span>
                            )}
                            <span className="coupon-uses">
                                <i className="fas fa-users" aria-hidden="true"></i> {clickCount.toLocaleString()} uses
                            </span>
                        </div>
                    </div>
                </div>

                <div className="coupon-card-footer">
                    {hasCode ? (
                        <button className="btn-get-code" onClick={handleClick}>
                            <i className="fas fa-scissors" aria-hidden="true"></i> GET COUPON
                        </button>
                    ) : (
                        <button className="btn-get-deal" onClick={handleClick}>
                            <i className="fas fa-external-link-alt" aria-hidden="true"></i> GET DEAL
                        </button>
                    )}
                </div>
            </div>

            <CouponModal
                coupon={coupon}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}

export default CouponCard;
