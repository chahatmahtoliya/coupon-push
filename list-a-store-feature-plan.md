# List a Store: implementation plan

Date: 30 September 2026
Project: CouponPush
Status: Proposed plan; feature implementation has not started.

## 1. Goal

Add a **List a Store** action to the homepage header. A store representative signs up, verifies their email, creates a store listing, adds coupons and destination links, and submits everything for your review. You approve the submission in the existing admin panel before it becomes public.

The complete flow:

**Homepage > List a Store > Sign up / Sign in > Verify email > Store details > Coupons and links > Preview > Submit for review > Admin approval > Public store listing**

Returning merchants get a dashboard to track submissions, respond to feedback, and propose changes to approved stores.

## 2. Recommended decisions for the first release

These are planning assumptions, so implementation can begin with a clear scope:

- Listing is free. Payments and subscriptions are outside this release.
- Applicants must own the store or be authorized to represent it.
- Email verification confirms access to the applicant's mailbox. Store ownership or authorization is checked separately during admin review.
- One store per merchant account initially. Structure ownership records so multiple stores can be supported later.
- Require at least one coupon or deal when submitting a new store. A deal can use a destination link without a coupon code.
- Every new store, coupon, and proposed change requires admin approval.
- Only your admin role can approve, reject, publish, or suspend merchant listings. Existing editor accounts do not automatically receive approval powers.
- Approval adds the store to the regular directory and applicable coupon/category results. Homepage featured placement remains an admin choice.
- Provide a status tracker without promising a review deadline until you choose one.

## 3. What already exists in this repository

| Area | Current implementation | Consequence for this feature |
| --- | --- | --- |
| Header | `frontend-next/src/components/layout/Header.tsx` has desktop navigation and a mobile drawer | Add the entry point in both layouts using the existing styling and keyboard behavior |
| Frontend | `frontend-next/next.config.ts` sets `output: 'export'` | Account pages need static page shells backed by authenticated PHP APIs; authentication cannot depend on a Next.js server |
| Accounts | `database/schema.sql` defines `users` for admins/editors; `admin/login.php` sets `admin_id` | Introduce separate merchant accounts and sessions; never register applicants into the existing admin account flow |
| Catalog | `stores` and `coupons` already contain store information, URLs, coupon fields, and active flags | Reuse these tables for approved public content |
| Admin | `admin/stores.php` and `admin/coupons.php` manage catalog records | Add a submission queue and review detail page alongside them |
| Public API | PHP endpoints under `api/` serve stores, coupons, and search | Pending submissions must never enter these responses |
| API access | `api/config.php` currently permits wildcard CORS | Merchant session endpoints need a separate configuration with explicit trusted origins and credential support |
| Public routing | `frontend-next/src/lib/routes.ts` sends new stores to `/stores/view/?slug=...` until a build includes them | Reuse this working live-store route immediately after approval |
| Publication | `frontend-next/scripts/prepare-catalog.mjs` refreshes the snapshot used to export store pages | A successful rebuild and deployment is needed for the canonical `/store/{slug}/` page and updated static discovery pages |
| Hosting | `api/API-DEPLOY.md` describes separate frontend and API document roots | Backend deployment and frontend deployment must be tracked separately |

Repository inspection supports these findings; the live database schema, hosting access, email service, and deployment automation still need confirmation during implementation. The base SQL schema is not a complete description of all later catalog fields.

## 4. Merchant experience

### Homepage entry

- Add **List a Store** as a clearly visible header action on desktop and an easy-to-find mobile navigation action.
- Link to `/list-a-store/`, with a short explanation of the process and **Create account** / **Sign in** actions.
- Explain that submissions are reviewed before publication.
- Signed-in applicants continue at their current onboarding step or merchant dashboard.
- Preserve the intended destination through login using only validated internal return paths.

### Signup and verification

Collect contact name, email, password, and acceptance of submission terms. Store the password using PHP password hashing and record the terms version and acceptance time.

Send a single-use email verification link. Recommended initial settings: a 30-minute expiry, a 60-second resend cooldown, and rate limits per account and IP. Resending invalidates previous links. Store only token hashes and consume tokens atomically.

Show clear states for verification sent, expired link, already verified, resend success, and temporary delivery failure. Unverified applicants cannot submit listings or upload ownership evidence. Support sign in, sign out, and password reset from the first release.

### Store details

