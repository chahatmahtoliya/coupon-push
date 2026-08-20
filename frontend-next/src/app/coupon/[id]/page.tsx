import type { Metadata } from 'next';
import { couponsApi } from '@/services/api';
import CouponPageClient from './CouponPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';

const fallbackCouponIds = ['12','14','15','18','19','20','21','22','23','24','25','26','27','30','32','33','34','35'];

export const dynamicParams = false;

export async function generateStaticParams() {
    try {
        const coupons = await couponsApi.getLatest(500);
        return coupons.map((coupon) => ({ id: String(coupon.id) }));
    } catch {
        return Array.from(new Set([...fallbackCouponIds, ...Object.keys(deployedSnapshot.coupons)])).map((id) => ({ id }));
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const coupon = await couponsApi.getById(Number(id));
        return { title: coupon.title, description: coupon.description || `Get this verified ${coupon.store_name} offer.` };
    } catch {
        return { title: 'Coupon Offer', description: 'View this verified coupon offer on CouponPush.' };
    }
}

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let initialCoupon = deployedSnapshot.coupons[id] || null;
    try {
        initialCoupon = await couponsApi.getById(Number(id));
    } catch (error) {
        console.error(`Failed to fetch coupon ${id}:`, error);
    }
    return <CouponPageClient initialCoupon={initialCoupon} id={id} />;
}
