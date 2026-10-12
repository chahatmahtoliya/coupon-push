<?php
/** Anonymous first-party impressions; never reports purchases or redemptions. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); exit; }
require_once dirname(__DIR__).'/includes/partners.php';
try {
    if (getenv('PARTNERS_ENABLED') === '0') { http_response_code(202); exit; }
    $input = json_decode(file_get_contents('php://input',false,null,0,2048),true);
    if (!is_array($input) || !preg_match('/^[a-f0-9-]{16,64}$/',$input['visitor'] ?? '')) throw new PartnerError('Invalid event.',422);
    $service = new PartnerService(partnerConnection());
    if (!$service->ready()) { http_response_code(202); exit; }
    $service->rate('views',$_SERVER['REMOTE_ADDR'] ?? 'unknown',300,900);
    if (($input['type'] ?? '') === 'offer') {
        $row = $service->one('SELECT l.id AS listing_id,p.id AS offer_id FROM partner_offers p JOIN partner_listings l ON l.id = p.listing_id JOIN coupons c ON c.id = p.coupon_id JOIN stores s ON s.id = l.store_id WHERE p.coupon_id = ? AND c.status = 1 AND s.status = 1',[(int)($input['id'] ?? 0)]);
    } elseif (($input['type'] ?? '') === 'store') {
        $row = $service->one('SELECT l.id AS listing_id FROM partner_listings l JOIN stores s ON s.id = l.store_id WHERE s.slug = ? AND s.status = 1',[(string)($input['slug'] ?? '')]);
    } else throw new PartnerError('Invalid event type.',422);
    if ($row) {
        $key = hash('sha256',gmdate('Y-m-d').':'.$input['visitor'].':'.$row['listing_id'].':'.($row['offer_id'] ?? 'store'));
        if (!$service->one('SELECT id FROM partner_views WHERE event_key = ?',[$key])) {
            try { $service->run('INSERT INTO partner_views (listing_id,offer_id,event_key,created_at) VALUES (?,?,?,?)',[$row['listing_id'],$row['offer_id'] ?? null,$key,$service->now()]); }
            catch (PDOException $error) { if (!$service->one('SELECT id FROM partner_views WHERE event_key = ?',[$key])) throw $error; }
        }
    }
    http_response_code(202); echo '{"success":true}';
} catch (PartnerError $error) { http_response_code($error->status); echo json_encode(['success'=>false,'message'=>$error->getMessage()]); }
catch (Throwable $error) { http_response_code(202); echo '{"success":true}'; }
