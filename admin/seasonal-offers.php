<?php

/**
 * Admin - Manage Seasonal Offers
 * Festival/occasion-based promotional banners
 */

$pageTitle = 'Seasonal Offers';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = intval($_GET['id'] ?? 0);

// Get all active coupons for assignment
$allCoupons = db()->fetchAll("
    SELECT c.id, c.title, c.code, s.name as store_name 
    FROM coupons c 
    JOIN stores s ON c.store_id = s.id 
    WHERE c.status = 1 
    ORDER BY c.created_at DESC
");

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle banner image upload
    $bannerImage = '';
    if (!empty($_FILES['banner_image_file']['name'])) {
        $uploadDir = '../uploads/seasonal/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = strtolower(pathinfo($_FILES['banner_image_file']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (in_array($ext, $allowed) && $_FILES['banner_image_file']['size'] <= 5 * 1024 * 1024) {
            $filename = 'seasonal_' . time() . '_' . uniqid() . '.' . $ext;
            $targetPath = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['banner_image_file']['tmp_name'], $targetPath)) {
                $bannerImage = '/uploads/seasonal/' . $filename;
            }
        }
    }

    // Use uploaded image or URL input
    $bannerValue = $bannerImage ?: sanitize($_POST['banner_image'] ?? '');

    // Generate slug from name
    $name = sanitize($_POST['name'] ?? '');
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
    $slug = trim($slug, '-');

    $data = [
        'name' => $name,
        'slug' => $slug,
        'description' => sanitize($_POST['description'] ?? ''),
        'banner_image' => $bannerValue,
        'theme_color' => sanitize($_POST['theme_color'] ?? '#FF6B35'),
        'gradient_start' => sanitize($_POST['gradient_start'] ?? ''),
        'gradient_end' => sanitize($_POST['gradient_end'] ?? ''),
        'start_date' => $_POST['start_date'] ?? null,
        'end_date' => $_POST['end_date'] ?? null,
        'is_active' => isset($_POST['is_active']) ? 1 : 0,
        'display_order' => intval($_POST['display_order'] ?? 0)
    ];

    if ($action === 'add') {
        $result = db()->insert(
            "INSERT INTO seasonal_offers (name, slug, description, banner_image, theme_color, 
             gradient_start, gradient_end, start_date, end_date, is_active, display_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            array_values($data)
        );

        if ($result) {
            $offerId = db()->lastInsertId();

            // Assign selected coupons
            $selectedCoupons = $_POST['coupons'] ?? [];
            foreach ($selectedCoupons as $order => $couponId) {
                db()->insert(
                    "INSERT INTO seasonal_offer_coupons (seasonal_offer_id, coupon_id, display_order) VALUES (?, ?, ?)",
                    [$offerId, intval($couponId), $order]
                );
            }

            setFlash('success', 'Seasonal offer created successfully!');
            redirect(SITE_URL . '/admin/seasonal-offers.php');
        } else {
            setFlash('error', 'Failed to create seasonal offer.');
        }
    } elseif ($action === 'edit' && $id > 0) {
        $result = db()->update(
            "UPDATE seasonal_offers SET name = ?, slug = ?, description = ?, banner_image = ?, 
             theme_color = ?, gradient_start = ?, gradient_end = ?, start_date = ?, end_date = ?, 
             is_active = ?, display_order = ? WHERE id = ?",
            [...array_values($data), $id]
        );

        if ($result !== false) {
            // Update coupon assignments
            db()->delete("DELETE FROM seasonal_offer_coupons WHERE seasonal_offer_id = ?", [$id]);

            $selectedCoupons = $_POST['coupons'] ?? [];
            foreach ($selectedCoupons as $order => $couponId) {
                db()->insert(
                    "INSERT INTO seasonal_offer_coupons (seasonal_offer_id, coupon_id, display_order) VALUES (?, ?, ?)",
                    [$id, intval($couponId), $order]
                );
            }

            setFlash('success', 'Seasonal offer updated successfully!');
            redirect(SITE_URL . '/admin/seasonal-offers.php');
        } else {
            setFlash('error', 'Failed to update seasonal offer.');
        }
    }
}

