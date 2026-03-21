-- Run this SQL in your database to add the price columns to the coupons table
ALTER TABLE coupons 
    ADD COLUMN original_price DECIMAL(10,2) NULL DEFAULT NULL AFTER discount_value,
    ADD COLUMN sale_price DECIMAL(10,2) NULL DEFAULT NULL AFTER original_price;
