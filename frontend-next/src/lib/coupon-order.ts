type DatedCoupon = { id: number; created_at?: string | null };

function createdAt(value?: string | null): number {
    const date = (value || '').trim().replace(' ', 'T');
    // MySQL timestamps use the site's Asia/Kolkata clock and omit the offset.
    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(date)
        ? `${date}+05:30` : date;
    const timestamp = Date.parse(normalized);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function compareCouponsByNewest(a: DatedCoupon, b: DatedCoupon): number {
    return createdAt(b.created_at) - createdAt(a.created_at) || b.id - a.id;
}
