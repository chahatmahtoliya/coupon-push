import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Static exports cannot use Next's runtime image optimizer. Ship responsive
// assets with the site, while retaining remote URLs for newly added slides.
const root = process.cwd();
const manifestPath = path.join(root, 'src/data/hero-images.json');
const directory = path.join(root, 'public/assets/hero');
const snapshot = JSON.parse(await fs.readFile(path.join(root, 'src/data/deployed-snapshot.json'), 'utf8'));
const previous = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(() => '{}'));
const manifest = {};
await fs.mkdir(directory, { recursive: true });
for (const slide of snapshot.homepage.initialHeroSlides) {
    const url = slide.image;
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const cached = previous[url];
    if (cached?.backgroundColor && !process.argv.includes('--refresh') && (await Promise.all(cached.variants.map(v => fs.access(path.join(root, 'public', v.src)).then(() => true, () => false)))).every(Boolean)) {
        manifest[url] = cached;
        continue;
    }
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const original = Buffer.from(await response.arrayBuffer());
        const metadata = await sharp(original).metadata();
        // Preserve animated creatives rather than silently flattening them.
        if (metadata.pages > 1) continue;
        const { width, height } = metadata.autoOrient;
        const hash = createHash('sha256').update(url).update(original).digest('hex').slice(0, 16);
        const widths = [...new Set([480, 800, 1200, 1800].map(size => Math.min(size, width)))];
        const variants = [];
        for (const size of widths) {
            const src = `/assets/hero/${hash}-${size}.webp`;
            await sharp(original).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(root, 'public', src));
            variants.push({ width: size, src });
        }
        const { dominant } = await sharp(original).stats();
        const backgroundColor = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
        manifest[url] = { width, height, backgroundColor, variants };
        const size = (await fs.stat(path.join(root, 'public', variants.at(-1).src))).size;
        console.log(`Hero ${slide.id}: ${original.length} -> ${size} bytes (largest variant)`);
    } catch (error) {
        console.warn(`Hero ${slide.id}: ${error.message}; retaining the original URL`);
        if (cached) manifest[url] = cached;
    }
}
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
