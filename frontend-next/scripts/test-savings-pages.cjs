const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./lib/load-typescript.cjs');
const { eligibleReviewedOffers, buildSavingsPage, savingsDefinitions, getSavingsPages } = load('src/lib/savings-pages.ts');
const now = new Date('2026-10-21T12:00:00Z');
const offer = { id: 'one', storeSlug: 'dot-key', title: 'An advertised offer', code: 'SAVE', types: ['skincare'], conditions: ['Eligible items only.', 'Confirm the final total.'], sourceUrl: 'https://www.dotandkey.com/', status: 'advertised', checkedAt: '2026-10-21T07:00:00Z', updatedAt: '2026-10-21T07:00:00Z' };

test('fresh merchant matches qualify; old, future and missing matches do not', () => {
    for (const patch of [{ status: 'not-advertised' }, { checkedAt: '2026-10-01' }, { checkedAt: '2026-10-22' }, { sourceUrl: 'javascript:alert(1)' }, { sourceUrl: 'https://unrelated.example/' }, { checkedAt: 'invalid' }, { conditions: [] }]) assert.equal(eligibleReviewedOffers([{ ...offer, ...patch }], now).length, 0, JSON.stringify(patch));
    assert.equal(eligibleReviewedOffers([offer], now).length, 1);
});
test('duplicated content and unknown merchants cannot inflate the population', () => {
    assert.equal(eligibleReviewedOffers([offer, { ...offer, id: 'copy' }], now).length, 1);
    assert.equal(eligibleReviewedOffers([offer, { ...offer, id: 'copy', title: 'Different wording for the same code' }], now).length, 1);
    assert.equal(eligibleReviewedOffers([{ ...offer, storeSlug: 'unknown' }], now).length, 0);
});
test('offer count alone does not make a pSEO page eligible', () => {
    const definition = savingsDefinitions[0];
    const five = Array.from({ length: 5 }, (_, index) => ({ ...offer, id: `offer-${index}`, title: `Offer ${index}` }));
    assert.equal(buildSavingsPage(definition, five).eligible, false, 'One store cannot produce a cross-store comparison');
    const diverse = five.map((item, index) => ({ ...item, storeSlug: ['dot-key', 'plum', 'the-derma-co'][index % 3] }));
    assert.equal(buildSavingsPage(definition, diverse).eligible, true);
    assert.equal(buildSavingsPage(definition, diverse.slice(0, 4)).eligible, false);
    assert.equal(buildSavingsPage({ ...definition, sections: [] }, diverse).eligible, false);
});
test('the pilot is limited to useful sourced page families', () => {
    const pages = getSavingsPages(new Date());
    assert.deepEqual(Array.from(pages.filter(page => page.published).map(page => page.slug)), ['skincare', 'free-gifts']);
    assert.ok(pages.filter(page => page.eligible).every(page => ['skincare', 'free-gifts'].includes(page.slug)));
    assert.ok(pages.filter(page => page.eligible).every(page => page.offers.length >= 5 && page.stores.length >= 3));
    assert.ok(pages.filter(page => !page.published).every(page => !page.eligible));
});
