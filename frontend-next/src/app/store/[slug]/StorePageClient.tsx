'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CouponModal } from '@/components/common';
import { getStorePath } from '@/lib/routes';
import { getStorePseoContent } from '@/lib/store-pseo';
import { getActiveCoupons } from '@/lib/indexability';
import { storesApi } from '@/services/api';
import type { Coupon, Store, StorePageData } from '@/types';
import { getCouponCtaLabel, isCodeCoupon } from '@/utils/coupon';

type Filter = 'all' | 'codes' | 'deals';
type Sort = 'popular' | 'newest' | 'discount';
type ContentPanel = { id: string; icon: string; title: string; html: string };

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatStoreContent(content?: string | null): string {
    const value = content?.trim();
    if (!value) return '';
    if (HTML_TAG_PATTERN.test(value)) return value;
    return value.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean).map((block) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        if (!lines.length) return '';
        if (lines.length === 1) {
            const heading = lines[0].match(/^(h[1-6]|p)\s*:\s*(.+)$/i);
            if (heading) return `<${heading[1].toLowerCase()}>${escapeHtml(heading[2])}</${heading[1].toLowerCase()}>`;
            if (/^[A-Z][A-Z\s&/()-]{2,}$/.test(lines[0])) return `<h2>${escapeHtml(lines[0])}</h2>`;
            return `<p>${escapeHtml(lines[0])}</p>`;
        }
        if (lines[0].length <= 90 && !/[.!?:]$/.test(lines[0])) return `<h2>${escapeHtml(lines[0])}</h2><p>${escapeHtml(lines.slice(1).join(' '))}</p>`;
        return `<p>${escapeHtml(lines.join(' '))}</p>`;
    }).filter(Boolean).join('');
}

