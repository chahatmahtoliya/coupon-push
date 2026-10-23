import type { Category } from '@/types';

export const CATEGORY_GROUPS = [
    { id: 'tech', name: 'Tech & electronics', shortName: 'Tech', description: 'Everyday upgrades, from pocket-sized to big-screen.', icon: 'electronics' },
    { id: 'fashion', name: 'Fashion & accessories', shortName: 'Fashion', description: 'Find your next outfit, favourite pair or finishing touch.', icon: 'fashion' },
    { id: 'beauty', name: 'Beauty & wellness', shortName: 'Beauty', description: 'A little care for your skin, your routine and yourself.', icon: 'skincare' },
    { id: 'home', name: 'Home & everyday', shortName: 'Home & food', description: 'For the place you call home and the things you use daily.', icon: 'home-kitchen' },
    { id: 'travel', name: 'Travel & entertainment', shortName: 'Travel & fun', description: 'Your next journey, weekend plan or night in.', icon: 'travel-hotels' },
    { id: 'digital', name: 'Web & business', shortName: 'Web & business', description: 'Tools to build your website and grow your business.', icon: 'web-hosting' },
    { id: 'offers', name: 'More ways to save', shortName: 'More savings', description: 'Explore offers by payment method, membership and more.', icon: 'coupon-deals' },
] as const;
export type CategoryGroupId = typeof CATEGORY_GROUPS[number]['id'];

export function getCategoryGroup(slug: string): CategoryGroupId {
    if (/hosting|website|domain|business-email|email-marketing/.test(slug)) return 'digital';
    if (/bus|travel|hotel|entertainment|prime-video|amazon-music|kindle/.test(slug)) return 'travel';
    if (/beauty|skin|protein|health/.test(slug)) return 'beauty';
    if (/fashion|footwear|sportswear|ethnic|^watches$|accessories$/.test(slug) && !/electronics/.test(slug)) return 'fashion';
    if (/home|kitchen|appliance|conditioner|refrigerator|washing|microwave|dishwasher|grocery|food|essentials|books|sports-outdoors|toys/.test(slug)) return 'home';
    if (/offer|shipping|amazon-prime|coupon-deals/.test(slug)) return 'offers';
    return 'tech';
}

export function prepareDirectoryCategories(categories: Category[]): Category[] {
    const unique = new Map<string, Category>();
    for (const category of categories) {
        if (!category.slug || !category.name || category.slug === 'all-categories') continue;
        unique.set(category.slug, { ...category, coupon_count: Math.max(0, Number(category.coupon_count) || 0) });
    }
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'en-IN'));
}
