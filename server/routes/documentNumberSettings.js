const express = require('express');
const router = express.Router();
const documentNumberSettingsController = require('../controllers/documentNumberSettingsController');
const { authenticate } = require('../middleware/auth');

/**
 * Document Number Settings Routes
 * 
 * All routes require authentication and admin privileges
 * Base path: /api/document-settings
 */

// Middleware: Ensure user is authenticated and is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/document-settings
 * @desc    Get all document number settings
 * @access  Admin only
 */
router.get('/', documentNumberSettingsController.getAllSettings);

/**
 * @route   GET /api/document-settings/:type
 * @desc    Get settings for specific document type
 * @param   {string} type - invoice, quotation, or project
 * @access  Admin only
 */
router.get('/:type', documentNumberSettingsController.getSettingsByType);

/**
 * @route   POST /api/document-settings/:type
 * @desc    Update settings for specific document type
 * @param   {string} type - invoice, quotation, or project
 * @body    {Object} settings - Settings to update
 * @access  Admin only
 */
router.post('/:type', documentNumberSettingsController.updateSettings);

/**
 * @route   GET /api/document-settings/:type/next
 * @desc    Preview next document number without incrementing
 * @param   {string} type - invoice, quotation, or project
 * @access  Admin only
 */
router.get('/:type/next', documentNumberSettingsController.previewNext);

/**
 * @route   POST /api/document-settings/:type/assign
 * @desc    Assign and increment document number (atomic operation)
 * @param   {string} type - invoice, quotation, or project
 * @body    {number} documentId - ID of document to assign number to
 * @access  Admin only
 */
router.post('/:type/assign', documentNumberSettingsController.assignNumber);

/**
 * @route   GET /api/document-settings/:type/history
 * @desc    Get document number assignment history
 * @param   {string} type - invoice, quotation, or project
 * @query   {number} limit - Results per page (default: 20)
 * @query   {number} offset - Pagination offset (default: 0)
 * @access  Admin only
 */
router.get('/:type/history', documentNumberSettingsController.getHistory);

/**
 * @route   POST /api/document-settings/test-format
 * @desc    Test number format without saving
 * @body    {Object} formatSettings - Format settings to test
 * @access  Admin only
 */
router.post('/test-format', documentNumberSettingsController.testFormat);

module.exports = router;
