-- =====================================================
-- CouponHub - Extended Sample Data
-- Run this AFTER schema.sql to add more sample data
-- =====================================================

USE coupon_db;

-- =====================================================
-- Add more stores with logos (using placeholder logos)
-- =====================================================
INSERT INTO `stores` (`name`, `slug`, `website_url`, `logo`, `short_description`, `category_id`, `is_featured`, `is_popular`, `rating`) VALUES
('Puma', 'puma', 'https://in.puma.com', 'https://logo.clearbit.com/puma.com', 'Sports and lifestyle brand', 2, 1, 1, 4.5),
('Croma', 'croma', 'https://www.croma.com', 'https://logo.clearbit.com/croma.com', 'Electronics and appliances store', 1, 1, 1, 4.3),
('BigBasket', 'bigbasket', 'https://www.bigbasket.com', 'https://logo.clearbit.com/bigbasket.com', 'Online grocery delivery', 8, 1, 1, 4.4),
('BookMyShow', 'bookmyshow', 'https://www.bookmyshow.com', 'https://logo.clearbit.com/bookmyshow.com', 'Movies and events booking', 7, 1, 1, 4.6),
('Uber', 'uber', 'https://www.uber.com', 'https://logo.clearbit.com/uber.com', 'Ride booking and delivery', 4, 0, 1, 4.2),
('Dominos', 'dominos', 'https://www.dominos.co.in', 'https://logo.clearbit.com/dominos.com', 'Pizza delivery', 3, 1, 1, 4.1),
('Bewakoof', 'bewakoof', 'https://www.bewakoof.com', 'https://logo.clearbit.com/bewakoof.com', 'Trendy fashion brand', 2, 0, 1, 4.0);

-- Update existing stores with logo URLs
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/amazon.in' WHERE `slug` = 'amazon';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/flipkart.com' WHERE `slug` = 'flipkart';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/myntra.com' WHERE `slug` = 'myntra';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/zomato.com' WHERE `slug` = 'zomato';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/swiggy.com' WHERE `slug` = 'swiggy';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/makemytrip.com' WHERE `slug` = 'makemytrip';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/nykaa.com' WHERE `slug` = 'nykaa';
UPDATE `stores` SET `logo` = 'https://logo.clearbit.com/ajio.com' WHERE `slug` = 'ajio';

-- =====================================================
-- Add more featured coupons
-- =====================================================
INSERT INTO `coupons` (`title`, `description`, `code`, `coupon_type`, `discount_type`, `discount_value`, `store_id`, `category_id`, `expiry_date`, `is_featured`, `is_verified`, `click_count`) VALUES

-- Amazon coupons
('$10 OFF on First Order', 'New customers get $10 off on orders above $50', 'NEW10', 'code', 'flat', '10', 1, 1, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1, 1, 1250),
('20% OFF Everything', 'Sitewide 20% discount on all products', 'SAVE20', 'code', 'percentage', '20', 1, 1, DATE_ADD(CURDATE(), INTERVAL 45 DAY), 1, 1, 890),
('Free Delivery on Orders', 'Free shipping on all orders above $25', NULL, 'deal', 'freebie', 'Free Shipping', 1, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0, 1, 2100),

-- Flipkart coupons
('₹1000 Instant Discount', 'Get instant ₹1000 off on laptops', 'LAPTOP1K', 'code', 'flat', '1000', 2, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1, 560),
('Bank Offer - 10% Cashback', 'Get 10% cashback with HDFC cards', NULL, 'deal', 'cashback', '10', 2, 1, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, 1, 1340),

-- Myntra coupons
('Flat 50% OFF on Brands', 'Major brands at half price', 'BRAND50', 'code', 'percentage', '50', 3, 2, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 1, 1, 780),
('Buy 3 Get 3 FREE', 'Special offer on selected items', NULL, 'deal', 'freebie', 'Buy 3 Get 3', 3, 2, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 1, 1, 920),

-- Zomato coupons
('60% OFF - Max ₹120', 'Get 60% off up to ₹120 on orders', 'TASTY60', 'code', 'percentage', '60', 4, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1, 1, 3400),
('Free Delivery on All Orders', 'Zero delivery charges this weekend', NULL, 'deal', 'freebie', 'Free Delivery', 4, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 0, 1, 5600),

