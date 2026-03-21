import { Link } from 'react-router-dom';
import type { Store } from '@/types';

interface StoreCardProps {
    store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
    const renderStars = () => {
        const stars = [];
        const rating = Math.round(store.rating || 4);
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i
                    key={i}
                    className={`fas fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}
                ></i>
            );
        }
        return stars;
    };

    return (
        <Link to={`/store/${store.slug}`} className="store-card">
            <div className="store-card-logo">
                <img
                    src={store.logo || '/placeholder-store.png'}
                    alt={store.name}
                />
            </div>
            <h4 className="store-card-name">{store.name}</h4>
            <div className="store-card-rating">
                {renderStars()}
            </div>
            <span className="store-card-coupons">
                {store.coupon_count} {store.coupon_count === 1 ? 'Coupon' : 'Coupons'}
            </span>
        </Link>
    );
}

export default StoreCard;
