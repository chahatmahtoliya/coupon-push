# Resend configuration

The root npm project has the official `resend` Node.js SDK installed. Store
`RESEND_API_KEY` and `RESEND_FROM` in the root `.env.local` for local Node commands.
This file is ignored by Git. `.env.example` documents the variable names without
a secret. Use a sender on the domain verified in your Resend account.

Run this read-only authentication and sending-DNS check from the repository root
with Node.js 20.12+:

```sh
npm run resend:check
```

The checker distinguishes verified outgoing DKIM/SPF records from receiving MX
records. It does not send messages, change DNS, or configure production hosting.
A sending-only API key may lack permission to read domains.

The partner API and its email queue run on PHP. The queue now uses the Resend
HTTPS transport in `includes/partner-mail.php` when `PARTNER_MAIL_TRANSPORT=resend`
or when a key is configured and no transport is specified. It reads mail-only
values from the backend root's private `.env.local`, while preserving existing
process variables. Set `PARTNER_MAIL_ENV_FILE` to use a private file outside the
document root. The frontend exports static pages; do not put the API key in
browser code or any `NEXT_PUBLIC_` variable.

The connected transport covers verification, password reset, review and
publication notifications. Failed sends stay in the queue. Retries use the same
idempotency key, which Resend retains for 24 hours.

Run the isolated queue and transport checks with PHP:

```sh
php api/tests/partner-mail.php
```

To send a live delivery simulation to Resend's official test recipient:

```sh
php scripts/test-resend.php
```

Upload `includes/partners.php` and `includes/partner-mail.php` to the existing PHP
host, preserve its database configuration, and supply the private mail variables
to both PHP and cron. Upload `scripts/test-resend.php` only if a hosting smoke
check is needed. See `api/PARTNERS-DEPLOY.md` for the migration and cron commands.
Local code changes and a local simulation do not deploy the backend.

Configure the production key privately on the PHP host. Replace any key shared
in chat before production use.
