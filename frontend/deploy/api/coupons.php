<?php

/**
 * API: Get Coupons
 * 
 * GET /api/coupons.php - All coupons
 * GET /api/coupons.php?featured=1 - Featured coupons
 * GET /api/coupons.php?latest=1 - Latest coupons
 * GET /api/coupons.php?store_id=1 - By store
 * GET /api/coupons.php?category=electronics - By category
 * GET /api/coupons.php?limit=10 - Limit results
 */

require_once __DIR__ . '/config.php';

$featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : false;
$latest = isset($_GET['latest']) ? (bool)$_GET['latest'] : false;
$storeId = isset($_GET['store_id']) ? (int)$_GET['store_id'] : null;
$category = isset($_GET['category']) ? sanitize($_GET['category']) : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

try {
    $sql = "
        SELECT 
            cp.*,
            s.name as store_name,
            s.slug as store_slug,
            s.logo as store_logo,
            s.website_url as store_website_url,
            c.name as category_name,
            c.slug as category_slug
        FROM coupons cp
        JOIN stores s ON cp.store_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE cp.status = 1 
        AND s.status = 1
        AND (cp.expiry_date IS NULL OR cp.expiry_date >= CURDATE())
    ";

    $params = [];

    if ($featured) {
        $sql .= " AND cp.is_featured = 1";
    }

    if ($storeId) {
        $sql .= " AND cp.store_id = ?";
        $params[] = $storeId;
    }

    if ($category) {
        $sql .= " AND c.slug = ?";
        $params[] = $category;
    }

    if ($latest) {
        $sql .= " ORDER BY cp.created_at DESC";
    } else {
        $sql .= " ORDER BY cp.is_featured DESC, cp.click_count DESC";
    }

    $sql .= " LIMIT ?";
    $params[] = $limit;

    $coupons = db()->fetchAll($sql, $params);

    // Transform data
    $coupons = array_map(function ($coupon) {
        return [
            'id' => (int)$coupon['id'],
            'store_id' => (int)$coupon['store_id'],
            'store_name' => $coupon['store_name'],
            'store_slug' => $coupon['store_slug'],
            'store_logo' => getStoreLogoUrl($coupon['store_logo']),
            'store_website_url' => $coupon['store_website_url'],
            'title' => $coupon['title'],
            'description' => $coupon['description'],
            'code' => $coupon['code'],
            'discount_type' => $coupon['discount_type'],
            'discount_value' => (float)$coupon['discount_value'],
            'expiry_date' => $coupon['expiry_date'],
            'is_featured' => (bool)$coupon['is_featured'],
            'is_verified' => (bool)$coupon['is_verified'],
            'click_count' => (int)$coupon['click_count'],
            'image' => !empty($coupon['image']) ? $coupon['image'] : null
        ];
    }, $coupons);

    jsonResponse($coupons);
} catch (Exception $e) {
    jsonError('Failed to fetch coupons: ' . $e->getMessage(), 500);
}
