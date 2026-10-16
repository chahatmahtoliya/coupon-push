---
name: CouponPush Amazon festival store trial
description: Route-scoped record of the implemented Amazon Great Indian Festival 2026 storefront.
colors:
  store-ink: "#14171c"
  store-muted: "#596273"
  store-line: "#e9edf2"
  store-orange: "#ff9200"
  store-orange-dark: "#a54600"
  action-hover: "#7c3300"
  action-ink: "#191b20"
  white: "#fff"
  metadata: "#667080"
  warm-state: "#fff3e3"
typography:
  display:
    fontFamily: '"CouponPush Manrope", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "clamp(30px, 2.85vw, 40px)"
    fontWeight: 800
    lineHeight: 1.13
    letterSpacing: "-.025em"
  headline:
    fontFamily: '"CouponPush Manrope", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "-.025em"
  offer-title:
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-.02em"
  product-title:
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontSize: "15px"
    lineHeight: 1.65
  label:
    fontSize: "13px"
  offer-action:
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.3
  price:
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.25
rounded:
  badge: "5px"
  action: "6px"
  field: "8px"
  card: "12px"
  offer: "14px"
  merchant: "24px"
  circle: "50%"
spacing:
  compact: "8px"
  standard: "12px"
  control: "16px"
  generous: "24px"
  section: "42px"
components:
  button-offer:
    backgroundColor: "transparent"
    textColor: "{colors.store-orange-dark}"
    typography: "{typography.offer-action}"
    rounded: "{rounded.action}"
    padding: "8px 16px"
  button-offer-hover:
    backgroundColor: "transparent"
    textColor: "{colors.action-hover}"
  button-copy:
    backgroundColor: "{colors.store-orange}"
    textColor: "{colors.action-ink}"
    padding: "8px 14px"
  button-merchant:
    backgroundColor: "#111318"
    textColor: "{colors.white}"
    rounded: "{rounded.merchant}"
    padding: "0 24px"
  search:
    textColor: "{colors.store-ink}"
    rounded: "{rounded.field}"
    padding: "0 12px"
  deal-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "12px"
  offer-row:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.offer}"
    padding: "18px 22px"
  saved-filter:
    backgroundColor: "{colors.white}"
    textColor: "#454c58"
    rounded: "{rounded.field}"
    padding: "0 14px"
---

# Design System: CouponPush Amazon festival store trial

## Overview

**Creative North Star: "The merchant offer shelf"**

This route records a white, compact merchant storefront derived from the supplied store PNG and implemented around the real Amazon festival inventory. Dark Manrope headings, fine gray borders, transparent dark-orange shopping actions and a black merchant link establish a clear scan from campaign identity to offers, products, categories and conditions.

This is an implemented local trial for /store/amazon-great-indian-festival-2026/, not a deployment record or a certified pixel-identical clone. The shared CouponPush navigation, footer and global brand assets remain incumbent; this document has no authority over other routes.

The north-star label describes the observed build; it is not a new brand direction. Source authority is the dedicated [component](../../../components/features/festival/AmazonFestivalPreview.tsx), its [CSS Module](../../../components/features/festival/AmazonFestivalPreview.module.css) and this route's [page](page.tsx). The supplied `D:/Cpush/new store ui.png` provides visual reference, while [PRODUCT.md](../../../../../PRODUCT.md) retains product truth. The surface contract is `D:/Cpush/.impeccable/surfaces/p-store-amazon-great-indian-festival-2026-page-tsx.md`.

**Key Characteristics:**

- White surfaces and fine borders rather than raised cards.
- Strong, compact headings above restrained gray supporting copy.
- Transparent dark-orange offer actions, black merchant navigation and a gliding orange active-filter indicator.
- Inventory-derived imagery, counts and categories with source terms available.

## Colors

A white and gray base supports dark-orange text actions, while filled orange remains on code-copy and recovery controls. The frontmatter records the reused route palette; contextual badges remain component variants.

### Primary

- **Store Orange:** Code-copy actions, empty-state recovery and the active offer-type underline.
- **Action Hover:** Deeper brown-orange text on transparent offer-link hover.
- **Warm Dark Orange:** Transparent offer/deal actions, visible focus outlines and text-link hover.
- **Action Ink:** Dark text on filled-orange code-copy and recovery controls.

