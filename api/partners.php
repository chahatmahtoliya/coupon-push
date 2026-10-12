<?php
/** Session-based brand API. Intentionally does not include wildcard-CORS api/config.php. */
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Vary: Origin');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim',explode(',',getenv('PARTNER_ALLOWED_ORIGINS') ?: 'https://couponpush.com')));
if ($origin && !in_array($origin,$allowed,true)) {
    http_response_code(403); echo json_encode(['success'=>false,'message'=>'This origin is not allowed.']); exit;
}
if ($origin) { header('Access-Control-Allow-Origin: '.$origin); header('Access-Control-Allow-Credentials: true'); }
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Partner-CSRF');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
require_once dirname(__DIR__).'/includes/partners.php';

function partnerReply($data = null,$message = null,$status = 200,$fields = [])
{
    http_response_code($status);
    echo json_encode(['success'=>$status < 400,'data'=>$data,'message'=>$message,'fields'=>$fields],JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
try {
    if (getenv('PARTNERS_ENABLED') === '0') throw new PartnerError('Brand accounts are not open yet. Please contact CouponPush.',503);
    $local = in_array(parse_url('http://'.($_SERVER['HTTP_HOST'] ?? ''),PHP_URL_HOST),['localhost','127.0.0.1'],true);
    ini_set('session.use_strict_mode','1');
    session_name('couponpush_partner');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/api/','secure'=>!$local,'httponly'=>true,'samesite'=>'Lax']);
    session_start();
    if (!isset($_SESSION['partner_csrf'])) $_SESSION['partner_csrf'] = bin2hex(random_bytes(32));
    $service = new PartnerService(partnerConnection());
    if (!$service->ready()) throw new PartnerError('Brand accounts are being set up. Please try again later or contact CouponPush.',503);
    $account = isset($_SESSION['partner_id']) ? $service->account((int)$_SESSION['partner_id']) : null;
    if ($account && ($account['suspended_at'] || (int)$account['session_version'] !== (int)($_SESSION['partner_version'] ?? 0) || (int)($_SESSION['partner_started'] ?? 0) < time()-28800)) {
        unset($_SESSION['partner_id'],$_SESSION['partner_version'],$_SESSION['partner_started']); $account = null;
    }
    if ($account) unset($account['session_version'],$account['suspended_at']);
    $action = $_GET['action'] ?? 'session';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        if ($action === 'session') partnerReply(['account'=>$account,'csrf'=>$_SESSION['partner_csrf']]);
        if ($action === 'dashboard') {
            if (!$account) throw new PartnerError('Sign in to open your brand workspace.',401);
            partnerReply($service->dashboard((int)$account['id']));
        }
        throw new PartnerError('Action not found.',404);
    }
    if ($method !== 'POST') throw new PartnerError('Method not allowed.',405);
    if (!hash_equals($_SESSION['partner_csrf'],$_SERVER['HTTP_X_PARTNER_CSRF'] ?? '')) throw new PartnerError('Your session expired. Refresh and try again.',403);
    if ($action === 'upload_logo') {
        if (!$account || !$account['verified_at']) throw new PartnerError('Verify your email before uploading a logo.',403);
        $service->rate('logo',(string)$account['id'],20,3600);
        $file = $_FILES['logo'] ?? null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > 2*1024*1024) throw new PartnerError('Choose a PNG, JPEG or WebP logo under 2 MB.',422);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extensions = ['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];
        $size = @getimagesize($file['tmp_name']);
        if (!isset($extensions[$mime]) || !$size || $size[0] > 4096 || $size[1] > 4096) throw new PartnerError('Choose a valid PNG, JPEG or WebP image, up to 4096 pixels per side.',422);
        $directory = getenv('PARTNER_UPLOAD_DIRECTORY') ?: dirname(__DIR__).'/uploads/partners';
        if (!is_dir($directory) && !mkdir($directory,0755,true)) throw new RuntimeException('Cannot create logo directory.');
        $name = 'partner_'.$account['id'].'_'.bin2hex(random_bytes(16)).'.'.$extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'],rtrim($directory,'/\\').'/'.$name)) throw new RuntimeException('Unable to save logo.');
        partnerReply(['url'=>rtrim(getenv('PARTNER_MEDIA_URL') ?: 'https://api.couponpush.com/uploads/partners','/').'/'.$name],'Logo uploaded.');
    }
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) throw new PartnerError('Send a JSON request.',415);
    $body = file_get_contents('php://input',false,null,0,65537);
    if (strlen($body) > 65536) throw new PartnerError('This submission is too large.',413);
    $input = json_decode($body,true);
    if (!is_array($input)) throw new PartnerError('Invalid request.',400);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (in_array($action,['register','login','forgot','verify','reset'],true)) $service->rate($action,$ip,$action === 'register' ? 5 : 15,900);
    $message = null;
    switch ($action) {
        case 'register':
            if ($account) throw new PartnerError('You are already signed in.',409);
            $signedIn = $service->register($input); $message = 'Account created. Check your email to verify it.'; break;
        case 'login':
            $signedIn = $service->login($input['email'] ?? '',$input['password'] ?? ''); break;
        case 'logout':
            $_SESSION = []; session_regenerate_id(true); $_SESSION['partner_csrf'] = bin2hex(random_bytes(32));
            partnerReply(['account'=>null,'csrf'=>$_SESSION['partner_csrf']],'Signed out.'); break;
        case 'forgot':
            $service->forgot($input['email'] ?? ''); $message = 'If an account exists, a password-reset email is on its way.'; break;
        case 'verify':
            $verifiedId = $service->consumeToken($input['token'] ?? '','verify');
            if (isset($_SESSION['partner_id']) && (int)$_SESSION['partner_id'] !== $verifiedId) unset($_SESSION['partner_id'],$_SESSION['partner_version'],$_SESSION['partner_started']);
            $message = 'Email verified. Sign in to submit your store.'; break;
        case 'reset':
            $service->consumeToken($input['token'] ?? '','reset',$input['password'] ?? '');
            unset($_SESSION['partner_id'],$_SESSION['partner_version'],$_SESSION['partner_started']);
            $message = 'Password updated. Sign in with your new password.'; break;
        default:
            if (!$account) throw new PartnerError('Sign in to continue.',401);
            $service->rate('workspace',(string)$account['id'],80,900);
            $revision = (int)($input['revision'] ?? 0);
            if ($action === 'resend') { $service->rate('resend',(string)$account['id'],5,3600); $service->resend((int)$account['id']); $message = 'A new verification email is on its way.'; }
            elseif ($action === 'save_store') $service->saveStore((int)$account['id'],$input['store'] ?? [],$revision);
            elseif ($action === 'save_offer') $service->saveOffer((int)$account['id'],$input['offer'] ?? [],$revision,(int)($input['id'] ?? 0));
            elseif ($action === 'submit') { $service->submit((int)$account['id'],$revision); $message = 'Submitted for review. Follow updates in your workspace.'; }
            elseif ($action === 'withdraw') $service->withdraw((int)$account['id'],$revision,(int)($input['id'] ?? 0));
            else throw new PartnerError('Action not found.',404);
    }
    if (isset($signedIn)) {
        session_regenerate_id(true);
        $_SESSION['partner_id'] = (int)$signedIn['id']; $_SESSION['partner_version'] = (int)$signedIn['session_version']; $_SESSION['partner_started'] = time();
        $_SESSION['partner_csrf'] = bin2hex(random_bytes(32));
    }
    // Delivery is outside database transactions. Cron retries messages PHP mail cannot send.
    try { $service->deliverMail(3); } catch (Throwable $mailError) { error_log('Partner mail delivery is queued for retry.'); }
    $current = isset($_SESSION['partner_id']) ? $service->account((int)$_SESSION['partner_id']) : null;
    if ($current) unset($current['session_version'],$current['suspended_at']);
    partnerReply(['account'=>$current,'csrf'=>$_SESSION['partner_csrf']],$message ?: 'Saved.');
} catch (PartnerError $error) { partnerReply(null,$error->getMessage(),$error->status,$error->fields); }
catch (Throwable $error) { error_log('Partner API request failed: '.get_class($error)); partnerReply(null,'We could not complete that request. Please try again.',503); }
