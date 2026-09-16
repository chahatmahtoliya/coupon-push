import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryPageDescription, getCategoryPageTitle } from '@/lib/seo';
import CategoryPageClient, { type CategoryPageData } from './CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getActiveCoupons, hasIndexableCategoryContent } from '@/lib/indexability';

export const dynamicParams = false;
export async function generateStaticParams() {
    return Object.entries(deployedSnapshot.categories).filter(([, data]) => (data as CategoryPageData).coupons.length > 0).map(([slug]) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = deployedSnapshot.categories[slug] as CategoryPageData | undefined;
    if (!data) notFound();
    const title = getCategoryPageTitle(data.categoryName);
    const description = getCategoryPageDescription(data.categoryName, getActiveCoupons(data.coupons).length);
    const canonical = `https://couponpush.com/category/${slug}/`;
    return { title, description, alternates: { canonical }, robots: { index: hasIndexableCategoryContent(data), follow: true }, openGraph: { type: 'website', url: canonical, title, description } };
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = deployedSnapshot.categories[slug] as CategoryPageData | undefined;
    if (!data) notFound();
    return <CategoryPageClient initialData={data} slug={slug} />;
}
