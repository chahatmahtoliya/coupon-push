# Brand onboarding implementation — 12 October 2026

Implemented and checked locally. No production database changes, production emails, commits, push or deployment were performed. The release export keeps `NEXT_PUBLIC_PARTNERS_ENABLED` off by default until backend setup is complete.

## Delivered

- Branded `/list-a-store/` entry page and responsive `/partners/` workspace using the existing CouponPush design.
- Separate brand accounts, verification and password reset through hosting PHP mail, hashed expiring single-use tokens, CSRF protection, request limits and private account sessions.
- Saved incomplete store/offer drafts, PNG/JPEG/WebP logo uploads, coupons/no-code deals, submission validation, feedback, editing/renewal/withdrawal and review history.
- Admin-only review queue with an authorization check, transactional selective promotion, stale-review protection and feedback for offers not approved.
- Separate approval and publication states. Manual catalog refresh/build/deploy followed by admin verification of the canonical page and exact revision.
- Store/offer views and cumulative coupon clicks, with clear limits: these do not establish purchases, revenue or redemptions.
- Additive database migration, bounded mail retry cron, launch gating, privacy/terms disclosures and [setup instructions](../api/PARTNERS-DEPLOY.md).
- Catalog pagination so stores beyond the first 500 entries can be included in refreshed exports and live directory requests.

## Validation results

| Check | Result |
| --- | --- |
| Isolated PHP/API integration suite | 12 passed |
| Catalog safety/pagination regression suite | 5 passed, including a 501-store refresh and repeated-page rejection |
| Functional browser flow | 11 checks passed; signup, verification fragment links, draft resume, HTTPS errors, SVG rejection, PNG upload, incomplete offer saving, submit validation and recovery, no-code deal, submission, locked-state navigation |
| Desktop/mobile browser checks | 10 full-page captures at 1440px / 390px; no page errors or horizontal overflow |
| Finish review | Lock explanations and recovery fixed on Store and Offers; scored fix resolved and accepted |
| PHP syntax | Partner service/API/metrics/CLI/admin review and modified public store endpoints passed |
| Production snapshot build | Passed, including TypeScript and all static routes |
| Canonical-origin Worker tests | 7 passed |
| Export SEO | 58 indexable pages, 58 sitemap URLs, zero errors with the launch flag off |
| Export images | 46 unique images, 28 remote, zero errors in the scoped GitHub release |

Reports: [browser captures](partner-browser-check.json), [editable-form flow](partner-forms-check.json), [SEO](seo/export-check.json), [images](seo/export-image-check.json). Captures use an isolated local test account and staged offers; they are not production business results.

The GitHub release was prepared and rebuilt in an isolated checkout to exclude unrelated local festival and bulk-import work. Its 12 backend tests, 5 catalog tests, TypeScript, 7 canonical-origin tests, SEO and image checks passed again. The full local workspace previously checked 48 images; the scoped export checks 46.

The application integration suite uses an isolated SQLite fixture with the new schema adapted for SQLite. It does not verify MySQL DDL, MySQL locking under concurrency or real hosting inbox delivery. Those hosting checks remain part of setup. Browser tests use the private local file transport; no external messages were sent.

## Local preview

- http://127.0.0.1:3101/list-a-store/
- http://127.0.0.1:3101/partners/
- Demo account: `preview@example.com`, password `preview brand password`. This is a disposable local fixture and is never a production credential.

The preview connects partner requests to a local PHP server and SQLite database. The ordinary public catalog remains on its existing read path. Local services must remain running for account interactions.

## Production work remaining

Install the PHP files, run the additive migration against the hosting MySQL database, configure the allowed frontend origin and permitted PHP mail sender, set the mail cron, check real mailbox delivery, then enable the public build flag and deploy the frontend. Use a fresh catalog build after approvals or withdrawals. Publishing automatically, sales/redemption attribution, payments and multiple stores per account are outside this release.

See [api/PARTNERS-DEPLOY.md](../api/PARTNERS-DEPLOY.md) for exact files, settings and commands. The original planning document is retained with its implementation status updated. Existing unrelated workspace changes were preserved.
