<?php

/**
 * Dynamic XML Sitemap Generator for CouponPush
 * Generates sitemap with all stores, categories, and static pages
 * Access: https://couponpush.com/api/sitemap.php
 * 
 * For robots.txt, add: Sitemap: https://couponpush.com/api/sitemap.php
 */

require_once 'config.php';

header('Content-Type: application/xml; charset=utf-8');

$baseUrl = 'https://couponpush.com';
$today = date('Y-m-d');

// Start XML
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Static Pages -->
    <url>
        <loc><?php echo $baseUrl; ?>/</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/stores</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/categories</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/about</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/contact</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/terms</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc><?php echo $baseUrl; ?>/privacy-policy</loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>

    <?php
    // Get all active stores
    try {
        $stmt = $pdo->query("
        SELECT slug, updated_at 
        FROM stores 
        WHERE is_active = 1 
        ORDER BY is_featured DESC, name ASC
    ");
        $stores = $stmt->fetchAll();

        foreach ($stores as $store) {
            $lastmod = $store['updated_at'] ? date('Y-m-d', strtotime($store['updated_at'])) : $today;
            echo "    <url>\n";
            echo "        <loc>{$baseUrl}/store/{$store['slug']}</loc>\n";
            echo "        <lastmod>{$lastmod}</lastmod>\n";
            echo "        <changefreq>daily</changefreq>\n";
            echo "        <priority>0.8</priority>\n";
            echo "    </url>\n";
        }
    } catch (PDOException $e) {
        // Skip stores if error
    }

    // Get all categories
    try {
        $stmt = $pdo->query("
        SELECT slug, updated_at 
        FROM categories 
        WHERE is_active = 1 
        ORDER BY name ASC
    ");
        $categories = $stmt->fetchAll();

        foreach ($categories as $category) {
            $lastmod = $category['updated_at'] ? date('Y-m-d', strtotime($category['updated_at'])) : $today;
            echo "    <url>\n";
            echo "        <loc>{$baseUrl}/category/{$category['slug']}</loc>\n";
            echo "        <lastmod>{$lastmod}</lastmod>\n";
            echo "        <changefreq>daily</changefreq>\n";
            echo "        <priority>0.7</priority>\n";
            echo "    </url>\n";
        }
    } catch (PDOException $e) {
        // Skip categories if error
    }

    // Get popular coupons (optional - for individual coupon pages)
    try {
        $stmt = $pdo->query("
        SELECT id, updated_at 
        FROM coupons 
        WHERE is_active = 1 
        AND (expiry_date IS NULL OR expiry_date >= CURDATE())
        ORDER BY click_count DESC
        LIMIT 100
    ");
        $coupons = $stmt->fetchAll();

        foreach ($coupons as $coupon) {
            $lastmod = $coupon['updated_at'] ? date('Y-m-d', strtotime($coupon['updated_at'])) : $today;
            echo "    <url>\n";
            echo "        <loc>{$baseUrl}/coupon/{$coupon['id']}</loc>\n";
            echo "        <lastmod>{$lastmod}</lastmod>\n";
            echo "        <changefreq>weekly</changefreq>\n";
            echo "        <priority>0.6</priority>\n";
            echo "    </url>\n";
        }
    } catch (PDOException $e) {
        // Skip coupons if error
    }
    ?>
</urlset>