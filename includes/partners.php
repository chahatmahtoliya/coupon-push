<?php
/** Merchant accounts and moderated catalog changes. Admin credentials are never reused. */
class PartnerError extends RuntimeException
{
    public $status;
    public $fields;
    public function __construct($message, $status = 400, $fields = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->fields = $fields;
    }
}

function partnerConnection()
{
    if (getenv('PARTNER_DSN')) {
        $pdo = new PDO(getenv('PARTNER_DSN'), getenv('PARTNER_DB_USER') ?: null, getenv('PARTNER_DB_PASSWORD') ?: null);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') $pdo->exec('PRAGMA foreign_keys = ON');
        return $pdo;
    }
    // Use the hosting credentials without the legacy connection helper's HTML die().
    // This keeps an unavailable database a structured 503 response for brand clients.
    require_once dirname(__DIR__) . '/config/database.php';
    date_default_timezone_set('Asia/Kolkata');
    return new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset='.DB_CHARSET,DB_USER,DB_PASS,[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false,
        PDO::MYSQL_ATTR_INIT_COMMAND=>'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
    ]);
}

class PartnerService
{
    public $pdo;
    private $site;
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->site = rtrim(getenv('PARTNER_SITE_URL') ?: 'https://couponpush.com', '/');
    }
    public function now() { return gmdate('Y-m-d H:i:s'); }
    public function lock() { return $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : ''; }
    public function run($sql, $args = []) { $statement = $this->pdo->prepare($sql); $statement->execute($args); return $statement; }
    public function one($sql, $args = []) { return $this->run($sql, $args)->fetch(PDO::FETCH_ASSOC) ?: null; }
    public function all($sql, $args = []) { return $this->run($sql, $args)->fetchAll(PDO::FETCH_ASSOC); }
    public function atomic(callable $work)
    {
        $this->pdo->beginTransaction();
        try { $result = $work(); $this->pdo->commit(); return $result; }
        catch (Throwable $error) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $error; }
    }
    public function ready()
    {
        try { $this->one('SELECT id FROM partner_accounts LIMIT 1'); return true; }
        catch (PDOException $error) { return false; }
    }
    public function account($id)
    {
        return $this->one('SELECT id,name,email,verified_at,suspended_at,session_version FROM partner_accounts WHERE id = ?', [$id]);
    }
    public function rate($scope, $identity, $maximum = 10, $seconds = 900)
    {
        $bucket = hash('sha256', $scope . ':' . $identity . ':' . floor(time() / $seconds));
        $expires = gmdate('Y-m-d H:i:s', time() + $seconds);
        try { $this->run('INSERT INTO partner_rate_limits (bucket,hits,expires_at) VALUES (?,0,?)', [$bucket, $expires]); }
        catch (PDOException $error) { if (!$this->one('SELECT bucket FROM partner_rate_limits WHERE bucket = ?', [$bucket])) throw $error; }
        $this->run('UPDATE partner_rate_limits SET hits = hits + 1 WHERE bucket = ?', [$bucket]);
        if ((int)$this->one('SELECT hits FROM partner_rate_limits WHERE bucket = ?', [$bucket])['hits'] > $maximum) {
            throw new PartnerError('Too many attempts. Please try again later.', 429);
        }
    }
    public function text($value, $maximum, $field)
    {
        if (!is_string($value)) throw new PartnerError('Check the highlighted fields.', 422, [$field => 'Enter text.']);
        $value = trim(strip_tags($value));
        if (mb_strlen($value) > $maximum) throw new PartnerError('Check the highlighted fields.', 422, [$field => "Use no more than {$maximum} characters."]);
        return $value;
    }
    public function url($value, $field)
    {
        $url = trim((string)$value);
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');
        if (strlen($url) > 500 || !filter_var($url, FILTER_VALIDATE_URL) || ($parts['scheme'] ?? '') !== 'https'
            || isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443)
            || filter_var($host, FILTER_VALIDATE_IP) || !preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $host)
            || preg_match('/\.(localhost|local|internal|test|invalid)$/', $host)) {
            throw new PartnerError('Check the highlighted fields.', 422, [$field => 'Enter a public HTTPS website address.']);
        }
        return $url;
    }
    public function password($value)
    {
        if (!is_string($value) || strlen($value) < 12 || strlen($value) > 72) {
            throw new PartnerError('Choose a password with 12–72 characters.', 422, ['password' => 'Use 12–72 characters.']);
        }
        return password_hash($value, PASSWORD_DEFAULT);
    }
    public function register($input)
    {
        $name = $this->text($input['name'] ?? '', 100, 'name');
        $email = strtolower(trim((string)($input['email'] ?? '')));
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) throw new PartnerError('Enter your name and a valid business email.', 422);
        if (($input['accept_terms'] ?? false) !== true) throw new PartnerError('Accept the brand submission terms to continue.', 422);
        $hash = $this->password($input['password'] ?? '');
        if ($this->one('SELECT id FROM partner_accounts WHERE email = ?', [$email])) throw new PartnerError('Please sign in or use password reset for this email address.', 409);
        return $this->atomic(function () use ($name, $email, $hash) {
            $this->run('INSERT INTO partner_accounts (name,email,password_hash,terms_version,terms_accepted_at,created_at) VALUES (?,?,?,?,?,?)', [$name,$email,$hash,'2026-10-12',$this->now(),$this->now()]);
            $id = (int)$this->pdo->lastInsertId();
            $this->run('INSERT INTO partner_listings (account_id,payload,status,revision,updated_at) VALUES (?, ?, ?, 1, ?)', [$id,'{}','draft',$this->now()]);
            $this->issueToken($id, 'verify');
            return $this->account($id);
        });
    }
    public function login($email, $password)
    {
        $account = $this->one('SELECT * FROM partner_accounts WHERE email = ?', [strtolower(trim((string)$email))]);
        // A fixed valid hash keeps unknown-account requests on the password verification path.
        $dummy = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = is_string($password) && password_verify($password, $account['password_hash'] ?? $dummy);
        if (!$account || !$valid || $account['suspended_at']) throw new PartnerError('Email or password is incorrect, or this account is unavailable.', 401);
        return $this->account($account['id']);
    }
    public function mail($recipient, $subject, $body)
    {
        $this->run('INSERT INTO partner_mail (recipient,subject,body,status,next_attempt_at,created_at) VALUES (?,?,?,\'queued\',?,?)', [$recipient,$subject,$body,$this->now(),$this->now()]);
    }
    public function issueToken($id, $kind)
    {
        $account = $this->account($id);
        $this->run('UPDATE partner_tokens SET consumed_at = ? WHERE account_id = ? AND kind = ? AND consumed_at IS NULL', [$this->now(),$id,$kind]);
        $token = bin2hex(random_bytes(32));
        $this->run('INSERT INTO partner_tokens (account_id,kind,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)', [$id,$kind,hash('sha256',$token),gmdate('Y-m-d H:i:s',time()+1800),$this->now()]);
        // Fragment tokens stay out of frontend access logs and referrer URLs.
        $link = $this->site . '/partners/#action=' . $kind . '&token=' . $token;
        $subject = $kind === 'verify' ? 'Verify your CouponPush brand account' : 'Reset your CouponPush password';
        $this->mail($account['email'], $subject, "$subject\n\n$link\n\nThis link expires in 30 minutes and works once. If you did not request it, you can ignore this email.");
    }
    public function resend($id)
    {
        if ($this->account($id)['verified_at']) return;
        $last = $this->one('SELECT created_at FROM partner_tokens WHERE account_id = ? AND kind = \'verify\' ORDER BY id DESC LIMIT 1', [$id]);
        if ($last && strtotime($last['created_at'].' UTC') > time()-60) throw new PartnerError('Please wait a minute before requesting another email.', 429);
        $this->atomic(function () use ($id) { $this->issueToken($id,'verify'); });
    }
    public function forgot($email)
    {
        $account = $this->one('SELECT id FROM partner_accounts WHERE email = ? AND suspended_at IS NULL', [strtolower(trim((string)$email))]);
        if ($account) $this->atomic(function () use ($account) { $this->issueToken($account['id'],'reset'); });
    }
    public function consumeToken($token, $kind, $password = null)
    {
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) throw new PartnerError('This link is invalid or expired. Request a new email.', 410);
        $hash = $kind === 'reset' ? $this->password($password) : null;
        return $this->atomic(function () use ($token,$kind,$hash) {
            $row = $this->one('SELECT * FROM partner_tokens WHERE token_hash = ? AND kind = ?' . $this->lock(), [hash('sha256',$token),$kind]);
            if (!$row || $row['consumed_at'] || $row['expires_at'] <= $this->now() || !$this->account($row['account_id']) || $this->account($row['account_id'])['suspended_at']) throw new PartnerError('This link is invalid or expired. Request a new email.', 410);
            $this->run('UPDATE partner_tokens SET consumed_at = ? WHERE id = ?', [$this->now(),$row['id']]);
            if ($kind === 'verify') $this->run('UPDATE partner_accounts SET verified_at = ? WHERE id = ?', [$this->now(),$row['account_id']]);
            else {
                $this->run('UPDATE partner_accounts SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [$hash,$row['account_id']]);
                $this->run('UPDATE partner_tokens SET consumed_at = ? WHERE account_id = ? AND consumed_at IS NULL', [$this->now(),$row['account_id']]);
            }
            return (int)$row['account_id'];
        });
    }
    public function listing($accountId, $lock = false)
    {
        $row = $this->one('SELECT * FROM partner_listings WHERE account_id = ?' . ($lock ? $this->lock() : ''), [$accountId]);
        if (!$row) throw new PartnerError('Store workspace not found.', 404);
        return $row;
    }
    public function editable($row, $revision)
    {
        if ($row['status'] === 'pending_review') throw new PartnerError('This submission is in review. Withdraw it before editing.', 409);
        if ($row['status'] === 'suspended') throw new PartnerError('This listing has been suspended. Contact CouponPush.', 403);
        if ((int)$row['revision'] !== (int)$revision) throw new PartnerError('Your workspace changed in another tab. Refresh before saving.', 409);
    }
    public function storeData($input, $complete = false)
    {
        $data = [];
        foreach (['name'=>100,'website_url'=>255,'short_description'=>255,'description'=>5000,'authorization'=>2000,'relationship'=>30,'logo'=>500] as $key=>$max) $data[$key] = $this->text($input[$key] ?? '', $max, $key);
        $data['category_id'] = (int)($input['category_id'] ?? 0);
        $data['authority_confirmed'] = ($input['authority_confirmed'] ?? false) === true;
        if ($data['website_url']) $data['website_url'] = $this->url($data['website_url'],'website_url');
        if ($complete) {
            $errors = [];
            foreach (['name'=>2,'website_url'=>8,'short_description'=>20,'description'=>80,'authorization'=>40] as $key=>$minimum) if (mb_strlen($data[$key]) < $minimum) $errors[$key] = "Enter at least {$minimum} characters.";
            if (!in_array($data['relationship'],['owner','employee','agency'],true)) $errors['relationship'] = 'Choose your relationship to the brand.';
            if (!$data['authority_confirmed']) $errors['authority_confirmed'] = 'Confirm that you are authorized to represent this brand.';
            if (!$this->one('SELECT id FROM categories WHERE id = ? AND status = 1', [$data['category_id']])) $errors['category_id'] = 'Choose an active category.';
            if ($errors) throw new PartnerError('Complete the store details before submitting.',422,array_merge($errors,['_form'=>'store']));
        }
        return $data;
    }
    public function domain($url) { return preg_replace('/^www\./', '', strtolower(parse_url($url,PHP_URL_HOST) ?: '')); }
    public function saveStore($accountId,$input,$revision)
    {
        $data = $this->storeData($input);
        if ($data['logo']) {
            $prefix = rtrim(getenv('PARTNER_MEDIA_URL') ?: 'https://api.couponpush.com/uploads/partners','/') . '/partner_' . $accountId . '_';
            $valid = preg_match('~^'.preg_quote($prefix,'~').'[a-f0-9]{32}\.(?:png|jpg|webp)$~D',$data['logo']);
            $directory = getenv('PARTNER_UPLOAD_DIRECTORY') ?: dirname(__DIR__).'/uploads/partners';
            if (!$valid || !is_file(rtrim($directory,'/\\').'/'.basename($data['logo']))) throw new PartnerError('Upload your logo using this form.',422,['logo'=>'Use the logo upload.']);
        }
        return $this->atomic(function () use ($accountId,$data,$revision) {
            $row = $this->listing($accountId,true); $this->editable($row,$revision);
            $domain = $data['website_url'] ? $this->domain($data['website_url']) : null;
            if ($row['store_id'] && $row['domain'] !== $domain) throw new PartnerError('Contact CouponPush to change the website of an approved store.',422,['website_url'=>'The approved domain must stay the same.']);
            if ($domain && $this->one('SELECT id FROM partner_listings WHERE domain = ? AND id <> ?',[$domain,$row['id']])) throw new PartnerError('This website already has a submission. Contact CouponPush if you need to claim it.',409);
            $this->run('UPDATE partner_listings SET payload = ?, domain = ?, status = \'draft\', revision = revision + 1, updated_at = ? WHERE id = ?', [json_encode($data),$domain,$this->now(),$row['id']]);
        });
    }
    public function offerData($input,$complete = true)
    {
        $data = [];
        foreach (['title'=>255,'description'=>2000,'code'=>50,'coupon_type'=>10,'discount_type'=>20,'affiliate_link'=>500,'terms_conditions'=>2000,'start_date'=>10,'expiry_date'=>10] as $key=>$max) $data[$key] = $this->text($input[$key] ?? '',$max,$key);
        foreach (['discount_value','min_order_value','max_discount'] as $key) {
            $raw = $input[$key] ?? '';
            if ($raw !== '' && $raw !== null && (!is_numeric($raw) || !is_finite((float)$raw) || (float)$raw < 0 || (float)$raw > 100000000)) throw new PartnerError('Enter a valid non-negative amount.',422,[$key=>'Check this amount.']);
            $data[$key] = $raw === '' || $raw === null ? null : (float)$raw;
        }
        if (!in_array($data['coupon_type'],['code','deal'],true)) throw new PartnerError('Choose coupon code or no-code deal.',422);
        if (!in_array($data['discount_type'],['percentage','flat','cashback','freebie'],true)) throw new PartnerError('Choose a supported saving type.',422);
        if ($data['discount_type'] === 'percentage' && $data['discount_value'] > 100) throw new PartnerError('A percentage cannot exceed 100.',422,['discount_value'=>'Use a percentage from 0 to 100.']);
        if ($data['coupon_type'] === 'deal') $data['code'] = '';
        $errors = [];
        if (mb_strlen($data['title']) < 5) $errors['title'] = 'Describe the offer in at least five characters.';
        if ($complete && mb_strlen($data['description']) < 20) $errors['description'] = 'Explain the offer in at least 20 characters.';
        if ($complete && mb_strlen($data['terms_conditions']) < 20) $errors['terms_conditions'] = 'Explain eligibility and restrictions in at least 20 characters.';
        if ($complete && $data['coupon_type'] === 'code' && !$data['code']) $errors['code'] = 'Enter the coupon code.';
        foreach (['start_date','expiry_date'] as $key) {
            if ($data[$key]) {
                $date = DateTimeImmutable::createFromFormat('!Y-m-d',$data[$key]);
                if (!$date || $date->format('Y-m-d') !== $data[$key]) $errors[$key] = 'Enter a valid date.';
            }
        }
        if ($data['expiry_date'] && $data['start_date'] && $data['expiry_date'] < $data['start_date']) $errors['expiry_date'] = 'Expiry must be on or after the start date.';
        if ($complete && $data['expiry_date'] && $data['expiry_date'] < date('Y-m-d')) $errors['expiry_date'] = 'Renew this expired offer before submitting.';
        if ($errors) throw new PartnerError('Check the offer details.',422,$errors);
        if ($data['affiliate_link'] || $complete) $data['affiliate_link'] = $this->url($data['affiliate_link'],'affiliate_link');
        return $data;
    }
    public function saveOffer($accountId,$input,$revision,$id = 0)
    {
        $data = $this->offerData($input,false);
        $this->atomic(function () use ($accountId,$data,$revision,$id) {
            $row = $this->listing($accountId,true); $this->editable($row,$revision);
            if ($id) {
                if (!$this->one('SELECT id FROM partner_offers WHERE id = ? AND listing_id = ?',[$id,$row['id']])) throw new PartnerError('Offer not found.',404);
                $this->run('UPDATE partner_offers SET payload = ?,status = \'draft\',feedback = NULL,updated_at = ? WHERE id = ? AND listing_id = ?', [json_encode($data),$this->now(),$id,$row['id']]);
            } else {
                if ((int)$this->one('SELECT COUNT(*) AS count FROM partner_offers WHERE listing_id = ?',[$row['id']])['count'] >= 100) throw new PartnerError('Your workspace supports up to 100 offers. Contact CouponPush for bulk updates.',422);
                $this->run('INSERT INTO partner_offers (listing_id,payload,status,updated_at) VALUES (?, ?, \'draft\', ?)',[$row['id'],json_encode($data),$this->now()]);
            }
            $this->run('UPDATE partner_listings SET status = \'draft\',revision = revision + 1,updated_at = ? WHERE id = ?',[$this->now(),$row['id']]);
        });
    }
    public function activity($row,$event,$message,$adminId = null,$snapshot = null)
    {
        $this->run('INSERT INTO partner_activity (listing_id,revision,event,message,snapshot,admin_id,created_at) VALUES (?,?,?,?,?,?,?)',[$row['id'],$row['revision'],$event,$message,$snapshot,$adminId,$this->now()]);
    }
    public function submit($accountId,$revision)
    {
        if (!$this->account($accountId)['verified_at']) throw new PartnerError('Verify your email before submitting.',403);
        $this->atomic(function () use ($accountId,$revision) {
            $row = $this->listing($accountId,true); $this->editable($row,$revision);
            $data = $this->storeData(json_decode($row['payload'],true),true);
            foreach ($this->all('SELECT id,website_url FROM stores') as $store) if ($this->domain($store['website_url']) === $this->domain($data['website_url']) && (int)$store['id'] !== (int)$row['store_id']) throw new PartnerError('This brand already has a listing. Contact CouponPush for an ownership review.',409,['website_url'=>'An existing store cannot be claimed through a new submission.']);
            $offers = $this->all('SELECT * FROM partner_offers WHERE listing_id = ? AND status <> \'withdrawn\'',[$row['id']]);
            if (!$offers) throw new PartnerError('Add at least one coupon or no-code offer before submitting.',422);
            $valid = 0;
            foreach ($offers as $offer) {
                if ($offer['status'] === 'approved') { $published = json_decode($offer['payload'],true); if (!$published['expiry_date'] || $published['expiry_date'] >= date('Y-m-d')) $valid++; continue; }
                try { $this->offerData(json_decode($offer['payload'],true)); }
                catch (PartnerError $error) { $error->fields['_form'] = 'offer'; $error->fields['_offer_id'] = (string)$offer['id']; throw $error; }
                $valid++;
            }
            if (!$valid) throw new PartnerError('Add or renew an active offer before submitting.',422);
            $this->run('UPDATE partner_offers SET status = \'pending_review\',feedback = NULL WHERE listing_id = ? AND status NOT IN (\'approved\',\'withdrawn\')',[$row['id']]);
            $this->run('UPDATE partner_listings SET status = \'pending_review\', feedback = NULL, submitted_at = ?,updated_at = ? WHERE id = ?',[$this->now(),$this->now(),$row['id']]);
            $snapshot = json_encode(['store'=>$data,'offers'=>$offers]);
            $this->activity($row,'submitted','Submitted for CouponPush review.',null,$snapshot);
            $this->mail($this->account($accountId)['email'],'Your brand submission is in review','Your store and offers have been submitted for review. Track progress at '.$this->site.'/partners/');
            $admin = getenv('PARTNER_ADMIN_EMAIL');
            if ($admin && filter_var($admin,FILTER_VALIDATE_EMAIL)) $this->mail($admin,'Brand submission ready for review','Open the CouponPush admin brand submissions queue to review submission '.$row['id'].'.');
        });
    }
    public function publication($row,$reason)
    {
        $this->run('INSERT INTO partner_publications (listing_id,revision,status,reason,created_at) VALUES (?, ?, \'queued\', ?, ?)',[$row['id'],$row['revision'],$reason,$this->now()]);
    }
    public function withdraw($accountId,$revision,$offerId = 0)
    {
        $this->atomic(function () use ($accountId,$revision,$offerId) {
            $row = $this->listing($accountId,true);
            if ((int)$row['revision'] !== (int)$revision) throw new PartnerError('Refresh your workspace before withdrawing.',409);
            if ($row['status'] === 'suspended') throw new PartnerError('Contact CouponPush about this suspended listing.',403);
            if (!$offerId) {
                if ($row['status'] !== 'pending_review') throw new PartnerError('Only a submission in review can be withdrawn.',409);
                $this->run('UPDATE partner_listings SET status = \'draft\',revision = revision + 1,updated_at = ? WHERE id = ?',[$this->now(),$row['id']]);
                $this->run('UPDATE partner_offers SET status = \'draft\' WHERE listing_id = ? AND status = \'pending_review\'',[$row['id']]);
                $this->activity($row,'withdrawn','Submission withdrawn for editing.');
            } else {
                if ($row['status'] === 'pending_review') throw new PartnerError('Withdraw the submission before changing an offer.',409);
                $offer = $this->one('SELECT * FROM partner_offers WHERE id = ? AND listing_id = ?',[$offerId,$row['id']]);
                if (!$offer) throw new PartnerError('Offer not found.',404);
                if ($offer['status'] === 'withdrawn') throw new PartnerError('This offer is already withdrawn.',409);
                $this->run('UPDATE partner_offers SET status = \'withdrawn\',updated_at = ? WHERE id = ?',[$this->now(),$offerId]);
                $this->run('UPDATE partner_listings SET revision = revision + 1,updated_at = ? WHERE id = ?',[$this->now(),$row['id']]);
                $row['revision']++;
                if ($offer['coupon_id']) {
                    $this->run('UPDATE coupons SET status = 0 WHERE id = ? AND store_id = ?',[$offer['coupon_id'],$row['store_id']]);
                    $this->run('UPDATE stores SET partner_revision = ? WHERE id = ?',[$row['revision'],$row['store_id']]);
                    $this->publication($row,'Offer withdrawal');
                }
                $this->activity($row,'offer_withdrawn','An offer was withdrawn; any website update is tracked separately.');
            }
        });
    }
    public function dashboard($accountId)
    {
        $row = $this->listing($accountId);
        $row['payload'] = json_decode($row['payload'],true) ?: (object)[];
        $row['revision'] = (int)$row['revision'];
        $offers = $this->all('SELECT p.*,c.click_count AS clicks,(SELECT COUNT(*) FROM partner_views v WHERE v.offer_id = p.id) AS views FROM partner_offers p LEFT JOIN coupons c ON c.id = p.coupon_id WHERE p.listing_id = ? ORDER BY p.id DESC',[$row['id']]);
        foreach ($offers as &$offer) {
            $offer['payload'] = json_decode($offer['payload'],true);
            $offer['id'] = (int)$offer['id']; $offer['clicks'] = (int)($offer['clicks'] ?? 0);
            $offer['views'] = (int)$offer['views'];
            $offer['expired'] = $offer['status'] === 'approved' && $offer['payload']['expiry_date'] && $offer['payload']['expiry_date'] < date('Y-m-d');
            $offer['scheduled'] = $offer['status'] === 'approved' && $offer['payload']['start_date'] && $offer['payload']['start_date'] > date('Y-m-d');
        }
        unset($offer);
        $store = $row['store_id'] ? $this->one('SELECT slug,status FROM stores WHERE id = ?',[$row['store_id']]) : null;
        $publication = $this->one('SELECT id,revision,status,reason,error,created_at,verified_at FROM partner_publications WHERE listing_id = ? ORDER BY id DESC LIMIT 1',[$row['id']]);
        $row['public_url'] = $store && $store['status'] ? $this->site.'/stores/view/?slug='.rawurlencode($store['slug']) : null;
        $row['canonical_url'] = $store ? $this->site.'/store/'.rawurlencode($store['slug']).'/' : null;
        return ['listing'=>$row,'offers'=>$offers,'publication'=>$publication,
            'activity'=>$this->all('SELECT event,message,revision,created_at FROM partner_activity WHERE listing_id = ? ORDER BY id DESC LIMIT 100',[$row['id']]),
            'metrics'=>['offer_views'=>array_sum(array_column($offers,'views')),'offer_clicks'=>array_sum(array_column($offers,'clicks')),'store_views'=>(int)$this->one('SELECT COUNT(*) AS count FROM partner_views WHERE listing_id = ? AND offer_id IS NULL',[$row['id']])['count']],
            'categories'=>$this->all('SELECT id,name FROM categories WHERE status = 1 ORDER BY name')];
    }
    public function requireAdmin($adminId)
    {
        if (!$this->one('SELECT id FROM users WHERE id = ? AND role = \'admin\' AND status = 1',[(int)$adminId])) throw new PartnerError('Only a CouponPush administrator can review brand submissions.',403);
    }
    public function review($listingId,$revision,$decision,$feedback,$approvedIds,$reasons,$slug,$adminId,$authorizationReviewed = false)
    {
        $this->requireAdmin($adminId);
        if ($decision === 'approve' && !$authorizationReviewed) throw new PartnerError('Confirm the applicant’s authorization before approving.',422);
        if (!in_array($decision,['approve','changes_requested','rejected'],true)) throw new PartnerError('Choose a review decision.',422);
        $feedback = $this->text($feedback,2000,'feedback');
        if ($decision !== 'approve' && mb_strlen($feedback) < 10) throw new PartnerError('Explain the requested changes or rejection in at least ten characters.',422);
        $approvedIds = array_unique(array_map('intval',$approvedIds));
        return $this->atomic(function () use ($listingId,$revision,$decision,$feedback,$approvedIds,$reasons,$slug,$adminId) {
            $row = $this->one('SELECT * FROM partner_listings WHERE id = ?'.$this->lock(),[(int)$listingId]);
            if (!$row || $row['status'] !== 'pending_review' || (int)$row['revision'] !== (int)$revision) throw new PartnerError('This review is no longer current. Refresh the submission.',409);
            $account = $this->account($row['account_id']);
            if (!$account || !$account['verified_at'] || $account['suspended_at']) throw new PartnerError('The brand account is not eligible for approval.',409);
            $offers = $this->all('SELECT * FROM partner_offers WHERE listing_id = ? AND status = \'pending_review\'',[$row['id']]);
            $pendingIds = array_map('intval',array_column($offers,'id'));
            if (array_diff($approvedIds,$pendingIds)) throw new PartnerError('An offer does not belong to this review.',422);
            $data = json_decode($row['payload'],true);
            if ($decision === 'approve') {
                $data = $this->storeData($data,true);
                $activeExisting = $row['store_id'] ? (int)$this->one('SELECT COUNT(*) AS count FROM coupons WHERE store_id = ? AND status = 1 AND (expiry_date IS NULL OR expiry_date >= ?) ',[$row['store_id'],date('Y-m-d')])['count'] : 0;
                if (!$approvedIds && !$activeExisting) throw new PartnerError('Approve at least one active offer before publishing this store.',422);
                foreach ($this->all('SELECT id,website_url FROM stores') as $existing) if ($this->domain($existing['website_url']) === $this->domain($data['website_url']) && (int)$existing['id'] !== (int)$row['store_id']) throw new PartnerError('This website already belongs to a public store. Resolve ownership separately.',409);
                foreach ($offers as $offer) {
                    if (in_array((int)$offer['id'],$approvedIds,true)) $this->offerData(json_decode($offer['payload'],true));
                    elseif (mb_strlen(trim($reasons[$offer['id']] ?? $feedback)) < 10) throw new PartnerError('Add feedback for every offer you are not approving.',422);
                }
                $published = $row['store_id'] ? $this->one('SELECT slug FROM stores WHERE id = ?',[$row['store_id']]) : null;
                $slug = $published ? $published['slug'] : strtolower(trim($slug));
                // Redirect aliases and the editorial festival page are already owned by the static frontend.
                $reserved = ['view','new','seo-audit-nonexistent-store','amazon-prime-day-sale-2026','cetaphil','derma-co-coupon-code','dot-key-coupon-codes','amazon-great-indian-festival-2026'];
                if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/',$slug) || strlen($slug) > 100 || in_array($slug,$reserved,true)) throw new PartnerError('Choose a valid final store slug that is not a redirect or editorial page.',422);
                if ($this->one('SELECT id FROM stores WHERE slug = ? AND id <> ?',[$slug,$row['store_id'] ?: 0])) throw new PartnerError('This store slug is already in use.',409);
                $fields = ['name'=>$data['name'],'website_url'=>$data['website_url'],'category_id'=>$data['category_id'],'short_description'=>$data['short_description'],
                    'description'=>$data['description'],'about_content'=>'<p>'.htmlspecialchars($data['description'],ENT_QUOTES,'UTF-8').'</p>',
                    'logo'=>$data['logo'] ?: null,'meta_title'=>$data['name'].' Coupons & Offers | CouponPush','meta_description'=>$data['short_description'],
                    'partner_revision'=>(int)$row['revision'],'status'=>1];
                if ($row['store_id']) $this->updateCatalog('stores',$fields,$row['store_id']);
                else {
                    $fields['slug'] = $slug; $fields['is_featured'] = 0; $fields['is_popular'] = 0;
                    $row['store_id'] = $this->insertCatalog('stores',$fields);
                    $this->run('UPDATE partner_listings SET store_id = ? WHERE id = ?',[$row['store_id'],$row['id']]);
                }
                foreach ($offers as $offer) {
                    if (in_array((int)$offer['id'],$approvedIds,true)) {
                        $coupon = $this->offerData(json_decode($offer['payload'],true));
                        foreach (['start_date','expiry_date','code'] as $field) if ($coupon[$field] === '') $coupon[$field] = null;
                        $coupon['store_id'] = (int)$row['store_id']; $coupon['category_id'] = $data['category_id'];
                        $coupon['is_verified'] = 0; $coupon['is_featured'] = 0; $coupon['status'] = 1;
                        $coupon['source_url'] = $coupon['affiliate_link']; $coupon['checked_at'] = date('Y-m-d'); $coupon['verification_method'] = 'merchant_advertised';
                        if ($offer['coupon_id']) $this->updateCatalog('coupons',$coupon,$offer['coupon_id']);
                        else $offer['coupon_id'] = $this->insertCatalog('coupons',$coupon);
                        $this->run('UPDATE partner_offers SET coupon_id = ?,status = \'approved\',feedback = ?,updated_at = ? WHERE id = ?',[$offer['coupon_id'],$feedback ?: null,$this->now(),$offer['id']]);
                    } else $this->run('UPDATE partner_offers SET status = \'rejected\',feedback = ?,updated_at = ? WHERE id = ?',[$this->text($reasons[$offer['id']] ?? $feedback,2000,'feedback'),$this->now(),$offer['id']]);
                }
                $this->publication($row,'Approved store and offer updates');
                $status = 'approved'; $message = $feedback ?: 'Your store and selected offers were approved. The website update is pending.';
            } else {
                $status = $decision; $message = $feedback;
                $this->run('UPDATE partner_offers SET status = ?,feedback = ?,updated_at = ? WHERE listing_id = ? AND status = \'pending_review\'',[$status,$feedback,$this->now(),$row['id']]);
            }
            $this->run('UPDATE partner_listings SET status = ?,feedback = ?,updated_at = ? WHERE id = ?',[$status,$message,$this->now(),$row['id']]);
            $this->activity($row,$status,$message,(int)$adminId,json_encode(['store'=>$data,'offers'=>$offers,'approved_offer_ids'=>$approvedIds]));
            $this->mail($account['email'],'CouponPush review update',$message."\n\nOpen your workspace: ".$this->site.'/partners/');
            return $row['store_id'];
        });
    }
    public function insertCatalog($table,$fields)
    {
        if (!in_array($table,['stores','coupons'],true)) throw new RuntimeException('Invalid catalog table.');
        $keys = array_keys($fields);
        $this->run('INSERT INTO '.$table.' ('.implode(',',$keys).') VALUES ('.implode(',',array_fill(0,count($keys),'?')).')',array_values($fields));
        return (int)$this->pdo->lastInsertId();
    }
    public function updateCatalog($table,$fields,$id)
    {
        if (!in_array($table,['stores','coupons'],true)) throw new RuntimeException('Invalid catalog table.');
        $assignments = array_map(function ($key) { return $key.' = ?'; },array_keys($fields));
        $this->run('UPDATE '.$table.' SET '.implode(',',$assignments).' WHERE id = ?',array_merge(array_values($fields),[(int)$id]));
    }
    public function verifyPublication($listingId,$adminId)
    {
        $this->requireAdmin($adminId);
        $job = $this->one('SELECT p.*,l.store_id,s.slug FROM partner_publications p JOIN partner_listings l ON l.id = p.listing_id JOIN stores s ON s.id = l.store_id WHERE p.listing_id = ? ORDER BY p.id DESC LIMIT 1',[(int)$listingId]);
        if (!$job) throw new PartnerError('There is no approved website update to verify.',404);
        if ($job['status'] === 'succeeded') return;
        // Destination is the configured public site, never a merchant-provided address.
        $url = $this->site.'/store/'.rawurlencode($job['slug']).'/';
        $curl = curl_init($url);
        curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>15,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS]);
        $body = curl_exec($curl); $status = curl_getinfo($curl,CURLINFO_HTTP_CODE); curl_close($curl);
        if ($status !== 200 || !is_string($body) || strpos($body,'data-partner-revision="'.$job['revision'].'"') === false || strpos($body,'href="'.$url.'"') === false) {
            $this->run('UPDATE partner_publications SET status = \'failed\',error = ? WHERE id = ?',['The latest approved version is not visible at the canonical store URL yet. Rebuild and deploy, then retry.',$job['id']]);
            throw new PartnerError('The approved version is not published yet. Rebuild and deploy the frontend, then retry verification.',409);
        }
        $this->atomic(function () use ($job,$url) {
            $current = $this->one('SELECT * FROM partner_publications WHERE id = ?'.$this->lock(),[$job['id']]);
            if ($current['status'] === 'succeeded') return;
            $this->run('UPDATE partner_publications SET status = \'succeeded\',error = NULL,verified_at = ? WHERE id = ?',[$this->now(),$job['id']]);
            $row = $this->one('SELECT * FROM partner_listings WHERE id = ?',[$job['listing_id']]);
            $this->activity(array_merge($row,['revision'=>$job['revision']]),'published','The approved website update is now published.');
            $this->mail($this->account($row['account_id'])['email'],'Your CouponPush website update is published','Your approved changes are now available: '.$url);
        });
    }
    public function deliverMail($limit = 10)
    {
        $sent = 0;
        foreach ($this->all('SELECT id FROM partner_mail WHERE status IN (\'queued\',\'retry\') AND next_attempt_at <= ? ORDER BY id LIMIT '.max(1,min(100,(int)$limit)),[$this->now()]) as $candidate) {
            $mail = $this->atomic(function () use ($candidate) {
                $row = $this->one('SELECT * FROM partner_mail WHERE id = ?'.$this->lock(),[$candidate['id']]);
                if (!$row || !in_array($row['status'],['queued','retry'],true) || $row['next_attempt_at'] > $this->now()) return null;
                $this->run('UPDATE partner_mail SET status = \'sending\',attempts = attempts + 1,next_attempt_at = ? WHERE id = ?',[gmdate('Y-m-d H:i:s',time()+300),$row['id']]);
                return $row;
            });
            if (!$mail) continue;
            $ok = false;
            if (getenv('PARTNER_MAIL_TRANSPORT') === 'file') {
                $directory = getenv('PARTNER_MAIL_DIRECTORY');
                if (!$directory) throw new RuntimeException('File mail requires a private directory.');
                if (!is_dir($directory)) mkdir($directory,0700,true);
                $file = rtrim($directory,'/\\').'/'.$mail['id'].'.json';
                $ok = file_put_contents($file,json_encode($mail)) !== false;
                if ($ok) chmod($file,0600);
            } else {
                $from = getenv('PARTNER_MAIL_FROM') ?: 'partners@couponpush.com';
                if (!filter_var($from,FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/',$from)) throw new RuntimeException('Invalid sender address.');
                $ok = @mail($mail['recipient'],$mail['subject'],$mail['body'],"From: CouponPush Partners <$from>\r\nContent-Type: text/plain; charset=UTF-8\r\n");
            }
            if ($ok) { $this->run('UPDATE partner_mail SET status = \'sent\',sent_at = ?,body = \'\' WHERE id = ?',[$this->now(),$mail['id']]); $sent++; }
            else $this->run('UPDATE partner_mail SET status = \'retry\',next_attempt_at = ? WHERE id = ?',[gmdate('Y-m-d H:i:s',time()+300),$mail['id']]);
        }
        return $sent;
    }
}
