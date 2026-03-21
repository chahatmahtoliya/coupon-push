<?php

/**
 * Site Constants and Configuration
 */

// Error reporting (set to 0 in production)
error_reporting(0);
ini_set('display_errors', 0);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Auto-detect environment (localhost vs production)
$isLocalhost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'])
    || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;

// Site Information - Auto-detect URL
if ($isLocalhost) {
    // Local development (XAMPP, etc.)
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    // Find the coupon-site folder in the path
    if (preg_match('/(.*?\/coupon-site)/', $basePath, $matches)) {
        define('SITE_URL', $protocol . $_SERVER['HTTP_HOST'] . $matches[1]);
    } else {
        define('SITE_URL', $protocol . $_SERVER['HTTP_HOST'] . '/coupon-site');
    }
} else {
    // Production
    define('SITE_URL', 'https://couponpush.com');
}

define('SITE_NAME', 'CouponPush');
define('SITE_TAGLINE', 'Best Coupons, Deals & Offers');
define('SITE_EMAIL', 'info@couponpush.com');

// Paths
define('ROOT_PATH', dirname(__DIR__) . '/');
define('CONFIG_PATH', ROOT_PATH . 'config/');
define('INCLUDES_PATH', ROOT_PATH . 'includes/');
define('ADMIN_PATH', ROOT_PATH . 'admin/');
define('UPLOADS_PATH', ROOT_PATH . 'uploads/');
define('ASSETS_URL', SITE_URL . '/assets/');
define('UPLOADS_URL', SITE_URL . '/uploads/');

// Upload directories
define('STORE_LOGOS_PATH', UPLOADS_PATH . 'stores/');
define('DEAL_IMAGES_PATH', UPLOADS_PATH . 'deals/');
define('STORE_LOGOS_URL', UPLOADS_URL . 'stores/');
define('DEAL_IMAGES_URL', UPLOADS_URL . 'deals/');

// Pagination
define('ITEMS_PER_PAGE', 12);
define('ADMIN_ITEMS_PER_PAGE', 20);

// Image settings
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Cache settings (in seconds)
define('CACHE_DURATION', 3600); // 1 hour

// Security
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Include database configuration
require_once CONFIG_PATH . 'database.php';
