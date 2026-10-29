import brands from '@/data/power-bank-brand-logos.json';

const logos: Record<string, string> = Object.fromEntries(brands.map(brand => [brand.slug, brand.asset]));

// Use locally hosted official marks for imported stores without a logo.
// A subsequent real admin upload still takes precedence over this fallback.
export function getStoreBrandLogo(slug: string, current: unknown): unknown {
    if (current == null || current === '' || (typeof current === 'string' && /(?:placeholder|default-store)/i.test(current))) {
        return logos[slug] || current;
    }
    return current;
}
