import type { Metadata } from 'next';
import Link from '@/components/common/SiteLink';
import styles from '../partners/partners.module.css';
import { partnersEnabled } from '@/lib/partners-feature';

export const metadata: Metadata = {
    title: 'List Your Brand on CouponPush',
    description: 'Submit your store, coupon codes and shopping offers to CouponPush. Create a brand account, follow your review and manage offers in one workspace.',
    alternates: { canonical: 'https://couponpush.com/list-a-store/' },
    robots: { index: partnersEnabled, follow: true },
};
export default function ListAStorePage() {
    return <div className={styles.landing}>
        <div className={styles.landingShell}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>List your brand</span></nav>
            <div className={styles.landingGrid}>
                <section className={styles.landingCopy}>
                    <h1>Your brand.<br />Your offers.<br /><span>One place to manage them.</span></h1>
                    <p>Bring your store to CouponPush. Share coupon codes and no-code deals, follow every review, and keep your offers up to date.</p>
                    <div className={styles.actions}><Link className={styles.primary} href="/partners/?mode=signup">Create a brand account <i className="fas fa-arrow-right" aria-hidden="true" /></Link><Link className={styles.textLink} href="/partners/">Already a partner? Sign in</Link></div>
                    <p className={styles.small}>For store owners, employees and authorized agencies. Every submission is reviewed before publication.</p>
                </section>
                <section className={styles.process} aria-labelledby="how-it-works">
                    <h2 id="how-it-works">From your store to our shoppers</h2>
                    <ol>
                        <li><span className={styles.stepNumber}>1</span><div><h3>Create your account</h3><p>Verify your business email and open your workspace.</p></div></li>
                        <li><span className={styles.stepNumber}>2</span><div><h3>Tell us about your brand</h3><p>Add your website, category, logo and authorization details.</p></div></li>
                        <li><span className={styles.stepNumber}>3</span><div><h3>Add offers and submit</h3><p>Include working links, clear conditions and accurate dates.</p></div></li>
                        <li><span className={styles.stepNumber}>4</span><div><h3>Follow every update</h3><p>See feedback, approvals and publication progress in your dashboard.</p></div></li>
                    </ol>
                </section>
            </div>
            <section className={styles.landingDetails} aria-labelledby="workspace-benefits"><h2 id="workspace-benefits">A workspace that stays with your brand.</h2><div className={styles.benefitRows}><div><h3>Keep every offer in view</h3><p>Draft, in review, active or expired. See where each offer stands and what needs your attention.</p></div><div><h3>Make changes with confidence</h3><p>Save drafts, respond to feedback, renew offers and withdraw a promotion when it ends.</p></div><div><h3>See how shoppers engage</h3><p>Track offer views and clicks. These show engagement; purchases and redemptions are not measured.</p></div></div></section>
            <section className={styles.faq} aria-labelledby="brand-questions"><h2 id="brand-questions">Before you submit</h2><details><summary>Can I submit an existing store?</summary><p>If your brand is already listed, <Link href="/contact/">contact CouponPush</Link> for an ownership review. A matching email address does not automatically grant access.</p></details><details><summary>What should I prepare?</summary><p>Your official website, business contact details, a short brand introduction, evidence that you can represent the brand, and at least one coupon or no-code deal with its terms.</p></details><details><summary>What happens after approval?</summary><p>Your store becomes available through the live directory. Your dashboard tracks the website update separately and shows when the approved version is published.</p></details><details><summary>What am I agreeing to?</summary><p>You confirm that you are authorized to represent the brand and that the information and offers you submit are accurate. CouponPush may request evidence, decline submissions or remove misleading offers. Publication and featured placement are subject to review. Account data is handled under our <Link href="/privacy-policy/">privacy policy</Link> and <Link href="/terms/">site terms</Link>.</p></details></section>
            <div className={styles.landingEnd}><h2>Ready to introduce your brand?</h2><Link className={styles.primary} href="/partners/?mode=signup">Create your account <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div>
        </div>
    </div>;
}
