import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';
import { findAll, textContent, getOuterHTML, replaceElement } from 'domutils';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://couponpush.com';
const hub = origin + '/Power-Bank-Deals/';
const dataPath = path.join(root, 'src/data/power-bank-editorial.json');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
const elements = doc => findAll(node => Boolean(node.name), doc.children);
const fragment = html => parseDocument(html).children.find(node => node.type === 'tag');
const money = value => {
  if (value == null || !Number.isFinite(Number(value))) throw new Error('Missing price cannot be rendered as zero');
  return 'Rs.' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
const median = values => {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const dateLabel = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const table = (headers, rows) => '<div class="offer-table-wrap"><table class="offer-table"><thead><tr>' + headers.map(h => '<th scope="col">' + escape(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(cell => '<td>' + escape(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const paragraph = value => '<p>' + escape(value) + '</p>';
const heading = value => '<h2>' + escape(value) + '</h2>';
function markdown(value) {
  return value.split('\n').filter(Boolean).map(line => line.startsWith('## ') ? heading(line.slice(3)) : paragraph(line)).join('\n');
}
function stats(rows) {
  const prices = rows.map(o => o.listed_price_inr);
  return { rows: rows.length, groups: new Set(rows.map(o => o.product_page_group)).size, brands: new Set(rows.map(o => o.store_slug)).size, min: prices.length ? Math.min(...prices) : null, median: prices.length ? median(prices) : null };
}
function requireSegment(rows, label) {
  if (!rows.length) throw new Error('Required catalog segment has no rows: ' + label);
  return stats(rows);
}
function chooseGroups(rows, count = 5) {
  const sorted = rows.slice().sort((a, b) => a.listed_price_inr - b.listed_price_inr || a.id - b.id);
  const groups = new Map();
  for (const row of sorted) if (!groups.has(row.product_page_group)) groups.set(row.product_page_group, row);
  const result = [], seen = new Set();
  for (const row of groups.values()) if (!seen.has(row.store_slug) && result.length < count) { result.push(row); seen.add(row.store_slug); }
  for (const row of groups.values()) if (!result.includes(row) && result.length < count) result.push(row);
  return result;
}
function catalogLabel(data) {
  return 'Publisher catalog retrieved ' + dateLabel(data.catalog.retrieved_at) + '. Counts include listing variants. Prices are stored advertised amounts, not seller checkout verification; delivery, stock and eligibility can change.';
}
function usesCatalog(article) {
  return ['capacity', 'output', 'wireless', 'retailer', 'quality'].includes(article.variant) || article.variant.startsWith('budget-');
}
function modifiedDate(article, data) {
  return usesCatalog(article) ? [article.reviewed_at, data.catalog.retrieved_at.slice(0, 10)].sort().at(-1) : article.reviewed_at;
}
function sourceTable(data, ids) {
  const products = new Map(data.manufacturer_review.products.map(p => [p.id, p]));
  const names = { 'xiaomi-4i-10k': 'Xiaomi 4i 10K', 'xiaomi-4i-20k': 'Xiaomi 4i 20K', 'ambrane-line-10': 'Ambrane Line 10', 'anker-nano-a1259': 'Anker Nano A1259H11', 'samsung-eb-p4520': 'Samsung EB-P4520' };
  return ids.map(id => {
    const p = products.get(id), f = p.facts;
    const output = f.advertised_max_output_w ? 'Up to ' + f.advertised_max_output_w + 'W' : 'USB-A up to 22.5W; USB-C up to 22W';
    const condition = id === 'anker-nano-a1259' ? 'Built-in USB-C cable; bidirectional charging' : id === 'samsung-eb-p4520' ? '45W with one compatible device; 402g' : id === 'xiaomi-4i-10k' ? 'PD and Quick Charge 3.0 listed' : id === 'xiaomi-4i-20k' ? '33W class; confirm compatible device/port' : '20W input is separate from output';
    return [names[id], f.advertised_capacity_mah.toLocaleString('en-IN') + 'mAh', output, condition];
  });
}
export function buildPowerBankDecisionModule(article, data) {
  const offers = data.catalog.offers;
  const all = stats(offers), variant = article.variant;
  let title, rows, headers, insight, note = catalogLabel(data), facts, sampleIds = [];
  if (variant.startsWith('budget-')) {
    const ceiling = Number(variant.split('-')[1]);
    const filtered = offers.filter(o => o.listed_price_inr < ceiling);
    const s = requireSegment(filtered, article.slug), samples = chooseGroups(filtered);
    title = 'Which recorded listings leave room in a ' + money(ceiling) + ' budget?';
    headers = ['Recorded listing', 'Merchant', 'Listed price', 'Room before delivery/cable'];
    rows = samples.map(o => [o.title.replace(/\s+-\s+[^-]+ Deal$/, ''), o.store_name, money(o.listed_price_inr), money(ceiling - o.listed_price_inr)]);
    sampleIds = samples.map(o => o.id);
    insight = s.rows + ' of ' + all.rows + ' catalog rows are below ' + money(ceiling) + ', spanning ' + s.groups + ' product-page groups and ' + s.brands + ' merchants. This is ' + (s.rows / all.rows * 100).toFixed(1) + '% of the dated catalog. The headroom column is the ceiling minus the listed price; any extra charges must fit inside it.';
    facts = [['budget_inr', ceiling], ['eligible_rows', s.rows], ['product_page_groups', s.groups], ['merchant_count', s.brands], ['catalog_share_percent', Number((s.rows / all.rows * 100).toFixed(1))]];
  } else if (variant === 'capacity') {
    title = 'How do the 10K and 20K catalog groups compare?';
    headers = ['Advertised title capacity', 'Listing variants', 'Product-page groups', 'Median listed price'];
    rows = [10000, 20000].map(capacity => {
      const s = requireSegment(offers.filter(o => o.advertised_capacity_mah === capacity), 'capacity ' + capacity);
      return [capacity.toLocaleString('en-IN') + 'mAh', s.rows, s.groups, money(s.median)];
    });
    const a = rows[0], b = rows[1];
    insight = 'The recorded 10K group has ' + (a[1] / b[1]).toFixed(2) + ' times as many listing variants as the 20K group. That describes this catalog’s assortment, not demand or quality. A 20K capacity label is twice 10K; it does not establish twice the usable phone recharges.';
    facts = rows.flatMap(row => [['capacity_' + row[0] + '_rows', row[1]], ['capacity_' + row[0] + '_groups', row[2]], ['capacity_' + row[0] + '_median', row[3]]]);
  } else if (variant === 'output') {
    title = 'What do the recorded 20W and 30W labels cover?';
    headers = ['Imported wattage label', 'Listing variants', 'Product-page groups', 'Median listed price'];
    rows = [20, 30].map(watts => {
      const s = requireSegment(offers.filter(o => o.catalog_advertised_output_w === watts), 'output label ' + watts);
      return [watts + 'W', s.rows, s.groups, money(s.median)];
    });
    insight = 'The mathematical ceiling difference is 10W, or 50% of 20W. It is not a measured time saving. Imported descriptions do not reliably resolve direction, shared-port limits or negotiated protocols; inspect the manufacturer output specification for each exact model.';
    facts = rows.flatMap(row => [['label_' + row[0] + '_rows', row[1]], ['label_' + row[0] + '_groups', row[2]], ['label_' + row[0] + '_median', row[3]]]);
  } else if (variant === 'wireless') {
    title = 'How much of the catalog mentions wireless or magnetic charging?';
    headers = ['Title evidence', 'Listing variants', 'Product-page groups', 'Median listed price'];
    rows = [true, false].map(flag => {
      const s = requireSegment(offers.filter(o => o.wireless_title_flag === flag), 'wireless flag ' + flag);
      return [flag ? 'Wireless / magnetic / MagSafe word present' : 'No matching word in the title', s.rows, s.groups, money(s.median)];
    });
    insight = rows[0][1] + ' of ' + all.rows + ' titles (' + (rows[0][1] / all.rows * 100).toFixed(1) + '%) carry a wireless or magnetic keyword. The other rows are unclassified, not automatically wired-only. A keyword also does not prove a certification, charging rate or fit with a particular phone case.';
    facts = [['wireless_title_rows', rows[0][1]], ['wireless_title_groups', rows[0][2]], ['unclassified_rows', rows[1][1]], ['wireless_title_median', rows[0][3]]];
  } else if (variant === 'retailer') {
    title = 'Does this catalog support an Amazon-versus-Flipkart price winner?';
    headers = ['Coverage check', 'Recorded result', 'Meaning for this comparison'];
    const amazon = offers.filter(o => o.store_slug === 'amazon').length;
    const flipkart = offers.filter(o => o.store_slug === 'flipkart').length;
    rows = [['Amazon merchant rows', amazon, 'No Amazon checkout total is established by this feed'], ['Flipkart merchant rows', flipkart, 'No Flipkart checkout total is established by this feed'], ['Brand-store listing variants', all.rows, all.brands + ' merchant names; not matched retailer pairs']];
    insight = 'This source supports a brand-store assortment view, not a head-to-head retailer price ranking. Use the six-field comparison checklist below when you have matching offers from both retailers; neither zero count means that the retailer has no power banks for sale.';
    facts = [['amazon_rows', amazon], ['flipkart_rows', flipkart], ['brand_store_rows', all.rows], ['brand_store_merchants', all.brands]];
  } else if (variant === 'quality') {
    title = 'How complete is the offer evidence in the saved catalog?';
    headers = ['Record field', 'Rows with evidence', 'What it establishes'];
    const knownCapacity = offers.filter(o => o.advertised_capacity_mah != null).length;
    const knownOutput = offers.filter(o => o.catalog_advertised_output_w != null).length;
    const checked = offers.filter(o => o.checkout_verified).length;
    rows = [['Usable stored price', all.rows + ' / ' + all.rows, 'A publisher-recorded amount, not a checkout quote'], ['Capacity parsed from title', knownCapacity + ' / ' + all.rows, 'Advertised label only'], ['Wattage parsed from imported description', knownOutput + ' / ' + all.rows, 'Port/direction still need checking'], ['Per-offer checkout verification evidence', checked + ' / ' + all.rows, 'No tested-code or current-price claim is inferred']];
    insight = (all.rows - knownCapacity) + ' rows have no capacity value in the title, and ' + (all.rows - knownOutput) + ' have no parseable imported wattage. Missing fields should trigger investigation rather than a negative product score. The absence of checkout evidence is why a large advertised discount alone cannot earn a recommendation.';
    facts = [['capacity_evidence_rows', knownCapacity], ['wattage_evidence_rows', knownOutput], ['checkout_evidence_rows', checked], ['capacity_unknown_rows', all.rows - knownCapacity], ['output_unknown_rows', all.rows - knownOutput]];
  } else {
    const ids = variant === 'shortlist' ? ['xiaomi-4i-10k', 'ambrane-line-10', 'anker-nano-a1259', 'xiaomi-4i-20k', 'samsung-eb-p4520'] : variant === 'anker-review' ? ['anker-nano-a1259', 'xiaomi-4i-10k'] : ['xiaomi-4i-10k', 'xiaomi-4i-20k'];
    title = variant === 'shortlist' ? 'Five manufacturer-listed candidates, compared on the same fields' : variant === 'anker-review' ? 'What changes when you choose the A1259 cable format?' : 'Where does the 4i 10K differ from its 20K sibling?';
    headers = ['Exact candidate', 'Advertised capacity', 'Published output ceiling', 'Buying condition'];
    rows = sourceTable(data, ids);
    note = 'Manufacturer specifications reviewed ' + dateLabel(data.reviewed_at) + '. These figures are published claims, not CouponPush measurements. Seller prices, sustained speed and exact phone results are outside this comparison.';
    insight = variant === 'shortlist' ? 'Three candidates are advertised at 10K and two at 20K. Output ceilings range from 22.5W to 45W, but the 45W Samsung claim is conditional on one compatible device. The five rows are a use-case shortlist, not an ordered performance or live-price ranking.'
      : variant === 'anker-review' ? 'The Anker and Xiaomi comparison keeps advertised capacity at 10K while changing the cable format and output ceiling. 30W is 1.33 times 22.5W as a ceiling; it is not evidence of a 33% charging-time improvement. Match the A1259H11 SKU rather than borrowing specifications from another Nano generation.'
        : 'The listed 20K capacity is twice 10K, while the maximum output changes from 22.5W to 33W: a 46.7% ceiling increase, not a measured charging-speed improvement. Capacity and output are separate attributes, and neither alone establishes the better purchase for your phone.';
    facts = rows.flatMap(row => [['capacity_' + row[0], row[1]], ['output_' + row[0], row[2]], ['condition_' + row[0], row[3]]]);
  }
  if (rows.length < 2 || facts.length < 3) throw new Error(article.slug + ': insufficient decision data');
  let html = '<section class="power-bank-evidence" aria-labelledby="decision-data"><h2 id="decision-data">' + escape(title) + '</h2>' + paragraph(note) + table(headers, rows) + paragraph(insight);
  if (sampleIds.length) html += '<p>Open the recorded listing details: ' + sampleIds.map((id, index) => '<a href="' + origin + '/coupon/' + id + '/">listing ' + (index + 1) + '</a>').join(', ') + '. Confirm the seller’s current total before ordering.</p>';
  html += '</section>';
  return { html, facts, insight, sampleIds };
}
function sourcesHtml(article, data) {
  const sources = article.fact_sources.map(key => data.sources[key]);
  const catalogModule = usesCatalog(article);
  return '<h2 id="sources">Sources and review method</h2>' +
    paragraph((sources.length ? 'Manufacturer and standards references reviewed ' : 'Catalog comparison method reviewed ') + dateLabel(article.reviewed_at) + '. Product specifications are published claims; CouponPush has not run hands-on tests, battery-efficiency measurements or seller checkout verification for these articles.') +
    (catalogModule ? paragraph(catalogLabel(data)) + paragraph('Grouping combines the same merchant product-page path and advertised capacity while ignoring colour query parameters. Capacity comes from title text and wattage from imported descriptions; missing fields stay unknown. Groups are not independently verified models.') : '') +
    (sources.length ? '<ul>' + sources.map(source => '<li><a href="' + escape(source.url) + '">' + escape(source.label) + '</a></li>').join('') + '</ul>' : '') +
    '<p>' + (catalogModule ? 'The catalog source is the <a href="' + escape(data.catalog.source_url) + '">CouponPush power-bank API</a>. The versioned capture supports this catalog’s counts, not the whole retail market. ' : '') + '<a href="' + origin + '/about/#offer-checks">How we label offers</a> explains the site’s evidence policy. <a href="' + origin + '/contact/">Report a correction</a> when a source or seller term changes.</p>' +
    '<p class="power-bank-disclosure">Affiliate disclosure: CouponPush may earn a commission if a purchase uses an affiliate link. The seller’s price, eligibility, return policy and warranty terms govern the purchase.</p>';
}
function relatedHtml(article, data) {
  const bySlug = new Map(data.articles.map(a => [a.slug, a]));
  return '<h2 id="related">Continue comparing power-bank options</h2><ul>' + article.related_slugs.map(slug => '<li><a href="' + origin + '/blog/' + slug + '">' + escape(bySlug.get(slug).title) + '</a></li>').join('') + '</ul>';
}
function renderBody(article, data, module) {
  const contextTable = ['retailer', 'quality'].includes(article.variant) ? heading(article.variant === 'retailer' ? 'Record these fields for the same retail variant' : 'The seven-check buying framework') + table(...article.table) : '';
  return '<div class="article-body">' +
    '<p class="power-bank-method-note">Source-based guide reviewed ' + escape(dateLabel(article.reviewed_at)) + '. Catalog figures are dated publisher records; seller checkout, stock and charging performance are not verified.</p>' +
    module.html + contextTable + markdown(article.body) +
    '<h2 id="questions">Common questions</h2>' + article.faq.map(([q, answer]) => '<h3>' + escape(q) + '</h3>' + paragraph(answer)).join('') +
    sourcesHtml(article, data) + relatedHtml(article, data) +
    '<div class="article-cta"><h2>Compare the current power-bank listings</h2><p>Use the hub to narrow models and merchants, then review the exact seller checkout total and terms.</p><a class="button button--light" href="' + hub + '">Browse power bank deals</a></div></div>';
}
function shingles(value, size = 5) {
  const words = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/);
  return new Set(words.slice(0, Math.max(0, words.length - size + 1)).map((_, i) => words.slice(i, i + size).join(' ')));
}
function similarity(a, b) {
  const intersection = [...a].filter(value => b.has(value)).length;
  return { jaccard: intersection / (a.size + b.size - intersection), uniqueA: 1 - intersection / a.size, uniqueB: 1 - intersection / b.size };
}
function visibleText(node) {
  if (node.type === 'text') return node.data;
  if (['head', 'script', 'style', 'noscript'].includes(node.name) || node.attribs && ('hidden' in node.attribs || node.attribs['aria-hidden'] === 'true')) return '';
  return (node.children || []).map(visibleText).join(' ');
}
export function validatePowerBankData(data) {
  if (data.schema_version !== 1 || data.articles.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(data.reviewed_at)) throw new Error('Invalid editorial manifest');
  if (!Number.isFinite(Date.parse(data.catalog.retrieved_at)) || !/^https:\/\/api\.couponpush\.com\//.test(data.catalog.source_url || '') || !/^[a-f0-9]{64}$/.test(data.catalog.sha256 || '') || !data.catalog.offers.length || data.catalog.verification !== 'publisher-records-only') throw new Error('Catalog provenance/verification is missing');
  const ids = new Set(), titles = new Set(), descriptions = new Set(), slugs = new Set(data.articles.map(a => a.slug));
  if (slugs.size !== data.articles.length) throw new Error('Duplicate article slug');
  for (const product of data.manufacturer_review.products) {
    const f = product.facts;
    if (!product.id || !/^https:\/\//.test(product.source) || !Number.isInteger(f.advertised_capacity_mah) || f.advertised_capacity_mah <= 0 || !(f.advertised_max_output_w > 0 || f.advertised_max_usb_a_output_w > 0)) throw new Error('Missing required manufacturer fact: ' + product.id);
  }
  for (const o of data.catalog.offers) {
    if (!Number.isInteger(o.id) || o.id <= 0 || ids.has(o.id) || !o.title || !o.store_name || !o.store_slug || !/^https:\/\//.test(o.seller_url || '') || !o.product_page_group || !Number.isFinite(o.listed_price_inr) || o.listed_price_inr <= 0 || o.listed_price_inr > 100000) throw new Error('Invalid or duplicate catalog row ' + o.id);
    if (/â[€\x80-\xBF]|Ã[\x80-\xBF]|�/.test(o.title)) throw new Error('Encoding error in catalog title ' + o.id);
    ids.add(o.id);
  }
  for (const a of data.articles) {
    const words = a.direct_answer.trim().split(/\s+/).length;
    if (words < 40 || words > 60 || !a.meta_title.trim() || !a.meta_description.trim() || a.meta_title.length > 60 || a.meta_description.length > 155 || !/^\d{4}-\d{2}-\d{2}$/.test(a.reviewed_at) || !a.body || !a.title || a.fact_sources.some(key => !data.sources[key])) throw new Error('Missing editorial fields or invalid lengths: ' + a.slug);
    if (titles.has(a.meta_title) || descriptions.has(a.meta_description) || new Set(a.related_slugs).size < 5 || a.related_slugs.some(slug => slug === a.slug || !slugs.has(slug))) throw new Error('Duplicate metadata or invalid related links: ' + a.slug);
    titles.add(a.meta_title); descriptions.add(a.meta_description);
  }
}
export async function preparePowerBankPseo({ check = false } = {}) {
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  validatePowerBankData(data);
  const planned = [], modules = new Map(), articleFacts = {};
  for (const article of data.articles) {
    const file = path.join(root, 'blog', article.slug + '.html');
    const original = await fs.readFile(file, 'utf8'), doc = parseDocument(original), nodes = elements(doc), normalizedOriginal = getOuterHTML(doc);
    const module = buildPowerBankDecisionModule(article, data); modules.set(article.slug, module);
    const body = nodes.find(n => hasClass(n, 'article-body')), dek = nodes.find(n => hasClass(n, 'article-dek'));
    if (!body || !dek || !nodes.find(n => hasClass(n, 'article-cover'))) throw new Error(article.slug + ': expected editorial layout and cover');
    replaceElement(body, fragment(renderBody(article, data, module)));
    replaceElement(dek, fragment('<p class="article-dek">' + escape(article.direct_answer) + '</p>'));
    const title = nodes.find(n => n.name === 'title'); title.children = parseDocument(escape(article.meta_title)).children;
    for (const node of nodes) {
      if (node.name === 'meta' && ['description'].includes(node.attribs.name)) node.attribs.content = article.meta_description;
      if (node.name === 'meta' && node.attribs.property === 'og:title') node.attribs.content = article.meta_title;
      if (node.name === 'meta' && node.attribs.property === 'og:description') node.attribs.content = article.meta_description;
      if (node.name === 'time' && node.parent && hasClass(node.parent, 'byline')) {
        node.attribs.datetime = article.reviewed_at; node.children = parseDocument('Sources reviewed ' + dateLabel(article.reviewed_at)).children;
      }
      if (node.name === 'nav' && hasClass(node, 'toc')) replaceElement(node, fragment('<nav class="toc" aria-label="On this page"><strong>On this page</strong><a href="#decision-data">Decision data</a><a href="#questions">Common questions</a><a href="#sources">Sources and method</a><a href="#related">Related guides</a></nav>'));
      if (node.name === 'script' && node.attribs.type === 'application/ld+json') {
        const json = JSON.parse(textContent(node));
        const update = value => {
          if (Array.isArray(value)) return value.forEach(update);
          if (!value || typeof value !== 'object') return;
          if (value['@type'] === 'Article' || value['@type'] === 'BlogPosting') {
            value.headline = article.title; value.description = article.meta_description; value.abstract = article.direct_answer;
            value.dateModified = modifiedDate(article, data); value.citation = article.fact_sources.map(key => data.sources[key].url);
            value.mainEntityOfPage = origin + '/blog/' + article.slug;
          }
          for (const child of Object.values(value)) if (typeof child === 'object') update(child);
        };
        update(json); node.children = parseDocument('<script>' + JSON.stringify(json).replaceAll('<', '\\u003c') + '</script>').children[0].children;
      }
    }
    const html = getOuterHTML(doc);
    const rendered = parseDocument(html), bodyNode = elements(rendered).find(n => hasClass(n, 'article-body'));
    articleFacts[article.slug] = { facts: module.facts, insight: module.insight, template: article.variant, date_modified: modifiedDate(article, data), inbound_context_links: data.articles.filter(a => a.related_slugs.includes(article.slug)).length };
    planned.push({ file, original, normalizedOriginal, html, slug: article.slug, pageShingles: shingles(visibleText(rendered)), bodyShingles: shingles(visibleText(bodyNode)), dataFacts: new Set(module.facts.map(([field, value]) => field + ':' + value)) });
  }
  const pairs = [], errors = [];
  for (let i = 0; i < planned.length; i++) for (let j = i + 1; j < planned.length; j++) {
    const full = similarity(planned[i].pageShingles, planned[j].pageShingles);
    const body = similarity(planned[i].bodyShingles, planned[j].bodyShingles);
    const facts = similarity(planned[i].dataFacts, planned[j].dataFacts);
    pairs.push({ a: planned[i].slug, b: planned[j].slug, full_page_jaccard: Number(full.jaccard.toFixed(4)), full_page_unique_a: Number(full.uniqueA.toFixed(4)), full_page_unique_b: Number(full.uniqueB.toFixed(4)), body_jaccard: Number(body.jaccard.toFixed(4)), body_unique_a: Number(body.uniqueA.toFixed(4)), body_unique_b: Number(body.uniqueB.toFixed(4)), data_unique_a: Number(facts.uniqueA.toFixed(4)), data_unique_b: Number(facts.uniqueB.toFixed(4)) });
    if (full.jaccard > .7 || body.jaccard > .7) errors.push('Similarity above 70%: ' + planned[i].slug + ' / ' + planned[j].slug);
    if (body.uniqueA < .4 || body.uniqueB < .4) errors.push('Distinct body-shingle fraction below 40%: ' + planned[i].slug + ' / ' + planned[j].slug);
  }
  for (const [slug, f] of Object.entries(articleFacts)) if (f.inbound_context_links < 5) errors.push(slug + ': fewer than five contextual inbound links');
  if (errors.length) throw new Error(errors.join('\n'));
  if (check && planned.some(p => p.normalizedOriginal !== p.html)) throw new Error('Power-bank HTML is stale; run node scripts/prepare-power-bank-pseo.mjs');
  if (!check) for (const p of planned) if (p.normalizedOriginal !== p.html) await fs.writeFile(p.file, p.html);
  const report = {
    reviewed_at: data.reviewed_at, catalog_retrieved_at: data.catalog.retrieved_at, scope: '10 existing editorial articles; scale gate held',
    pages: Object.keys(articleFacts).length, catalog_rows: data.catalog.offers.length,
    provenance: { source: data.catalog.source_url, sha256: data.catalog.sha256, checkout_verified_rows: data.catalog.offers.filter(o => o.checkout_verified).length },
    quality: { similarity_method: 'Jaccard and directional containment of distinct five-word shingles, reported separately for full visible page (including common navigation/footer) and editorial body; data uses exact field/value facts rather than paraphrase counts', max_jaccard: Math.max(...pairs.map(p => p.full_page_jaccard)), min_body_unique_fraction: Math.min(...pairs.flatMap(p => [p.body_unique_a, p.body_unique_b])), min_data_unique_fraction: Math.min(...pairs.flatMap(p => [p.data_unique_a, p.data_unique_b])), data_uniqueness_target: .6, data_overlap_expansion_holds: pairs.filter(p => p.data_unique_a < .6 || p.data_unique_b < .6).map(p => ({ a: p.a, b: p.b, a_unique: p.data_unique_a, b_unique: p.data_unique_b })), missing_capacity: data.catalog.offers.filter(o => o.advertised_capacity_mah == null).length, missing_output: data.catalog.offers.filter(o => o.catalog_advertised_output_w == null).length, normalized_display_titles: data.catalog.offers.filter(o => o.raw_title).length },
    page_facts: articleFacts, similarity_pairs: pairs, errors
  };
  const reportDir = path.join(root, '../output/seo/power-bank-pseo-2026-10-30');
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, 'content-quality.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await preparePowerBankPseo({ check: process.argv.includes('--check') });
  console.log('Power-bank editorial checks passed: ' + report.pages + ' pages; maximum full-page five-word shingle similarity ' + (report.quality.max_jaccard * 100).toFixed(1) + '%. Data-uniqueness expansion holds: ' + report.quality.data_overlap_expansion_holds.length + '.');
}
