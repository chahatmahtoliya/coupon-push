// Store interface
export interface Store {
    id: number;
    name: string;
    slug: string;
    logo: string;
    website_url: string;
    description: string;
    h1_suffix?: string;
    about_content?: string;
    howto_content?: string;
    terms_content?: string;
    rating: number;
    coupon_count: number;
    is_featured: boolean;
    category_id: number;
    category_name?: string;
}

// Coupon interface
export interface Coupon {
    id: number;
    store_id: number;
    store_name: string;
    store_slug: string;
    store_logo: string;
    store_website_url: string;
    title: string;
    description: string;
    code: string;
    discount_type: 'percentage' | 'fixed' | 'freebie';
    discount_value: number;
    expiry_date: string;
    is_featured: boolean;
    is_verified: boolean;
    click_count: number;
    image?: string; // Optional coupon/product image
    original_price?: number | null; // Original price before discount
    sale_price?: number | null;     // Discounted/sale price
}

// Category interface
export interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    coupon_count: number;
}

// Deal interface
export interface Deal {
    id: number;
    title: string;
    description: string;
    image: string;
    store_id: number;
    store_name: string;
    store_slug: string;
    url: string;
    is_featured: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Store page data
export interface StorePageData {
    store: Store;
    coupons: Coupon[];
    related_stores: Store[];
}

// Search results
export interface SearchResults {
    stores: Store[];
    coupons: Coupon[];
}

// Homepage stats
export interface HomepageStats {
    total_coupons: number;
    total_stores: number;
    total_savings: string;
}

// Seasonal Offer interface for festival/occasion-based promotions
export interface SeasonalOffer {
    id: number;
    name: string;           // e.g., "Holi Special", "Valentine's Day"
    slug: string;           // e.g., "holi-special"
    description: string;
    banner_image: string;
    mobile_banner_image?: string;
    theme_color: string;    // Primary accent color for the theme
    gradient_start?: string;
    gradient_end?: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    display_order: number;
    coupons: Coupon[];      // Associated coupons
}
