import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn how CouponPush finds and verifies coupon codes, promotions and online deals.',
    alternates: { canonical: 'https://couponpush.com/about/' },
};

export default function AboutPage() {
    return (
        <section className="container py-5 legal-page">
            <h1>About CouponPush</h1>
            <p>CouponPush helps shoppers discover verified coupon codes, promotional offers and online deals from popular stores.</p>
            <h2>Our mission</h2>
            <p>We make saving money easier by organising offers in one place and regularly checking the information shown on our pages.</p>
            <h2>How we work</h2>
            <p>Our team collects offers from merchants and public promotions, reviews their details, and makes it easy to visit the relevant store.</p>
        </section>
    );
}
