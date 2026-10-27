import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseDocument } from 'htmlparser2';
import { findAll } from 'domutils';
import { blogRoot, htmlFiles, blogPath } from './blog-pages.mjs';

const root = path.resolve(import.meta.dirname, '..');
const pages = new Map();
for (const file of await htmlFiles()) {
  const html = await fs.readFile(file, 'utf8');
  const nodes = findAll(node => Boolean(node.name), parseDocument(html).children);
  assert.equal(nodes.filter(node => node.name === 'header' && node.attribs.class?.includes('cp-header')).length, 1, file);
  assert.equal(nodes.filter(node => node.name === 'footer' && node.attribs.class === 'cp-footer').length, 1, file);
  assert.equal(nodes.filter(node => node.attribs.id === 'mobile-navigation-dialog').length, 1, file);
  for (const destination of ['public/blog', 'out/blog']) {
    assert.equal(await fs.readFile(path.join(root, destination, path.relative(blogRoot, file)), 'utf8'), html, `${file}: stale ${destination}`);
  }
  pages.set(blogPath(file), nodes.filter(node => node.name === 'a' && ['prev', 'next'].includes(node.attribs.rel)));
}
let count = 0;
for (const [url, links] of pages) {
  for (const link of links) {
    const opposite = link.attribs.rel === 'prev' ? 'next' : 'prev';
    assert(pages.get(link.attribs.href)?.some(node => node.attribs.rel === opposite && node.attribs.href === url), `${url}: missing reciprocal ${link.attribs.rel} link`);
    count++;
  }
}
console.log(`Passed: shared homepage shell and matching public/export copies on ${pages.size} pages; ${count} reciprocal article links.`);
