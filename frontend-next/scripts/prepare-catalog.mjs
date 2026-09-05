import fs from 'node:fs/promises';
import path from 'node:path';

try {
const root = process.cwd();
const file = path.join(root, 'src/data/deployed-snapshot.json');
const refresh = process.argv.includes('--refresh');
const snapshot = JSON.parse(await fs.readFile(file, 'utf8'));
const reportDir = path.join(root, '../output/seo');
await fs.mkdir(reportDir, { recursive: true });

async function request(endpoint) {
    const base = (process.env.API_URL || 'https://api.couponpush.com/api').replace(/\/$/, '');
    const response = await fetch(`${base}/${endpoint}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}; existing snapshot unchanged`);
    const body = await response.json();
    if (!body.success || body.data == null) throw new Error(`${endpoint}: incomplete API response`);
    return body.data;
}

function assertList(value, label) {
    if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
    return value;
}

if (refresh) {
    const stores = assertList(await request('stores.php'), 'stores');
    const categories = assertList(await request('categories.php'), 'categories');
    if (!stores.length || !categories.length) throw new Error('Refusing empty catalog');
    const pages = {};
    for (const store of stores) {
        const page = await request(`store.php?slug=${encodeURIComponent(store.slug)}`);
        if (page.store?.slug !== store.slug || !Array.isArray(page.coupons)) throw new Error(`Incomplete store: ${store.slug}`);
        if (snapshot.stores[store.slug]?.coupons.length && !page.coupons.length && !process.argv.includes('--allow-inventory-removals')) {
            throw new Error(`${store.slug}: all inventory disappeared; review before using --allow-inventory-removals`);
        }
        pages[store.slug] = page;
    }
    const deals = assertList(await request('deals.php'), 'deals');
    const hero = assertList(await request('hero-slides.php?active=true'), 'hero slides');
    const seasonal = assertList(await request('seasonal-offers.php?active=true'), 'seasonal offers');
    const categoryPages = {};
    for (const category of categories.filter(c => c.coupon_count > 0)) {
        categoryPages[category.slug] = { coupons: assertList(await request(`coupons.php?category=${encodeURIComponent(category.slug)}`), category.slug) };
    }
    Object.assign(snapshot, {
        stores: pages, storesPage: { initialStores: stores }, categoriesPage: { initialCategories: categories },
        dealsPage: { initialDeals: deals }, categories: categoryPages,
        homepage: { ...snapshot.homepage, initialHeroSlides: hero, initialSeasonalOffers: seasonal },
        capturedAt: new Date().toISOString(), generatedFrom: 'complete API catalog refresh',
    });
}

if (!snapshot.homepage || !snapshot.stores || !snapshot.storesPage || !snapshot.categoriesPage || !snapshot.dealsPage) throw new Error('Required snapshot sections missing');
assertList(snapshot.storesPage.initialStores, 'store directory');
assertList(snapshot.categoriesPage.initialCategories, 'category directory');
if (!snapshot.stores['cetaphil-coupon-code']?.store) throw new Error('Priority Cetaphil store missing');
for (const [slug, page] of Object.entries(snapshot.stores)) {
    if (!page.store || page.store.slug !== slug || !Array.isArray(page.coupons)) throw new Error(`Malformed store: ${slug}`);
    for (const coupon of page.coupons) {
        if (!Number.isInteger(coupon.id) || !coupon.title) throw new Error(`Malformed coupon in ${slug}`);
    }
}

// Preserve imported records outside the public export before removing unsupported claims.
const cetaphil = snapshot.stores['cetaphil-coupon-code'];
const removed = cetaphil.coupons.filter(c => c.id !== 350 || !c.source_url);
if (removed.length) {
    await fs.writeFile(path.join(reportDir, `cetaphil-quarantine-${Date.now()}.json`), JSON.stringify({ reason: 'Unsubstantiated savings/expiry or wrong market; recheck before publication', coupons: removed }, null, 2));
}
const newsletter = cetaphil.coupons.find(c => c.id === 350) || {};
cetaphil.coupons = [{
    ...newsletter, id: 350, store_id: cetaphil.store.id, store_name: 'Cetaphil', store_slug: 'cetaphil-coupon-code',
    store_logo: cetaphil.store.logo, store_website_url: 'https://www.cetaphil.in/',
    title: 'Cetaphil India Club: receive promotions by email',
    description: 'The Cetaphil India website invites shoppers to join its email club for promotions. No fixed saving or public coupon code is promised. Source checked 5 September 2026; not checkout-tested.',
    code: '', coupon_type: 'deal', discount_type: 'percentage', discount_value: 0, expiry_date: '',
    is_verified: false, is_featured: false, click_count: newsletter.click_count || 0,
    original_price: null, sale_price: null, image: '', affiliate_link: 'https://www.cetaphil.in/',
    source_url: 'https://www.cetaphil.in/', checked_at: '2026-09-05', verification_method: 'merchant_advertised',
}];
Object.assign(cetaphil.store, {
    name: 'Cetaphil', website_url: 'https://www.cetaphil.in/',
    meta_title: 'Cetaphil Offers & Deals in India | CouponPush',
    meta_description: 'Check Cetaphil India promotions, email club information and ways to compare retailer offers. No public coupon code is currently confirmed on this page.',
    description: 'Explore Cetaphil offers for Indian shoppers. No public coupon code or fixed discount is currently confirmed here. Compare the final retailer price for the same product and pack size.',
    about_content: '<p>This page focuses on India. The official Cetaphil India site provides product information and a Where to Buy option. Use the same product name, variant and pack size when comparing retailers.</p><p>Source reviewed on 5 September 2026: <a href="https://www.cetaphil.in/">Cetaphil India</a>. Imported price claims and overseas coupons are withheld until they can be checked.</p>',
    howto_content: '<p>If a retailer offers a code, enter it at that retailer’s checkout and confirm that the payable total changes. Check the seller, pack size, minimum spend, shipping and any payment restrictions before ordering.</p><p>Cetaphil India advertises email club promotions, but the reviewed source does not promise a fixed signup discount. A newsletter invitation is not a public coupon code.</p>',
    terms_content: '<p>No public coupon code is confirmed on this page. Eligibility, prices and availability depend on the retailer. Do not assume promotions combine or apply to every customer. Check the final order summary before payment.</p>',
});

// Rebuild every catalog surface from the same store records, including old coupon URLs.
const canonicalStores = Object.entries(snapshot.stores).filter(([slug]) => !['cetaphil', 'amazon-prime-day-sale-2026'].includes(slug));
for (const [slug, page] of canonicalStores) {
    page.store.coupon_count = page.coupons.length;
    page.coupons = page.coupons.map(c => ({ ...c, coupon_type: c.code?.trim() ? 'code' : 'deal' }));
    const category = snapshot.categoriesPage.initialCategories.find(c => c.id === page.store.category_id);
    if (category) Object.assign(page.store, { category_slug: category.slug, category_name: category.name });
}
delete snapshot.stores.cetaphil;
delete snapshot.stores['amazon-prime-day-sale-2026'];
snapshot.storesPage.initialStores = snapshot.storesPage.initialStores.filter(s => !['cetaphil', 'amazon-prime-day-sale-2026'].includes(s.slug)).map(s => snapshot.stores[s.slug]?.store || s);
const categoryExtras = Object.values(snapshot.categories).flatMap(c => c.coupons || []).filter(c => c.store_id !== cetaphil.store.id);
const coupons = [...new Map([...categoryExtras, ...canonicalStores.flatMap(([, page]) => page.coupons)].map(c => [c.id, c])).values()];
const couponMap = Object.fromEntries(coupons.map(c => [c.id, c]));
snapshot.coupons = Object.fromEntries([...new Set([...Object.keys(snapshot.coupons || {}), ...Object.keys(couponMap)])].map(id => [id, couponMap[id] || null]));
for (const category of snapshot.categoriesPage.initialCategories) {
    const stores = canonicalStores.map(([, p]) => p.store).filter(s => s.category_id === category.id);
    const ids = new Set(stores.map(s => s.id));
    const existingIds = new Set((snapshot.categories[category.slug]?.coupons || []).map(c => c.id));
    const categoryCoupons = coupons.filter(c => ids.has(c.store_id) || existingIds.has(c.id));
    category.coupon_count = categoryCoupons.length;
    snapshot.categories[category.slug] = { coupons: categoryCoupons, stores: stores.map(s => ({ name: s.name, slug: s.slug, count: s.coupon_count })), categoryName: category.name, categoryDescription: category.description || '', categoryIcon: category.icon || 'fa-tag' };
}
for (const [, page] of canonicalStores) page.related_stores = canonicalStores.map(([, p]) => p.store).filter(s => s.id !== page.store.id && s.category_id === page.store.category_id && s.coupon_count > 0);
snapshot.dealsPage.initialDeals = snapshot.dealsPage.initialDeals.filter(d => d.store_id !== cetaphil.store.id);
Object.assign(snapshot.homepage, {
    initialFeaturedCoupons: coupons.filter(c => c.is_featured).slice(0, 8),
    initialLatestCoupons: [...coupons].sort((a, b) => b.id - a.id).slice(0, 12),
    initialFeaturedStores: canonicalStores.map(([, p]) => p.store),
    initialFeaturedDeals: snapshot.dealsPage.initialDeals.filter(d => d.is_featured).slice(0, 4),
    initialAmazonCoupons: snapshot.stores.amazon?.coupons || [], initialFlipkartCoupons: snapshot.stores.flipkart?.coupons || [], initialAjioCoupons: snapshot.stores.ajio?.coupons || [],
});
for (const campaign of snapshot.homepage.initialSeasonalOffers || []) campaign.coupons = campaign.coupons.map(c => couponMap[c.id]).filter(Boolean);
snapshot.preparedAt = new Date().toISOString();
const temp = `${file}.tmp`;
await fs.writeFile(temp, JSON.stringify(snapshot) + '\n');
await fs.rename(temp, file);
console.log(`Validated ${canonicalStores.length} store profiles, ${coupons.length} offers. ${refresh ? 'Fresh API snapshot.' : 'Using explicitly selected saved snapshot; not a live verification.'}`);
} catch (error) {
    console.error(`Catalog preparation failed: ${error.message}`);
    process.exitCode = 1;
}
