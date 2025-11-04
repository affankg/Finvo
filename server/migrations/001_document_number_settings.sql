-- =====================================================
-- Document Number Settings Migration
-- =====================================================
-- Purpose: Add configurable document numbering system
-- Date: November 4, 2025
-- Status: NON-DESTRUCTIVE (does not modify existing tables)
-- =====================================================

-- Create document_number_settings table
CREATE TABLE IF NOT EXISTS `document_number_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('invoice', 'quotation', 'project') NOT NULL UNIQUE,
  `prefix` VARCHAR(50) NOT NULL DEFAULT '',
  `current_number` INT NOT NULL DEFAULT 0,
  `padding_length` INT NOT NULL DEFAULT 3,
  `include_year` TINYINT(1) NOT NULL DEFAULT 0,
  `include_month` TINYINT(1) NOT NULL DEFAULT 0,
  `reset_rule` ENUM('never', 'monthly', 'yearly') NOT NULL DEFAULT 'never',
  `last_reset_date` DATE DEFAULT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configurations (disabled by default)
INSERT INTO `document_number_settings` (`type`, `prefix`, `current_number`, `padding_length`, `enabled`)
VALUES 
  ('invoice', 'INV', 0, 3, 0),
  ('quotation', 'QUO', 0, 3, 0),
  ('project', 'PRO', 0, 3, 0)
ON DUPLICATE KEY UPDATE `type` = `type`;

-- Create audit log table for number assignments
CREATE TABLE IF NOT EXISTS `document_number_history` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('invoice', 'quotation', 'project') NOT NULL,
  `document_id` INT NOT NULL,
  `generated_number` VARCHAR(100) NOT NULL,
  `sequence_number` INT NOT NULL,
  `date_token` VARCHAR(20) DEFAULT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_type_doc` (`type`, `document_id`),
  INDEX `idx_generated_number` (`generated_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================
-- To rollback this migration, execute:
-- DROP TABLE IF EXISTS `document_number_history`;
-- DROP TABLE IF EXISTS `document_number_settings`;
-- =====================================================
