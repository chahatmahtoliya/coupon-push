const origin = 'https://couponpush.com';
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export function sitemapResponse(entries: { path: string; lastModified?: string | Date }[]) {
    const body = entries.map(entry => `<url><loc>${escape(origin + entry.path)}</loc>${entry.lastModified ? `<lastmod>${escape(entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified)}</lastmod>` : ''}</url>`).join('\n');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
export function sitemapIndexResponse() {
    const paths = ['/sitemap-pages.xml', '/sitemap-stores.xml', '/sitemap-categories.xml', '/blog/sitemap.xml', '/sitemap-tools.xml'];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `<sitemap><loc>${origin}${path}</loc></sitemap>`).join('\n')}\n</sitemapindex>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
