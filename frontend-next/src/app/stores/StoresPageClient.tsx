'use client';

import Link from '@/components/common/SiteLink';
import { useEffect, useState } from 'react';
import { storesApi } from '@/services/api';
import { getStorePath, isCanonicalStoreSlug } from '@/lib/routes';
import type { Store } from '@/types';
import s from './stores.module.css';

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

    return <div className={s.page}><div className={s.shell}>
        <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span>Stores</span></nav>
        <header className={s.heading}><h1>Stores</h1><p>Explore {stores.length} brands and find current coupons and deals.</p></header>
        <div className={s.toolbar}>
            <label className={s.search}><i className="fas fa-search" aria-hidden="true" /><input aria-label="Search stores" placeholder="Search stores" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><i className="fas fa-xmark" aria-hidden="true" /></button>}</label>
            <button type="button" className={s.saved} aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}><i className={`${onlySaved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /> Saved ({saved.length})</button>
            <label className={s.sort}><span className="visually-hidden">Sort stores</span><i className="fas fa-arrow-down-wide-short" aria-hidden="true" /><select value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Sort by: Most offers</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select><i className="fas fa-chevron-down" aria-hidden="true" /></label>
        </div>
        <div className={s.categories} role="group" aria-label="Store category">{['All Stores', ...categories].map(name => <button type="button" key={name} aria-pressed={category === name} className={category === name ? s.active : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
        {failed && <p className={s.status}>Showing the saved catalog. Live updates are temporarily unavailable.</p>}
        <section className={s.results} aria-label="Store results"><p className={s.count} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'store' : 'stores'} available</p>
            {filtered.length ? <div className={s.grid}>{filtered.map(store => {
                const storeName = store.name.replace(/\s+coupon\s+codes?$/i, '');
                return <article className={s.card} key={store.id}>
                    <button type="button" className={s.heart} aria-label={`${saved.includes(store.id) ? 'Unsave' : 'Save'} ${storeName}`} aria-pressed={saved.includes(store.id)} onClick={() => toggleSaved(store.id)}><i className={`${saved.includes(store.id) ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button>
                    <Link href={getStorePath(store.slug)} className={s.logo}><Logo store={store} /></Link>
                    <div className={s.cardBody}><p className={s.category}>{store.category_name || 'Store'}</p><h2>{storeName}</h2><p className={s.offers}>{store.coupon_count || 0} {(store.coupon_count || 0) === 1 ? 'offer' : 'offers'} available</p><Link href={getStorePath(store.slug)} className={s.cardLink}>{store.coupon_count ? 'View offers' : 'Explore store'} <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
                </article>;
            })}</div> : <div className={s.empty}><i className="fas fa-store-slash" aria-hidden="true" /><h2>No stores match</h2><p>Try another name or clear the filters.</p><button type="button" onClick={reset}>Show all stores</button></div>}
        </section>
    </div></div>;
}
