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
            <p>Last updated: October 12, 2026</p>
            <h2>Information we collect</h2>
            <p>We may collect basic usage information, messages you submit, and technical data needed to operate and secure the website.</p>
            <h2>How information is used</h2>
            <p>Information is used to provide the service, improve site performance, respond to enquiries, and prevent misuse.</p>
            <h2>Brand accounts and submissions</h2>
            <p>If you create a brand account, we store your name, email address, a protected password hash, email-verification status and acceptance of our terms. Your saved store details, offers, authorization information and review history are used to review and manage your listing. Authorization information and account credentials are kept private; approved store information, logos and offers become public.</p>
            <p>We use a session cookie to keep you signed in and send verification, password-reset and submission-update emails. You can contact us about access to your account data or account removal.</p>
            <h2>Offer engagement</h2>
            <p>For participating brands, we count store and offer views using a random browser-session identifier and deduplicate repeat views. We store a hashed event identifier rather than that raw session identifier. Offer clicks use our existing click counter and can include opening coupon details. These measurements do not track merchant purchases or coupon redemptions.</p>
            <h2>Third-party links</h2>
            <p>CouponPush links to merchant websites. Their privacy practices and terms apply when you visit them.</p>
            <h2>Contact</h2>
            <p>Questions about this policy can be sent to <a href="mailto:contact@couponpush.com">contact@couponpush.com</a>.</p>
        </section>
    );
}
