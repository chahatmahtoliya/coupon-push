<?php
/** Private server-side mail configuration and Resend HTTP transport. */
function partnerLoadMailEnvironment()
{
    $path = getenv('PARTNER_MAIL_ENV_FILE') ?: dirname(__DIR__).'/.env.local';
    if (!is_file($path) || !is_readable($path)) return;
    $allowed = ['RESEND_API_KEY','RESEND_FROM','PARTNER_MAIL_FROM','PARTNER_MAIL_TRANSPORT'];
    foreach (file($path, FILE_IGNORE_NEW_LINES) as $line) {
        if (!preg_match('/^\s*([A-Z_]+)\s*=(.*)$/', $line, $match)) continue;
        $name = $match[1];
        if (!in_array($name, $allowed, true) || getenv($name) !== false) continue;
        $value = trim($match[2]);
        if (strlen($value) >= 2 && (($value[0] === '"' && substr($value,-1) === '"') || ($value[0] === "'" && substr($value,-1) === "'"))) {
            $value = substr($value,1,-1);
        }
        putenv($name.'='.$value);
    }
}

class PartnerResendTransport
{
    protected function request($payload, $key, $idempotencyKey)
    {
        $curl = curl_init('https://api.resend.com/emails');
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$key,
                'Content-Type: application/json',
                'Idempotency-Key: '.$idempotencyKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);
        $body = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        return [$status, $body];
    }

    public function send($recipient, $subject, $text, $idempotencyKey)
    {
        $key = getenv('RESEND_API_KEY');
        $from = getenv('PARTNER_MAIL_FROM') ?: (getenv('RESEND_FROM') ?: 'CouponPush Partners <partners@mail.couponpush.com>');
        $address = preg_match('/<([^<>]+)>$/', $from, $match) ? $match[1] : $from;
        if (!$key || preg_match('/[\r\n]/', $key) || !filter_var($address,FILTER_VALIDATE_EMAIL)
            || preg_match('/[\r\n]/', $from) || strtolower(substr(strrchr($address,'@'),1)) === 'resend.dev'
            || !filter_var($recipient,FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $recipient)
            || !$idempotencyKey || strlen($idempotencyKey) > 256 || preg_match('/[\r\n]/', $idempotencyKey)) {
            return ['data'=>null,'error'=>['name'=>'configuration_error','statusCode'=>null]];
        }
        if (!function_exists('curl_init')) {
            return ['data'=>null,'error'=>['name'=>'curl_unavailable','statusCode'=>null]];
        }
        // The HTTP API returns a direct body; normalize it for queue handling.
        list($status, $body) = $this->request(['from'=>$from,'to'=>[$recipient],'subject'=>$subject,'text'=>$text],$key,$idempotencyKey);
        $response = is_string($body) ? json_decode($body,true) : null;
        if ($status >= 200 && $status < 300 && is_array($response) && !empty($response['id'])) {
            return ['data'=>['id'=>$response['id']],'error'=>null];
        }
        $name = is_array($response) ? ($response['name'] ?? 'api_error') : 'network_error';
        // Never log provider response bodies, which can contain private message data.
        if (!is_string($name) || !preg_match('/^[a-z0-9_]+$/i',$name)) $name = 'api_error';
        return ['data'=>null,'error'=>['name'=>$name,'statusCode'=>$status ?: null]];
    }
}
