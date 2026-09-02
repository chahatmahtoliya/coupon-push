<?php
/**
 * Cpush Coupon CSV Importer
 * Imports scraper output (coupon-import-template.csv format) into DB
 *
 * Usage:
 *   php import.php output/hostinger-coupons-2026-09-02.csv
 *   php import.php --dry-run output/hostinger-coupons-2026-09-02.csv
 *   php import.php --all output/*.csv
 *
 * CSV Header (must match template):
 * title,description,code,coupon_type,discount_type,discount_value,store,store_url,category,start_date,expiry_date,original_price,sale_price,affiliate_link,image,terms_conditions,is_featured,is_verified,is_exclusive,status
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$dryRun = in_array('--dry-run', $argv);
$csvFiles = array_filter($argv, fn($a) => str_ends_with($a, '.csv'));

if (empty($csvFiles)) {
    // auto-find latest in output/
    $files = glob(__DIR__ . '/output/*.csv');
    if (empty($files)) {
        die("Usage: php import.php <csv_file> [--dry-run]\nNo CSV found in output/\n");
    }
    rsort($files);
    $csvFiles = [$files[0]];
    echo "No file given, using latest: {$csvFiles[0]}\n";
}

$expectedHeader = ['title','description','code','coupon_type','discount_type','discount_value','store','store_url','category','start_date','expiry_date','original_price','sale_price','affiliate_link','image','terms_conditions','is_featured','is_verified','is_exclusive','status'];

$totalInserted = 0;
$totalSkipped = 0;
$totalStoresCreated = 0;

foreach ($csvFiles as $csvFile) {
    if (!file_exists($csvFile)) {
        echo "[SKIP] File not found: $csvFile\n";
        continue;
    }
    echo "\n=== Importing: $csvFile ===\n";
    $fh = fopen($csvFile, 'r');
    if (!$fh) {
        echo "[ERROR] Cannot open $csvFile\n";
        continue;
    }
    $header = fgetcsv($fh);
    if ($header !== $expectedHeader) {
        echo "[WARN] Header mismatch!\nExpected: " . implode(',', $expectedHeader) . "\nGot:      " . implode(',', $header ?? []) . "\n";
        if ($header && count($header) === count($expectedHeader)) {
            echo "[INFO] Column count matches, continuing...\n";
        } else {
            fclose($fh);
            continue;
        }
    }

    $rows = [];
    while (($row = fgetcsv($fh)) !== false) {
        if (count($row) < count($expectedHeader)) continue;
        $rows[] = array_combine($expectedHeader, $row);
    }
    fclose($fh);
    echo "[INFO] Found " . count($rows) . " rows\n";

    foreach ($rows as $idx => $r) {
        $lineNo = $idx + 2;
        $title = trim($r['title']);
        if (empty($title)) {
            echo "[SKIP:$lineNo] Empty title\n";
            $totalSkipped++;
            continue;
        }

        // Resolve store
        $storeName = trim($r['store']);
        $storeUrl = trim($r['store_url']);
        $categoryName = trim($r['category']);

        // Find or create store
        $store = db()->fetch("SELECT id FROM stores WHERE name = ? OR slug = ?", [$storeName, createSlug($storeName)]);
        if (!$store) {
            // Find category id
            $cat = db()->fetch("SELECT id FROM categories WHERE name = ? OR slug = ?", [$categoryName, createSlug($categoryName)]);
            $categoryId = $cat ? $cat['id'] : null;
            // If category not found but is Web Hosting, create it
            if (!$cat && !empty($categoryName)) {
                $slug = createSlug($categoryName);
                $existing = db()->fetch("SELECT id FROM categories WHERE slug = ?", [$slug]);
                if ($existing) {
                    $categoryId = $existing['id'];
                } else {
                    // create Web Hosting category
                    $categoryId = db()->insert("INSERT INTO categories (name, slug, description, status) VALUES (?, ?, ?, 1)", [$categoryName, $slug, "Offers for $categoryName"]);
                    echo "[NEW] Created category: $categoryName (id=$categoryId)\n";
                }
            }
            if ($dryRun) {
                echo "[DRY-RUN] Would create store: $storeName\n";
                $storeId = 0;
            } else {
                $storeId = db()->insert(
                    "INSERT INTO stores (name, slug, website_url, affiliate_url, short_description, category_id, is_featured, status) VALUES (?, ?, ?, ?, ?, ?, 0, 1)",
                    [$storeName, createSlug($storeName), $storeUrl ?: ('https://' . strtolower(str_replace(' ', '', $storeName)) . '.com'), $storeUrl, "Official $storeName coupons & offers", $categoryId]
                );
                if ($storeId) {
                    echo "[NEW] Created store: $storeName (id=$storeId)\n";
                    $totalStoresCreated++;
                } else {
                    echo "[ERROR:$lineNo] Failed to create store $storeName\n";
                    $totalSkipped++;
                    continue;
                }
            }
        } else {
            $storeId = $store['id'];
        }

        // Resolve category_id for coupon (may override store category)
        $catRow = db()->fetch("SELECT id FROM categories WHERE name = ? OR slug = ?", [$categoryName, createSlug($categoryName)]);
        $categoryId = $catRow ? $catRow['id'] : null;

        // Check duplicate: same title + store (to avoid re-import)
        $dup = db()->fetch("SELECT id FROM coupons WHERE title = ? AND store_id = ?", [$title, $storeId]);
        if ($dup) {
            echo "[SKIP:$lineNo] Duplicate: $title (store=$storeName)\n";
            $totalSkipped++;
            continue;
        }

        // Normalize coupon fields to match DB schema
        $couponType = in_array($r['coupon_type'], ['code','deal','offer']) ? $r['coupon_type'] : 'deal';
        $discountType = in_array($r['discount_type'], ['percentage','flat','cashback','freebie']) ? $r['discount_type'] : 'percentage';
        $code = trim($r['code']);
        if ($couponType === 'deal') $code = null; // deals have no code

        $data = [
            'title' => $title,
            'description' => $r['description'],
            'code' => $code,
            'coupon_type' => $couponType,
            'discount_type' => $discountType,
            'discount_value' => $r['discount_value'],
            'original_price' => $r['original_price'] !== '' ? floatval($r['original_price']) : null,
            'sale_price' => $r['sale_price'] !== '' ? floatval($r['sale_price']) : null,
            'store_id' => $storeId,
            'category_id' => $categoryId,
            'affiliate_link' => $r['affiliate_link'],
            'image' => $r['image'],
            'terms_conditions' => $r['terms_conditions'],
            'start_date' => $r['start_date'] ?: null,
            'expiry_date' => $r['expiry_date'] ?: null,
            'is_featured' => intval($r['is_featured']),
            'is_verified' => intval($r['is_verified'] ?? 1),
            'is_exclusive' => intval($r['is_exclusive'] ?? 0),
            'status' => intval($r['status'] ?? 1),
        ];

        if ($dryRun) {
            echo "[DRY-RUN:$lineNo] Would insert: [$couponType] $title (" . ($code ?: 'DEAL') . ") - {$data['discount_value']} {$data['discount_type']}\n";
            $totalInserted++;
        } else {
            $id = db()->insert(
                "INSERT INTO coupons (title, description, code, coupon_type, discount_type, discount_value, original_price, sale_price, store_id, category_id, affiliate_link, image, terms_conditions, start_date, expiry_date, is_featured, is_verified, is_exclusive, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                array_values($data)
            );
            if ($id) {
                echo "[OK:$lineNo] Inserted #$id: $title\n";
                $totalInserted++;
                // update store coupon count
                db()->update("UPDATE stores SET total_coupons = total_coupons + 1 WHERE id = ?", [$storeId]);
            } else {
                echo "[ERROR:$lineNo] Failed to insert: $title\n";
                $totalSkipped++;
            }
        }
    }
}

echo "\n================ SUMMARY ================\n";
echo "Inserted: $totalInserted\n";
echo "Skipped:  $totalSkipped\n";
echo "Stores created: $totalStoresCreated\n";
if ($dryRun) echo "Mode: DRY-RUN (no DB writes)\n";
echo "=========================================\n";
