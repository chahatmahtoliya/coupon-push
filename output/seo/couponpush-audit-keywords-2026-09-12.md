# CouponPush SEO audit and keyword plan

Audited 12 September 2026. Market: India, English. Recommendation: improve existing beauty and selected fashion merchant pages first, with Deconstruct and Snitch as the first content pilots. Consolidate duplicate stores and fix host redirects before expanding the page count.

## Evidence and limits

Inspected 18 public URLs via HTTP, rendered homepage and Foxtale markup in the browser, Google India results for site:couponpush.com, Foxtale, Deconstruct and Snitch, and their autocomplete/related searches. Google displayed Delhi as the location. Queried Semrush's India database for keyword volume/difficulty and current domain organic keywords. Raw HTTP findings are in `live-audit-2026-09-12.json`; initial Semrush responses are in `semrush-evidence-2026-09-12.json`.

This is a sampled public audit, not a full backlink or authenticated Search Console audit. Search volume and difficulty are third-party estimates; autocomplete establishes query ideas, not volume, an active promotion, or guaranteed ranking potential. Semrush returned no row for several Foxtale/Hyphen/long-tail queries: that is missing data, not zero demand. No checkout coupon testing was performed.

PageSpeed API returned HTTP 429 quota exceeded, so no speed score or Core Web Vitals pass/fail is claimed. Attempted a mobile viewport override, but the browser retained a 1270px document width; mobile layout remains unverified. Desktop Foxtale layout was inspected visually.

## What is already working

- Google displayed the homepage, stores, Amazon, Flipkart and several informational pages in the site: query. This confirms some visibility; a site: query is not an index census.
- All 18 sampled requests completed with 200 at their final URL. `/privacy/` redirects to `/privacy-policy/`.
- Main XML sitemap parses successfully and contains 37 URLs. Robots.txt references both the main and blog sitemaps and allows ordinary search crawling. The Google-Extended block is not a Googlebot block.
- Sampled current beauty/fashion merchant pages are indexable with self-canonical URLs and one H1. Prior local reports' noindex findings should not be carried forward without rechecking.
- Rendered Foxtale page contains CollectionPage and BreadcrumbList JSON-LD. Schema is not absent sitewide. Homepage had no JSON-LD in the rendered inspection; that is a lower-priority enhancement, not an indexing blocker.
- A deliberately nonexistent path returned a real 404. The no-trailing-slash Foxtale URL redirected to its slash version with 307.

## Prioritized findings

| Priority / impact | Evidence | Recommended fix and acceptance check |
|---|---|---|
| P1 / High: duplicate Derma Co targets | `/store/the-derma-co/` and `/store/derma-co-coupon-code/` both return 200, index/follow, self-canonical, and appear in the main sitemap. They target the same merchant intent. | Select the surviving URL using GSC/backlink evidence; provisionally prefer `/store/the-derma-co/`. Merge useful valid offers, permanently redirect the duplicate, remove it from sitemap and internal links. Confirm only the survivor is indexable. This is competing targeting, not proven ranking cannibalization without GSC. |
| P1 / High: HTTP and www handling | `http://couponpush.com/` returned 200 with no redirect. `www.couponpush.com` failed DNS locally; Google's public DNS resolver also returned Status 3/NXDOMAIN for its A query. | Configure www DNS/TLS and permanent redirects from HTTP and www to `https://couponpush.com/`, preserving paths/queries. Verify each variant ends at one HTTPS canonical URL without loops. |
| P1 / High: merchant link destinations | Homepage Amazon, Flipkart and AJIO section links lead to `/coupons/?store=...`. Amazon's filtered page canonicalizes to generic `/coupons/`. | Point merchant section headings/CTAs to the corresponding `/store/.../` pages. Filters can remain useful controls. Add descriptive crawlable links from prominent offer cards to merchant pages. Do not claim existing store discovery is absent: Top Stores already links to them. |
| P1 / High: weak verification evidence | Foxtale labels seven offers verified, but the inspected page exposes no per-offer last-tested date, test method or source link. All eight share 5 October expiry. | Audit source records; show source, last checked date, account/channel conditions and test status. A shared expiry is a recheck trigger, not proof of fabrication. Separate merchant-advertised from checkout-tested offers and unknown expiry from confirmed dates. |
| P1 / High: missing search-specific answers | Foxtale FAQs repeat counts, verification totals, first listed offer and expiry. Google suggests first order, B1G1, sunscreen and bundle terms. | Add concise merchant-specific eligibility and bundle comparison sections using current official terms. Answer unavailable-offer queries honestly. Do not create a separate page for every synonym. |
| P2 / Medium: duplicate Dot & Key navigation | Homepage links both `/store/dot-key/` and `/store/dot-key-coupon-codes/`. The latter is noindex and has a literal encoded brand name. | Merge any useful data and permanently redirect the redundant store to the maintained merchant page. Remove the obsolete homepage entry. This is not the same severity as two indexable Derma pages. |
| P2 / Medium: page promise and offer type mismatch | Minimalist title promises coupon codes while its description reports zero codes and seven deals; H1 already says Offers & Deals. | Use a deals-first title while there are no active usable codes. Explain whether a code is required. Preserve the established merchant URL. |
| P2 / Medium: trust and presentation defects | Homepage displays an internal backend empty-state message. Social links point to platform homepages. Disclaimer resolves to privacy policy. Some titles/brand strings show literal HTML entities. | Replace the empty hero with useful maintained content, connect real social profiles or remove links, provide a relevant disclaimer/disclosure and decode text once at ingestion/rendering. Avoid claiming request-decoding artefacts are browser bugs; literal entities were separately observed. |
| P2 / Medium: limited publisher identity | About page offers a short mission/process description but no named editor or detailed verification policy in inspected content. | Publish accurate editorial ownership, how coupons are checked, correction/report process, and affiliate disclosure. Do not invent credentials or partnerships. |
| P3 / Low: temporary slash redirect | Foxtale slash normalization returned 307. | If normalization is permanent, use 301/308 consistently; retain canonical slash URLs in internal links. |

