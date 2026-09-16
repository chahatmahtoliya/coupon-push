// Confirmed missing on 2026-09-09. Keep a valid image in the initial HTML,
// including for crawlers that never execute an img onError handler.
const missingImages: Record<string, string> = {
    '/uploads/coupons/coupon_1769884479_697e4b3fe6395.jpg': '/placeholder-deal.png',
    '/uploads/coupons/coupon_1773771453_69b99abd3261e.webp': '/placeholder-deal.png',
    '/uploads/deals/deal_695bf1db04cdd_1767633371.webp': '/placeholder-deal.png',
    '/uploads/deals/deal_696693aa1d955_1768330154.webp': '/placeholder-deal.png',
    '/uploads/deals/deal_69830bc52f7c9_1770195909.jpg': '/placeholder-deal.png',
};

// Newer admin uploads exist on the API host, while older logos live on media.
// Verified against both hosts on 2026-09-09.
const apiStoreImages = new Set([
    'store_6a9bce69ce0b6_1788595817.png',
    'store_6a9bce842cd4c_1788595844.png',
    'store_6a9be95a02e04_1788602714.png',
    'store_6a9bed05e64fa_1788603653.jpg',
    'store_6a9bed186a03f_1788603672.png',
    'store_6a9bed7d2f5dc_1788603773.png',
    'store_6a9c4adbe3c84_1788627675.png',
    'store_6a9c4c19b181d_1788627993.webp',
    'store_6a9fd4abf4049_1788859563.jpg',
]);

export function getMissingImageFallback(value: string): string | undefined {
    try {
        const url = new URL(value, 'https://couponpush.com');
        if (['couponpush.com', 'www.couponpush.com', 'api.couponpush.com', 'media.couponpush.com'].includes(url.hostname)) {
            if (url.pathname.startsWith('/uploads/stores/') && apiStoreImages.has(url.pathname.split('/').pop()!)) {
                return `https://api.couponpush.com${url.pathname}`;
            }
            return missingImages[url.pathname];
        }
        if (url.hostname === 'm.media-amazon.com' && url.pathname === '/images/G/31/Prime_Day/2026/pdp/PD26_Logo._CB563229066_.png') {
            return '/assets/home-ui/amazon-round.png';
        }
    } catch {
        return undefined;
    }
}
