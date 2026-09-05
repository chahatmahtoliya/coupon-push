<?php

/**
 * API: Search
 * 
 * GET /api/search.php?q=amazon - Search stores and coupons
 */

require_once __DIR__ . '/config.php';

$query = isset($_GET['q']) ? sanitize($_GET['q']) : '';

if (empty($query) || strlen($query) < 2) {
    jsonResponse([
        'stores' => [],
        'coupons' => []
    ]);
}

try {
    $searchTerm = '%' . $query . '%';

    // Search stores
    $stores = db()->fetchAll("
        SELECT 
            s.*,
            (SELECT COUNT(*) FROM coupons WHERE store_id = s.id AND status = 1) as coupon_count
        FROM stores s
        WHERE s.status = 1 
        AND (s.name LIKE ? OR s.description LIKE ?)
        ORDER BY s.is_featured DESC, coupon_count DESC
        LIMIT 10
    ", [$searchTerm, $searchTerm]);

    // Search coupons
    $coupons = db()->fetchAll("
        SELECT 
            cp.*,
            s.name as store_name,
            s.slug as store_slug,
            s.logo as store_logo,
            s.website_url as store_website_url
        FROM coupons cp
        JOIN stores s ON cp.store_id = s.id
        WHERE cp.status = 1 
        AND s.status = 1
        AND (cp.expiry_date IS NULL OR cp.expiry_date >= CURDATE())
        AND (cp.title LIKE ? OR cp.description LIKE ? OR s.name LIKE ?)
        ORDER BY cp.is_featured DESC, cp.click_count DESC
        LIMIT 20
    ", [$searchTerm, $searchTerm, $searchTerm]);

    // Transform stores
    $storesData = array_map(function ($store) {
        return [
            'id' => (int)$store['id'],
            'name' => $store['name'],
            'slug' => $store['slug'],
            'logo' => getStoreLogoUrl($store['logo']),
            'rating' => (float)($store['rating'] ?? 4.0),
            'coupon_count' => (int)$store['coupon_count']
        ];
    }, $stores);

    // Transform coupons
    $couponsData = array_map(function ($coupon) {
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
            'click_count' => (int)$coupon['click_count']
        ];
    }, $coupons);

    jsonResponse([
        'stores' => $storesData,
        'coupons' => $couponsData
    ]);
} catch (Throwable $e) {
    error_log('Search API failed: ' . $e->getMessage());
    jsonError('Search failed: ' . $e->getMessage(), 500);
}
