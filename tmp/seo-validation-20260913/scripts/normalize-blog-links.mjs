import fs from 'node:fs/promises';
import { Parser } from 'htmlparser2';
import { blogPath, htmlFiles, origin } from './blog-pages.mjs';

const files = await htmlFiles();
const known = new Map();
for (const file of files) {
  const canonical = blogPath(file);
  known.set(canonical, canonical);
  known.set(canonical.endsWith('/') ? `${canonical}index.html` : `${canonical}.html`, canonical);
}
let changed = 0;
for (const file of files) {
  const html = await fs.readFile(file, 'utf8');
  const base = origin + blogPath(file);
  const normalize = (value, absolute = false) => {
    const url = new URL(value, base);
    if (url.origin !== origin || !known.has(url.pathname)) return value;
    return (absolute || value.startsWith(origin) ? origin : '') + known.get(url.pathname) + url.search + url.hash;
  };
  const edits = [];
  const parser = new Parser({
    onopentag(name, attrs) {
      const attribute = name === 'a' || name === 'link' && attrs.rel === 'canonical' ? 'href' : name === 'meta' && attrs.property === 'og:url' ? 'content' : null;
      if (!attribute || !attrs[attribute]) return;
      const next = normalize(attrs[attribute], name !== 'a');
      if (next === attrs[attribute]) return;
      const start = parser.startIndex, end = parser.endIndex + 1;
      const original = html.slice(start, end);
      const updated = original.replace(new RegExp(`(\\b${attribute}\\s*=\\s*)(["'])(.*?)\\2`, 'is'), (_, prefix, quote) => `${prefix}${quote}${next.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}${quote}`);
      edits.push({ start, end, updated });
    },
  }, { decodeEntities: true });
  parser.write(html); parser.end();
  let result = html;
  for (const edit of edits.reverse()) result = result.slice(0, edit.start) + edit.updated + result.slice(edit.end);
  // Known absolute blog URLs also appear in JSON-LD and escaped embed snippets.
  for (const [oldPath, nextPath] of known) {
    if (oldPath !== nextPath) result = result.replaceAll(origin + oldPath, origin + nextPath);
  }
  if (result !== html) { await fs.writeFile(file, result); changed++; }
}
console.log(`Normalized canonical URLs and links in ${changed} blog pages.`);
