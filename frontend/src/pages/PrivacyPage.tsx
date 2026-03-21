import { useSEO } from '@/hooks/useSEO';

export function PrivacyPage() {
    useSEO({
        title: 'Privacy Policy - CouponPush',
        description: 'Read the CouponPush Privacy Policy. Learn how we collect, use, and protect your personal information when you use our coupon platform.',
        url: 'https://couponpush.com/privacy'
    });

    return (
        <div className="legal-page">
            <section className="legal-hero">
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p className="legal-updated">Last Updated: January 2026</p>
                </div>
            </section>

            <section className="legal-content">
                <div className="container">
                    <div className="legal-card">
                        <h2>1. Introduction</h2>
                        <p>
                            CouponPush ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                            explains how we collect, use, disclose, and safeguard your information when you visit our website
                            couponpush.com.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <h3>2.1 Personal Information</h3>
                        <p>We may collect personal information that you voluntarily provide, including:</p>
                        <ul>
                            <li>Name and email address (when subscribing to our newsletter)</li>
                            <li>Contact information (when using our contact form)</li>
                            <li>Any other information you choose to provide</li>
                        </ul>

                        <h3>2.2 Automatically Collected Information</h3>
                        <p>When you visit our website, we automatically collect:</p>
                        <ul>
                            <li>IP address and browser type</li>
                            <li>Device information (mobile, desktop, tablet)</li>
                            <li>Pages visited and time spent on pages</li>
                            <li>Referring website and search terms</li>
                            <li>Cookies and similar tracking technologies</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>We use the collected information to:</p>
                        <ul>
                            <li>Send you newsletters with the latest deals and coupons</li>
                            <li>Respond to your inquiries and provide customer support</li>
                            <li>Improve our website and user experience</li>
                            <li>Analyze usage patterns and optimize our services</li>
                            <li>Send promotional communications (with your consent)</li>
                            <li>Comply with legal obligations</li>
                        </ul>

                        <h2>4. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar technologies to enhance your experience. You can control cookies
                            through your browser settings. Types of cookies we use:
                        </p>
                        <ul>
                            <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                            <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
                        </ul>

                        <h2>5. Third-Party Disclosure</h2>
                        <p>We may share your information with:</p>
                        <ul>
                            <li>Analytics providers (Google Analytics)</li>
                            <li>Advertising networks</li>
                            <li>Email service providers</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                        <p>We do not sell your personal information to third parties.</p>

                        <h2>6. Data Security</h2>
                        <p>
                            We implement appropriate security measures to protect your personal information. However,
                            no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                        </p>

                        <h2>7. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access and receive a copy of your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Withdraw consent at any time</li>
                        </ul>

                        <h2>8. Children's Privacy</h2>
                        <p>
                            Our website is not intended for children under 13 years of age. We do not knowingly collect
                            personal information from children under 13.
                        </p>

                        <h2>9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by
                            posting the new Privacy Policy on this page with an updated date.
                        </p>

                        <h2>10. Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy, please contact us at:<br />
                            <strong>Email:</strong> privacy@couponpush.com<br />
                            <strong>Website:</strong> <a href="https://couponpush.com/contact">couponpush.com/contact</a>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default PrivacyPage;
