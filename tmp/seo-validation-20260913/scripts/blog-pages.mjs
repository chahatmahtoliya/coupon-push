import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';
import { findAll, textContent } from 'domutils';

export const blogRoot = path.resolve(import.meta.dirname, '../blog');
export const origin = 'https://couponpush.com';
export async function htmlFiles(dir = blogRoot) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(path.join(dir, entry.name)) : entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []))).flat().sort();
}
export function blogPath(file) {
  const relative = path.relative(blogRoot, file).replaceAll('\\', '/');
  return '/blog/' + (relative.endsWith('index.html') ? relative.slice(0, -10) : relative.replace(/\.html$/, ''));
}
export async function readBlogPages() {
  return Promise.all((await htmlFiles()).map(async file => {
    const doc = parseDocument(await fs.readFile(file, 'utf8'));
    const elements = findAll(node => Boolean(node.name), doc.children);
    const title = elements.find(node => node.name === 'h1');
    const canonical = elements.find(node => node.name === 'link' && node.attribs.rel === 'canonical')?.attribs.href;
    const noindex = elements.some(node => node.name === 'meta' && ['robots', 'googlebot'].includes(node.attribs.name) && /noindex/i.test(node.attribs.content));
    const pathname = blogPath(file);
    if (canonical !== origin + pathname) throw new Error(`${file}: canonical must be ${origin + pathname}; run blog:normalize.`);
    if (!title) throw new Error(`${file}: missing H1`);
    return { path: pathname, title: textContent(title).trim(), section: pathname.startsWith('/blog/tools/') ? 'tools' : 'blog', noindex };
  }));
}
export function sitemapXml(urls) {
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n') + '\n</urlset>\n';
}
