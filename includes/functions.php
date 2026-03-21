<?php

/**
 * Helper Functions
 */

require_once dirname(__DIR__) . '/config/constants.php';

/**
 * Create URL-friendly slug
 */
function createSlug($string)
{
    $string = strtolower(trim($string));
    $string = preg_replace('/[^a-z0-9-]/', '-', $string);
    $string = preg_replace('/-+/', '-', $string);
    return trim($string, '-');
}

/**
 * Sanitize input
 */
function sanitize($input)
{
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Redirect to URL
 */
function redirect($url)
{
    // If headers haven't been sent, use normal redirect
    if (!headers_sent()) {
        header("Location: " . $url);
        exit;
    }

    // Fallback to JavaScript redirect if headers already sent
    echo '<script type="text/javascript">window.location.href="' . $url . '";</script>';
    echo '<noscript><meta http-equiv="refresh" content="0;url=' . $url . '"></noscript>';
    exit;
}

/**
 * Format date
 */
function formatDate($date, $format = 'M d, Y')
{
    if (empty($date)) return '';
    return date($format, strtotime($date));
}

/**
 * Check if date is expired
 */
function isExpired($date)
{
    if (empty($date)) return false;
    return strtotime($date) < strtotime('today');
}

/**
 * Days until expiry
 */
function daysUntilExpiry($date)
{
    if (empty($date)) return null;
    $diff = strtotime($date) - strtotime('today');
    return max(0, floor($diff / 86400));
}

/**
 * Truncate text
 */
function truncate($text, $length = 100, $suffix = '...')
{
    if (strlen($text) <= $length) return $text;
    return substr($text, 0, $length) . $suffix;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken()
{
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token)
{
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * Get CSRF input field
 */
function csrfField()
{
    return '<input type="hidden" name="' . CSRF_TOKEN_NAME . '" value="' . generateCSRFToken() . '">';
}

/**
 * Flash message management
 */
function setFlash($type, $message)
{
    $_SESSION['flash'] = [
        'type' => $type,
        'message' => $message
    ];
}

function getFlash()
{
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

function displayFlash()
{
    $flash = getFlash();
    if ($flash) {
        $type = $flash['type'];
        $message = $flash['message'];
        $alertClass = $type === 'success' ? 'alert-success' : ($type === 'error' ? 'alert-danger' : 'alert-info');
        return "<div class='alert {$alertClass} alert-dismissible fade show' role='alert'>
                    {$message}
                    <button type='button' class='btn-close' data-bs-dismiss='alert'></button>
                </div>";
    }
    return '';
}

/**
 * Check if user is logged in (admin)
 */
function isLoggedIn()
{
    return isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);
}

/**
 * Require login
 */
function requireLogin()
{
    if (!isLoggedIn()) {
        setFlash('error', 'Please login to access this page.');
        redirect(SITE_URL . '/admin/login.php');
    }
}

/**
 * Get current admin user
 */
function getCurrentUser()
{
    if (!isLoggedIn()) return null;
    return db()->fetch("SELECT * FROM users WHERE id = ?", [$_SESSION['admin_id']]);
}

/**
 * Pagination helper
 */
function paginate($totalItems, $currentPage, $itemsPerPage = ITEMS_PER_PAGE)
{
    $totalPages = ceil($totalItems / $itemsPerPage);
    $currentPage = max(1, min($currentPage, $totalPages));
    $offset = ($currentPage - 1) * $itemsPerPage;

    return [
        'total_items' => $totalItems,
        'total_pages' => $totalPages,
        'current_page' => $currentPage,
        'items_per_page' => $itemsPerPage,
        'offset' => $offset,
        'has_prev' => $currentPage > 1,
        'has_next' => $currentPage < $totalPages
    ];
}

/**
 * Generate pagination HTML
 */
function paginationHTML($pagination, $baseUrl)
{
    if ($pagination['total_pages'] <= 1) return '';

    // Preserve existing query params in base URLs like `category.php?slug=...`.
    $separator = '?';
    if (strpos($baseUrl, '?') !== false) {
        $lastChar = substr($baseUrl, -1);
        $separator = ($lastChar === '?' || $lastChar === '&') ? '' : '&';
    }

    $html = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';

    // Previous button
    if ($pagination['has_prev']) {
        $html .= '<li class="page-item"><a class="page-link" href="' . $baseUrl . $separator . 'page=' . ($pagination['current_page'] - 1) . '">Previous</a></li>';
    }

    // Page numbers
    for ($i = 1; $i <= $pagination['total_pages']; $i++) {
        if ($i == $pagination['current_page']) {
            $html .= '<li class="page-item active"><span class="page-link">' . $i . '</span></li>';
        } else {
            $html .= '<li class="page-item"><a class="page-link" href="' . $baseUrl . $separator . 'page=' . $i . '">' . $i . '</a></li>';
        }
    }

    // Next button
    if ($pagination['has_next']) {
        $html .= '<li class="page-item"><a class="page-link" href="' . $baseUrl . $separator . 'page=' . ($pagination['current_page'] + 1) . '">Next</a></li>';
    }

    $html .= '</ul></nav>';
    return $html;
}

/**
 * Get setting value
 */
function getSetting($key, $default = '')
{
    $result = db()->fetch("SELECT setting_value FROM settings WHERE setting_key = ?", [$key]);
    return $result ? $result['setting_value'] : $default;
}

/**
 * Update setting value
 */
function updateSetting($key, $value)
{
    return db()->update("UPDATE settings SET setting_value = ? WHERE setting_key = ?", [$value, $key]);
}

/**
 * Track click
 */
function trackClick($type, $id)
{
    $data = [
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'referrer' => $_SERVER['HTTP_REFERER'] ?? null
    ];

    if ($type === 'coupon') {
        db()->insert(
            "INSERT INTO click_tracking (coupon_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)",
            [$id, $data['ip_address'], $data['user_agent'], $data['referrer']]
        );
        db()->update("UPDATE coupons SET click_count = click_count + 1 WHERE id = ?", [$id]);
    } elseif ($type === 'deal') {
        db()->insert(
            "INSERT INTO click_tracking (deal_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)",
            [$id, $data['ip_address'], $data['user_agent'], $data['referrer']]
        );
        db()->update("UPDATE deals SET click_count = click_count + 1 WHERE id = ?", [$id]);
    } elseif ($type === 'store') {
        db()->insert(
            "INSERT INTO click_tracking (store_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)",
            [$id, $data['ip_address'], $data['user_agent'], $data['referrer']]
        );
        db()->update("UPDATE stores SET click_count = click_count + 1 WHERE id = ?", [$id]);
    }
}

/**
 * Get featured coupons
 */
function getFeaturedCoupons($limit = 8)
{
    return db()->fetchAll("
        SELECT c.*, s.name as store_name, s.slug as store_slug, s.logo as store_logo,
               s.website_url as store_website_url, s.affiliate_url as store_affiliate_url,
               cat.name as category_name
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.status = 1 AND c.is_featured = 1 
        AND (c.expiry_date IS NULL OR c.expiry_date >= CURDATE())
        ORDER BY c.display_order ASC, c.created_at DESC
        LIMIT ?
    ", [$limit]);
}

/**
 * Get latest coupons
 */
function getLatestCoupons($limit = 12)
{
    return db()->fetchAll("
        SELECT c.*, s.name as store_name, s.slug as store_slug, s.logo as store_logo,
               s.website_url as store_website_url, s.affiliate_url as store_affiliate_url,
               cat.name as category_name
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.status = 1 AND (c.expiry_date IS NULL OR c.expiry_date >= CURDATE())
        ORDER BY c.created_at DESC
        LIMIT ?
    ", [$limit]);
}

/**
 * Get featured stores
 */
function getFeaturedStores($limit = 8)
{
    return db()->fetchAll("
        SELECT s.*, c.name as category_name,
        (SELECT COUNT(*) FROM coupons WHERE store_id = s.id AND status = 1) as coupon_count
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.status = 1 AND s.is_featured = 1
        ORDER BY s.click_count DESC
        LIMIT ?
    ", [$limit]);
}

/**
 * Get all categories
 */
function getAllCategories()
{
    return db()->fetchAll("
        SELECT c.*,
        (
            SELECT COUNT(*)
            FROM coupons cp
            LEFT JOIN stores s ON cp.store_id = s.id
            WHERE cp.status = 1
            AND (cp.expiry_date IS NULL OR cp.expiry_date >= CURDATE())
            AND (
                cp.category_id = c.id
                OR (cp.category_id IS NULL AND s.category_id = c.id)
            )
        ) as coupon_count,
        (
            SELECT COUNT(*)
            FROM deals d
            LEFT JOIN stores ds ON d.store_id = ds.id
            WHERE d.status = 1
            AND (d.expiry_date IS NULL OR d.expiry_date >= CURDATE())
            AND (
                d.category_id = c.id
                OR (d.category_id IS NULL AND ds.category_id = c.id)
            )
        ) as deal_count
        FROM categories c
        WHERE c.status = 1
        ORDER BY c.display_order ASC
    ");
}

/**
 * Get featured deals
 */
function getFeaturedDeals($limit = 6)
{
    return db()->fetchAll("
        SELECT d.*, s.name as store_name, s.slug as store_slug, s.logo as store_logo
        FROM deals d
        LEFT JOIN stores s ON d.store_id = s.id
        WHERE d.status = 1 AND d.is_featured = 1
        AND (d.expiry_date IS NULL OR d.expiry_date >= CURDATE())
        ORDER BY d.created_at DESC
        LIMIT ?
    ", [$limit]);
}

/**
 * Format discount display
 */
function formatDiscount($coupon)
{
    if ($coupon['discount_type'] === 'percentage') {
        return $coupon['discount_value'] . '% OFF';
    } elseif ($coupon['discount_type'] === 'flat') {
        return '₹' . $coupon['discount_value'] . ' OFF';
    } elseif ($coupon['discount_type'] === 'cashback') {
        return $coupon['discount_value'] . ' Cashback';
    } else {
        return $coupon['discount_value'];
    }
}

/**
 * Get coupon badge
 */
function getCouponBadge($coupon)
{
    if ($coupon['is_exclusive']) {
        return '<span class="badge bg-warning text-dark">Exclusive</span>';
    } elseif ($coupon['is_verified']) {
        return '<span class="badge bg-success">Verified</span>';
    } elseif ($coupon['coupon_type'] === 'deal') {
        return '<span class="badge bg-info">Deal</span>';
    }
    return '';
}

/**
 * Upload image
 */
function uploadImage($file, $destination, $prefix = '')
{
    if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
        return ['success' => false, 'message' => 'No file uploaded'];
    }

    // Check file size
    if ($file['size'] > MAX_UPLOAD_SIZE) {
        return ['success' => false, 'message' => 'File size exceeds limit'];
    }

    // Check file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, ALLOWED_IMAGE_TYPES)) {
        return ['success' => false, 'message' => 'Invalid file type'];
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $prefix . uniqid() . '_' . time() . '.' . strtolower($extension);
    $filepath = $destination . $filename;

    // Create directory if not exists
    if (!is_dir($destination)) {
        mkdir($destination, 0755, true);
    }

    // Move file
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return ['success' => true, 'filename' => $filename];
    }

    return ['success' => false, 'message' => 'Failed to upload file'];
}

/**
 * Delete image
 */
function deleteImage($path)
{
    if (file_exists($path)) {
        return unlink($path);
    }
    return false;
}

/**
 * Get store logo URL
 */
function getStoreLogo($logo)
{
    if (empty($logo)) {
        return ASSETS_URL . 'images/store-placeholder.png';
    }
    return STORE_LOGOS_URL . $logo;
}

/**
 * Get deal image URL
 */
function getDealImage($image)
{
    if (empty($image)) {
        return ASSETS_URL . 'images/deal-placeholder.png';
    }
    return DEAL_IMAGES_URL . $image;
}

/**
 * Search coupons and stores
 */
function search($query, $limit = 20)
{
    $searchTerm = '%' . $query . '%';

    $coupons = db()->fetchAll("
        SELECT c.*, s.name as store_name, s.slug as store_slug, 'coupon' as result_type
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        WHERE c.status = 1 
        AND (c.title LIKE ? OR c.description LIKE ? OR c.code LIKE ? OR s.name LIKE ?)
        AND (c.expiry_date IS NULL OR c.expiry_date >= CURDATE())
        ORDER BY c.is_featured DESC, c.click_count DESC
        LIMIT ?
    ", [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]);

    $stores = db()->fetchAll("
        SELECT s.*, 'store' as result_type
        FROM stores s
        WHERE s.status = 1 AND (s.name LIKE ? OR s.description LIKE ?)
        ORDER BY s.is_featured DESC, s.click_count DESC
        LIMIT ?
    ", [$searchTerm, $searchTerm, $limit]);

    return [
        'coupons' => $coupons,
        'stores' => $stores
    ];
}
