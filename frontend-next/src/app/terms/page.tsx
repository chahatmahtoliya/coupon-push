import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Read the terms governing use of CouponPush.',
};

export default function TermsPage() {
    return (
        <section className="container py-5 legal-page">
            <h1>Terms of Service</h1>
            <p>By using CouponPush, you agree to use the website lawfully and understand that offers can change without notice.</p>
            <h2>Offer availability</h2>
            <p>Coupon codes and deals are supplied by third parties. Final prices, eligibility and availability are determined by the merchant.</p>
            <h2>Affiliate disclosure</h2>
            <p>CouponPush may earn a commission when you follow certain merchant links, without increasing your purchase price.</p>
            <h2>Limitation of liability</h2>
            <p>We work to keep information accurate but cannot guarantee that every promotion will remain available or work for every order.</p>
        </section>
    );
}
