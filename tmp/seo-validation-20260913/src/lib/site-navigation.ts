import type { Coupon } from '@/types';
import blogPages from '@/data/blog-pages.json';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { hasIndexableCategoryContent, hasIndexableStoreContent } from '@/lib/indexability';
import { getLatestContentUpdate } from '@/lib/content-dates';
import { getStorePath } from '@/lib/routes';

export const corePages = [
    { path: '/', title: 'Home' }, { path: '/coupons/', title: 'All coupons' },
    { path: '/stores/', title: 'All stores' }, { path: '/categories/', title: 'Shopping categories' },
    { path: '/deals/', title: 'Product deals' }, { path: '/offers/', title: 'Seasonal offers' },
    { path: '/about/', title: 'About CouponPush' }, { path: '/contact/', title: 'Contact' },
    { path: '/privacy-policy/', title: 'Privacy policy' }, { path: '/terms/', title: 'Terms and affiliate disclosure' },
    { path: '/site-map/', title: 'Site map' },
];
export function getSiteNavigation() {
    const stores = Object.values(deployedSnapshot.stores).filter(hasIndexableStoreContent).map(data => ({
        path: getStorePath(data.store.slug), title: data.store.name,
        lastModified: getLatestContentUpdate(data.store, ...data.coupons),
    })).sort((a, b) => a.title.localeCompare(b.title));
    const categories = (deployedSnapshot.categoriesPage?.initialCategories || []).flatMap(category => {
        const data = deployedSnapshot.categories[category.slug] as { coupons?: Coupon[] } | undefined;
        return hasIndexableCategoryContent(data) ? [{ path: `/category/${category.slug}/`, title: category.name, lastModified: getLatestContentUpdate(category, ...(data?.coupons || [])) }] : [];
    }).sort((a, b) => a.title.localeCompare(b.title));
    return { pages: corePages, stores, categories, blog: blogPages.filter(page => page.section === 'blog'), tools: blogPages.filter(page => page.section === 'tools') };
}

const storeGuides: Record<string, string> = {
    amazon: '/blog/amazon-welcome-offers-india', flipkart: '/blog/flipkart-welcome-coupon',
    ajio: '/blog/ajio-welcome-coupon', myntra: '/blog/articles/myntra-first-order-coupon/',
    swiggy: '/blog/swiggy-welcome-coupon', zomato: '/blog/zomato-welcome-coupon',
    blinkit: '/blog/blinkit-welcome-coupon', hostinger: '/blog/hostinger-coupon-code-india',
};
export function getStoreGuide(slug: string) {
    return blogPages.find(page => page.path === storeGuides[slug]);
}
