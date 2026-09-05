<?php

/**
 * Admin - Bulk store CSV import with local logo uploads
 */

$pageTitle = 'Bulk Import Stores';
require_once 'includes/admin-header.php';

const STORE_IMPORT_MAX_BYTES = 2097152;
const STORE_IMPORT_MAX_ROWS = 200;
const STORE_IMPORT_COLUMNS = [
    'name', 'slug', 'website_url', 'affiliate_url', 'category', 'logo_filename',
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

        if ($row['logo_filename'] === '') {
            $errors[] = "Row {$line}: logo_filename is required.";
        } elseif (preg_match('/[\\\\\/]/', $row['logo_filename']) || strlen($row['logo_filename']) > 255) {
            $errors[] = "Row {$line}: logo_filename must be a plain filename such as nykaa.webp, without a path.";
        }

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

function normalizeStoreLogoUploads($files)
{
    if (!$files || !isset($files['name']) || !is_array($files['name'])) return [];

    $uploads = [];
    foreach ($files['name'] as $index => $name) {
        if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE && $name === '') continue;
        $uploads[] = [
            'name' => (string) $name,
            'type' => $files['type'][$index] ?? '',
            'tmp_name' => $files['tmp_name'][$index] ?? '',
            'error' => $files['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $files['size'][$index] ?? 0
        ];
    }
    return $uploads;
}

function validateStoreLogoUploads($uploads)
{
    $errors = [];
    $byName = [];
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    foreach ($uploads as $upload) {
        $name = basename($upload['name']);
        $key = strtolower($name);
        if ($upload['error'] !== UPLOAD_ERR_OK) {
            $errors[] = "Logo {$name}: upload failed with error code {$upload['error']}.";
            continue;
        }
        if ($name === '' || $name !== $upload['name']) {
            $errors[] = 'Every logo must have a plain filename without a directory path.';
            continue;
        }
        if (isset($byName[$key])) {
            $errors[] = "Logo {$name}: another selected file has the same filename.";
            continue;
        }
        if (!is_uploaded_file($upload['tmp_name'])) {
            $errors[] = "Logo {$name}: the uploaded file could not be verified.";
            continue;
        }
        if ($upload['size'] <= 0 || $upload['size'] > MAX_UPLOAD_SIZE) {
            $errors[] = "Logo {$name}: each image must be no larger than " . round(MAX_UPLOAD_SIZE / 1048576) . ' MB.';
            continue;
        }
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            $errors[] = "Logo {$name}: use JPG, PNG, GIF, or WebP.";
            continue;
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? finfo_file($finfo, $upload['tmp_name']) : false;
        if ($finfo) finfo_close($finfo);
        if (!$mime || !in_array($mime, ALLOWED_IMAGE_TYPES, true)) {
            $errors[] = "Logo {$name}: the file content is not a supported image.";
            continue;
        }
        $byName[$key] = $upload;
    }

    return ['files' => $byName, 'errors' => $errors];
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

    $logoValidation = validateStoreLogoUploads(normalizeStoreLogoUploads($_FILES['store_logos'] ?? null));
    $logoFiles = $logoValidation['files'];
    $importErrors = array_merge($importErrors, $logoValidation['errors']);

    foreach ($rows as $row) {
        $logoKey = strtolower($row['logo_filename']);
        if ($row['logo_filename'] !== '' && !isset($logoFiles[$logoKey])) {
            $importErrors[] = "Row {$row['_line']}: select the logo file named {$row['logo_filename']}.";
        }
    }

    $mode = ($_POST['import_mode'] ?? 'import') === 'validate' ? 'validate' : 'import';
    $duplicateMode = ($_POST['duplicate_mode'] ?? 'update') === 'skip' ? 'skip' : 'update';

    if (!$importErrors && $mode === 'validate') {
        $importResult = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'categories' => 0, 'logos' => count($logoFiles)];
    } elseif (!$importErrors) {
        $pdo = db()->getConnection();
        $counts = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'categories' => 0, 'logos' => 0];
        $categoryCache = [];
        $storedLogos = [];
        $newLogoPaths = [];

        try {
            $pdo->beginTransaction();
            $findStore = $pdo->prepare('SELECT id FROM stores WHERE slug = ? LIMIT 1');
            $findCategory = $pdo->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
            $insertCategory = $pdo->prepare('INSERT INTO categories (name, slug, description, status) VALUES (?, ?, NULL, 1)');
            $insertStore = $pdo->prepare('INSERT INTO stores (name, slug, logo, website_url, affiliate_url, short_description, description, about_content, howto_content, terms_content, category_id, h1_suffix, meta_title, meta_description, rating, is_featured, is_popular, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $updateStore = $pdo->prepare('UPDATE stores SET name = ?, logo = ?, website_url = ?, affiliate_url = ?, short_description = ?, description = ?, about_content = ?, howto_content = ?, terms_content = ?, category_id = ?, h1_suffix = ?, meta_title = ?, meta_description = ?, rating = ?, is_featured = ?, is_popular = ?, status = ? WHERE id = ?');

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

                $logoKey = strtolower($row['logo_filename']);
                if (!isset($storedLogos[$logoKey])) {
                    $logoUpload = uploadImage($logoFiles[$logoKey], STORE_LOGOS_PATH, 'store_');
                    if (!$logoUpload['success']) {
                        throw new RuntimeException("Row {$row['_line']}: failed to save logo {$row['logo_filename']}: {$logoUpload['message']}");
                    }
                    $storedLogos[$logoKey] = $logoUpload['filename'];
                    $newLogoPaths[] = STORE_LOGOS_PATH . $logoUpload['filename'];
                    $counts['logos']++;
                }
                $storedLogo = $storedLogos[$logoKey];

                $values = [
                    $row['name'], $storedLogo, $row['website_url'], $row['affiliate_url'] ?: null,
                    $row['short_description'], $row['description'], $row['about_content'],
                    $row['howto_content'], $row['terms_content'], $categoryId, $row['h1_suffix'],
                    $row['meta_title'], $row['meta_description'], (float) $row['rating'],
                    storeImportBooleanValue($row['is_featured']), storeImportBooleanValue($row['is_popular']),
                    storeImportBooleanValue($row['status'])
                ];

                if ($existingId) {
                    $updateStore->execute(array_merge($values, [(int) $existingId]));
                    $counts['updated']++;
                } else {
                    $insertStore->execute(array_merge([$row['name'], $slug], array_slice($values, 1)));
                    $counts['inserted']++;
                }
            }

            $pdo->commit();
            $importResult = $counts;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            foreach ($newLogoPaths as $path) {
                if (is_file($path)) unlink($path);
            }
            error_log('Store bulk import failed: ' . $error->getMessage());
            $importErrors[] = 'Nothing was imported. ' . $error->getMessage();
        }
    }
}
?>

