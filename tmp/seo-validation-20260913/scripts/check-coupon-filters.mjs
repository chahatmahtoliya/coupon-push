import assert from 'node:assert/strict';
import { couponExpiry, couponFilterQuery, defaultFilters, filterCoupons, readCouponFilters } from '../src/lib/coupon-filters.ts';

const now = Date.parse('2026-09-11T12:00:00+05:30');
const base = { store_name: 'Beauty Shop', description: 'First order offer', discount_type: 'percentage', discount_value: 10, expiry_date: null, is_verified: false, created_at: '2026-09-01 10:00:00', click_count: 0, categorySlugs: ['beauty'] };
const coupons = [
    { ...base, id: 1, store_slug: 'alpha', title: 'Ten percent', code: 'SAVE10', click_count: 30 },
    { ...base, id: 2, store_slug: 'beta', title: 'Sale deal', code: null, categorySlugs: ['fashion'], created_at: '2026-09-10 10:00:00', expiry_date: '2026-09-11', discount_type: 'flat', is_verified: true },
    { ...base, id: 3, store_slug: 'alpha', title: 'Old offer', code: 'OLD', expiry_date: '2026-09-10' },
    { ...base, id: 4, store_slug: 'beta', title: 'Unknown date', code: '', expiry_date: 'invalid' },
];
const ids = patch => filterCoupons(coupons, { ...defaultFilters, ...patch }, now).map(coupon => coupon.id);
assert.deepEqual(ids({}), [2, 1], 'Latest sorting excludes expired and invalid dates');
assert.deepEqual(ids({ sort: 'popular' }), [1, 2], 'Popularity uses clicks');
assert.deepEqual(ids({ sort: 'ending' }), [2, 1], 'Unknown expiry sorts last');
assert.deepEqual(ids({ stores: ['alpha', 'beta'], categories: ['beauty'], type: 'code', q: 'save10' }), [1], 'OR within a facet, AND between facets, code search');
assert.deepEqual(ids({ categories: ['beauty', 'fashion'] }), [2, 1], 'Multiple categories use OR');
assert.deepEqual(ids({ type: 'deal', discount: 'fixed', verified: true, expiring: true }), [2], 'Flat amounts normalize, no-code and expiry filters combine');
assert.deepEqual(ids({ stores: ['missing'] }), [], 'Unknown stores have an empty result');
assert.deepEqual(ids({ q: 'does not exist' }), [], 'Unmatched search has an empty result');
assert.equal(couponExpiry(coupons[1]), Date.parse('2026-09-11T23:59:59+05:30'), 'Date-only expiry lasts through the India calendar day');
assert.equal(filterCoupons(coupons, defaultFilters, Date.parse('2026-09-12T00:00:00+05:30')).some(coupon => coupon.id === 2), false);
const combined = { ...defaultFilters, q: 'Dot & Key', stores: ['alpha', 'beta'], categories: ['beauty'], verified: true, expiring: true, discount: 'percentage', sort: 'ending' };
assert.deepEqual(readCouponFilters(new URLSearchParams(couponFilterQuery(combined))), combined, 'Filter URL round trip');
assert.deepEqual(readCouponFilters(new URLSearchParams('type=bad&sort=bad&discount=bad')), defaultFilters, 'Invalid option values use defaults');
console.log('Coupon filter checks passed: combinations, search, expiry, sorting, empty results and URL state.');