Google recommends consistent canonical signals and links to preferred URLs: [canonical documentation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). Offer navigation should use crawlable anchors: [link documentation](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

Concrete content correction lead: CouponPush's Foxtale copy refers to Fox Charms and cashbacks. The [official rewards page](https://foxtale.in/pages/rewards) currently describes FoxCoins, redeemed only in the app, with minimum cart ₹249, maximum redemption ₹50 per order and six-month expiry. Reconcile the exact reward promotion and conditions before marking it verified; wallet credit should not be presented as unrestricted cash savings.

## Keywords to prioritize

Semrush India estimates retrieved 12 September 2026. Volume = estimated monthly searches; KD = keyword difficulty out of 100, lower generally easier. These are individual keyword estimates and should not be summed as unique audience. The tool did not expose the underlying snapshot date.

| Priority | Primary keyword | Volume | KD | Target URL / action |
|---|---|---:|---:|---|
| First pilot | deconstruct coupon code | 1,900 | 16 | `/store/deconstruct/`; add new-user and current bundle terms |
| First pilot | snitch coupon code | 2,900 | 17 | `/store/snitch/`; improve first-order and eligibility comparisons |
| Next, after inventory check | kapiva coupon code | 1,300 | 12 | `/store/kapiva-coupon-code/`; confirm current offer supply before expansion |
| Next | newme coupon code | 1,600 | 17 | `/store/newme/`; maintain fashion cohort |
| Next | pilgrim coupon code | 720 | 16 | `/store/pilgrim/`; strengthen beauty cluster |
| After duplicate fix | derma co coupon code | 1,300 | 19 | One consolidated Derma Co page |
| Next | dot and key coupon code | 2,900 | 22 | `/store/dot-key/` |
| Next | plum coupon code | 2,400 | 23 | `/store/plum/` |
| Repair relevance first | cetaphil coupon code | 720 | 17 | `/store/cetaphil-coupon-code/`; India-specific live offers |
| Supporting same page | snitch discount code | 1,000 | 15 | Same Snitch URL, not a separate landing page |
| Supporting same page | cetaphil discount code | 320 | 19 | Same Cetaphil URL |
| Conditional | minimalist coupon code | 1,300 | 20 | Existing merchant page; explain actual deals honestly while codes are absent |
| Secondary niche | blinkit coupon code | 1,900 | 24 | `/store/blinkit/`; separate customer/payment eligibility |
| Later competition | redbus coupon code | 22,200 | 37 | Maintain current page; expand when evidence supports it |
| Later competition | flipkart coupon code | 14,800 | 30 | Maintain current page; avoid making this the sole growth bet |
| Later competition | amazon coupon code | 14,800 | 45 | Maintain accurate deals; harder initial target |
| Google-supported pilot | foxtale coupon code | Not returned | Not returned | `/store/foxtale/`; first-order/bundle sections supported by Google suggestions |

Semrush organic report returned only two tracked queries for the domain: `cetaphil coupon code` at position 70 and `cetaphil discount code` at 75, both attributed to the homepage. This suggests investigating the landing page assignment in GSC. It does not prove these are the only real queries or that the site has zero traffic. The organic report uses 880 volume for the first term while the keyword endpoint returns 720: retain the endpoint-specific distinction rather than presenting them as the same measurement.

## Google autocomplete, related searches and questions

Observed in browser. All should initially become sections or FAQs on their parent store page when relevant. A search suggestion is not evidence that its advertised discount exists.

| Cluster | Observed query ideas | Recommended content |
|---|---|---|
| Foxtale | foxtale coupon code first order; foxtale b1g1 coupon code; foxtale sunscreen coupon code; Foxtale Buy 2 Get 2 coupon code; Foxtale Buy 2 get 4 Free Code Today; Foxtale buy 1 get 1 coupon code gpay | First-order eligibility; distinguish B1G1/B2G2/free-gift bundles; sunscreen exclusions; targeted GPay vouchers vs public codes |
| Foxtale questions | Is there a Foxtale 400 off coupon code available? Is there a Foxtale Buy 2 Get 5 Free code? What are the current coupon codes for Foxtale? | Answer only against current source terms; explicitly say when an offer is not confirmed |
| Deconstruct | deconstruct coupon code for new user; deconstruct coupon code first order; deconstruct promo code; Deconstruct Buy 1 Get 1 Free coupon code; Deconstruct 100 off coupon code; Deconstruct buy 2 at 599 coupon code; Deconstruct buy 1 get 1 sale date | New-user eligibility; fixed-price bundle economics; code vs automatic deal; confirmed sale dates only |
| Snitch | snitch coupon code first order; snitch coupon code new user; snitch coupon code influencer; snitch coupon code 25 off; snitch coupon code 30 off; snitch coupon code 50 off first order; Snitch Gift Card | Compare first-order, influencer, student and gift-card offers with exclusions; do not promise 50% off just because users search for it |
| Snitch questions | Is there a 20% discount code for Snitch? Is there a 50% off coupon code for Snitch? | Explain current availability and distinguish sale pricing from additional coupon savings |

All three clusters also suggested Reddit variants. Treat those as evidence that shoppers want real validation; do not build a fake Reddit page or target the modifier through keyword stuffing. Likewise, generic PAA entries such as GIMME10 are not sufficiently merchant-specific to justify content.

Reproducible search links: [Foxtale](https://www.google.com/search?q=foxtale+coupon+code&gl=in&hl=en), [Deconstruct](https://www.google.com/search?q=deconstruct+coupon+code&gl=in&hl=en), [Snitch](https://www.google.com/search?q=snitch+coupon+code&gl=in&hl=en), [site visibility](https://www.google.com/search?q=site%3Acouponpush.com&gl=in&hl=en). Results and suggestions vary over time/location.

## What the competing results imply

Foxtale results included GrabOn, CouponDunia, PaisaWapas, Zoutons, Desidime, the official rewards page and voucher merchants. Deconstruct included GrabOn, its official offer/reward pages, Couponlap, Wethrift, Startupworld and video content; it also displayed an AI Overview. Snitch included GrabOn, UNiDAYS, Coupons Clouds, Woohoo, Couponsly, DealMela, Desidime, Wethrift, CouponzGuru and Zoutons. CouponPush did not appear in the first visible result sets for these three queries.

Inference: there is merchant-coupon intent, but established publishers and official stores compete for it. Deconstruct's mixed results make it a useful test candidate, not a guaranteed easy win. CouponPush needs useful eligibility, genuine verification and final-basket comparisons. A longer generic brand introduction will not supply that distinction. Competitor snippets are discovery leads, not coupon verification.

## First two page briefs

**Deconstruct:** title `Deconstruct Coupon Codes & Offers in India | CouponPush`; H1 `Deconstruct Coupon Codes & Offers`. Put valid offers first, then new-user conditions, current bundle comparison, how to apply a code, reasons it may fail, Dcoin conditions when sourced, and related beauty stores. Compare the same eligible items including delivery. Label hypothetical calculations as examples.

**Snitch:** title `Snitch Coupon Codes & First-Order Offers | CouponPush` only after first-order content exists. Use sections for new/existing customers, current public codes, restricted student/influencer offers, prepaid or delivery charges, and gift-card restrictions. Keep discount-code synonyms on this URL. Do not imply stacking unless tested or stated in merchant terms.

For every priority store: include code or automatic-offer type, minimum spend, cap, eligible customer, app/web/card restrictions, expiry/source date and last checked status. Add a clear correction button and relevant internal links. Do not make new monthly URLs.

## 30-day action order

1. Days 1–3: consolidate duplicate stores; fix HTTP/www; update homepage merchant link destinations; inspect priority URLs in GSC and submit existing sitemaps if needed.
2. Days 4–10: verify inventory and upgrade Deconstruct/Snitch, followed by the Foxtale Google-suggestion pilot. Replace unsupported badges and fabricated/default expiry dates if source review identifies them.
3. Days 11–20: upgrade Kapiva, NEWME and Pilgrim when current usable offers exist. Expand to Derma Co, Dot & Key and Plum. Link these from relevant categories and existing guides.
4. Days 21–30: review GSC India query/page data against the baseline; investigate wrong landing pages and indexing exclusions. Improve titles only where impressions support the decision. Maintain larger merchant pages without spreading new content across every category.

Track organic impressions, clicks, CTR, query/page assignment, indexed canonical status, outbound merchant clicks and successful coupon reports. Compare equivalent 28-day periods and allow for crawl lag and promotions; 30 days is an execution window, not a ranking guarantee. Request a GSC Performance export by query/page and Page Indexing details for the next evidence-based iteration. No website code was changed in this audit.
