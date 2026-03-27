'use client';

import Link from 'next/link';
import type { Deal } from '@/types';
import { trackClick } from '@/services/api';
import { getStorePath } from '@/lib/routes';

interface DealCardProps {
    deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
    const handleClick = () => {
        trackClick('deal', deal.id);
    };

    return (
        <div className="deal-card">
            <div className="deal-card-image">
                <img
                    src={deal.image || '/placeholder-deal.png'}
                    alt={deal.title}
                />
                <div className="deal-badge">HOT DEAL</div>
            </div>
            <div className="deal-card-body">
                <Link href={getStorePath(deal.store_slug)} className="deal-store">
                    {deal.store_name}
                </Link>
                <h4 className="deal-title">{deal.title}</h4>
                {deal.description && (
                    <p className="deal-description">{deal.description}</p>
                )}
                <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-grab-deal"
                    onClick={handleClick}
                >
                    Grab Deal <i className="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    );
}

export default DealCard;
