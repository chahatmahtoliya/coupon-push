# Power bank brand rotation and social links

Changes:
- Default relevance on Power Bank Deals rotates one offer per brand per round. Within each brand, the existing relevance order is preserved. Rotation runs after filtering and before pagination, for initial HTML and refreshed API data. Explicit newest/expiry/discount sorts retain their requested order.
- A visible homepage link directly below the hero leads to /Power-Bank-Deals/.
- Shared footer links point to X/Twitter https://x.com/couponpush and Telegram https://t.me/deal_push. The standalone blog receives the same footer and its shared styles.

Validation completed: four inventory/rotation tests; eleven canonical/redirect tests; production webpack build and TypeScript. Browser checks at 1440px and 390px confirmed 11 unique brands in the opening round, no page-one/page-two overlap, working brand filter, newest and discount sorts, no horizontal overflow or browser errors, and both social links. Blog footer markup and shared styling passed. The initial HTML contains the rotated offer list and direct homepage link.

The work improves on-site discovery and browsing. Semrush Authority Score is external; the changes do not guarantee a score or ranking increase.

Final export checks: SEO passed for 100 indexable pages and matching sitemaps; all 70 initial-HTML images passed, including 27 remote images. Shared blog shell and reciprocal-link checks passed on 45 pages.
