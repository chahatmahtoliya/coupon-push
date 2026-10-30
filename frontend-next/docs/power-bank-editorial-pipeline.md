# Power-bank editorial maintenance

This pipeline maintains ten existing articles, creates no new URLs, and does not certify a scalable pSEO pattern. Evidence and expansion decisions live in `../../output/seo/power-bank-pseo-2026-10-30/pattern-report.md`.

## Versioned data contract

`src/data/power-bank-editorial.json` is authoritative. Preserve its schema version, source references, dates and capture lineage.

| Field | Meaning | Validation and confidence |
| --- | --- | --- |
| `schema_version` | Integer schema version | Supported by renderer |
| `articles` | Existing slugs, bodies, answers, metadata and relationships | Unique slugs/meta; 40-60 word answers; preserve URLs |
| `sources` / `manufacturer_review` | Primary URLs and exact official specifications | Manufacturer claims; no independent measurement implied |
| `catalog.retrieved_at` | Capture timestamp | Retrieval date, never checkout date |
| `catalog.source_url` / `sha256` | Publisher API and digest | Preserve capture lineage |
| `listed_price_inr` | Positive catalog-listed price | Required for price calculations; not a seller quote |
| `advertised_capacity_mah` | Parsed integer or null | Unknown remains unknown; not measured usable capacity |
| `catalog_advertised_output_w` | Parsed advertised wattage or null | Not measured charging speed |
| `product_page_group` | Merchant + URL path + capacity | Groups query/colour variants; not certified distinct models |
| `source_checked_at` / `source_verification_method` | Nullable imported check metadata | Generic checks do not establish checkout verification |
| `checkout_verified` | Boolean evidence status | Importer always sets false; future checkout evidence needs a validated contract |

The importer repairs known encoding defects and preserves `raw_title` when changed. Duplicate IDs, invalid prices, invalid source records and visible mojibake fail validation. Optional missing capacity/output stay null; relevant cohorts exclude them.

## Editorial output

Each article has an answer before its existing cover, an intent-specific decision table, retained editorial narrative, source/method/disclosure notes and six contextual links. Tables address budgets, capacities, output labels, wireless classification, retailer coverage, quality or exact manufacturer SKUs. Budget membership is strictly below the ceiling. Publisher capture prices require seller checkout confirmation.

Covers and shared shell remain intact. Manufacturer-only modules omit catalog pricing boilerplate. Missing required cohorts fail instead of generating zero median prices or empty tables. Metadata and Article JSON-LD use the maintained source. No ratings, stock claims, checkout tests, performance measurements or expert reviews are invented.

## Refresh and checks

Run from `frontend-next`. Capture import is manual; builds never fetch remote sources. Review catalog weekly and manufacturer facts monthly or when specifications change. Advance review dates only after real review, never from the build clock.

```powershell
node scripts/refresh-power-bank-catalog.mjs --input ../output/seo/power-bank-pseo-2026-10-30/catalog-retrieval.json
node --test scripts/test-power-bank-pseo.mjs
node scripts/prepare-blog.mjs
node scripts/sync-blog-shell.mjs --export
node scripts/prepare-power-bank-pseo.mjs --check
npm run blog:check
```

`prepare-blog.mjs` enriches articles before standard preparation. The retired Python writer delegates to the same renderer and cannot restore its old layout. `--check` compares normalized DOM output, fails stale article content, and updates audit JSON without rewriting pages. Repeated preparation/shell synchronization leaves dates stable. Sitemap `lastmod` uses source review/capture dates.

Seven regression tests cover independently checked counts, strict budget boundaries, duplicate/missing/encoded data, absent cohorts, required manufacturer facts, empty sources and capture provenance. A generic check method plus date explicitly remains checkout-unverified.

## Similarity and expansion

`content-quality.json` records every pair in both directions. Text uses distinct five-word shingles: Jaccard similarity plus directional novelty, separately for full visible page and body. Data uses exact field/value facts, not paraphrase counts. Current maximum full-page similarity is 30.41%; minimum directional body novelty is 57.67%. Maintenance fails above 70% similarity or below 40% body novelty.

Three manufacturer/shortlist pairs miss the 60% directional data-novelty target; minimum zero reflects a shortlist containing a review's actual facts. These are explicit expansion holds, not full skill compliance. Maintain ten distinct existing editorial articles without manufacturing facts. New URLs remain held pending stronger original data, demand/competition evidence and real Search Console pilot results.
