# Days 1–7 implementation and operating instructions

Validation on 5 September 2026: saved-snapshot production build and TypeScript compilation passed; 21 indexable pages exactly match the sitemap; three isolated catalog regression tests passed (`python scripts/test-catalog.py`). Electronics and Bus Tickets now have consistent inventory in the category pages and sitemap. A real `catalog:refresh` attempt failed at `stores.php` with HTTP 500 and left the snapshot unchanged. Browser UI verification was unavailable in this session. No live deployment or production database changes were made.

Noindex review: empty merchant inventory remains excluded intentionally. Lenovo and Decathlon have directory entries but lack saved store profiles, so they are not generated as generic fallback pages. Fetch and review their actual records before publishing them. The full route-by-route classification is in `indexability.csv`.

The mistaken Foxtale addition has been removed from this implementation; the requested scope is the Days 1–7 foundations.

## Release data and validation

Run from `frontend-next`:

```
npm run build
```

This fetches a complete API catalog, validates it, applies the documented Cetaphil correction, writes the snapshot atomically, builds the static site and checks exported SEO. An unavailable or incomplete API stops the refresh before it can replace the snapshot or start the build. Publish only after the command exits successfully. The deploy destination must be the frontend host, not the API/admin host.

To review known saved data explicitly during an outage:

```
npm run build:snapshot
```

This is an explicit saved-data build, not evidence that offers were freshly checked. `capturedAt` records a successful API capture when available; `preparedAt` records local preparation only. The inherited snapshot has no trustworthy capture timestamp. Do not treat its preparation time as offer verification.

Build-time catalog reads use the release snapshot for HTML, metadata and sitemap. Browser requests fetch live admin data again, so active stores and coupons appear without a rebuild when the API is healthy. Stores absent from the export open through `/stores/view/?slug=...`, which remains noindex until a release generates their canonical SEO pages. Run the release job after approved imports and at least daily for expiry changes; configuring the external scheduler needs hosting access. Search remains an API operation; click tracking retains its existing backend. No new third-party analytics service has been installed.

`npm run seo:check` produces `output/seo/export-check.json` and `indexability.csv`. It rejects sitemap/noindex mismatches, missing canonicals/metadata, fallback store titles, duplicate sitemap entries, incorrect H1 counts and the removed Cetaphil claims. Keep the previous successful deployment when any step fails. Files in `output/seo` are internal reports and must not be uploaded as website content.

## Cetaphil correction

The imported 30 offers had unsupported price/expiry claims or were for overseas retailers. Originals are preserved in the quarantine JSON alongside this document. They are not deleted from the production database. The published snapshot now retains a single India email-club invitation with no claimed discount, code or expiry and no checkout-verification badge.

Source: https://www.cetaphil.in/ (reviewed 5 September 2026). The guide now explains India retailer comparisons and code eligibility, with an offers/deals title. `$21`/`$22`, unsubstantiated headline savings and overseas listings are removed from snapshot surfaces. The preparation script reapplies the correction after API refreshes to prevent old imports from restoring it. Replace this narrow editorial override only after reviewing new source evidence; do not silently label new imports as verified.

## Crawl and hosting

Run `python scripts/check-live-seo.py` from `frontend-next`. See the saved live HTTP report. Ordinary audit requests cannot prove Googlebot access. Use Google Search Console live URL inspection and server/CDN logs for verified Googlebot.

The frontend `public/.htaccess`, copied into the export, preserves existing redirects/security/caching and adds www consolidation plus `/store/` -> `/stores/`. It uses the existing static 404 document, with no homepage SPA fallback. Hosting must serve `out` and honor this file; do not deploy the repository-root legacy SPA routing file instead. For a non-Apache host, configure equivalent permanent redirects and real 404 handling at that host. CDN SSL mode must match the existing HTTPS origin configuration.

`public/robots.txt` already contains the sitemap declaration. The latest live check also returned it successfully; retain this line:

```
Sitemap: https://couponpush.com/sitemap.xml
```

The latest live check found HTTP returning 200 without a redirect, www failing DNS resolution, and `/store/cetaphil/` returning 404. The nonexistent-store test correctly returned 404. Configure www DNS and canonical redirects at the actual serving host/CDN, then rerun checks. Earlier 403 responses were not reproduced by the latest audit client; Googlebot access remains unverified.

The obsolete static `public/sitemap.xml` is removed; `src/app/sitemap.ts` is the only sitemap generator. Submit the final sitemap after deployment and validate the Cetaphil canonical, HTTP/www variants, missing-route 404 and sitemap response in production.

## Search Console baseline: account access required

No Search Console connector/session or export is available. Baseline values remain blank, not zero. In the verified domain property:

1. Export Performance for the last complete 28 and 90 days, search type Web, country India. Save Queries, Pages and Devices, using equivalent comparison periods.
2. Export Page Indexing reasons and sitemap status. Inspect homepage, Cetaphil, stores, beauty category and one excluded store. Record indexed canonical and live-test result separately.
3. Check Manual Actions and Security Issues. Record actual results, never assume they are clear.
4. Complete `search-console-baseline.csv`; retain raw dated exports. Separate CouponPush-name queries from merchant coupon queries.

## Tracking specification

Existing backend coupon/deal click counts are not an organic conversion baseline and can count opening a modal. Do not interpret them as purchases or successful redemptions.

For a later analytics connection, specify `merchant_click` (successful navigation intent), `coupon_copy` (clipboard success only), and `coupon_report` (working/failed, after a real reporting flow exists). Allowed dimensions: canonical page path, merchant slug, numeric offer ID, offer type and placement. Never include email, phone or full query strings. Deduplicate events; track organic landing sessions in the chosen analytics platform. Affiliate orders and approved commission require the affiliate provider's report/subID join.

Production deployment, CDN changes, GSC submission and a real traffic baseline remain dependent on authenticated hosting/Search Console access. Local export checks do not certify these external steps.

## Live catalog correction

The initial snapshot implementation also intercepted browser requests; this has been corrected. Homepage requests now settle independently so one failing endpoint cannot suppress successful store/coupon updates. The live store preview handles loading, failure, retry and slug changes. `node scripts/test-live-catalog.cjs` verifies server snapshot reads and browser live reads. The correction build passed with 21 indexable pages matching the sitemap. On the latest checks, production stores.php, store.php and coupons.php returned empty HTTP 500 responses to a browser-style audit client; PHP logs are needed to diagnose the backend. No production API files or database records have been changed.
