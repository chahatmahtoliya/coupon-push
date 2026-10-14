<?php
/** Isolated transport/queue regression checks. No network requests or real email. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__,2).'/includes/partners.php';
putenv('RESEND_API_KEY='.bin2hex(random_bytes(16)));
putenv('RESEND_FROM=CouponPush Partners <partners@mail.couponpush.com>');
putenv('PARTNER_MAIL_FROM');
putenv('PARTNER_MAIL_TRANSPORT=resend');

function check($condition, $description)
{
    if (!$condition) throw new RuntimeException($description);
}
class FakeResendTransport extends PartnerResendTransport
{
    public $response = [200,'{"id":"accepted-email-id"}'];
    public $requests = [];
    protected function request($payload, $key, $idempotencyKey)
    {
        $this->requests[] = ['payload'=>$payload,'idempotencyKey'=>$idempotencyKey];
        return $this->response;
    }
}
class MailQueueService extends PartnerService
{
    public $transport;
    protected function resendTransport() { return $this->transport; }
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
$pdo->exec("CREATE TABLE partner_mail (id INTEGER PRIMARY KEY AUTOINCREMENT,recipient TEXT,subject TEXT,body TEXT,status TEXT,attempts INTEGER DEFAULT 0,next_attempt_at TEXT,created_at TEXT,sent_at TEXT)");
$service = new MailQueueService($pdo);
$service->transport = new FakeResendTransport();
$service->mail('delivered@resend.dev','Queue check','Private message body');
check($service->deliverMail() === 1,'An accepted email must be counted.');
$row = $service->one('SELECT * FROM partner_mail WHERE id = 1');
check($row['status'] === 'sent' && $row['body'] === '' && $row['sent_at'],'Accepted mail must clear its body and record acceptance.');
check($service->transport->requests[0]['payload']['from'] === getenv('RESEND_FROM'),'Use the configured verified sender.');
check($service->transport->requests[0]['payload']['to'] === ['delivered@resend.dev'],'Send to the queued recipient.');

$service->transport->response = [429,'{"name":"rate_limit_exceeded","message":"Too many requests"}'];
$service->mail('delivered@resend.dev','Retry check','Keep this body');
check($service->deliverMail() === 0,'Rejected email must not be counted as sent.');
$row = $service->one('SELECT * FROM partner_mail WHERE id = 2');
check($row['status'] === 'retry' && $row['body'] === 'Keep this body' && (int)$row['attempts'] === 1,'Failures must retain message data for retry.');
check($row['next_attempt_at'] > $service->now(),'Backoff must defer another attempt.');
$key = $service->transport->requests[1]['idempotencyKey'];
check($key !== $service->transport->requests[0]['idempotencyKey'],'Separate messages need separate keys.');
$service->run('UPDATE partner_mail SET next_attempt_at = ? WHERE id = 2',[$service->now()]);
$service->transport->response = [200,'{"id":"retried-email-id"}'];
check($service->deliverMail() === 1,'A successful retry must be accepted.');
check($service->transport->requests[2]['idempotencyKey'] === $key,'Retries must reuse the original idempotency key.');
check($service->transport->requests[2]['payload'] === $service->transport->requests[1]['payload'],'Retries must preserve the request payload.');
check($service->one('SELECT body FROM partner_mail WHERE id = 2')['body'] === '','Clear message data only after success.');

foreach ([[0,false],[200,'not json'],[200,'{}'],[401,'{"name":"validation_error"}'],[500,'{"name":"bad response with private data"}']] as $response) {
    $service->transport->response = $response;
    $result = $service->transport->send('delivered@resend.dev','Failure check','Body','test/failure');
    check($result['data'] === null && $result['error'] !== null,'Network and invalid responses must be errors.');
    check(preg_match('/^[a-z0-9_]+$/i',$result['error']['name']),'Error diagnostics must omit raw response content.');
}
$count = count($service->transport->requests);
putenv('PARTNER_MAIL_FROM=onboarding@resend.dev');
$result = $service->transport->send('delivered@resend.dev','Configuration check','Body','test/config');
check($result['error']['name'] === 'configuration_error' && count($service->transport->requests) === $count,'Reject a production test-domain sender without sending.');
putenv('PARTNER_MAIL_FROM');
putenv('RESEND_API_KEY');
$result = $service->transport->send('delivered@resend.dev','Configuration check','Body','test/config');
check($result['error']['name'] === 'configuration_error','A missing key must fail safely.');
echo "Resend transport and queue checks passed. No network requests were made.\n";
