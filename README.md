# CouponPush

CouponPush is a coupons, deals, and store offers website. The public frontend uses Next.js and React, exports static pages, and is deployed to Cloudflare. A separate PHP API and MySQL database provide catalog data and support the admin dashboard.

- Website: https://couponpush.com
- Repository: https://github.com/chahatmahtoliya/coupon-push
- Default API base: https://api.couponpush.com/api
- Default media host: https://media.couponpush.com

## Technology

| Area | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Material UI, Emotion, project CSS |
| Image preparation | Sharp, responsive WebP assets |
| Backend and admin | PHP, MySQL, PDO |
| Frontend hosting | Cloudflare Workers static assets |
| Build validation | TypeScript, Python SEO checks, blog checks |

Exact dependency versions are maintained in `frontend-next/package.json` and its lockfile.

## Project structure

| Path | Purpose |
| --- | --- |
| `frontend-next/src/app/` | Next.js routes and page metadata |
| `frontend-next/src/components/` | Shared frontend components |
| `frontend-next/src/styles/` | Frontend styles |
| `frontend-next/src/services/` | API requests and media URL handling |
| `frontend-next/src/lib/` | Catalog snapshots, route helpers, and page utilities |
| `frontend-next/src/data/` | Catalog snapshot and generated image metadata |
| `frontend-next/public/` | Static assets and Cloudflare configuration copied into exports |
| `frontend-next/scripts/` | Catalog, blog, image, redirect, and SEO preparation |
| `frontend-next/blog/` | Blog content and authoring documentation |
| `frontend-next/out/` | Generated static website deployed by Cloudflare |
| `api/` | PHP API endpoints |
| `admin/` | PHP admin dashboard |
| `config/` | PHP database and application configuration |
| `database/` | Base schema, sample data, and additional SQL migrations |
| `includes/` | Shared PHP helpers and templates |
| `imports/` | Import files and festival store examples |
| `c-scrapper/` | Scraping and data collection tooling |
| `output/` | Generated reports and other output |

## Run the frontend locally

Requirements:

- Node.js 20.9.0 or later, matching the installed Next.js and Sharp engine requirements.
- npm.
- Python 3 available as `python` for the build's SEO validation step.
- PHP with PDO MySQL and a MySQL server only if running the backend locally.

From the repository root:

```powershell
cd frontend-next
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100/.

A local preview does not indicate that the page has been committed or deployed. Production includes the files in the published static export.

### Frontend configuration

Create `frontend-next/.env.local` when you need to override the API or media hosts. It is ignored by Git.

```dotenv
API_URL=https://api.couponpush.com/api
NEXT_PUBLIC_API_URL=https://api.couponpush.com/api
NEXT_PUBLIC_MEDIA_URL=https://media.couponpush.com
NEXT_PUBLIC_STORE_MEDIA_URL=https://media.couponpush.com
```

| Variable | Purpose |
| --- | --- |
| `API_URL` | API base for server-side requests; also read by the catalog preparation script |
| `NEXT_PUBLIC_API_URL` | API base used by browser requests |
| `NEXT_PUBLIC_MEDIA_URL` | Host for uploaded media |
| `NEXT_PUBLIC_STORE_MEDIA_URL` | Optional separate host for store images; defaults to the media host |

The catalog preparation script reads `API_URL` from the shell environment. To point a catalog refresh at another backend in PowerShell, set it before running the build:

```powershell
$env:API_URL = 'https://api.couponpush.com/api'
npm run build
```

Variables prefixed with `NEXT_PUBLIC_` are included in browser code. Use them for public configuration only. Restart the development server after changing environment settings, and rebuild the export before deploying them.

## Brand onboarding and partner workspace

The local implementation adds `/list-a-store/`, a private `/partners/` workspace and an admin **Brand Submissions** queue. Brands can verify email, save store/offer drafts, follow reviews and publication, and see engagement counts. Verification and password-reset emails use hosting PHP mail with a retry queue.

The frontend launch flag is off by default. Configure the backend and run the additive migration before setting `NEXT_PUBLIC_PARTNERS_ENABLED=true` and building/deploying the frontend. See [the complete setup and publication guide](api/PARTNERS-DEPLOY.md). This work has not migrated or deployed production.

## Data and images

The frontend uses `src/data/deployed-snapshot.json` to provide catalog data during static generation. API calls provide additional data and browser interactions such as search and click tracking.

`npm run build` refreshes the catalog from the API before exporting pages. `npm run build:snapshot` uses the existing catalog snapshot, which is useful when preparing a release from reviewed data without refreshing the catalog.

The hero image preparation script downloads supported slide images and generates responsive WebP variants under `public/assets/hero/`. It records asset dimensions and variants in `src/data/hero-images.json`. The carousel uses these local assets when a matching prepared image exists and falls back to the original image otherwise.

To prepare hero assets separately:

```powershell
npm run hero:prepare
```

To force a refresh of the downloaded hero images:

```powershell
node scripts/prepare-hero-images.mjs --refresh
```

## Build and checks

Run these commands from `frontend-next/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Refresh catalog data, prepare content/assets, export pages, and check SEO |
| `npm run build:snapshot` | Build and check the export using the existing catalog snapshot |
| `npm run catalog:refresh` | Refresh catalog data without building the website |
| `npm run catalog:refresh-only` | Refresh catalog data while preserving current promotion creatives |
| `npm run hero:prepare` | Generate local responsive hero images |
| `npm run seo:images` | Verify exported image files and remote image responses |
| `npm run seo:live` | Audit live sitemap pages, metadata, canonical tags, and images; fails on detected issues |
| `npm run seo:origin-test` | Test HTTPS and canonical hostname redirects |
| `npm run blog:prepare` | Prepare blog content |
| `npm run blog:check` | Validate blog content |
| `npm run seo:check` | Run SEO checks against the generated export |

