import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Understand CouponPush offer labels, source checks, affiliate links and how to report a coupon issue.',
    alternates: { canonical: 'https://couponpush.com/about/' },
};

export default function AboutPage() {
    return (
        <section className="container py-5 legal-page">
            <h1>About CouponPush</h1>
            <p>CouponPush brings together coupon codes, promotional offers and online deals so shoppers can compare ways to save.</p>
            <h2>Our mission</h2>
            <p>We make saving money easier by organising offers in one place and regularly checking the information shown on our pages.</p>
            <h2>How we work</h2>
            <p>Our team collects offers from merchants and public promotions, reviews their details, and makes it easy to visit the relevant store.</p>
            <h2 id="offer-checks">How to read offer checks</h2>
            <p>Merchant advertised means a recorded source and check date are available. Checkout tested means the listing also records a checkout test. A past check does not guarantee an offer will work for every account, product or payment method.</p>
            <p>When a check date or method is missing, we show that it is not recorded. A listing update date is not a coupon test date. Check the merchant’s current terms, expiry and final payable amount before ordering.</p>
            <h2>Affiliate links and rewards</h2>
            <p>Some merchant links may be affiliate links, which means CouponPush may earn a commission from a qualifying purchase. Reward points and wallet credits are separate from the discount on your current order; check their redemption limits and expiry.</p>
            <h2>Report a coupon issue</h2>
            <p>Email <a href="mailto:contact@couponpush.com">contact@couponpush.com</a> with the store, offer title or ID, and what did not work. Do not send passwords, payment details or other sensitive account information.</p>
        </section>
    );
}
