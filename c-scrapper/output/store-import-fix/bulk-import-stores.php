<?php

/**
 * Admin - Bulk store CSV import (logos are uploaded later from Manage Stores)
 */

$pageTitle = 'Bulk Import Stores';
require_once 'includes/admin-header.php';

const STORE_IMPORT_MAX_BYTES = 2097152;
const STORE_IMPORT_MAX_ROWS = 200;
const STORE_IMPORT_COLUMNS = [
    'name', 'slug', 'website_url', 'affiliate_url', 'category',
    'short_description', 'description', 'h1_suffix', 'meta_title',
    'meta_description', 'about_content', 'howto_content', 'terms_content',
    'rating', 'is_featured', 'is_popular', 'status'
];

function storeImportUrlIsValid($value)
{
    if ($value === '') return true;
    if (!filter_var($value, FILTER_VALIDATE_URL)) return false;
    $scheme = strtolower(parse_url($value, PHP_URL_SCHEME) ?: '');
    return in_array($scheme, ['http', 'https'], true);
}

function storeImportBooleanIsValid($value)
{
    return in_array(strtolower(trim((string) $value)), ['0', '1', 'true', 'false', 'yes', 'no'], true);
}

function storeImportBooleanValue($value)
{
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes'], true) ? 1 : 0;
}

function readStoreImportCsv($filePath)
{
    $handle = fopen($filePath, 'rb');
    if (!$handle) return ['rows' => [], 'errors' => ['The uploaded CSV could not be opened.']];

    $header = fgetcsv($handle, 0, ',', '"', '\\');
    if (!$header) {
        fclose($handle);
        return ['rows' => [], 'errors' => ['The CSV is empty.']];
    }

    $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header[0]);
    $header = array_map(function ($column) {
        return strtolower(trim((string) $column));
    }, $header);

    if ($header !== STORE_IMPORT_COLUMNS) {
        fclose($handle);
        return ['rows' => [], 'errors' => ['The CSV columns do not match the store template. Download the current template and keep its header unchanged.']];
    }

    $rows = [];
    $errors = [];
    $lineNumber = 1;
    while (($values = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        $lineNumber++;
        if (count(array_filter($values, function ($value) { return trim((string) $value) !== ''; })) === 0) continue;
        if (count($values) !== count(STORE_IMPORT_COLUMNS)) {
            $errors[] = "Row {$lineNumber}: expected " . count(STORE_IMPORT_COLUMNS) . ' columns, found ' . count($values) . '.';
            continue;
        }
        $row = array_combine(STORE_IMPORT_COLUMNS, $values);
        $row = array_map(function ($value) { return trim((string) $value); }, $row);
        $row['_line'] = $lineNumber;
        $rows[] = $row;
        if (count($rows) > STORE_IMPORT_MAX_ROWS) {
            $errors[] = 'The CSV contains more than ' . STORE_IMPORT_MAX_ROWS . ' data rows. Split it into smaller files.';
            break;
        }
    }
    fclose($handle);

    if (!$rows && !$errors) $errors[] = 'The CSV does not contain any store rows.';
    return ['rows' => $rows, 'errors' => $errors];
}

function validateStoreImportRows($rows)
{
    $errors = [];
    $seenSlugs = [];

    foreach ($rows as $row) {
        $line = $row['_line'];
        $slug = createSlug($row['slug'] !== '' ? $row['slug'] : $row['name']);

        if ($row['name'] === '') $errors[] = "Row {$line}: name is required.";
        if (strlen($row['name']) > 100) $errors[] = "Row {$line}: name must be 100 characters or fewer.";
        if ($slug === '') $errors[] = "Row {$line}: name or slug must contain letters or numbers that can form a URL slug.";
        if (strlen($slug) > 100) $errors[] = "Row {$line}: slug must be 100 characters or fewer.";
        if ($slug !== '' && isset($seenSlugs[$slug])) $errors[] = "Rows {$seenSlugs[$slug]} and {$line}: duplicate slug {$slug}.";
        if ($slug !== '') $seenSlugs[$slug] = $line;

        if ($row['website_url'] === '') $errors[] = "Row {$line}: website_url is required.";
        elseif (!storeImportUrlIsValid($row['website_url'])) $errors[] = "Row {$line}: website_url must be a valid http or https URL.";
        if (!storeImportUrlIsValid($row['affiliate_url'])) $errors[] = "Row {$line}: affiliate_url must be a valid http or https URL.";
        if (strlen($row['website_url']) > 255) $errors[] = "Row {$line}: website_url must be 255 characters or fewer.";
        if (strlen($row['affiliate_url']) > 500) $errors[] = "Row {$line}: affiliate_url must be 500 characters or fewer.";

        if ($row['category'] === '') $errors[] = "Row {$line}: category is required.";
        if (strlen($row['category']) > 100) $errors[] = "Row {$line}: category must be 100 characters or fewer.";

        foreach ([
            'short_description' => 255,
            'h1_suffix' => 150,
            'meta_title' => 255,
            'meta_description' => 320
        ] as $field => $maximum) {
            if ($row[$field] === '') $errors[] = "Row {$line}: {$field} is required for a complete SEO store page.";
            if (strlen($row[$field]) > $maximum) $errors[] = "Row {$line}: {$field} must be {$maximum} characters or fewer.";
        }

        foreach (['description', 'about_content', 'howto_content', 'terms_content'] as $field) {
            if ($row[$field] === '') $errors[] = "Row {$line}: {$field} is required for a complete SEO store page.";
        }

        if (!is_numeric($row['rating']) || (float) $row['rating'] < 1 || (float) $row['rating'] > 5) {
            $errors[] = "Row {$line}: rating must be a number from 1 to 5.";
        }
        foreach (['is_featured', 'is_popular', 'status'] as $field) {
            if (!storeImportBooleanIsValid($row[$field])) $errors[] = "Row {$line}: {$field} must be 0/1, true/false, or yes/no.";
        }
    }

    return $errors;
}

