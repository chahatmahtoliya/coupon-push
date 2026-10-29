import { parseDocument } from 'htmlparser2';
import { textContent } from 'domutils';
import aliases from '@/data/store-redirects.json';
import { getStoreBrandLogo } from './store-brand-logos';
import { getCouponCode } from '@/utils/coupon';

const redirects: Record<string, string> = aliases;
const textFields = new Set(['name', 'store_name', 'title', 'meta_title', 'meta_description', 'category_name', 'heading', 'subheading', 'badge_text']);

function decodeText(value: string): string {
    let result = value;
    // Imported records can contain more than one layer of entity encoding.
    for (let pass = 0; pass < 3; pass++) {
        const decoded = textContent(parseDocument(result));
        if (decoded === result) break;
        result = decoded;
    }
    return result;
}

export function normalizeCatalog(value: unknown): unknown {
    if (Array.isArray(value)) return value
        .filter(item => !(item && typeof item === 'object' && (
            ('slug' in item && redirects[item.slug]) || ('store_slug' in item && redirects[item.store_slug])
            || ('store_id' in item && typeof item.code === 'string' && item.code.trim() && !getCouponCode({ code: item.code }))
        )))
        .map(normalizeCatalog);
    // Quarantined code-label records must not return through a detail API call.
    if (value && typeof value === 'object' && 'store_id' in value && 'code' in value
        && typeof value.code === 'string' && value.code.trim() && !getCouponCode({ code: value.code })) return null;
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        key === 'logo' && 'slug' in value && typeof value.slug === 'string' ? getStoreBrandLogo(value.slug, item)
            : key === 'store_logo' && 'store_slug' in value && typeof value.store_slug === 'string' ? getStoreBrandLogo(value.store_slug, item)
            : key === 'code' && typeof item === 'string' ? getCouponCode({ code: item })
            : key === 'store_slug' && typeof item === 'string' ? redirects[item] || item
            : textFields.has(key) && typeof item === 'string' ? decodeText(item)
                : normalizeCatalog(item),
    ]));
    return value;
}
