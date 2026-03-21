-- Seasonal Offers Schema
-- Migration for festival/occasion-based promotional banners

-- Create seasonal_offers table
CREATE TABLE IF NOT EXISTS seasonal_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    banner_image VARCHAR(500),
    mobile_banner_image VARCHAR(500),
    theme_color VARCHAR(20) DEFAULT '#FF6B35',
    gradient_start VARCHAR(20),
    gradient_end VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_dates (is_active, start_date, end_date),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create junction table for seasonal offer coupons
CREATE TABLE IF NOT EXISTS seasonal_offer_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seasonal_offer_id INT NOT NULL,
    coupon_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seasonal_offer_id) REFERENCES seasonal_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_offer_coupon (seasonal_offer_id, coupon_id),
    INDEX idx_offer (seasonal_offer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample seasonal offer data for Holi
INSERT INTO seasonal_offers (name, slug, description, theme_color, gradient_start, gradient_end, start_date, end_date, is_active, display_order) VALUES
('Holi Special Offers', 'holi-special', 'Celebrate the festival of colors with amazing discounts! Splash into savings on electronics, fashion, and more.', '#FF6B9D', '#FF6B9D', '#FF9A56', '2026-03-01', '2026-03-15', 1, 1);

-- You can link coupons to this offer using:
-- INSERT INTO seasonal_offer_coupons (seasonal_offer_id, coupon_id) VALUES (1, <coupon_id>);
