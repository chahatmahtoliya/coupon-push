import { deployedSnapshot as snapshot } from './deployed-snapshot';
import type { Coupon, StorePageData } from '@/types';
import { getActiveCoupons } from './indexability';

// Catalog HTML, metadata and client navigation share the same release data.
// Search and click tracking remain API operations.
export function readCatalogSnapshot(endpoint: string): unknown {
    const url = new URL(endpoint, 'https://snapshot.local');
    const q = url.searchParams;
    const stores = (snapshot.storesPage?.initialStores || []).filter(s => snapshot.stores[s.slug]).map(s => ({ ...s, coupon_count: getActiveCoupons(snapshot.stores[s.slug].coupons).length }));
    const allCoupons = Object.values(snapshot.coupons).filter((c): c is Coupon => Boolean(c));
    const coupons = getActiveCoupons([...new Map(allCoupons.map(c => [c.id, c])).values()]);
    const limit = Number(q.get('limit')) || undefined;
    const categoryStores = () => stores.filter(s => s.category_slug === q.get('category'));
    switch (url.pathname) {
        case '/stores.php': return (q.has('category') ? categoryStores() : q.has('featured') ? stores.filter(s => s.is_featured) : stores).slice(0, limit);
        case '/store.php': {
            const data: StorePageData | undefined = snapshot.stores[q.get('slug') || ''];
            if (!data) throw new Error(`Store missing from release snapshot: ${q.get('slug')}`);
            return data;
        }
        case '/categories.php': return (snapshot.categoriesPage?.initialCategories || []).map(c => ({ ...c, coupon_count: getActiveCoupons((snapshot.categories[c.slug] as { coupons?: Coupon[] })?.coupons).length }));
        case '/coupons.php': {
            let result: Coupon[] = coupons;
            if (q.has('store_slug')) result = result.filter(c => c.store_slug === q.get('store_slug'));
            if (q.has('store_id')) result = result.filter(c => c.store_id === Number(q.get('store_id')));
            if (q.has('category')) {
                result = getActiveCoupons((snapshot.categories[q.get('category') || ''] as { coupons?: Coupon[] })?.coupons);
            }
            if (q.has('featured')) result = result.filter(c => c.is_featured);
            if (q.has('latest')) result = [...result].sort((a, b) => b.id - a.id);
            return result.slice(0, limit);
        }
        case '/coupon.php': return snapshot.coupons[q.get('id') || ''] || null;
        case '/deals.php': return (snapshot.dealsPage?.initialDeals || []).filter(d => !q.has('featured') || d.is_featured).slice(0, limit);
        case '/hero-slides.php': return snapshot.homepage?.initialHeroSlides || [];
        case '/seasonal-offers.php': return q.has('slug') ? snapshot.homepage?.initialSeasonalOffers.find(s => s.slug === q.get('slug')) : snapshot.homepage?.initialSeasonalOffers || [];
        default: return undefined;
    }
}
