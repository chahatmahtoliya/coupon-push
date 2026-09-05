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
    // Bulk CSV files can contain invalid legacy-encoded bytes. A single bad value
    // must not turn the entire public catalog response into an empty HTTP 500.
    $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('API JSON encoding failed: ' . json_last_error_msg());
        http_response_code(500);
        echo '{"success":false,"message":"Unable to encode API response","data":null}';
        exit();
    }
    echo $json;
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
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit();
}

/**
 * Get store logo URL
 */
function getStoreLogoUrl($logo)
{
    $logo = trim((string) $logo);
    if ($logo === '' || strtolower(basename($logo)) === 'placeholder.png') {
        return 'https://couponpush.com/placeholder-store.png';
    }
    if (preg_match('#^https?://#i', $logo)) return $logo;
    if (strpos($logo, '/uploads/') === 0) return 'https://api.couponpush.com' . $logo;
    if (strpos($logo, 'uploads/') === 0) return 'https://api.couponpush.com/' . $logo;
    return 'https://api.couponpush.com/uploads/stores/' . rawurlencode(basename($logo));
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
