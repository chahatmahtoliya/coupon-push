# Power-bank pSEO engine application - existing editorial pilot

Date: 30 October 2026. Scope: improve the ten existing power-bank articles, preserve their URLs and cover images, and introduce structured generation and validation. No new URL expansion. The user explicitly requested application to all existing power-bank blog content; this is maintenance of a ten-page pilot, not a 50-200-page launch.

## 1. Pattern report and demand mapping

India database, Semrush retrieved 30 October 2026. Sources: demand-research.json. Volumes are tool estimates, not Search Console observations. Seven of 17 requested keywords were not returned; missing rows are unknown. The reported head-term volume of 2,240,000 is anomalous and excluded from calculations. Discovery searches surfaced retailer collections and comparison/editorial guides; they are not a verified top-three Google India ranking report. No authenticated current Search Console query/page export is available.

| Existing pattern | Pages | Measured demand and limits | Intent | Expansion score /100 | Decision |
|---|---:|---|---|---:|---|
| Budget ceilings | 2 | power bank under 1000: 2,400; under 2000: 320. Proxy keyword sum 2,720; median 1,360. Exact deal phrases not returned. | Commercial comparison | 70 | Strongest pilot candidate; expansion held pending novelty and indexing evidence. |
| 10K versus 20K capacity | 1 | Exact comparison: 90. Related capacity terms 4,400 and 9,900 are context, not extra demand assigned to this page. | Comparison | 59 | Improve the existing decision guide; no new capacity variants. |
| Exact-model specification reviews | 2 | Xiaomi 4i review and Anker Nano review rows not returned. | Product research | 54 | Preserve editorial review classification; no invented hands-on tests. |
| 20W versus 30W | 1 | Exact comparison unknown. Fast charging power bank: 8,100 is a broader proxy only. | Compatibility comparison | 54 | Improve supported charging distinctions; no speculative speed benchmarks. |
| Wireless versus wired | 1 | Exact comparison unknown. MagSafe power bank: 60,500 is a broader category, not this page's demand. | Format comparison | 54 | Improve compatibility/certification decision support; no fabricated efficiency data. |
| Amazon versus Flipkart | 1 | Exact comparison unknown. Amazon power bank deals: 880; Flipkart phrase not returned. | Retailer comparison | 50 | Explain final-cost checks; no unverified retailer price winner. |
| Shortlist and deal-quality checks | 2 | best power bank deals: 140, shared proxy rather than demand counted twice. | Buying shortlist and evaluation | 54 | Distinct editorial intents; do not compete with the main commercial hub. |

Weights follow the supplied skill: demand 20, data moat 25, SERP weakness 15, monetization 15, template viability 10, maintenance 10, brand/policy risk 5. Scores are conservative planning judgments, not measured ranking probabilities. Factor ratings (1-5) in that order: budget [4,3,2,5,4,3,4]; capacity [2,3,2,4,4,3,4]; model [2,2,2,4,4,3,4]; speed [2,2,2,4,4,3,4]; format [2,2,2,4,4,3,4]; retailer [2,2,2,4,3,2,4]; shortlist/checks [2,2,2,4,4,3,4]. Scores equal the weighted sum divided by 5.

Recommendation: maintain all ten existing articles as evidence-backed editorial pages. Budget and capacity aggregations can become stronger data-led pages once publisher catalog provenance is improved. Do not certify a proprietary moat: no field has been proven absent from the actual top-three ranking pages. No new page pattern passes all launch gates today.

## 2. Data schema and provenance

Sources are versioned publisher catalog data and manufacturer/standards facts. Every field must carry its origin, observation date and confidence. Distinguish catalog retrieval from seller verification. The publisher API currently supplies 236 records, with missing per-offer source_url, checked_at and verification_method in sampled records. Record updated_at is not a price verification date. Fields with missing values must not be inferred silently.

Required entity fields: stable article slug, specific query intent, answer, distinct decision table, sources, editorial review date, assumptions/limits, related guides, and covered product attributes. Product fields include manufacturer/model, advertised capacity, relevant port wattage and protocol only where supported. Computed catalog fields must describe their exact population and avoid counting colour variants as distinct models. All derived money comparisons must identify listing prices and shipping exclusions; no success rates or price histories without data.

## 3. Template specification

Keep existing covers, site shell, URLs and substantial article-specific body. Open with a 40-60-word direct answer. Follow with the page's specific comparison or evidence table, supported insight, and a route back to the commercial hub. Rich catalog matches may show a deduplicated sample; manufacturer-only pages show specification/decision data; unsupported modules stay absent. Retain honest author identity, source links, methodology, affiliate disclosure and actual review date. Update Article image, dateModified and breadcrumbs consistently with visible content. FAQ markup is not a promise of a Google rich-result feature.

