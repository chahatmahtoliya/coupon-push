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

    echo "Testing the full query from seasonal-offers.php:<br><br>";

    // This is the exact query from seasonal-offers.php
    $sql = "SELECT so.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'id', c.id,
                           'title', c.title,
                           'description', c.description,
                           'code', c.code,
                           'coupon_type', c.coupon_type,
                           'discount_type', c.discount_type,
                           'discount_value', c.discount_value,
                           'store_id', c.store_id,
                           'store_name', s.name,
                           'store_slug', s.slug,
                           'store_logo', s.logo,
                           'link', c.link,
                           'expiry_date', c.expiry_date
                       ) SEPARATOR '||SEPARATOR||'
                   ) as coupons
            FROM seasonal_offers so
            LEFT JOIN seasonal_offer_coupons soc ON so.id = soc.seasonal_offer_id
            LEFT JOIN coupons c ON soc.coupon_id = c.id
            LEFT JOIN stores s ON c.store_id = s.id
            WHERE so.is_active = 1 
              AND so.start_date <= CURDATE() 
              AND so.end_date >= CURDATE()
            GROUP BY so.id
            ORDER BY so.display_order ASC, so.created_at DESC";

    echo "Query OK, executing...<br>";
    $stmt = $pdo->query($sql);
    $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Success! Found " . count($offers) . " offers<br><br>";
    echo "<pre>";
    print_r($offers);
    echo "</pre>";
} catch (Exception $e) {
    echo "<strong>ERROR:</strong> " . $e->getMessage() . "<br>";
    echo "Code: " . $e->getCode() . "<br>";
}
