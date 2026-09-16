import { parseDocument } from 'htmlparser2';
import { textContent } from 'domutils';
import aliases from '@/data/store-redirects.json';

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
        )))
        .map(normalizeCatalog);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        key === 'store_slug' && typeof item === 'string' ? redirects[item] || item
            : textFields.has(key) && typeof item === 'string' ? decodeText(item)
                : normalizeCatalog(item),
    ]));
    return value;
}
