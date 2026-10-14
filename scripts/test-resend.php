<?php
/** CLI-only live smoke check using Resend's delivery simulation recipient. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__).'/includes/partner-mail.php';
partnerLoadMailEnvironment();
$result = (new PartnerResendTransport())->send(
    'delivered@resend.dev',
    'CouponPush Resend delivery check',
    'The CouponPush PHP Resend transport is connected. This message uses the official delivery simulation recipient.',
    'resend-setup-test/'.bin2hex(random_bytes(16))
);
if ($result['error']) {
    fwrite(STDERR,'Resend delivery check failed: '.$result['error']['name'].' ('.($result['error']['statusCode'] ?? 'no status').").\n");
    exit(1);
}
echo json_encode(['id'=>$result['data']['id'],'recipient'=>'delivered@resend.dev','status'=>'accepted'])."\n";
