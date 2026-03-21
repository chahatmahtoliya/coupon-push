-- =====================================================
-- CouponHub Database Schema
-- MySQL Database for Coupons & Offers Website
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- Table: users (Admin Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) DEFAULT NULL,
    `role` ENUM('admin', 'editor') DEFAULT 'admin',
    `status` TINYINT(1) DEFAULT 1,
    `last_login` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`) VALUES
('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- =====================================================
-- Table: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) DEFAULT 'fas fa-tag',
    `image` VARCHAR(255) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `meta_title` VARCHAR(255) DEFAULT NULL,
    `meta_description` TEXT DEFAULT NULL,
    `display_order` INT(11) DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO `categories` (`name`, `slug`, `icon`, `description`, `display_order`) VALUES
('Electronics', 'electronics', 'fas fa-laptop', 'Best deals on electronics, mobiles, laptops and more', 1),
('Fashion & Lifestyle', 'fashion-lifestyle', 'fas fa-tshirt', 'Clothing, footwear, accessories and fashion deals', 2),
('Food & Dining', 'food-dining', 'fas fa-utensils', 'Restaurant deals, food delivery coupons and more', 3),
('Travel & Hotels', 'travel-hotels', 'fas fa-plane', 'Flight bookings, hotel deals and travel offers', 4),
('Beauty & Health', 'beauty-health', 'fas fa-spa', 'Beauty products, skincare and health deals', 5),
('Home & Kitchen', 'home-kitchen', 'fas fa-home', 'Furniture, appliances and home decor deals', 6),
('Entertainment', 'entertainment', 'fas fa-film', 'Movies, streaming services and entertainment deals', 7),
('Grocery', 'grocery', 'fas fa-shopping-basket', 'Grocery delivery and supermarket deals', 8);

-- =====================================================
-- Table: stores
-- =====================================================
CREATE TABLE IF NOT EXISTS `stores` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `logo` VARCHAR(255) DEFAULT NULL,
    `website_url` VARCHAR(255) NOT NULL,
    `affiliate_url` VARCHAR(500) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `short_description` VARCHAR(255) DEFAULT NULL,
    `category_id` INT(11) DEFAULT NULL,
    `meta_title` VARCHAR(255) DEFAULT NULL,
    `meta_description` TEXT DEFAULT NULL,
    `is_featured` TINYINT(1) DEFAULT 0,
    `is_popular` TINYINT(1) DEFAULT 0,
    `rating` DECIMAL(2,1) DEFAULT 4.0,
    `total_coupons` INT(11) DEFAULT 0,
    `click_count` INT(11) DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `category_id` (`category_id`),
    CONSTRAINT `stores_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample stores
INSERT INTO `stores` (`name`, `slug`, `website_url`, `affiliate_url`, `short_description`, `category_id`, `is_featured`, `is_popular`) VALUES
('Amazon', 'amazon', 'https://www.amazon.in', 'https://www.amazon.in/?tag=youraffid', 'India\'s largest online shopping store', 1, 1, 1),
('Flipkart', 'flipkart', 'https://www.flipkart.com', 'https://www.flipkart.com/?affid=youraffid', 'Shop for electronics, fashion and more', 1, 1, 1),
('Myntra', 'myntra', 'https://www.myntra.com', 'https://www.myntra.com/?affid=youraffid', 'Fashion and lifestyle destination', 2, 1, 1),
('Zomato', 'zomato', 'https://www.zomato.com', 'https://www.zomato.com/?affid=youraffid', 'Food delivery and restaurant deals', 3, 1, 1),
('Swiggy', 'swiggy', 'https://www.swiggy.com', 'https://www.swiggy.com/?affid=youraffid', 'Food delivery at your doorstep', 3, 1, 1),
('MakeMyTrip', 'makemytrip', 'https://www.makemytrip.com', 'https://www.makemytrip.com/?affid=youraffid', 'Flights, hotels and holiday packages', 4, 1, 1),
('Nykaa', 'nykaa', 'https://www.nykaa.com', 'https://www.nykaa.com/?affid=youraffid', 'Beauty and wellness products', 5, 1, 1),
('Ajio', 'ajio', 'https://www.ajio.com', 'https://www.ajio.com/?affid=youraffid', 'Curated fashion brands', 2, 0, 1);

