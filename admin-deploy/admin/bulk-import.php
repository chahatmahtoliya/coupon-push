<?php

/**
 * Admin - Bulk coupon CSV import
 */

$pageTitle = 'Bulk Import Coupons';
require_once 'includes/admin-header.php';

const COUPON_IMPORT_MAX_BYTES = 2097152;
const COUPON_IMPORT_MAX_ROWS = 2000;
const COUPON_IMPORT_COLUMNS = [
    'title', 'description', 'code', 'coupon_type', 'discount_type', 'discount_value',
    'store', 'store_url', 'category', 'start_date', 'expiry_date', 'original_price',
    'sale_price', 'affiliate_link', 'image', 'terms_conditions', 'is_featured',
    'is_verified', 'is_exclusive', 'status'
];

function importDateIsValid($value)
{
    if ($value === '') return true;
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
}

function importUrlIsValid($value, $allowRelative = false)
{
    if ($value === '') return true;
    if ($allowRelative && substr($value, 0, 1) === '/') return true;
    if (!filter_var($value, FILTER_VALIDATE_URL)) return false;
    $scheme = strtolower(parse_url($value, PHP_URL_SCHEME) ?: '');
    return in_array($scheme, ['http', 'https'], true);
}

function importBooleanIsValid($value)
{
    return in_array(strtolower(trim((string) $value)), ['0', '1', 'true', 'false', 'yes', 'no'], true);
}

function importBooleanValue($value)
{
    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes'], true) ? 1 : 0;
}

function readCouponImportCsv($filePath)
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

    if ($header !== COUPON_IMPORT_COLUMNS) {
        fclose($handle);
        return ['rows' => [], 'errors' => ['The CSV columns do not match the CouponPush template. Download the current template and keep its header unchanged.']];
    }

    $rows = [];
    $errors = [];
    $lineNumber = 1;
    while (($values = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        $lineNumber++;
        if (count(array_filter($values, function ($value) { return trim((string) $value) !== ''; })) === 0) continue;
        if (count($values) !== count(COUPON_IMPORT_COLUMNS)) {
            $errors[] = "Row {$lineNumber}: expected " . count(COUPON_IMPORT_COLUMNS) . ' columns, found ' . count($values) . '.';
            continue;
        }
        $row = array_combine(COUPON_IMPORT_COLUMNS, $values);
        $row = array_map(function ($value) { return trim((string) $value); }, $row);
        $row['_line'] = $lineNumber;
        $rows[] = $row;
        if (count($rows) > COUPON_IMPORT_MAX_ROWS) {
            $errors[] = 'The CSV contains more than ' . COUPON_IMPORT_MAX_ROWS . ' data rows. Split it into smaller files.';
            break;
        }
    }
    fclose($handle);

    if (!$rows && !$errors) $errors[] = 'The CSV does not contain any coupon rows.';
    return ['rows' => $rows, 'errors' => $errors];
}

