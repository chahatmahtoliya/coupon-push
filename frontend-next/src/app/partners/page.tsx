import type { Metadata } from 'next';
import PartnerPortal from './PartnerPortal';

export const metadata: Metadata = {
    title: 'Brand Workspace',
    description: 'Sign in to your CouponPush brand workspace to manage your store, submit offers and track review updates.',
    alternates: { canonical: 'https://couponpush.com/partners/' },
    robots: { index: false, follow: true },
};
export default function PartnersPage() { return <PartnerPortal />; }
