<?php
/**
 * Admin - Manage Deals
 */

$pageTitle = 'Manage Deals';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = intval($_GET['id'] ?? 0);

// Get stores and categories for dropdowns
$stores = db()->fetchAll("SELECT id, name FROM stores WHERE status = 1 ORDER BY name");
$categories = db()->fetchAll("SELECT id, name FROM categories WHERE status = 1 ORDER BY name");

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'title' => sanitize($_POST['title'] ?? ''),
        'description' => sanitize($_POST['description'] ?? ''),
        'store_id' => intval($_POST['store_id'] ?? 0),
        'category_id' => intval($_POST['category_id'] ?? 0) ?: null,
        'original_price' => floatval($_POST['original_price'] ?? 0) ?: null,
        'deal_price' => floatval($_POST['deal_price'] ?? 0) ?: null,
        'discount_percentage' => sanitize($_POST['discount_percentage'] ?? ''),
        'deal_url' => sanitize($_POST['deal_url'] ?? ''),
        'start_date' => $_POST['start_date'] ?: null,
        'expiry_date' => $_POST['expiry_date'] ?: null,
        'is_featured' => isset($_POST['is_featured']) ? 1 : 0,
        'status' => isset($_POST['status']) ? 1 : 0
    ];
    
    // Handle image upload
    $image = null;
    if (!empty($_FILES['image']['tmp_name'])) {
        $upload = uploadImage($_FILES['image'], DEAL_IMAGES_PATH, 'deal_');
        if ($upload['success']) {
            $image = $upload['filename'];
        }
    }
    
    if ($action === 'add') {
        $sql = "INSERT INTO deals (title, description, store_id, category_id, original_price, 
                deal_price, discount_percentage, deal_url, start_date, expiry_date, 
                is_featured, status" . ($image ? ", image" : "") . ") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" . ($image ? ", ?" : "") . ")";
        $params = array_values($data);
        if ($image) $params[] = $image;
        
        $result = db()->insert($sql, $params);
        
        if ($result) {
            setFlash('success', 'Deal added successfully!');
            redirect(SITE_URL . '/admin/deals.php');
        }
    } elseif ($action === 'edit' && $id > 0) {
        $sql = "UPDATE deals SET title = ?, description = ?, store_id = ?, category_id = ?, 
                original_price = ?, deal_price = ?, discount_percentage = ?, deal_url = ?, 
                start_date = ?, expiry_date = ?, is_featured = ?, status = ?" 
               . ($image ? ", image = ?" : "") . " WHERE id = ?";
        $params = array_values($data);
        if ($image) $params[] = $image;
        $params[] = $id;
        
        db()->update($sql, $params);
        setFlash('success', 'Deal updated successfully!');
        redirect(SITE_URL . '/admin/deals.php');
    }
}

// Handle delete
if ($action === 'delete' && $id > 0) {
    db()->delete("DELETE FROM deals WHERE id = ?", [$id]);
    setFlash('success', 'Deal deleted successfully!');
    redirect(SITE_URL . '/admin/deals.php');
}

// Get deal for edit
$deal = null;
if ($action === 'edit' && $id > 0) {
    $deal = db()->fetch("SELECT * FROM deals WHERE id = ?", [$id]);
    if (!$deal) redirect(SITE_URL . '/admin/deals.php');
}
?>

<?php if ($action === 'list'): ?>
<div class="page-header d-flex justify-content-between align-items-center">
    <div>
        <h1 class="page-title">Manage Deals</h1>
        <p class="page-subtitle">Featured product deals and offers</p>
    </div>
    <a href="?action=add" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i> Add Deal
    </a>
</div>

