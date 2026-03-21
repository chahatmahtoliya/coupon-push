<?php
/**
 * Admin - Settings
 */

$pageTitle = 'Settings';
require_once 'includes/admin-header.php';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $settings = [
        'site_name' => sanitize($_POST['site_name'] ?? ''),
        'site_tagline' => sanitize($_POST['site_tagline'] ?? ''),
        'site_email' => sanitize($_POST['site_email'] ?? ''),
        'site_phone' => sanitize($_POST['site_phone'] ?? ''),
        'site_address' => sanitize($_POST['site_address'] ?? ''),
        'meta_title' => sanitize($_POST['meta_title'] ?? ''),
        'meta_description' => sanitize($_POST['meta_description'] ?? ''),
        'meta_keywords' => sanitize($_POST['meta_keywords'] ?? ''),
        'facebook_url' => sanitize($_POST['facebook_url'] ?? ''),
        'twitter_url' => sanitize($_POST['twitter_url'] ?? ''),
        'instagram_url' => sanitize($_POST['instagram_url'] ?? ''),
        'analytics_code' => $_POST['analytics_code'] ?? ''
    ];
    
    foreach ($settings as $key => $value) {
        $exists = db()->fetch("SELECT id FROM settings WHERE setting_key = ?", [$key]);
        if ($exists) {
            db()->update("UPDATE settings SET setting_value = ? WHERE setting_key = ?", [$value, $key]);
        } else {
            db()->insert("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)", [$key, $value]);
        }
    }
    
    setFlash('success', 'Settings updated successfully!');
    redirect(SITE_URL . '/admin/settings.php');
}

// Get current settings
$settings = [];
$result = db()->fetchAll("SELECT setting_key, setting_value FROM settings");
foreach ($result as $row) {
    $settings[$row['setting_key']] = $row['setting_value'];
}
?>

<div class="page-header">
    <h1 class="page-title">Site Settings</h1>
    <p class="page-subtitle">Configure your website settings</p>
</div>

<form method="POST" action="">
    <div class="row g-4">
        <!-- General Settings -->
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-cog me-2"></i> General Settings</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Site Name</label>
                        <input type="text" name="site_name" class="form-control" 
                               value="<?php echo sanitize($settings['site_name'] ?? SITE_NAME); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Site Tagline</label>
                        <input type="text" name="site_tagline" class="form-control" 
                               value="<?php echo sanitize($settings['site_tagline'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Contact Email</label>
                        <input type="email" name="site_email" class="form-control" 
                               value="<?php echo sanitize($settings['site_email'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <input type="text" name="site_phone" class="form-control" 
                               value="<?php echo sanitize($settings['site_phone'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <textarea name="site_address" class="form-control" rows="2"><?php echo sanitize($settings['site_address'] ?? ''); ?></textarea>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- SEO Settings -->
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-search me-2"></i> SEO Settings</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Meta Title</label>
                        <input type="text" name="meta_title" class="form-control" 
                               value="<?php echo sanitize($settings['meta_title'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Meta Description</label>
                        <textarea name="meta_description" class="form-control" rows="3"><?php echo sanitize($settings['meta_description'] ?? ''); ?></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Meta Keywords</label>
                        <input type="text" name="meta_keywords" class="form-control" 
                               value="<?php echo sanitize($settings['meta_keywords'] ?? ''); ?>"
                               placeholder="keyword1, keyword2, keyword3">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Social Media -->
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-share-alt me-2"></i> Social Media</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label"><i class="fab fa-facebook text-primary me-2"></i> Facebook URL</label>
                        <input type="url" name="facebook_url" class="form-control" 
                               value="<?php echo sanitize($settings['facebook_url'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label"><i class="fab fa-twitter text-info me-2"></i> Twitter URL</label>
                        <input type="url" name="twitter_url" class="form-control" 
                               value="<?php echo sanitize($settings['twitter_url'] ?? ''); ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label"><i class="fab fa-instagram text-danger me-2"></i> Instagram URL</label>
                        <input type="url" name="instagram_url" class="form-control" 
                               value="<?php echo sanitize($settings['instagram_url'] ?? ''); ?>">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Analytics -->
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-chart-line me-2"></i> Analytics</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Google Analytics Code</label>
                        <textarea name="analytics_code" class="form-control" rows="5" 
                                  placeholder="Paste your Google Analytics tracking code here..."><?php echo $settings['analytics_code'] ?? ''; ?></textarea>
                        <small class="text-muted">Paste the entire &lt;script&gt; tag from Google Analytics</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="mt-4">
        <button type="submit" class="btn btn-primary btn-lg">
            <i class="fas fa-save me-2"></i> Save Settings
        </button>
    </div>
</form>

<?php require_once 'includes/admin-footer.php'; ?>
