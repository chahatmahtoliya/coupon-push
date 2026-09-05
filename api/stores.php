<?php

/**
 * API: Get Stores
 * 
 * GET /api/stores.php - All stores
 * GET /api/stores.php?featured=1 - Featured stores only
 * GET /api/stores.php?category=electronics - By category slug
 * GET /api/stores.php?limit=10 - Limit results
 */

require_once __DIR__ . '/config.php';

$featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : false;
$category = isset($_GET['category']) ? sanitize($_GET['category']) : null;
$limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 500)) : 100;

try {
    $sql = "
        SELECT 
            s.id,
            s.name,
            s.slug,
            s.logo,
            s.website_url,
            s.description,
            s.rating,
            s.is_featured,
            s.category_id,
            c.name as category_name,
            (SELECT COUNT(*) FROM coupons WHERE store_id = s.id AND status = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())) as coupon_count
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.status = 1
    ";

    $params = [];

    if ($featured) {
        $sql .= " AND s.is_featured = 1";
    }

    if ($category) {
        $sql .= " AND c.slug = ?";
        $params[] = $category;
    }

    // Interpolate the already-clamped integer. Some production PDO/MySQL
    // combinations reject a string-bound placeholder in LIMIT.
    $sql .= " ORDER BY s.is_featured DESC, coupon_count DESC LIMIT {$limit}";

    $stores = db()->fetchAll($sql, $params);

    // Transform data
    $stores = array_map(function ($store) {
        return [
            'id' => (int)$store['id'],
            'name' => $store['name'],
            'slug' => $store['slug'],
            'logo' => getStoreLogoUrl($store['logo']),
            'website_url' => $store['website_url'],
            'description' => $store['description'],
            'updated_at' => $store['updated_at'] ?? null,
            'rating' => (float)($store['rating'] ?? 4.0),
            'is_featured' => (bool)$store['is_featured'],
            'category_id' => (int)$store['category_id'],
            'category_name' => $store['category_name'],
            'coupon_count' => (int)$store['coupon_count']
        ];
    }, $stores);

    jsonResponse($stores);
} catch (Throwable $e) {
    error_log('Stores API failed: ' . $e->getMessage());
    jsonError('Failed to fetch stores: ' . $e->getMessage(), 500);
}
