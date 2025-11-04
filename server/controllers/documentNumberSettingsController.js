const { DocumentNumberSettings, DocumentNumberHistory } = require('../models/DocumentNumberSettings');
const { 
  previewNextNumber, 
  assignDocumentNumber, 
  validateSettings,
  formatDocumentNumber 
} = require('../utils/documentNumberGenerator');
const { Op } = require('sequelize');

/**
 * Document Number Settings Controller
 * 
 * Handles all operations related to document number configuration
 * Restricted to admin users only
 */

/**
 * Get all document number settings
 * GET /api/document-settings
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await DocumentNumberSettings.findAll({
      order: [
        ['type', 'ASC']
      ]
    });

    // Get recent numbers for each type
    const recentNumbers = await DocumentNumberHistory.findAll({
      attributes: ['type', 'generated_number', 'assigned_at'],
      order: [['assigned_at', 'DESC']],
      limit: 10
    });

    const settingsWithRecent = settings.map(setting => {
      const recent = recentNumbers
        .filter(r => r.type === setting.type)
        .slice(0, 3);
      
      return {
        ...setting.toJSON(),
        recentNumbers: recent
      };
    });

    res.json({
      success: true,
      data: settingsWithRecent
    });
  } catch (error) {
    console.error('Error fetching document settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document settings',
      error: error.message
    });
  }
};

/**
 * Get settings for specific document type
 * GET /api/document-settings/:type
 */
exports.getSettingsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['invoice', 'quotation', 'project'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const settings = await DocumentNumberSettings.findOne({
      where: { type }
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: `Settings not found for ${type}`
      });
    }

    // Get recent numbers
    const recentNumbers = await DocumentNumberHistory.findAll({
      where: { type },
      order: [['assigned_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        ...settings.toJSON(),
        recentNumbers
      }
    });
  } catch (error) {
    console.error('Error fetching settings by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Update settings for specific document type
 * POST /api/document-settings/:type
 */
exports.updateSettings = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      prefix, 
      current_number, 
      padding_length, 
      include_year, 
      include_month, 
      reset_rule,
      enabled 
    } = req.body;

    if (!['invoice', 'quotation', 'project'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Validate settings
    const validation = validateSettings({
      type,
      prefix: prefix || '',
      current_number: current_number || 0,
      padding_length: padding_length || 3,
      reset_rule: reset_rule || 'never'
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Find or create settings
    let settings = await DocumentNumberSettings.findOne({
      where: { type }
    });

    if (!settings) {
      settings = await DocumentNumberSettings.create({
        type,
        prefix: prefix || '',
        current_number: current_number || 0,
        padding_length: padding_length || 3,
        include_year: include_year || false,
        include_month: include_month || false,
        reset_rule: reset_rule || 'never',
        enabled: enabled || false
      });
    } else {
      await settings.update({
        prefix: prefix !== undefined ? prefix : settings.prefix,
        current_number: current_number !== undefined ? current_number : settings.current_number,
        padding_length: padding_length !== undefined ? padding_length : settings.padding_length,
        include_year: include_year !== undefined ? include_year : settings.include_year,
        include_month: include_month !== undefined ? include_month : settings.include_month,
        reset_rule: reset_rule !== undefined ? reset_rule : settings.reset_rule,
        enabled: enabled !== undefined ? enabled : settings.enabled
      });
    }

    // Generate preview of next number
    const preview = await previewNextNumber(type);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
      preview: preview.success ? preview.preview : null
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

/**
 * Preview next document number (without incrementing)
 * GET /api/document-settings/:type/next
 */
exports.previewNext = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['invoice', 'quotation', 'project'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const preview = await previewNextNumber(type);

    if (!preview.success) {
      return res.status(400).json(preview);
    }

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error previewing next number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview next number',
      error: error.message
    });
  }
};

/**
 * Assign document number (ATOMIC)
 * POST /api/document-settings/:type/assign
 * Body: { documentId: number }
 */
exports.assignNumber = async (req, res) => {
  try {
    const { type } = req.params;
    const { documentId } = req.body;

    if (!['invoice', 'quotation', 'project'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    const result = await assignDocumentNumber(type, documentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: result.alreadyAssigned ? 'Number already assigned' : 'Number assigned successfully',
      data: result
    });
  } catch (error) {
    console.error('Error assigning document number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign document number',
      error: error.message
    });
  }
};

/**
 * Get document number history
 * GET /api/document-settings/:type/history
 */
exports.getHistory = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!['invoice', 'quotation', 'project'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const history = await DocumentNumberHistory.findAndCountAll({
      where: { type },
      order: [['assigned_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: history.rows,
      total: history.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

/**
 * Test number format (generates example without saving)
 * POST /api/document-settings/test-format
 * Body: { prefix, padding_length, include_year, include_month, test_number }
 */
exports.testFormat = async (req, res) => {
  try {
    const { 
      prefix, 
      padding_length = 3, 
      include_year = false, 
      include_month = false,
      test_number = 1
    } = req.body;

    // Create temporary settings object
    const tempSettings = {
      prefix: prefix || '',
      padding_length: parseInt(padding_length),
      include_year,
      include_month
    };

    const formatted = formatDocumentNumber(tempSettings, test_number);

    res.json({
      success: true,
      formatted,
      parts: {
        prefix: prefix || 'none',
        dateToken: include_year || include_month ? 'current date' : 'none',
        sequenceNumber: test_number.toString().padStart(padding_length, '0')
      }
    });
  } catch (error) {
    console.error('Error testing format:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test format',
      error: error.message
    });
  }
};

module.exports = exports;
