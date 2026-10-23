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
    const images = slug === 'power-banks' ? [{ url: '/assets/images/power-bank-hero.webp', width: 1800, height: 600, alt: 'Portable USB-C power banks' }] : undefined;
    return { title, description, alternates: { canonical }, robots: { index: hasIndexableCategoryContent(data), follow: true }, openGraph: { type: 'website', url: canonical, title, description, ...(images ? { images } : {}) }, ...(images ? { twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) } } : {}) };
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = deployedSnapshot.categories[slug] as CategoryPageData | undefined;
    if (!data) notFound();
    const canonical = `https://couponpush.com/category/${slug}/`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'CollectionPage', '@id': `${canonical}#webpage`, url: canonical, name: getCategoryPageTitle(data.categoryName), description: getCategoryPageDescription(data.categoryName, getActiveCoupons(data.coupons).length), inLanguage: 'en-IN', breadcrumb: { '@id': `${canonical}#breadcrumb` } },
            { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://couponpush.com/' },
                { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://couponpush.com/categories/' },
                { '@type': 'ListItem', position: 3, name: data.categoryName, item: canonical },
            ] },
        ],
    };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /><CategoryPageClient initialData={data} initialCategories={deployedSnapshot.categoriesPage?.initialCategories || []} slug={slug} /></>;
}
