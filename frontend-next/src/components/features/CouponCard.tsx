'use client';

import { CouponDescription } from '@/components/common/CouponDescription';

import { useEffect, useState } from 'react';
import Link from '@/components/common/SiteLink';
import type { Coupon } from '@/types';
import { CouponModal } from '@/components/common/CouponModal';
import { getStorePath } from '@/lib/routes';
import { isCheckoutTested } from '@/lib/offer-evidence';

interface CouponCardProps {
    coupon: Coupon;
    variant?: 'default' | 'category';
}

export function CouponCard({ coupon, variant = 'default' }: CouponCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [clickCount, setClickCount] = useState(coupon.click_count);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (variant !== 'category') return;
        try {
            const saved = JSON.parse(localStorage.getItem('cp-saved-coupons') || '[]');
            setIsFavorite(Array.isArray(saved) && saved.includes(coupon.id));
        } catch { /* Saving offers is optional. */ }
    }, [coupon.id, variant]);

    const toggleFavorite = () => {
        const next = !isFavorite;
        setIsFavorite(next);
        try {
            const saved = JSON.parse(localStorage.getItem('cp-saved-coupons') || '[]');
            const ids = Array.isArray(saved) ? saved.filter((id) => typeof id === 'number' && id !== coupon.id) : [];
            localStorage.setItem('cp-saved-coupons', JSON.stringify(next ? [...ids, coupon.id] : ids));
        } catch { /* Keep the selection for this session. */ }
    };

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
        if (isCheckoutTested(coupon)) {
            return { text: 'Checkout tested', class: 'badge-verified' };
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
                <article className="coupon-card-v2">
                    <div className="coupon-card-v2-visual">
                        {badge && <span className={`coupon-card-v2-badge ${badge.class}`}>{isCheckoutTested(coupon) ? 'Checkout tested' : 'Featured'}</span>}
                        <button type="button" className={`coupon-card-v2-favorite${isFavorite ? ' active' : ''}`} aria-label={`${isFavorite ? 'Remove' : 'Save'} ${coupon.title}`} aria-pressed={isFavorite} onClick={toggleFavorite}><i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button>
                        {coupon.image ? <img className="coupon-card-v2-image" src={coupon.image} alt="" loading="lazy" decoding="async" /> : <div className="coupon-card-v2-art">{coupon.store_logo ? <img src={coupon.store_logo} alt="" loading="lazy" decoding="async" /> : <span>{coupon.store_name}</span>}<strong>{discount?.text || 'Current deal'}</strong></div>}
                    </div>
                    <div className="coupon-card-v2-content">
                        <div className="coupon-card-v2-offer-label"><strong>{discount?.text || 'Offer'}</strong><span>{hasCode ? 'Promo code' : 'Online deal'}</span></div>
                        {(coupon.original_price || coupon.sale_price) && <div className="coupon-price-display">{coupon.sale_price && <strong className="coupon-sale-price">₹{coupon.sale_price.toLocaleString('en-IN')}</strong>}{coupon.original_price && <span className="coupon-original-price">₹{coupon.original_price.toLocaleString('en-IN')}</span>}</div>}
                        <h3 className="coupon-card-v2-title">{coupon.title}</h3>
                        <Link href={getStorePath(coupon.store_slug)} className="coupon-card-v2-store">{coupon.store_name}</Link>
                        {coupon.description && <CouponDescription className="coupon-card-v2-description">{coupon.description}</CouponDescription>}
                        <div className="coupon-card-v2-footer"><span className="coupon-card-v2-expiry"><i className="far fa-clock" aria-hidden="true" /> {getExpiryText()}</span><button type="button" className="coupon-card-v2-action" onClick={handleClick}>{hasCode ? 'Get code' : 'View deal'} <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
                    </div>
                </article>

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
                            <CouponDescription className="coupon-description">{coupon.description}</CouponDescription>
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
