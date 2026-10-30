import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';
import { buildPowerBankDecisionModule, validatePowerBankData } from './prepare-power-bank-pseo.mjs';
import { normalizePowerBankCapture } from './refresh-power-bank-catalog.mjs';

const source = JSON.parse(await fs.readFile(new URL('../src/data/power-bank-editorial.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(source);
const article = variant => source.articles.find(a => a.variant === variant);

test('dated source rows produce independently checked budget/capacity counts', () => {
  validatePowerBankData(source);
  const budget = buildPowerBankDecisionModule(article('budget-1000'), source);
  assert.equal(new Map(budget.facts).get('eligible_rows'), 25);
  assert.equal(new Map(budget.facts).get('product_page_groups'), 21);
  assert.equal(new Map(budget.facts).get('merchant_count'), 5);
  const capacity = new Map(buildPowerBankDecisionModule(article('capacity'), source).facts);
  assert.equal(capacity.get('capacity_10,000mAh_rows'), 143);
  assert.equal(capacity.get('capacity_20,000mAh_rows'), 56);
});

test('required record fields and duplicate IDs block publication', () => {
  const missingId = fresh(); delete missingId.catalog.offers[0].id;
  assert.throws(() => validatePowerBankData(missingId), /Invalid or duplicate catalog row/);
  const missingHash = fresh(); delete missingHash.catalog.sha256;
  assert.throws(() => validatePowerBankData(missingHash), /Catalog provenance/);
  const duplicateSlug = fresh(); duplicateSlug.articles[1].slug = duplicateSlug.articles[0].slug;
  assert.throws(() => validatePowerBankData(duplicateSlug), /Duplicate article slug/);
  const missingPrice = fresh(); missingPrice.catalog.offers[0].listed_price_inr = null;
  assert.throws(() => validatePowerBankData(missingPrice), /Invalid or duplicate catalog row/);
  const duplicate = fresh(); duplicate.catalog.offers.push(duplicate.catalog.offers[0]);
  assert.throws(() => validatePowerBankData(duplicate), /Invalid or duplicate catalog row/);
  const brokenText = fresh(); brokenText.catalog.offers[0].title = 'Broken â€“ title';
  assert.throws(() => validatePowerBankData(brokenText), /Encoding error/);
});

test('missing decision cohorts fail instead of showing a zero median price', () => {
  const missingOutput = fresh();
  missingOutput.catalog.offers = missingOutput.catalog.offers.filter(o => o.catalog_advertised_output_w !== 30);
  assert.throws(() => buildPowerBankDecisionModule(article('output'), missingOutput), /Required catalog segment has no rows: output label 30/);
  const missingCapacity = fresh();
  missingCapacity.catalog.offers = missingCapacity.catalog.offers.filter(o => o.advertised_capacity_mah !== 20000);
  assert.throws(() => buildPowerBankDecisionModule(article('capacity'), missingCapacity), /Required catalog segment has no rows: capacity 20000/);
  const noBudget = fresh(); noBudget.catalog.offers = noBudget.catalog.offers.map(o => ({ ...o, listed_price_inr: 3000 }));
  assert.throws(() => buildPowerBankDecisionModule(article('budget-1000'), noBudget), /Required catalog segment has no rows/);
});

test('under-budget includes only prices strictly below the ceiling', () => {
  const fixture = fresh();
  fixture.catalog.offers = fixture.catalog.offers.slice(0, 3).map((o, i) => ({ ...o, product_page_group: 'fixture-' + i, listed_price_inr: [999, 1000, 899][i] }));
  const module = buildPowerBankDecisionModule(article('budget-1000'), fixture);
  assert.equal(new Map(module.facts).get('eligible_rows'), 2);
  assert.ok(!module.sampleIds.includes(fixture.catalog.offers[1].id));
});

test('manufacturer values and article answer lengths are required', () => {
  const missingFact = fresh(); missingFact.manufacturer_review.products[0].facts.advertised_capacity_mah = null;
  assert.throws(() => validatePowerBankData(missingFact), /Missing required manufacturer fact/);
  const missingAnswer = fresh(); missingAnswer.articles[0].direct_answer = '';
  assert.throws(() => validatePowerBankData(missingAnswer), /Missing editorial fields/);
});

test('manufacturer-only modules omit catalog pricing claims and empty source lists', () => {
  const review = buildPowerBankDecisionModule(article('anker-review'), source);
  assert.ok(!review.html.includes('Publisher catalog retrieved'));
  assert.ok(review.html.includes('A1259'));
  assert.ok(!review.html.includes('Rs.0'));
});

test('capture import preserves provenance, grouping and unverified status', () => {
  const capture = { retrieved_at: '2026-10-30T06:00:00Z', source_url: 'https://api.couponpush.com/api/coupons.php?category=power-banks', sha256: 'a'.repeat(64), offers: [
    { id: 1, title: 'Example â€“ Blue 10,000mAh', description: '30W advertised power', affiliate_link: 'https://merchant.example/products/one?variant=blue', store_slug: 'example', store_name: 'Example', sale_price: 899 },
    { id: 2, title: 'Example – Red 10,000mAh', description: '30W advertised power', affiliate_link: 'https://merchant.example/products/one?variant=red', store_slug: 'example', store_name: 'Example', sale_price: 999 },
  ] };
  const next = normalizePowerBankCapture(capture, source);
  assert.equal(next.catalog.offers[0].title, 'Example – Blue 10,000mAh');
  assert.equal(next.catalog.offers[0].raw_title, capture.offers[0].title);
  assert.equal(next.catalog.offers[0].product_page_group, next.catalog.offers[1].product_page_group);
  assert.ok(next.catalog.offers.every(o => o.checkout_verified === false));
  assert.equal(next.catalog.sha256, capture.sha256);
  const checkedCapture = structuredClone(capture);
  checkedCapture.offers[0].checked_at = '2026-10-30T06:00:00Z';
  checkedCapture.offers[0].verification_method = 'manufacturer-page-review';
  const checked = normalizePowerBankCapture(checkedCapture, source).catalog.offers[0];
  assert.equal(checked.checkout_verified, false);
  assert.equal(checked.source_verification_method, 'manufacturer-page-review');
  assert.throws(() => normalizePowerBankCapture({ ...capture, source_url: 'https://unrelated.example/' }, source), /Expected a nonempty dated publisher capture/);
});
