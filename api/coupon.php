<?php

/**
 * API: Get Single Coupon by ID
 * 
 * GET /api/coupon.php?id=1 - Get coupon by ID
 */

require_once __DIR__ . '/config.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (!$id) {
    jsonError('Coupon ID is required', 400);
}

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
        WHERE cp.id = ?
        AND cp.status = 1 
        AND s.status = 1
    ";

    $coupon = db()->fetch($sql, [$id]);

    if (!$coupon) {
        jsonError('Coupon not found', 404);
    }

    // Transform data
    $result = [
        'id' => (int)$coupon['id'],
        'store_id' => (int)$coupon['store_id'],
        'store_name' => $coupon['store_name'],
        'store_slug' => $coupon['store_slug'],
        'store_logo' => getStoreLogoUrl($coupon['store_logo']),
        'store_website_url' => $coupon['store_website_url'],
        'title' => $coupon['title'],
        'description' => $coupon['description'],
        'code' => $coupon['code'],
        'coupon_type' => $coupon['coupon_type'] ?? null,
        'discount_type' => $coupon['discount_type'],
        'discount_value' => (float)$coupon['discount_value'],
        'expiry_date' => $coupon['expiry_date'],
        'is_featured' => (bool)$coupon['is_featured'],
        'is_verified' => (bool)$coupon['is_verified'],
        'click_count' => (int)$coupon['click_count'],
        'affiliate_link' => $coupon['affiliate_link'] ?? null,
        'created_at' => $coupon['created_at'] ?? null,
        'updated_at' => $coupon['updated_at'] ?? null
    ];

    jsonResponse($result);
} catch (Exception $e) {
    jsonError('Failed to fetch coupon: ' . $e->getMessage(), 500);
}
