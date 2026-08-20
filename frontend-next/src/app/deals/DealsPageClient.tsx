'use client';

import Link from 'next/link';
import { trackClick } from '@/services/api';
import type { Deal } from '@/types';
import { getStorePath } from '@/lib/routes';

export default function DealsPageClient({ initialDeals }: { initialDeals: Deal[] }) {
    return <>
        <section className="all-stores-hero-react"><div className="container"><div className="breadcrumb-nav breadcrumb-nav-light"><Link href="/">Home</Link><i className="fas fa-chevron-right" /><span>Top Deals</span></div><div className="all-stores-hero-react-body"><div><h1 className="all-stores-title-react">Today&apos;s standout deals in one place</h1><p className="all-stores-subtitle-react">Browse the latest featured offers across stores and jump straight to the best available price.</p></div><div className="all-stores-stats-react"><span className="all-stores-stat-pill-react">{initialDeals.length}+ Deals</span><span className="all-stores-stat-pill-react">Updated from live store offers</span></div></div></div></section>
        <section className="top-deals-section"><div className="container">{initialDeals.length ? <div className="product-deals-grid">{initialDeals.map((deal) => <div className="product-deal-card" key={deal.id}><div className="product-deal-image"><img src={deal.image || '/placeholder-deal.png'} alt={deal.title} onError={(event) => { event.currentTarget.src = '/placeholder-deal.png'; }} /></div><div className="product-deal-content"><Link href={getStorePath(deal.store_slug)} className="product-deal-brand">{deal.store_name}</Link><h2 className="product-deal-title">{deal.title}</h2>{deal.description && <p className="product-deal-price-info">{deal.description}</p>}<div className="product-deal-badge"><i className="fas fa-tag" /> Product at its best price</div><div className="product-deal-footer"><a href={deal.url} target="_blank" rel="noopener noreferrer" className="product-deal-btn" onClick={() => void trackClick('deal', deal.id)}>GET DEAL <i className="fas fa-arrow-right" /></a></div></div></div>)}</div> : <div className="empty-state"><i className="fas fa-tags" /><h3>No Deals Found</h3><p>Featured product deals will appear here once they are available.</p><Link href="/" className="btn btn-primary">Go to Homepage</Link></div>}</div></section>
    </>;
}
