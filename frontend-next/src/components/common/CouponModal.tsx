'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Coupon } from '@/types';
import { trackClick } from '@/services/api';
import { getStorePath } from '@/lib/routes';

interface CouponModalProps {
    coupon: Coupon | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CouponModal({ coupon, isOpen, onClose }: CouponModalProps) {
    const [copied, setCopied] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && coupon) {
            trackClick('coupon', coupon.id);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, coupon]);

    useEffect(() => {
        setCopied(false);
        setShowTerms(false);
    }, [coupon]);

    const handleCopyCode = async () => {
        if (coupon?.code) {
            try {
                await navigator.clipboard.writeText(coupon.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const handleVisitStore = () => {
        if (!coupon) return;
        const targetUrl = coupon.affiliate_link || coupon.store_website_url || getStorePath(coupon.store_slug);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    if (!isOpen || !coupon || !mounted) return null;

    const hasCode = coupon.code && coupon.code.trim() !== '';

    return createPortal(
        <div className="modal-overlay-new" onClick={onClose}>
            <div className="modal-card-new" onClick={(e) => e.stopPropagation()}>
                {/* Header with Store Info */}
                <div className="modal-header-new">
                    <div className="modal-store-info">
                        <img
                            src={coupon.store_logo || '/placeholder-store.png'}
                            alt={coupon.store_name}
                            className="modal-store-logo"
                        />
                        <div className="modal-store-details">
                            <h4 className="modal-store-name">{coupon.store_name}</h4>
                            {coupon.is_verified && (
                                <span className="modal-verified-badge">
                                    <i className="fas fa-check-circle"></i>
                                    Verified Offer
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body Content */}
                <div className="modal-body-new">
                    <span className="modal-exclusive-badge">{coupon.code ? 'COUPON CODE' : 'LISTED OFFER'}</span>
                    <h2 className="modal-title-new">{coupon.title}</h2>
                    <p className="modal-description-new">
                        {coupon.description || 'Use this code at checkout to save on your purchase. Valid on all categories.'}
                    </p>

                    {hasCode ? (
                        <div className="modal-code-container">
                            <div className="modal-code-box">
                                <span className="modal-code-text">{coupon.code}</span>
                                <button
                                    className={`modal-copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={handleCopyCode}
                                >
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-code-container">
                            <div className="modal-code-box modal-deal-activated">
                                <span className="modal-code-text">DEAL ACTIVATED</span>
                                <span className="modal-deal-check"><i className="fas fa-check"></i> Activated</span>
                            </div>
                        </div>
                    )}

                    <button className="modal-continue-btn" onClick={handleVisitStore}>
                        Go To {coupon.store_name} <i className="fas fa-arrow-right"></i>
                    </button>
                </div>

                {/* Footer */}
                <div className="modal-footer-new">
                    <div className="modal-feedback-row">
                        <span className="modal-feedback-text">Did this code work?</span>
                        <div className="modal-feedback-icons">
                            <button className="modal-feedback-icon yes" title="Yes">
                                <i className="fas fa-thumbs-up"></i>
                            </button>
                            <button className="modal-feedback-icon no" title="No">
                                <i className="fas fa-thumbs-down"></i>
                            </button>
                        </div>
                    </div>

                    <div className="modal-terms-section">
                        <button
                            className="modal-terms-toggle"
                            onClick={() => setShowTerms(!showTerms)}
                        >
                            <span>Terms & Conditions</span>
                            <i className={`fas fa-chevron-${showTerms ? 'up' : 'down'}`}></i>
                        </button>
                        {showTerms && (
                            <div className="modal-terms-content">
                                <ul>
                                    <li>Valid on selected items only</li>
                                    <li>Cannot be combined with other offers</li>
                                    <li>Subject to store terms and conditions</li>
                                    {coupon.expiry_date && (
                                        <li>Expires: {new Date(coupon.expiry_date).toLocaleDateString()}</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default CouponModal;
