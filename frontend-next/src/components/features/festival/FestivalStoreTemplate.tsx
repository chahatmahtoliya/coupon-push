'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/common/SiteLink';
import { storesApi } from '@/services/api';
import { getFestivalCampaign, toFestivalProducts } from '@/lib/festival-template';
import type { StorePageData } from '@/types';
import FestivalDeals from './FestivalDeals';

export default function FestivalStoreTemplate({ initialData, slug }: { initialData: StorePageData | null; slug: string }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setError('');
        storesApi.getBySlugFresh(slug).then(result => {
            if (result?.store?.slug !== slug || !Array.isArray(result.coupons) || result.coupons.some(coupon => Number(coupon.store_id) !== Number(result.store.id))) throw new Error('Invalid store response');
            if (active) setData(result);
        }).catch((reason: unknown) => {
            if (!active) return;
            const removed = reason instanceof Error && /API Error: (404|410)/.test(reason.message);
            if (removed) setData(null);
            setError(removed ? 'This store is not available yet.' : 'We could not refresh these offers. Please try again.');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slug, attempt]);
    const campaign = useMemo(() => getFestivalCampaign(data?.store || null, slug), [data, slug]);
    const deals = useMemo(() => toFestivalProducts(data?.coupons || [], campaign.merchantUrl, new Date(), campaign.merchant), [data, campaign.merchantUrl, campaign.merchant]);
    const sources = [...new Set(deals.flatMap(deal => deal.sourceUrl ? [deal.sourceUrl] : []))];
    const reviewedAt = deals.map(deal => deal.checkedAt?.slice(0, 10) || '').filter(Boolean).sort().at(-1);
    const start = campaign.startDate && /^\d{4}-\d{2}-\d{2}$/.test(campaign.startDate) ? new Date(`${campaign.startDate}T12:00:00`) : null;
    const startLabel = start && !Number.isNaN(start.getTime()) ? new Intl.DateTimeFormat('en-IN', {day:'numeric', month:'long'}).format(start) : '';
    return <div className="festival-page"><div className="festival-shell">
        <nav className="festival-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/stores/">Stores</Link><span aria-hidden="true">/</span><span aria-current="page">{campaign.name}</span></nav>
        <section className="festival-hero" aria-labelledby="festival-title">
            <div className="festival-hero-copy">
                <p className="festival-merchant"><img src={campaign.logo} alt="" width="32" height="32" />{campaign.merchant}{campaign.amazon ? ' India' : ''}</p>
                <h1 id="festival-title">{campaign.name.replace(/\s(\d{4})$/, '')}{/\s\d{4}$/.test(campaign.name) && <> <span>{campaign.name.slice(-4)}</span></>}</h1>
                <p className="festival-intro">{campaign.intro}</p>
                {startLabel && <p className="festival-date"><i className="far fa-calendar" aria-hidden="true" />Festival start date: <strong>{startLabel}</strong></p>}
            </div>
            <div className="festival-hero-actions">{campaign.merchantUrl && <a href={campaign.merchantUrl} className="festival-primary" target="_blank" rel="noopener noreferrer">Shop {campaign.merchant} deals <i className="fas fa-arrow-right" aria-hidden="true" /></a>}<a href="#festival-deals" className="festival-text-link">View all <i className="fas fa-arrow-right" aria-hidden="true" /></a></div>
        </section>
        <div className="festival-benefits">
            <p><i className="far fa-credit-card" aria-hidden="true" /><span><strong>{campaign.bankOffer || 'Check payment offers'}</strong><small>Eligible cards and EMI; terms apply</small></span></p>
            <p><i className="fas fa-box-open" aria-hidden="true" /><span><strong>{campaign.memberOffer || 'Explore member benefits'}</strong><small>Benefits vary by product and offer</small></span></p>
            <p><i className="far fa-clock" aria-hidden="true" /><span><strong>{deals.length ? `${deals.length} active offers` : 'New offers on the way'}</strong><small>{reviewedAt ? `Source reviewed ${reviewedAt}` : 'Confirm current details with the merchant'}</small></span></p>
        </div>
        {(loading || error) && <div className="festival-feed-status" role="status"><span>{loading ? 'Loading the latest store offers…' : error}{error && data ? ' Showing the last published offers.' : ''}</span>{error && <button type="button" onClick={() => {setLoading(true); setAttempt(value => value + 1);}}>Try again</button>}</div>}
        <FestivalDeals deals={deals} campaign={campaign} />
        <section className="festival-shopping-note" aria-labelledby="festival-checkout-title"><div><h2 id="festival-checkout-title">The best deal is the final price.</h2><p>Check the exact variant, seller, coupon and bank eligibility. Compare exchange and EMI costs separately before paying.</p></div><Link href="/blog/tools/emi-calculator">Compare EMI costs <i className="fas fa-arrow-right" aria-hidden="true" /></Link></section>
        <section id="store-ui-faqs" className="festival-faq" aria-labelledby="festival-faq-title"><div className="festival-section-heading"><h2 id="festival-faq-title">Your festival questions, answered.</h2><p>Dates, prices and the small print.</p></div><div className="festival-faq-list">{campaign.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<i className="fas fa-plus" aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div></section>
        <footer className="festival-sources"><h2>Sources & offer details</h2>{campaign.sourceUrl && <p>Campaign dates and benefits: <a href={campaign.sourceUrl} target="_blank" rel="noopener noreferrer">Merchant announcement</a>.</p>}{sources.length > 0 && <p>Product and coupon sources: {sources.slice(0, 5).map((source,index) => <span key={source}>{index > 0 ? ', ' : ''}<a href={source} target="_blank" rel="noopener noreferrer">Offer source {index + 1}</a></span>)}{reviewedAt ? `. Latest source review: ${reviewedAt}.` : '.'}</p>}<p>Availability and prices can change. Bank and membership benefits are conditional; coupons are not automatically combined with the displayed price. {campaign.merchant} sets the final checkout total. Images and trademarks belong to their respective owners. <Link href="/terms/">Affiliate disclosure</Link>.</p>{campaign.amazon && <Link href="/store/amazon/">Browse all Amazon offers <i className="fas fa-arrow-right" aria-hidden="true" /></Link>}</footer>
    </div></div>;
}
