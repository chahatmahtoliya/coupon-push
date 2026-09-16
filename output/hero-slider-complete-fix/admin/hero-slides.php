<?php
/** Admin management for the slides consumed by api/hero-slides.php. */
$pageTitle = 'Hero Slider';
require_once 'includes/admin-header.php';

$action = $_GET['action'] ?? 'list';
$id = max(0, (int) ($_GET['id'] ?? 0));
$error = '';
$slide = ['image' => '', 'alt_text' => '', 'heading' => '', 'subheading' => '', 'badge_text' => '', 'cta_label' => '', 'cta_url' => '', 'display_order' => 0, 'is_active' => 1];
$escape = static function ($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); };
$validUrl = static function ($value) {
    return filter_var($value, FILTER_VALIDATE_URL) && in_array(strtolower(parse_url($value, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true);
};
$validPath = static function ($value) {
    return preg_match('#^/(?!/)[^\\\\\s\x00-\x1f]*$#', $value) === 1;
};
$ready = true;
try {
    $slides = db()->getConnection()->query('SELECT * FROM hero_slides ORDER BY display_order ASC, id DESC')->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $exception) {
    error_log('Admin hero slides: ' . $exception->getMessage());
    $ready = false;
    $slides = [];
    $error = 'Unable to load hero slides. Check the database connection and install database/hero-slides.sql if the table is missing.';
}

if ($ready && in_array($action, ['edit', 'delete'], true)) {
    $matches = array_values(array_filter($slides, static function ($item) use ($id) { return (int) $item['id'] === $id; }));
    if (!$matches) {
        $error = 'That slide no longer exists.';
        $action = 'list';
    } else {
        $slide = $matches[0];
    }
}

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST[CSRF_TOKEN_NAME] ?? null) || !verifyCSRFToken($_POST[CSRF_TOKEN_NAME])) {
        $error = 'Your session expired. Reload the page and try again.';
    } elseif ($action === 'delete' && $id > 0) {
        if (db()->delete('DELETE FROM hero_slides WHERE id = ?', [$id]) !== false) {
            setFlash('success', 'Hero slide deleted.');
            redirect(SITE_URL . '/admin/hero-slides.php');
        }
        $error = 'Unable to delete the slide. Please try again.';
    } elseif (in_array($action, ['add', 'edit'], true)) {
        foreach (['image', 'alt_text', 'heading', 'subheading', 'badge_text', 'cta_label', 'cta_url'] as $field) {
            $slide[$field] = trim((string) ($_POST[$field] ?? ''));
        }
        $slide['display_order'] = max(0, (int) ($_POST['display_order'] ?? 0));
        $slide['is_active'] = isset($_POST['is_active']) ? 1 : 0;
        if ($slide['cta_url'] !== '' && !$validUrl($slide['cta_url']) && !$validPath($slide['cta_url'])) {
            $error = 'Use an HTTP(S) destination URL or a site path starting with /.';
        } elseif ($slide['image'] !== '' && !$validUrl($slide['image']) && !$validPath($slide['image'])) {
            $error = 'Use an HTTP(S) image URL or a site path starting with /.';
        }
        $file = $_FILES['image_file'] ?? null;
        $uploadedPath = null;
        if ($error === '' && $file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $error = 'The image upload failed. Please retry with a smaller file.';
            } else {
                $info = @getimagesize($file['tmp_name']);
                $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
                if (!$info || !isset($extensions[$info['mime']])) {
                    $error = 'Upload a JPG, PNG, WebP, or GIF image.';
                } else {
                    // Derive the extension from image content, never the supplied filename.
                    $file['name'] = 'slide.' . $extensions[$info['mime']];
                    $destination = dirname(__DIR__) . '/uploads/hero/';
                    $upload = uploadImage($file, $destination, 'hero_');
                    if (!$upload['success']) {
                        $error = $upload['message'];
                    } else {
                        $uploadedPath = $destination . $upload['filename'];
                        $slide['image'] = '/uploads/hero/' . $upload['filename'];
                    }
                }
            }
        }
        if ($error === '' && $slide['image'] === '') {
            $error = 'Upload an image or enter an image URL.';
        }
        if ($error === '') {
            $values = array_map(static function ($field) use ($slide) { return $slide[$field]; }, ['heading', 'subheading', 'badge_text', 'cta_label', 'cta_url', 'image', 'alt_text', 'is_active', 'display_order']);
            $result = $action === 'add'
                ? db()->insert('INSERT INTO hero_slides (heading, subheading, badge_text, cta_label, cta_url, image, alt_text, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', $values)
                : db()->update('UPDATE hero_slides SET heading = ?, subheading = ?, badge_text = ?, cta_label = ?, cta_url = ?, image = ?, alt_text = ?, is_active = ?, display_order = ? WHERE id = ?', [...$values, $id]);
            if ($result !== false) {
                setFlash('success', 'Hero slide saved.');
                redirect(SITE_URL . '/admin/hero-slides.php');
            }
            if ($uploadedPath) {
                unlink($uploadedPath);
                $slide['image'] = trim((string) ($_POST['image'] ?? ''));
            }
            $error = 'Unable to save the slide. Please try again.';
        }
    }
}
?>
<div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
    <div><h1 class="page-title">Hero Slider</h1><p class="page-subtitle">Manage homepage slider images and offers.</p></div>
    <?php if ($ready && $action === 'list'): ?><a href="?action=add" class="btn btn-primary"><i class="fas fa-plus me-2"></i>Add Slide</a><?php endif; ?>
