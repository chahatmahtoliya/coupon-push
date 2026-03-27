'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { couponsApi, trackClick } from '@/services/api';
import type { Coupon } from '@/types';
import { getStorePath } from '@/lib/routes';

export default function CouponPageClient() {
    const params = useParams();
    const id = params?.id as string;
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadCoupon = async () => {
            if (!id) { setError(true); setLoading(false); return; }
            try {
                const data = await couponsApi.getById(parseInt(id));
                setCoupon(data);
                document.title = `${data.title} | ${data.store_name} Coupons`;
                trackClick('coupon', parseInt(id));
            } catch (err) {
                console.error('Failed to load coupon:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        loadCoupon();
    }, [id]);

    const handleCopyCode = async () => {
        if (coupon?.code) {
            try {
                await navigator.clipboard.writeText(coupon.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            } catch (err) { console.error('Failed to copy:', err); }
        }
    };

    const handleVisitStore = () => {
        if (coupon?.store_website_url) {
            window.open(coupon.store_website_url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="coupon-redeem-page">
                <div className="coupon-redeem-overlay">
                    <div className="coupon-redeem-loader">
                        <div className="page-loader-spinner"></div>
                        <span>Loading coupon...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !coupon) {
        return (
            <div className="coupon-redeem-page">
                <div className="coupon-redeem-overlay">
                    <div className="coupon-redeem-card">
                        <div className="coupon-redeem-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <h2>Coupon Not Found</h2>
                            <p>This coupon may have expired or doesn&apos;t exist.</p>
                            <Link href="/" className="btn-go-back">
                                <i className="fas fa-arrow-left"></i> Go to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasCode = coupon.code && coupon.code.trim() !== '';

    return (
        <div className="coupon-redeem-page">
            <div className="coupon-redeem-overlay">
                <div className="coupon-redeem-card">
                    <div className="coupon-redeem-header">
                        <img src={coupon.store_logo || '/placeholder-store.png'} alt={coupon.store_name} className="coupon-redeem-logo" />
                        <div className="coupon-redeem-store-info">
                            <h3>{coupon.store_name}</h3>
                            {coupon.is_verified && (
                                <span className="coupon-redeem-verified"><i className="fas fa-check-circle"></i> Verified</span>
                            )}
                        </div>
                    </div>

                    <div className="coupon-redeem-body">
                        <h2 className="coupon-redeem-title">{coupon.title}</h2>
                        {coupon.description && <p className="coupon-redeem-description">{coupon.description}</p>}

                        {hasCode ? (
                            <div className="coupon-redeem-code-section">
                                <div className="coupon-redeem-code-box">
                                    <span className="coupon-redeem-code">{coupon.code}</span>
                                    <button className={`coupon-redeem-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyCode}>
                                        {copied ? <><i className="fas fa-check"></i> Copied!</> : <><i className="fas fa-copy"></i> Copy Code</>}
                                    </button>
                                </div>
                                {copied && (
                                    <div className="coupon-redeem-success"><i className="fas fa-check-circle"></i> Code copied to clipboard!</div>
                                )}
                            </div>
                        ) : (
                            <div className="coupon-redeem-deal-section">
                                <div className="coupon-redeem-deal-box"><i className="fas fa-check-circle"></i><span>Deal Activated!</span></div>
                            </div>
                        )}

                        <button className="coupon-redeem-continue-btn" onClick={handleVisitStore}>
                            Go To {coupon.store_name} <i className="fas fa-external-link-alt"></i>
                        </button>
                    </div>

                    <div className="coupon-redeem-footer">
                        <Link href={getStorePath(coupon.store_slug)} className="coupon-redeem-go-back">
                            <i className="fas fa-arrow-left"></i> Go Back to {coupon.store_name} Coupons
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
