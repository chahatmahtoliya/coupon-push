import type { ApiResponse, Store, Coupon, Category, Deal, StorePageData, SearchResults, HomepageStats, SeasonalOffer } from '@/types';

const API_BASE = '/api';

// Decode HTML entities in strings
function decodeHTML(html: string): string {
    if (!html || typeof html !== 'string') return html;
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Recursively decode HTML entities in object
function decodeHTMLInData(data: any): any {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
        return decodeHTML(data);
    }

    if (Array.isArray(data)) {
        return data.map(item => decodeHTMLInData(item));
    }

    if (typeof data === 'object') {
        const decoded: any = {};
        for (const key in data) {
            decoded[key] = decodeHTMLInData(data[key]);
        }
        return decoded;
    }

    return data;
}

// Generic fetch helper
async function fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'API request failed');
    }

    // Decode HTML entities in the response data
    return decodeHTMLInData(data.data) as T;
}

// Stores API
export const storesApi = {
    getAll: () => fetchApi<Store[]>('/stores.php'),
    getFeatured: (limit = 8) => fetchApi<Store[]>(`/stores.php?featured=1&limit=${limit}`),
    getBySlug: (slug: string) => fetchApi<StorePageData>(`/store.php?slug=${slug}`),
    getByCategory: (categorySlug: string) => fetchApi<Store[]>(`/stores.php?category=${categorySlug}`),
};

// Coupons API
export const couponsApi = {
    getById: (id: number) => fetchApi<Coupon>(`/coupon.php?id=${id}`),
    getFeatured: (limit = 8) => fetchApi<Coupon[]>(`/coupons.php?featured=1&limit=${limit}`),
    getLatest: (limit = 12) => fetchApi<Coupon[]>(`/coupons.php?latest=1&limit=${limit}`),
    getByStore: (storeId: number) => fetchApi<Coupon[]>(`/coupons.php?store_id=${storeId}`),
    getByCategory: (categorySlug: string) => fetchApi<Coupon[]>(`/coupons.php?category=${categorySlug}`),
};

// Categories API
export const categoriesApi = {
    getAll: () => fetchApi<Category[]>('/categories.php'),
};

// Deals API
export const dealsApi = {
    getFeatured: (limit = 6) => fetchApi<Deal[]>(`/deals.php?featured=1&limit=${limit}`),
    getAll: () => fetchApi<Deal[]>('/deals.php'),
};

// Seasonal Offers API
export const seasonalOffersApi = {
    getActive: () => fetchApi<SeasonalOffer[]>('/seasonal-offers.php?active=true'),
    getBySlug: (slug: string) => fetchApi<SeasonalOffer>(`/seasonal-offers.php?slug=${slug}`),
};

// Search API
export const searchApi = {
    search: (query: string) => fetchApi<SearchResults>(`/search.php?q=${encodeURIComponent(query)}`),
};

// Stats API
export const statsApi = {
    getHomepage: () => fetchApi<HomepageStats>('/stats.php'),
};

// Track click
export const trackClick = async (type: 'coupon' | 'deal', id: number): Promise<void> => {
    try {
        console.log(`Tracking ${type} click for ID: ${id}`);
        const response = await fetch(`${API_BASE}/track-click.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, id }),
        });
        const data = await response.json();
        console.log('Track click response:', data);
        if (!data.success) {
            console.error('Track click failed:', data.message);
        }
    } catch (error) {
        console.error('Track click error:', error);
    }
};
