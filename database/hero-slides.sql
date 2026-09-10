-- Only needed on installations without the existing hero_slides table.
CREATE TABLE IF NOT EXISTS hero_slides (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    heading VARCHAR(255) NOT NULL DEFAULT '',
    subheading TEXT,
    badge_text VARCHAR(255) NOT NULL DEFAULT '',
    cta_label VARCHAR(255) NOT NULL DEFAULT '',
    cta_url TEXT,
    image TEXT NOT NULL,
    alt_text VARCHAR(255) NOT NULL DEFAULT '',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    INDEX idx_hero_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
