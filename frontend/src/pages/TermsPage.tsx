import { useSEO } from '@/hooks/useSEO';

export function TermsPage() {
    useSEO({
        title: 'Terms & Conditions - CouponPush',
        description: 'Review the Terms & Conditions for CouponPush. Discover the rules, limitations, and user agreements for utilizing our coupon and deals platform.',
        url: 'https://couponpush.com/terms'
    });

    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>Terms & Conditions</h1>
                    <p className="legal-updated">Last Updated: January 2026</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-card">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using CouponPush (couponpush.com), you accept and agree to be bound by the terms
                            and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            CouponPush provides a platform for users to discover coupon codes, promo codes, deals, and offers
                            from various online retailers and brands. We aggregate and curate deals to help users save money on their purchases.
                        </p>

                        <h2>3. Use of Coupons and Deals</h2>
                        <p>All coupons, promo codes, and deals available on CouponPush are subject to the following:</p>
                        <ul>
                            <li>Coupons are provided by third-party retailers and are subject to their terms and conditions</li>
                            <li>We do not guarantee the validity or availability of any coupon code</li>
                            <li>Coupons may expire without prior notice</li>
                            <li>Some coupons may have minimum purchase requirements or product restrictions</li>
                            <li>CouponPush is not responsible for any issues arising from the use of coupon codes</li>
                        </ul>

                        <h2>4. User Conduct</h2>
                        <p>Users agree to:</p>
                        <ul>
                            <li>Use the website for lawful purposes only</li>
                            <li>Not attempt to manipulate or abuse the coupon system</li>
                            <li>Not scrape, copy, or redistribute our content without permission</li>
                            <li>Not submit false or misleading information</li>
                        </ul>

                        <h2>5. Intellectual Property</h2>
                        <p>
                            All content on CouponPush, including but not limited to text, graphics, logos, and software,
                            is the property of CouponPush or its content suppliers and is protected by intellectual property laws.
                        </p>

                        <h2>6. Third-Party Links</h2>
                        <p>
                            CouponPush contains links to third-party websites. We are not responsible for the content,
                            privacy policies, or practices of any third-party websites. Users access these sites at their own risk.
                        </p>

                        <h2>7. Disclaimer of Warranties</h2>
                        <p>
                            CouponPush is provided "as is" without any warranties, express or implied. We do not warrant that
                            the service will be uninterrupted, error-free, or that defects will be corrected.
                        </p>

                        <h2>8. Limitation of Liability</h2>
                        <p>
                            CouponPush shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                            resulting from your use or inability to use the service.
                        </p>

                        <h2>9. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the website after any
                            changes constitutes acceptance of the new terms.
                        </p>

                        <h2>10. Contact Information</h2>
                        <p>
                            For any questions regarding these Terms & Conditions, please contact us at:<br />
                            <strong>Email:</strong> legal@couponpush.com<br />
                            <strong>Website:</strong> <a href="https://couponpush.com/contact">couponpush.com/contact</a>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default TermsPage;
