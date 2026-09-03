<?php

/**
 * Admin - Manage Coupons
 */

$pageTitle = 'Manage Coupons';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = intval($_GET['id'] ?? 0);

// Get all stores and categories for dropdowns
$stores = db()->fetchAll("SELECT id, name FROM stores WHERE status = 1 ORDER BY name");
$categories = db()->fetchAll("SELECT id, name FROM categories WHERE status = 1 ORDER BY name");

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle image upload
    $uploadedImage = '';
    if (!empty($_FILES['image_file']['name'])) {
        $uploadDir = '../uploads/coupons/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (in_array($ext, $allowed) && $_FILES['image_file']['size'] <= 5 * 1024 * 1024) {
            $filename = 'coupon_' . time() . '_' . uniqid() . '.' . $ext;
            $targetPath = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['image_file']['tmp_name'], $targetPath)) {
                $uploadedImage = '/uploads/coupons/' . $filename;
            }
        }
    }

    // Use uploaded image or URL input
    $imageValue = $uploadedImage ?: sanitize($_POST['image'] ?? '');

    $data = [
        'title' => sanitize($_POST['title'] ?? ''),
        'description' => sanitize($_POST['description'] ?? ''),
        'code' => sanitize($_POST['code'] ?? ''),
        'coupon_type' => sanitize($_POST['coupon_type'] ?? 'code'),
        'discount_type' => sanitize($_POST['discount_type'] ?? 'percentage'),
        'discount_value' => sanitize($_POST['discount_value'] ?? ''),
        'original_price' => !empty($_POST['original_price']) ? floatval($_POST['original_price']) : null,
        'sale_price' => !empty($_POST['sale_price']) ? floatval($_POST['sale_price']) : null,
        'store_id' => intval($_POST['store_id'] ?? 0),
        'category_id' => intval($_POST['category_id'] ?? 0) ?: null,
        'affiliate_link' => sanitize($_POST['affiliate_link'] ?? ''),
        'image' => $imageValue,
        'terms_conditions' => sanitize($_POST['terms_conditions'] ?? ''),
        'start_date' => $_POST['start_date'] ?: null,
        'expiry_date' => $_POST['expiry_date'] ?: null,
        'is_featured' => isset($_POST['is_featured']) ? 1 : 0,
        'is_verified' => isset($_POST['is_verified']) ? 1 : 0,
        'is_exclusive' => isset($_POST['is_exclusive']) ? 1 : 0,
        'status' => isset($_POST['status']) ? 1 : 0
    ];

    if ($action === 'add') {
        $result = db()->insert(
            "INSERT INTO coupons (title, description, code, coupon_type, discount_type, discount_value, 
             original_price, sale_price, store_id, category_id, affiliate_link, image, terms_conditions, 
             start_date, expiry_date, is_featured, is_verified, is_exclusive, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            array_values($data)
        );

        if ($result) {
            setFlash('success', 'Coupon added successfully!');
            redirect(SITE_URL . '/admin/coupons.php');
        } else {
            setFlash('error', 'Failed to add coupon.');
        }
    } elseif ($action === 'edit' && $id > 0) {
        $result = db()->update(
            "UPDATE coupons SET title = ?, description = ?, code = ?, coupon_type = ?, 
             discount_type = ?, discount_value = ?, original_price = ?, sale_price = ?,
             store_id = ?, category_id = ?, affiliate_link = ?, image = ?, terms_conditions = ?, 
             start_date = ?, expiry_date = ?, is_featured = ?, is_verified = ?, is_exclusive = ?, status = ? 
             WHERE id = ?",
            [...array_values($data), $id]
        );

        if ($result !== false) {
            setFlash('success', 'Coupon updated successfully!');
            redirect(SITE_URL . '/admin/coupons.php');
        } else {
            setFlash('error', 'Failed to update coupon.');
        }
    }
}

// Handle delete
if ($action === 'delete' && $id > 0) {
    db()->delete("DELETE FROM coupons WHERE id = ?", [$id]);
    setFlash('success', 'Coupon deleted successfully!');
    redirect(SITE_URL . '/admin/coupons.php');
}

// Get coupon for edit
$coupon = null;
if ($action === 'edit' && $id > 0) {
    $coupon = db()->fetch("SELECT * FROM coupons WHERE id = ?", [$id]);
    if (!$coupon) {
        redirect(SITE_URL . '/admin/coupons.php');
    }
}
?>

