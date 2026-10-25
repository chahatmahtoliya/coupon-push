import CategoryLandingPage, { getCategoryMetadata } from '@/components/features/CategoryLandingPage';

export function generateMetadata() {
    return getCategoryMetadata('power-banks');
}

export default function PowerBankDealsPage() {
    return <CategoryLandingPage slug="power-banks" />;
}
