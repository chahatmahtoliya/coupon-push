const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const result = { exports: {} };
    vm.runInNewContext(code, { module: result, exports: result.exports, URL, Date, console, require: name => name.startsWith('@/')
        ? name.endsWith('.json') ? require(path.join(root, 'src', name.slice(2))) : load(path.join('src', name.slice(2)) + '.ts')
        : require(name) });
    return result.exports;
}
const evidence = load('src/lib/offer-evidence.ts');
assert.equal(evidence.isCheckoutTested({ is_verified: true }), false, 'A legacy boolean alone must not claim testing');
const tested = { is_verified: true, source_url: 'https://merchant.example/offer', checked_at: '2026-09-01', verification_method: 'checkout_tested' };
assert.equal(evidence.isCheckoutTested(tested), true);
assert.equal(evidence.isCheckoutTested({ ...tested, checked_at: '2026-02-30' }), false);
assert.equal(evidence.isCheckoutTested({ ...tested, checked_at: '2099-01-01' }), false);
assert.equal(evidence.isCheckoutTested({ ...tested, source_url: 'javascript:alert(1)' }), false);
assert.equal(evidence.offerSource({ source_url: 'https://user:secret@merchant.example/' }), null);
assert.equal(evidence.offerEvidenceLabel({ ...tested, verification_method: 'merchant_advertised' }), 'Merchant advertised');
const { normalizeCatalog } = load('src/lib/catalog-normalization.ts');
const normalized = normalizeCatalog([{ slug: 'dot-key-coupon-codes', name: 'duplicate' }, { slug: 'dot-key', name: 'Dot &amp;amp; Key' }]);
assert.equal(normalized.length, 1);
assert.equal(normalized[0].name, 'Dot & Key');
assert.equal(normalizeCatalog([{ store_slug: 'derma-co-coupon-code', id: 1 }]).length, 0, 'API refresh must not reintroduce quarantined inventory');
assert.equal(normalizeCatalog({ affiliate_link: 'https://example.com/?a=1&amp;b=2' }).affiliate_link, 'https://example.com/?a=1&amp;b=2', 'Text normalization must not rewrite URLs');
const couponCodes = load('src/utils/coupon.ts');
assert.equal(couponCodes.getCouponCode({ code: 'COUPON CODE ACTIVATED' }), '');
assert.equal(couponCodes.getCouponCode({ code: ' no-code-required ' }), '');
assert.equal(couponCodes.getCouponCode({ code: ' SAVE-10 ' }), 'SAVE-10', 'Actual codes retain punctuation and case');
assert.equal(couponCodes.getCouponCode({ code: 'DEAL' }), 'DEAL', 'Do not reject a real code merely because it says DEAL');
assert.equal(couponCodes.getCouponCtaLabel({ code: 'COUPON CODE ACTIVATED' }), 'Get Deal');
const placeholder = { id: 18, store_id: 3, store_slug: 'flipkart', title: 'Unsubstantiated earbuds saving', code: 'COUPON CODE ACTIVATED' };
assert.equal(normalizeCatalog([placeholder, { ...placeholder, id: 19, code: 'SAVE10' }]).length, 1, 'Live refresh must not revive placeholder offers');
assert.equal(normalizeCatalog(placeholder), null, 'A direct detail refresh must not revive the quarantined record');
const { getStorePseoContent } = load('src/lib/store-pseo.ts');
for (const slug of ['deconstruct', 'snitch', 'foxtale', 'kapiva-coupon-code', 'newme', 'pilgrim']) {
    const profile = getStorePseoContent({ slug, storeName: slug, coupons: [], offerCount: 0, codeCount: 0, dealCount: 0 });
    assert.ok(profile.metaTitle.includes('Offers & Deals'));
    assert.ok(!profile.metaTitle.includes('Coupon Codes'), 'Empty inventory must not promise active codes');
    assert.ok(profile.faqs.length >= 2);
}
for (const [slug, storeName] of [['amazon', 'Amazon'], ['flipkart', 'Flipkart'], ['blinkit', 'Blinkit'], ['the-derma-co', 'The Derma Co']]) {
    const profile = getStorePseoContent({ slug, storeName, coupons: [], offerCount: 0, codeCount: 0, dealCount: 0 });
    assert.ok(profile.metaTitle.includes('Offers & Deals'));
    assert.ok(!/2025|verified|updated daily|is live/i.test(profile.metaTitle + profile.metaDescription));
    assert.ok(profile.faqs.length >= 3);
}
const flipkart = getStorePseoContent({ slug: 'flipkart', storeName: 'Flipkart', coupons: [], offerCount: 0, codeCount: 0, dealCount: 0 });
assert.ok(flipkart.sections.some(section => section.id === 'earbuds-offers'));
const amazon = getStorePseoContent({ slug: 'amazon', storeName: 'Amazon', coupons: [], offerCount: 0, codeCount: 0, dealCount: 0 });
assert.ok(amazon.sections.some(section => section.id === 'headphone-offers'));
console.log('SEO regression checks passed: evidence, unsafe sources, dates, duplicate refresh, text normalization and empty inventory.');