Titles and descriptions must remain unique, accurate and useful. Do not force a year or a discount into a title merely to claim freshness. The commercial hub owns Power Bank Deals; articles target narrower decisions. Each spoke receives at least five contextual links from sibling articles and links back to the hub.

## 4. Generation and quality pipeline

Versioned data -> required-field/provenance validation -> deterministic article enrichment -> metadata/schema/link and similarity checks -> source/public/export synchronization -> browser QA. Do not execute the old authoring script unchanged: it would restore removed initials and discard recent cover work. No routine build should fetch remote prices or replace a review date with the build time. Changed content can advance lastmod; an unchanged regeneration must not.

Require distinct page facts and a table, preserve source truth, reject duplicate metadata, broken internal destinations, invalid JSON-LD, missing required values and excessive sibling similarity. Report the metric and population used for similarity and data uniqueness. A failed scalable-content gate should not be hidden by synonym spinning.

## 5. Existing-page pilot and rollout gate

Pilot inventory: top-5-power-bank-deals-india; 10000mah-vs-20000mah-power-bank-deals; xiaomi-power-bank-4i-10000mah-review-deals; anker-nano-30w-power-bank-review-deals; power-bank-deals-under-1000; power-bank-deals-under-2000; 20w-vs-30w-fast-charging-power-bank-deals; wireless-vs-wired-power-bank-deals; amazon-vs-flipkart-power-bank-deals; best-and-worst-power-bank-deals.

QA every page because the set contains only ten, rather than pretending to sample 25 different URLs. Check all primary references, calculations, canonical URLs, images, navigation and mobile tables. Use current Search Console inspection/performance data when authenticated access is available; no current indexing or rank figures can be invented.

Review windows: 20 November 2026 (three weeks) and 11 December 2026 (six weeks). Consider expansion only after at least 70% indexed/submitted, under 20% crawled-currently-not-indexed, rising impressions and improving positions, and engagement at or above the site's measured median. Neither structured-data validation nor successful deployment establishes that Google indexed or ranked the pages.

## 6. Maintenance calendar

Weekly from 6 November: verify primary sources and catalog provenance, check per-pattern indexing and impressions when available, detect broken links and expired listings, compare similarity and structured data, and review merchant-click events if measured. Refresh meaningful data changes, not timestamps alone. Monthly: SERP/competitor drift and any actual AI citation evidence; inspect 20 defined queries only when the corresponding service access exists. Quarterly: review zero-impression articles after six months before improving, merging or removing; no automatic pruning is authorized by this pilot.

Authority work can use a clearly documented aggregate dataset or methodology as a linkable resource. No outreach messages have been authorized and none should be sent as part of this implementation.


## Implementation and verification record

- Versioned source: `frontend-next/src/data/power-bank-editorial.json`; deterministic renderer and validation: `frontend-next/scripts/prepare-power-bank-pseo.mjs`; explicit saved-capture importer: `frontend-next/scripts/refresh-power-bank-catalog.mjs`.
- `prepare-blog.mjs` runs the renderer before shell/public synchronization. The blog sitemap carries source-review lastmod dates for these ten existing URLs. Existing titles/H1 route inventory and cover assets remain intact.
- All ten pages passed independent metadata, 40-60-word answer, canonical, cover, structured-data, empty-module, source/disclosure and internal-link checks. Every article has six contextual inbound sibling links.
- All ten pages passed desktop (1440px) and mobile (390px) browser checks. Representative header and table screenshots were visually inspected. Tables scroll inside their wrapper on narrow screens.
- The complete blog validation passed across 45 pages, including local destinations, JSON-LD, export coverage, search/filter states, calculator boundaries and shared shell copies. Data regression tests exercise missing fields, empty cohorts, duplicate rows, strict budget ceilings, manufacturer-only modules and capture provenance.
- Five-word-shingle full-page Jaccard similarity peaks at 30.41%; the minimum directional body uniqueness is 57.67%. These are lexical metrics, not proof of useful content or a ranking guarantee. Exact field/value data overlap fails the 60% novelty target for three review/shortlist pairs. Those patterns remain blocked for expansion; the ten existing editorial pages are maintained rather than falsely certified as scalable templates.
- No new pages, outreach, fabricated ratings, checkout verification or hands-on tests are included. Publishing and successful HTML validation cannot establish Google indexing or improved rankings; that requires later authenticated Search Console evidence.