| Field | Requirement |
| --- | --- |
| Store name | Required; admin confirms the final name and slug |
| Official website | Required; normalized domain is checked for existing listings and submissions |
| Category | Required; choose from existing active categories |
| Short description | Required; plain text with a defined length limit |
| About the store | Required; useful original copy describing the store and products |
| Store logo | Optional initially; use the existing placeholder if omitted |
| Contact name and email | Required; private to the merchant and admin |
| Applicant relationship | Owner, employee, or authorized agency |
| Authorization evidence | Required before approval; collect business email and/or a private supporting document or explanation |

Show a duplicate warning if the store already exists. Do not assign an existing store to someone just because their email or website matches. Route existing-store requests to manual ownership review; a full automated claim flow can come later.

Email verification alone must not produce an ownership badge. For a business-domain email, the admin checks that the domain matches the official store. For agencies or personal email addresses, the admin checks supporting authorization and can request more information. Avoid collecting identity documents unless a concrete need emerges.

### Coupons and links

Allow merchants to add, edit, and remove multiple draft offers. Each offer includes:

- Title, description, and offer type: coupon code, deal, or offer.
- Code when the type requires one.
- Discount type and value, with optional minimum spend and maximum discount.
- Destination URL, start date, expiry date or explicit ongoing status, and terms.
- Optional public source URL supporting the offer.

Use the existing catalog fields and normalization rules; confirm the mapping between database discount values such as `flat` and frontend values such as `fixed`.

Require valid date order, sensible discount values, and an HTTP(S) destination. Flag destinations outside the store's domain for review. Merchants submit their store or offer link; admin-controlled affiliate tracking can be added during review. Do not let applicants set featured placement, ratings, verified badges, or affiliate overrides.

Store approval is separate from checkout testing. Preserve the existing evidence semantics in `frontend-next/src/lib/offer-evidence.ts`; do not mark every approved coupon as checkout-tested.

### Preview and submit

Show a preview of the listing and offers, a completeness checklist, and a declaration that the applicant has permission to list the store. Save drafts so users can resume later.

On submission, freeze the submitted version and show **Pending review** with a reference number and submission date. Block duplicate submissions. The merchant can withdraw a pending submission to revise it; the withdrawn version can no longer be approved.

### Merchant dashboard

Display store status, review feedback, offer statuses, submission history, and the public link when available. Provide actions to continue a draft, make requested changes, add offers, and submit edits.

If an approved merchant changes a listing or adds a coupon, create a new draft revision. The previously approved version stays public until the revision is approved. Only one open revision per store is allowed initially. Admin suspension blocks further submissions until resolved.

## 5. Admin review

Add **Store submissions** to the admin navigation, with a pending count. The queue supports status/date filters and search by store, domain, and applicant.

The detail page shows applicant information, verification status, authorization evidence, store preview, all offers, destination URLs, duplicate warnings, and review history. For edits, show the current public values beside the proposed changes.

Admin actions:

1. **Approve and publish:** confirm authorization, choose the final slug/category, review offers, and approve the exact submitted version.
2. **Request changes:** require a merchant-visible explanation; return the submission for editing and resubmission.
3. **Reject:** require a reason and retain the review history. A rejected submission is closed; a future application starts a new revision.
4. **Suspend / unpublish:** hide an approved listing and its offers, record the reason, and notify the merchant. Reinstatement requires admin review.

The initial submission can be approved with a selected subset of valid offers, provided at least one offer is approved. Every omitted offer needs an explicit rejected/changes-requested decision and reason. Later coupon submissions are reviewed individually or as an explicitly selected batch.

Use one database transaction to lock the submitted revision, validate its state/version, insert or update the approved store and approved coupons, record ownership and decisions, and enqueue notification/publication work. Repeated clicks or retried requests must not create duplicate stores or coupons. Do not send email or run a frontend build inside the transaction.

## 6. Status model

Keep account, review, and publication states separate:

| Record | States |
| --- | --- |
| Merchant account | `unverified`, `active`, `suspended` |
| Submission/revision | `draft`, `pending_review`, `changes_requested`, `approved`, `rejected`, `withdrawn` |
| Store visibility | Existing active/inactive status, controlled by admin publication or suspension |
| Publication job | `queued`, `running`, `succeeded`, `failed` |

Normal review path: `draft > pending_review > approved`.

Correction path: `pending_review > changes_requested > draft > pending_review`. Every resubmission creates an immutable version that the admin reviews explicitly.

Merchant-facing publication labels should distinguish **Approved — available in the store directory**, **Site update in progress**, and **Published**. A failed export must not be reported as a completed site update.

