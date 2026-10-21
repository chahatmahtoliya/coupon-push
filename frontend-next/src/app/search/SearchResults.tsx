'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from '@/components/common/SiteLink';
import { CouponDescription } from '@/components/common/CouponDescription';
import { CouponModal } from '@/components/common/CouponModal';
import { getStorePath } from '@/lib/routes';
import { searchApi } from '@/services/api';
import { getCouponCode } from '@/utils/coupon';
import type { Coupon, SearchResults as Results } from '@/types';
import styles from './search.module.css';

type Filter = 'all' | 'stores' | 'coupons';
type SearchState = { status: 'loading' | 'error' | 'success'; results: Results };
const emptyResults: Results = { stores: [], coupons: [] };
const suggestions = ['Amazon', 'Flipkart', 'Blinkit', 'The Derma Co'];

function SearchForm({ query = '' }: { query?: string }) {
    const [value, setValue] = useState(query);
    const input = useRef<HTMLInputElement>(null);
    return <form action="/search/" method="get" role="search" aria-label="Search CouponPush" className={styles.searchForm}>
        <label htmlFor="catalog-search" className="visually-hidden">Search stores, coupons and deals</label>
        <i className="fas fa-search" aria-hidden="true" />
        <input ref={input} id="catalog-search" name="q" type="search" placeholder="Search stores, coupons and deals" value={value} onChange={event => setValue(event.target.value)} minLength={2} maxLength={200} autoComplete="off" />
        {value && <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => { setValue(''); input.current?.focus(); }}><i className="fas fa-times" aria-hidden="true" /></button>}
        <button type="submit" className={styles.submit}>Search<i className="fas fa-arrow-right" aria-hidden="true" /></button>
    </form>;
}

function Suggestions() {
    return <div className={styles.suggestions}><span>Try a store</span>{suggestions.map(name => <Link key={name} href={`/search/?q=${encodeURIComponent(name)}`}>{name}<i className="fas fa-arrow-up" aria-hidden="true" /></Link>)}</div>;
}

function BrowseLinks() {
    return <div className={styles.browseLinks}><Link href="/stores/">Browse all stores<i className="fas fa-arrow-right" aria-hidden="true" /></Link><Link href="/categories/">Explore categories<i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>;
}

function ResultSkeleton() {
    return <div className={styles.offerGrid} aria-hidden="true">{[0, 1, 2].map(item => <div className={styles.skeleton} key={item}><div /><div /><div /><div /></div>)}</div>;
}

export function SearchLoading() {
    return <><SearchForm /><div className={styles.pending}><p className={styles.status} role="status">Loading search…</p><ResultSkeleton /></div></>;
}

function Logo({ src }: { src: string }) {
    return <img src={src || '/placeholder-store.png'} alt="" width={56} height={56} loading="lazy" decoding="async" onError={event => {
        if (!event.currentTarget.src.endsWith('/placeholder-store.png')) event.currentTarget.src = '/placeholder-store.png';
    }} />;
}

function OfferCard({ coupon, onOpen }: { coupon: Coupon; onOpen: (coupon: Coupon) => void }) {
    const hasCode = Boolean(getCouponCode(coupon));
    const discount = Number(coupon.discount_value);
    const discountLabel = discount > 0 && coupon.discount_type === 'percentage' ? `${discount}% off`
        : discount > 0 && ['fixed', 'flat'].includes(coupon.discount_type) ? `₹${discount.toLocaleString('en-IN')} off` : null;
    return <article className={styles.offerCard}>
        <div className={styles.offerTop}>
            <Link href={getStorePath(coupon.store_slug)} className={styles.offerStore}><Logo src={coupon.store_logo} /><span>{coupon.store_name}</span></Link>
            <span className={styles.offerType}><i className={`fas ${hasCode ? 'fa-ticket-alt' : 'fa-tag'}`} aria-hidden="true" />{hasCode ? 'Coupon code' : 'No-code deal'}</span>
        </div>
        {discountLabel && <p className={styles.discount}>{discountLabel}</p>}
        <h3>{coupon.title}</h3>
        {coupon.description && <CouponDescription className={styles.description} previewLines={2}>{coupon.description}</CouponDescription>}
        <div className={styles.offerFooter}>
            <span>{hasCode ? 'Apply at checkout' : 'No code needed'}</span>
            <button type="button" onClick={() => onOpen(coupon)} aria-label={`${hasCode ? 'Get code' : 'View deal'}: ${coupon.title}`}>{hasCode ? 'Get code' : 'View deal'}<i className="fas fa-arrow-right" aria-hidden="true" /></button>
        </div>
    </article>;
}

