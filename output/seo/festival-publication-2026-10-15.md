# Amazon festival indexing fix

The inspected `/stores/view/?slug=amazon-great-indian-festival-2026` URL was a shared noindex preview. The permanent store URL returned 404 and was absent from the store sitemap, even though the public API already had the store and eight active offers.

This release adds the dedicated festival frontend and its existing assets, incorporates the eight offers from the live store API into the static build snapshot, and includes the canonical page in store navigation and the XML sitemap. Other stores and homepage promotion data were not refreshed from the API.

The Cloudflare Worker now redirects this festival's preview URL permanently to `https://couponpush.com/store/amazon-great-indian-festival-2026/`. Other store previews retain their existing noindex behavior. The page has one self-referencing canonical and indexable initial HTML containing its offers. The missing festival store-logo upload uses the existing Amazon brand image.

Validation passed:

- TypeScript and production static build, including 243 generated routes.
- Nine canonical-origin/preview redirect tests.
- 59 indexable pages matching the XML sitemaps, with no SEO errors.
- 56 unique initial-HTML images, including 28 remote images, with no broken-image errors.
- Desktop 1440px and mobile 390px browser checks: one H1, correct canonical, indexable metadata, visible offer cards, no page exceptions or horizontal overflow.

The PDF-derived CSV offers are not imported by this change. The deployed festival inventory comes from the existing public API. No PHP database changes or brand-account launch changes are included.

After deployment, inspect the permanent URL in Search Console and request indexing. A successful deployment makes the page eligible; it does not establish that Google has already indexed it.
