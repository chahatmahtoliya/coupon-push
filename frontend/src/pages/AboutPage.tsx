import { useSEO } from '@/hooks/useSEO';

export function AboutPage() {
    useSEO({
        title: 'About Us - CouponPush | India\'s Trusted Coupon & Deals Platform',
        description: 'Learn about CouponPush, India\'s trusted destination for verified coupon codes, promo codes, and exclusive deals. Real-time updates and 100% verified coupons.',
        url: 'https://couponpush.com/about'
    });

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <h1>About CouponPush</h1>
                    <p className="about-hero-subtitle">
                        India's trusted destination for coupon codes, promo codes, and exclusive deals from top brands.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-section">
                <div className="container">
                    <div className="about-content" style={{ maxWidth: '800px' }}>
                        <span className="section-badge">Our Mission</span>
                        <h2>Helping You Save More, Every Day</h2>
                        <p>
                            At CouponPush, our mission is simple: <strong>help shoppers save money on every purchase</strong>.
                            We believe everyone deserves access to the best deals, discounts, and promo codes from their favorite brands.
                        </p>
                        <p>
                            We work directly with top brands and retailers to bring you exclusive coupon codes that you won't find anywhere else.
                            Our team verifies every coupon to ensure you never waste time on expired or invalid codes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="about-section bg-light">
                <div className="container">
                    <div className="section-header-center">
                        <span className="section-badge">Why CouponPush?</span>
                        <h2>What Makes Us Different</h2>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h3>100% Verified Coupons</h3>
                                <p>Every coupon is manually verified by our team before going live. No more expired or fake codes.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-bolt"></i>
                                </div>
                                <h3>Real-Time Updates</h3>
                                <p>We update our coupons daily to ensure you always have access to the latest deals and offers.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-star"></i>
                                </div>
                                <h3>Exclusive Deals</h3>
                                <p>Get exclusive coupons negotiated directly with brands - deals you won't find anywhere else.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Brands Section */}
            <section className="about-section about-brands">
                <div className="container">
                    <div className="brands-content" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
                        <span className="section-badge">For Brands</span>
                        <h2>Promote Your Brand on CouponPush</h2>
                        <p>
                            Looking to reach deal-seeking shoppers? Partner with CouponPush to promote your brand,
                            offers, and exclusive deals to our engaged audience.
                        </p>
                        <a href="/contact" className="btn-primary-cta">
                            Partner With Us <i className="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="about-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Start Saving Today!</h2>
                        <p>Join millions of smart shoppers who never pay full price.</p>
                        <a href="/" className="btn-cta-white">
                            Browse All Coupons <i className="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutPage;
