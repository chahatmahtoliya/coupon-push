import type { Metadata } from 'next';
import CouponPageClient from './CouponPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

export const dynamicParams = false;

export async function generateStaticParams() {
    return Object.keys(deployedSnapshot.coupons).map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const canonical = `https://couponpush.com/coupon/${id}/`;
    let coupon = deployedSnapshot.coupons[id] || null;

    const title = coupon?.title || 'Coupon Offer';
    const description = coupon?.description || 'View this coupon offer on CouponPush.';

    return {
        title,
        description,
        alternates: { canonical },
        robots: { index: false, follow: true },
        openGraph: { type: 'website', url: canonical, title, description },
    };
}

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let initialCoupon = deployedSnapshot.coupons[id] || null;
    return <CouponPageClient initialCoupon={initialCoupon} id={id} />;
}
