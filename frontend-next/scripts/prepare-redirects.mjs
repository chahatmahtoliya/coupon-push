import fs from 'node:fs/promises';

const snapshot = JSON.parse(await fs.readFile(new URL('../src/data/deployed-snapshot.json', import.meta.url), 'utf8'));
const redirects = new Map([
    ['/store', '/stores/'],
    ['/privacy', '/privacy-policy/'],
    ['/store/cetaphil', '/store/cetaphil-coupon-code/'],
    ['/store/amazon-prime-day-sale-2026', '/store/amazon/'],
    ['/cetaphil', '/store/cetaphil-coupon-code/'],
    ['/amazon-prime-day-sale-2026', '/store/amazon/'],
]);
for (const slug of Object.keys(snapshot.stores)) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid store slug: ${slug}`);
    redirects.set(`/${slug}`, `/store/${slug}/`);
}
const lines = ['# Permanent legacy URL redirects for Cloudflare Pages / Workers static assets.'];
for (const [source, target] of redirects) {
    lines.push(`${source} ${target} 301`, `${source}/ ${target} 301`);
}
await fs.writeFile(new URL('../public/_redirects', import.meta.url), lines.join('\n') + '\n');
console.log(`Prepared ${redirects.size * 2} permanent legacy redirects.`);
