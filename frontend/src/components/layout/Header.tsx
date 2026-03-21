import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const menuItems = [
        { path: '/', label: 'Home', icon: 'fas fa-home' },
        { path: '/stores', label: 'All Stores', icon: 'fas fa-store' },
        { path: '/category/electronics', label: 'Electronics', icon: 'fas fa-laptop' },
        { path: '/category/fashion', label: 'Fashion', icon: 'fas fa-tshirt' },
        { path: '/category/food', label: 'Food & Dining', icon: 'fas fa-utensils' },
        { path: '/category/travel', label: 'Travel', icon: 'fas fa-plane' },
        { path: '/contact', label: 'Contact Us', icon: 'fas fa-envelope' },
    ];

    return (
        <>
            {/* Main Header */}
            <header className="main-header-v2">
                <div className="container">
                    <div className="header-inner">
                        {/* Logo */}
                        <a className="header-logo" href="https://couponpush.com">
                            <img
                                src="/assets/images/logo.png"
                                alt="CouponPush"
                                className="logo-image"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'inline';
                                }}
                            />
                            <span className="logo-text logo-fallback" style={{ display: 'none' }}>CouponPush</span>
                        </a>

                        {/* Desktop Search */}
                        <div className="header-search-desktop">
                            <form className="search-form" onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search stores, coupons..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="search-btn">
                                    <i className="fas fa-search"></i>
                                </button>
                            </form>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="header-nav-desktop">
                            <Link to="/" className="nav-link-v2">Home</Link>
                            <Link to="/stores" className="nav-link-v2">Stores</Link>
                            <div className="nav-dropdown">
                                <button className="nav-link-v2 dropdown-trigger">
                                    Categories <i className="fas fa-chevron-down"></i>
                                </button>
                                <div className="dropdown-menu-v2">
                                    <Link to="/category/electronics" className="dropdown-item-v2">
                                        <i className="fas fa-laptop"></i> Electronics
                                    </Link>
                                    <Link to="/category/fashion" className="dropdown-item-v2">
                                        <i className="fas fa-tshirt"></i> Fashion
                                    </Link>
                                    <Link to="/category/food" className="dropdown-item-v2">
                                        <i className="fas fa-utensils"></i> Food & Dining
                                    </Link>
                                    <Link to="/category/travel" className="dropdown-item-v2">
                                        <i className="fas fa-plane"></i> Travel
                                    </Link>
                                </div>
                            </div>
                            <Link to="/contact" className="nav-link-v2">Contact</Link>
                        </nav>

                        {/* Hamburger Button */}
                        <button
                            className={`hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
                            onClick={toggleMobileMenu}
                            aria-label="Toggle menu"
                        >
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Mobile Menu Drawer */}
            <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="mobile-menu-header">
                    <Link to="/" className="mobile-menu-logo" onClick={() => setIsMobileMenuOpen(false)}>
                        <img
                            src="/assets/images/logo.png"
                            alt="CouponPush"
                            className="logo-image-mobile"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <span>CouponPush</span>
                    </Link>
                    <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Mobile Search */}
                <div className="mobile-menu-search">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">
                            <i className="fas fa-search"></i>
                        </button>
                    </form>
                </div>

                {/* Mobile Menu Items */}
                <nav className="mobile-menu-nav">
                    {menuItems.map((item, index) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="mobile-menu-item"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                            <i className="fas fa-chevron-right arrow"></i>
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Footer */}
                <div className="mobile-menu-footer">
                    <div className="mobile-menu-social">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-twitter"></i>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-instagram"></i>
                        </a>
                    </div>
                    <p>© {new Date().getFullYear()} CouponPush</p>
                </div>
            </div>
        </>
    );
}

export default Header;
