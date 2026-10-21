import { Suspense } from 'react';
import Link from '@/components/common/SiteLink';
import SearchResults, { SearchLoading } from './SearchResults';
import styles from './search.module.css';

export default function SearchPage() {
    return <div className={styles.page}>
        <div className={styles.shell}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link><i className="fas fa-chevron-right" aria-hidden="true" /><span aria-current="page">Search</span>
            </nav>
            <header className={styles.heading}>
                <h1>Search CouponPush</h1>
                <p>Find a store, discover a deal, and save on your next order.</p>
            </header>
            <Suspense fallback={<SearchLoading />}><SearchResults /></Suspense>
        </div>
    </div>;
}