## 7. Data and API design

### Proposed tables

| Table | Purpose and key fields |
| --- | --- |
| `merchant_accounts` | Name, unique normalized email, password hash, verification time, status, terms acceptance, timestamps |
| `merchant_auth_tokens` | Account, purpose, token hash, expiry, consumed time; verification and password reset |
| `merchant_sessions` | Revocable sessions with hashed identifier, account, expiry, last activity |
| `merchant_store_ownership` | Merchant/store association, authorization status, reviewed-by admin and review time |
| `store_submissions` | Applicant, optional existing store ID, normalized domain, revision/version, proposed fields, review status, timestamps |
| `coupon_submissions` | Parent submission, optional existing coupon ID, proposed offer fields, individual decision and reason |
| `merchant_uploads` | Owner, storage key, content type, purpose, private/public classification, scan/review status |
| `submission_reviews` | Submission/version, admin, action, merchant-visible feedback, private notes, timestamp |
| `publication_jobs` | Approved revision/catalog version, attempts, state, deploy identifier, error, completion time |
| `notification_outbox` | Event, recipient, template, delivery state, retry count, deduplication key |

Keep pending data out of the public `stores` and `coupons` tables. Promote only approved fields into the existing catalog. Add foreign keys, ownership indexes, and uniqueness constraints for promotion mappings and open revisions. Resolve domain duplicates during review without assuming one domain always equals one independent store, especially for hosted storefronts.

Use an additive migration rather than rerunning the sample-data schema. Existing admin-managed stores remain usable without a merchant owner.

### Proposed route groups

- Frontend: `/list-a-store/`, `/merchant/signup/`, `/merchant/login/`, `/merchant/verify-email/`, `/merchant/forgot-password/`, `/merchant/reset-password/`, `/merchant/dashboard/`, and `/merchant/store/edit/?submission=...`.
- Authentication APIs: `/api/merchant/auth/` actions for register, verify, resend, login, logout, session, and password reset.
- Merchant APIs: `/api/merchant/` actions for draft create/read/update, upload, submit, withdraw, review history, and offer management.
- Admin pages: `admin/store-submissions.php` and `admin/store-submission.php?id=...`, with authenticated POST handlers for decisions.

These are logical routes; implement PHP filenames/routing to suit the deployed host. Keep merchant editor routes as fixed static shells with query parameters rather than exporting a route for every private submission.

Use a dedicated `merchant-api.ts` client. Private requests must not use the public catalog's snapshot or fallback mechanisms. Private responses use `Cache-Control: no-store`, and account pages are excluded from indexing and sitemaps. Backend authorization protects every private resource; frontend route guards provide navigation convenience only.

### Access and input controls

- Use separate merchant and admin session cookies. Merchant cookies are host-only, Secure, and HttpOnly; verify cookie behavior between the frontend and API hosts in staging.
- Allow credentials only for explicit trusted frontend origins. Validate CSRF tokens and request origins on state-changing requests, including admin review actions.
- Check account status, email verification, record ownership, and allowed state transitions on the server for every action. Check the explicit admin role for moderation.
- Use prepared queries and allowlisted editable fields. Treat applicant text as plain text or sanitize supported formatting before display, including admin previews.
- Rate-limit signup, login, reset, verification, submissions, and uploads. Return generic account-recovery responses.
- Validate uploaded image types from their contents, enforce dimensions/size limits, rename files, and prevent executable uploads. Store evidence outside public upload directories and authorize every download.
- Keep tokens, passwords, private evidence, and session identifiers out of logs and public JSON. Define evidence retention and cleanup before launch.
- Review outbound links manually in the first release. If automated URL fetching is introduced, block private/internal network destinations and unsafe redirects.

## 8. Getting approved stores live

Approval and static publication need an explicit connection in this project:

1. Admin approval commits the selected store and offers into the public catalog.
2. Public API responses and the refreshed store directory can show the approved content immediately. Use the existing `/stores/view/?slug=...` route for new stores until their canonical pages exist.
3. Enqueue a rebuild/deployment job. Batch nearby approvals and serialize deployments to prevent an older build replacing a newer catalog.
4. Refresh the catalog snapshot, build the static frontend, run existing validation, and deploy to the actual frontend host through a server-controlled worker or deployment integration.
5. Verify the store URL, offers, logo, internal links, and eligible sitemap entries on the deployed release. Mark the matching publication version succeeded only after verification.
6. Send the published notification with the canonical store link. On failure, show the error and retry action to admin; retain the approval and working live-store link.

