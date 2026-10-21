import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advertisedText, matchesAdvertisement, materialOffer } from './reviewed-offer-source.mjs';
import { assertFreshCatalog } from './check-catalog-freshness.mjs';

test('source checks ignore scripts, styles and templates', () => {
    const html = '<script>Flat 15% OFF Sitewide</script><style>SALE</style><template>Flat 15% OFF Sitewide</template><p>Offer withdrawn</p>';
    assert.equal(matchesAdvertisement(advertisedText(html), ['Flat\\s+15%\\s+OFF\\s+Sitewide']), false);
    assert.equal(matchesAdvertisement(advertisedText('<p>Flat 15% &nbsp; OFF Sitewide</p>'), ['Flat\\s+15%\\s+OFF\\s+Sitewide']), true);
    assert.equal(matchesAdvertisement('Anything', []), false);
});
test('a code match cannot substitute for its advertised eligibility wording', () => {
    assert.equal(matchesAdvertisement('COMBO25 appears in a footer', ['25% OFF on Combos.{0,50}COMBO25']), false);
    assert.equal(matchesAdvertisement('25% OFF on Combos Code: COMBO25', ['25% OFF on Combos.{0,50}COMBO25']), true);
});
test('routine checking does not fake a material modification date', () => {
    const offer = { id: 'x', status: 'advertised', title: 'Offer', checkedAt: 'old', updatedAt: 'old', sourceHash: 'old' };
    assert.equal(materialOffer(offer), materialOffer({ ...offer, checkedAt: 'new', updatedAt: 'new', sourceHash: 'new' }));
    assert.notEqual(materialOffer(offer), materialOffer({ ...offer, status: 'not-advertised' }));
});
test('stale or invalid catalog captures cannot enter an automated publication', () => {
    const now = Date.parse('2026-10-21T12:00:00Z');
    assert.doesNotThrow(() => assertFreshCatalog({ capturedAt: '2026-10-21T07:00:00Z' }, now));
    for (const capturedAt of ['', 'nonsense', '2026-10-18', '2026-10-22']) assert.throws(() => assertFreshCatalog({ capturedAt }, now));
});
