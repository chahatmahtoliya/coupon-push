'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/common/SiteLink';
import { trackClick } from '@/services/api';
import type { Deal } from '@/types';
import { getStorePath } from '@/lib/routes';

function DealImage({ deal }: { deal: Deal }) {
    const [failed, setFailed] = useState(false);
    if (!deal.image || deal.image.includes('/placeholder-deal.png') || failed) {
        return <div className="coupon-card-v2-art"><i className="fas fa-tag" aria-hidden="true" /><strong>Online deal</strong></div>;
    }
    return <img className="coupon-card-v2-image" src={deal.image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

export default function DealsPageClient({ initialDeals }: { initialDeals: Deal[] }) {
    const [store, setStore] = useState('all');
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [sort, setSort] = useState('default');
    const [saved, setSaved] = useState<Set<number>>(() => new Set());

    useEffect(() => {
        try {
            const ids = JSON.parse(localStorage.getItem('cp-saved-deals') || '[]');
            if (Array.isArray(ids)) setSaved(new Set(ids.filter((id) => typeof id === 'number')));
        } catch { /* Saving deals is optional. */ }
    }, []);

    const deals = useMemo(() => initialDeals.filter((deal) => deal.title?.trim() && !/^\d+$/.test(deal.title.trim())), [initialDeals]);
    const stores = useMemo(() => [...new Map(deals.map((deal) => [deal.store_slug, deal.store_name])).entries()], [deals]);
    const visible = useMemo(() => {
        const matches = deals.filter((deal) => (store === 'all' || deal.store_slug === store) && (!featuredOnly || deal.is_featured));
        if (sort === 'store') return matches.sort((a, b) => a.store_name.localeCompare(b.store_name));
        if (sort === 'title') return matches.sort((a, b) => a.title.localeCompare(b.title));
        return matches;
    }, [deals, store, featuredOnly, sort]);

    const toggleSaved = (id: number) => {
        const next = new Set(saved);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSaved(next);
        try { localStorage.setItem('cp-saved-deals', JSON.stringify([...next])); } catch { /* Keep this session's selection. */ }
    };

    return <div className="cp-category-page cp-deals-page"><div className="cp-category-shell">
        <nav className="cp-category-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span>Deals</span></nav>
        <header className="cp-category-heading"><h1>Deals</h1><p>Browse current product and store deals in one place.</p></header>
        <div className="cp-category-toolbar">
            <details className="cp-category-filter-menu"><summary><i className="fas fa-sliders" aria-hidden="true" /> Filters {(store !== 'all' || featuredOnly) && <span className="cp-category-filter-count">{Number(store !== 'all') + Number(featuredOnly)}</span>}<i className="fas fa-chevron-down" aria-hidden="true" /></summary>
                <div className="cp-category-filter-panel cp-deals-filter-panel"><fieldset><legend>Stores</legend>{stores.map(([slug, name]) => <label key={slug}><input type="radio" name="deal-store" checked={store === slug} onChange={() => setStore(slug)} />{name}</label>)}<label><input type="radio" name="deal-store" checked={store === 'all'} onChange={() => setStore('all')} />All stores</label></fieldset><label><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} />Featured deals only</label></div>
            </details>
            <div className="cp-category-chips" aria-label="Quick filters"><button type="button" className={store === 'all' && !featuredOnly ? 'active' : ''} aria-pressed={store === 'all' && !featuredOnly} onClick={() => { setStore('all'); setFeaturedOnly(false); }}>All deals</button><button type="button" className={featuredOnly ? 'active' : ''} aria-pressed={featuredOnly} onClick={() => setFeaturedOnly(!featuredOnly)}>Featured</button>{stores.map(([slug, name]) => <button type="button" key={slug} className={store === slug ? 'active' : ''} aria-pressed={store === slug} onClick={() => setStore(store === slug ? 'all' : slug)}>{name}</button>)}</div>
            <label className="cp-category-sort"><span className="visually-hidden">Sort deals</span><i className="fas fa-arrow-down-wide-short" aria-hidden="true" /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="default">Sort by: Relevance</option><option value="store">Store A–Z</option><option value="title">Title A–Z</option></select><i className="fas fa-chevron-down" aria-hidden="true" /></label>
        </div>
        <section className="cp-category-results" aria-label="Current deals"><p className="cp-category-count">{visible.length} {visible.length === 1 ? 'deal' : 'deals'} available</p>
            {visible.length ? <div className="coupon-grid-v2">{visible.map((deal) => <article className="coupon-card-v2 cp-deal-card" key={deal.id}>
                <div className="coupon-card-v2-visual">{deal.is_featured && <span className="coupon-card-v2-badge">Featured</span>}<button type="button" className={`coupon-card-v2-favorite${saved.has(deal.id) ? ' active' : ''}`} aria-label={`${saved.has(deal.id) ? 'Remove' : 'Save'} ${deal.title}`} aria-pressed={saved.has(deal.id)} onClick={() => toggleSaved(deal.id)}><i className={`${saved.has(deal.id) ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button><DealImage deal={deal} /></div>
                <div className="coupon-card-v2-content"><div className="coupon-card-v2-offer-label"><strong>Online deal</strong></div><h2 className="coupon-card-v2-title">{deal.title}</h2><Link href={getStorePath(deal.store_slug)} className="coupon-card-v2-store">{deal.store_name}</Link>{deal.description && <p className="coupon-card-v2-description">{deal.description}</p>}<div className="coupon-card-v2-footer"><a className="coupon-card-v2-action" href={deal.url || getStorePath(deal.store_slug)} target={deal.url ? '_blank' : undefined} rel={deal.url ? 'noopener noreferrer' : undefined} onClick={deal.url ? () => void trackClick('deal', deal.id) : undefined}>{deal.url ? 'View deal' : 'View store offers'} <i className="fas fa-arrow-right" aria-hidden="true" /></a></div></div>
            </article>)}</div> : <div className="cp-category-empty"><i className="fas fa-tags" aria-hidden="true" /><h2>No deals match these filters</h2><p>Choose another store or show all deals.</p><button type="button" onClick={() => { setStore('all'); setFeaturedOnly(false); }}>Show all deals</button></div>}
        </section>
    </div></div>;
}
