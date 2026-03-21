-- =====================================================
-- Migration: Add Store Info Fields for SEO Content
-- Run this SQL to add the new fields to stores table
-- =====================================================

ALTER TABLE `stores` 
ADD COLUMN `about_content` TEXT DEFAULT NULL AFTER `description`,
ADD COLUMN `howto_content` TEXT DEFAULT NULL AFTER `about_content`,
ADD COLUMN `terms_content` TEXT DEFAULT NULL AFTER `howto_content`;

-- Description: These fields store custom SEO content for store pages
-- about_content: Custom "About the store" content
-- howto_content: Custom "How to use coupons" content  
-- terms_content: Custom "Terms & Conditions" content
