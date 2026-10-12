-- Additive merchant accounts, review drafts and notification/publication queues.
-- Run via `php api/partner-tools.php migrate`; existing admin users remain separate.
CREATE TABLE IF NOT EXISTS partner_accounts (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(190) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 verified_at DATETIME DEFAULT NULL,
 suspended_at DATETIME DEFAULT NULL,
 session_version INT NOT NULL DEFAULT 1,
 terms_version VARCHAR(30) NOT NULL,
 terms_accepted_at DATETIME NOT NULL,
 created_at DATETIME NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY partner_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_tokens (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 account_id INT UNSIGNED NOT NULL,
 kind VARCHAR(12) NOT NULL,
 token_hash CHAR(64) NOT NULL,
 expires_at DATETIME NOT NULL,
 consumed_at DATETIME DEFAULT NULL,
 created_at DATETIME NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY partner_token_hash (token_hash),
 KEY partner_token_account (account_id),
 FOREIGN KEY (account_id) REFERENCES partner_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_listings (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 account_id INT UNSIGNED NOT NULL,
 store_id INT DEFAULT NULL,
 domain VARCHAR(190) DEFAULT NULL,
 payload LONGTEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'draft',
 revision INT NOT NULL DEFAULT 1,
 feedback TEXT DEFAULT NULL,
 submitted_at DATETIME DEFAULT NULL,
 updated_at DATETIME NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY partner_listing_account (account_id),
 UNIQUE KEY partner_listing_domain (domain),
 FOREIGN KEY (account_id) REFERENCES partner_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_offers (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 listing_id INT UNSIGNED NOT NULL,
 coupon_id INT DEFAULT NULL,
 payload LONGTEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'draft',
 feedback TEXT DEFAULT NULL,
 updated_at DATETIME NOT NULL,
 PRIMARY KEY (id), KEY partner_offer_listing (listing_id), UNIQUE KEY partner_coupon (coupon_id),
 FOREIGN KEY (listing_id) REFERENCES partner_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_activity (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 listing_id INT UNSIGNED NOT NULL,
 revision INT NOT NULL,
 event VARCHAR(40) NOT NULL,
 message TEXT NOT NULL,
 snapshot LONGTEXT DEFAULT NULL,
 admin_id INT DEFAULT NULL,
 created_at DATETIME NOT NULL,
 PRIMARY KEY (id), KEY partner_activity_listing (listing_id),
 FOREIGN KEY (listing_id) REFERENCES partner_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_mail (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 recipient VARCHAR(190) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 body TEXT NOT NULL,
 status VARCHAR(12) NOT NULL DEFAULT 'queued',
 attempts INT NOT NULL DEFAULT 0,
 next_attempt_at DATETIME NOT NULL,
 created_at DATETIME NOT NULL,
 sent_at DATETIME DEFAULT NULL,
 PRIMARY KEY (id), KEY partner_mail_queue (status,next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_publications (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 listing_id INT UNSIGNED NOT NULL,
 revision INT NOT NULL,
 status VARCHAR(12) NOT NULL DEFAULT 'queued',
 reason VARCHAR(255) NOT NULL,
 error TEXT DEFAULT NULL,
 created_at DATETIME NOT NULL,
 verified_at DATETIME DEFAULT NULL,
 PRIMARY KEY (id), UNIQUE KEY partner_publication_revision (listing_id,revision),
 FOREIGN KEY (listing_id) REFERENCES partner_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_rate_limits (
 bucket CHAR(64) NOT NULL,
 hits INT NOT NULL DEFAULT 1,
 expires_at DATETIME NOT NULL,
 PRIMARY KEY (bucket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_views (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT,
 listing_id INT UNSIGNED NOT NULL,
 offer_id INT UNSIGNED DEFAULT NULL,
 event_key CHAR(64) NOT NULL,
 created_at DATETIME NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY partner_view_event (event_key), KEY partner_views_listing (listing_id), KEY partner_views_offer (offer_id),
 FOREIGN KEY (listing_id) REFERENCES partner_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
