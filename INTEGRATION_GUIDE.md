# Document Number Generation - Integration Guide

## 📋 Overview

This guide explains how to safely integrate the custom document numbering feature into your existing invoice, quotation, and project workflows **without breaking current functionality**.

---

## 🎯 Integration Philosophy

**Non-Destructive Integration:**
- Existing numbering continues to work unchanged
- Custom numbering only applies when:
  1. Feature is **enabled** for the document type
  2. Document is **finalized** or **exported to PDF**
  3. Number hasn't already been assigned

**Fallback Strategy:**
- If settings don't exist → use existing numbering
- If feature is disabled → use existing numbering
- If assignment fails → log error and use existing numbering

---

## 🔌 Integration Points

### 1. **Invoice Finalization / PDF Export**

**Location:** `server/controllers/invoiceController.js`  
**Function:** `finalizeInvoice()` or `exportInvoiceToPDF()`

```javascript
const { assignDocumentNumber, getAssignedNumber } = require('../utils/documentNumberGenerator');

// Example integration in finalize invoice
exports.finalizeInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // ... existing validation code ...

    // Check if custom numbering is already assigned
    let customNumber = await getAssignedNumber('invoice', invoiceId);
    
    // If not assigned yet, try to assign now
    if (!customNumber) {
      const result = await assignDocumentNumber('invoice', invoiceId);
      
      if (result.success && !result.useExisting) {
        customNumber = result.number;
        
        // Optional: Update invoice record with custom number
        await Invoice.update(
          { custom_number: customNumber },
          { where: { id: invoiceId } }
        );
        
        console.log(`Custom number assigned to invoice ${invoiceId}: ${customNumber}`);
      } else {
        console.log(`Using existing numbering for invoice ${invoiceId}`);
      }
    }
    
    // ... rest of finalization logic ...
    
    res.json({
      success: true,
      invoice: updatedInvoice,
      customNumber: customNumber || null
    });
    
  } catch (error) {
    console.error('Error finalizing invoice:', error);
    // Don't let numbering error break the flow
    res.status(500).json({
      success: false,
      message: 'Failed to finalize invoice'
    });
  }
};
```

---

### 2. **Quotation Finalization / PDF Export**

**Location:** `server/controllers/quotationController.js`  
**Function:** `finalizeQuotation()` or `exportQuotationToPDF()`

```javascript
const { assignDocumentNumber, getAssignedNumber } = require('../utils/documentNumberGenerator');

exports.finalizeQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;
    
    // ... existing validation ...
    
    // Attempt custom number assignment
    let customNumber = await getAssignedNumber('quotation', quotationId);
    
    if (!customNumber) {
      const result = await assignDocumentNumber('quotation', quotationId);
      
      if (result.success && !result.useExisting) {
        customNumber = result.number;
        
        await Quotation.update(
          { custom_number: customNumber },
          { where: { id: quotationId } }
        );
      }
    }
    
    // ... rest of logic ...
    
    res.json({
      success: true,
      quotation: updatedQuotation,
      customNumber
    });
    
  } catch (error) {
    console.error('Error finalizing quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize quotation' });
  }
};
```

---

### 3. **Project Creation**

**Location:** `server/controllers/projectController.js`  
**Function:** `createProject()`

```javascript
const { assignDocumentNumber } = require('../utils/documentNumberGenerator');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    // Create project first
    const newProject = await Project.create(projectData);
    
    // Attempt to assign custom number immediately
    const result = await assignDocumentNumber('project', newProject.id);
    
    if (result.success && !result.useExisting) {
      await newProject.update({
        custom_number: result.number
      });
      
      console.log(`Custom number assigned to project ${newProject.id}: ${result.number}`);
    }
    
    res.json({
      success: true,
      project: newProject
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};
```

---

## 🗄️ Database Schema Updates (Optional)

If you want to store the custom number in your existing tables, add a column:

```sql
-- For invoices table
ALTER TABLE invoices 
ADD COLUMN custom_number VARCHAR(100) DEFAULT NULL,
ADD INDEX idx_custom_number (custom_number);

-- For quotations table
ALTER TABLE quotations 
ADD COLUMN custom_number VARCHAR(100) DEFAULT NULL,
ADD INDEX idx_custom_number (custom_number);

-- For projects table
ALTER TABLE projects 
ADD COLUMN custom_number VARCHAR(100) DEFAULT NULL,
ADD INDEX idx_custom_number (custom_number);
```

**Note:** This is **optional**. The `document_number_history` table already tracks all assignments.

---

## 📄 PDF Generation Integration

**Location:** `server/utils/pdf.js` or wherever PDFs are generated

