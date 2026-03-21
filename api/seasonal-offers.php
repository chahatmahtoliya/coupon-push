<?php

/**
 * Seasonal Offers API
 * Handles CRUD operations for seasonal/festival offers
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get active seasonal offers or specific offer by slug
        $slug = $_GET['slug'] ?? null;
        $active_only = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : true;

        if ($slug) {
            // Get specific offer with coupons
            $stmt = $pdo->prepare("
                SELECT so.*, 
                       GROUP_CONCAT(soc.coupon_id) as coupon_ids
                FROM seasonal_offers so
                LEFT JOIN seasonal_offer_coupons soc ON so.id = soc.seasonal_offer_id
                WHERE so.slug = :slug
                GROUP BY so.id
            ");
            $stmt->execute(['slug' => $slug]);
            $offer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$offer) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Offer not found']);
                exit;
            }

            // Get associated coupons
            if ($offer['coupon_ids']) {
                $coupon_ids = explode(',', $offer['coupon_ids']);
                $placeholders = implode(',', array_fill(0, count($coupon_ids), '?'));

                $stmt = $pdo->prepare("
                    SELECT c.*, s.name as store_name, s.slug as store_slug, 
                           s.logo as store_logo, s.website_url as store_website_url
                    FROM coupons c
                    JOIN stores s ON c.store_id = s.id
                    WHERE c.id IN ($placeholders)
                    AND c.status = 1
                    AND (c.expiry_date IS NULL OR c.expiry_date >= CURDATE())
                    ORDER BY c.is_featured DESC, c.click_count DESC
                ");
                $stmt->execute($coupon_ids);
                $offer['coupons'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $offer['coupons'] = [];
            }

            unset($offer['coupon_ids']);
            echo json_encode(['success' => true, 'data' => $offer]);
        } else {
            // Get all active offers
            $sql = "
                SELECT so.*,
                       (SELECT COUNT(*) FROM seasonal_offer_coupons WHERE seasonal_offer_id = so.id) as coupon_count
                FROM seasonal_offers so
            ";

            if ($active_only) {
                $sql .= " WHERE so.is_active = 1 
                          AND so.start_date <= CURDATE() 
                          AND so.end_date >= CURDATE()";
            }

            $sql .= " ORDER BY so.display_order ASC, so.start_date DESC";

            $stmt = $pdo->query($sql);
            $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // For active offers, get first 6 coupons for preview
            if ($active_only) {
                foreach ($offers as &$offer) {
                    $stmt = $pdo->prepare("
                        SELECT c.*, s.name as store_name, s.slug as store_slug, 
                               s.logo as store_logo, s.website_url as store_website_url
                        FROM coupons c
                        JOIN stores s ON c.store_id = s.id
                        JOIN seasonal_offer_coupons soc ON c.id = soc.coupon_id
                        WHERE soc.seasonal_offer_id = :offer_id
                        AND c.status = 1
                        AND (c.expiry_date IS NULL OR c.expiry_date >= CURDATE())
                        ORDER BY c.is_featured DESC, c.click_count DESC
                        LIMIT 6
                    ");
                    $stmt->execute(['offer_id' => $offer['id']]);
                    $offer['coupons'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }

            echo json_encode(['success' => true, 'data' => $offers]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