<div class="card">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th width="80">Image</th>
                        <th>Title</th>
                        <th>Store</th>
                        <th>Price</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th width="120">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $deals = db()->fetchAll("
                        SELECT d.*, s.name as store_name 
                        FROM deals d 
                        LEFT JOIN stores s ON d.store_id = s.id 
                        ORDER BY d.created_at DESC
                    ");
                    
                    foreach ($deals as $d): 
                    ?>
                    <tr>
                        <td>
                            <img src="<?php echo getDealImage($d['image']); ?>" 
                                 alt="" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        </td>
                        <td>
                            <div class="fw-medium"><?php echo sanitize(truncate($d['title'], 40)); ?></div>
                            <?php if ($d['is_featured']): ?>
                            <span class="badge bg-warning text-dark">Featured</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo sanitize($d['store_name']); ?></td>
                        <td>
                            <?php if ($d['deal_price']): ?>
                            <span class="text-success fw-medium">₹<?php echo number_format($d['deal_price']); ?></span>
                            <?php if ($d['original_price']): ?>
                            <br><small class="text-muted text-decoration-line-through">₹<?php echo number_format($d['original_price']); ?></small>
                            <?php endif; ?>
                            <?php else: ?>
                            <span class="text-muted">-</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo $d['expiry_date'] ? formatDate($d['expiry_date']) : 'No expiry'; ?></td>
                        <td>
                            <span class="badge bg-<?php echo $d['status'] ? 'success' : 'secondary'; ?>">
                                <?php echo $d['status'] ? 'Active' : 'Inactive'; ?>
                            </span>
                        </td>
                        <td>
                            <a href="?action=edit&id=<?php echo $d['id']; ?>" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-edit"></i>
                            </a>
                            <a href="?action=delete&id=<?php echo $d['id']; ?>" class="btn btn-sm btn-outline-danger" 
                               onclick="return confirm('Delete this deal?');">
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
<div class="page-header">
    <h1 class="page-title"><?php echo $action === 'add' ? 'Add New Deal' : 'Edit Deal'; ?></h1>
    <p class="page-subtitle"><a href="?">← Back to Deals</a></p>
</div>

<div class="card">
    <div class="card-body">
        <form method="POST" action="" enctype="multipart/form-data">
            <div class="row g-4">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Deal Title *</label>
                        <input type="text" name="title" class="form-control" 
                               value="<?php echo sanitize($deal['title'] ?? ''); ?>" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="3"><?php echo sanitize($deal['description'] ?? ''); ?></textarea>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Original Price (₹)</label>
                                <input type="number" name="original_price" class="form-control" 
                                       value="<?php echo $deal['original_price'] ?? ''; ?>" step="0.01">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Deal Price (₹)</label>
                                <input type="number" name="deal_price" class="form-control" 
                                       value="<?php echo $deal['deal_price'] ?? ''; ?>" step="0.01">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Discount %</label>
                                <input type="text" name="discount_percentage" class="form-control" 
                                       value="<?php echo sanitize($deal['discount_percentage'] ?? ''); ?>"
                                       placeholder="e.g., 50%">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Deal URL *</label>
                        <input type="url" name="deal_url" class="form-control" 
                               value="<?php echo sanitize($deal['deal_url'] ?? ''); ?>" required>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Deal Image</label>
                        <?php if (!empty($deal['image'])): ?>
                        <div class="mb-2">
                            <img src="<?php echo getDealImage($deal['image']); ?>" 
                                 alt="" style="max-width: 100%; border-radius: 8px;">
                        </div>
                        <?php endif; ?>
                        <input type="file" name="image" class="form-control" accept="image/*">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Store *</label>
                        <select name="store_id" class="form-select" required>
                            <option value="">Select Store</option>
                            <?php foreach ($stores as $store): ?>
                            <option value="<?php echo $store['id']; ?>" 
                                    <?php echo ($deal['store_id'] ?? '') == $store['id'] ? 'selected' : ''; ?>>
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
                                    <?php echo ($deal['category_id'] ?? '') == $cat['id'] ? 'selected' : ''; ?>>
                                <?php echo sanitize($cat['name']); ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="row">
                        <div class="col-6">
                            <div class="mb-3">
                                <label class="form-label">Start Date</label>
                                <input type="date" name="start_date" class="form-control" 
                                       value="<?php echo $deal['start_date'] ?? ''; ?>">
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="mb-3">
                                <label class="form-label">Expiry Date</label>
                                <input type="date" name="expiry_date" class="form-control" 
                                       value="<?php echo $deal['expiry_date'] ?? ''; ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="is_featured" id="is_featured"
                                   <?php echo ($deal['is_featured'] ?? 0) ? 'checked' : ''; ?>>
                            <label class="form-check-label" for="is_featured">Featured Deal</label>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" name="status" id="status"
                                   <?php echo ($deal['status'] ?? 1) ? 'checked' : ''; ?>>
                            <label class="form-check-label" for="status">Active</label>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i> <?php echo $action === 'add' ? 'Add Deal' : 'Update Deal'; ?>
                </button>
                <a href="?" class="btn btn-outline-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<?php require_once 'includes/admin-footer.php'; ?>
