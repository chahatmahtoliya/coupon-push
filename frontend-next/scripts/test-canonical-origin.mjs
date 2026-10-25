import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import worker from '../public/canonical-origin.mjs';

test('Deployment invokes the redirect Worker before assets and excludes its source', () => {
    const config = JSON.parse(fs.readFileSync(new URL('../public/wrangler.jsonc', import.meta.url), 'utf8'));
    assert.equal(config.main, './canonical-origin.mjs');
    assert.equal(config.assets.binding, 'ASSETS');
    assert.equal(config.assets.run_worker_first, true);
    const excluded = fs.readFileSync(new URL('../public/.assetsignore', import.meta.url), 'utf8').split(/\r?\n/);
    assert.ok(excluded.includes('canonical-origin.mjs'));
});

for (const origin of ['http://couponpush.com', 'http://www.couponpush.com', 'https://www.couponpush.com']) {
    test(`${origin} redirects pages and assets to the canonical origin`, async () => {
        for (const path of ['/', '/store/kapiva-coupon-code/?ref=a%26b', '/assets/images/logo.png']) {
            const response = await worker.fetch(new Request(origin + path), {
                ASSETS: { fetch() { assert.fail('Origin redirect must run before asset lookup'); } },
            });
            assert.equal(response.status, 301);
            assert.equal(response.headers.get('Location'), 'https://couponpush.com' + path);
        }
    });
}

for (const origin of ['https://couponpush.com', 'http://localhost:8787', 'https://coupon-push.example.workers.dev']) {
    test(`${origin} delegates to static assets without changing the request`, async () => {
        // Asset redirects and 404 responses must retain their original status and headers.
        for (const assetResponse of [new Response('OK'), new Response(null, { status: 301, headers: { Location: '/stores/' } }), new Response('Missing', { status: 404 })]) {
            const request = new Request(origin + '/store/?ref=one', { method: 'HEAD' });
            const response = await worker.fetch(request, {
                ASSETS: { fetch(received) { assert.equal(received, request); return assetResponse; } },
            });
            assert.equal(response, assetResponse);
        }
    });
}

test('Published festival preview redirects permanently to its canonical store page', async () => {
    for (const path of ['/stores/view/', '/stores/view']) {
        const response = await worker.fetch(new Request(`https://couponpush.com${path}?slug=amazon-great-indian-festival-2026&ref=one%26two`), {
            ASSETS: { fetch() { assert.fail('Published store preview must redirect before assets'); } },
        });
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('Location'), 'https://couponpush.com/store/amazon-great-indian-festival-2026/?ref=one%26two');
    }
});

test('Other store previews and ambiguous slug parameters retain the existing response', async () => {
    for (const query of ['', '?slug=another-new-store', '?slug=amazon-great-indian-festival-2026&slug=another-new-store']) {
        const request = new Request('https://couponpush.com/stores/view/' + query);
        const asset = new Response('Preview', { headers: { 'X-Robots-Tag': 'noindex' } });
        assert.equal(await worker.fetch(request, { ASSETS: { fetch(received) { assert.equal(received, request); return asset; } } }), asset);
    }
});

test('Power bank legacy and case aliases redirect once to the exact requested URL', async () => {
    for (const origin of ['http://couponpush.com', 'https://www.couponpush.com', 'https://couponpush.com']) {
        for (const path of ['/category/power-banks', '/category/power-banks/', '/power-bank-deals', '/power-bank-deals/', '/Power-Bank-Deals']) {
            const response = await worker.fetch(new Request(`${origin}${path}?ref=one%26two`), {
                ASSETS: { fetch() { assert.fail('Category aliases must redirect before assets'); } },
            });
            assert.equal(response.status, 301);
            assert.equal(response.headers.get('Location'), 'https://couponpush.com/Power-Bank-Deals/?ref=one%26two');
        }
    }
});

test('The canonical Power Bank Deals page is served without a redirect loop', async () => {
    const request = new Request('https://couponpush.com/Power-Bank-Deals/?ref=one');
    const asset = new Response('Power Bank Deals');
    assert.equal(await worker.fetch(request, { ASSETS: { fetch(received) { assert.equal(received, request); return asset; } } }), asset);
});
