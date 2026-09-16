# CouponPush SEO implementation — 13 September 2026

Implemented in source; not deployed. Concurrent blog, navigation and sitemap work belongs to another task. No isolated build output should be deployed: its copy may lag that work.

## Changes

- Six merchant-specific keyword guides and metadata: Deconstruct, Snitch, Foxtale, Kapiva, NEWME and Pilgrim. Empty code inventory uses offers/deals wording.
- Shared legacy store aliases, generated 301 redirects, canonical API lookups and duplicate inventory filtering. Catalog preparation archives excluded legacy pages for editorial review.
- Offer evidence distinguishes checkout-tested offers from merchant advertisements and untested listings. A legacy verified flag alone is insufficient. Source links and check dates appear when recorded; correction links open an email draft.
- Removed unsupported blanket verification, marketplace badges and click-based social proof. Added offer-label explanations and affiliate disclosure.
- Corrected merchant links to store pages, decoded imported plain-text entities, and added homepage WebSite/Organization structured data.
- Apache HTTPS/host redirect rules updated. These do not replace Cloudflare DNS or edge configuration.

## Validation

- `node scripts/check-seo-audit.cjs` passed in frontend-next.
- Isolated production `next build` passed, including TypeScript and export of 232 routes.
- `python scripts/check-seo-storefront.py D:\Cpush\tmp\seo-validation-20260913\out` passed: six guides, canonicals, metadata, evidence/correction links, aliases and merchant links.
- Desktop and 390px mobile browser review passed; no horizontal overflow on the reviewed merchant page.
- Full SEO checker still reports blog URL/canonical inconsistencies in the isolated copy. The other task owns that migration; repeat the integrated build and full checker after its changes settle.

## Release follow-up

1. Finish the other task's migration, then run the integrated snapshot build and SEO checks.
2. Review legacy offer archives and current offer source/date records. This implementation does not claim to have tested merchant checkout or verified the entire inventory.
3. Restore Cloudflare authentication and fix HTTP/www behavior at the actual serving layer. Existing authentication was expired; no DNS or production deployment was performed.
4. Deploy the combined reviewed source and verify live redirects, canonicals and sitemap coverage. Track keyword outcomes in Search Console; rankings are not established by these checks.
