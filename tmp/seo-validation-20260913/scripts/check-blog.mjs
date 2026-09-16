import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve('blog');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(root).filter(file => file.endsWith('.html'));
const errors = [];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const url = new URL('/blog/' + path.relative(root, file).replaceAll('\\', '/'), 'https://couponpush.com');
  for (const marker of ['<h1', 'rel="canonical"', 'og:site_name', 'assets/brand.css']) {
    if (html.split(marker).length !== 2) errors.push(`${file}: expected one ${marker}`);
  }
  if (/couponush|href="#"|dofollow|backlinks?/i.test(html)) errors.push(`${file}: obsolete branding or placeholder link`);
  for (const match of html.matchAll(/<(?:link|script|img)\b[^>]*(?:href|src)="([^"]+)"/g)) {
    if (/^https?:\/\//.test(match[1])) continue;
    if (match[1].startsWith('/') || !fs.existsSync(path.resolve(path.dirname(file), match[1]))) {
      errors.push(`${file}: asset cannot load when opened locally: ${match[1]}`);
    }
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = new URL(match[1], url);
    if (target.origin !== url.origin) continue;
    const relative = target.pathname.slice(1) + (target.pathname.endsWith('/') ? 'index.html' : '');
    const candidates = target.pathname.startsWith('/blog/') ? [relative] : [path.join('public', relative), path.join('out', relative)];
    if (!candidates.some(candidate => fs.existsSync(candidate))) errors.push(`${file}: missing ${target.pathname}`);
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${file}: invalid structured data`); }
  }
  const exported = path.join('out/blog', path.relative(root, file));
  if (!fs.existsSync(exported)) errors.push(`${file}: missing from static export`);
}
assert.deepEqual(errors, [], errors.join('\n'));

// Exercise calculator boundary cases without a browser dependency.
const values = { cart: 1999, pct: 30, cap: 500, fees: 49, minimum: 0 };
let submit;
const output = { hidden: true, children: [], replaceChildren() { this.children = []; }, append(...nodes) { this.children.push(...nodes); } };
const error = { textContent: '' };
const form = { elements: { namedItem: name => ({ value: String(values[name]) }) }, addEventListener: (_, callback) => { submit = callback; } };
const document = {
  querySelector: selector => ({ '[data-calculator]': form, '[data-calculator-result]': output, '[data-calculator-error]': error })[selector] || null,
  querySelectorAll: () => [], addEventListener() {}, createElement: () => ({ textContent: '' }),
};
vm.runInNewContext(fs.readFileSync('blog/assets/script.js', 'utf8'), { document, Intl, URL, URLSearchParams, location: { search: '' }, matchMedia: () => ({ addEventListener() {} }) });
const calculate = () => submit({ preventDefault() {} });
calculate(); assert.equal(output.children[0].textContent, 'You pay ₹1,548.00');
values.minimum = 2500; calculate(); assert.equal(output.children[0].textContent, 'You pay ₹2,048.00');
values.minimum = 0; values.cap = 0; calculate(); assert.equal(output.children[0].textContent, 'You pay ₹1,448.30');
values.cart = 0; calculate(); assert.equal(output.hidden, true); assert.ok(error.textContent);
values.cart = 100; values.pct = 101; calculate(); assert.equal(output.hidden, true);
values.pct = 100; values.fees = 0; calculate(); assert.equal(output.children[0].textContent, 'You pay ₹0.00');
function element(data = {}) {
  return { ...data, attributes: {}, handlers: {}, classList: { toggle() {} }, setAttribute(name, value) { this.attributes[name] = value; }, addEventListener(name, callback) { this.handlers[name] = callback; } };
}
const query = element({ value: '', focus() {} });
const buttons = ['all', 'Fashion', 'Travel'].map(filter => element({ dataset: { filter } }));
const items = [element({ dataset: { articleTopic: 'Fashion' }, textContent: 'Myntra first-order coupons' }), element({ dataset: { articleTopic: 'Travel' }, textContent: 'MakeMyTrip booking guide' })];
const status = { textContent: '' };
const empty = { hidden: true };
const reset = element();
vm.runInNewContext(fs.readFileSync('blog/assets/script.js', 'utf8'), {
  document: {
    querySelector: selector => ({ '[data-guide-query]': query, '[data-search-status]': status, '[data-empty-state]': empty, '[data-search-reset]': reset })[selector] || null,
    querySelectorAll: selector => ({ '[data-filter]': buttons, '[data-article-topic]': items })[selector] || [], addEventListener() {},
  },
  URL, URLSearchParams, location: { search: '?q=myntra', href: 'https://couponpush.com/blog/?q=myntra' },
  history: { replaceState() {} }, matchMedia: () => ({ addEventListener() {} }),
});
assert.equal(items[0].hidden, false); assert.equal(items[1].hidden, true);
buttons[2].handlers.click(); assert.equal(empty.hidden, false);
reset.handlers.click(); assert.ok(items.every(item => !item.hidden));
buttons[1].handlers.click(); assert.equal(items[1].hidden, true); assert.equal(buttons[1].attributes['aria-pressed'], 'true');
query.value = 'missing-store'; query.handlers.input(); assert.equal(empty.hidden, false);
console.log(`Passed: ${files.length} blog pages, local destinations, metadata, JSON-LD, export coverage, search/filter states and calculator boundary cases.`);
