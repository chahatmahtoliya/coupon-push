'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Store, Coupon } from '@/types';
import { storesApi } from '@/services/api';
import { CouponCard } from '@/components/features';
import { getStorePath } from '@/lib/routes';

const HTML_TAG_PATTERN = /\<\/?[a-z][\s\S]*\>/i;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatStoreContent(content?: string | null): string {
    const value = content?.trim();

    if (!value) {
        return '';
    }

    if (HTML_TAG_PATTERN.test(value)) {
        return value;
    }

    const blocks = value
        .replace(/\r\n?/g, '\n')
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    return blocks
        .map((block) => {
            const lines = block
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);

            if (lines.length === 0) {
                return '';
            }

            if (lines.length === 1) {
                const line = escapeHtml(lines[0]);
                const headingMatch = lines[0].match(/^(h[1-6]|p)\s*:\s*(.+)$/i);

                if (headingMatch) {
                    const tag = headingMatch[1].toLowerCase();
                    const text = escapeHtml(headingMatch[2].trim());
                    return `<${tag}>${text}</${tag}>`;
                }

                if (/^[A-Z][A-Z\s&/()-]{2,}$/.test(lines[0])) {
                    return `<h2>${line}</h2>`;
                }

                return `<p>${line}</p>`;
            }

            const firstLine = lines[0];
            const remainingLines = lines.slice(1);

            if (
                remainingLines.length > 0 &&
                firstLine.length <= 90 &&
                !/[.!?:]$/.test(firstLine)
            ) {
                return `<h2>${escapeHtml(firstLine)}</h2><p>${escapeHtml(remainingLines.join(' '))}</p>`;
            }

            return `<p>${escapeHtml(lines.join(' '))}</p>`;
        })
        .filter(Boolean)
        .join('');
}

interface StorePageData {
    store: Store;
    coupons: Coupon[];
    related_stores: Store[];
}

