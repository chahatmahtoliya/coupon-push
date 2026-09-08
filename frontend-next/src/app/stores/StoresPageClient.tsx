'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { storesApi } from '@/services/api';
import { getStorePath, isCanonicalStoreSlug } from '@/lib/routes';
import type { Store } from '@/types';
import s from './stores.module.css';

function Logo({ store }: { store: Store }) {
    const logo = (store.logo || '/placeholder-store.png').replace(/^https?:\/\/(www\.)?couponpush.com\/uploads\//, 'https://media.couponpush.com/uploads/');
    return <img src={logo} alt={`${store.name} logo`} width={52} height={52} loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-store.png'; }} />;
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
        try { const value = JSON.parse(localStorage.getItem('cp-saved-stores') || '[]'); if (Array.isArray(value)) setSaved(value.filter(id => typeof id === 'number')); } catch { /* Optional local preferences. */ }
        let active = true;
        storesApi.getAllFresh().then(fresh => { if (active && fresh.length) setStores([...new Map(fresh.filter(store => isCanonicalStoreSlug(store.slug)).map(store => [store.slug, store])).values()]); }).catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, []);
    const categories = [...new Set(stores.map(store => store.category_name).filter((name): name is string => Boolean(name)))].sort();
    const filtered = stores.filter(store => (!onlySaved || saved.includes(store.id)) && (category === 'All Stores' || store.category_name === category) && store.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'az' ? a.name.localeCompare(b.name) : sort === 'za' ? b.name.localeCompare(a.name) : (b.coupon_count || 0) - (a.coupon_count || 0) || a.name.localeCompare(b.name));
    const reset = () => { setQuery(''); setCategory('All Stores'); setOnlySaved(false); };
    function toggleSaved(id: number) {
        const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id]; setSaved(next);
        try { localStorage.setItem('cp-saved-stores', JSON.stringify(next)); } catch { /* Keep session selection if storage is unavailable. */ }
    }
    return <div className={s.page}>
        <section className={s.hero}><div className={s.heroInner}>
            <div className={s.intro}><p className={s.eyebrow}>ALL STORES</p><h1>Your Favourite Brands.<br /><span>Better Savings.</span></h1><p className={s.subtitle}>Explore {stores.length} stores and find your next great deal.</p><div className={s.pills}><span>✓ Real brands</span><span>◷ Latest listings</span><span>✓ Free to browse</span></div></div>
            <div className={s.collage}><img className={s.creative} src="/assets/home-ui/stores-shopping-creative.webp" alt="Blue and orange shopping bags with a gift and coupon" width={960} height={640} fetchPriority="high" /></div>
            <aside className={s.promo}><div><h2>Shop Smart.<br />Save More.</h2><p>Top brands. Latest offers.<br />All in one place.</p><Link href="/deals/">Explore Deals <span aria-hidden="true">→</span></Link></div><img src="/assets/home-ui/newsletter-percent.png" alt="" width={150} height={150} /></aside>
        </div></section>
        <main className={s.main} id="all-stores">
            <div className={s.tools}><div className={s.categories} role="group" aria-label="Store category">{['All Stores', ...categories.slice(0, 6)].map(name => <button key={name} aria-pressed={category === name} className={category === name ? s.active : ''} onClick={() => setCategory(name)}>{name === 'All Stores' && <i className="fas fa-th-large" aria-hidden="true" />} {name}</button>)}{categories.length > 6 && <select aria-label="More categories" value={categories.slice(6).includes(category) ? category : ''} onChange={e => setCategory(e.target.value || 'All Stores')}><option value="">More categories</option>{categories.slice(6).map(name => <option key={name}>{name}</option>)}</select>}</div><label className={s.sort}>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="popular">Most offers</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label></div>
            <div className={s.searchRow}><label className={s.search}><i className="fas fa-search" aria-hidden="true" /><input aria-label="Search stores" placeholder="Search your favourite stores…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}>×</button>}</label><span aria-live="polite">{filtered.length} stores</span><button className={s.saved} aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}><i className={`${onlySaved ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /> Saved ({saved.length})</button></div>
            {failed && <p className={s.status}>Showing the saved catalog. Live updates are temporarily unavailable.</p>}
            <div className={s.grid}>{filtered.map(store => <article className={s.card} key={store.id}><button className={s.heart} aria-label={`${saved.includes(store.id) ? 'Unsave' : 'Save'} ${store.name}`} aria-pressed={saved.includes(store.id)} onClick={() => toggleSaved(store.id)}><i className={`${saved.includes(store.id) ? 'fas' : 'far'} fa-heart`} aria-hidden="true" /></button><Logo store={store} /><h2>{store.name.replace(/\s+coupon\s+codes?$/i, '')}</h2><p>{store.coupon_count || 0} {(store.coupon_count || 0) === 1 ? 'Offer' : 'Offers'}</p><strong>{store.coupon_count ? 'Coupons & deals' : 'Explore this store'}</strong><Link href={getStorePath(store.slug)} aria-label={`View ${store.name} store`}>View Store <span aria-hidden="true">→</span></Link></article>)}</div>
            {!filtered.length && <div className={s.empty}><h2>No stores found</h2><p>Try another name or reset your filters.</p><button onClick={reset}>Show all stores</button></div>}
            <section className={s.bottom}>{[{icon:'store',title:'Your favourite stores',text:'Find brands in one place'},{icon:'tag',title:'Compare offers',text:'Check terms before you shop'},{icon:'bolt',title:'Save your favourites',text:'Keep useful stores close'}].map(item => <div key={item.title}><i className={`fas fa-${item.icon}`} aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.text}</small></span></div>)}<a href="#all-stores" onClick={reset}>Browse All Stores →</a></section>
        </main>
    </div>;
}
