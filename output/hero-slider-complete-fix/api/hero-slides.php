<?php

/**
 * Public reader for hero slides managed by the existing admin slider.
 */

// Keep this endpoint independent of deployed API helper versions. Some older
// installations do not expose the same JSON helpers or raw PDO accessor.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-CouponPush-Hero-Version: 2026-09-10-2');

function respondHeroSlides($data, $status = 200, $message = null)
{
    http_response_code($status);
    echo json_encode([
        'success' => $status === 200,
        'data' => $data,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET, OPTIONS');
    respondHeroSlides(null, 405, 'Method not allowed');
}

try {
    require_once dirname(__DIR__) . '/includes/functions.php';
    $activeOnly = !isset($_GET['active']) || filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN);
    $sql = "SELECT id, heading, subheading, badge_text, cta_label, cta_url,
                   image, alt_text, is_active, display_order
            FROM hero_slides";

    if ($activeOnly) {
        $sql .= ' WHERE is_active = 1';
    }

    $sql .= ' ORDER BY display_order ASC, id DESC';
    $statement = db()->query($sql);
    if ($statement === false) {
        throw new RuntimeException('hero_slides query failed; check the preceding database error in the PHP log');
    }
    $slides = $statement->fetchAll(PDO::FETCH_ASSOC);

    foreach ($slides as &$slide) {
        $image = trim((string) ($slide['image'] ?? ''));
        // New admin uploads live on this backend. Older media assets may only
        // exist on the media host, so retain that fallback for historical rows.
        $imagePath = parse_url($image, PHP_URL_PATH);
        if (is_string($imagePath) && preg_match('#^/?uploads/hero/([a-zA-Z0-9_.-]+)$#', $imagePath, $uploadMatch)
            && (!parse_url($image, PHP_URL_HOST) || in_array(strtolower(parse_url($image, PHP_URL_HOST)), ['couponpush.com', 'www.couponpush.com', 'api.couponpush.com', 'media.couponpush.com'], true))
            && is_file(dirname(__DIR__) . '/uploads/hero/' . $uploadMatch[1])) {
            $image = 'https://api.couponpush.com/uploads/hero/' . $uploadMatch[1];
        }
        if ($image !== '') {
            if (strpos($image, '/uploads/') === 0) {
                $image = 'https://media.couponpush.com' . $image;
            } elseif (strpos($image, 'uploads/') === 0) {
                $image = 'https://media.couponpush.com/' . $image;
            } elseif (preg_match('#^https?://(?:www\.)?couponpush\.com(/uploads/.*)$#i', $image, $matches)) {
                $image = 'https://media.couponpush.com' . $matches[1];
            }
        }

        $slide['id'] = (int) $slide['id'];
        $slide['image'] = $image;
        $slide['is_active'] = (bool) $slide['is_active'];
        $slide['display_order'] = (int) $slide['display_order'];
    }
    unset($slide);

    respondHeroSlides($slides);
} catch (Throwable $error) {
    error_log('Hero slides API error: ' . $error->getMessage());
    respondHeroSlides(null, 500, 'Unable to load hero slides. Check the server PHP error log.');
}
