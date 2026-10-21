import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from '@/components/common/SiteLink';
import { getSavingsPages } from '@/lib/savings-pages';
import { ReviewedOfferList } from '@/components/features/savings/ReviewedOfferList';
import styles from '@/components/features/savings/savings.module.css';

export const dynamicParams = false;
export function generateStaticParams() {
    return getSavingsPages().filter(page => page.published || page.eligible).map(page => ({ intent: page.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ intent: string }> }): Promise<Metadata> {
    const { intent } = await params;
    const page = getSavingsPages().find(item => item.slug === intent && (item.published || item.eligible));
    if (!page) notFound();
    return { title: page.title, description: page.description, alternates: { canonical: `https://couponpush.com${page.path}` }, robots: { index: page.eligible, follow: true }, openGraph: { title: page.title, description: page.description, url: `https://couponpush.com${page.path}`, type: 'website' } };
}
export default async function SavingsCollectionPage({ params }: { params: Promise<{ intent: string }> }) {
    const { intent } = await params;
    const page = getSavingsPages().find(item => item.slug === intent && (item.published || item.eligible));
    if (!page) notFound();
    const visibleOffers = page.eligible ? page.offers : [];
    const schema = [
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: page.title, description: page.description, url: `https://couponpush.com${page.path}`, dateModified: page.lastModified, mainEntity: { '@type': 'ItemList', numberOfItems: visibleOffers.length, itemListElement: visibleOffers.map((offer, index) => ({ '@type': 'ListItem', position: index + 1, name: offer.title, url: `https://couponpush.com${page.path}#${offer.id}` })) } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://couponpush.com/' }, { '@type': 'ListItem', position: 2, name: 'Compare offers', item: 'https://couponpush.com/savings/' }, { '@type': 'ListItem', position: 3, name: page.title, item: `https://couponpush.com${page.path}` }] },
    ];
    return <div className={styles.page}><div className={styles.shell}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><Link href="/savings/">Compare offers</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">{intent === 'skincare' ? 'Skincare' : 'Free gifts'}</span></nav>
        <header className={styles.heading}><h1>{page.title}</h1><p>{page.intro}</p><div className={styles.summary}>{page.offers.length} source-matched listings · {page.stores.length} stores · Conditions reviewed by CouponPush</div></header>
        <div className={styles.notice}><p>These are merchant advertisements, not checkout-tested savings. Eligibility, stock and terms can change. Confirm the final price and any gifts before paying. <Link href="/about/#offer-checks">How we label offers</Link></p></div>
        <nav className={styles.navigation} aria-label="On this page"><a href="#compare">Compare listings</a><a href="#shopping-checklist">Before checkout</a><a href="#questions">Questions</a><Link href="/savings/">Other comparisons</Link></nav>
        <div className={styles.layout}><div className={styles.content}>
            <section id="compare"><h2>Compare the advertised conditions</h2>{page.eligible ? <ReviewedOfferList offers={page.offers} /> : <p>This comparison is being rechecked and has too few source-matched listings to publish a useful selection. <Link href="/stores/">Browse stores</Link> for other offers.</p>}</section>
            {page.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
            <section id="questions"><h2>Questions before you order</h2>{page.faqs.map(faq => <article className={styles.faq} key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</section>
        </div><aside className={styles.aside} id="shopping-checklist"><h2>Before checkout</h2><ul>{page.checklist.map(item => <li key={item}>{item}</li>)}</ul></aside></div>
    </div></div>;
}
