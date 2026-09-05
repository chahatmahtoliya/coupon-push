# Public API hotfix deployment

The frontend and the API use different document roots. A frontend Git deployment does not necessarily update `api.couponpush.com`.

Upload and extract the repository root's `api-public-hotfix.zip` in the existing
public API directory (the directory currently containing `stores.php`). The ZIP
contains only the public API files listed below and no database credentials.

If uploading files individually, preserve these names:

- `config.php`
- `stores.php`
- `store.php`
- `coupons.php`
- `coupon.php`
- `deals.php`
- `search.php`

Do not upload the repository's local database credentials or overwrite the production root `config/database.php`.

After upload, verify:

1. `/api/stores.php?limit=1` returns JSON with HTTP 200.
2. `/api/coupons.php?latest=1&limit=1` returns JSON with HTTP 200.
3. `/api/store.php?slug=<new-store-slug>` returns that store and its coupons.
4. `/stores/` displays active bulk-uploaded stores after reload.

If an endpoint still fails, the new `Throwable` handlers write the real cause to the PHP error log and return a JSON error instead of an empty body.
