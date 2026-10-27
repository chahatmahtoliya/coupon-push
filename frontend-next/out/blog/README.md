# CouponPush blog

The HTML files in this directory are the source of truth. Shared styling lives in `assets/styles.css` and `assets/brand.css`; navigation, search, filters, copying and the calculator use `assets/script.js`.

The site header and footer are generated from the homepage export of the shared React components by `scripts/sync-blog-shell.mjs`. `assets/site-shell.css` is generated from the main site's stylesheet and scoped to those regions; edit the original components/styles instead of the generated shell. Preparation and both build commands synchronize all blog pages, and postbuild refreshes them from the newly exported homepage. `assets/site-shell.js` supplies search and accessible mobile-menu behavior on static pages.

Every indexable page with Article/BlogPosting structured data gets Previous article / Next article navigation at the end of its main content. Articles are ordered by publication date, then canonical path for ties. The first/last article shows an unavailable previous/next state. Indexes, archives and tools are excluded. Navigation is regenerated during preparation, so adding an article also updates its neighbours.

Article body text uses self-hosted Source Serif 4 at 18px with 1.7 line spacing. Regular and italic variable fonts, including Latin Extended for the rupee symbol, live in `assets/fonts/` with their SIL Open Font License. The shared header/footer and article headings retain their existing typography.

- Run `npm run blog:preview` and open http://127.0.0.1:8767/blog/ to preview the blog with directory-style URLs. Main-site links use the existing `out/` export.
- `npm run build` and `npm run build:snapshot` copy this folder into `public/blog/` before Next.js exports the site. Deploy the complete `out/` directory.
- Run `npm run blog:prepare` after edits if you need the generated public copy. Next's development server serves static HTML by filename (for example `/blog/index.html`); use the blog preview for directory-style navigation.
- Keep `sitemap.xml` up to date when adding or removing pages.
- `tools/emi-calculator.html` uses `assets/emi-math.js` for reducing-balance calculations and `assets/emi-calculator.js` for form, schedule and CSV interactions. Run `node scripts/check-emi.mjs` to check the financial edge cases. Its `?embed=1` view hides site navigation; the copyable embed includes a visible attribution link outside the iframe.
- Run `npm run blog:check` after a build to check local links, metadata, export coverage, search/filter states and calculator edge cases.

The homepage and guide archive link to the 13 available store guides. Unsupported store routes use the site's search page. The earlier research page's unsourced statistics and directory verification promises have been removed; no live verification or mailing-list service is implied.
