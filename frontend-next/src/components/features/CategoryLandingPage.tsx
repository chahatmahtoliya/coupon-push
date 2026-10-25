import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageClient, { type CategoryPageData } from '@/app/category/[slug]/CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getActiveCoupons, hasIndexableCategoryContent } from '@/lib/indexability';
import { getCategoryPath } from '@/lib/routes';
import { getCategoryPageDescription, getCategoryPageTitle } from '@/lib/seo';

function getCategoryData(slug: string) {
    const data = deployedSnapshot.categories[slug] as CategoryPageData | undefined;
    if (!data) notFound();
    return data;
}

export function getCategoryMetadata(slug: string): Metadata {
    const data = getCategoryData(slug);
    const title = getCategoryPageTitle(data.categoryName);
    const description = getCategoryPageDescription(data.categoryName, getActiveCoupons(data.coupons).length);
    const canonical = `https://couponpush.com${getCategoryPath(slug)}`;
    const images = slug === 'power-banks' ? [{ url: '/assets/images/power-bank-hero.webp', width: 1800, height: 600, alt: 'Portable USB-C power banks' }] : undefined;
    return { title, description, alternates: { canonical }, ...(slug === 'power-banks' ? { keywords: ['Power Bank Deals'] } : {}), robots: { index: hasIndexableCategoryContent(data), follow: true }, openGraph: { type: 'website', url: canonical, title, description, ...(images ? { images } : {}) }, ...(images ? { twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) } } : {}) };
}

export default function CategoryLandingPage({ slug }: { slug: string }) {
    const data = getCategoryData(slug);
    const canonical = `https://couponpush.com${getCategoryPath(slug)}`;
    const name = slug === 'power-banks' ? 'Power Bank Deals' : data.categoryName;
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'CollectionPage', '@id': `${canonical}#webpage`, url: canonical, name: getCategoryPageTitle(data.categoryName), description: getCategoryPageDescription(data.categoryName, getActiveCoupons(data.coupons).length), inLanguage: 'en-IN', breadcrumb: { '@id': `${canonical}#breadcrumb` } },
            { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://couponpush.com/' },
                { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://couponpush.com/categories/' },
                { '@type': 'ListItem', position: 3, name, item: canonical },
            ] },
        ],
    };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /><CategoryPageClient initialData={data} initialCategories={deployedSnapshot.categoriesPage?.initialCategories || []} slug={slug} /></>;
}
