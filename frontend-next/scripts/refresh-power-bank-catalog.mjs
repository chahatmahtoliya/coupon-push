import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePowerBankData } from './prepare-power-bank-pseo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/power-bank-editorial.json');
function displayTitle(value) {
  return value.replaceAll('â€“', '–').replaceAll('â€”', '—').replaceAll('â€™', '’').replaceAll('â‚¹', '₹');
}
export function normalizePowerBankCapture(capture, current) {
  if (!Array.isArray(capture.offers) || !capture.offers.length || !/^https:\/\/api\.couponpush\.com\/api\/coupons\.php\?/.test(capture.source_url || '') || !/^[a-f0-9]{64}$/.test(capture.sha256 || '') || !Number.isFinite(Date.parse(capture.retrieved_at))) {
    throw new Error('Expected a nonempty dated publisher capture with source URL and SHA-256');
  }
  const offers = capture.offers.map(row => {
    const title = displayTitle(row.title || ''), capacity = /([\d,]+)\s*mAh/i.exec(title);
    const watts = /([\d.]+)\s*W\s+advertised/i.exec(row.description || '');
    const seller = new URL(row.affiliate_link);
    if (seller.protocol !== 'https:') throw new Error('Seller URL must use HTTPS: ' + row.id);
    const mah = capacity ? Number(capacity[1].replaceAll(',', '')) : null;
    return {
      id: Number(row.id), title, store_name: row.store_name, store_slug: row.store_slug,
      listed_price_inr: row.sale_price == null ? null : Number(row.sale_price),
      advertised_capacity_mah: mah, catalog_advertised_output_w: watts ? Number(watts[1]) : null,
      wireless_title_flag: /wireless|magnetic|magsafe/i.test(title),
      product_page_group: row.store_slug + '|' + seller.hostname + seller.pathname.replace(/\/$/, '') + '|' + (mah || 'unknown'),
      seller_url: row.affiliate_link,
      // An imported check date/method is not evidence of a seller checkout test.
      source_checked_at: row.checked_at || null,
      source_verification_method: row.verification_method || null,
      checkout_verified: false,
      ...(title !== row.title ? { raw_title: row.title } : {}),
    };
  });
  const result = structuredClone(current);
  Object.assign(result.catalog, { retrieved_at: capture.retrieved_at, source_url: capture.source_url, sha256: capture.sha256, offers });
  validatePowerBankData(result);
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[process.argv.indexOf('--input') + 1];
  if (!process.argv.includes('--input') || !input) throw new Error('Usage: node scripts/refresh-power-bank-catalog.mjs --input path/to/catalog-retrieval.json');
  const capture = JSON.parse(await fs.readFile(path.resolve(input), 'utf8'));
  const current = JSON.parse(await fs.readFile(file, 'utf8'));
  const next = normalizePowerBankCapture(capture, current);
  const serialized = JSON.stringify(next, null, 2) + '\n';
  if (serialized !== await fs.readFile(file, 'utf8')) await fs.writeFile(file, serialized);
  console.log('Imported ' + next.catalog.offers.length + ' dated publisher rows; no seller checkout verification was inferred.');
}