function validateCouponImportRows($rows)
{
    $errors = [];
    foreach ($rows as $row) {
        $line = $row['_line'];
        if ($row['title'] === '') $errors[] = "Row {$line}: title is required.";
        if (strlen($row['title']) > 255) $errors[] = "Row {$line}: title must be 255 characters or fewer.";
        if ($row['store'] === '') $errors[] = "Row {$line}: store is required.";
        if (strlen($row['store']) > 100) $errors[] = "Row {$line}: store must be 100 characters or fewer.";
        if ($row['store'] !== '' && createSlug($row['store']) === '') $errors[] = "Row {$line}: store must contain letters or numbers that can form a URL slug.";
        if ($row['category'] !== '' && strlen($row['category']) > 100) $errors[] = "Row {$line}: category must be 100 characters or fewer.";
        if (!in_array($row['coupon_type'], ['code', 'deal', 'offer'], true)) $errors[] = "Row {$line}: coupon_type must be code, deal, or offer.";
        if (!in_array($row['discount_type'], ['percentage', 'flat', 'cashback', 'freebie'], true)) $errors[] = "Row {$line}: discount_type must be percentage, flat, cashback, or freebie.";
        if ($row['coupon_type'] === 'code' && $row['code'] === '') $errors[] = "Row {$line}: code is required when coupon_type is code.";
        if (strlen($row['code']) > 50) $errors[] = "Row {$line}: code must be 50 characters or fewer.";
        if ($row['discount_value'] !== '' && (!is_numeric($row['discount_value']) || (float) $row['discount_value'] < 0)) $errors[] = "Row {$line}: discount_value must be a non-negative number.";
        if ($row['discount_type'] === 'percentage' && $row['discount_value'] !== '' && (float) $row['discount_value'] > 100) $errors[] = "Row {$line}: a percentage discount cannot exceed 100.";
        foreach (['original_price', 'sale_price'] as $field) {
            if ($row[$field] !== '' && (!is_numeric($row[$field]) || (float) $row[$field] < 0)) $errors[] = "Row {$line}: {$field} must be a non-negative number.";
        }
        foreach (['start_date', 'expiry_date'] as $field) {
            if (!importDateIsValid($row[$field])) $errors[] = "Row {$line}: {$field} must use YYYY-MM-DD.";
        }
        if ($row['start_date'] && $row['expiry_date'] && $row['expiry_date'] < $row['start_date']) $errors[] = "Row {$line}: expiry_date cannot be earlier than start_date.";
        if ($row['store_url'] === '') $errors[] = "Row {$line}: store_url is required.";
        elseif (!importUrlIsValid($row['store_url'])) $errors[] = "Row {$line}: store_url must be a valid http or https URL.";
        if (!importUrlIsValid($row['affiliate_link'])) $errors[] = "Row {$line}: affiliate_link must be a valid http or https URL.";
        if (!importUrlIsValid($row['image'], true)) $errors[] = "Row {$line}: image must be a valid http/https URL or a root-relative path.";
        if (strlen($row['affiliate_link']) > 500) $errors[] = "Row {$line}: affiliate_link must be 500 characters or fewer.";
        foreach (['is_featured', 'is_verified', 'is_exclusive', 'status'] as $field) {
            if (!importBooleanIsValid($row[$field])) $errors[] = "Row {$line}: {$field} must be 0/1, true/false, or yes/no.";
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

    $upload = $_FILES['coupon_csv'] ?? null;
    if (!$upload || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $importErrors[] = 'Choose a CSV file to upload.';
    } elseif (($upload['size'] ?? 0) > COUPON_IMPORT_MAX_BYTES) {
        $importErrors[] = 'The CSV is larger than the 2 MB upload limit.';
    } elseif (strtolower(pathinfo($upload['name'] ?? '', PATHINFO_EXTENSION)) !== 'csv') {
        $importErrors[] = 'Only .csv files are accepted.';
    } elseif (!is_uploaded_file($upload['tmp_name'])) {
        $importErrors[] = 'The uploaded file could not be verified.';
    } elseif (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? finfo_file($finfo, $upload['tmp_name']) : false;
        if ($finfo) finfo_close($finfo);
        $allowedMimes = ['text/csv', 'text/plain', 'text/x-csv', 'text/comma-separated-values', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'];
        if ($mime && !in_array($mime, $allowedMimes, true)) $importErrors[] = 'The uploaded file does not appear to be a CSV.';
    }

    $rows = [];
    if (!$importErrors) {
        $parsed = readCouponImportCsv($upload['tmp_name']);
        $rows = $parsed['rows'];
        $importErrors = array_merge($importErrors, $parsed['errors'], validateCouponImportRows($rows));
    }

    $mode = ($_POST['import_mode'] ?? 'import') === 'validate' ? 'validate' : 'import';
    $duplicateMode = ($_POST['duplicate_mode'] ?? 'skip') === 'update' ? 'update' : 'skip';

    if (!$importErrors && $mode === 'validate') {
        $importResult = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'stores' => 0, 'categories' => 0];
    } elseif (!$importErrors) {
        $pdo = db()->getConnection();
        $counts = ['validated' => count($rows), 'inserted' => 0, 'updated' => 0, 'skipped' => 0, 'stores' => 0, 'categories' => 0];
        $storeCache = [];
        $categoryCache = [];
        $affectedStores = [];

        try {
            $pdo->beginTransaction();
            $findStore = $pdo->prepare('SELECT id FROM stores WHERE slug = ? LIMIT 1');
            $findCategory = $pdo->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
            $insertStore = $pdo->prepare('INSERT INTO stores (name, slug, website_url, affiliate_url, short_description, category_id, is_featured, status) VALUES (?, ?, ?, NULL, NULL, ?, 0, 1)');
            $insertCategory = $pdo->prepare('INSERT INTO categories (name, slug, description, status) VALUES (?, ?, NULL, 1)');
            $findByCode = $pdo->prepare("SELECT id FROM coupons WHERE store_id = ? AND code = ? AND code <> '' LIMIT 1");
            $findByTitle = $pdo->prepare('SELECT id FROM coupons WHERE store_id = ? AND title = ? LIMIT 1');
            $insertCoupon = $pdo->prepare('INSERT INTO coupons (title, description, code, coupon_type, discount_type, discount_value, original_price, sale_price, store_id, category_id, affiliate_link, image, terms_conditions, start_date, expiry_date, is_featured, is_verified, is_exclusive, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $updateCoupon = $pdo->prepare('UPDATE coupons SET title = ?, description = ?, code = ?, coupon_type = ?, discount_type = ?, discount_value = ?, original_price = ?, sale_price = ?, category_id = ?, affiliate_link = ?, image = ?, terms_conditions = ?, start_date = ?, expiry_date = ?, is_featured = ?, is_verified = ?, is_exclusive = ?, status = ? WHERE id = ?');
            $updateStoreCount = $pdo->prepare('UPDATE stores SET total_coupons = (SELECT COUNT(*) FROM coupons WHERE store_id = ? AND status = 1) WHERE id = ?');

            foreach ($rows as $row) {
                $categoryId = null;
                $categorySlug = createSlug($row['category']);
                if ($categorySlug !== '') {
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
                }

                $storeSlug = createSlug($row['store']);
                if (!array_key_exists($storeSlug, $storeCache)) {
                    $findStore->execute([$storeSlug]);
                    $storeId = $findStore->fetchColumn();
                    if (!$storeId) {
                        if ($row['store_url'] === '') throw new RuntimeException("Row {$row['_line']}: store_url is required to create the new store {$row['store']}.");
                        $insertStore->execute([$row['store'], $storeSlug, $row['store_url'], $categoryId]);
                        $storeId = (int) $pdo->lastInsertId();
                        $counts['stores']++;
                    }
                    $storeCache[$storeSlug] = (int) $storeId;
                }
                $storeId = $storeCache[$storeSlug];
                $affectedStores[$storeId] = true;

                $code = $row['coupon_type'] === 'deal' ? null : ($row['code'] ?: null);
                if ($code) {
                    $findByCode->execute([$storeId, $code]);
                    $existingId = $findByCode->fetchColumn();
                } else {
                    $findByTitle->execute([$storeId, $row['title']]);
                    $existingId = $findByTitle->fetchColumn();
                }

                $couponValues = [
                    $row['title'], $row['description'] ?: null, $code, $row['coupon_type'], $row['discount_type'],
                    $row['discount_value'] === '' ? null : $row['discount_value'],
                    $row['original_price'] === '' ? null : (float) $row['original_price'],
                    $row['sale_price'] === '' ? null : (float) $row['sale_price'],
                ];

                if ($existingId && $duplicateMode === 'skip') {
                    $counts['skipped']++;
                    continue;
                }

                if ($existingId) {
                    $updateCoupon->execute(array_merge($couponValues, [
                        $categoryId, $row['affiliate_link'] ?: null, $row['image'] ?: null, $row['terms_conditions'] ?: null,
                        $row['start_date'] ?: null, $row['expiry_date'] ?: null, importBooleanValue($row['is_featured']),
                        importBooleanValue($row['is_verified']), importBooleanValue($row['is_exclusive']), importBooleanValue($row['status']), (int) $existingId
                    ]));
                    $counts['updated']++;
                } else {
                    $insertCoupon->execute(array_merge($couponValues, [
                        $storeId, $categoryId, $row['affiliate_link'] ?: null, $row['image'] ?: null, $row['terms_conditions'] ?: null,
                        $row['start_date'] ?: null, $row['expiry_date'] ?: null, importBooleanValue($row['is_featured']),
                        importBooleanValue($row['is_verified']), importBooleanValue($row['is_exclusive']), importBooleanValue($row['status'])
                    ]));
                    $counts['inserted']++;
                }
            }

            foreach (array_keys($affectedStores) as $storeId) $updateStoreCount->execute([$storeId, $storeId]);
            $pdo->commit();
            $importResult = $counts;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('Coupon bulk import failed: ' . $error->getMessage());
            $importErrors[] = 'Nothing was imported. ' . $error->getMessage();
        }
    }
}
?>

<div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
    <div>
        <h1 class="page-title">Bulk Import Coupons</h1>
        <p class="page-subtitle">Upload up to <?php echo number_format(COUPON_IMPORT_MAX_ROWS); ?> coupons from the CouponPush CSV template.</p>
    </div>
    <div class="d-flex gap-2">
        <a href="templates/coupon-import-template.csv" class="btn btn-outline-primary" download>
            <i class="fas fa-download me-2"></i> Download Template
        </a>
        <a href="coupons.php" class="btn btn-outline-secondary">Back to Coupons</a>
    </div>
</div>

<?php if ($importErrors): ?>
    <div class="alert alert-danger" role="alert">
        <strong>The file was not imported.</strong>
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
            <strong>Validation passed.</strong> <?php echo number_format($importResult['validated']); ?> rows are ready to import.
        <?php else: ?>
            <strong>Import complete.</strong>
            <?php echo number_format($importResult['inserted']); ?> inserted,
            <?php echo number_format($importResult['updated']); ?> updated,
            <?php echo number_format($importResult['skipped']); ?> duplicates skipped.
            <?php if ($importResult['stores'] || $importResult['categories']): ?>Created <?php echo number_format($importResult['stores']); ?> stores and <?php echo number_format($importResult['categories']); ?> categories.<?php endif; ?>
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
                        <label for="coupon_csv" class="form-label fw-semibold">Coupon CSV</label>
                        <input class="form-control" type="file" id="coupon_csv" name="coupon_csv" accept=".csv,text/csv" required>
                        <div class="form-text">Maximum 2 MB and <?php echo number_format(COUPON_IMPORT_MAX_ROWS); ?> data rows. Keep the header row unchanged.</div>
                    </div>

                    <div class="mb-4">
                        <label for="duplicate_mode" class="form-label fw-semibold">When a matching coupon already exists</label>
                        <select class="form-select" id="duplicate_mode" name="duplicate_mode">
                            <option value="skip" <?php echo ($_POST['duplicate_mode'] ?? 'skip') === 'skip' ? 'selected' : ''; ?>>Skip it (recommended)</option>
                            <option value="update" <?php echo ($_POST['duplicate_mode'] ?? '') === 'update' ? 'selected' : ''; ?>>Update it with the CSV row</option>
                        </select>
                        <div class="form-text">Codes match by store + code. Deals without a code match by store + title.</div>
                    </div>

                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-primary" type="submit" name="import_mode" value="import"><i class="fas fa-file-import me-2"></i> Import CSV</button>
                        <button class="btn btn-outline-primary" type="submit" name="import_mode" value="validate"><i class="fas fa-check-circle me-2"></i> Validate Only</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card">
            <div class="card-body p-4">
                <h2 class="h5">Import behavior</h2>
                <ul class="text-secondary ps-3 mb-0">
                    <li class="mb-2">All rows are checked before database changes begin.</li>
                    <li class="mb-2">Missing categories are created from the category column.</li>
                    <li class="mb-2">Missing stores require a valid store_url and are created automatically.</li>
                    <li>The entire upload rolls back if any database write fails.</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
