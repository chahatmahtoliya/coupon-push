import Link from 'next/link';

export default function NotFound() {
    return (
        <section className="empty-state container py-5 text-center">
            <i className="fas fa-search fa-3x mb-3" aria-hidden="true" />
            <h1>Page Not Found</h1>
            <p>The page you requested may have moved or no longer exists.</p>
            <Link href="/" className="btn btn-primary">Return to Homepage</Link>
        </section>
    );
}