$importResult = null;
$importErrors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
        $importErrors[] = 'Your session token expired. Refresh the page and try again.';
    }

    $csvUpload = $_FILES['store_csv'] ?? null;
    if (!$csvUpload || ($csvUpload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $importErrors[] = 'Choose a store CSV file to upload.';
    } elseif (($csvUpload['size'] ?? 0) > STORE_IMPORT_MAX_BYTES) {
        $importErrors[] = 'The CSV is larger than the 2 MB upload limit.';
    } elseif (strtolower(pathinfo($csvUpload['name'] ?? '', PATHINFO_EXTENSION)) !== 'csv') {
        $importErrors[] = 'Only .csv files are accepted for the store data.';
    } elseif (!is_uploaded_file($csvUpload['tmp_name'])) {
        $importErrors[] = 'The uploaded CSV could not be verified.';
    }

    $rows = [];
    if (!$importErrors) {
        $parsed = readStoreImportCsv($csvUpload['tmp_name']);
        $rows = $parsed['rows'];
        $importErrors = array_merge($importErrors, $parsed['errors'], validateStoreImportRows($rows));
    }

    $mode = ($_POST['import_mode'] ?? 'import') === 'validate' ? 'validate' : 'import';
    $duplicateMode = ($_POST['duplicate_mode'] ?? 'update') === 'skip' ? 'skip' : 'update';

    if (!$importErrors && $mode === 'validate') {
        $importResult = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'categories' => 0];
    } elseif (!$importErrors) {
        $pdo = db()->getConnection();
        $counts = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'categories' => 0];
        $categoryCache = [];

        try {
            $pdo->beginTransaction();
            $findStore = $pdo->prepare('SELECT id FROM stores WHERE slug = ? LIMIT 1');
            $findCategory = $pdo->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
            $insertCategory = $pdo->prepare('INSERT INTO categories (name, slug, description, status) VALUES (?, ?, NULL, 1)');
            $insertStore = $pdo->prepare('INSERT INTO stores (name, slug, logo, website_url, affiliate_url, short_description, description, about_content, howto_content, terms_content, category_id, h1_suffix, meta_title, meta_description, rating, is_featured, is_popular, status) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $updateStore = $pdo->prepare('UPDATE stores SET name = ?, website_url = ?, affiliate_url = ?, short_description = ?, description = ?, about_content = ?, howto_content = ?, terms_content = ?, category_id = ?, h1_suffix = ?, meta_title = ?, meta_description = ?, rating = ?, is_featured = ?, is_popular = ?, status = ? WHERE id = ?');

            foreach ($rows as $row) {
                $slug = createSlug($row['slug'] !== '' ? $row['slug'] : $row['name']);
                $findStore->execute([$slug]);
                $existingId = $findStore->fetchColumn();

                if ($existingId && $duplicateMode === 'skip') {
                    $counts['skipped']++;
                    continue;
                }

                $categorySlug = createSlug($row['category']);
                if (!array_key_exists($categorySlug, $categoryCache)) {
                    $findCategory->execute([$categorySlug]);
                    $categoryId = $findCategory->fetchColumn();
                    if (!$categoryId) {
                        $insertCategory->execute([$row['category'], $categorySlug]);
                        $categoryId = (int) $pdo->lastInsertId();
                        $counts['categories']++;
                    }
                    $categoryCache[$categorySlug] = (int) $categoryId;
                }
                $categoryId = $categoryCache[$categorySlug];

                $values = [
                    $row['website_url'], $row['affiliate_url'] ?: null,
                    $row['short_description'], $row['description'], $row['about_content'],
                    $row['howto_content'], $row['terms_content'], $categoryId, $row['h1_suffix'],
                    $row['meta_title'], $row['meta_description'], (float) $row['rating'],
                    storeImportBooleanValue($row['is_featured']), storeImportBooleanValue($row['is_popular']),
                    storeImportBooleanValue($row['status'])
                ];

                if ($existingId) {
                    $updateStore->execute(array_merge([$row['name']], $values, [(int) $existingId]));
                    $counts['updated']++;
                } else {
                    $insertStore->execute(array_merge([$row['name'], $slug], $values));
                    $counts['inserted']++;
                }
            }

            $pdo->commit();
            $importResult = $counts;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('Store bulk import failed: ' . $error->getMessage());
            $importErrors[] = 'Nothing was imported. ' . $error->getMessage();
        }
    }
}
?>

