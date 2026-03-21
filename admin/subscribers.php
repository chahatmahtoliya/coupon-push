<?php
/**
 * Admin - Subscribers
 */

$pageTitle = 'Newsletter Subscribers';
require_once 'includes/admin-header.php';

// Handle delete
if (isset($_GET['delete'])) {
    $id = intval($_GET['delete']);
    db()->delete("DELETE FROM subscribers WHERE id = ?", [$id]);
    setFlash('success', 'Subscriber deleted successfully!');
    redirect(SITE_URL . '/admin/subscribers.php');
}

// Get subscribers with pagination
$page = max(1, intval($_GET['page'] ?? 1));
$total = db()->count('subscribers');
$pagination = paginate($total, $page, ADMIN_ITEMS_PER_PAGE);

$subscribers = db()->fetchAll("
    SELECT * FROM subscribers 
    ORDER BY subscribed_at DESC 
    LIMIT ? OFFSET ?
", [$pagination['items_per_page'], $pagination['offset']]);
?>

<div class="page-header d-flex justify-content-between align-items-center">
    <div>
        <h1 class="page-title">Newsletter Subscribers</h1>
        <p class="page-subtitle"><?php echo number_format($total); ?> total subscribers</p>
    </div>
    <a href="?export=csv" class="btn btn-success">
        <i class="fas fa-download me-2"></i> Export CSV
    </a>
</div>

<div class="card">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Email</th>
                        <th>Subscribed On</th>
                        <th>Status</th>
                        <th width="80">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($subscribers as $sub): ?>
                    <tr>
                        <td><?php echo $sub['id']; ?></td>
                        <td><?php echo sanitize($sub['email']); ?></td>
                        <td><?php echo formatDate($sub['subscribed_at'], 'M d, Y H:i'); ?></td>
                        <td>
                            <span class="badge bg-<?php echo $sub['status'] ? 'success' : 'secondary'; ?>">
                                <?php echo $sub['status'] ? 'Active' : 'Unsubscribed'; ?>
                            </span>
                        </td>
                        <td>
                            <a href="?delete=<?php echo $sub['id']; ?>" class="btn btn-sm btn-outline-danger" 
                               onclick="return confirm('Delete this subscriber?');">
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

<?php echo paginationHTML($pagination, SITE_URL . '/admin/subscribers.php'); ?>

<?php require_once 'includes/admin-footer.php'; ?>
