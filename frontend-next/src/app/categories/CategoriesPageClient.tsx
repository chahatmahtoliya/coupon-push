'use client';

import Link from '@/components/common/SiteLink';
import { useEffect, useMemo, useState } from 'react';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CategoryIcon from '@/components/features/CategoryIcon';
import { categoriesApi } from '@/services/api';
import type { Category } from '@/types';
import { getCategoryPath } from '@/lib/routes';
import { CATEGORY_GROUPS, getCategoryGroup, prepareDirectoryCategories, type CategoryGroupId } from '@/lib/category-directory';

function categoryHref(category: Category): string {
    const path = getCategoryPath(category.slug);
    return path === '/categories/' ? `/categories/view/?slug=${encodeURIComponent(category.slug)}` : path;
}

export default function CategoriesPageClient({ initialCategories }: { initialCategories: Category[] }) {
    const [categories, setCategories] = useState(() => prepareDirectoryCategories(initialCategories));
    const [query, setQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<CategoryGroupId | 'all'>('all');
    const [onlyWithOffers, setOnlyWithOffers] = useState(false);

    useEffect(() => {
        let active = true;
        categoriesApi.getAllFresh().then((fresh) => {
            if (!active || !fresh.length) return;
            // Partial API responses must not erase categories available at build time.
            const bySlug = new Map(initialCategories.map(category => [category.slug, category]));
            for (const category of fresh) bySlug.set(category.slug, category);
            setCategories(prepareDirectoryCategories([...bySlug.values()]));
        }).catch(() => { /* Keep the saved directory available when offline. */ });
        return () => { active = false; };
    }, [initialCategories]);

    const popular = useMemo(() => [...categories].filter(category => category.coupon_count > 0).sort((a, b) => b.coupon_count - a.coupon_count || a.name.localeCompare(b.name)).slice(0, 5), [categories]);
    const filtered = useMemo(() => categories.filter(category => {
        const search = `${category.name} ${category.description || ''}`.toLocaleLowerCase('en-IN');
        return search.includes(query.trim().toLocaleLowerCase('en-IN'))
            && (selectedGroup === 'all' || getCategoryGroup(category.slug) === selectedGroup)
            && (!onlyWithOffers || category.coupon_count > 0);
    }), [categories, query, selectedGroup, onlyWithOffers]);
    const groups = CATEGORY_GROUPS.map(group => ({ ...group, categories: filtered.filter(category => getCategoryGroup(category.slug) === group.id) })).filter(group => group.categories.length);
    const clearFilters = () => { setQuery(''); setSelectedGroup('all'); setOnlyWithOffers(false); };

    return <div className="cp-category-directory">
        <header className="cp-directory-hero">
            <div className="cp-directory-shell">
                <nav className="cp-directory-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRightRounded aria-hidden="true" /><span aria-current="page">Categories</span></nav>
                <div className="cp-directory-hero-layout">
                    <div className="cp-directory-hero-copy">
                        <h1>Find savings<br /><span>by category.</span></h1>
                        <p>From everyday essentials to your next big upgrade. Find your kind of shopping, all in one place.</p>
                        <form className="cp-directory-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById('categories-list')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>
                            <label className="visually-hidden" htmlFor="category-search">Search categories</label>
                            <SearchRounded aria-hidden="true" />
                            <input id="category-search" type="search" placeholder="Try headphones, skincare, travel…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
                            {query && <button type="button" className="cp-directory-search-clear" onClick={() => { setQuery(''); document.getElementById('category-search')?.focus(); }} aria-label="Clear category search"><CloseRounded /></button>}
                            <button type="submit" className="cp-directory-search-submit" aria-label="See matching categories"><ArrowForwardRounded /></button>
                        </form>
                        <div className="cp-directory-hero-note"><span>{categories.length} categories to explore</span><span aria-hidden="true">·</span><Link href="/stores/">Browse by store <ArrowForwardRounded /></Link></div>
                    </div>
                    <div className="cp-directory-hero-art" aria-hidden="true"><img src="/assets/images/categories/shopping-discovery.webp" width="900" height="600" alt="" fetchPriority="high" /></div>
                </div>
            </div>
        </header>
        <div className="cp-directory-shell">
            {popular.length > 0 && <div className="cp-directory-popular"><span>Popular categories</span><div>{popular.map(category => <Link key={category.slug} href={categoryHref(category)}><CategoryIcon slug={category.slug} />{category.name}<ArrowForwardRounded className="cp-directory-popular-arrow" /></Link>)}</div></div>}
            <section className="cp-directory-catalog" id="categories-list" aria-labelledby="directory-title">
                <div className="cp-directory-section-heading"><div><h2 id="directory-title">Explore all categories</h2><p>A place for everything on your shopping list.</p></div><label className="cp-directory-availability"><input type="checkbox" checked={onlyWithOffers} onChange={event => setOnlyWithOffers(event.target.checked)} /><span>With offers only</span></label></div>
                <div className="cp-directory-toolbar">
                    <div className="cp-directory-group-filters" role="group" aria-label="Filter categories by shopping group">
                        <button type="button" className={selectedGroup === 'all' ? 'is-active' : ''} aria-pressed={selectedGroup === 'all'} onClick={() => setSelectedGroup('all')}>All categories <span>{categories.length}</span></button>
                        {CATEGORY_GROUPS.map(group => <button type="button" key={group.id} className={selectedGroup === group.id ? 'is-active' : ''} aria-pressed={selectedGroup === group.id} onClick={() => setSelectedGroup(group.id)}>{group.shortName}</button>)}
                    </div>
                    <p className="cp-directory-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'category' : 'categories'}{query.trim() ? ` matching “${query.trim()}”` : ' to explore'}</p>
                </div>
                <div className="cp-directory-groups">
                    {groups.map(group => <section className="cp-directory-group" key={group.id} aria-labelledby={`group-${group.id}`}>
                        <div className="cp-directory-group-heading"><span className="cp-directory-group-mark"><CategoryIcon slug={group.icon} /></span><div><h3 id={`group-${group.id}`}>{group.name}<span>{group.categories.length}</span></h3><p>{group.description}</p></div></div>
                        <ul className="cp-directory-grid">{group.categories.map(category => <li key={category.slug}>
                            <Link className="cp-directory-tile" href={categoryHref(category)}>
                                <span className="cp-directory-tile-icon"><CategoryIcon slug={category.slug} /></span>
                                <span className="cp-directory-tile-copy"><span className="cp-directory-tile-name">{category.name}</span><span className={`cp-directory-tile-count${category.coupon_count ? ' has-offers' : ''}`}>{category.coupon_count ? `${category.coupon_count.toLocaleString('en-IN')} ${category.coupon_count === 1 ? 'offer' : 'offers'}` : 'No offers listed yet'}</span></span>
                                <ArrowForwardRounded className="cp-directory-tile-arrow" />
                            </Link>
                        </li>)}</ul>
                    </section>)}
                </div>
                {!filtered.length && <div className="cp-directory-empty"><SearchRounded /><h3>No categories found</h3><p>Try a different search or clear your filters to explore the full directory.</p><button type="button" onClick={clearFilters}>Clear search & filters <ArrowForwardRounded /></button></div>}
            </section>
            <aside className="cp-directory-store-prompt"><div><span className="cp-directory-store-icon"><CategoryIcon slug="accessories" /></span><span><strong>Know the store you love?</strong><span>Head straight to its coupons and latest offers.</span></span></div><Link href="/stores/">Browse all stores <ArrowForwardRounded /></Link></aside>
        </div>
    </div>;
}