```javascript
const { getAssignedNumber } = require('./documentNumberGenerator');

async function generateInvoicePDF(invoiceId) {
  // Fetch invoice data
  const invoice = await Invoice.findByPk(invoiceId);
  
  // Try to get custom number
  const customNumber = await getAssignedNumber('invoice', invoiceId);
  
  // Use custom number if available, otherwise use existing field
  const displayNumber = customNumber || invoice.invoice_number || `INV-${invoiceId}`;
  
  // Generate PDF with displayNumber
  // ...
}
```

---

## 🔧 Server.js / App.js Setup

**Register the new routes:**

```javascript
// server/server.js or app.js

const documentNumberSettingsRoutes = require('./routes/documentNumberSettings');

// ... other middleware ...

// Register document settings routes (admin only)
app.use('/api/document-settings', documentNumberSettingsRoutes);

// ... rest of routes ...
```

---

## 🎨 Frontend Settings Integration

**Location:** `frontend/src/pages/Settings.tsx` or `Settings/index.tsx`

Add the component to your Settings page:

```tsx
import DocumentNumberSettings from '../components/settings/DocumentNumberSettings';

const Settings: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      {/* Existing settings sections */}
      
      {/* New Document Number Settings Section */}
      <section>
        <DocumentNumberSettings />
      </section>
      
    </div>
  );
};

export default Settings;
```

---

## ✅ Testing Integration

### Step 1: Run Migration
```bash
# Connect to your MySQL database
mysql -u your_user -p your_database < server/migrations/001_document_number_settings.sql
```

### Step 2: Verify Tables Created
```sql
SHOW TABLES LIKE 'document_number%';
SELECT * FROM document_number_settings;
```

### Step 3: Test API Endpoints
```bash
# Get all settings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/document-settings

# Update invoice settings
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prefix": "INV",
    "padding_length": 4,
    "include_year": true,
    "enabled": true
  }' \
  http://localhost:5000/api/document-settings/invoice

# Preview next number
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/document-settings/invoice/next
```

### Step 4: Test Frontend
1. Navigate to Settings page
2. Select Invoice tab
3. Configure settings
4. Click "Save Settings"
5. Verify live preview updates

### Step 5: Test Document Creation
1. Create a new invoice
2. Finalize it or export to PDF
3. Check if custom number was assigned
4. Verify in `document_number_history` table

```sql
SELECT * FROM document_number_history ORDER BY assigned_at DESC LIMIT 5;
```

---

## 🚨 Error Handling

### If Assignment Fails

The system is designed to **never break** existing functionality:

```javascript
try {
  const result = await assignDocumentNumber('invoice', invoiceId);
  
  if (result.success && !result.useExisting) {
    // Use custom number
    invoice.custom_number = result.number;
  } else {
    // Fall back to existing numbering - NO ERROR THROWN
    console.log('Using existing numbering system');
  }
} catch (error) {
  // Log error but don't fail the operation
  console.error('Custom numbering failed, using fallback:', error);
  // Continue with existing numbering
}
```

---

## 🔄 Rollback Procedure

If you need to remove this feature completely:

```bash
# Run rollback script
mysql -u your_user -p your_database < server/migrations/001_document_number_settings_rollback.sql

# Remove routes from server.js
# Comment out: app.use('/api/document-settings', documentNumberSettingsRoutes);

# Remove component from Settings page
# Comment out: <DocumentNumberSettings />

# Restart server
```

**Impact:** Zero. Existing documents remain unchanged.

---

## 📊 Monitoring & Logs

Add logging to track usage:

```javascript
// After successful assignment
console.log(`[DOC_NUMBER] ${type.toUpperCase()} ${documentId} assigned: ${result.number}`);

// If feature not enabled
console.log(`[DOC_NUMBER] ${type.toUpperCase()} custom numbering not enabled, using default`);

// On reset
if (result.wasReset) {
  console.log(`[DOC_NUMBER] ${type.toUpperCase()} counter reset to 1`);
}
```

---

## 🎯 Summary Checklist

- [ ] Run SQL migration
- [ ] Add routes to `server.js`
- [ ] Integrate `assignDocumentNumber()` in controllers
- [ ] Add `getAssignedNumber()` to PDF generation
- [ ] Add `DocumentNumberSettings` component to Settings page
- [ ] Test with feature disabled (should use existing numbering)
- [ ] Test with feature enabled (should assign custom numbers)
- [ ] Verify concurrent requests don't create duplicates
- [ ] Test reset logic (monthly/yearly)
- [ ] Confirm rollback script works

---

## 📞 Support

If integration issues arise:

1. Check console logs for errors
2. Verify database connection
3. Ensure user has admin role
4. Check that feature is enabled in settings
5. Verify transaction isolation level is supported by your MySQL version

For questions, refer to:
- `server/utils/documentNumberGenerator.js` - Core logic
- `server/controllers/documentNumberSettingsController.js` - API handlers
- `frontend/src/components/settings/DocumentNumberSettings.tsx` - UI component
