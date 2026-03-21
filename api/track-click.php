<?php

/**
 * API: Track Click
 * 
 * POST /api/track-click.php
 * Body: { "type": "coupon"|"deal", "id": 123 }
 */

// Suppress HTML error output
ini_set('display_errors', 0);
error_reporting(0);

// Set JSON header first
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

// Get JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['type']) || !isset($input['id'])) {
    jsonError('Invalid request body', 400);
}

$type = sanitize($input['type']);
$id = (int)$input['id'];

if (!in_array($type, ['coupon', 'deal'])) {
    jsonError('Invalid type', 400);
}

if ($id <= 0) {
    jsonError('Invalid ID', 400);
}

try {
    if ($type === 'coupon') {
        db()->update("UPDATE coupons SET click_count = click_count + 1 WHERE id = ?", [$id]);
    } else {
        db()->update("UPDATE deals SET click_count = click_count + 1 WHERE id = ?", [$id]);
    }

    jsonResponse(['tracked' => true]);
} catch (Exception $e) {
    jsonError('Failed to track click: ' . $e->getMessage(), 500);
}
