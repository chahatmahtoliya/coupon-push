import Link from '@/components/common/SiteLink';

export function Footer() {
    return (
        <footer className="cp-footer">
            <div className="cp-container cp-footer-grid">
                <div className="cp-footer-brand">
                    <Link aria-label="CouponPush home" className="cp-footer-logo-link" href="/">
                        <img src="/assets/home-ui/logo-transparent.png" alt="CouponPush" className="cp-footer-logo-image" width="164" height="38" />
                    </Link>
                    <p>Your one-stop destination for the best coupons, deals & offers from top brands. Save more, shop smart!</p>
                    <Link href="/about/#offer-checks">How we label offers</Link>
                </div>
                <div className="cp-footer-col">
                    <h2>Quick Links</h2>
                    <Link href="/coupons/">All Coupons</Link><Link href="/stores/">Stores</Link><Link href="/categories/">Categories</Link><Link href="/deals/">Product Deals</Link><Link href="/offers/">Seasonal Offers</Link><Link href="/blog/">Shopping Guides</Link><Link href="/blog/tools/">Calculators & Tools</Link><Link href="/site-map/">Site Map</Link>
                </div>
                <div className="cp-footer-col">
                    <h2>Customer Support</h2>
                    <Link href="/contact/">Help & Contact</Link><Link href="/about/">About CouponPush</Link><Link href="/blog/embed/">Publisher Resources</Link><Link href="/privacy-policy/">Privacy Policy</Link><Link href="/terms/">Terms & Disclosures</Link>
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