-- =====================================================
-- Table: coupons
-- =====================================================
CREATE TABLE IF NOT EXISTS `coupons` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `code` VARCHAR(50) DEFAULT NULL,
    `coupon_type` ENUM('code', 'deal', 'offer') DEFAULT 'code',
    `discount_type` ENUM('percentage', 'flat', 'cashback', 'freebie') DEFAULT 'percentage',
    `discount_value` VARCHAR(50) DEFAULT NULL,
    `min_order_value` DECIMAL(10,2) DEFAULT NULL,
    `max_discount` DECIMAL(10,2) DEFAULT NULL,
    `store_id` INT(11) NOT NULL,
    `category_id` INT(11) DEFAULT NULL,
    `affiliate_link` VARCHAR(500) DEFAULT NULL,
    `terms_conditions` TEXT DEFAULT NULL,
    `start_date` DATE DEFAULT NULL,
    `expiry_date` DATE DEFAULT NULL,
    `is_featured` TINYINT(1) DEFAULT 0,
    `is_verified` TINYINT(1) DEFAULT 1,
    `is_exclusive` TINYINT(1) DEFAULT 0,
    `click_count` INT(11) DEFAULT 0,
    `success_count` INT(11) DEFAULT 0,
    `display_order` INT(11) DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `store_id` (`store_id`),
    KEY `category_id` (`category_id`),
    KEY `expiry_date` (`expiry_date`),
    KEY `is_featured` (`is_featured`),
    CONSTRAINT `coupons_store_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
    CONSTRAINT `coupons_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample coupons
