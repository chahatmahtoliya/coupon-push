import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import type { Category } from '@/types';
import { categoriesApi } from '@/services/api';


export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useSEO({
        title: 'All Categories - CouponPush | Browse Deals by Category',
        description: `Explore coupons and deals across ${categories.length} categories. Find discounts on electronics, fashion, food, travel, and more.`,
        url: 'https://couponpush.com/categories'
    });

    useEffect(() => {
        categoriesApi.getAll()
            .then(setCategories)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <>
            {/* Dark Header */}
            <div className="category-header-dark">
                <div className="container">
                    <nav className="category-breadcrumb">
                        <Link to="/">HOME</Link>
                        <i className="fas fa-chevron-right"></i>
                        <span>CATEGORIES</span>
                    </nav>
                    <h1 className="category-header-title">Browse All Categories</h1>
                    <p className="category-header-description">
                        Explore coupons and deals across all categories. Find discounts on electronics, fashion, food, travel, and more.
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <section className="categories-page-section">
                <div className="container">
                    <div className="categories-page-count">
                        <span className="count-number">{categories.length}</span>
                        <span className="count-text">categories available</span>
                    </div>

                    <div className="categories-page-grid">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/category/${category.slug}`}
                                className="categories-page-card"
                            >
                                <div className="categories-page-card-icon">
                                    <i className={`fas ${category.icon || 'fa-tag'}`}></i>
                                </div>
                                <div className="categories-page-card-content">
                                    <h3 className="categories-page-card-name">{category.name}</h3>
                                    <p className="categories-page-card-description">
                                        {category.description || ''}
                                    </p>
                                    <span className="categories-page-card-count">
                                        {category.coupon_count} {category.coupon_count === 1 ? 'Coupon' : 'Coupons'}
                                    </span>
                                </div>
                                <div className="categories-page-card-arrow">
                                    <i className="fas fa-chevron-right"></i>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-folder-open"></i>
                            <h3>No Categories Found</h3>
                            <p>Categories will appear here once they are added.</p>
                            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

export default CategoriesPage;
