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
    
    if ($action === 'add') {
        $result = db()->insert(
            "INSERT INTO categories (name, slug, icon, description, meta_title, meta_description, display_order, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
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
            "UPDATE categories SET name = ?, slug = ?, icon = ?, description = ?, 
             meta_title = ?, meta_description = ?, display_order = ?, status = ? WHERE id = ?",
            [...array_values($data), $id]
        );
        
        if ($result !== false) {
            setFlash('success', 'Category updated successfully!');
            redirect(SITE_URL . '/admin/categories.php');
        } else {
            setFlash('error', 'Failed to update category.');
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
        <form method="POST" action="">
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
