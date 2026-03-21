<?php

/**
 * Admin - Manage Stores
 */

$pageTitle = 'Manage Stores';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = intval($_GET['id'] ?? 0);

// Get all categories for dropdown
$categories = db()->fetchAll("SELECT id, name FROM categories WHERE status = 1 ORDER BY name");

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'name' => sanitize($_POST['name'] ?? ''),
        'slug' => createSlug($_POST['name'] ?? ''),
        'h1_suffix' => sanitize($_POST['h1_suffix'] ?? '') ?: null,
        'website_url' => sanitize($_POST['website_url'] ?? ''),
        'affiliate_url' => sanitize($_POST['affiliate_url'] ?? ''),
        'short_description' => sanitize($_POST['short_description'] ?? ''),
        'description' => sanitize($_POST['description'] ?? ''),
        'about_content' => $_POST['about_content'] ?? '',
        'howto_content' => $_POST['howto_content'] ?? '',
        'terms_content' => $_POST['terms_content'] ?? '',
        'category_id' => intval($_POST['category_id'] ?? 0) ?: null,
        'meta_title' => sanitize($_POST['meta_title'] ?? ''),
        'meta_description' => sanitize($_POST['meta_description'] ?? ''),
        'rating' => floatval($_POST['rating'] ?? 4.0),
        'is_featured' => isset($_POST['is_featured']) ? 1 : 0,
        'is_popular' => isset($_POST['is_popular']) ? 1 : 0,
        'status' => isset($_POST['status']) ? 1 : 0
    ];

    // Handle logo upload
    $logo = null;
    if (!empty($_FILES['logo']['tmp_name'])) {
        $upload = uploadImage($_FILES['logo'], STORE_LOGOS_PATH, 'store_');
        if ($upload['success']) {
            $logo = $upload['filename'];
        }
    }

    if ($action === 'add') {
        $sql = "INSERT INTO stores (name, slug, h1_suffix, website_url, affiliate_url, short_description, 
                description, about_content, howto_content, terms_content, category_id, meta_title, meta_description, rating, 
                is_featured, is_popular, status" . ($logo ? ", logo" : "") . ") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" . ($logo ? ", ?" : "") . ")";
        $params = array_values($data);
        if ($logo) $params[] = $logo;

        $result = db()->insert($sql, $params);

        if ($result) {
            setFlash('success', 'Store added successfully!');
            redirect(SITE_URL . '/admin/stores.php');
        } else {
            setFlash('error', 'Failed to add store.');
        }
    } elseif ($action === 'edit' && $id > 0) {
        $sql = "UPDATE stores SET name = ?, slug = ?, h1_suffix = ?, website_url = ?, affiliate_url = ?, 
                short_description = ?, description = ?, about_content = ?, howto_content = ?, terms_content = ?, 
                category_id = ?, meta_title = ?, meta_description = ?, rating = ?, is_featured = ?, is_popular = ?, status = ?"
            . ($logo ? ", logo = ?" : "") . " WHERE id = ?";
        $params = array_values($data);
        if ($logo) $params[] = $logo;
        $params[] = $id;

        $result = db()->update($sql, $params);

        if ($result !== false) {
            setFlash('success', 'Store updated successfully!');
            redirect(SITE_URL . '/admin/stores.php');
        } else {
            setFlash('error', 'Failed to update store.');
        }
    }
}

// Handle delete
if ($action === 'delete' && $id > 0) {
    db()->delete("DELETE FROM stores WHERE id = ?", [$id]);
    setFlash('success', 'Store deleted successfully!');
    redirect(SITE_URL . '/admin/stores.php');
}

// Get store for edit
$store = null;
if ($action === 'edit' && $id > 0) {
    $store = db()->fetch("SELECT * FROM stores WHERE id = ?", [$id]);
    if (!$store) {
        redirect(SITE_URL . '/admin/stores.php');
    }
}
?>

