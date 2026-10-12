<?php
$pageTitle = 'Brand Submissions';
require_once __DIR__.'/includes/admin-header.php';
require_once dirname(__DIR__).'/includes/partners.php';
$service = new PartnerService(db()->getConnection());
$isReviewer = ($currentUser['role'] ?? '') === 'admin' && (int)($currentUser['status'] ?? 0) === 1;
if (!$isReviewer) { http_response_code(403); echo '<div class="alert alert-danger">Only administrators can review brand submissions.</div>'; require __DIR__.'/includes/admin-footer.php'; exit; }
if (!$service->ready()) { echo '<div class="alert alert-warning">Run the partner migration before opening submissions. See the partner setup guide.</div>'; require __DIR__.'/includes/admin-footer.php'; exit; }
$id = (int)($_GET['id'] ?? 0);
$reviewError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) throw new PartnerError('Your session expired. Refresh this page.',403);
        if (($_POST['decision'] ?? '') === 'verify_publication') {
            $service->verifyPublication($id,(int)$currentUser['id']); setFlash('success','The approved website version is published.');
        } else {
            if (($_POST['decision'] ?? '') === 'approve' && !isset($_POST['authorization_reviewed'])) throw new PartnerError('Confirm that you checked the applicant’s authorization before approving.',422);
            $service->review($id,(int)($_POST['revision'] ?? 0),$_POST['decision'] ?? '',$_POST['feedback'] ?? '',(array)($_POST['approved_offers'] ?? []),(array)($_POST['offer_feedback'] ?? []),$_POST['slug'] ?? '',(int)$currentUser['id'],isset($_POST['authorization_reviewed']));
            setFlash('success','Review recorded. Public content changes only when approved.');
        }
        try { $service->deliverMail(5); } catch (Throwable $mailError) { error_log('Partner review notification queued for retry.'); }
        redirect(SITE_URL.'/admin/partners.php?id='.$id);
    } catch (PartnerError $error) { $reviewError = $error->getMessage(); }
    catch (Throwable $error) { error_log('Partner review failed: '.get_class($error)); $reviewError = 'The review could not be saved. No partial catalog changes were published.'; }
}
function partnerAdminEscape($value) { return htmlspecialchars((string)$value,ENT_QUOTES,'UTF-8'); }
function partnerAdminStatus($status) { return ucwords(str_replace('_',' ',$status)); }
?>
<div class="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
 <div><h1 class="page-title">Brand submissions</h1><p class="page-subtitle">Review store details, authorization and offers before publishing.</p></div>
 <?php if ($id): ?><a class="btn btn-outline-secondary" href="partners.php">All submissions</a><?php endif; ?>
</div>
<?php if ($reviewError): ?><div class="alert alert-danger" role="alert"><?= partnerAdminEscape($reviewError) ?></div><?php endif; ?>
<?php if (!$id):
$filter = $_GET['status'] ?? 'pending_review';
if (!in_array($filter,['all','pending_review','draft','changes_requested','approved','rejected'],true)) $filter = 'pending_review';
$where = $filter === 'all' ? '' : ' WHERE l.status = ?';
$records = $service->all('SELECT l.*,a.name AS contact_name,a.email FROM partner_listings l JOIN partner_accounts a ON a.id = l.account_id'.$where.' ORDER BY l.updated_at DESC LIMIT 200',$where ? [$filter] : []);
?>
<nav class="d-flex flex-wrap gap-2 mb-4" aria-label="Submission status">
<?php foreach (['pending_review'=>'In review','changes_requested'=>'Changes requested','approved'=>'Approved','draft'=>'Drafts','rejected'=>'Rejected','all'=>'All'] as $key=>$label): ?>
 <a class="btn <?= $filter === $key ? 'btn-primary' : 'btn-outline-secondary' ?>" href="?status=<?= $key ?>" <?= $filter === $key ? 'aria-current="page"' : '' ?>><?= $label ?></a>