Check catalog completeness before automating this: `stores.php` defaults to 100 results and currently caps the limit at 500, while `prepare-catalog.mjs` calls it without a limit. Add pagination or a dedicated authenticated full-catalog export so growth does not silently omit approved stores.

New coupon detail URLs also depend on export. Before the build completes, coupon actions should work through the live store and existing modal; avoid linking to a new `/coupon/{id}/` page that does not exist yet.

Honor existing indexability rules in `frontend-next/src/lib/indexability.ts`. Approval permits public visibility; sitemap inclusion depends on the site's content checks. Keep the temporary live-store route noindex.

Suspension must invalidate more than API results: remove the store and offers from snapshots, static HTML, search results, and caches. Provide an immediate host-level block for suspended store/coupon URLs while removal is deploying. Do not let stale catalog fallbacks restore suspended content. Restoring a previous frontend deployment must also respect the current suspension list.

## 9. Notifications

Send queued, retryable emails for verification, password reset, submission receipt, requested changes, rejection, approval, and completed publication. Notify admin when a submission becomes pending; the admin queue remains the source of truth if email delivery fails.

Keep approval and publication emails distinct. Emails should link to the merchant dashboard for private feedback and evidence. Deduplicate notifications by event and revision.

## 10. Implementation sequence

| Phase | Deliverable | Completion check |
| --- | --- | --- |
| 1. Confirm integration | Compare live schema with migrations; choose email transport, private storage, session configuration, and deployment trigger | Staging can deliver email and demonstrate frontend/API cookie handling |
| 2. Accounts | Merchant tables, auth APIs, signup/login/reset/verification screens | Unverified and suspended accounts cannot submit; merchant sessions cannot access admin |
| 3. Listing drafts | Homepage action, store editor, logo/evidence uploads, offer editor, preview, dashboard | Verified applicant can save, resume, validate, and submit a complete listing |
| 4. Review | Admin queue/detail pages, role checks, decisions, revision history, transactional promotion | You can approve a submission once, request changes, or reject it with feedback |
| 5. Publication | Full catalog export, queued build/deploy, live URL checks, retries, suspension handling | A new approved store reaches both the live directory and its exported page |
| 6. Launch | End-to-end checks, notification retries, operational notes, feature flag rollout | Complete merchant-to-admin-to-public flow succeeds in staging |

Deploy additive database changes and backend services first, then the frontend screens. Keep the homepage action behind a feature flag until the full flow is ready. Start with a small number of manually reviewed applicants. Disable new submissions through the flag if needed while keeping existing approved listings available.

## 11. Acceptance checks

- The homepage action works on desktop and mobile and preserves keyboard navigation.
- Signup, verification expiry/resend, password reset, logout, and interrupted onboarding behave correctly.
- A merchant cannot read or modify another merchant's drafts, uploads, reviews, or stores by changing IDs.
- Merchant credentials and ordinary editor accounts cannot approve submissions.
- Drafts, rejected submissions, and private evidence never appear in public APIs, search, generated pages, snapshots, or sitemaps.
- Duplicate domains/slugs, repeated submissions, double approval, stale review tabs, and transaction failures are handled safely.
- Admin can request changes, review a new version, approve a subset of valid offers, and reject the remaining offers with reasons.
- A later merchant edit does not change the public version before approval.
- Coupon dates, code requirements, URL validation, upload restrictions, CSRF checks, and HTML handling are verified.
- A store absent from the old snapshot works through the live-store route after approval and gains a working canonical URL after deployment.
- Export includes stores beyond the first 100; new coupon actions never lead to missing static pages.
- Email or deployment failures preserve the review decision and can be retried without duplicates.
- Suspension hides catalog content and blocks existing public pages even during a failed or delayed rebuild.
- Existing admin-created stores, imports, store pages, coupon actions, and navigation continue to work.

During implementation, run relevant PHP syntax checks, focused auth/moderation integration tests, frontend type checking, the existing build/SEO checks, and an end-to-end staging walkthrough. Read `frontend-next/AGENTS.md` and the installed Next.js documentation before writing frontend code.

## 12. Later additions

After the first release: multiple stores per account, automated domain verification, a formal existing-store claim process, merchant team access, bulk coupon imports, performance reporting, and optional paid placements. These should not delay the initial signup, verification, submission, approval, and publication flow.
