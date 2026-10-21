# Sourced offer comparisons

The first cohort adds `/savings/`, `/offers/skincare/` and `/offers/free-gifts/`. These complement the existing merchant pages and editorial guides. One URL owns each comparison intent; there are no city, month, synonym or arbitrary brand-by-modifier variants.

## Publication rules

An indexable comparison needs at least five distinct merchant advertisements across three stores, source checks no older than seven days, a substantial intent-specific introduction, two guide sections and two relevant questions. These are CouponPush quality thresholds, not Google requirements. A code repeated under different headlines counts once per store. Unknown stores, mismatched source domains, future check dates, stale checks and absent advertisements cannot qualify.

`src/data/curated-offer-definitions.json` contains the editorially reviewed source URLs, exact matching patterns, offer conditions and intent tags. `npm run offers:refresh` reads the public merchant HTML, excludes script/style/template content and matches the advertised wording. It writes `src/data/reviewed-offers.json` only after all requests finish successfully. A failed request preserves the previous file and fails the publication. A complete page that no longer contains a promotion marks that promotion unavailable.

Source checking is not checkout testing. Do not label these records verified, guaranteed, activated, exclusive or working. Do not infer expiry, stacking, discount caps, eligibility or a public code absent from the source. Gift retail values are not cash discounts. This release adds no claims about skincare suitability or efficacy.

Draft first-order, bank/card, shipping and combo collections are withheld. They require their own sourced inventory and original editorial content before launch. Established comparison routes remain available with explanatory content and noindex when their eligible inventory falls below the threshold; they leave discovery links and sitemaps until ready again.

## Freshness and deployment

`npm run build:refresh` refreshes the API catalog while preserving existing promotion creatives, rechecks merchant advertisements, requires a catalog capture within 48 hours, then runs the static build and export checks. `npm run build:snapshot` remains an explicit saved-snapshot build.

`.github/workflows/refresh-catalog.yml` runs daily at 01:17 UTC (06:47 India time), can be dispatched manually and runs on its initial workflow commit. It builds with pinned official GitHub actions, validates the comparison gates and internal crawl, commits only generated frontend data/public/export paths, pushes without force, and waits for the existing Cloudflare Git deployment. A concurrent source push causes a normal push rejection rather than overwriting newer work. Validation failures leave the last deployed release in place. Check the Actions run and its artifacts for failures; GitHub schedules can be delayed.

The workflow uses the repository's short-lived GITHUB_TOKEN and no new service secret. Its generated commit must receive a successful `Workers Builds: coupon-push` check. The final step checks the live comparison's source-check timestamp, rather than treating a Git push as proof of deployment.

Routine source checks update the visible checked date. An unchanged offer retains its material `updatedAt` so checking alone does not fabricate a new editorial modification date.

## Validation and next cohorts

Run `npm run seo:pseo-test`, `npm run seo:readiness`, `node scripts/check-seo-audit.cjs` and `python -B scripts/audit-internal-links.py` after the build. The readiness report records published and withheld families. Validate that schema ItemList entries equal visible offers, each indexable page has one H1 and a self-canonical, draft paths are absent, all internal links are canonical, and source links are genuine merchant URLs.

Search Console authentication is still required to inspect Google's actual indexing or measure traffic. The generated sitemap is a discovery list, not proof of indexing. Use India/Web and complete 28-day windows consistently; compare non-brand impressions and clicks by landing page, and inspect excluded pilot URLs. Do not infer keyword search volume from the earlier screenshot or forecast visits from average position alone.

Sources: [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start), [GitHub scheduling](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
