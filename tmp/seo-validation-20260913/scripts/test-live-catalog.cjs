const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/services/api.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function fixture(browser) {
    let requests = 0, snapshots = 0;
    const context = {
        exports: {}, process: { env: {} }, URL, AbortSignal,
        require: () => ({ readCatalogSnapshot: () => { snapshots++; return [{ slug: 'old-store' }]; } }),
        fetch: async () => { requests++; return { ok: true, json: async () => ({ success: true, data: [{ slug: 'new-admin-store' }] }) }; },
        ...(browser ? { window: {} } : {}),
    };
    vm.runInNewContext(compiled, context);
    return { api: context.exports, counts: () => ({ requests, snapshots }) };
}
(async () => {
    const server = fixture(false);
    assert.equal((await server.api.storesApi.getAll())[0].slug, 'old-store');
    assert.deepEqual(server.counts(), { requests: 0, snapshots: 1 });
    const browser = fixture(true);
    assert.equal((await browser.api.storesApi.getAllFresh())[0].slug, 'new-admin-store');
    assert.deepEqual(browser.counts(), { requests: 1, snapshots: 0 });
    console.log('PASS: build reads its snapshot; browser fetches newly uploaded stores.');
})().catch(error => { console.error(error); process.exitCode = 1; });
