<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "<h3>Checking coupons table structure:</h3>";

    $stmt = $pdo->query("DESCRIBE coupons");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<pre>";
    print_r($columns);
    echo "</pre>";

    echo "<hr>";
    echo "<h3>Testing simplified query:</h3>";

    // Simple query without is_active check
    $stmt = $pdo->prepare("
        SELECT c.*, s.name as store_name, s.slug as store_slug, 
               s.logo as store_logo
        FROM coupons c
        JOIN stores s ON c.store_id = s.id
        JOIN seasonal_offer_coupons soc ON c.id = soc.coupon_id
        WHERE soc.seasonal_offer_id = 1
        LIMIT 1
    ");
    $stmt->execute();
    $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Success! Found " . count($coupons) . " coupons<br>";
    if (count($coupons) > 0) {
        echo "<pre>";
        print_r(array_keys($coupons[0]));
        echo "</pre>";
    }
} catch (Exception $e) {
    echo "<strong>ERROR:</strong> " . $e->getMessage();
}
