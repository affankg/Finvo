const { sequelize } = require('../models');
const { DocumentNumberSettings, DocumentNumberHistory } = require('../models/DocumentNumberSettings');

/**
 * Document Number Generator Utility
 * 
 * Purpose: Generate unique, formatted document numbers based on settings
 * Safety: Non-destructive - falls back to existing system if not configured
 * Thread-safe: Uses database transactions for atomic increments
 */

/**
 * Check if reset is needed based on reset rule
 * @param {Object} settings - Document number settings
 * @returns {boolean} - Whether reset is needed
 */
function shouldReset(settings) {
  if (settings.reset_rule === 'never') return false;
  if (!settings.last_reset_date) return false;

  const now = new Date();
  const lastReset = new Date(settings.last_reset_date);

  if (settings.reset_rule === 'monthly') {
    return now.getMonth() !== lastReset.getMonth() || 
           now.getFullYear() !== lastReset.getFullYear();
  }

  if (settings.reset_rule === 'yearly') {
    return now.getFullYear() !== lastReset.getFullYear();
  }

  return false;
}

/**
 * Generate date token based on settings
 * @param {Object} settings - Document number settings
 * @returns {string} - Formatted date token (e.g., "1125" for Nov 2025)
 */
function generateDateToken(settings) {
  if (!settings.include_year && !settings.include_month) {
    return '';
  }

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  if (settings.include_year && settings.include_month) {
    return `${month}${year}`;
  }
  
  if (settings.include_year) {
    return year;
  }

  if (settings.include_month) {
    return month;
  }

  return '';
}

/**
 * Format the document number according to settings
 * @param {Object} settings - Document number settings
 * @param {number} sequenceNumber - The sequence number to format
 * @returns {string} - Formatted document number
 */
function formatDocumentNumber(settings, sequenceNumber) {
  const parts = [];

  // Add prefix
  if (settings.prefix) {
    parts.push(settings.prefix);
  }

  // Add date token
  const dateToken = generateDateToken(settings);
  if (dateToken) {
    parts.push(dateToken);
  }

  // Add padded sequence number
  const paddedNumber = sequenceNumber.toString().padStart(settings.padding_length, '0');
  parts.push(paddedNumber);

  return parts.join('-');
}

/**
 * Preview the next document number without incrementing
 * @param {string} type - Document type (invoice, quotation, project)
 * @returns {Promise<Object>} - Preview result with formatted number
 */
async function previewNextNumber(type) {
  try {
    const settings = await DocumentNumberSettings.findOne({
      where: { type, enabled: true }
    });

    if (!settings) {
      return {
        success: false,
        message: `Document numbering not enabled for ${type}`,
        useExisting: true
      };
    }

    // Calculate what the next number would be
    let nextNumber = settings.current_number + 1;
    
    // Check if reset is needed
    if (shouldReset(settings)) {
      nextNumber = 1;
    }

    const formattedNumber = formatDocumentNumber(settings, nextNumber);
    const dateToken = generateDateToken(settings);

    return {
      success: true,
      preview: formattedNumber,
      nextSequence: nextNumber,
      dateToken: dateToken || null,
      willReset: shouldReset(settings)
    };
  } catch (error) {
    console.error('Error previewing next number:', error);
    throw error;
  }
}

/**
 * Assign and generate next document number (ATOMIC OPERATION)
 * @param {string} type - Document type (invoice, quotation, project)
 * @param {number} documentId - The ID of the document being numbered
 * @returns {Promise<Object>} - Result with assigned number
 */
async function assignDocumentNumber(type, documentId) {
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });

  try {
    // Lock the settings row for update
    const settings = await DocumentNumberSettings.findOne({
      where: { type, enabled: true },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!settings) {
      await transaction.rollback();
      return {
        success: false,
        message: `Document numbering not enabled for ${type}`,
        useExisting: true
      };
    }

    // Check if document already has a number
    const existing = await DocumentNumberHistory.findOne({
      where: { type, document_id: documentId },
      transaction
    });

    if (existing) {
      await transaction.rollback();
      return {
        success: true,
        number: existing.generated_number,
        alreadyAssigned: true
      };
    }

    // Determine if reset is needed
    const needsReset = shouldReset(settings);
    let nextNumber = needsReset ? 1 : settings.current_number + 1;

    // Generate formatted number
    const formattedNumber = formatDocumentNumber(settings, nextNumber);
    const dateToken = generateDateToken(settings);

    // Check for duplicate (extra safety)
    const duplicate = await DocumentNumberHistory.findOne({
      where: { generated_number: formattedNumber },
      transaction
    });

    if (duplicate) {
      // In rare case of duplicate, increment and retry once
      nextNumber++;
      const retryNumber = formatDocumentNumber(settings, nextNumber);
      
      // Update settings
      await settings.update({
        current_number: nextNumber,
        last_reset_date: needsReset ? new Date() : settings.last_reset_date
      }, { transaction });

      // Record in history
      await DocumentNumberHistory.create({
        type,
        document_id: documentId,
        generated_number: retryNumber,
        sequence_number: nextNumber,
        date_token: dateToken
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        number: retryNumber,
        sequenceNumber: nextNumber,
        wasReset: needsReset
      };
    }

    // Update settings with new current number
    await settings.update({
      current_number: nextNumber,
      last_reset_date: needsReset ? new Date() : settings.last_reset_date
    }, { transaction });

    // Record in history
    await DocumentNumberHistory.create({
      type,
      document_id: documentId,
      generated_number: formattedNumber,
      sequence_number: nextNumber,
      date_token: dateToken
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      number: formattedNumber,
      sequenceNumber: nextNumber,
      wasReset: needsReset
    };

  } catch (error) {
    await transaction.rollback();
    console.error('Error assigning document number:', error);
    throw error;
  }
}

/**
 * Get the assigned document number (if exists)
 * @param {string} type - Document type
 * @param {number} documentId - Document ID
 * @returns {Promise<string|null>} - Assigned number or null
 */
async function getAssignedNumber(type, documentId) {
  try {
    const history = await DocumentNumberHistory.findOne({
      where: { type, document_id: documentId }
    });

    return history ? history.generated_number : null;
  } catch (error) {
    console.error('Error getting assigned number:', error);
    return null;
  }
}

/**
 * Validate document number settings
 * @param {Object} settings - Settings object to validate
 * @returns {Object} - Validation result
 */
function validateSettings(settings) {
  const errors = [];

  // Validate prefix
  if (settings.prefix && !/^[A-Z0-9-]*$/i.test(settings.prefix)) {
    errors.push('Prefix can only contain letters, numbers, and hyphens');
  }

  if (settings.prefix && settings.prefix.length > 50) {
    errors.push('Prefix must be 50 characters or less');
  }

  // Validate padding length
  if (settings.padding_length < 1 || settings.padding_length > 8) {
    errors.push('Padding length must be between 1 and 8');
  }

  // Validate current number
  if (settings.current_number < 0) {
    errors.push('Current number cannot be negative');
  }

  // Validate reset rule
  if (!['never', 'monthly', 'yearly'].includes(settings.reset_rule)) {
    errors.push('Reset rule must be one of: never, monthly, yearly');
  }

  // Validate type
  if (!['invoice', 'quotation', 'project'].includes(settings.type)) {
    errors.push('Type must be one of: invoice, quotation, project');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  previewNextNumber,
  assignDocumentNumber,
  getAssignedNumber,
  validateSettings,
  formatDocumentNumber,
  generateDateToken,
  shouldReset
};
