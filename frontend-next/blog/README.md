# CouponPush blog

The HTML files in this directory are the source of truth. Shared styling lives in `assets/styles.css` and `assets/brand.css`; navigation, search, filters, copying and the calculator use `assets/script.js`.

- Run `npm run blog:preview` and open http://127.0.0.1:8767/blog/ to preview the blog with directory-style URLs. Main-site links use the existing `out/` export.
- `npm run build` and `npm run build:snapshot` copy this folder into `public/blog/` before Next.js exports the site. Deploy the complete `out/` directory.
- Run `npm run blog:prepare` after edits if you need the generated public copy. Next's development server serves static HTML by filename (for example `/blog/index.html`); use the blog preview for directory-style navigation.
- Keep `sitemap.xml` up to date when adding or removing pages.
- Run `npm run blog:check` after a build to check local links, metadata, export coverage, search/filter states and calculator edge cases.

The homepage and guide archive link to the 13 available store guides. Unsupported store routes use the site's search page. The earlier research page's unsourced statistics and directory verification promises have been removed; no live verification or mailing-list service is implied.
