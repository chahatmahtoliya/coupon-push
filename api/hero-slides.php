<?php

/**
 * Public reader for hero slides managed by the existing admin slider.
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

try {
    $activeOnly = !isset($_GET['active']) || filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN);
    $sql = "SELECT id, heading, subheading, badge_text, cta_label, cta_url,
                   image, alt_text, is_active, display_order
            FROM hero_slides";

    if ($activeOnly) {
        $sql .= ' WHERE is_active = 1';
    }

    $sql .= ' ORDER BY display_order ASC, id DESC';
    $slides = db()->getConnection()->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    foreach ($slides as &$slide) {
        $image = trim((string) ($slide['image'] ?? ''));
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

    jsonResponse($slides);
} catch (Throwable $error) {
    error_log('Hero slides API error: ' . $error->getMessage());
    jsonError('Unable to load hero slides', 500);
}