<div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
    <div>
        <h1 class="page-title">Bulk Import Stores</h1>
        <p class="page-subtitle">Create or update up to <?php echo number_format(STORE_IMPORT_MAX_ROWS); ?> SEO-complete store pages with local logo files.</p>
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
            <strong>Validation passed.</strong> <?php echo number_format($importResult['validated']); ?> stores and <?php echo number_format($importResult['logos']); ?> logo files are ready.
        <?php else: ?>
            <strong>Store import complete.</strong>
            <?php echo number_format($importResult['inserted']); ?> inserted,
            <?php echo number_format($importResult['updated']); ?> updated,
            <?php echo number_format($importResult['skipped']); ?> duplicates skipped,
            <?php echo number_format($importResult['logos']); ?> logos saved.
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
                        <label for="store_logos" class="form-label fw-semibold">Store logo files</label>
                        <input class="form-control" type="file" id="store_logos" name="store_logos[]" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" multiple required>
                        <div class="form-text">Select every logo referenced in the CSV logo_filename column. Filenames must match exactly. Each image may be up to <?php echo round(MAX_UPLOAD_SIZE / 1048576); ?> MB.</div>
                    </div>

                    <div class="mb-4">
                        <label for="duplicate_mode" class="form-label fw-semibold">When a matching store slug already exists</label>
                        <select class="form-select" id="duplicate_mode" name="duplicate_mode">
                            <option value="update" <?php echo ($_POST['duplicate_mode'] ?? 'update') === 'update' ? 'selected' : ''; ?>>Update its content and logo (recommended)</option>
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
                    <li class="mb-2">Put the image filename in logo_filename, for example <code>nykaa.webp</code>.</li>
                    <li class="mb-2">Choose those actual image files in the logo picker.</li>
                    <li>The importer securely renames and stores them in the existing store-logo directory.</li>
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
