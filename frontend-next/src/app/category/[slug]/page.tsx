import type { Metadata } from 'next';
import CategoryLandingPage, { getCategoryMetadata } from '@/components/features/CategoryLandingPage';
import type { CategoryPageData } from './CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getCategoryPath } from '@/lib/routes';

export const dynamicParams = false;
export async function generateStaticParams() {
    return Object.entries(deployedSnapshot.categories)
        .filter(([slug, data]) => (data as CategoryPageData).coupons.length > 0 && getCategoryPath(slug) === `/category/${slug}/`)
        .map(([slug]) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return getCategoryMetadata(slug);
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CategoryLandingPage slug={slug} />;
}
