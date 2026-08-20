import Link from 'next/link';

export function Footer() {
    return (
        <footer className="cp-footer">
            <div className="cp-container cp-footer-grid">
                <div className="cp-footer-brand">
                    <Link aria-label="CouponPush home" className="cp-footer-logo-link" href="/">
                        <img src="/assets/home-ui/logo-transparent.png" alt="CouponPush" className="cp-footer-logo-image" width="164" height="38" />
                    </Link>
                    <p>Your one-stop destination for the best coupons, deals & offers from top brands. Save more, shop smart!</p>
                    <div className="cp-social-row">
                        <a href="https://facebook.com" aria-label="CouponPush on Facebook"><i className="fab fa-facebook-f" aria-hidden="true" /></a>
                        <a href="https://twitter.com" aria-label="CouponPush on Twitter"><i className="fab fa-twitter" aria-hidden="true" /></a>
                        <a href="https://instagram.com" aria-label="CouponPush on Instagram"><i className="fab fa-instagram" aria-hidden="true" /></a>
                        <a href="https://youtube.com" aria-label="CouponPush on YouTube"><i className="fab fa-youtube" aria-hidden="true" /></a>
                    </div>
                </div>
                <div className="cp-footer-col">
                    <h2>Quick Links</h2>
                    <Link href="/">Home</Link><Link href="/stores">Stores</Link><Link href="/categories">Categories</Link><Link href="/deals">Top Deals</Link><Link href="/about">About Us</Link><Link href="/contact">Contact Us</Link>
                </div>
                <div className="cp-footer-col">
                    <h2>Customer Support</h2>
                    <Link href="/contact">Help Center</Link><Link href="/about">How It Works</Link><Link href="/contact">Submit a Coupon</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/privacy">Disclaimer</Link>
                </div>
                <div className="cp-footer-col cp-footer-updates">
                    <h2>Stay Updated</h2><p>Get the latest deals & offers directly in your inbox.</p>
                    <form className="cp-footer-form">
                        <label className="visually-hidden" htmlFor="footer-email">Email address</label>
                        <input id="footer-email" type="email" placeholder="Enter your email" />
                        <button type="submit" aria-label="Subscribe"><i className="fas fa-paper-plane" aria-hidden="true" /></button>
                    </form>
                </div>
            </div>
            <div className="cp-container cp-footer-bottom">
                <p>© 2026 CouponPush. All rights reserved.</p>
                <p>Made with <span aria-hidden="true">❤</span> for smart shoppers</p>
                <div className="cp-payment-row" aria-label="Supported payments"><span>VISA</span><span>MC</span><span>RuPay</span><span>UPI</span></div>
            </div>
        </footer>
    );
}

export default Footer;
