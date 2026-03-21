<?php

/**
 * API: Get Single Store with Coupons
 * 
 * GET /api/store.php?slug=amazon
 */

require_once __DIR__ . '/config.php';

$slug = isset($_GET['slug']) ? sanitize($_GET['slug']) : '';

if (empty($slug)) {
    jsonError('Store slug is required', 400);
}

try {
    // Get store
    $store = db()->fetch("
        SELECT 
            s.*,
            c.name as category_name,
            c.slug as category_slug
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.slug = ? AND s.status = 1
    ", [$slug]);

    if (!$store) {
        jsonError('Store not found', 404);
    }

    // Get coupons for this store
    $coupons = db()->fetchAll("
        SELECT 
            cp.*,
            s.name as store_name,
            s.slug as store_slug,
            s.logo as store_logo,
            s.website_url as store_website_url
        FROM coupons cp
        JOIN stores s ON cp.store_id = s.id
        WHERE cp.store_id = ? 
        AND cp.status = 1 
        AND (cp.expiry_date IS NULL OR cp.expiry_date >= CURDATE())
        ORDER BY cp.is_featured DESC, cp.created_at DESC
    ", [$store['id']]);

    // Get related stores (same category)
    $relatedStores = db()->fetchAll("
        SELECT 
            s.*,
            (SELECT COUNT(*) FROM coupons WHERE store_id = s.id AND status = 1) as coupon_count
        FROM stores s
        WHERE s.category_id = ? 
        AND s.id != ? 
        AND s.status = 1
        ORDER BY s.is_featured DESC, coupon_count DESC
        LIMIT 6
    ", [$store['category_id'], $store['id']]);

    // Transform store data
    $storeData = [
        'id' => (int)$store['id'],
        'name' => $store['name'],
        'slug' => $store['slug'],
        'logo' => getStoreLogoUrl($store['logo']),
        'website_url' => $store['website_url'],
        'description' => $store['description'],
        'about_content' => $store['about_content'] ?? '',
        'howto_content' => $store['howto_content'] ?? '',
        'terms_content' => $store['terms_content'] ?? '',
        'rating' => (float)($store['rating'] ?? 4.0),
        'is_featured' => (bool)$store['is_featured'],
        'category_id' => (int)$store['category_id'],
        'category_name' => $store['category_name'],
        'category_slug' => $store['category_slug']
    ];

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
            'click_count' => (int)$coupon['click_count'],
            'image' => !empty($coupon['image']) ? $coupon['image'] : null
        ];
    }, $coupons);

    // Transform related stores
    $relatedData = array_map(function ($related) {
        return [
            'id' => (int)$related['id'],
            'name' => $related['name'],
            'slug' => $related['slug'],
            'logo' => getStoreLogoUrl($related['logo']),
            'rating' => (float)($related['rating'] ?? 4.0),
            'coupon_count' => (int)$related['coupon_count']
        ];
    }, $relatedStores);

    jsonResponse([
        'store' => $storeData,
        'coupons' => $couponsData,
        'related_stores' => $relatedData
    ]);
} catch (Exception $e) {
    jsonError('Failed to fetch store: ' . $e->getMessage(), 500);
}