INSERT INTO `coupons` (`title`, `description`, `code`, `coupon_type`, `discount_type`, `discount_value`, `store_id`, `category_id`, `affiliate_link`, `expiry_date`, `is_featured`, `is_verified`) VALUES
('Flat 50% OFF on Electronics', 'Get flat 50% discount on all electronics. Limited time offer!', 'ELEC50', 'code', 'percentage', '50', 1, 1, 'https://www.amazon.in/electronics?tag=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('Extra Rs.500 OFF on Mobiles', 'Use code to get extra Rs.500 off on mobile phones above Rs.10000', 'MOBILE500', 'code', 'flat', '500', 1, 1, 'https://www.amazon.in/mobiles?tag=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('Upto 80% OFF + Extra 10% OFF', 'Big Billion Days - Upto 80% off plus extra 10% with code', 'FLIP10', 'code', 'percentage', '10', 2, 1, 'https://www.flipkart.com/sale?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, 1),
('Flat 40% OFF on Fashion', 'Get flat 40% off on all fashion products', 'STYLE40', 'code', 'percentage', '40', 3, 2, 'https://www.myntra.com/fashion?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('Rs.150 OFF on First Order', 'New user offer - Get Rs.150 off on your first food order', 'NEWUSER150', 'code', 'flat', '150', 4, 3, 'https://www.zomato.com/?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('50% OFF Upto Rs.100', 'Get 50% off up to Rs.100 on your food order', 'SWIGGY50', 'code', 'percentage', '50', 5, 3, 'https://www.swiggy.com/?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0, 1),
('Flat 25% OFF on Flights', 'Book flights and get flat 25% discount', 'FLY25', 'code', 'percentage', '25', 6, 4, 'https://www.makemytrip.com/flights?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('Upto Rs.5000 OFF on Hotels', 'Hotel booking offer - Save up to Rs.5000', NULL, 'deal', 'flat', '5000', 6, 4, 'https://www.makemytrip.com/hotels?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0, 1),
('Buy 2 Get 1 FREE on Beauty', 'Buy any 2 products and get 1 free', NULL, 'deal', 'freebie', 'Buy 2 Get 1', 7, 5, 'https://www.nykaa.com/?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1),
('Min 50% OFF + Extra 20% OFF', 'Clearance sale - Minimum 50% off plus extra 20% with code', 'AJIO20', 'code', 'percentage', '20', 8, 2, 'https://www.ajio.com/sale?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0, 1);

-- =====================================================
-- Table: deals (Special promotional deals)
-- =====================================================
CREATE TABLE IF NOT EXISTS `deals` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `store_id` INT(11) NOT NULL,
    `category_id` INT(11) DEFAULT NULL,
    `original_price` DECIMAL(10,2) DEFAULT NULL,
    `deal_price` DECIMAL(10,2) DEFAULT NULL,
    `discount_percentage` VARCHAR(20) DEFAULT NULL,
    `deal_url` VARCHAR(500) NOT NULL,
    `image` VARCHAR(255) DEFAULT NULL,
    `start_date` DATE DEFAULT NULL,
    `expiry_date` DATE DEFAULT NULL,
    `is_featured` TINYINT(1) DEFAULT 0,
    `click_count` INT(11) DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `store_id` (`store_id`),
    KEY `category_id` (`category_id`),
    CONSTRAINT `deals_store_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
    CONSTRAINT `deals_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample deals
INSERT INTO `deals` (`title`, `description`, `store_id`, `category_id`, `original_price`, `deal_price`, `discount_percentage`, `deal_url`, `expiry_date`, `is_featured`) VALUES
('iPhone 15 - Best Price Ever', 'Get iPhone 15 at the lowest price. Limited stock available!', 1, 1, 79999.00, 64999.00, '19%', 'https://www.amazon.in/iphone15?tag=youraffid', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1),
('Samsung Galaxy S24 Ultra', 'Flagship smartphone at amazing discount', 2, 1, 134999.00, 109999.00, '18%', 'https://www.flipkart.com/samsung-s24?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1),
('Nike Air Max - Flat 60% OFF', 'Premium sneakers at unbeatable price', 3, 2, 12995.00, 5199.00, '60%', 'https://www.myntra.com/nike-airmax?affid=youraffid', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1);

-- =====================================================
-- Table: subscribers (Newsletter)
-- =====================================================
CREATE TABLE IF NOT EXISTS `subscribers` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) DEFAULT NULL,
    `status` TINYINT(1) DEFAULT 1,
    `subscribed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `unsubscribed_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: contact_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(255) DEFAULT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `replied_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: click_tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS `click_tracking` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `coupon_id` INT(11) DEFAULT NULL,
    `deal_id` INT(11) DEFAULT NULL,
    `store_id` INT(11) DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `referrer` VARCHAR(500) DEFAULT NULL,
    `clicked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `coupon_id` (`coupon_id`),
    KEY `deal_id` (`deal_id`),
    KEY `store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: settings
-- =====================================================
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` TEXT DEFAULT NULL,
    `setting_group` VARCHAR(50) DEFAULT 'general',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
('site_name', 'CouponHub', 'general'),
('site_tagline', 'Best Coupons, Deals & Offers', 'general'),
('site_email', 'contact@yourdomain.com', 'general'),
('site_phone', '+91 9876543210', 'general'),
('site_address', 'Your City, India', 'general'),
('meta_title', 'CouponHub - Best Coupons, Promo Codes & Offers in India', 'seo'),
('meta_description', 'Find the best coupon codes, promo codes, deals and offers for online shopping in India. Save money with verified coupons from top stores.', 'seo'),
('meta_keywords', 'coupons, promo codes, deals, offers, discount codes, online shopping', 'seo'),
('facebook_url', 'https://facebook.com/couponhub', 'social'),
('twitter_url', 'https://twitter.com/couponhub', 'social'),
('instagram_url', 'https://instagram.com/couponhub', 'social'),
('analytics_code', '', 'tracking');

COMMIT;
