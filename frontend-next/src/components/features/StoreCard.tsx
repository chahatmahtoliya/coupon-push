import Link from 'next/link';
import type { Store } from '@/types';
import { getStorePath } from '@/lib/routes';

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
        <Link href={getStorePath(store.slug)} className="store-card">
            <div className="store-card-logo">
                <img
                    src={store.logo || '/placeholder-store.png'}
                    alt={store.name}
                    loading="lazy"
                    decoding="async"
                    width="96"
                    height="96"
                    onError={(event) => {
                        if (!event.currentTarget.src.endsWith('/placeholder-store.png')) {
                            event.currentTarget.src = '/placeholder-store.png';
                        }
                    }}
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
