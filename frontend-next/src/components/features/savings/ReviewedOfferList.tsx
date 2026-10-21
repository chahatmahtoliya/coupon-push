import Link from '@/components/common/SiteLink';
import { getStorePath } from '@/lib/routes';
import { reviewedStoreName, type ReviewedOffer } from '@/lib/savings-pages';
import { CopyOfferCode } from './CopyOfferCode';
import styles from './savings.module.css';

export function ReviewedOfferList({ offers }: { offers: ReviewedOffer[] }) {
    return <div className={styles.offerList}>{offers.map(offer => <article className={styles.offer} key={offer.id} id={offer.id}>
        <div className={styles.offerHeading}><Link href={getStorePath(offer.storeSlug)}>{reviewedStoreName(offer.storeSlug)}</Link><span>Merchant advertised</span></div>
        <h3>{offer.title}</h3>
        <ul>{offer.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>
        {offer.code ? <CopyOfferCode code={offer.code} /> : <p className={styles.noCode}>No code stated in the reviewed banner.</p>}
        <div className={styles.evidence}><p>Source checked <time dateTime={offer.checkedAt}>{new Date(offer.checkedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time>. Not checkout-tested. End date not stated in the matched wording.</p><a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Check ${reviewedStoreName(offer.storeSlug)} offer on the merchant website`}>Check merchant offer<i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></a></div>
    </article>)}</div>;
}
