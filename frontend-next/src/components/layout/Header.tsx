'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { categoriesApi } from '@/services/api';
import type { Category } from '@/types';

export function Header() {
    const [query, setQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const menuWasOpen = useRef(false);
    const router = useRouter();
    const pathname = usePathname();
    const isHomepage = pathname === '/';

    const topCategories = useMemo(() => {
        const sorted = [...categories].sort((a, b) => (b.coupon_count || 0) - (a.coupon_count || 0));
        const withCoupons = sorted.filter((category) => (category.coupon_count || 0) > 0);
        return (withCoupons.length > 0 ? withCoupons : sorted).slice(0, 8);
    }, [categories]);

    useEffect(() => setMenuOpen(false), [pathname]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen) {
            if (menuWasOpen.current) menuButtonRef.current?.focus();
            menuWasOpen.current = false;
            return;
        }

        menuWasOpen.current = true;
        closeButtonRef.current?.focus();

        const handleKeyboard = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setMenuOpen(false);
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (!focusable?.length) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [menuOpen]);

    useEffect(() => {
        categoriesApi.getAllFresh().then(setCategories).catch((error) => {
            console.error('Failed to load header categories:', error);
        });
    }, []);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        setMenuOpen(false);
    };

    return (
        <>
            <header className={`main-header-v2 cp-header ${isHomepage ? 'is-homepage' : ''}`}>
                <div className="cp-container cp-header-inner">
                    <Link className="header-logo cp-logo" href="/" aria-label="CouponPush home">
                        <img src="/assets/home-ui/logo-transparent.png" alt="CouponPush" className="logo-image" width="140" height="34" decoding="async" />
                    </Link>

                    <div className="header-search-desktop cp-search">
                        <form className="search-form" onSubmit={submitSearch}>
                            <label className="visually-hidden" htmlFor="site-search">Search stores and coupons</label>
                            <input id="site-search" type="search" className="search-input" placeholder="Search for stores, coupons & deals..." value={query} onChange={(event) => setQuery(event.target.value)} />
                            <button type="submit" className="search-btn" aria-label="Submit search"><i className="fas fa-search" aria-hidden="true" /></button>
                        </form>
                    </div>

                    <nav className="header-nav-desktop cp-nav" aria-label="Primary navigation">
                        <Link href="/stores" className="nav-link-v2">Stores</Link>
                        <div className="nav-dropdown">
                            <Link href="/categories" className="nav-link-v2 dropdown-trigger">Categories <i className="fas fa-chevron-down" aria-hidden="true" /></Link>
                            <div className="dropdown-menu-v2">
                                {topCategories.map((category) => (
                                    <Link key={category.id} href={`/category/${category.slug}`} className="dropdown-item-v2">
                                        <i className={`fas ${category.icon?.replace(/^fas\s+/, '') || 'fa-tag'}`} aria-hidden="true" />{' '}{category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <Link href="/deals" className="nav-link-v2">Deals</Link>
                    </nav>

                    <button ref={menuButtonRef} className={`hamburger-btn cp-menu-button ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation-dialog" aria-haspopup="dialog" type="button">
                        <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
                    </button>
                </div>
            </header>

            <div className={`mobile-menu-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />

            <aside ref={drawerRef} id="mobile-navigation-dialog" className={`mobile-menu-drawer cp-mobile-drawer ${menuOpen ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label="Mobile navigation" aria-hidden={!menuOpen} hidden={!menuOpen}>
                <div className="mobile-menu-header">
                    <Link href="/" className="mobile-menu-logo" onClick={() => setMenuOpen(false)}>
                        <img src="/assets/home-ui/logo-transparent.png" alt="CouponPush" className="logo-image-mobile" width="120" height="28" />
                    </Link>
                    <button ref={closeButtonRef} className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close mobile menu" type="button"><i className="fas fa-times" aria-hidden="true" /></button>
                </div>

                <div className="mobile-menu-search">
                    <form onSubmit={submitSearch}>
                        <input type="search" placeholder="Search for stores, coupons & deals..." aria-label="Search stores and coupons" value={query} onChange={(event) => setQuery(event.target.value)} />
                        <button type="submit" aria-label="Submit search"><i className="fas fa-search" aria-hidden="true" /></button>
                    </form>
                </div>

                <nav className="mobile-menu-nav" aria-label="Mobile navigation links">
                    {[
                        { href: '/stores', label: 'Stores', icon: 'fa-store' },
                        { href: '/categories', label: 'Categories', icon: 'fa-border-all' },
                        { href: '/deals', label: 'Deals', icon: 'fa-bolt' },
                    ].map((item, index) => (
                        <Link key={item.href} href={item.href} className="mobile-menu-item" onClick={() => setMenuOpen(false)} style={{ animationDelay: `${0.05 * (index + 1)}s` }}>
                            <i className={`fas ${item.icon}`} aria-hidden="true" /><span>{item.label}</span><i className="fas fa-chevron-right arrow" aria-hidden="true" />
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}

export default Header;
