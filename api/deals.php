<?php

/**
 * API: Get Deals
 * 
 * GET /api/deals.php - All deals
 * GET /api/deals.php?featured=1 - Featured deals only
 * GET /api/deals.php?limit=10 - Limit results
 */

require_once __DIR__ . '/config.php';

$featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : false;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

try {
    // Check if deals table exists
    $tableCheck = db()->fetch("SHOW TABLES LIKE 'deals'");
    if (!$tableCheck) {
        // Return empty array if table doesn't exist
        jsonResponse([]);
    }

    $sql = "
        SELECT 
            d.*,
            s.name as store_name,
            s.slug as store_slug
        FROM deals d
        JOIN stores s ON d.store_id = s.id
        WHERE d.status = 1 AND s.status = 1
    ";

    $params = [];

    if ($featured) {
        $sql .= " AND d.is_featured = 1";
    }

    $sql .= " ORDER BY d.is_featured DESC, d.created_at DESC LIMIT ?";
    $params[] = $limit;

    $deals = db()->fetchAll($sql, $params);

    // Transform data
    $deals = array_map(function ($deal) {
        return [
            'id' => (int)$deal['id'],
            'title' => $deal['title'],
            'description' => $deal['description'] ?? '',
            'image' => getDealImageUrl($deal['image'] ?? ''),
            'store_id' => (int)$deal['store_id'],
            'store_name' => $deal['store_name'],
            'store_slug' => $deal['store_slug'],
            'url' => $deal['url'] ?? '',
            'is_featured' => (bool)($deal['is_featured'] ?? false)
        ];
    }, $deals);

    jsonResponse($deals);
} catch (Exception $e) {
    // Return empty array on error to prevent breaking the frontend
    jsonResponse([]);
}
