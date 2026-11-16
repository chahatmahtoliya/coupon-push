<?php

/**
 * API: Get Categories
 * 
 * GET /api/categories.php - All categories with coupon counts
 */

require_once __DIR__ . '/config.php';

/**
 * Admin-managed banner for the category page. Returns null when no banner image
 * is set (or the migration has not run), so the frontend keeps its built-in banner.
 */
function categoryBannerUrl($path)
{
    $path = trim((string) $path);
    if ($path === '') return null;
    if (preg_match('#^https?://#i', $path)) return $path;
    return 'https://api.couponpush.com/' . ltrim($path, '/');
}

function categoryBanner(array $category)
{
    $image = categoryBannerUrl($category['banner_image'] ?? '');
    if ($image === null) return null;
    $color = (string) ($category['banner_color'] ?? '');
    $focus = (string) ($category['banner_focus'] ?? '');
    return [
        'image' => $image,
        'image_mobile' => categoryBannerUrl($category['banner_image_mobile'] ?? ''),
        'color' => preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? strtolower($color) : null,
        'focus' => in_array($focus, ['left', 'center', 'right'], true) ? $focus : 'center',
        'heading' => trim((string) ($category['banner_heading'] ?? '')) ?: null,
        'subtitle' => trim((string) ($category['banner_subtitle'] ?? '')) ?: null,
    ];
}

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
            'banner' => categoryBanner($category),
            'created_at' => $category['created_at'] ?? null,
            'updated_at' => $category['updated_at'] ?? null
        ];
    }, $categories);

    jsonResponse($categories);
} catch (Exception $e) {
    jsonError('Failed to fetch categories: ' . $e->getMessage(), 500);
}