**The Action Hierarchy Rule.** Use transparent dark-orange text for View offer and View deal; retain orange fill for code-copy and recovery controls, orange for the active offer-type underline, and black for the merchant visit action.

### Neutral

- **Store Ink:** Campaign identity, section titles, offer headlines and price emphasis.
- **Store Muted:** Introductory copy, expanded conditions and about text.
- **White:** Route background, merchant tile, offer rows, cards and form controls.
- **Store Line:** Thin component outlines and section separation.
- **Metadata:** Small notes, previous prices, eligibility reminders and disclosure copy.
- **Warm State:** Selected saved filter and active category feedback.

Bank labels use pale blue with blue text; membership labels use pale lavender with purple text. Discount badges are red with white text, and product-coupon badges are pale orange with brown text. These carry data-specific meaning, not an additional general accent palette.

## Typography

**Display and Body Font:** Self-hosted Manrope, registered as `CouponPush Manrope`, with the incumbent `--font-primary` stack as fallback. Both headings and controls inherit the route family. Variable normal weights (400–800) use `font-display: swap`; Latin and Latin-ext subsets include the rupee character.

**Character:** Heavy, slightly tightened Manrope headings lead product information with modestly larger text. Small neutral labels support scanning; numerical prices use tabular figures.

### Hierarchy

- **Display:** Campaign name, constrained to 24 characters of line measure; responsive overrides are recorded in Layout.
- **Headline:** Section headings, with the same strong weight and tightened tracking.
- **Offer title:** Compact benefit statement; mobile stays prominent rather than shrinking into metadata.
- **Product title:** Two-line clamp with a reserved minimum height; links inherit the text color.
- **Body:** Intro copy uses the frontmatter role and a maximum measure of 66ch. About copy has a longer measure (75ch) and line-height (1.7).
- **Label:** Most controls and supporting eligibility copy; offer-type labels use (14px) on desktop. Product notes and offer badges use (11px), while discount badges and about-fact labels retain (10px).
- **Price:** Current price is heavy and tabular; previous price is muted, smaller and struck through.

At mobile widths, intro/about body copy is (14px), offer titles are (20px), product titles are (13px) with a reserved height (37px), and current prices are (18px). Desktop product titles reserve (40px); current prices are (20px). FAQ questions use (13px) and answers (14px) across the responsive layouts.

## Layout

The centered route container is capped at (1200px), initially leaving (40px) on each side of smaller viewports. The page begins with (24px) top padding and ends with (36px). Breadcrumbs wrap. The hero places a (132px) merchant tile, flexible campaign text and merchant visit link in three columns, with (28px) gaps. Hero padding is (40px 0 32px). Tabs form a horizontally scrollable strip with a thin lower border. Sections normally separate by the section spacing token, while the first section after tabs has no added top gap.

Offer rows use four aligned columns: benefit, contained thumbnail, conditions and action. Their desktop grid is `minmax(210px,1.2fr) 84px minmax(150px,1fr) minmax(190px,.9fr)`, with (22px) gaps and a minimum height of (130px). Expanded details increase natural height.

The product rail shows five cards per desktop viewport with (16px) gaps, horizontal overflow and mandatory horizontal scroll snap. The expanded view uses five equal grid columns. Cards align to their own content, reserve image and title space, and push the shopping action downward. Categories use six columns. About uses a wide text column and narrower facts panel. FAQs use two columns.

### Responsive behavior

| Condition | Observed implementation |
| --- | --- |
| At or below (1100px) | Hero becomes two columns with a (112px) merchant tile; visit action sits under the copy. Product rail/grid show four cards. Categories use three columns. Offer columns tighten. |
| At or below (850px) | Side inset becomes (24px); hero title becomes (32px). Products show three cards. Offer description moves below the headline and thumbnail, with the action spanning both rows. About stacks and its facts panel caps at (400px). |
| At or below (599px) | Side inset becomes (16px), page top padding (18px). Hero uses a (72px) tile and (28px) title at line-height (1.15). Section titles become (24px), section gaps (32px). Offer rows become two columns, then full-width description and action. Products and categories use two columns with (12px) gaps. FAQs become one column. |
| Mobile control detail | General transparent offer actions rise to (44px) minimum height; product-card actions retain a more compact (40px). Saved filter is (44px), save hearts are (40px) square, product details are (36px) minimum height. |
| Between (761px) and (1100px) | The module uses `body:has(.page)` solely to narrow the incumbent shared header grid to `160px minmax(0,1fr) auto 0` with (16px) gaps while this route is present. Other routes do not receive this selector. |

