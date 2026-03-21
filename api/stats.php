<?php

/**
 * API: Homepage Stats
 * 
 * GET /api/stats.php - Get homepage statistics
 */

require_once __DIR__ . '/config.php';

try {
    // Get total active coupons
    $totalCoupons = db()->fetch("
        SELECT COUNT(*) as count 
        FROM coupons 
        WHERE status = 1 
        AND (expiry_date IS NULL OR expiry_date >= CURDATE())
    ")['count'];

    // Get total active stores
    $totalStores = db()->fetch("
        SELECT COUNT(*) as count 
        FROM stores 
        WHERE status = 1
    ")['count'];

    // Get total savings (estimated from click counts)
    $totalClicks = db()->fetch("
        SELECT SUM(click_count) as total 
        FROM coupons 
        WHERE status = 1
    ")['total'] ?? 0;

    // Estimate savings (₹500 average per use)
    $estimatedSavings = $totalClicks * 500;

    // Format savings
    if ($estimatedSavings >= 10000000) {
        $savingsFormatted = '₹' . round($estimatedSavings / 10000000, 1) . 'Cr+';
    } elseif ($estimatedSavings >= 100000) {
        $savingsFormatted = '₹' . round($estimatedSavings / 100000, 1) . 'L+';
    } else {
        $savingsFormatted = '₹' . number_format($estimatedSavings) . '+';
    }

    jsonResponse([
        'total_coupons' => (int)$totalCoupons,
        'total_stores' => (int)$totalStores,
        'total_savings' => $savingsFormatted
    ]);
} catch (Exception $e) {
    jsonError('Failed to fetch stats: ' . $e->getMessage(), 500);
}
