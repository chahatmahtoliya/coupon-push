# Blog index layout repair — 29 October 2026

The feed markup in /blog/ was loading the article stylesheets without assets/home.css, although that file contains the feed layout rules. The missing dependency is present in the 3c40c91d8 source history and was preserved by later releases. This fix links the existing feed stylesheet from the editable index and synchronizes the static export.

Mobile filters remain on one line and scroll within the tab row. Shopping and Food & groceries labels now match the actual topic filters. Existing bookmark buttons toggle and persist saved state, with graceful fallback when storage is unavailable.

Regression coverage: the blog checker rejects a feed template that omits home.css. Browser verification passed at 1440px, 900px and 390px: two desktop/tablet columns and one mobile column, no document overflow, working search and empty/reset states, correct topic filters, bookmark persistence, article navigation, mobile navigation when shown, shared social links, zero JavaScript errors and zero failed resources. All 45 blog pages passed local links, metadata, JSON-LD, export coverage, search/filter/calculator checks, and shared shell consistency.

No Next application rebuild is needed for this static blog patch. The editable source and published blog files are synchronized. The inherited typography is preserved.
