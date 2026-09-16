<?php

function loadValidatorSection($file, $start, $end) {
    $source = file_get_contents($file);
    $from = strpos($source, $start);
    $to = strpos($source, $end, $from);
    if ($from === false || $to === false) throw new RuntimeException('Validator boundaries missing.');
    eval(substr($source, $from, $to - $from));
}

$root = dirname(__DIR__, 2);
loadValidatorSection($root . '/includes/functions.php', 'function createSlug(', 'function sanitize(');
loadValidatorSection(
    $root . '/c-scrapper/output/store-import-fix/bulk-import-stores.php',
    'const STORE_IMPORT_MAX_BYTES',
    'function normalizeStoreLogoUploads('
);

$path = $root . '/c-scrapper/output/amazon-great-indian-festival-store-import.csv';
$parsed = readStoreImportCsv($path);
$errors = array_merge($parsed['errors'], validateStoreImportRows($parsed['rows']));

if (count($parsed['rows']) !== 1) $errors[] = 'Expected exactly one Amazon store row.';
if (($parsed['rows'][0]['slug'] ?? '') !== 'amazon-great-indian-festival-sale') $errors[] = 'Expected a separate festival sale slug.';
if (stripos($parsed['rows'][0]['about_content'] ?? '', 'Great Indian Festival') === false) $errors[] = 'Missing sale-specific pSEO content.';
if (preg_match('/\*\*|ï¿½|â€™|â€“|â€”/', file_get_contents($path))) $errors[] = 'Found markdown or encoding artifacts.';

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

echo 'PASS: store importer accepts 1 row and 18 columns; separate festival sale slug, SEO fields and pSEO content are present.' . PHP_EOL;
