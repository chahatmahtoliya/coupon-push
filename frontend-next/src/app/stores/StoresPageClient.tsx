'use client';

import Link from '@/components/common/SiteLink';
import { useEffect, useState } from 'react';
import { storesApi } from '@/services/api';
import { getStorePath, isCanonicalStoreSlug } from '@/lib/routes';
import type { Store } from '@/types';
import s from './stores.module.css';
import { festival2026 } from '@/data/amazon-festival-2026';

function Logo({ store }: { store: Store }) {
    const logo = (store.logo || '/placeholder-store.png').replace(/^https?:\/\/(www\.)?couponpush.com\/uploads\//, 'https://media.couponpush.com/uploads/');
    return <img src={logo} alt={`${store.name} logo`} width={96} height={96} loading="lazy" onError={e => {
        const image = e.currentTarget;
        try {
            const url = new URL(image.src);
            if (url.hostname === 'media.couponpush.com' && url.pathname.startsWith('/uploads/stores/')) {
                url.hostname = 'api.couponpush.com';
                image.src = url.toString();
                return;
            }
        } catch {
            // An invalid logo URL should use the placeholder.
        }
        image.onerror = null;
        image.src = '/placeholder-store.png';
    }} />;
}

export default function StoresPageClient({ initialStores }: { initialStores: Store[] }) {
    const [stores, setStores] = useState(initialStores);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All Stores');
    const [sort, setSort] = useState('popular');
    const [saved, setSaved] = useState<number[]>([]);
    const [onlySaved, setOnlySaved] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        try {
            const value = JSON.parse(localStorage.getItem('cp-saved-stores') || '[]');
            if (Array.isArray(value)) setSaved(value.filter(id => typeof id === 'number'));
        } catch { /* Optional local preferences. */ }
        let active = true;
        storesApi.getAllFresh().then(fresh => {
            if (active && fresh.length) setStores([...new Map(fresh.filter(store => isCanonicalStoreSlug(store.slug)).map(store => [store.slug, store])).values()]);
        }).catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, []);

    const categories = [...new Set(stores.map(store => store.category_name).filter((name): name is string => Boolean(name)))].sort();
    const filtered = stores.filter(store => (!onlySaved || saved.includes(store.id)) && (category === 'All Stores' || store.category_name === category) && store.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'az' ? a.name.localeCompare(b.name) : sort === 'za' ? b.name.localeCompare(a.name) : (b.coupon_count || 0) - (a.coupon_count || 0) || a.name.localeCompare(b.name));
    const reset = () => { setQuery(''); setCategory('All Stores'); setOnlySaved(false); };
    const toggleSaved = (id: number) => {
        const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
        setSaved(next);
        try { localStorage.setItem('cp-saved-stores', JSON.stringify(next)); } catch { /* Keep session selection if storage is unavailable. */ }
    };

    const counts = stores.reduce<Record<string, number>>((acc, store) => { if (store.category_name) acc[store.category_name] = (acc[store.category_name] || 0) + 1; return acc; }, {});
    const totalOffers = stores.reduce((sum, store) => sum + (store.coupon_count || 0), 0);
    const filtering = Boolean(query.trim()) || category !== 'All Stores' || onlySaved;

    return <div className={s.page}><div className={s.shell}>
        <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span>Stores</span></nav>
        <header className={s.heading}>
            <div><h1>All stores</h1><p>Coupons and deals from {stores.length} brands, checked and updated regularly.</p></div>
            <dl className={s.stats}><div><dt>Brands</dt><dd>{stores.length}</dd></div><div><dt>Live offers</dt><dd>{totalOffers.toLocaleString('en-IN')}</dd></div><div><dt>Categories</dt><dd>{categories.length}</dd></div></dl>
        </header>
        <Link href={festival2026.path} className={s.promo}><span className={s.promoTag}>Live event</span><strong>{festival2026.name}</strong><span className={s.promoText}>Early deals, SBI card offers and Prime benefits</span><i className="fas fa-arrow-right" aria-hidden="true" /></Link>
        <div className={s.controls}>
            <div className={s.toolbar}>
                <label className={s.search}><span className="visually-hidden">Search stores</span><i className="fas fa-search" aria-hidden="true" /><input type="search" placeholder="Search by store name" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><i className="fas fa-xmark" aria-hidden="true" /></button>}</label>
                <button type="button" className={s.saved} aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}><i className={`${onlySaved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /> Saved <span className={s.pill}>{saved.length}</span></button>
                <label className={s.sort}><span className="visually-hidden">Sort stores</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Most offers</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select><i className="fas fa-chevron-down" aria-hidden="true" /></label>
            </div>
            <div className={s.categories} role="group" aria-label="Filter by category">{['All Stores', ...categories].map(name => <button type="button" key={name} aria-pressed={category === name} className={category === name ? s.active : ''} onClick={() => setCategory(name)}>{name}<span>{name === 'All Stores' ? stores.length : counts[name]}</span></button>)}</div>
        </div>
        {failed && <p className={s.status}><i className="fas fa-circle-info" aria-hidden="true" /> Showing saved store list. Live updates will return shortly.</p>}
        <section aria-label="Store results">
            <div className={s.resultsHead}><p aria-live="polite"><strong>{filtered.length}</strong> {filtered.length === 1 ? 'store' : 'stores'}{category !== 'All Stores' ? ` in ${category}` : ''}</p>{filtering && <button type="button" onClick={reset}>Clear filters</button>}</div>
            {filtered.length ? <ul className={s.grid}>{filtered.map(store => {
                const storeName = store.name.replace(/\s+coupon\s+codes?$/i, '');
                const count = store.coupon_count || 0;
                const isSaved = saved.includes(store.id);
                return <li className={s.card} key={store.id}>
                    <span className={s.logo}><Logo store={store} /></span>
                    <div className={s.cardBody}>
                        <h2><Link href={getStorePath(store.slug)} className={s.cardLink}>{storeName}</Link></h2>
                        <div className={s.meta}><span className={count ? s.offers : `${s.offers} ${s.offersNone}`}>{count ? <><strong>{count.toLocaleString('en-IN')}</strong> {count === 1 ? 'offer' : 'offers'}</> : 'View store'}</span><span className={s.category}>{store.category_name || 'Store'}</span></div>
                    </div>
                    <button type="button" className={s.heart} aria-label={`${isSaved ? 'Remove' : 'Save'} ${storeName}`} title={isSaved ? 'Remove from saved' : 'Save store'} aria-pressed={isSaved} onClick={() => toggleSaved(store.id)}><i className={`${isSaved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button>
                </li>;
            })}</ul> : <div className={s.empty}><i className="fas fa-magnifying-glass" aria-hidden="true" /><h2>{onlySaved && !saved.length ? 'No saved stores yet' : 'No stores match'}</h2><p>{onlySaved && !saved.length ? 'Tap the heart on any store to keep it here.' : query ? `Nothing found for “${query.trim()}”. Check the spelling or browse all stores.` : 'Try another category or clear the filters.'}</p><button type="button" onClick={reset}>Browse all stores</button></div>}
        </section>
    </div></div>;
}