// Handle delete
if ($action === 'delete' && $id > 0) {
    db()->delete("DELETE FROM seasonal_offers WHERE id = ?", [$id]);
    setFlash('success', 'Seasonal offer deleted successfully!');
    redirect(SITE_URL . '/admin/seasonal-offers.php');
}

// Get offer for edit
$offer = null;
$offerCoupons = [];
if ($action === 'edit' && $id > 0) {
    $offer = db()->fetch("SELECT * FROM seasonal_offers WHERE id = ?", [$id]);
    if (!$offer) {
        redirect(SITE_URL . '/admin/seasonal-offers.php');
    }
    $offerCoupons = db()->fetchAll(
        "SELECT coupon_id FROM seasonal_offer_coupons WHERE seasonal_offer_id = ? ORDER BY display_order",
        [$id]
    );
    $offerCoupons = array_column($offerCoupons, 'coupon_id');
}
?>

<?php if ($action === 'list'): ?>
    <!-- Seasonal Offers List -->
    <div class="page-header d-flex justify-content-between align-items-center">
        <div>
            <h1 class="page-title">Seasonal Offers</h1>
            <p class="page-subtitle">Manage festival and occasion-based promotional banners</p>
        </div>
        <a href="?action=add" class="btn btn-primary">
            <i class="fas fa-plus me-2"></i> Add Seasonal Offer
        </a>
    </div>

    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th width="50">#</th>
                            <th>Name</th>
                            <th>Theme</th>
                            <th>Date Range</th>
                            <th>Coupons</th>
                            <th>Status</th>
                            <th width="120">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $offers = db()->fetchAll("
                            SELECT so.*, 
                                   (SELECT COUNT(*) FROM seasonal_offer_coupons WHERE seasonal_offer_id = so.id) as coupon_count
                            FROM seasonal_offers so
                            ORDER BY so.display_order ASC, so.start_date DESC
                        ");

                        foreach ($offers as $o):
                            $isActive = $o['is_active'] && strtotime($o['start_date']) <= time() && strtotime($o['end_date']) >= time();
                        ?>
                            <tr>
                                <td><?php echo $o['id']; ?></td>
                                <td>
                                    <div class="fw-medium"><?php echo sanitize($o['name']); ?></div>
                                    <small class="text-muted">/offers/<?php echo sanitize($o['slug']); ?></small>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <div style="width: 24px; height: 24px; border-radius: 4px; background: <?php echo sanitize($o['theme_color']); ?>;"></div>
                                        <span class="small"><?php echo sanitize($o['theme_color']); ?></span>
                                    </div>
                                </td>
                                <td>
                                    <div><?php echo formatDate($o['start_date']); ?></div>
                                    <small class="text-muted">to <?php echo formatDate($o['end_date']); ?></small>
                                </td>
                                <td>
                                    <span class="badge bg-secondary"><?php echo $o['coupon_count']; ?> coupons</span>
                                </td>
                                <td>
                                    <?php if ($isActive): ?>
                                        <span class="badge bg-success">Live</span>
                                    <?php elseif ($o['is_active']): ?>
                                        <span class="badge bg-warning text-dark">Scheduled</span>
                                    <?php else: ?>
                                        <span class="badge bg-secondary">Inactive</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="?action=edit&id=<?php echo $o['id']; ?>" class="btn btn-sm btn-outline-primary" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <a href="?action=delete&id=<?php echo $o['id']; ?>" class="btn btn-sm btn-outline-danger"
                                        onclick="return confirm('Are you sure you want to delete this offer?');" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        <?php if (empty($offers)): ?>
                            <tr>
                                <td colspan="7" class="text-center py-4">
                                    <p class="text-muted mb-0">No seasonal offers yet. Create your first one!</p>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

<?php else: ?>
    <!-- Add/Edit Seasonal Offer Form -->
    <div class="page-header">
        <h1 class="page-title"><?php echo $action === 'add' ? 'Add Seasonal Offer' : 'Edit Seasonal Offer'; ?></h1>
        <p class="page-subtitle">
            <a href="?">← Back to Seasonal Offers</a>
        </p>
    </div>

    <div class="card">
        <div class="card-body">
            <form method="POST" action="" enctype="multipart/form-data">
                <div class="row g-4">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label class="form-label">Offer Name *</label>
                            <input type="text" name="name" class="form-control"
                                value="<?php echo sanitize($offer['name'] ?? ''); ?>"
                                placeholder="e.g., Holi Special Offers, Valentine's Day Sale"
                                required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" rows="3"
                                placeholder="Brief description about this seasonal offer"><?php echo sanitize($offer['description'] ?? ''); ?></textarea>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Banner Image</label>
                            <?php if (!empty($offer['banner_image'])): ?>
                                <div class="mb-2">
                                    <img src="<?php echo sanitize($offer['banner_image']); ?>" alt="Current Banner"
                                        style="max-width: 300px; max-height: 150px; border-radius: 8px; border: 1px solid #ddd;">
                                </div>
                            <?php endif; ?>
                            <input type="file" name="banner_image_file" class="form-control mb-2" accept="image/*">
                            <small class="text-muted">Recommended size: 1200x400px (JPG, PNG, WebP - max 5MB)</small>
                            <div class="mt-2">
                                <label class="form-label small text-muted">Or paste image URL:</label>
                                <input type="url" name="banner_image" class="form-control"
                                    value="<?php echo sanitize($offer['banner_image'] ?? ''); ?>"
                                    placeholder="https://example.com/banner.jpg">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Assign Coupons</label>
                            <select name="coupons[]" class="form-select" multiple size="10">
                                <?php foreach ($allCoupons as $coupon): ?>
                                    <option value="<?php echo $coupon['id']; ?>"
                                        <?php echo in_array($coupon['id'], $offerCoupons) ? 'selected' : ''; ?>>
                                        <?php echo sanitize($coupon['store_name']); ?> - <?php echo sanitize(truncate($coupon['title'], 50)); ?>
                                        <?php echo $coupon['code'] ? '(' . $coupon['code'] . ')' : ''; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <small class="text-muted">Hold Ctrl/Cmd to select multiple coupons</small>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Theme Color *</label>
                            <input type="color" name="theme_color" class="form-control form-control-color"
                                value="<?php echo sanitize($offer['theme_color'] ?? '#FF6B35'); ?>" style="width: 100%; height: 50px;">
                        </div>

                        <div class="row">
                            <div class="col-6">
                                <div class="mb-3">
                                    <label class="form-label">Gradient Start</label>
                                    <input type="color" name="gradient_start" class="form-control form-control-color"
                                        value="<?php echo sanitize($offer['gradient_start'] ?? '#FF6B35'); ?>" style="width: 100%;">
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="mb-3">
                                    <label class="form-label">Gradient End</label>
                                    <input type="color" name="gradient_end" class="form-control form-control-color"
                                        value="<?php echo sanitize($offer['gradient_end'] ?? '#FF9A56'); ?>" style="width: 100%;">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Start Date *</label>
                            <input type="date" name="start_date" class="form-control"
                                value="<?php echo $offer['start_date'] ?? ''; ?>" required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">End Date *</label>
                            <input type="date" name="end_date" class="form-control"
                                value="<?php echo $offer['end_date'] ?? ''; ?>" required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Display Order</label>
                            <input type="number" name="display_order" class="form-control"
                                value="<?php echo $offer['display_order'] ?? 0; ?>" min="0">
                            <small class="text-muted">Lower number = higher priority</small>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_active" id="is_active"
                                    <?php echo ($offer['is_active'] ?? 1) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_active">Active</label>
                            </div>
                            <small class="text-muted">Only active offers within date range will be displayed</small>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i> <?php echo $action === 'add' ? 'Create Offer' : 'Update Offer'; ?>
                    </button>
                    <a href="?" class="btn btn-outline-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<?php require_once 'includes/admin-footer.php'; ?>