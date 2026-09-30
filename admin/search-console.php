<?php
/**
 * Read-only Search Console reporting for signed-in administrators.
 * OAuth access tokens stay in browser memory and are never sent to this server.
 */
$pageTitle = 'Search Console';
require_once 'includes/admin-header.php';
$googleClientId = trim((string) (getenv('GOOGLE_SEARCH_CONSOLE_CLIENT_ID') ?: ''));
?>

<div class="page-header">
    <h1 class="page-title">Search Console</h1>
    <p class="page-subtitle">Organic search performance for your verified Google properties.</p>
</div>

<?php if ($googleClientId === ''): ?>
<div class="alert alert-warning" role="alert">
    Set <code>GOOGLE_SEARCH_CONSOLE_CLIENT_ID</code> on the PHP server to enable this page.
    See <a href="<?php echo SITE_URL; ?>/admin/search-console.php#setup">setup instructions</a> below.
</div>
<?php else: ?>
<div id="gsc-app" data-client-id="<?php echo htmlspecialchars($googleClientId, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="card mb-4">
        <div class="card-body d-flex flex-wrap align-items-end gap-3">
            <div class="me-auto">
                <div class="fw-semibold mb-1">Google account</div>
                <div class="text-muted small">Connect an account with access to the Search Console property.</div>
            </div>
            <button id="gsc-connect" type="button" class="btn btn-primary" disabled>Connect Google</button>
            <button id="gsc-disconnect" type="button" class="btn btn-outline-secondary d-none">Disconnect</button>
        </div>
    </div>

    <div id="gsc-status" class="alert alert-info" role="status" aria-live="polite">Loading Google API libraries…</div>

    <div id="gsc-report" class="d-none">
        <div class="card mb-4">
            <div class="card-body d-flex flex-wrap gap-3 align-items-end">
                <div style="min-width: 260px; flex: 1">
                    <label class="form-label" for="gsc-property">Search Console property</label>
                    <select id="gsc-property" class="form-select"></select>
                </div>
                <div>
                    <label class="form-label" for="gsc-days">Reporting window</label>
                    <select id="gsc-days" class="form-select">
                        <option value="7">Last 7 complete days</option>
                        <option value="28" selected>Last 28 complete days</option>
                        <option value="90">Last 90 complete days</option>
                    </select>
                </div>
                <button id="gsc-refresh" type="button" class="btn btn-outline-primary">Refresh</button>
            </div>
        </div>

        <p id="gsc-dates" class="text-muted small mb-3"></p>
        <div class="row g-3 mb-4">
            <div class="col-md-3 col-6"><div class="card h-100"><div class="card-body"><div class="text-muted small">Clicks</div><div id="gsc-clicks" class="fs-3 fw-bold">—</div></div></div></div>
            <div class="col-md-3 col-6"><div class="card h-100"><div class="card-body"><div class="text-muted small">Impressions</div><div id="gsc-impressions" class="fs-3 fw-bold">—</div></div></div></div>
            <div class="col-md-3 col-6"><div class="card h-100"><div class="card-body"><div class="text-muted small">Average CTR</div><div id="gsc-ctr" class="fs-3 fw-bold">—</div></div></div></div>
            <div class="col-md-3 col-6"><div class="card h-100"><div class="card-body"><div class="text-muted small">Average position</div><div id="gsc-position" class="fs-3 fw-bold">—</div></div></div></div>
        </div>

        <div class="row g-4">
            <div class="col-xl-6"><div class="card h-100"><div class="card-header fw-semibold">Top queries</div><div class="table-responsive"><table class="table table-striped mb-0"><thead><tr><th>Query</th><th class="text-end">Clicks</th><th class="text-end">Impressions</th></tr></thead><tbody id="gsc-queries"></tbody></table></div></div></div>
            <div class="col-xl-6"><div class="card h-100"><div class="card-header fw-semibold">Top pages</div><div class="table-responsive"><table class="table table-striped mb-0"><thead><tr><th>Page</th><th class="text-end">Clicks</th><th class="text-end">Impressions</th></tr></thead><tbody id="gsc-pages"></tbody></table></div></div></div>
        </div>
        <p class="text-muted small mt-3">Google may omit some query and page rows. Totals come from a separate, ungrouped request.</p>
    </div>
</div>
<script src="https://apis.google.com/js/api.js" async defer></script>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="<?php echo ASSETS_URL; ?>js/search-console.js" defer></script>
<?php endif; ?>

<div id="setup" class="card mt-4">
    <div class="card-header fw-semibold">Setup</div>
    <div class="card-body">
        <ol class="mb-0">
            <li>Enable the Search Console API in your Google Cloud project.</li>
            <li>Configure the OAuth consent screen and create a <strong>Web application</strong> OAuth client.</li>
            <li>Add this admin page's origin to <strong>Authorized JavaScript origins</strong> (for production: <code>https://couponpush.com</code>).</li>
            <li>Set the PHP server environment variable <code>GOOGLE_SEARCH_CONSOLE_CLIENT_ID</code> to that client's ID, then reload this page.</li>
            <li>Connect a Google account that has access to your Search Console property.</li>
        </ol>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