<?php if ($action === 'list'): ?>
    <!-- Coupons List -->
    <div class="page-header d-flex justify-content-between align-items-center">
        <div>
            <h1 class="page-title">Manage Coupons</h1>
            <p class="page-subtitle">Add, edit, and manage your coupon codes</p>
        </div>
        <div class="d-flex gap-2">
            <a href="bulk-import.php" class="btn btn-outline-primary">
                <i class="fas fa-file-import me-2"></i> Bulk Import
            </a>
            <a href="?action=add" class="btn btn-primary">
                <i class="fas fa-plus me-2"></i> Add Coupon
            </a>
        </div>
    </div>

    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th width="50">#</th>
                            <th>Title</th>
                            <th>Store</th>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Expiry</th>
                            <th>Clicks</th>
                            <th>Status</th>
                            <th width="120">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $coupons = db()->fetchAll("
                        SELECT c.*, s.name as store_name 
                        FROM coupons c 
                        LEFT JOIN stores s ON c.store_id = s.id 
                        ORDER BY c.created_at DESC
                    ");

                        foreach ($coupons as $c):
                        ?>
                            <tr>
                                <td><?php echo $c['id']; ?></td>
                                <td>
                                    <div class="fw-medium"><?php echo sanitize(truncate($c['title'], 40)); ?></div>
                                    <?php if ($c['is_featured']): ?>
                                        <span class="badge bg-warning text-dark">Featured</span>
                                    <?php endif; ?>
                                    <?php if ($c['is_exclusive']): ?>
                                        <span class="badge bg-info">Exclusive</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo sanitize($c['store_name']); ?></td>
                                <td><code><?php echo $c['code'] ?: '-'; ?></code></td>
                                <td><?php echo formatDiscount($c); ?></td>
                                <td>
                                    <?php if ($c['expiry_date']): ?>
                                        <?php
                                        $days = daysUntilExpiry($c['expiry_date']);
                                        if ($days < 0) {
                                            echo '<span class="text-danger">Expired</span>';
                                        } elseif ($days <= 3) {
                                            echo '<span class="text-warning">' . formatDate($c['expiry_date']) . '</span>';
                                        } else {
                                            echo formatDate($c['expiry_date']);
                                        }
                                        ?>
                                    <?php else: ?>
                                        <span class="text-muted">No expiry</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo number_format($c['click_count']); ?></td>
                                <td>
                                    <span class="badge bg-<?php echo $c['status'] ? 'success' : 'secondary'; ?>">
                                        <?php echo $c['status'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="?action=edit&id=<?php echo $c['id']; ?>" class="btn btn-sm btn-outline-primary" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <a href="?action=delete&id=<?php echo $c['id']; ?>" class="btn btn-sm btn-outline-danger"
                                        onclick="return confirm('Are you sure you want to delete this coupon?');" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

<?php else: ?>
    <!-- Add/Edit Coupon Form -->
    <div class="page-header">
        <h1 class="page-title"><?php echo $action === 'add' ? 'Add New Coupon' : 'Edit Coupon'; ?></h1>
        <p class="page-subtitle">
            <a href="?">&larr; Back to Coupons</a>
        </p>
    </div>

    <div class="card">
        <div class="card-body">
            <form method="POST" action="" enctype="multipart/form-data">
                <div class="row g-4">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label class="form-label">Coupon Title *</label>
                            <input type="text" name="title" class="form-control"
                                value="<?php echo sanitize($coupon['title'] ?? ''); ?>" required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" rows="3"><?php echo sanitize($coupon['description'] ?? ''); ?></textarea>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Coupon Code</label>
                                    <input type="text" name="code" class="form-control"
                                        value="<?php echo sanitize($coupon['code'] ?? ''); ?>"
                                        placeholder="Leave empty for deals">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Coupon Type *</label>
                                    <select name="coupon_type" class="form-select">
                                        <option value="code" <?php echo ($coupon['coupon_type'] ?? '') === 'code' ? 'selected' : ''; ?>>Code</option>
                                        <option value="deal" <?php echo ($coupon['coupon_type'] ?? '') === 'deal' ? 'selected' : ''; ?>>Deal</option>
                                        <option value="offer" <?php echo ($coupon['coupon_type'] ?? '') === 'offer' ? 'selected' : ''; ?>>Offer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Discount Type</label>
                                    <select name="discount_type" class="form-select">
                                        <option value="percentage" <?php echo ($coupon['discount_type'] ?? '') === 'percentage' ? 'selected' : ''; ?>>Percentage</option>
                                        <option value="flat" <?php echo ($coupon['discount_type'] ?? '') === 'flat' ? 'selected' : ''; ?>>Flat Amount</option>
                                        <option value="cashback" <?php echo ($coupon['discount_type'] ?? '') === 'cashback' ? 'selected' : ''; ?>>Cashback</option>
                                        <option value="freebie" <?php echo ($coupon['discount_type'] ?? '') === 'freebie' ? 'selected' : ''; ?>>Freebie</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Discount Value</label>
                                    <input type="text" name="discount_value" class="form-control"
                                        value="<?php echo sanitize($coupon['discount_value'] ?? ''); ?>"
                                        placeholder="e.g., 50 or Rs.500">
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Original Price <small class="text-muted">(optional &ndash; strikethrough price)</small></label>
                                    <div class="input-group">
                                        <span class="input-group-text">&#8377;</span>
                                        <input type="number" name="original_price" class="form-control"
                                            value="<?php echo $coupon['original_price'] ?? ''; ?>"
                                            placeholder="e.g., 999" min="0" step="0.01" autocomplete="off">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Sale Price <small class="text-muted">(optional &ndash; discounted price)</small></label>
                                    <div class="input-group">
                                        <span class="input-group-text">&#8377;</span>
                                        <input type="number" name="sale_price" class="form-control"
                                            value="<?php echo $coupon['sale_price'] ?? ''; ?>"
                                            placeholder="e.g., 699" min="0" step="0.01" autocomplete="off">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <input type="url" name="affiliate_link" class="form-control"
                                value="<?php echo sanitize($coupon['affiliate_link'] ?? ''); ?>"
                                placeholder="https://...">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Product Image</label>
                            <?php if (!empty($coupon['image'])): ?>
                                <div class="mb-2">
                                    <img src="<?php echo sanitize($coupon['image']); ?>" alt="Current Image"
                                        style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 1px solid #ddd;">
                                    <p class="text-muted small mt-1">Current: <?php echo sanitize($coupon['image']); ?></p>
                                </div>
                            <?php endif; ?>
                            <input type="file" name="image_file" class="form-control mb-2" accept="image/*">
                            <small class="text-muted">Upload an image (JPG, PNG, GIF, WebP - max 5MB)</small>
                            <div class="mt-2">
                                <label class="form-label small text-muted">Or paste image URL:</label>
                                <input type="url" name="image" class="form-control"
                                    value="<?php echo sanitize($coupon['image'] ?? ''); ?>"
                                    placeholder="https://example.com/product-image.jpg">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Terms & Conditions</label>
                            <textarea name="terms_conditions" class="form-control" rows="2"><?php echo sanitize($coupon['terms_conditions'] ?? ''); ?></textarea>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Store *</label>
                            <select name="store_id" class="form-select" required>
                                <option value="">Select Store</option>
                                <?php foreach ($stores as $store): ?>
                                    <option value="<?php echo $store['id']; ?>"
                                        <?php echo ($coupon['store_id'] ?? '') == $store['id'] ? 'selected' : ''; ?>>
                                        <?php echo sanitize($store['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Category</label>
                            <select name="category_id" class="form-select">
                                <option value="">Select Category</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo $cat['id']; ?>"
                                        <?php echo ($coupon['category_id'] ?? '') == $cat['id'] ? 'selected' : ''; ?>>
                                        <?php echo sanitize($cat['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Start Date</label>
                            <input type="date" name="start_date" class="form-control"
                                value="<?php echo $coupon['start_date'] ?? ''; ?>">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Expiry Date</label>
                            <input type="date" name="expiry_date" class="form-control"
                                value="<?php echo $coupon['expiry_date'] ?? ''; ?>">
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_featured" id="is_featured"
                                    <?php echo ($coupon['is_featured'] ?? 0) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_featured">Featured</label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_verified" id="is_verified"
                                    <?php echo ($coupon['is_verified'] ?? 1) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_verified">Verified</label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_exclusive" id="is_exclusive"
                                    <?php echo ($coupon['is_exclusive'] ?? 0) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_exclusive">Exclusive</label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="status" id="status"
                                    <?php echo ($coupon['status'] ?? 1) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="status">Active</label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i> <?php echo $action === 'add' ? 'Add Coupon' : 'Update Coupon'; ?>
                    </button>
                    <a href="?" class="btn btn-outline-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<?php require_once 'includes/admin-footer.php'; ?>
