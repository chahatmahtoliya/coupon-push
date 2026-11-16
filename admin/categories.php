<?php
/**
 * Admin - Manage Categories
 */

$pageTitle = 'Manage Categories';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = intval($_GET['id'] ?? 0);

// Font Awesome icons for dropdown
$icons = [
    'fas fa-laptop' => 'Laptop/Electronics',
    'fas fa-tshirt' => 'Fashion',
    'fas fa-utensils' => 'Food & Dining',
    'fas fa-plane' => 'Travel',
    'fas fa-spa' => 'Beauty & Health',
    'fas fa-home' => 'Home & Kitchen',
    'fas fa-film' => 'Entertainment',
    'fas fa-shopping-basket' => 'Grocery',
    'fas fa-baby' => 'Baby Products',
    'fas fa-book' => 'Books',
    'fas fa-car' => 'Automotive',
    'fas fa-gamepad' => 'Gaming',
    'fas fa-mobile-alt' => 'Mobile',
    'fas fa-tag' => 'General'
];

// Banner columns come from database/add_category_banner.sql. Until it runs, the
// banner fields stay hidden and categories save exactly as before.
$bannerFields = ['banner_image', 'banner_image_mobile', 'banner_color', 'banner_focus', 'banner_heading', 'banner_subtitle'];
$bannerColumns = array_column(db()->fetchAll("SHOW COLUMNS FROM categories LIKE 'banner%'") ?: [], 'Field');
$bannerEnabled = !array_diff($bannerFields, $bannerColumns);
$bannerError = '';
$uploadedBannerFiles = [];

/** Save one banner upload; returns the new path, the current path, '' to remove, or false on error. */
function saveCategoryBannerUpload($field, $current, &$error, array &$uploaded)
{
    if (!empty($_POST['remove_' . $field])) return '';
    $file = $_FILES[$field] ?? null;
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return $current;
    $destination = dirname(__DIR__) . '/uploads/categories/';
    $upload = uploadImage($file, $destination, 'banner_');
    if (!$upload['success']) {
        $error = $upload['message'];
        return false;
    }
    $uploaded[] = $destination . $upload['filename'];
    return '/uploads/categories/' . $upload['filename'];
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'name' => sanitize($_POST['name'] ?? ''),
        'slug' => createSlug($_POST['name'] ?? ''),
        'icon' => sanitize($_POST['icon'] ?? 'fas fa-tag'),
        'description' => sanitize($_POST['description'] ?? ''),
        'meta_title' => sanitize($_POST['meta_title'] ?? ''),
        'meta_description' => sanitize($_POST['meta_description'] ?? ''),
        'display_order' => intval($_POST['display_order'] ?? 0),
        'status' => isset($_POST['status']) ? 1 : 0
    ];

    if ($bannerEnabled) {
        $existing = $id > 0 ? (db()->fetch("SELECT banner_image, banner_image_mobile FROM categories WHERE id = ?", [$id]) ?: []) : [];
        $color = strtolower(trim((string) ($_POST['banner_color'] ?? '')));
        $focus = (string) ($_POST['banner_focus'] ?? 'center');
        $data['banner_image'] = saveCategoryBannerUpload('banner_image', $existing['banner_image'] ?? null, $bannerError, $uploadedBannerFiles);
        $data['banner_image_mobile'] = saveCategoryBannerUpload('banner_image_mobile', $existing['banner_image_mobile'] ?? null, $bannerError, $uploadedBannerFiles);
        $data['banner_color'] = (empty($_POST['banner_color_default']) && preg_match('/^#[0-9a-f]{6}$/', $color)) ? $color : null;
        $data['banner_focus'] = in_array($focus, ['left', 'center', 'right'], true) ? $focus : 'center';
        $data['banner_heading'] = mb_substr(trim((string) ($_POST['banner_heading'] ?? '')), 0, 150) ?: null;
        $data['banner_subtitle'] = mb_substr(trim((string) ($_POST['banner_subtitle'] ?? '')), 0, 255) ?: null;
        foreach (['banner_image', 'banner_image_mobile'] as $field) {
            if ($data[$field] === '') $data[$field] = null;
        }
    }

    if ($bannerError !== '') {
        foreach ($uploadedBannerFiles as $path) @unlink($path);
    } else {
    $columns = array_keys($data);
    
    if ($action === 'add') {
        $result = db()->insert(
            'INSERT INTO categories (' . implode(', ', $columns) . ') VALUES (' . implode(', ', array_fill(0, count($columns), '?')) . ')',
            array_values($data)
        );
        
        if ($result) {
            setFlash('success', 'Category added successfully!');
            redirect(SITE_URL . '/admin/categories.php');
        } else {
            setFlash('error', 'Failed to add category.');
        }
    } elseif ($action === 'edit' && $id > 0) {
        $result = db()->update(
            'UPDATE categories SET ' . implode(', ', array_map(static function ($column) { return $column . ' = ?'; }, $columns)) . ' WHERE id = ?',
            [...array_values($data), $id]
        );
        
        if ($result !== false) {
            setFlash('success', 'Category updated successfully!');
            redirect(SITE_URL . '/admin/categories.php');
        } else {
            setFlash('error', 'Failed to update category.');
        }
    }
    if (isset($result) && $result === false) {
        foreach ($uploadedBannerFiles as $path) @unlink($path);
    }
    }
}