function normalizedText(value?: string | null): string {
    return (value || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function hasContent(value?: string | null): boolean {
    return normalizedText(value).length > 0;
}

function cleanStoreName(name: string): string {
    return name.replace(/\s+(coupon|promo|discount)\s+codes?$/i, '').replace(/\s+coupons?$/i, '').trim() || name;
}

function currency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function discountValue(coupon: Coupon): string {
    const text = `${coupon.title} ${coupon.description}`.toLowerCase();
    if (text.includes('free shipping') || text.includes('free delivery')) return 'Free';
    if (!coupon.discount_value || coupon.discount_value <= 0) return isCodeCoupon(coupon) ? 'Code' : 'Deal';
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`;
    if (coupon.discount_type === 'fixed' || String(coupon.discount_type) === 'flat') return `${currency(coupon.discount_value)} OFF`;
    return 'Offer';
}

function visualDiscount(coupon: Coupon): string {
    const value = discountValue(coupon);
    if (value === 'Code') return 'Coupon Code';
    if (value === 'Deal') return 'Online Deal';
    if (coupon.discount_type === 'percentage' && value.endsWith('%')) return `${value} OFF`;
    return value;
}

function offerStyle(coupon: Coupon) {
    const text = `${coupon.title} ${coupon.description}`.toLowerCase();
    if (text.includes('bank') || text.includes('card')) return { label: 'Bank Offer', tone: 'blue' };
    if (text.includes('free shipping') || text.includes('free delivery')) return { label: 'Free Shipping', tone: 'green' };
    if (isCodeCoupon(coupon)) return { label: 'Coupon Code', tone: 'blue' };
    if (coupon.coupon_type === 'deal') return { label: 'Deal', tone: 'orange' };
    return { label: 'Offer', tone: 'orange' };
}

function sortCoupons(coupons: Coupon[], sort: Sort): Coupon[] {
    const result = [...coupons];
    if (sort === 'newest') return result.sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return bDate - aDate;
    });
    if (sort === 'discount') return result.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0));
    return result.sort((a, b) => a.is_featured !== b.is_featured ? Number(b.is_featured) - Number(a.is_featured) : (b.click_count || 0) - (a.click_count || 0));
}

function expiryLabel(value?: string): string {
    if (!value) return 'No expiry date listed';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'No expiry date listed' : `Expires ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function StoreLogo({ store, displayName }: { store: Store; displayName: string }) {
    const [showImage, setShowImage] = useState(Boolean(store.logo));
    useEffect(() => setShowImage(Boolean(store.logo)), [store.logo]);
    if (showImage && store.logo) return <img src={store.logo} alt={`${displayName} logo`} loading="lazy" decoding="async" onError={() => setShowImage(false)} />;
    const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'CP';
    return <span>{initials}</span>;
}

function Card({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
    return <section className={`store-ui-card ${className}`} id={id}>{children}</section>;
}

export default function StorePageClient({ initialData, slug }: { initialData: StorePageData | null; slug: string }) {
    const [data, setData] = useState(initialData);
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<Sort>('popular');
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
    const [saved, setSaved] = useState<Set<number>>(() => new Set());

    useEffect(() => {
        let active = true;
        storesApi.getBySlugFresh(slug).then((fresh) => {
            if (active) setData({ store: fresh.store, coupons: fresh.coupons || [], related_stores: fresh.related_stores || [] });
        }).catch((error) => console.error('Failed to refresh store data:', error));
        return () => { active = false; };
    }, [slug]);

    const store = data?.store || null;
    const coupons = useMemo(() => getActiveCoupons(data?.coupons), [data?.coupons]);
    const relatedStores = data?.related_stores || [];
    const displayName = cleanStoreName(store?.name || 'Store');
    const filteredCoupons = useMemo(() => sortCoupons(coupons.filter((coupon) => (
        filter === 'codes' ? isCodeCoupon(coupon) : filter === 'deals' ? !isCodeCoupon(coupon) : true
    )), sort), [coupons, filter, sort]);

    if (!store) return <section className="store-ui-page store-ui-empty"><div className="store-ui-shell"><div className="store-ui-empty-panel"><i className="fa-solid fa-store-slash" aria-hidden="true" /><h1>Store not found</h1><p>We could not load this store page right now.</p><Link href="/stores" className="store-ui-primary-button">Browse Stores</Link></div></div></section>;

    const codeCount = coupons.filter(isCodeCoupon).length;
    const offerCount = coupons.length || store.coupon_count || 0;
    const dealCount = Math.max(offerCount - codeCount, 0);
    const verifiedCount = coupons.filter((coupon) => coupon.is_verified).length;
    const pseo = getStorePseoContent({ slug, storeName: displayName, coupons, offerCount, codeCount, dealCount });
    const factualSummary = offerCount
        ? `${offerCount} active ${displayName} offers are listed: ${codeCount} coupon ${codeCount === 1 ? 'code' : 'codes'} and ${dealCount} online ${dealCount === 1 ? 'deal' : 'deals'}.`
        : `There are no active ${displayName} coupon codes or online offers listed right now.`;
    const description = hasContent(store.description) ? store.description.trim() : '';
    const categoryName = store.category_name || 'Stores';
    const categoryHref = store.category_slug ? `/category/${store.category_slug}` : '/stores';
    const nearestExpiry = coupons.filter((coupon) => coupon.expiry_date && !Number.isNaN(new Date(coupon.expiry_date).getTime())).sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0];
    const featuredCoupon = sortCoupons(coupons, 'popular')[0];
    const aboutHtml = hasContent(store.about_content) && normalizedText(store.about_content) !== normalizedText(description) ? formatStoreContent(store.about_content) : '';
    const couponArticle = /^[aeiou]/i.test(displayName) ? 'an' : 'a';
    const contentPanels = pseo ? [] : [
        aboutHtml ? { id: 'about-store', icon: 'fa-circle-info', title: `About ${displayName}`, html: aboutHtml } : null,
        hasContent(store.howto_content) ? { id: 'how-to-use', icon: 'fa-ticket', title: `How to Use ${couponArticle} ${displayName} Coupon Code`, html: formatStoreContent(store.howto_content) } : null,
        hasContent(store.terms_content) ? { id: 'terms', icon: 'fa-file-contract', title: `${displayName} Coupon Terms`, html: formatStoreContent(store.terms_content) } : null,
    ].filter((panel): panel is ContentPanel => Boolean(panel?.html));
    const faqItems = pseo?.faqs || [
        { question: `How many ${displayName} coupons and offers are active?`, answer: factualSummary },
        {
            question: `Are there verified ${displayName} coupon codes?`,
            answer: codeCount ? `${codeCount} active ${displayName} coupon ${codeCount === 1 ? 'code is' : 'codes are'} listed. ${verifiedCount} of all current offers ${verifiedCount === 1 ? 'is' : 'are'} marked as verified.` : `No code-based ${displayName} coupons are listed at the moment; the current listings are online deals that do not require a code.`,
        },
        {
            question: `Which ${displayName} offer should I check first?`,
            answer: featuredCoupon ? `Start with "${featuredCoupon.title}". Review its eligibility, expiry information and final price before completing your order.` : `There is no active offer to recommend right now. Check the official ${displayName} site for current promotions.`,
        },
        {
            question: `When do ${displayName} coupon codes expire?`,
            answer: nearestExpiry ? `The nearest listed expiry is ${expiryLabel(nearestExpiry.expiry_date).toLowerCase()} for "${nearestExpiry.title}". Other offers may have different dates.` : `No current ${displayName} offer has a listed expiry date. Confirm availability on the offer page before checkout.`,
        },
    ];

    const toggleSaved = (id: number) => setSaved((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    return <section className="store-ui-page">
        <nav className="store-ui-breadcrumb store-ui-shell" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fa-solid fa-chevron-right" aria-hidden="true" /><Link href={categoryHref}>{categoryName}</Link><i className="fa-solid fa-chevron-right" aria-hidden="true" /><span>{displayName} Coupons</span></nav>
        <div className="store-ui-shell store-ui-header-row">
            <section className="store-ui-hero">
                <div className="store-ui-hero-content">
                    <div className="store-ui-hero-mobile-logo" aria-hidden="true"><StoreLogo store={store} displayName={displayName} /></div>
                    <div className="store-ui-hero-copy">
                        <h1>{pseo?.h1 || `${displayName} Coupon Codes & Offers`}</h1>
                        <p className="store-ui-verified-line">Current {displayName} coupons and deals</p>
                        <div className="store-ui-hero-stats" aria-label="Offer summary"><div><span><i className="fa-solid fa-tags" aria-hidden="true" /></span><strong>{offerCount}</strong><small>Active offers</small></div><div><span><i className="fa-solid fa-ticket" aria-hidden="true" /></span><strong>{codeCount}</strong><small>Coupon codes</small></div><div><span><i className="fa-solid fa-bolt" aria-hidden="true" /></span><strong>{dealCount}</strong><small>Online deals</small></div></div>
                        {(pseo?.heroDescription || description) && <p className="store-ui-hero-description">{pseo?.heroDescription || description}</p>}
                    </div>
                    {store.website_url && <a className="store-ui-mobile-shop-button" href={store.website_url} target="_blank" rel="noopener noreferrer">Visit {displayName} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></a>}
                    <div className="store-ui-hero-brand">{store.website_url && <a href={store.website_url} target="_blank" rel="noopener noreferrer">Visit {displayName} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></a>}</div>
                </div>
            </section>
        </div>
        <div className="store-ui-shell store-ui-layout">
            <aside className="store-ui-sidebar" aria-label={`${displayName} store information`}>
                <Card className="store-ui-page-nav-card"><h2>On this page</h2><nav className="store-ui-page-nav" aria-label={`${displayName} page sections`}><a href="#store-ui-offers">Coupon codes and offers</a><a href="#store-ui-faqs">Coupon FAQs</a>{pseo?.sections.map((section) => <a href={`#store-ui-${section.id}`} key={section.id}>{section.title}</a>)}{contentPanels.map((panel) => <a href={`#store-ui-${panel.id}`} key={panel.id}>{panel.title}</a>)}{!!relatedStores.length && <a href="#store-ui-related">Related stores</a>}</nav></Card>
            </aside>
            <main className="store-ui-main">
                <section className="store-ui-coupon-section" id="store-ui-offers">
                    <div className="store-ui-coupon-toolbar"><h2>Latest {displayName} Coupon Codes and Offers <span>({filteredCoupons.length})</span></h2><div className="store-ui-filter-panel"><div className="store-ui-segments" role="tablist" aria-label="Offer filter">{([{ id: 'all', label: `All (${coupons.length})` }, { id: 'codes', label: `Codes (${codeCount})` }, { id: 'deals', label: `Deals (${dealCount})` }] as { id: Filter; label: string }[]).map((item) => <button type="button" role="tab" className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} aria-selected={filter === item.id} key={item.id}>{item.label}</button>)}</div><label><span>Sort by:</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="popular">Popular</option><option value="newest">Newest</option><option value="discount">Discount</option></select></label></div></div>
                    {!filteredCoupons.length ? <div className="store-ui-empty-offers"><i className="fa-solid fa-ticket" aria-hidden="true" /><h3>{coupons.length ? 'No offers match this filter' : `No active ${displayName} offers`}</h3><p>{coupons.length ? 'Choose All to see every active offer.' : `Check ${displayName}'s official site for current promotions.`}</p>{!!coupons.length && <button type="button" onClick={() => setFilter('all')}>Show all offers</button>}</div> : <div className="store-ui-coupon-list">{filteredCoupons.map((coupon) => {
                        const style = offerStyle(coupon);
                        const isSaved = saved.has(coupon.id);
                        return <article className="store-ui-coupon-card" key={coupon.id}><div className={`store-ui-coupon-visual store-ui-tone-${style.tone}`}><span>{style.label}</span><strong>{visualDiscount(coupon)}</strong>{isCodeCoupon(coupon) && <><small>Code hidden</small><i className="store-ui-ticket-notch store-ui-ticket-left" aria-hidden="true" /><i className="store-ui-ticket-notch store-ui-ticket-right" aria-hidden="true" /></>}</div><div className="store-ui-coupon-details"><h3>{coupon.title}</h3><p>{coupon.description || 'Open this offer to review its current checkout terms.'}</p><div className="store-ui-coupon-meta"><span><i className="fa-regular fa-clock" aria-hidden="true" /> {expiryLabel(coupon.expiry_date)}</span>{coupon.is_verified && <span className="store-ui-success"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Verified offer</span>}</div></div><div className="store-ui-coupon-actions"><button type="button" className="store-ui-action-button" onClick={() => setActiveCoupon(coupon)}><span className="store-ui-action-label">{getCouponCtaLabel(coupon)} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></span><span className="store-ui-action-reveal" aria-hidden="true" /><span className="store-ui-action-shine" aria-hidden="true" /></button><div className="store-ui-card-links"><button type="button" aria-label={isSaved ? 'Remove saved offer' : 'Save offer'} className={isSaved ? 'active' : ''} onClick={() => toggleSaved(coupon.id)}><i className={`${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" /></button></div></div></article>;
                    })}</div>}
                </section>

                <Card className="store-ui-faq-card" id="store-ui-faqs"><h2>{displayName} Coupon Code FAQs</h2><div className="store-ui-faq-list">{faqItems.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</div></Card>

                {!!contentPanels.length && <section className="store-ui-content-stack" aria-label={`${displayName} coupon guide`}>{contentPanels.map((panel) => <article className="store-ui-content-panel store-info-body" id={`store-ui-${panel.id}`} key={panel.id}><header><i className={`fa-solid ${panel.icon}`} aria-hidden="true" /><h2>{panel.title}</h2></header><div dangerouslySetInnerHTML={{ __html: panel.html }} /></article>)}</section>}

                {!!pseo?.sections.length && <section className="store-ui-content-stack" aria-label={`${displayName} hosting deal guide`}>{pseo.sections.map((section) => <article className="store-ui-content-panel store-info-body" id={`store-ui-${section.id}`} key={section.id}><header><i className={`fa-solid ${section.icon}`} aria-hidden="true" /><h2>{section.title}</h2></header><div>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{!!section.items?.length && <ul className="store-ui-pseo-list">{section.items.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.description}</span></li>)}</ul>}</div></article>)}</section>}

                {!!relatedStores.length && <section className="store-ui-related" id="store-ui-related"><div className="store-ui-section-heading"><h2>More Stores in {categoryName}</h2></div><div className="store-ui-related-grid">{relatedStores.map((related) => {
                    const relatedName = cleanStoreName(related.name);
                    return <Link href={getStorePath(related.slug)} className="store-ui-related-card" key={related.id}><span className="store-ui-related-logo"><StoreLogo store={related} displayName={relatedName} /></span><span><strong>{relatedName}</strong><small>{related.coupon_count || 0} active {(related.coupon_count || 0) === 1 ? 'offer' : 'offers'}</small></span><i className="fa-solid fa-chevron-right" aria-hidden="true" /></Link>;
                })}</div></section>}
            </main>
        </div>
        <CouponModal coupon={activeCoupon} isOpen={Boolean(activeCoupon)} onClose={() => setActiveCoupon(null)} />
    </section>;
}