-- Swiggy coupons
('Flat ₹75 OFF', 'Use code on orders above ₹199', 'YUMMY75', 'code', 'flat', '75', 5, 3, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, 1, 2100),

-- MakeMyTrip coupons
('Upto ₹2000 OFF on Flights', 'Domestic flight booking offer', 'FLYNOW', 'code', 'flat', '2000', 6, 4, DATE_ADD(CURDATE(), INTERVAL 45 DAY), 1, 1, 450),
('15% OFF on International Hotels', 'Book international hotels at discount', 'HOTEL15', 'code', 'percentage', '15', 6, 4, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 0, 1, 320),

-- Nykaa coupons
('Flat 30% OFF on Skincare', 'All skincare products on sale', 'GLOW30', 'code', 'percentage', '30', 7, 5, DATE_ADD(CURDATE(), INTERVAL 25 DAY), 1, 1, 670),

-- Puma (new store) coupons
('40% OFF on Footwear', 'Running shoes at best prices', 'RUN40', 'code', 'percentage', '40', 9, 2, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1, 380),
('Extra 15% OFF on Apparel', 'Use code for additional discount', 'SPORT15', 'code', 'percentage', '15', 9, 2, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 0, 1, 290),

-- Croma coupons
('₹5000 OFF on TVs', 'Smart TVs at unbeatable prices', 'TV5000', 'code', 'flat', '5000', 10, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1, 210),

-- BigBasket coupons
('15% OFF - New User', 'First order discount', 'BB15', 'code', 'percentage', '15', 11, 8, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1, 1560),
('Free Delivery Above ₹300', 'No delivery charges', NULL, 'deal', 'freebie', 'Free Delivery', 11, 8, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 0, 1, 2340),

-- BookMyShow coupons
('Buy 1 Get 1 Movie Ticket', 'BOGO offer on movie tickets', 'MOVIE2', 'code', 'freebie', 'Buy 1 Get 1', 12, 7, DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, 1, 890),

-- Dominos coupons
('50% OFF Upto ₹100', 'Half price pizza party', 'PIZZA50', 'code', 'percentage', '50', 14, 3, DATE_ADD(CURDATE(), INTERVAL 21 DAY), 1, 1, 4500);

-- =====================================================
-- Add more deals with images
-- =====================================================
INSERT INTO `deals` (`title`, `description`, `store_id`, `category_id`, `original_price`, `deal_price`, `discount_percentage`, `deal_url`, `image`, `expiry_date`, `is_featured`) VALUES

('50% OFF Storewide Sale', 'Exclusive clearance sale on all footwear and apparel', 9, 2, NULL, NULL, '50%', 'https://in.puma.com/sale', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1),

('Free Galaxy Buds with S24', 'Get free Galaxy Buds2 Pro with Samsung Galaxy S24', 2, 1, NULL, NULL, 'FREE Gift', 'https://www.flipkart.com/samsung', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 1),

('Buy 1 Get 1 Free Pizza', 'Order any medium pizza and get one free', 14, 3, NULL, NULL, 'BOGO', 'https://www.dominos.co.in', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1),

('$10 OFF Appliances', 'Save $10 on major appliances over $100', 10, 1, NULL, NULL, '$10 OFF', 'https://www.croma.com/appliances', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 21 DAY), 1),

('Prime Video 30 Days Free', 'Start your free trial for Prime Video', 1, 7, NULL, NULL, 'FREE Trial', 'https://www.amazon.in/prime', 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1),

('15% OFF on Essentials', 'Daily essentials at discounted prices', 11, 8, NULL, NULL, '15%', 'https://www.bigbasket.com', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1);

-- =====================================================
-- Update total_coupons count for stores
-- =====================================================
UPDATE stores s SET total_coupons = (
    SELECT COUNT(*) FROM coupons c WHERE c.store_id = s.id AND c.status = 1
);

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Sample data inserted successfully!' AS message;
SELECT COUNT(*) AS total_stores FROM stores;
SELECT COUNT(*) AS total_coupons FROM coupons;
SELECT COUNT(*) AS total_deals FROM deals;
