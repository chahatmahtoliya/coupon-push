'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { categoriesApi } from '@/services/api';
import type { Category } from '@/types';

const COLORS = [
    { accent: '#ff6b1a', soft: '#fff3ed', deep: '#c2410c' },
    { accent: '#0ea5e9', soft: '#eef8ff', deep: '#075985' },
    { accent: '#16a34a', soft: '#ecfdf3', deep: '#166534' },
    { accent: '#7c3aed', soft: '#f5f1ff', deep: '#5b21b6' },
    { accent: '#eab308', soft: '#fff8db', deep: '#854d0e' },
    { accent: '#ec4899', soft: '#fff1f8', deep: '#be185d' },
];

function iconName(icon?: string): string {
    return icon?.replace(/^fas\s+/, '') || 'fa-tag';
}

export default function CategoriesPageClient({ initialCategories }: { initialCategories: Category[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const sorted = useMemo(() => {
        const all = [...categories].sort((a, b) => (b.coupon_count || 0) - (a.coupon_count || 0));
        const active = all.filter((category) => (category.coupon_count || 0) > 0);
        return active.length ? active : all;
    }, [categories]);
    const couponCount = useMemo(() => sorted.reduce((sum, category) => sum + (category.coupon_count || 0), 0), [sorted]);

    useEffect(() => {
        let active = true;
        categoriesApi.getAllFresh().then((fresh) => { if (active) setCategories(fresh); }).catch((error) => console.error('Failed to refresh categories:', error));
        return () => { active = false; };
    }, []);

    return <>
        <div className="category-header-dark category-directory-hero"><div className="container"><div className="category-hero-grid">
            <div className="category-hero-copy">
                <nav className="category-breadcrumb"><Link href="/">HOME</Link><i className="fas fa-chevron-right" /><span>CATEGORIES</span></nav>
                <span className="category-hero-kicker"><i className="fas fa-layer-group" aria-hidden="true" />Coupon categories</span>
                <h1 className="category-header-title">Find savings by category</h1>
                <p className="category-header-description">Jump into the shopping lanes with fresh coupons, active offers, and store deals grouped for faster browsing.</p>
                <div className="category-hero-actions"><a href="#categories-list" className="category-hero-primary">Explore categories <i className="fas fa-arrow-down" aria-hidden="true" /></a><Link href="/stores" className="category-hero-secondary">Browse stores</Link></div>
            </div>
            <aside className="category-hero-panel" aria-label="Category summary">
                <div className="category-hero-stat category-hero-stat-large"><span>{sorted.length}</span><small>Active categories</small></div>
                <div className="category-hero-stat"><span>{couponCount.toLocaleString('en-IN')}</span><small>Live coupons</small></div>
                <div className="category-hero-feature-list">{sorted.slice(0, 3).map((category) => <Link href={`/category/${category.slug}`} key={category.id}><i className={`fas ${iconName(category.icon)}`} aria-hidden="true" /><span>{category.name}</span><strong>{category.coupon_count || 0}</strong></Link>)}</div>
            </aside>
        </div></div></div>
        <section className="categories-page-section" id="categories-list"><div className="container">
            <div className="category-section-head"><div><span className="category-section-kicker">Browse deals faster</span><h2>Choose a category</h2></div><div className="categories-page-count"><span className="count-number">{sorted.length}</span> <span className="count-text">categories available</span></div></div>
            <div className="categories-page-grid">{sorted.map((category, index) => {
                const color = COLORS[index % COLORS.length];
                const style = { '--category-accent': color.accent, '--category-soft': color.soft, '--category-deep': color.deep } as CSSProperties;
                return <Link href={`/category/${category.slug}`} className="categories-page-card" style={style} key={category.id}>
                    <div className="categories-page-card-head"><span className="categories-page-card-rank">#{index + 1}</span><span className="categories-page-card-badge">{category.coupon_count || 0} {category.coupon_count === 1 ? 'coupon' : 'coupons'}</span></div>
                    <div className="categories-page-card-icon"><i className={`fas ${iconName(category.icon)}`} aria-hidden="true" /></div>
                    <div className="categories-page-card-content"><h3 className="categories-page-card-name">{category.name}</h3><p className="categories-page-card-description">{category.description || `Browse current coupon codes, store deals, and savings picks for ${category.name}.`}</p></div>
                    <div className="categories-page-card-meta"><span><i className="fas fa-bolt" aria-hidden="true" />Active offers</span><span><i className="fas fa-circle-check" aria-hidden="true" />Curated</span></div>
                    <span className="categories-page-card-cta">Explore <i className="fas fa-arrow-right" aria-hidden="true" /></span>
                </Link>;
            })}</div>
            {!sorted.length && <div className="empty-state"><i className="fas fa-folder-open" /><h3>No Categories Found</h3><p>Categories will appear here once they are added.</p><Link href="/" className="btn btn-primary">Go to Homepage</Link></div>}
        </div></section>
    </>;
}
