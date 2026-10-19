# Store logo update

The frontend release preserves store logo URLs served by the PHP backend, including catalog snapshots used to generate static pages.

Upload these three files from this release to the existing PHP document root for `api.couponpush.com`, preserving their paths:

- `admin/stores.php`
- `includes/functions.php`
- `api/config.php`

No database migration or configuration replacement is needed for this logo update. Keep the production `config/database.php` and `config/constants.php`.

The admin form now reports upload and directory errors before saving, keeps the existing logo on failure, and removes a new upload if saving its database reference fails. PNG, JPEG, GIF and WebP images are accepted; filenames use an extension derived from the image content. The 5 MB application limit also remains subject to the server's PHP upload limits.

The backend chooses its own host for files present in `uploads/stores/` and retains the media host for historical logos stored there. External brand URLs remain usable.

After uploading, replace a store logo in the admin panel and confirm the preview and API logo URL. Saving without a replacement should keep the existing logo. Invalid or oversized uploads should display an error without saving the store.

Static HTML uses the catalog captured for its last frontend build. Later catalog changes need a catalog refresh and frontend rebuild to update that HTML.

Validation:

```powershell
py api/tests/store-logo-integration.py
cd frontend-next
node --test scripts/test-store-logo-urls.cjs
npm run typecheck
```