<div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
    <div>
        <h1 class="page-title">Bulk Import Stores</h1>
        <p class="page-subtitle">Create or update up to <?php echo number_format(STORE_IMPORT_MAX_ROWS); ?> SEO-complete store pages. Logos can be uploaded later from Manage Stores.</p>
    </div>
    <div class="d-flex flex-wrap gap-2">
        <a href="templates/store-import-template.csv" class="btn btn-outline-primary" download>
            <i class="fas fa-download me-2"></i> Download Store Template
        </a>
        <a href="stores.php" class="btn btn-outline-secondary">Back to Stores</a>
    </div>
</div>

<?php if ($importErrors): ?>
    <div class="alert alert-danger" role="alert">
        <strong>The stores were not imported.</strong>
        <ul class="mb-0 mt-2">
            <?php foreach (array_slice($importErrors, 0, 25) as $error): ?>
                <li><?php echo sanitize($error); ?></li>
            <?php endforeach; ?>
        </ul>
        <?php if (count($importErrors) > 25): ?><p class="mb-0 mt-2">Fix the first 25 errors, then validate the file again.</p><?php endif; ?>
    </div>
<?php endif; ?>

<?php if ($importResult): ?>
    <div class="alert alert-success" role="status">
        <?php if ($importResult['inserted'] === 0 && $importResult['updated'] === 0 && $importResult['skipped'] === 0): ?>
            <strong>Validation passed.</strong> <?php echo number_format($importResult['validated']); ?> stores are ready to import.
        <?php else: ?>
            <strong>Store import complete.</strong>
            <?php echo number_format($importResult['inserted']); ?> inserted,
            <?php echo number_format($importResult['updated']); ?> updated,
            <?php echo number_format($importResult['skipped']); ?> duplicates skipped.
            <?php if ($importResult['categories']): ?>Created <?php echo number_format($importResult['categories']); ?> categories.<?php endif; ?>
        <?php endif; ?>
    </div>
<?php endif; ?>

<div class="row g-4">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-body p-4">
                <form method="post" enctype="multipart/form-data">
                    <?php echo csrfField(); ?>
                    <div class="mb-4">
                        <label for="store_csv" class="form-label fw-semibold">Store CSV</label>
                        <input class="form-control" type="file" id="store_csv" name="store_csv" accept=".csv,text/csv" required>
                        <div class="form-text">Use the downloaded template. Keep its header unchanged and save the completed sheet as CSV UTF-8.</div>
                    </div>

                    <div class="mb-4">
                        <label for="duplicate_mode" class="form-label fw-semibold">When a matching store slug already exists</label>
                        <select class="form-select" id="duplicate_mode" name="duplicate_mode">
                            <option value="update" <?php echo ($_POST['duplicate_mode'] ?? 'update') === 'update' ? 'selected' : ''; ?>>Update its content (recommended)</option>
                            <option value="skip" <?php echo ($_POST['duplicate_mode'] ?? '') === 'skip' ? 'selected' : ''; ?>>Skip it</option>
                        </select>
                    </div>

                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-primary" type="submit" name="import_mode" value="import"><i class="fas fa-file-import me-2"></i> Import Stores</button>
                        <button class="btn btn-outline-primary" type="submit" name="import_mode" value="validate"><i class="fas fa-check-circle me-2"></i> Validate Only</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card mb-4">
            <div class="card-body p-4">
                <h2 class="h5">Logo workflow</h2>
                <ol class="text-secondary ps-3 mb-0">
                    <li class="mb-2">Import stores first; no logo column is needed in the CSV.</li>
                    <li class="mb-2">Open Manage Stores and edit a store to upload its logo.</li>
                    <li>Updating a store here never changes its existing logo.</li>
                </ol>
            </div>
        </div>
        <div class="card">
            <div class="card-body p-4">
                <h2 class="h5">SEO content rules</h2>
                <ul class="text-secondary ps-3 mb-0">
                    <li class="mb-2">Write unique descriptions for each brand and its real shopping intent.</li>
                    <li class="mb-2">Keep the title readable and the meta description specific.</li>
                    <li class="mb-2">Use HTML lists in howto_content and terms_content when helpful.</li>
                    <li>Do not add claims, savings, or expiry details you cannot verify.</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
