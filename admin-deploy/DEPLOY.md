# CouponPush admin deployment

This package is intended to be merged into the document root for
`api.couponpush.com`. Do not upload the outer `admin-deploy` directory itself;
upload its contents so that `admin/login.php` is directly under the subdomain
document root.

## Configure

1. Copy `config/database.local.example.php` to `config/database.local.php`.
2. Enter the existing production database credentials in
   `config/database.local.php` on the server. Never commit that file.
3. Confirm the database contains the CouponPush tables and an active row in
   `users`. Do not import `database/schema.sql` over the production database.
4. Keep the `uploads` directory and its child directories writable by PHP.
   On shared hosting, directory permission `0755` is the preferred starting
   point; only increase it if the host requires it.

## Upload

Merge these package contents into the `api.couponpush.com` document root:

```text
admin/
assets/
config/
includes/
uploads/
```

Do not delete or overwrite the existing API endpoints or existing uploaded
images. Keep any existing root `.htaccess` file; this package uses scoped
protection files inside `config`, `includes`, and `uploads`.

## Verify

1. Visit `https://api.couponpush.com/admin/login.php`.
2. Sign in with an active database admin username or email.
3. Confirm Dashboard, Coupons, Bulk Import, Stores, Categories, Deals, and Settings load.
4. Upload one test image and confirm it can be opened from the returned URL.
5. Log out and confirm the dashboard redirects back to the login page.

After deployment, remove the example credential file if your hosting workflow
does not need it.
