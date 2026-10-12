export type PartnerStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected' | 'withdrawn' | 'suspended';
export interface PartnerAccount { id: number; name: string; email: string; verified_at: string | null }
export interface BrandDetails {
    name: string; website_url: string; category_id: number; short_description: string; description: string;
    relationship: string; authorization: string; logo: string; authority_confirmed: boolean;
}
export interface BrandOffer {
    title: string; description: string; code: string; coupon_type: 'code' | 'deal';
    discount_type: 'percentage' | 'flat' | 'cashback' | 'freebie'; discount_value: number | null;
    min_order_value: number | null; max_discount: number | null; affiliate_link: string;
    terms_conditions: string; start_date: string; expiry_date: string;
}
export interface PartnerOffer {
    id: number; payload: BrandOffer; status: PartnerStatus; feedback: string | null;
    clicks: number; views: number; expired: boolean; scheduled: boolean; coupon_id: number | null;
}
export interface PartnerDashboard {
    listing: { id: number; revision: number; payload: Partial<BrandDetails>; status: PartnerStatus; feedback: string | null; public_url: string | null; canonical_url: string | null };
    offers: PartnerOffer[];
    metrics: { offer_views: number; offer_clicks: number; store_views: number };
    publication: { id: number; revision: number; status: 'queued' | 'running' | 'succeeded' | 'failed'; error: string | null } | null;
    activity: { event: string; message: string; revision: number; created_at: string }[];
    categories: { id: number; name: string }[];
}
export const emptyBrand: BrandDetails = { name: '', website_url: '', category_id: 0, short_description: '', description: '', relationship: '', authorization: '', logo: '', authority_confirmed: false };
export const emptyOffer: BrandOffer = { title: '', description: '', code: '', coupon_type: 'code', discount_type: 'percentage', discount_value: null, min_order_value: null, max_discount: null, affiliate_link: '', terms_conditions: '', start_date: '', expiry_date: '' };