<?php endforeach; ?></nav>
<div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Brand</th><th>Contact</th><th>Status</th><th>Updated</th><th>Review</th></tr></thead><tbody>
<?php foreach ($records as $row): $payload = json_decode($row['payload'],true); ?>
<tr><td><strong><?= partnerAdminEscape($payload['name'] ?? 'Store details not added') ?></strong><div class="small text-muted"><?= partnerAdminEscape($row['domain']) ?></div></td><td><?= partnerAdminEscape($row['contact_name']) ?><div class="small text-muted"><?= partnerAdminEscape($row['email']) ?></div></td><td><?= partnerAdminEscape(partnerAdminStatus($row['status'])) ?></td><td><?= partnerAdminEscape($row['updated_at']) ?> UTC</td><td><a class="btn btn-sm btn-outline-primary" href="?id=<?= (int)$row['id'] ?>">Open submission</a></td></tr>
<?php endforeach; ?>
<?php if (!$records): ?><tr><td colspan="5" class="p-5 text-center text-muted">No submissions with this status. Brands appear here after creating their workspace.</td></tr><?php endif; ?>
</tbody></table></div></div>
<?php else:
$listing = $service->one('SELECT l.*,a.name AS contact_name,a.email,a.verified_at FROM partner_listings l JOIN partner_accounts a ON a.id = l.account_id WHERE l.id = ?',[$id]);
if (!$listing): http_response_code(404); ?><div class="alert alert-warning">Submission not found.</div><?php else:
$data = json_decode($listing['payload'],true) ?: [];
$dashboard = $service->dashboard((int)$listing['account_id']);
$publicStore = $listing['store_id'] ? $service->one('SELECT name,slug,website_url,short_description,description FROM stores WHERE id = ?',[$listing['store_id']]) : null;
$slug = $publicStore['slug'] ?? createSlug($data['name'] ?? '');
?>
<div class="mb-4 d-flex flex-wrap gap-3 align-items-center"><strong><?= partnerAdminEscape(partnerAdminStatus($listing['status'])) ?></strong><span class="text-muted">Submitted version <?= (int)$listing['revision'] ?></span><span class="text-muted">Email <?= $listing['verified_at'] ? 'verified' : 'unverified' ?>; ownership needs manual review.</span></div>
<div class="row g-4 mb-4"><section class="col-lg-7"><div class="card p-4"><h2 class="h4"><?= partnerAdminEscape($data['name'] ?? 'Store draft') ?></h2>
<dl><dt>Official website</dt><dd><?= partnerAdminEscape($data['website_url'] ?? '') ?></dd><dt>Short description</dt><dd><?= partnerAdminEscape($data['short_description'] ?? '') ?></dd><dt>About the store</dt><dd class="text-break" style="white-space:pre-wrap"><?= partnerAdminEscape($data['description'] ?? '') ?></dd><dt>Contact</dt><dd><?= partnerAdminEscape($listing['contact_name']) ?> · <?= partnerAdminEscape($listing['email']) ?></dd><dt>Relationship</dt><dd><?= partnerAdminEscape($data['relationship'] ?? '') ?></dd><dt>Authorization supplied by applicant</dt><dd class="text-break" style="white-space:pre-wrap"><?= partnerAdminEscape($data['authorization'] ?? '') ?></dd></dl>
<?php if (!empty($data['logo'])): ?><img src="<?= partnerAdminEscape($data['logo']) ?>" alt="Submitted brand logo" width="100" height="100" style="object-fit:contain"><?php endif; ?></div></section>
<aside class="col-lg-5"><div class="card p-4"><h2 class="h5">Current published version</h2><?php if ($publicStore): ?><p><strong><?= partnerAdminEscape($publicStore['name']) ?></strong></p><p><?= partnerAdminEscape($publicStore['short_description']) ?></p><p><?= partnerAdminEscape($publicStore['website_url']) ?></p><a href="<?= partnerAdminEscape($dashboard['listing']['public_url']) ?>" target="_blank" rel="noopener noreferrer">Open live store</a><?php else: ?><p class="text-muted">This is a new store. Nothing is public until approval.</p><?php endif; ?></div>
<?php if ($dashboard['publication']): ?><div class="card p-4 mt-3"><h2 class="h5">Website update</h2><p><?= partnerAdminEscape(partnerAdminStatus($dashboard['publication']['status'])) ?> · version <?= (int)$dashboard['publication']['revision'] ?></p><p class="small">Approval updates the API. Rebuild and deploy the static frontend, then verify the canonical page here.</p><?php if ($dashboard['publication']['error']): ?><p class="small text-danger"><?= partnerAdminEscape($dashboard['publication']['error']) ?></p><?php endif; ?><?php if ($dashboard['publication']['status'] !== 'succeeded'): ?><form method="post"><?= csrfField() ?><button class="btn btn-outline-primary" name="decision" value="verify_publication">Verify published version</button></form><?php endif; ?></div><?php endif; ?></aside></div>
<form method="post">
<?= csrfField() ?><input type="hidden" name="revision" value="<?= (int)$listing['revision'] ?>">
<h2 class="h4 mb-3">Submitted offers</h2>
<?php foreach ($dashboard['offers'] as $offer): $p = $offer['payload']; $pending = $offer['status'] === 'pending_review'; ?>
<section class="card p-4 mb-3"><div class="d-flex justify-content-between flex-wrap gap-3"><h3 class="h5"><?= partnerAdminEscape($p['title']) ?></h3><span><?= partnerAdminEscape(partnerAdminStatus($offer['status'])) ?></span></div><p><?= partnerAdminEscape($p['description']) ?></p><dl class="row"><dt class="col-sm-3">Code / type</dt><dd class="col-sm-9"><?= partnerAdminEscape($p['code'] ?: 'No-code deal') ?></dd><dt class="col-sm-3">Destination</dt><dd class="col-sm-9 text-break"><?= partnerAdminEscape($p['affiliate_link']) ?></dd><dt class="col-sm-3">Validity</dt><dd class="col-sm-9"><?= partnerAdminEscape(($p['start_date'] ?: 'Starts now').' → '.($p['expiry_date'] ?: 'No expiry supplied')) ?></dd><dt class="col-sm-3">Restrictions</dt><dd class="col-sm-9"><?= partnerAdminEscape($p['terms_conditions']) ?></dd><dt class="col-sm-3">Minimum spend</dt><dd class="col-sm-9"><?= partnerAdminEscape($p['min_order_value'] ?? 'Not supplied') ?></dd></dl>
<?php if ($pending): ?><div class="form-check mb-3"><input class="form-check-input" id="offer-<?= $offer['id'] ?>" type="checkbox" name="approved_offers[]" value="<?= $offer['id'] ?>" checked><label class="form-check-label" for="offer-<?= $offer['id'] ?>">Approve this offer when approving the store</label></div><label for="feedback-<?= $offer['id'] ?>" class="form-label">Feedback if this offer is not approved</label><textarea id="feedback-<?= $offer['id'] ?>" name="offer_feedback[<?= $offer['id'] ?>]" class="form-control" maxlength="2000" rows="2"></textarea><?php endif; ?>
</section><?php endforeach; ?>
<?php if ($listing['status'] === 'pending_review'): ?><section class="card p-4 mb-4"><h2 class="h4">Review decision</h2><div class="mb-3"><label class="form-label" for="final-slug">Final store slug</label><input id="final-slug" class="form-control" name="slug" value="<?= partnerAdminEscape($slug) ?>" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="100" <?= $publicStore ? 'readonly' : '' ?>></div><label class="form-label" for="review-feedback">Feedback to the brand</label><textarea id="review-feedback" class="form-control mb-3" name="feedback" maxlength="2000" rows="3"></textarea><p class="small text-muted">Explain changes or rejection. Every unchecked offer also needs feedback. Approval marks offers as merchant advertised, not checkout tested.</p><div class="form-check mb-4"><input class="form-check-input" type="checkbox" id="authorization-reviewed" name="authorization_reviewed"><label class="form-check-label" for="authorization-reviewed">I checked the official website, applicant authorization and offer conditions.</label></div><div class="d-flex flex-wrap gap-2"><button class="btn btn-primary" name="decision" value="approve">Approve selected offers and store</button><button class="btn btn-outline-secondary" name="decision" value="changes_requested">Request changes</button><button class="btn btn-outline-danger" name="decision" value="rejected">Reject submission</button></div></section><?php endif; ?>
</form>
<section class="card p-4"><h2 class="h4">Review history</h2><ol><?php foreach ($dashboard['activity'] as $event): ?><li class="mb-3"><strong><?= partnerAdminEscape(partnerAdminStatus($event['event'])) ?></strong> · <?= partnerAdminEscape($event['created_at']) ?> UTC<br><?= partnerAdminEscape($event['message']) ?></li><?php endforeach; ?></ol></section>
<?php endif; endif; require __DIR__.'/includes/admin-footer.php'; ?>
