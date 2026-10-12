<?php
/** CLI-only installation and queued email delivery. Never expose this as an HTTP action. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__).'/includes/partners.php';
try {
    $service = new PartnerService(partnerConnection());
    $command = $argv[1] ?? 'status';
    if ($command === 'migrate') {
        if ($service->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') throw new RuntimeException('Production migration requires MySQL or MariaDB.');
        $sql = file_get_contents(dirname(__DIR__).'/database/add_partners.sql');
        foreach (explode(';',$sql) as $statement) if (trim($statement)) $service->pdo->exec($statement);
        foreach (['partner_revision'=>'INT DEFAULT NULL','about_content'=>'TEXT DEFAULT NULL'] as $column=>$definition) {
            if (!$service->one('SHOW COLUMNS FROM stores LIKE ?',[$column])) $service->pdo->exec('ALTER TABLE stores ADD COLUMN '.$column.' '.$definition);
        }
        foreach (['source_url'=>'VARCHAR(500) DEFAULT NULL','checked_at'=>'DATE DEFAULT NULL','verification_method'=>'VARCHAR(32) DEFAULT NULL'] as $column=>$definition) {
            if (!$service->one('SHOW COLUMNS FROM coupons LIKE ?',[$column])) $service->pdo->exec('ALTER TABLE coupons ADD COLUMN '.$column.' '.$definition);
        }
        echo "Partner tables and catalog fields are ready. Existing users and catalog records were preserved.\n";
    } elseif ($command === 'mail') {
        if (!$service->ready()) throw new RuntimeException('Run the migration first.');
        $service->run('UPDATE partner_mail SET status = \'retry\' WHERE status = \'sending\' AND next_attempt_at <= ?',[$service->now()]);
        echo 'Accepted messages: '.$service->deliverMail(50)."\n";
        $service->run('DELETE FROM partner_rate_limits WHERE expires_at < ?',[$service->now()]);
        $service->run('DELETE FROM partner_tokens WHERE expires_at < ?',[gmdate('Y-m-d H:i:s',time()-86400)]);
    } elseif ($command === 'status') {
        echo $service->ready() ? "Partner database is ready.\n" : "Partner migration is required.\n";
    } else throw new RuntimeException('Usage: php api/partner-tools.php migrate|mail|status');
} catch (Throwable $error) { fwrite(STDERR,"Partner operation failed: ".$error->getMessage()."\n"); exit(1); }
