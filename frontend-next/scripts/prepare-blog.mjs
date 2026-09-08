import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Keep blog/ as the editable source; Next copies public assets into its static export.
await mkdir(path.join(root, 'public/blog'), { recursive: true });
await cp(path.join(root, 'blog'), path.join(root, 'public/blog'), { recursive: true });
console.log('Prepared CouponPush blog in public/blog.');