**The Route Boundary Rule.** Apply this system only to the Amazon festival route. Preserve shared shell ownership and the data and behavior contracts.

Latest refinement checks report no document or festival-content overflow at widths (1440, 810, 768, 390 and 320px), recorded in `D:/Cpush/tmp/amazon-store-polish-check.json`. Earlier `amazon-store-png-final` artifacts remain baseline history. This documentation pass did not run the browser or treat these checks as pixel-identity certification.

## Elevation & Depth

The route uses flat white surfaces, fine borders and pale image/facts fills. The module declares no shadows. Fine-pointer hover lifts product/category cards slightly and warms borders; product and category images also move. Offer rows warm their border and fill. Category selection retains its warm border and fill. Circular rail controls sit above the rail through positioning and stacking. Shared header/footer effects remain outside this route system.

**The Flat Surface Rule.** Separate route surfaces with borders and pale fills; the route module declares no box shadows.

## Shapes

Corner rounding follows the object's role: small badge corners, compact rectangular actions, slightly softer fields, rounded product/category cards and broader offer rows. The merchant tile has the broadest fixed corners, reducing to (16px) on mobile. Visit links and sort controls are capsule-like; save hearts and desktop rail controls are circular. Code boxes use a dashed orange border and clipped corners. The merchant tile adds a dashed frame inset outward by (6px), rotated (-5deg), plus a small (16px) inline SVG geometric sparkle; both are decorative and noninteractive. Product imagery uses `object-fit: contain` rather than decorative cropping.

## Components

### Offer and merchant actions

Both "View offer" and "View deal" share a transparent background and dark-orange text at weight (800). Desktop action text is (14px); mobile product-card action text is (12px). Hover keeps the background transparent and deepens the text color. The directional arrow moves right by (4px) on hover or visible focus. The black merchant link uses a capsule shape and (13px) text; its hover background is dark gray. All route links, buttons, inputs, selects and summaries receive a dark-orange visible focus outline (3px, offset 4px), except search, which outlines its enclosing field instead.

Actual codes receive a dashed code/copy control; the Copy button retains orange fill with dark text at (12px), and the code remains (14px). Clipboard success changes the label to “Copied”; failure exposes manual-copy text with status semantics. Product-page coupons without codes use direct offer links, not invented code strings. External merchant/source links open in a new tab with the implemented rel attributes.

### Offer tabs and filters

Offer types are buttons with `aria-pressed`, not an ARIA tab widget. The active button uses darker text and heavier weight. Before measurement, its lower border supplies the orange underline; once measured, a separate strip (1px base width, 2px height) uses translateX/scaleX to glide beneath it. A ResizeObserver watches the strip container and filter buttons to update the active button offset and width. Switching offer type clears category, search and saved-only filters. “About” is an anchor to the information section. Sorting exposes featured, newest and both price directions; missing prices sort after known prices.

### Search, saved deals and category controls

Search matches product title and brand, trims the query, and opens the grid. The saved-only control shows the count of currently available saved inventory, warms when selected and opens the grid. Product hearts use `aria-pressed` and persist IDs under `cp-festival-${festival2026.slug}-saved` in localStorage; unavailable storage retains in-session state. This is a device-local shortlist, not a wishlist collection or account sync.

Category tiles are buttons populated from actual inventory, with a contained representative product image and real count. Choosing one clears search/saved-only, opens the grid and scrolls to deals; an active-category chip provides a clear control.

### Offer rows and product cards

Offer labels distinguish product coupon, bank and member conditions. Descriptions clamp to two lines in the summary; native details retain full copy and available source links. Product cards use pale image fields, optional discount/coupon badges, a save heart, a two-line product title, current/previous prices, an offer action and native terms disclosure. Unknown prices read “Check price”. Images lazy load and switch to an unavailable-image state on failure.

The rail arrows appear only when there is content in that direction, moving by (85%) of the visible rail width. “View all deals” switches to the responsive grid; “Show fewer deals” restores the rail. Category navigation and arrow scrolling use immediate movement when reduced motion is preferred. The rail also declares smooth scrolling in CSS.

### Motion

