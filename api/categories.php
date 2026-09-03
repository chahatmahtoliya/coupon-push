<?php

/**
 * API: Get Categories
 * 
 * GET /api/categories.php - All categories with coupon counts
 */

require_once __DIR__ . '/config.php';

try {
    $categories = db()->fetchAll("
        SELECT 
            c.*,
            (
                SELECT COUNT(*) 
                FROM coupons cp 
                JOIN stores s ON cp.store_id = s.id 
                WHERE s.category_id = c.id 
                AND cp.status = 1 
                AND s.status = 1
                AND (cp.expiry_date IS NULL OR cp.expiry_date >= CURDATE())
            ) as coupon_count
        FROM categories c
        WHERE c.status = 1
        ORDER BY c.display_order ASC, c.name ASC
    ");

    // Transform data
    $categories = array_map(function ($category) {
        return [
            'id' => (int)$category['id'],
            'name' => $category['name'],
            'slug' => $category['slug'],
            'icon' => $category['icon'] ?? null,
            'description' => $category['description'] ?? '',
            'coupon_count' => (int)$category['coupon_count'],
            'created_at' => $category['created_at'] ?? null,
            'updated_at' => $category['updated_at'] ?? null
        ];
    }, $categories);

    jsonResponse($categories);
} catch (Exception $e) {
    jsonError('Failed to fetch categories: ' . $e->getMessage(), 500);
}
