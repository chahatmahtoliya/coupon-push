# Brand onboarding and workspace

Implemented locally on 12 October 2026. The default frontend launch flag is off. The production database, hosting mail delivery and deployment have not been changed by this work.

## Routes and behavior

- `/list-a-store/`: public explanation and account entry point.
- `/partners/`: private brand workspace, always excluded from search indexing.
- `/admin/partners.php`: queue for active admin accounts; editor accounts cannot make review decisions.
- `/api/partners.php`: private session API with exact allowed origins, credentialed requests and CSRF protection.
- `/api/partner-metrics.php`: anonymous store/offer impression collection, enabled with the public feature.

Accounts can save incomplete drafts, verify email, upload a PNG/JPEG/WebP logo, add coupon codes or no-code deals, submit and respond to feedback. One account manages one store. Existing public stores require a separate ownership review rather than automatically granting access. Every proposed change goes through review; the previously approved catalog remains public while changes are reviewed.

Approval and static publication are separate. Approval updates the live API catalog and queues a website update. A refreshed frontend export and deployment create the canonical store page; the admin then verifies that the correct version is visible. Publication is not automated in this release.

## Install the PHP backend

Use the existing PHP/admin host and retain its production `config/database.php` credentials. This feature needs PHP 7.4+ with PDO MySQL, mbstring, fileinfo, cURL, PHP sessions and functioning hosting PHP `mail()`. Use InnoDB for the existing catalog and new tables so review transactions can roll back together.

Upload these backend files, preserving the rest of the application:

```text
includes/partners.php
api/partners.php
api/partner-metrics.php
api/partner-tools.php
api/store.php
api/stores.php
admin/partners.php
admin/includes/admin-header.php
database/add_partners.sql
```

The public store endpoints also include changes from the existing workspace. Review their full changes as part of the release. Upload backend source to the PHP host, not the static frontend export.

From the backend root, run the additive migration against the intended database:

```sh
php api/partner-tools.php migrate
php api/partner-tools.php status
```

The command creates `partner_*` tables and adds missing `stores.partner_revision`, `stores.about_content`, `coupons.source_url`, `coupons.checked_at` and `coupons.verification_method` columns. Re-running it preserves existing data. Do not reinstall `database/schema.sql` on the existing database. The command requires MySQL/MariaDB and does not run through an HTTP endpoint.

The integration suite uses an isolated SQLite fixture. It checks application behavior and transactions; it does not verify MySQL DDL or MySQL concurrency. Run the migration on the hosting/staging MySQL database and check one review transaction there before launch.

## Hosting settings and PHP mail

The defaults work with the current production domains. Supply optional settings through the hosting PHP environment and the cron environment. A Next.js `.env.local` file does not configure PHP. On hosts using Apache, `SetEnv` can provide these values if permitted; use the hosting panel's equivalent for PHP-FPM.

| PHP environment variable | Default / purpose |
| --- | --- |
| `PARTNERS_ENABLED` | Any value except `0` allows the backend. Set `0` during setup or to close brand account endpoints. |
| `PARTNER_ALLOWED_ORIGINS` | `https://couponpush.com`; comma-separated exact trusted frontend origins, with no trailing slash and no wildcard. |
| `PARTNER_SITE_URL` | `https://couponpush.com`; public HTTPS origin for email links and canonical publication checks. |
| `PARTNER_MAIL_FROM` | `partners@couponpush.com`; use a sender address your hosting mail service permits. |
| `PARTNER_ADMIN_EMAIL` | Optional review-queue notification recipient. Brand updates are sent to each account email. |
| `PARTNER_UPLOAD_DIRECTORY` | Backend-root `uploads/partners`; directory writable by the PHP process. |
| `PARTNER_MEDIA_URL` | `https://api.couponpush.com/uploads/partners`; public HTTPS location serving that directory. |

Configure the sender mailbox/domain through your hosting mail panel, including its supplied SPF/DKIM settings. Keep the default PHP mail transport; no SMTP provider or API key is required by this implementation. Verification and password-reset links expire after 30 minutes and are single-use. Link tokens use URL fragments so they are not sent in page requests.

Set a hosting cron job to run every minute, using the same configuration as the web process and the absolute PHP/site paths your host provides:

```cron
* * * * * cd /absolute/path/to/backend && /absolute/path/to/php api/partner-tools.php mail
```

