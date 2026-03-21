<?php
/**
 * Admin Dashboard
 */

$pageTitle = 'Dashboard';
require_once 'includes/admin-header.php';

// Get statistics
$stats = [
    'coupons' => db()->count('coupons', 'status = 1'),
    'stores' => db()->count('stores', 'status = 1'),
    'categories' => db()->count('categories', 'status = 1'),
    'subscribers' => db()->count('subscribers', 'status = 1'),
    'clicks_today' => db()->count('click_tracking', 'DATE(clicked_at) = CURDATE()'),
    'messages_unread' => db()->count('contact_messages', 'is_read = 0')
];

// Get recent coupons
$recentCoupons = db()->fetchAll("
    SELECT c.*, s.name as store_name
    FROM coupons c
    LEFT JOIN stores s ON c.store_id = s.id
    ORDER BY c.created_at DESC
    LIMIT 5
");

// Get recent clicks
$recentClicks = db()->fetchAll("
    SELECT ct.*, c.title as coupon_title, s.name as store_name
    FROM click_tracking ct
    LEFT JOIN coupons c ON ct.coupon_id = c.id
    LEFT JOIN stores s ON ct.store_id = s.id
    ORDER BY ct.clicked_at DESC
    LIMIT 10
");

// Get expiring coupons
$expiringCoupons = db()->fetchAll("
    SELECT c.*, s.name as store_name
    FROM coupons c
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.expiry_date IS NOT NULL 
    AND c.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    AND c.status = 1
    ORDER BY c.expiry_date ASC
    LIMIT 5
");
?>

<div class="page-header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome back! Here's what's happening with your coupons.</p>
</div>

<!-- Stats Cards -->
<div class="row g-4 mb-4">
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-primary">
                <i class="fas fa-ticket-alt"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['coupons']); ?></h3>
                <p>Active Coupons</p>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-success">
                <i class="fas fa-store"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['stores']); ?></h3>
                <p>Stores</p>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-info">
                <i class="fas fa-folder"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['categories']); ?></h3>
                <p>Categories</p>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-warning">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['subscribers']); ?></h3>
                <p>Subscribers</p>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-danger">
                <i class="fas fa-mouse-pointer"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['clicks_today']); ?></h3>
                <p>Clicks Today</p>
            </div>
        </div>
    </div>
    
    <div class="col-md-4 col-lg-2">
        <div class="stat-card">
            <div class="stat-icon bg-secondary">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="stat-content">
                <h3><?php echo number_format($stats['messages_unread']); ?></h3>
                <p>Unread Messages</p>
            </div>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="row g-4 mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="d-flex flex-wrap gap-2">
                    <a href="<?php echo SITE_URL; ?>/admin/coupons.php?action=add" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i> Add Coupon
                    </a>
                    <a href="<?php echo SITE_URL; ?>/admin/stores.php?action=add" class="btn btn-success">
                        <i class="fas fa-plus me-2"></i> Add Store
                    </a>
                    <a href="<?php echo SITE_URL; ?>/admin/categories.php?action=add" class="btn btn-info">
                        <i class="fas fa-plus me-2"></i> Add Category
                    </a>
                    <a href="<?php echo SITE_URL; ?>/admin/deals.php?action=add" class="btn btn-warning">
                        <i class="fas fa-plus me-2"></i> Add Deal
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    <!-- Recent Coupons -->
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Recent Coupons</h5>
                <a href="<?php echo SITE_URL; ?>/admin/coupons.php" class="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Store</th>
                                <th>Code</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recentCoupons as $coupon): ?>
                            <tr>
                                <td>
                                    <a href="<?php echo SITE_URL; ?>/admin/coupons.php?action=edit&id=<?php echo $coupon['id']; ?>">
                                        <?php echo sanitize(truncate($coupon['title'], 40)); ?>
                                    </a>
                                </td>
                                <td><?php echo sanitize($coupon['store_name']); ?></td>
                                <td><code><?php echo $coupon['code'] ?: '-'; ?></code></td>
                                <td>
                                    <span class="badge bg-<?php echo $coupon['status'] ? 'success' : 'secondary'; ?>">
                                        <?php echo $coupon['status'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Expiring Soon -->
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                    Expiring Soon
                </h5>
            </div>
            <div class="card-body p-0">
                <?php if (empty($expiringCoupons)): ?>
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p class="mb-0">No coupons expiring in the next 7 days</p>
                </div>
                <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Coupon</th>
                                <th>Store</th>
                                <th>Expires</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($expiringCoupons as $coupon): ?>
                            <tr>
                                <td>
                                    <a href="<?php echo SITE_URL; ?>/admin/coupons.php?action=edit&id=<?php echo $coupon['id']; ?>">
                                        <?php echo sanitize(truncate($coupon['title'], 30)); ?>
                                    </a>
                                </td>
                                <td><?php echo sanitize($coupon['store_name']); ?></td>
                                <td>
                                    <?php 
                                    $days = daysUntilExpiry($coupon['expiry_date']);
                                    $class = $days <= 2 ? 'text-danger' : 'text-warning';
                                    ?>
                                    <span class="<?php echo $class; ?> fw-medium">
                                        <?php echo $days === 0 ? 'Today' : ($days === 1 ? 'Tomorrow' : $days . ' days'); ?>
                                    </span>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
