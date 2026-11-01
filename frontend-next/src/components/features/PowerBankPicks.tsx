'use client';

import { CouponCard } from '@/components/features/CouponCard';
import { shoppingPicks } from '@/lib/power-bank-shopping';
import type { Coupon } from '@/types';

export function PowerBankPicks({ offers }: { offers: Coupon[] }) {
    const picks = shoppingPicks(offers);
    if (!picks.length) return null;
    return <section className="pb-picks" aria-labelledby="pb-picks-title">
        <div className="pb-section-heading"><div><h2 id="pb-picks-title">Less searching. More charging.</h2><p>Three shortcuts into the current listings.</p></div><a href="#pb-all-deals">Compare all deals <span aria-hidden="true">↗</span></a></div>
        <div className="pb-picks-grid">{picks.map(pick => <div className="pb-pick" key={pick.offer.id}><div className="pb-pick-heading"><h3>{pick.label}</h3><p>{pick.note}</p></div><CouponCard coupon={pick.offer} variant="category" shopping /></div>)}</div>
        <p className="pb-picks-note">Selected by listed price, capacity and advertised wattage. Confirm compatibility and the final price with the seller.</p>
    </section>;
}
