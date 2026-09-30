# Stylesheet ownership

Update the existing stylesheet for the feature being changed. Avoid adding another fix or override stylesheet.

| File | Owns |
| --- | --- |
| `style.css` | Shared tokens, fonts, utilities, navigation, footer, and common components |
| `homepage.css` | Homepage hero, top-store navigation, featured deal images, and shopping guides |
| `store-hero.css` | Store pages, including hero, typography, filters, coupon layout, related stores |
| `category-refresh.css` | Category directory and category results |
| `seo.css` | Offer evidence, site directory, and related-resource links |

Route-specific CSS Modules stay next to the stores and coupons pages. Component CSS Modules stay next to their components.

Global styles are imported in `src/app/layout.tsx`: shared styles first, followed by page and resource styles. Keep responsive rules with their owning stylesheet. Preserve selector specificity, shorthand order, and media-query behavior when consolidating rules.

`store-page-cleanup.css` was merged into `store-hero.css`. Homepage hero rules were moved out of the shared stylesheet into `homepage.css`. The shared `.visually-hidden` utility belongs in `style.css`.
