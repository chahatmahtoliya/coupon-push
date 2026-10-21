import fs from 'node:fs/promises';

const sha = process.env.RELEASE_SHA;
const repository = process.env.GITHUB_REPOSITORY || 'chahatmahtoliya/coupon-push';
if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('A release SHA is required');
let succeeded = false;
for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/check-runs`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CouponPush-catalog-publication', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Could not read deployment status (${response.status})`);
    const check = (await response.json()).check_runs?.find(item => item.name === 'Workers Builds: coupon-push');
    if (check?.conclusion === 'success') { succeeded = true; break; }
    if (check?.status === 'completed') throw new Error(`Cloudflare deployment failed: ${check.conclusion}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
}
if (!succeeded) throw new Error('Cloudflare has not confirmed deployment within five minutes. Inspect the commit checks; the generated export is committed.');
const snapshot = JSON.parse(await fs.readFile('src/data/reviewed-offers.json', 'utf8'));
const expected = snapshot.offers.find(offer => offer.status === 'advertised');
const page = await fetch('https://couponpush.com/savings/', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
if (!page.ok) throw new Error(`Savings hub returned ${page.status}`);
const sourcePage = await fetch('https://couponpush.com/offers/skincare/', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
const html = await sourcePage.text();
if (!sourcePage.ok || (expected && !html.includes(expected.checkedAt))) throw new Error('Live comparison does not show this publication’s source-check timestamp');
console.log(`Cloudflare deployment and live source timestamp confirmed for ${sha}.`);
