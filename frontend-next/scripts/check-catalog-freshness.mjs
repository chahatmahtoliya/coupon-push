import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function assertFreshCatalog(snapshot, now = Date.now()) {
    const captured = Date.parse(snapshot.capturedAt || '');
    if (!Number.isFinite(captured) || captured > now + 60_000 || now - captured > 48 * 3_600_000) {
        throw new Error('Catalog is older than 48 hours or has an invalid capture time. Refresh successfully before publishing.');
    }
    return captured;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const snapshot = JSON.parse(await fs.readFile('src/data/deployed-snapshot.json', 'utf8'));
    assertFreshCatalog(snapshot);
    console.log(`Catalog import freshness passed: ${snapshot.capturedAt}. Importing data does not verify merchant promotions.`);
}
