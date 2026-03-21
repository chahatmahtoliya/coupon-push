import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';

export function NotFoundPage() {
    useSEO({
        title: 'Page Not Found - CouponPush',
        description: 'The page you are looking for does not exist. Browse our latest coupon codes and deals from top stores.',
        url: 'https://couponpush.com/404',
    });

    // Add noindex meta tag so Google doesn't index the 404 page
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
        metaRobots.setAttribute('content', 'noindex, nofollow');
    }

    return (
        <div className="not-found-page">
            <section className="not-found-section">
                <div className="container">
                    <div className="not-found-content">
                        <div className="not-found-icon">
                            <i className="fas fa-search"></i>
                        </div>
                        <h1>Page Not Found</h1>
                        <p className="not-found-message">
                            The page you're looking for doesn't exist or has been moved.
                        </p>
                        <div className="not-found-actions">
                            <Link to="/" className="btn btn-primary">
                                <i className="fas fa-home"></i> Go to Homepage
                            </Link>
                            <Link to="/stores" className="btn btn-outline-primary">
                                <i className="fas fa-store"></i> Browse Stores
                            </Link>
                            <Link to="/categories" className="btn btn-outline-primary">
                                <i className="fas fa-th-large"></i> Browse Categories
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default NotFoundPage;
