-- Migration: Add h1_suffix column to stores table
-- Run this once on your production/staging database

ALTER TABLE `stores`
    ADD COLUMN `h1_suffix` VARCHAR(150) DEFAULT NULL
    AFTER `name`;
