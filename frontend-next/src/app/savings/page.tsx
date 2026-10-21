import type { Metadata } from 'next';
import Link from '@/components/common/SiteLink';
import { getSavingsPages } from '@/lib/savings-pages';
import styles from '@/components/features/savings/savings.module.css';

export function generateMetadata(): Metadata {
    return { title: 'Compare Shopping Offers by Savings Type', description: 'Compare sourced shopping promotions by the conditions that matter: eligible products, gift thresholds and coupon requirements.', alternates: { canonical: 'https://couponpush.com/savings/' }, robots: { index: getSavingsPages().some(page => page.eligible), follow: true } };
}
export default function SavingsPage() {
    const pages = getSavingsPages().filter(page => page.eligible);
    return <div className={styles.page}><div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">Compare offers</span></nav>
        <header className={styles.heading}><h1>Find an offer that fits your basket</h1><p>Compare shopping promotions by their conditions. Check what you need to buy, which code applies, and what the merchant actually advertises.</p></header>
        {pages.length ? <div className={styles.collections}>{pages.map(page => <article className={styles.collection} key={page.slug}><h2>{page.title}</h2><p>{page.intro}</p><p>{page.offers.length} sourced listings across {page.stores.length} stores</p><Link href={page.path}>Compare offers<i className="fas fa-arrow-right" aria-hidden="true" /></Link></article>)}</div> : <p>We’re checking the merchant sources for these comparisons. <Link href="/stores/">Browse stores</Link> in the meantime.</p>}
        <section className={styles.method}><h2>How these comparisons are maintained</h2><p>Each listing links to a merchant page and shows when its advertised wording was checked. Source matching does not establish that a code works at checkout, that offers combine, or that an account qualifies.</p><p>Listings whose wording cannot be found or whose source checks have aged out are withheld from the comparisons. We do not infer a promotion’s end date when the reviewed banner does not state one.</p><p>Compare the final amount payable for the same basket. Gift values, future rewards and headline percentages are different benefits; they should not be added together as cash savings.</p><Link href="/about/#offer-checks">Read how CouponPush labels offers</Link></section>
    </div></div>;
}
