import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Contact CouponPush with questions, corrections or partnership enquiries.',
    alternates: { canonical: 'https://couponpush.com/contact/' },
};

export default function ContactPage() {
    return (
        <section className="container py-5 legal-page">
            <h1>Contact Us</h1>
            <p>Have a question, found an expired coupon, or want to discuss a partnership? We would love to hear from you.</p>
            <div className="contact-info-card mt-4">
                <h2>Email CouponPush</h2>
                <p><a href="mailto:contact@couponpush.com">contact@couponpush.com</a></p>
            </div>
        </section>
    );
}
