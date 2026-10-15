import type { Metadata } from 'next';
import { festival2026, festivalFaqs } from '@/data/amazon-festival-2026';
import FestivalStoreTemplate from '@/components/features/festival/FestivalStoreTemplate';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { hasIndexableStoreContent } from '@/lib/indexability';

const canonical = `https://couponpush.com${festival2026.path}`;
const description = 'Explore Amazon Great Indian Festival 2026 offers, listed prices, SBI card conditions and Prime benefits. Compare the final price and eligibility on Amazon.';

export const metadata: Metadata = {
    title: 'Amazon Great Indian Festival 2026 Deals & Offers',
    description,
    robots: { index: hasIndexableStoreContent(deployedSnapshot.stores[festival2026.slug]), follow: true },
    alternates: { canonical },
    openGraph: { title: festival2026.name, description, url: canonical, type: 'website', images: [{ url: festival2026.banner, width: 2000, height: 1125, alt: 'Amazon Great Indian Festival early deals' }] },
    twitter: { card: 'summary_large_image', title: festival2026.name, description, images: [festival2026.banner] },
};

export default function AmazonFestivalPage() {
    const initialData = deployedSnapshot.stores[festival2026.slug] || null;
    const structuredData = [
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: festival2026.name, description, url: canonical },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://couponpush.com/' },
            { '@type': 'ListItem', position: 2, name: 'Stores', item: 'https://couponpush.com/stores/' },
            { '@type': 'ListItem', position: 3, name: festival2026.name, item: canonical },
        ] },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: festivalFaqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    ];
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} /><FestivalStoreTemplate initialData={initialData} slug={festival2026.slug} /></>;
}