<?php if ($action === 'list'): ?>
    <!-- Stores List -->
    <div class="page-header d-flex justify-content-between align-items-center">
        <div>
            <h1 class="page-title">Manage Stores</h1>
            <p class="page-subtitle">Add and manage online stores</p>
        </div>
        <a href="?action=add" class="btn btn-primary">
            <i class="fas fa-plus me-2"></i> Add Store
        </a>
    </div>

    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th width="60">Logo</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Coupons</th>
                            <th>Clicks</th>
                            <th>Status</th>
                            <th width="120">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $stores = db()->fetchAll("
                        SELECT s.*, c.name as category_name,
                        (SELECT COUNT(*) FROM coupons WHERE store_id = s.id AND status = 1) as coupon_count
                        FROM stores s 
                        LEFT JOIN categories c ON s.category_id = c.id 
                        ORDER BY s.name ASC
                    ");

                        foreach ($stores as $s):
                        ?>
                            <tr>
                                <td>
                                    <img src="<?php echo getStoreLogo($s['logo']); ?>"
                                        alt="<?php echo sanitize($s['name']); ?>"
                                        style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px;">
                                </td>
                                <td>
                                    <div class="fw-medium"><?php echo sanitize($s['name']); ?></div>
                                    <small class="text-muted"><?php echo $s['website_url']; ?></small>
                                </td>
                                <td><?php echo sanitize($s['category_name'] ?? '-'); ?></td>
                                <td><?php echo number_format($s['coupon_count']); ?></td>
                                <td><?php echo number_format($s['click_count']); ?></td>
                                <td>
                                    <span class="badge bg-<?php echo $s['status'] ? 'success' : 'secondary'; ?>">
                                        <?php echo $s['status'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                    <?php if ($s['is_featured']): ?>
                                        <span class="badge bg-warning text-dark">Featured</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="?action=edit&id=<?php echo $s['id']; ?>" class="btn btn-sm btn-outline-primary">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <a href="?action=delete&id=<?php echo $s['id']; ?>" class="btn btn-sm btn-outline-danger"
                                        onclick="return confirm('Delete this store and all its coupons?');">
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
    <!-- Add/Edit Store Form -->
    <div class="page-header">
        <h1 class="page-title"><?php echo $action === 'add' ? 'Add New Store' : 'Edit Store'; ?></h1>
        <p class="page-subtitle">
            <a href="?">← Back to Stores</a>
        </p>
    </div>

    <div class="card">
        <div class="card-body">
            <form method="POST" action="" enctype="multipart/form-data">
                <div class="row g-4">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label class="form-label">Store Name *</label>
                            <input type="text" name="name" class="form-control"
                                value="<?php echo sanitize($store['name'] ?? ''); ?>" required>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Website URL *</label>
                                    <input type="url" name="website_url" class="form-control"
                                        value="<?php echo sanitize($store['website_url'] ?? ''); ?>" required
                                        placeholder="https://www.example.com">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Affiliate URL</label>
                                    <input type="url" name="affiliate_url" class="form-control"
                                        value="<?php echo sanitize($store['affiliate_url'] ?? ''); ?>"
                                        placeholder="https://...?affid=xxx">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Short Description</label>
                            <input type="text" name="short_description" class="form-control"
                                value="<?php echo sanitize($store['short_description'] ?? ''); ?>"
                                maxlength="255">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Full Description</label>
                            <textarea name="description" class="form-control" rows="4"><?php echo sanitize($store['description'] ?? ''); ?></textarea>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Meta Title</label>
                                    <input type="text" name="meta_title" class="form-control"
                                        value="<?php echo sanitize($store['meta_title'] ?? ''); ?>">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Rating</label>
                                    <input type="number" name="rating" class="form-control"
                                        value="<?php echo $store['rating'] ?? 4.0; ?>"
                                        min="1" max="5" step="0.1">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Meta Description</label>
                            <textarea name="meta_description" class="form-control" rows="2"><?php echo sanitize($store['meta_description'] ?? ''); ?></textarea>
                        </div>

                        <!-- SEO Store Info Section -->
                        <div class="card bg-light mt-4">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Store Page SEO Content</h6>
                                <small>Custom content for store page information tabs</small>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label"><strong>H1 Page Subtitle</strong></label>
                                    <input type="text" name="h1_suffix" class="form-control"
                                        value="<?php echo sanitize($store['h1_suffix'] ?? ''); ?>"
                                        maxlength="150"
                                        placeholder="e.g. Coupons &amp; Promo Codes (leave blank to hide subtitle)">
                                    <small class="text-muted">This text appears next to the store name in the H1 heading on the store page. Leave blank to show no subtitle.</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label"><strong>About Store Content</strong></label>
                                    <textarea name="about_content" class="form-control" rows="4"
                                        placeholder="Custom 'About Store' content. Leave blank for default text."><?php echo $store['about_content'] ?? ''; ?></textarea>
                                    <small class="text-muted">This appears in the "About" tab on the store page. HTML is allowed.</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label"><strong>How to Use Coupons Content</strong></label>
                                    <textarea name="howto_content" class="form-control" rows="4"
                                        placeholder="Custom 'How to Use' content. Leave blank for default text."><?php echo $store['howto_content'] ?? ''; ?></textarea>
                                    <small class="text-muted">This appears in the "How to Use Coupons" tab. HTML is allowed.</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label"><strong>Terms & Conditions Content</strong></label>
                                    <textarea name="terms_content" class="form-control" rows="4"
                                        placeholder="Custom 'Terms & Conditions' content. Leave blank for default text."><?php echo $store['terms_content'] ?? ''; ?></textarea>
                                    <small class="text-muted">This appears in the "Terms & Conditions" tab. HTML is allowed.</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Store Logo</label>
                            <?php if (!empty($store['logo'])): ?>
                                <div class="mb-2">
                                    <img src="<?php echo getStoreLogo($store['logo']); ?>"
                                        alt="Current Logo" style="max-width: 100px; border-radius: 8px;">
                                </div>
                            <?php endif; ?>
                            <input type="file" name="logo" class="form-control" accept="image/*">
                            <small class="text-muted">Recommended: 200x200px, Max 5MB</small>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Category</label>
                            <select name="category_id" class="form-select">
                                <option value="">Select Category</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo $cat['id']; ?>"
                                        <?php echo ($store['category_id'] ?? '') == $cat['id'] ? 'selected' : ''; ?>>
                                        <?php echo sanitize($cat['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_featured" id="is_featured"
                                    <?php echo ($store['is_featured'] ?? 0) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_featured">Featured Store</label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="is_popular" id="is_popular"
                                    <?php echo ($store['is_popular'] ?? 0) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="is_popular">Popular Store</label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" name="status" id="status"
                                    <?php echo ($store['status'] ?? 1) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="status">Active</label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i> <?php echo $action === 'add' ? 'Add Store' : 'Update Store'; ?>
                    </button>
                    <a href="?" class="btn btn-outline-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<?php require_once 'includes/admin-footer.php'; ?>