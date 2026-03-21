import { Link } from 'react-router-dom';
import type { Category } from '@/types';

interface CategoryCardProps {
    category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
    // Default icons mapping
    const getIcon = (slug: string): string => {
        const icons: Record<string, string> = {
            electronics: 'fa-laptop',
            fashion: 'fa-tshirt',
            food: 'fa-utensils',
            travel: 'fa-plane',
            beauty: 'fa-spa',
            health: 'fa-heartbeat',
            home: 'fa-home',
            sports: 'fa-futbol',
            books: 'fa-book',
            entertainment: 'fa-film',
            grocery: 'fa-shopping-basket',
            finance: 'fa-credit-card',
        };
        return icons[slug] || 'fa-tag';
    };

    return (
        <Link to={`/category/${category.slug}`} className="category-card">
            <div className="category-card-icon">
                <i className={`fas ${category.icon || getIcon(category.slug)}`}></i>
            </div>
            <h4 className="category-card-name">{category.name}</h4>
            <span className="category-card-count">
                {category.coupon_count} {category.coupon_count === 1 ? 'Coupon' : 'Coupons'}
            </span>
        </Link>
    );
}

export default CategoryCard;