export default function StorePageClient() {
    const params = useParams();
    const slug = params?.slug as string;
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

    const displayName = data?.store?.name || (slug
        ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Store');

    const store = data?.store;
    const couponsData = data?.coupons || [];
    const related_stores = data?.related_stores || [];
    const suffix = store?.h1_suffix || null;

    const aboutContent = formatStoreContent(store?.about_content);
    const howToContent = formatStoreContent(store?.howto_content);
    const termsContent = formatStoreContent(store?.terms_content);

    const filteredCoupons = couponsData.filter((coupon) => {
        if (filter === 'codes') return !!coupon.code;
        if (filter === 'deals') return !coupon.code;
        return true;
    });

    const couponCodes = couponsData.filter((c) => !!c.code).length;
    const dealOffers = couponsData.filter((c) => !c.code).length;

    useEffect(() => {
        const titleSuffix = suffix ? suffix : 'Coupon Codes & Promo Codes';
        document.title = `${displayName} ${titleSuffix} | CouponPush`;
    }, [displayName, suffix]);

    return (
        <>
            <div className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb-content">
                        <div className="breadcrumb-nav">
                            <Link href="/">Home</Link>
                            <i className="fas fa-chevron-right"></i>
                            <Link href="/stores">Stores</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span>{displayName} Coupons</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="store-hero-v3">
                <div className="container">
                    <div className="store-hero-v3-inner">
                        <div className="store-hero-v3-logo">
                            {store ? (
                                <img src={store.logo || '/placeholder-store.png'} alt={store.name} />
                            ) : (
                                <div className="skeleton skeleton-logo" style={{ width: 80, height: 80, borderRadius: 12, background: '#e0e0e0' }}></div>
                            )}
                        </div>
                        <div className="store-hero-v3-content">
                            <div className="store-hero-v3-main">
                                <div className="store-hero-v3-info">
                                    <h1 className="store-hero-v3-title">
                                        {displayName}
                                        {suffix && <span className="store-hero-v3-mobile-subtitle"> {suffix}</span>}
                                    </h1>
                                    <p className="store-hero-v3-description">{store?.description || ''}</p>
                                </div>
                                {store?.website_url && (
                                    <div className="store-hero-v3-actions">
                                        <a href={store.website_url} target="_blank" rel="noopener noreferrer" className="btn-visit-website-v3">
                                            Visit Website <i className="fas fa-external-link-alt"></i>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="store-main-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3">
                            <div className="filter-card d-none d-lg-block">
                                <div className="filter-header">
                                    <h4>Filter & Sort</h4>
                                    <button className="filter-reset" onClick={() => setFilter('all')}>Reset</button>
                                </div>
                                <div className="filter-group">
                                    <h5>DISCOUNT TYPE</h5>
                                    <label className="filter-checkbox">
                                        <input type="checkbox" checked={filter === 'all' || filter === 'codes'} onChange={() => setFilter(filter === 'codes' ? 'all' : 'codes')} />
                                        <span className="filter-checkbox-mark"></span>
                                        Coupon Codes ({couponCodes})
                                    </label>
                                    <label className="filter-checkbox">
                                        <input type="checkbox" checked={filter === 'all' || filter === 'deals'} onChange={() => setFilter(filter === 'deals' ? 'all' : 'deals')} />
                                        <span className="filter-checkbox-mark"></span>
                                        Deals & Offers ({dealOffers})
                                    </label>
                                </div>
                            </div>

                            {related_stores.length > 0 && (
                                <div className="filter-card mt-4">
                                    <h4 className="filter-title-simple">Similar Stores</h4>
                                    <div className="similar-stores-list">
                                        {related_stores.map((relatedStore) => (
                                            <Link key={relatedStore.id} href={getStorePath(relatedStore.slug)} className="similar-store-item">
                                                <img src={relatedStore.logo || '/placeholder-store.png'} alt={relatedStore.name} />
                                                <div className="similar-store-info">
                                                    <span className="similar-store-name">{relatedStore.name}</span>
                                                    <span className="similar-store-count">{relatedStore.coupon_count} Coupons</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-lg-9">
                            <div className="coupons-header">
                                <h2>All Active Coupons{' '}{!loading && <span className="coupons-count">({filteredCoupons.length} Offers)</span>}</h2>
                            </div>

                            {loading && (
                                <div className="coupon-list">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="coupon-card-skeleton" style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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

                            {!loading && (error || !data) && (
                                <div className="empty-state">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <h3>Store Not Found</h3>
                                    <p className="empty-state-text">The store you&apos;re looking for doesn&apos;t exist or is currently unavailable.</p>
                                    <Link href="/stores" className="btn btn-primary">Browse All Stores</Link>
                                </div>
                            )}

                            {!loading && data && (
                                <>
                                    {filteredCoupons.length === 0 ? (
                                        <div className="empty-state">
                                            <i className="fas fa-ticket-alt"></i>
                                            <h3>No Coupons Found</h3>
                                            <p className="empty-state-text">There are no active coupons matching your filter.</p>
                                            <button className="btn btn-primary" onClick={() => setFilter('all')}>Show All Coupons</button>
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

                            {(aboutContent || howToContent || termsContent) && (
                                <div className="store-info-section">
                                    {aboutContent && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header"><i className="fas fa-info-circle"></i><h3>About {displayName}</h3></div>
                                            <div className="store-info-body"><div dangerouslySetInnerHTML={{ __html: aboutContent }} /></div>
                                        </div>
                                    )}
                                    {howToContent && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header"><i className="fas fa-tag"></i><h3>How to Use {displayName} Coupons & Promo Codes</h3></div>
                                            <div className="store-info-body"><div dangerouslySetInnerHTML={{ __html: howToContent }} /></div>
                                        </div>
                                    )}
                                    {termsContent && (
                                        <div className="store-info-panel">
                                            <div className="store-info-header"><i className="fas fa-file-contract"></i><h3>{displayName} Coupon Terms & Conditions</h3></div>
                                            <div className="store-info-body"><div dangerouslySetInnerHTML={{ __html: termsContent }} /></div>
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
