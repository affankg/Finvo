-- =====================================================
-- ROLLBACK SCRIPT for Document Number Settings
-- =====================================================
-- Execute this script to completely remove the 
-- document numbering feature without affecting 
-- existing invoice/quotation/project data
-- =====================================================

DROP TABLE IF EXISTS `document_number_history`;
DROP TABLE IF EXISTS `document_number_settings`;

-- =====================================================
-- VERIFICATION QUERIES (run after rollback)
-- =====================================================
-- SHOW TABLES LIKE 'document_number%';
-- Should return empty result
-- =====================================================
