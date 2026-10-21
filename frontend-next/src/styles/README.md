# Stylesheet ownership

Update the existing stylesheet for the feature being changed. Avoid adding another fix or override stylesheet.

| File | Owns |
| --- | --- |
| `style.css` | Shared tokens, fonts, utilities, navigation, footer, and common components |
| `homepage.css` | Homepage hero, top-store navigation, featured deal images, and shopping guides |
| `store-hero.css` | Store pages, including hero, typography, filters, coupon layout, related stores |
| `category-refresh.css` | Category directory and category results |
| `seo.css` | Offer evidence, site directory, and related-resource links |

Route-specific CSS Modules stay next to the stores, coupons, and search pages. `src/app/search/search.module.css` owns the search form, result filters, cards, and search states. Component CSS Modules stay next to their components.

The partner landing page, account forms, dashboard and editors share `src/app/partners/partners.module.css`. Partner entry points in the public header remain in `style.css`.

Global styles are imported in `src/app/layout.tsx`: shared styles first, followed by page and resource styles. Keep responsive rules with their owning stylesheet. Preserve selector specificity, shorthand order, and media-query behavior when consolidating rules.

`store-page-cleanup.css` was merged into `store-hero.css`. Homepage hero rules were moved out of the shared stylesheet into `homepage.css`. The shared `.visually-hidden` utility belongs in `style.css`.
