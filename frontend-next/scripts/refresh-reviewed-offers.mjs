import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { advertisedText, matchesAdvertisement, materialOffer } from './reviewed-offer-source.mjs';

const root = process.cwd();
const file = path.join(root, 'src/data/reviewed-offers.json');
const definitions = JSON.parse(await fs.readFile(path.join(root, 'src/data/curated-offer-definitions.json'), 'utf8'));
let previous = { offers: [] };
try { previous = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const checkedAt = new Date().toISOString();
const offers = [];
const ids = new Set();
for (const source of definitions.sources) {
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid merchant source URL');
    const response = await fetch(url, { headers: { Accept: 'text/html' }, signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Source unavailable: ${url.hostname} (${response.status}). Previous source data retained.`);
    const text = advertisedText(await response.text());
    if (text.length < 100) throw new Error(`Incomplete merchant response: ${url.hostname}. Previous source data retained.`);
    const sourceHash = createHash('sha256').update(text).digest('hex');
    for (const definition of source.offers) {
        if (ids.has(definition.id)) throw new Error(`Duplicate reviewed offer ID: ${definition.id}`);
        ids.add(definition.id);
        const { patterns, ...copy } = definition;
        const offer = { ...copy, storeSlug: source.storeSlug, sourceUrl: source.url, status: matchesAdvertisement(text, patterns) ? 'advertised' : 'not-advertised', checkedAt, sourceHash };
        const old = previous.offers.find(item => item.id === offer.id);
        offers.push({ ...offer, updatedAt: old && materialOffer(old) === materialOffer(offer) ? old.updatedAt : checkedAt });
    }
}
// A failed request never replaces the last complete source-check file. A complete
// page whose offer wording disappeared does withhold that offer on the next build.
await fs.writeFile(`${file}.tmp`, `${JSON.stringify({ checkedAt, offers }, null, 2)}\n`);
await fs.rename(`${file}.tmp`, file);
console.log(`Merchant source checks: ${offers.filter(offer => offer.status === 'advertised').length}/${offers.length} advertisements matched. These are source checks, not checkout tests.`);