</div>
<?php if ($error): ?><div class="alert alert-danger" role="alert"><?php echo $escape($error); ?></div><?php endif; ?>
<?php if ($ready && in_array($action, ['add', 'edit'], true)): ?>
<div class="card"><div class="card-body">
    <h2 class="h5 mb-3"><?php echo $action === 'add' ? 'Add Slide' : 'Edit Slide'; ?></h2>
    <form method="post" enctype="multipart/form-data">
        <?php echo csrfField(); ?>
        <div class="row g-3">
            <div class="col-12"><label for="image_file" class="form-label">Upload image</label><input id="image_file" name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-control"><div class="form-text">Suggested creative: 1600 × 800 px. Keep key text away from edges because slides crop to fit. Maximum <?php echo $escape(round(MAX_UPLOAD_SIZE / 1048576, 1)); ?> MB. A new upload replaces the image URL below.</div></div>
            <div class="col-12"><label for="image" class="form-label">Image URL or path</label><input id="image" name="image" class="form-control" value="<?php echo $escape($slide['image']); ?>" placeholder="https://example.com/banner.webp or /uploads/hero/banner.webp"></div>
            <?php foreach (['alt_text' => 'Image description (alt text)', 'cta_url' => 'Destination URL or site path', 'heading' => 'Heading (optional)', 'subheading' => 'Subheading (optional)', 'badge_text' => 'Badge text (optional)', 'cta_label' => 'Button label (optional)'] as $field => $label): ?>
            <div class="col-md-6"><label for="<?php echo $field; ?>" class="form-label"><?php echo $label; ?></label><input id="<?php echo $field; ?>" name="<?php echo $field; ?>" class="form-control" value="<?php echo $escape($slide[$field] ?? ''); ?>"></div>
            <?php endforeach; ?>
            <div class="col-md-6"><label for="display_order" class="form-label">Display order</label><input type="number" min="0" id="display_order" name="display_order" class="form-control" value="<?php echo (int) $slide['display_order']; ?>"><div class="form-text">Lower numbers appear first.</div></div>
            <div class="col-md-6 d-flex align-items-center"><div class="form-check form-switch"><input type="checkbox" id="is_active" name="is_active" class="form-check-input" <?php echo $slide['is_active'] ? 'checked' : ''; ?>><label for="is_active" class="form-check-label">Active on homepage</label></div></div>
        </div>
        <p class="text-muted mt-3">Leave overlay text blank when your creative already includes the offer. An empty destination links to /deals.</p>
        <button class="btn btn-primary" type="submit">Save Slide</button> <a href="hero-slides.php" class="btn btn-secondary">Cancel</a>
    </form>
</div></div>
<?php elseif ($ready): ?>
<div class="card"><div class="card-body">
    <?php if (!$slides): ?><p class="text-muted mb-0">No hero slides yet. Select Add Slide to upload your first image.</p><?php else: ?>
    <div class="table-responsive"><table class="table align-middle"><thead><tr><th>Image</th><th>Slide</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    <?php foreach ($slides as $item): ?>
    <tr>
        <td><?php if ($validUrl($item['image']) || $validPath($item['image'])): ?><img src="<?php echo $escape($item['image']); ?>" alt="<?php echo $escape($item['alt_text'] ?? ''); ?>" width="160" height="80" style="object-fit:cover;border-radius:6px" loading="lazy"><?php endif; ?></td>
        <td><?php echo $escape($item['heading'] ?: ($item['alt_text'] ?: 'Slide #' . $item['id'])); ?></td>
        <td><?php echo (int) $item['display_order']; ?></td>
        <td><span class="badge bg-<?php echo $item['is_active'] ? 'success' : 'secondary'; ?>"><?php echo $item['is_active'] ? 'Active' : 'Inactive'; ?></span></td>
        <td><div class="d-flex gap-2"><a class="btn btn-sm btn-outline-primary" href="?action=edit&amp;id=<?php echo (int) $item['id']; ?>">Edit</a><form method="post" action="?action=delete&amp;id=<?php echo (int) $item['id']; ?>" onsubmit="return confirm('Delete this hero slide?');"><?php echo csrfField(); ?><button class="btn btn-sm btn-outline-danger" type="submit">Delete</button></form></div></td>
    </tr>
    <?php endforeach; ?>
    </tbody></table></div>
    <?php endif; ?>
</div></div>
<?php endif; ?>
<?php require_once 'includes/admin-footer.php'; ?>
