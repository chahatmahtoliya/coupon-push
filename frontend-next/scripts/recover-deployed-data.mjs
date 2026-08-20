import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const deploymentRoot = path.resolve(projectRoot, '..', 'public_html (1)');
const outputPath = path.join(projectRoot, 'src', 'data', 'deployed-snapshot.json');

function findProps(value, keys) {
    if (!value || typeof value !== 'object') return null;
    if (!Array.isArray(value) && keys.some((key) => Object.hasOwn(value, key))) return value;
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
        const found = findProps(child, keys);
        if (found) return found;
    }
    return null;
}

function readPageProps(filePath, keys) {
    if (!fs.existsSync(filePath)) return null;
    const html = fs.readFileSync(filePath, 'utf8');
    const expressionPattern = /<script>self\.__next_f\.push\((\[1,"(?:\\.|[^"\\])*"\])\)<\/script>/g;
    for (const match of html.matchAll(expressionPattern)) {
        try {
            const [, chunk] = JSON.parse(match[1]);
            const colon = chunk.indexOf(':');
            if (colon < 0) continue;
            const payload = JSON.parse(chunk.slice(colon + 1));
            const props = findProps(payload, keys);
            if (props) return props;
        } catch {
            // RSC includes many non-JSON protocol chunks; only component prop chunks matter here.
        }
    }
    return null;
}

function routeProps(...segments) {
    return readPageProps(path.join(deploymentRoot, ...segments, 'index.html'), [
        'initialData', 'initialStores', 'initialCategories', 'initialDeals', 'initialOffers',
        'initialFeaturedCoupons', 'initialCoupon',
    ]);
}

const snapshot = {
    generatedFrom: 'public_html (1)',
    homepage: readPageProps(path.join(deploymentRoot, 'index.html'), ['initialFeaturedCoupons']),
    storesPage: routeProps('stores'),
    categoriesPage: routeProps('categories'),
    dealsPage: routeProps('deals'),
    offersPage: routeProps('offers'),
    stores: {},
    categories: {},
    coupons: {},
};

for (const base of ['store', 'category', 'coupon']) {
    const directory = path.join(deploymentRoot, base);
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const props = routeProps(base, entry.name);
        if (!props) continue;
        if (base === 'store' && props.initialData) snapshot.stores[entry.name] = props.initialData;
        if (base === 'category' && props.initialData) snapshot.categories[entry.name] = props.initialData;
        if (base === 'coupon') snapshot.coupons[entry.name] = props.initialCoupon || props.initialData || null;
    }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`);
console.log(`Recovered ${Object.keys(snapshot.stores).length} stores, ${Object.keys(snapshot.categories).length} categories, and ${Object.keys(snapshot.coupons).length} coupons.`);
console.log(outputPath);
