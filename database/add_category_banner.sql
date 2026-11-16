-- Category page banners managed from Admin > Categories.
-- Additive and safe to run once on production. Empty values keep the built-in banner.
ALTER TABLE `categories`
    ADD COLUMN `banner_image` VARCHAR(255) DEFAULT NULL AFTER `image`,
    ADD COLUMN `banner_image_mobile` VARCHAR(255) DEFAULT NULL AFTER `banner_image`,
    ADD COLUMN `banner_color` VARCHAR(7) DEFAULT NULL AFTER `banner_image_mobile`,
    ADD COLUMN `banner_focus` VARCHAR(10) DEFAULT NULL AFTER `banner_color`,
    ADD COLUMN `banner_heading` VARCHAR(150) DEFAULT NULL AFTER `banner_focus`,
    ADD COLUMN `banner_subtitle` VARCHAR(255) DEFAULT NULL AFTER `banner_heading`;
