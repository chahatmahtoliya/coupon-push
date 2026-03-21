<?php

/**
 * API Configuration
 * Common setup for all API endpoints
 */

// CORS Headers - Allow React frontend to access API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include core files
require_once dirname(__DIR__) . '/includes/functions.php';

/**
 * Send JSON response
 */
function jsonResponse($data, $success = true, $message = null)
{
    $response = [
        'success' => $success,
        'data' => $data
    ];
    if ($message) {
        $response['message'] = $message;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function jsonError($message, $code = 400)
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Get store logo URL
 */
function getStoreLogoUrl($logo)
{
    if (empty($logo)) {
        return '/uploads/stores/placeholder.png';
    }
    return '/uploads/stores/' . $logo;
}

/**
 * Get deal image URL
 */
function getDealImageUrl($image)
{
    if (empty($image)) {
        return '/uploads/deals/placeholder.png';
    }
    return '/uploads/deals/' . $image;
}
