// Exercise the actual API client's URL normalization with an in-memory response.
// Run from frontend-next: node --test scripts/test-store-logo-urls.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadSource(filename, dependencies = {}, globals = {}) {
    const source = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    vm.runInNewContext(outputText, {
        exports, URL, AbortSignal, process: { env: {} },
        require(name) {
            if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
            return dependencies[name];
        },
        ...globals,
    }, { filename });
    return exports;
}

test('store logos retain the origin selected by the backend', async () => {
    const urls = [
        'https://api.couponpush.com/uploads/stores/new-logo.png',
        'https://media.couponpush.com/uploads/stores/legacy-logo.png',
        'https://brand.example/logo.png',
        'https://api.couponpush.com/uploads/partners/brand.png',
        'https://api.couponpush.com/uploads/hero/slide.png',
        '/uploads/stores/legacy-relative.png',
        'https://couponpush.com/uploads/stores/legacy-site.png',
        'https://api.couponpush.com/uploads/deals/deal.png',
    ];
    const api = loadSource('src/services/api.ts', {
        '@/lib/snapshot-api': { readCatalogSnapshot: () => undefined },
        '@/lib/catalog-normalization': { normalizeCatalog: value => value },
        '@/lib/routes': { getCanonicalStoreSlug: value => value },
        '@/lib/missing-images': loadSource('src/lib/missing-images.ts'),
    }, {
        window: {},
        fetch: async () => ({ ok: true, json: async () => ({
            success: true,
            data: urls.map((logo, id) => ({ id, logo, store_logo: logo })),
        }) }),
    });
    const result = await api.storesApi.getAll();
    const expected = [...urls];
    expected[5] = 'https://media.couponpush.com/uploads/stores/legacy-relative.png';
    expected[6] = 'https://media.couponpush.com/uploads/stores/legacy-site.png';
    expected[7] = 'https://media.couponpush.com/uploads/deals/deal.png';
    for (let i = 0; i < expected.length; i++) {
        assert.equal(result[i].logo, expected[i]);
        assert.equal(result[i].store_logo, expected[i]);
    }
    const snapshot = loadSource('src/lib/deployed-snapshot.ts', {
        '@/data/deployed-snapshot.json': { default: { storesPage: { initialStores: urls.map(logo => ({ logo })) } } },
        './catalog-normalization': { normalizeCatalog: value => value },
        './missing-images': loadSource('src/lib/missing-images.ts'),
    });
    for (let i = 0; i < expected.length; i++) {
        // Hero URLs follow the snapshot's existing media policy.
        const snapshotExpected = i === 4 ? expected[i].replace('api.couponpush.com', 'media.couponpush.com') : expected[i];
        assert.equal(snapshot.deployedSnapshot.storesPage.initialStores[i].logo, snapshotExpected);
    }
});