function SearchWorkspace({ query }: { query: string }) {
    const [state, setState] = useState<SearchState>({ status: 'loading', results: emptyResults });
    const [filter, setFilter] = useState<Filter>('all');
    const [attempt, setAttempt] = useState(0);
    const [selected, setSelected] = useState<Coupon | null>(null);
    const canSearch = query.length >= 2;

    useEffect(() => {
        if (!canSearch) return;
        let active = true;
        setState({ status: 'loading', results: emptyResults });
        searchApi.search(query).then(results => {
            if (active) setState({ status: 'success', results });
        }).catch(() => {
            if (active) setState({ status: 'error', results: emptyResults });
        });
        return () => { active = false; };
    }, [query, canSearch, attempt]);

    const { stores, coupons } = state.results;
    const total = stores.length + coupons.length;
    const ready = canSearch && state.status === 'success';
    const visibleCount = filter === 'stores' ? stores.length : filter === 'coupons' ? coupons.length : total;
    const status = !canSearch ? '' : state.status === 'loading' ? `Searching for “${query}”…`
        : state.status === 'error' ? 'Search is temporarily unavailable.'
            : `${total} ${total === 1 ? 'result' : 'results'} for “${query}”`;

    return <>
        <SearchForm query={query} />
        <Suggestions />
        {!canSearch ? <section className={styles.empty}>
            <span className={styles.emptyIcon}><i className="fas fa-search" aria-hidden="true" /></span>
            <h2>{query ? 'Keep typing…' : 'Your next saving starts here'}</h2>
            <p>{query ? 'Enter at least 2 characters to find stores and offers.' : 'Search for a brand or product, or explore the stores and categories below.'}</p>
            <BrowseLinks />
        </section> : <>
            <div className={styles.resultsBar}>
                <p className={styles.status} role="status" aria-atomic="true">{status}</p>
                <div className={styles.filters} role="group" aria-label="Filter search results">
                    {([['all', 'All results', total], ['stores', 'Stores', stores.length], ['coupons', 'Coupons & deals', coupons.length]] as const).map(([value, label, count]) => <button type="button" key={value} aria-pressed={filter === value} aria-controls="search-results" onClick={() => setFilter(value)}>{label}<span>{ready ? count : '—'}</span></button>)}
                </div>
            </div>
            <div id="search-results" className={styles.results} aria-busy={state.status === 'loading'}>
                {state.status === 'loading' ? <ResultSkeleton /> : state.status === 'error' ? <section className={styles.empty}>
                    <span className={styles.emptyIcon}><i className="fas fa-wifi" aria-hidden="true" /></span>
                    <h2>We couldn’t load your results</h2><p>Please try again, or browse stores while search is unavailable.</p>
                    <button className={styles.retry} type="button" onClick={() => setAttempt(value => value + 1)}>Try again<i className="fas fa-redo" aria-hidden="true" /></button><BrowseLinks />
                </section> : visibleCount === 0 ? <section className={styles.empty}>
                    <span className={styles.emptyIcon}><i className="fas fa-search" aria-hidden="true" /></span>
                    <h2>{total ? `No ${filter === 'stores' ? 'stores' : 'coupons or deals'} match this search` : 'No matches this time'}</h2>
                    <p>{total ? 'There are matches in another result type.' : 'Try a store name, check the spelling, or use a broader search term.'}</p>
                    {total > 0 && <button className={styles.retry} type="button" onClick={() => setFilter('all')}>Show all {total} {total === 1 ? 'result' : 'results'}<i className="fas fa-arrow-right" aria-hidden="true" /></button>}
                    <BrowseLinks />
                </section> : <>
                    {filter !== 'coupons' && stores.length > 0 && <section className={styles.resultSection} aria-labelledby="matching-stores">
                        <div className={styles.sectionHeading}><h2 id="matching-stores">Stores<span>{stores.length}</span></h2><Link href="/stores/">All stores<i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
                        <div className={styles.storeGrid}>{stores.map(store => <Link className={styles.storeCard} href={getStorePath(store.slug)} key={store.id}>
                            <span className={styles.storeLogo}><Logo src={store.logo} /></span>
                            <div><h3>{store.name}</h3><p>{store.coupon_count || 0} {store.coupon_count === 1 ? 'offer' : 'offers'} listed</p><span>View store</span></div>
                            <i className="fas fa-arrow-right" aria-hidden="true" />
                        </Link>)}</div>
                    </section>}
                    {filter !== 'stores' && coupons.length > 0 && <section className={styles.resultSection} aria-labelledby="matching-offers">
                        <div className={styles.sectionHeading}><h2 id="matching-offers">Coupons & deals<span>{coupons.length}</span></h2></div>
                        <div className={styles.offerGrid}>{coupons.map(coupon => <OfferCard coupon={coupon} onOpen={setSelected} key={coupon.id} />)}</div>
                        <p className={styles.termsNote}>Offer conditions and availability can change. Check the store’s terms before checkout.</p>
                    </section>}
                </>}
            </div>
        </>}
        <CouponModal coupon={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
    </>;
}

export default function SearchResults() {
    const query = (useSearchParams().get('q') || '').trim().slice(0, 200);
    // Reset input, filters and results for each URL query. Old requests are
    // ignored when the previous workspace's effect is cleaned up.
    return <SearchWorkspace key={query} query={query} />;
}
