import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Read the CouponPush privacy policy.',
    alternates: { canonical: 'https://couponpush.com/privacy-policy/' },
};

export default function PrivacyPolicyPage() {
    return (
        <section className="container py-5 legal-page">
            <h1>Privacy Policy</h1>
            <p>Last updated: August 20, 2026</p>
            <h2>Information we collect</h2>
            <p>We may collect basic usage information, messages you submit, and technical data needed to operate and secure the website.</p>
            <h2>How information is used</h2>
            <p>Information is used to provide the service, improve site performance, respond to enquiries, and prevent misuse.</p>
            <h2>Third-party links</h2>
            <p>CouponPush links to merchant websites. Their privacy practices and terms apply when you visit them.</p>
            <h2>Contact</h2>
            <p>Questions about this policy can be sent to <a href="mailto:contact@couponpush.com">contact@couponpush.com</a>.</p>
        </section>
    );
}
