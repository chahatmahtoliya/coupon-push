import fs from 'node:fs/promises';

// Read only the product URLs already attached to this catalog. No catalog prices are changed.
const snapshot = JSON.parse(await fs.readFile(new URL('../src/data/deployed-snapshot.json', import.meta.url)));
const offers = snapshot.categories['power-banks'].coupons;
const images = {};
const failures = [];
const cache = new Map();
async function product(url) {
    if (!cache.has(url)) cache.set(url, fetch(url, { signal: AbortSignal.timeout(20000) }).then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }));
    return cache.get(url);
}
let index = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
    while (index < offers.length) {
        const offer = offers[index++];
        try {
            const source = new URL(offer.affiliate_link);
            const variant = source.searchParams.get('variant');
            source.search = '';
            source.pathname = source.pathname.replace(/\/$/, '') + '.js';
            const data = await product(source.href);
            const match = variant ? data.variants?.find(item => String(item.id) === variant) : null;
            // Use the exact variant photo when supplied by the merchant, otherwise its main product photo.
            const image = match?.featured_image?.src || data.featured_image;
            if (!image) throw new Error('No product photo');
            images[offer.id] = { image: new URL(image, offer.affiliate_link).href, source: offer.affiliate_link, product: data.title };
        } catch (error) { failures.push({ id: offer.id, reason: error.message }); }
    }
}));
await fs.writeFile(new URL('../src/data/power-bank-images.json', import.meta.url), JSON.stringify(images, null, 2) + '\n');
console.log(JSON.stringify({ matched: Object.keys(images).length, total: offers.length, failures }, null, 2));
