import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            // In a real app, this would call an API
            setSubscribed(true);
            setEmail('');
        }
    };

    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="container">
                    <div className="row">
                        {/* About */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="footer-widget">
                                <div className="footer-logo">
                                    <a href="https://couponpush.com">
                                        <img
                                            src="/assets/images/logo.png"
                                            alt="CouponPush - Best Coupons & Deals"
                                            className="footer-logo-image"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </a>
                                </div>
                                <p className="footer-about">
                                    Your one-stop destination for the best coupons, deals, and offers
                                    from top brands. Save money on every purchase!
                                </p>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="col-lg-2 col-md-6 mb-4">
                            <div className="footer-widget">
                                <h4 className="footer-title">Quick Links</h4>
                                <ul className="footer-links">
                                    <li><Link to="/">Home</Link></li>
                                    <li><Link to="/stores">All Stores</Link></li>
                                    <li><Link to="/categories">Categories</Link></li>
                                    <li><Link to="/about">About Us</Link></li>
                                    <li><Link to="/contact">Contact Us</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="col-lg-2 col-md-6 mb-4">
                            <div className="footer-widget">
                                <h4 className="footer-title">Legal</h4>
                                <ul className="footer-links">
                                    <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                    <li><Link to="/terms">Terms of Service</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="footer-widget">
                                <h4 className="footer-title">Newsletter</h4>
                                <p className="footer-newsletter-text">
                                    Subscribe to get the latest deals and offers directly in your inbox!
                                </p>
                                {subscribed ? (
                                    <div className="newsletter-success">
                                        <i className="fas fa-check-circle"></i> Thanks for subscribing!
                                    </div>
                                ) : (
                                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <button type="submit">
                                            <i className="fas fa-paper-plane"></i>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <p className="copyright">
                                © {new Date().getFullYear()} CouponPush. All rights reserved.
                            </p>
                        </div>
                        <div className="col-md-6">
                            <ul className="footer-bottom-links">
                                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                <li><Link to="/terms">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
