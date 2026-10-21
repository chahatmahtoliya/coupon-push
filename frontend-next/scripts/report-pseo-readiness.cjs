const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./lib/load-typescript.cjs');
const { getSavingsPages, SAVINGS_MIN_OFFERS, SAVINGS_MIN_STORES } = load('src/lib/savings-pages.ts');
const pages = getSavingsPages().map(page => ({ path: page.path, eligible: page.eligible, offers: page.offers.length, offerIds: page.eligible ? page.offers.map(offer => offer.id) : [], stores: page.stores.length, generated: page.published || page.eligible, reason: page.eligible ? 'Fresh merchant source matches and distinct editorial comparison' : `Withheld: need ${SAVINGS_MIN_OFFERS} distinct source-matched offers, ${SAVINGS_MIN_STORES} stores and complete editorial content` }));
const report = { generatedAt: new Date().toISOString(), pages, googleIndexStatus: 'Not checked: authenticated Search Console access is required. Export eligibility is not Google indexing.', measurement: { market: 'India', searchType: 'Web', primary: ['Non-brand Google impressions', 'Non-brand Google clicks'], secondary: ['Indexed comparison URLs', 'Store page clicks'], cadence: 'Compare complete 28-day periods with the same filters; use weekly checks for indexing and errors.' } };
const directory = path.resolve(__dirname, '../../output/seo'); fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'pseo-readiness.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