The hero arrives over (.45s) from opacity (.85) and a downward offset (6px). The active-filter strip transforms over (.3s). Action text changes color over (.18s), and its arrow shifts over (.22s). The shared movement curve is `cubic-bezier(.2,.65,.3,1)`. On hover-capable fine pointers, product cards lift (3px), product images lift (2px) and scale (1.035); category cards lift (3px), and their images lift (3px) and rotate (-2deg). Card/category transforms use (.24s); product images use (.32s), category images (.28s), and offer-row warmth (.22s). These interactions add no shadow.

Under `prefers-reduced-motion: reduce`, the route and all descendants/pseudo-elements disable animations and transitions and use automatic CSS scroll behavior. Hover transforms may still take their final state immediately; motion is removed rather than the hover state itself.

### Information, FAQs and recovery

About repeats source-backed campaign information and shows actual offer/code/category counts in a pale facts panel. FAQ rows use native `details/summary`, with a rotating chevron state and uncropped answer text. Source links, checkout eligibility reminders, independent-merchant disclosure and affiliate link remain visible.

The component begins with the deployed snapshot and refreshes from the existing API. Invalid store/coupon ownership is rejected. Recoverable refresh failure retains published data with a status message and retry; explicit missing/gone responses clear it. Empty filtered results show a reset or browse-deals action. No fabricated inventory is added to fill a visual gap.

### Asset and evidence ownership

- Reuse product imagery supplied by existing inventory. This trial adds no generated rasters.
- Manrope is self-hosted at `public/fonts/manrope-variable.woff2` and `public/fonts/manrope-latin-ext-variable.woff2`, with `public/fonts/Manrope-OFL.txt`. Origin: `D:/Cpush/tmp/manrope-font-origin.json`; the Latin-ext subset shares the [Google Fonts CSS source](https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap). This records asset provenance, not an independent license audit.
- The merchant mark at `public/assets/festival-2026/amazon-mark.svg` adapts Font Awesome Free's Amazon brand vector by separating existing subpaths into black letter and orange smile/arrow. The shipped attribution is `public/assets/festival-2026/amazon-mark.LICENSE.txt`; upstream source is [Font Awesome brands/amazon.svg](https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/amazon.svg), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Local provenance is `D:/Cpush/tmp/amazon-mark-origin.json`.
- The supplied `new store ui.png` is a development-only reference, not shipped artwork. Its sample metrics, codes and products are not catalog evidence.
- Source authority for this refinement is the current component and CSS Module. Baseline screenshot evidence from before the refinement: `AmazonFestivalPreview.tsx`, `AmazonFestivalPreview.module.css`, `page.tsx`, and `D:/Cpush/.impeccable/review/amazon-store-png-final/{page-1440.png,page-390.png,desktop-viewport.png}`.
- Latest refinement evidence is `D:/Cpush/tmp/amazon-store-polish-check.json`: no recorded errors; measured active indicator, loaded Manrope, transparent offer/deal actions, reduced motion, real inventory, search/reset, sort, persistent saves, categories, FAQ, refresh failure/retry, code-copy fixture and unchanged regular store routes. Current screenshots are in `D:/Cpush/.impeccable/review/amazon-store-polish/`: `desktop-viewport.png`, `desktop-offers.png`, `desktop-deals.png` and full pages at (1440, 810, 768, 390 and 320px).

## Do's and Don'ts

### Do:

- **Do** preserve real inventory, source links, eligibility notes, fallback states and native disclosures.
- **Do** keep the horizontal deal rail and expanded grid as two views of the same filtered inventory.
- **Do** keep saved deals on this device and keep the removed wishlist collection absent.
- **Do** retain route-scoped styles and the incumbent public navigation and footer.
- **Do** reuse actual inventory images with contained sizing and an unavailable-image fallback.

### Don't:

- **Don't** import illustrative coupon codes, ratings, verification claims, shopper totals or category counts from the reference PNG.
- **Don't** ship the development reference PNG as page artwork or add generated raster replacements.
- **Don't** promote this trial into a product-wide design system or claim deployment or certified pixel identity.
- **Don't** combine exchange credits, future cashback and bank eligibility into an unconditional payable price.

Not canonized: shared-shell styling and the incumbent icon-font delivery mechanism, because they are inherited dependencies outside this route's visual authority. The sidecar component previews demonstrate local visual states; they do not replace React behavior, catalog content or asset attribution.
