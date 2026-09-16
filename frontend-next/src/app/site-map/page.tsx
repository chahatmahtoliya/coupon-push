import type { Metadata } from 'next';
import Link from '@/components/common/SiteLink';
import { getSiteNavigation } from '@/lib/site-navigation';

export const metadata: Metadata = {
    title: 'Site Map — Stores, Categories, Guides & Tools',
    description: 'Find your way around CouponPush: browse coupon stores, shopping categories, guides, calculators and site information.',
    alternates: { canonical: 'https://couponpush.com/site-map/' },
};
export default function SiteMapPage() {
    const site = getSiteNavigation();
    const groups = [{ title: 'Browse and site information', links: site.pages }, { title: 'Coupon stores', links: site.stores }, { title: 'Shopping categories', links: site.categories }, { title: 'Blog and shopping guides', links: site.blog }, { title: 'Calculators and tools', links: site.tools }];
    return <section className="container site-directory"><nav aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Site map</span></nav><h1>Find your way around CouponPush</h1><p>Browse offers by store or category, read a shopping guide, or check the numbers with a calculator.</p><div className="site-directory-grid">{groups.map(group => <section key={group.title}><h2>{group.title}</h2><ul>{group.links.map(link => <li key={link.path}><Link href={link.path}>{link.title}</Link></li>)}</ul></section>)}</div></section>;
}
