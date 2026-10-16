import assert from 'node:assert/strict';
import { compareCouponsByNewest } from '../src/lib/coupon-order.ts';

const batch = Array.from({ length: 24 }, (_, index) => ({ id: index + 1, created_at: '2026-10-16 10:00:00' }));
assert.deepEqual([...batch].sort(compareCouponsByNewest).slice(0, 18).map(c => c.id),
    Array.from({ length: 18 }, (_, index) => 24 - index), 'Bulk imports show the latest inserts first, including at the result limit');
const dated = [
    { id: 100, created_at: '2026-10-01 12:00:00', updated_at: '2026-10-20 12:00:00', click_count: 999 },
    { id: 2, created_at: '2026-10-16 10:00:00' },
    { id: 3, created_at: '2026-10-16T04:30:00Z' },
    { id: 102, created_at: 'invalid' },
    { id: 101, created_at: null },
];
assert.deepEqual([...dated].sort(compareCouponsByNewest).map(c => c.id), [3, 2, 100, 102, 101],
    'Creation date controls freshness, timezone formats agree, and edits/clicks do not promote old coupons');
assert.equal(batch[0].id, 1, 'Sorting a copy preserves the source feed');
console.log('Latest coupon checks passed: import ties, result boundary, dates, timezone, edits and missing dates.');