// Handle delete
if ($action === 'delete' && $id > 0) {
    db()->delete("DELETE FROM categories WHERE id = ?", [$id]);
    setFlash('success', 'Category deleted successfully!');
    redirect(SITE_URL . '/admin/categories.php');
}

// Get category for edit
$category = null;
if ($action === 'edit' && $id > 0) {
    $category = db()->fetch("SELECT * FROM categories WHERE id = ?", [$id]);
    if (!$category) {
        redirect(SITE_URL . '/admin/categories.php');
    }
}
?>

<?php if ($action === 'list'): ?>
<!-- Categories List -->
<div class="page-header d-flex justify-content-between align-items-center">
    <div>
        <h1 class="page-title">Manage Categories</h1>
        <p class="page-subtitle">Organize your coupons by category</p>
    </div>
    <a href="?action=add" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i> Add Category
    </a>
</div>

<div class="card">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th width="50">Order</th>
                        <th>Icon</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Coupons</th>
                        <th>Status</th>
                        <th width="120">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $categories = db()->fetchAll("
                        SELECT c.*,
                        (SELECT COUNT(*) FROM coupons WHERE category_id = c.id AND status = 1) as coupon_count
                        FROM categories c 
                        ORDER BY c.display_order ASC, c.name ASC
                    ");
                    
                    foreach ($categories as $c): 
                    ?>
                    <tr>
                        <td><?php echo $c['display_order']; ?></td>
                        <td><i class="<?php echo sanitize($c['icon']); ?> fa-lg text-primary"></i></td>
                        <td class="fw-medium"><?php echo sanitize($c['name']); ?></td>
                        <td><code><?php echo $c['slug']; ?></code></td>
                        <td><?php echo number_format($c['coupon_count']); ?></td>
                        <td>
                            <span class="badge bg-<?php echo $c['status'] ? 'success' : 'secondary'; ?>">
                                <?php echo $c['status'] ? 'Active' : 'Inactive'; ?>
                            </span>
                        </td>
                        <td>
                            <a href="?action=edit&id=<?php echo $c['id']; ?>" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-edit"></i>
                            </a>
                            <a href="?action=delete&id=<?php echo $c['id']; ?>" class="btn btn-sm btn-outline-danger" 
                               onclick="return confirm('Delete this category?');">
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
<!-- Add/Edit Category Form -->
<div class="page-header">
    <h1 class="page-title"><?php echo $action === 'add' ? 'Add New Category' : 'Edit Category'; ?></h1>
    <p class="page-subtitle">
        <a href="?">← Back to Categories</a>
    </p>
</div>

<div class="card">
    <div class="card-body">
        <?php if ($bannerError !== ''): ?>
        <div class="alert alert-danger" role="alert">The category was not saved. Banner image: <?php echo sanitize($bannerError); ?> Choose a different image and save again.</div>
        <?php endif; ?>
        <form method="POST" action="" enctype="multipart/form-data">
            <div class="row g-4">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Category Name *</label>
                        <input type="text" name="name" class="form-control" 
                               value="<?php echo sanitize($category['name'] ?? ''); ?>" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="3"><?php echo sanitize($category['description'] ?? ''); ?></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Meta Title</label>
                        <input type="text" name="meta_title" class="form-control" 
                               value="<?php echo sanitize($category['meta_title'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Meta Description</label>
                        <textarea name="meta_description" class="form-control" rows="2"><?php echo sanitize($category['meta_description'] ?? ''); ?></textarea>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Icon</label>
                        <select name="icon" class="form-select">
                            <?php foreach ($icons as $iconClass => $iconName): ?>
                            <option value="<?php echo $iconClass; ?>" 
                                    <?php echo ($category['icon'] ?? 'fas fa-tag') === $iconClass ? 'selected' : ''; ?>>
                                <?php echo $iconName; ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <div class="mt-2">
                            <span class="text-muted">Preview:</span>
                            <i class="<?php echo sanitize($category['icon'] ?? 'fas fa-tag'); ?> fa-lg text-primary ms-2"></i>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Display Order</label>
                        <input type="number" name="display_order" class="form-control" 
                               value="<?php echo $category['display_order'] ?? 0; ?>" min="0">
                        <small class="text-muted">Lower numbers appear first</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="status" id="status"
                                   <?php echo ($category['status'] ?? 1) ? 'checked' : ''; ?>>
                            <label class="form-check-label" for="status">Active</label>
                        </div>
                    </div>
                </div>
            </div>

            <?php if ($bannerEnabled):
                $bannerUrl = static function ($path) {
                    $path = trim((string) $path);
                    if ($path === '') return '';
                    return preg_match('#^https?://#i', $path) ? $path : 'https://api.couponpush.com/' . ltrim($path, '/');
                };
                $bannerColor = $category['banner_color'] ?? '';
                $defaultHeading = ($category['name'] ?? 'Category') . ' Deals and Promos';
            ?>
            <hr>
            <h2 class="h5 mb-1">Category page banner</h2>
            <p class="text-muted small mb-3">Upload a background photo without text. The heading and subtitle are added as real page text on top of it. Leave the image empty to keep the built-in banner.</p>
            <div class="row g-4">
                <div class="col-md-6">
                    <label for="banner_image" class="form-label">Background image (desktop)</label>
                    <input id="banner_image" name="banner_image" type="file" accept="image/jpeg,image/png,image/webp" class="form-control" aria-describedby="banner_image_help">
                    <div id="banner_image_help" class="form-text">Landscape, at least 1400 × 600 px. Keep the main subject on the right; the left side fades into the banner colour behind the text. JPG, PNG or WebP up to <?php echo round(MAX_UPLOAD_SIZE / 1048576); ?> MB.</div>
                    <?php if (!empty($category['banner_image'])): ?>
                    <div class="d-flex align-items-center gap-3 mt-2">
                        <img src="<?php echo sanitize($bannerUrl($category['banner_image'])); ?>" alt="Current desktop banner" width="160" height="69" style="object-fit: cover; border-radius: 6px;">
                        <div class="form-check"><input class="form-check-input" type="checkbox" name="remove_banner_image" id="remove_banner_image" value="1"><label class="form-check-label" for="remove_banner_image">Remove and use the built-in banner</label></div>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="col-md-6">
                    <label for="banner_image_mobile" class="form-label">Phone image (optional)</label>
                    <input id="banner_image_mobile" name="banner_image_mobile" type="file" accept="image/jpeg,image/png,image/webp" class="form-control" aria-describedby="banner_mobile_help">
                    <div id="banner_mobile_help" class="form-text">Shown as a strip above the text on phones, about 800 × 300 px. Without it, phones use the desktop image.</div>
                    <?php if (!empty($category['banner_image_mobile'])): ?>
                    <div class="d-flex align-items-center gap-3 mt-2">
                        <img src="<?php echo sanitize($bannerUrl($category['banner_image_mobile'])); ?>" alt="Current phone banner" width="120" height="45" style="object-fit: cover; border-radius: 6px;">
                        <div class="form-check"><input class="form-check-input" type="checkbox" name="remove_banner_image_mobile" id="remove_banner_image_mobile" value="1"><label class="form-check-label" for="remove_banner_image_mobile">Remove phone image</label></div>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="col-md-8">
                    <label for="banner_heading" class="form-label">Banner heading</label>
                    <input id="banner_heading" name="banner_heading" class="form-control" maxlength="150" value="<?php echo sanitize($category['banner_heading'] ?? ''); ?>" placeholder="<?php echo sanitize($defaultHeading); ?>" aria-describedby="banner_heading_help">
                    <div id="banner_heading_help" class="form-text">This becomes the page H1. Leave empty to use “<?php echo sanitize($defaultHeading); ?>”.</div>
                </div>
                <div class="col-md-4">
                    <label for="banner_focus" class="form-label">Image focus</label>
                    <select id="banner_focus" name="banner_focus" class="form-select" aria-describedby="banner_focus_help">
                        <?php foreach (['center' => 'Centre', 'right' => 'Right', 'left' => 'Left'] as $value => $label): ?>
                        <option value="<?php echo $value; ?>" <?php echo ($category['banner_focus'] ?? 'center') === $value ? 'selected' : ''; ?>><?php echo $label; ?></option>
                        <?php endforeach; ?>
                    </select>
                    <div id="banner_focus_help" class="form-text">Which part of the photo stays visible when it is cropped.</div>
                </div>
                <div class="col-md-8">
                    <label for="banner_subtitle" class="form-label">Banner subtitle</label>
                    <input id="banner_subtitle" name="banner_subtitle" class="form-control" maxlength="255" value="<?php echo sanitize($category['banner_subtitle'] ?? ''); ?>" aria-describedby="banner_subtitle_help">
                    <div id="banner_subtitle_help" class="form-text">One short line. Leave empty to use the category description.</div>
                </div>
                <div class="col-md-4">
                    <label for="banner_color" class="form-label">Banner colour</label>
                    <input id="banner_color" name="banner_color" type="color" class="form-control form-control-color" value="<?php echo sanitize($bannerColor ?: '#f6eee8'); ?>">
                    <div class="form-check mt-2"><input class="form-check-input" type="checkbox" name="banner_color_default" id="banner_color_default" value="1" <?php echo $bannerColor ? '' : 'checked'; ?>><label class="form-check-label" for="banner_color_default">Use the default colour</label></div>
                    <div class="form-text">Fills the text side. Pick a light tone from the photo.</div>
                </div>
            </div>
            <?php else: ?>
            <hr>
            <p class="text-muted small mb-0"><i class="fas fa-info-circle me-1"></i> Category page banners need the <code>database/add_category_banner.sql</code> migration. Run it once to turn on banner uploads here.</p>
            <?php endif; ?>

            <hr>

            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i> <?php echo $action === 'add' ? 'Add Category' : 'Update Category'; ?>
                </button>
                <a href="?" class="btn btn-outline-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<?php require_once 'includes/admin-footer.php'; ?>
