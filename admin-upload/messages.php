<?php
/**
 * Admin - Contact Messages
 */

$pageTitle = 'Contact Messages';
require_once 'includes/admin-header.php';

// Handle mark as read
if (isset($_GET['read'])) {
    $id = intval($_GET['read']);
    db()->update("UPDATE contact_messages SET is_read = 1 WHERE id = ?", [$id]);
    redirect(SITE_URL . '/admin/messages.php');
}

// Handle delete
if (isset($_GET['delete'])) {
    $id = intval($_GET['delete']);
    db()->delete("DELETE FROM contact_messages WHERE id = ?", [$id]);
    setFlash('success', 'Message deleted successfully!');
    redirect(SITE_URL . '/admin/messages.php');
}

// Get messages
$messages = db()->fetchAll("SELECT * FROM contact_messages ORDER BY created_at DESC");
$unreadCount = db()->count('contact_messages', 'is_read = 0');
?>

<div class="page-header">
    <h1 class="page-title">Contact Messages</h1>
    <p class="page-subtitle"><?php echo $unreadCount; ?> unread messages</p>
</div>

<div class="card">
    <div class="card-body p-0">
        <?php if (empty($messages)): ?>
        <div class="text-center py-5 text-muted">
            <i class="fas fa-inbox fa-3x mb-3"></i>
            <p>No messages yet</p>
        </div>
        <?php else: ?>
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th width="40"></th>
                        <th>From</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th width="120">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($messages as $msg): ?>
                    <tr class="<?php echo !$msg['is_read'] ? 'table-warning' : ''; ?>">
                        <td>
                            <?php if (!$msg['is_read']): ?>
                            <span class="badge bg-primary rounded-pill">New</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div class="fw-medium"><?php echo sanitize($msg['name']); ?></div>
                            <small class="text-muted"><?php echo sanitize($msg['email']); ?></small>
                        </td>
                        <td><?php echo sanitize($msg['subject'] ?: 'No Subject'); ?></td>
                        <td><?php echo sanitize(truncate($msg['message'], 50)); ?></td>
                        <td><?php echo formatDate($msg['created_at'], 'M d, Y H:i'); ?></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" 
                                    data-bs-target="#messageModal<?php echo $msg['id']; ?>">
                                <i class="fas fa-eye"></i>
                            </button>
                            <?php if (!$msg['is_read']): ?>
                            <a href="?read=<?php echo $msg['id']; ?>" class="btn btn-sm btn-outline-success" title="Mark as Read">
                                <i class="fas fa-check"></i>
                            </a>
                            <?php endif; ?>
                            <a href="?delete=<?php echo $msg['id']; ?>" class="btn btn-sm btn-outline-danger" 
                               onclick="return confirm('Delete this message?');">
                                <i class="fas fa-trash"></i>
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Message Modal -->
                    <div class="modal fade" id="messageModal<?php echo $msg['id']; ?>" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"><?php echo sanitize($msg['subject'] ?: 'Message'); ?></h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p><strong>From:</strong> <?php echo sanitize($msg['name']); ?> (<?php echo sanitize($msg['email']); ?>)</p>
                                    <p><strong>Date:</strong> <?php echo formatDate($msg['created_at'], 'M d, Y H:i A'); ?></p>
                                    <hr>
                                    <p><?php echo nl2br(sanitize($msg['message'])); ?></p>
                                </div>
                                <div class="modal-footer">
                                    <a href="mailto:<?php echo sanitize($msg['email']); ?>" class="btn btn-primary">
                                        <i class="fas fa-reply me-2"></i> Reply
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>

