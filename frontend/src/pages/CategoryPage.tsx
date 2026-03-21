import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO, getCategoryPageTitle, getCategoryPageDescription } from '@/hooks/useSEO';
import type { Coupon } from '@/types';
import { couponsApi, storesApi, categoriesApi } from '@/services/api';
import { CouponCard, FilterSidebar } from '@/components/features';
import { Pagination } from '@/components/common';

const ITEMS_PER_PAGE = 12;

interface StoreFilter {
    name: string;
    slug: string;
    count: number;
}

export function CategoryPage() {
    const { slug } = useParams<{ slug: string }>();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [stores, setStores] = useState<StoreFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [categoryDescription, setCategoryDescription] = useState('');

    // Filter states
    const [sortBy, setSortBy] = useState('popular');
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [validity, setValidity] = useState('all');

    // Format category name from slug
    const categoryName = slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
        : '';

    useSEO({
        title: categoryName ? getCategoryPageTitle(categoryName) : 'Category Deals - CouponPush',
        description: categoryName ? getCategoryPageDescription(categoryName, coupons.length) : 'Find the best coupons and deals in this category.',
        url: `https://couponpush.com/category/${slug}`,
        type: 'website'
    });

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        setCurrentPage(1);

        // Fetch coupons, stores, and category description in parallel
        Promise.all([
            couponsApi.getByCategory(slug),
            storesApi.getByCategory(slug).catch(() => []),
            categoriesApi.getAll().catch(() => [])
        ])
            .then(([couponsData, storesData, categoriesData]) => {
                setCoupons(couponsData);

                // Get category description from API
                const category = categoriesData.find((c: { slug: string }) => c.slug === slug);
                setCategoryDescription(category?.description || '');

                // Create store filter options with coupon counts
                const storeFilters: StoreFilter[] = storesData.map(store => ({
                    name: store.name,
                    slug: store.slug,
                    count: store.coupon_count || 0
                }));
                setStores(storeFilters);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    // Apply filters and sorting
    const filteredCoupons = useMemo(() => {
        let result = [...coupons];

        // Filter by selected stores
        if (selectedStores.length > 0) {
            result = result.filter(c => selectedStores.includes(c.store_slug));
        }

        // Filter by discount percentage
        if (selectedDiscounts.length > 0) {
            result = result.filter(c => {
                if (c.discount_type !== 'percentage') return false;
                const value = c.discount_value;
                return selectedDiscounts.some(d => {
                    switch (d) {
                        case 'under10': return value < 10;
                        case '10-25': return value >= 10 && value < 25;
                        case '25-50': return value >= 25 && value < 50;
                        case '50-75': return value >= 50 && value < 75;
                        case '75plus': return value >= 75;
                        default: return true;
                    }
                });
            });
        }

        // Filter by coupon type
        if (selectedTypes.length > 0) {
            result = result.filter(c => {
                if (selectedTypes.includes('percentage') && c.discount_type === 'percentage') return true;
                if (selectedTypes.includes('fixed') && c.discount_type === 'fixed') return true;
                if (selectedTypes.includes('freeshipping') && c.discount_type === 'freebie') return true;
                if (selectedTypes.includes('nocode') && !c.code) return true;
                return false;
            });
        }

        // Filter by validity
        if (validity === 'new') {
            // Sort by newest first (assuming newer coupons have higher IDs)
            result = result.sort((a, b) => b.id - a.id);
        } else if (validity === 'expiring') {
            // Filter to coupons expiring soon (within 7 days)
            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            result = result.filter(c => {
                if (!c.expiry_date) return false;
                const expiry = new Date(c.expiry_date);
                return expiry > now && expiry <= sevenDaysFromNow;
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => b.id - a.id);
                break;
            case 'expiring':
                result.sort((a, b) => {
                    if (!a.expiry_date) return 1;
                    if (!b.expiry_date) return -1;
                    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
                });
                break;
            case 'discount':
                result.sort((a, b) => b.discount_value - a.discount_value);
                break;
            case 'popular':
            default:
                result.sort((a, b) => b.click_count - a.click_count);
                break;
        }

        return result;
    }, [coupons, selectedStores, selectedDiscounts, selectedTypes, validity, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);
    const paginatedCoupons = filteredCoupons.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!loading && coupons.length === 0 && !slug) {
        return (
            <div className="empty-state">
                <i className="fas fa-ticket-alt"></i>
                <h3>Category Not Found</h3>
                <p>This category doesn't exist.</p>
                <Link to="/categories" className="btn btn-primary">Browse Categories</Link>
            </div>
        );
    }

    return (
        <>
            {/* Dark Header with Breadcrumb */}
            <div className="category-header-dark">
                <div className="container">
                    <nav className="category-breadcrumb">
                        <Link to="/">HOME</Link>
                        <i className="fas fa-chevron-right"></i>
                        <Link to="/categories">CATEGORIES</Link>
                        <i className="fas fa-chevron-right"></i>
                        <span>{categoryName.toUpperCase()}</span>
                    </nav>
                    <h1 className="category-header-title">{categoryName} Deals</h1>
                    <p className="category-header-description">{categoryDescription}</p>
                </div>
            </div>

            {/* Main Content */}
            <section className="category-page-section">
                <div className="container">
                    {/* Coupon Count */}
                    <div className="category-coupon-count">
                        <span className="count-number">{filteredCoupons.length}</span>
                        <span className="count-text">coupons found</span>
                    </div>

                    <div className="category-page-layout">
                        {/* Sidebar */}
                        <FilterSidebar
                            stores={stores}
                            onSortChange={setSortBy}
                            onStoreChange={setSelectedStores}
                            onDiscountChange={setSelectedDiscounts}
                            onTypeChange={setSelectedTypes}
                            onValidityChange={setValidity}
                        />

                        {/* Main Content */}
                        <main className="category-main-content">
                            {loading ? (
                                <div className="coupon-grid-v2">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} style={{
                                            background: '#fff',
                                            borderRadius: 12,
                                            padding: 20,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        }}>
                                            <div style={{ width: '60%', height: 16, borderRadius: 4, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 12 }}></div>
                                            <div style={{ width: '80%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 }}></div>
                                            <div style={{ width: '40%', height: 12, borderRadius: 4, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                                        </div>
                                    ))}
                                </div>
                            ) : paginatedCoupons.length > 0 ? (
                                <>
                                    <div className="coupon-grid-v2">
                                        {paginatedCoupons.map((coupon) => (
                                            <CouponCard
                                                key={coupon.id}
                                                coupon={coupon}
                                                variant="category"
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-ticket-alt"></i>
                                    <h3>No Coupons Found</h3>
                                    <p>Try adjusting your filters or browse all coupons.</p>
                                    <Link to="/" className="btn btn-primary">Browse All Coupons</Link>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </section>
        </>
    );
}

export default CategoryPage;
