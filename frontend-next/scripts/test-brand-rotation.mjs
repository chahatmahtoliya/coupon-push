import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { rotateOffersByBrand } from '../src/lib/brand-rotation.ts';

test('uneven brands rotate in rounds without losing offers', () => {
    const input = ['a', 'a', 'a', 'b', 'b', 'c'].map((store_slug, id) => ({ id, store_slug }));
    assert.deepEqual(rotateOffersByBrand(input).map(o => o.id), [0, 3, 5, 1, 4, 2]);
    assert.deepEqual(input.map(o => o.id), [0, 1, 2, 3, 4, 5]);
});

test('empty and single-brand lists keep their order', () => {
    assert.deepEqual(rotateOffersByBrand([]), []);
    const input = [{ id: 1, store_slug: 'a' }, { id: 2, store_slug: 'a' }];
    assert.deepEqual(rotateOffersByBrand(input), input);
});

test('the full power-bank inventory opens with every brand and paginates without duplicates', () => {
    const snapshot = JSON.parse(fs.readFileSync(new URL('../src/data/deployed-snapshot.json', import.meta.url), 'utf8'));
    const input = [...snapshot.categories['power-banks'].coupons].sort((a, b) => b.click_count - a.click_count);
    const result = rotateOffersByBrand(input);
    const brandCount = new Set(input.map(o => o.store_slug)).size;
    assert.equal(new Set(result.slice(0, brandCount).map(o => o.store_slug)).size, brandCount);
    const paginated = Array.from({ length: Math.ceil(result.length / 12) }, (_, i) => result.slice(i * 12, i * 12 + 12)).flat();
    assert.deepEqual(paginated.map(o => o.id).sort((a, b) => a - b), input.map(o => o.id).sort((a, b) => a - b));
    assert.equal(new Set(result.map(o => o.id)).size, input.length);
    for (const slug of new Set(input.map(o => o.store_slug))) {
        assert.deepEqual(result.filter(o => o.store_slug === slug), input.filter(o => o.store_slug === slug));
    }
    assert.deepEqual(rotateOffersByBrand(input), result);
});

test('brand filters rotate only their remaining offers', () => {
    const input = ['a', 'a', 'b', 'c', 'c'].map((store_slug, id) => ({ id, store_slug }));
    const filtered = input.filter(o => o.store_slug !== 'b');
    assert.deepEqual(rotateOffersByBrand(filtered).map(o => o.store_slug), ['a', 'c', 'a', 'c']);
});
