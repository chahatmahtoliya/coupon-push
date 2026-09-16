import type { Coupon } from '@/types';
import { offerCheckedDate, offerEvidenceLabel, offerSource } from '@/lib/offer-evidence';

export function OfferEvidence({ coupon }: { coupon: Coupon }) {
    const source = offerSource(coupon);
    const checked = offerCheckedDate(coupon);
    return <div className="offer-evidence">
        <span>{offerEvidenceLabel(coupon)}</span>
        <span>{checked ? `Source checked ${checked}` : 'Check date not recorded'}</span>
        {source && <a href={source} target="_blank" rel="noopener noreferrer">Offer source</a>}
        <a href={`mailto:contact@couponpush.com?subject=${encodeURIComponent(`Coupon issue: ${coupon.store_name} offer ${coupon.id}`)}&body=${encodeURIComponent(`Offer: ${coupon.title}\nOffer ID: ${coupon.id}\n\nWhat happened at checkout: `)}`}>Report an issue</a>
    </div>;
}