This drains up to 50 queued messages per run, retries failed sends after five minutes and recovers stalled jobs. Interactive requests also attempt a small batch. A `sent` outbox state means PHP mail accepted the message, not guaranteed inbox delivery. Sent message bodies are cleared; verify arrival in a real mailbox on hosting before opening registration. An invalid sender or a missing hosting mail setup leaves messages queued for retry rather than discarding the account operation.

`PARTNER_MAIL_TRANSPORT=file`, `PARTNER_MAIL_DIRECTORY` and `PARTNER_DSN` are isolation settings for development/tests. Do not carry local SQLite or file-inbox settings into production. Keep any test inbox outside publicly served directories. Ensure uploads are served as images and cannot execute scripts. Upload validation rejects SVG and accepts actual PNG/JPEG/WebP files up to 2 MB and 4096 pixels per side.

## Build and open the frontend

Set these public build values in the Cloudflare/build environment after the backend is ready:

```dotenv
NEXT_PUBLIC_PARTNERS_ENABLED=true
NEXT_PUBLIC_PARTNER_API_URL=https://api.couponpush.com/api
```

The second value is optional when the existing `NEXT_PUBLIC_API_URL` already points to this API. The public site and API must share the same site under HTTPS for the Lax session cookie, as `couponpush.com` and `api.couponpush.com` do. Host-only cookies isolate partner authentication from the admin session. Do not copy secrets into `NEXT_PUBLIC_` settings.

From `frontend-next`, build with a fresh catalog when publishing approvals:

```sh
npm run build
```

Deploy `frontend-next/out/` through the existing Cloudflare workflow, retaining the canonical redirect Worker and asset binding. This exports both new routes and enables header/footer links, the landing-page sitemap entry and impression tracking. The account route remains noindex. Without the flag, these public entry points and tracking are hidden and the landing page remains noindex. `npm run build:snapshot` is useful for reviewed local checks, but it does not fetch new approved stores.

## Review and publish a submission

1. Open **Brand Submissions** in the existing admin panel using an active admin account.
2. Review the website, private authorization information and complete store/offer details. Confirm authorization explicitly; email verification alone does not establish brand ownership.
3. Request changes or decline with useful feedback, or choose the offers to approve and give reasons for the remaining offers. Pick a unique final store slug. Existing redirect aliases and the editorial festival route are reserved; update the reserved list in `includes/partners.php` when adding such routes.
4. Approve. The transaction updates the live catalog and queues a website update. Brand-supplied offers are marked `merchant_advertised`, not checkout verified or automatically featured.
5. Refresh the catalog, build and deploy the frontend.
6. Use **Verify website update** on the admin submission. It checks the HTTPS canonical URL, status, canonical metadata and exact published partner revision. A failed check retains a retryable website-update state. A successful check adds the publication history event and queues the brand's publication email.

Withdrawing a published offer disables it in API results immediately and queues a separate static update. Rebuild and deploy, then verify, to remove it from previously exported pages. The workspace explains this distinction. It does not promise immediate removal from a static page.

## Tracking and operational limits

The dashboard shows cumulative offer views and existing coupon click counts, review feedback, active/expired/scheduled states and publication progress. Offer impressions use 50% visibility and are deduplicated per browser session, day and offer. Store views count store-page visits. Only managed catalog records are counted. Hashed event identifiers are stored; raw browser identifiers/IPs are not stored in these partner tables. These are engagement measures, not unique people, orders, revenue or redemption reports. Clicks can include opening coupon details.

Private account, authorization, draft and activity data are accessible only through the owning account API or admin review. The feature stores password hashes and token hashes, uses request limits, rejects unsafe destinations, and checks account ownership and draft revisions on every mutation. Rate-limit records and old expired tokens are pruned by the mail cron. Account removal is currently a manual support operation; no unimplemented self-service deletion or retention schedule is promised.

This release does not include payments, multiple stores per account, automatic ownership claims, sales attribution, automated frontend deployment or a separate account-suspension UI. Existing catalog moderation remains available to admins.

## Local verification

```sh
python -B api/tests/partners-integration.py
python -B frontend-next/scripts/test-catalog.py
cd frontend-next
npm run typecheck
npm run build:snapshot
```

The PHP tests default to XAMPP on Windows; set `PHP_BIN` to your PHP executable elsewhere. They create an isolated temporary database/server and use a private file inbox, never production mail or production catalog writes. The browser verification report and desktop/mobile captures are recorded in `output/partner-browser-check.json`, `output/partner-forms-check.json` and `.impeccable/review/partners/`.
