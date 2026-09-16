import { cp, mkdir, writeFile } from 'node:fs/promises';
import { readBlogPages, sitemapXml, origin } from './blog-pages.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = (await readBlogPages()).filter(page => !page.noindex);
await writeFile(path.join(root, 'src/data/blog-pages.json'), JSON.stringify(pages, null, 2) + '\n');
await writeFile(path.join(root, 'blog/sitemap.xml'), sitemapXml(pages.filter(page => page.section === 'blog').map(page => origin + page.path)));
await writeFile(path.join(root, 'public/sitemap-tools.xml'), sitemapXml(pages.filter(page => page.section === 'tools').map(page => origin + page.path)));
// Keep blog/ as the editable source; Next copies public assets into its static export.
await mkdir(path.join(root, 'public/blog'), { recursive: true });
await cp(path.join(root, 'blog'), path.join(root, 'public/blog'), { recursive: true });
console.log('Prepared CouponPush blog in public/blog.');
