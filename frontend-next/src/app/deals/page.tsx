'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Deal } from '@/types';
import { dealsApi, trackClick } from '@/services/api';
import { getStorePath } from '@/lib/routes';

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Top Deals - CouponPush | Best Offers Right Now';
        dealsApi.getAll()
            .then(setDeals)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDealClick = (dealId: number) => {
        void trackClick('deal', dealId);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading deals...</p>
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
                        <span>Top Deals</span>
                    </div>

                    <div className="all-stores-hero-react-body">
                        <div>
                            <h1 className="all-stores-title-react">Today&apos;s standout deals in one place</h1>
                            <p className="all-stores-subtitle-react">
                                Browse the latest featured offers across stores and jump straight to the best available price.
                            </p>
                        </div>

                        <div className="all-stores-stats-react">
                            <span className="all-stores-stat-pill-react">{deals.length}+ Deals</span>
                            <span className="all-stores-stat-pill-react">Updated from live store offers</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="top-deals-section">
                <div className="container">
                    {deals.length > 0 ? (
                        <div className="product-deals-grid">
                            {deals.map((deal) => (
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
                                        <Link href={getStorePath(deal.store_slug)} className="product-deal-brand">
                                            {deal.store_name}
                                        </Link>
                                        <h2 className="product-deal-title">{deal.title}</h2>
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
                                                onClick={() => handleDealClick(deal.id)}
                                            >
                                                GET DEAL <i className="fas fa-arrow-right"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-tags"></i>
                            <h3>No Deals Found</h3>
                            <p>Featured product deals will appear here once they are available.</p>
                            <Link href="/" className="btn btn-primary">Go to Homepage</Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
