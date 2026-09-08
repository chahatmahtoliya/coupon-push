<?php
// Load only the existing CSV parser/validators, without authentication or DB writes.
function loadValidators($file, $start, $end) {
    $source = file_get_contents($file);
    $a = strpos($source, $start);
    $b = strpos($source, $end, $a);
    if ($a === false || $b === false) throw new RuntimeException('Validator boundaries missing');
    eval(substr($source, $a, $b - $a));
}
loadValidators(__DIR__ . '/../../includes/functions.php', 'function createSlug(', 'function sanitize(');
loadValidators(__DIR__ . '/store-import-fix/bulk-import-stores.php', 'const STORE_IMPORT_MAX_BYTES', 'function normalizeStoreLogoUploads(');
loadValidators(__DIR__ . '/../../admin/bulk-import.php', 'const COUPON_IMPORT_MAX_BYTES', '$importResult = null;');
$store = readStoreImportCsv(__DIR__ . '/blinkit-store-import.csv');
$coupons = readCouponImportCsv(__DIR__ . '/blinkit-coupons-import.csv');
$errors = array_merge($store['errors'], $coupons['errors'], validateStoreImportRows($store['rows']), validateCouponImportRows($coupons['rows']));
$logo = __DIR__ . '/../logos/' . $store['rows'][0]['logo_filename'];
if (!is_file($logo) || !getimagesize($logo) || mime_content_type($logo) !== 'image/jpeg') $errors[] = 'Invalid or missing logo';
if (count($store['rows']) !== 1 || count($coupons['rows']) !== 3) $errors[] = 'Unexpected row counts';
if ($errors) { echo implode(PHP_EOL, $errors); exit(1); }
echo "PASS: admin CSV parsers and validators accept 1 store and 3 offers; matching JPEG logo verified. No database writes.\n";