The build scripts automatically run blog preparation through their npm prebuild hooks. The resulting website is written to `frontend-next/out/`.

Preview an exported build with a static server, for example:

```powershell
npx serve out
```

Although the package includes a `start` script, `next start` is not the production preview workflow for this project because it uses `output: 'export'`.

## Cloudflare deployment

The Cloudflare project `coupon-push` is connected to this GitHub repository and deploys changes from `main` automatically. Its deployment settings use the committed static export:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/frontend-next/out` |
| Build command | None |
| Deploy command | `npx wrangler deploy` |

**Cloudflare does not build the Next.js source in this configuration. Rebuild and commit the updated `frontend-next/out/` files alongside the source changes before pushing to `main`.**

Release workflow:

1. Make and review the source changes.
2. Run the relevant checks and either `npm run build` or `npm run build:snapshot` from `frontend-next/`.
3. Review the generated export and stage the intended source files together with the updated `frontend-next/out/` files.
4. Commit and push to `main`.
5. Check the GitHub `Workers Builds: coupon-push` status or Cloudflare deployment logs.
6. Open https://couponpush.com and verify the deployed page and assets.

The Cloudflare configuration lives in `frontend-next/public/wrangler.jsonc` and is copied into `out/` during export. Its asset directory is `.` because deployment runs inside `out/`. The accompanying `.assetsignore` excludes the deployment configuration from public assets. Keep both files in the exported release.

The `canonical-origin.mjs` Worker runs before asset lookup and permanently redirects HTTP and `www` requests on the public domain to `https://couponpush.com`, preserving the path and query string. Canonical requests delegate to the `ASSETS` binding, which serves the export and its existing legacy redirects. The Worker source is excluded from public assets. This requires deploying the rebuilt export and its updated Wrangler configuration; Apache `.htaccess` rules do not affect Cloudflare hosting. The `www` hostname also needs DNS and a Cloudflare domain route before its redirect can receive requests. All requests invoke the Worker, so Worker request usage applies alongside static asset hosting.

Frontend deployment does not publish the PHP API or admin dashboard. Those are hosted separately; see [API deployment instructions](api/API-DEPLOY.md).

### Deployment troubleshooting

- **Changes appear locally but not live:** confirm the updated export was committed, pushed to `main`, and successfully deployed. Source changes alone do not update the served static pages.
- **Cloudflare fails while cloning or updating submodules:** inspect `git ls-files --stage` for unintended entries with mode `160000`. Temporary worktrees must not be committed as submodules. The root `/tmp/` directory is ignored for this reason.
- **Deploy command cannot find its configuration:** confirm `out/wrangler.jsonc` exists and the Cloudflare root directory remains `/frontend-next/out`.
- **Catalog refresh fails:** inspect the API response and connectivity. Use `build:snapshot` only when the existing snapshot is the data you intend to release.
- **Images use an old or remote asset:** verify the hero preparation output, rebuild the export, and include the generated image files in the release.

## PHP backend and admin

To develop the backend locally, configure a PHP web server with the repository's PHP application as its document root, create a MySQL database, and review/import `database/schema.sql`. Apply the additional SQL files needed by the features you are developing. Use sample data only in a development database.

Configure the database connection in `config/database.php` and the local site URL/path in `config/constants.php`. The current localhost URL logic assumes a `/coupon-site` path, so adjust it to match your web server setup. Point the frontend API variables at the local API if you want it to use that backend.

Keep database credentials private. When deploying backend changes, preserve the production database configuration rather than replacing it with local values.

## Additional documentation

- [PHP API deployment](api/API-DEPLOY.md)
- [Frontend styling](frontend-next/src/styles/README.md)
- [Blog authoring](frontend-next/blog/README.md)
- [Scraping tools](c-scrapper/README.md)
