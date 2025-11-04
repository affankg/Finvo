# Document Number Settings - QA Checklist & Test Cases

## 🎯 Test Environment Setup

- [ ] Database migration executed successfully
- [ ] Tables created: `document_number_settings`, `document_number_history`
- [ ] Server restarted with routes registered
- [ ] Admin user account available for testing
- [ ] Frontend components integrated into Settings page

---

## ✅ ACCEPTANCE CRITERIA

### 1. Database & Backend

#### 1.1 Database Schema
- [ ] `document_number_settings` table exists
- [ ] Default rows inserted for invoice, quotation, project
- [ ] All columns have correct data types
- [ ] Unique constraint on `type` column works
- [ ] Indexes created properly
- [ ] `document_number_history` table exists

#### 1.2 API Endpoints
- [ ] `GET /api/document-settings` returns all settings (admin only)
- [ ] `GET /api/document-settings/:type` returns specific settings
- [ ] `POST /api/document-settings/:type` updates settings
- [ ] `GET /api/document-settings/:type/next` previews next number
- [ ] `POST /api/document-settings/:type/assign` assigns number atomically
- [ ] `GET /api/document-settings/:type/history` returns assignment history
- [ ] `POST /api/document-settings/test-format` tests format

#### 1.3 Authorization
- [ ] Non-authenticated requests return 401
- [ ] Non-admin requests return 403
- [ ] Admin requests succeed

---

### 2. Number Generation Logic

#### 2.1 Basic Formatting
- [ ] Prefix-only format works: `INV-001`
- [ ] Prefix with padding works: `INV-0001` (padding=4)
- [ ] No prefix works: `001`
- [ ] Year token works: `INV-25-001`
- [ ] Month token works: `INV-11-001`
- [ ] Month+Year token works: `INV-1125-001`
- [ ] All parts combined work: `INV-1125-001`

#### 2.2 Sequence Increment
- [ ] First assignment uses current_number + 1
- [ ] Second assignment increments to current_number + 2
- [ ] No gaps in sequence under normal operation
- [ ] Concurrent requests don't create duplicates

#### 2.3 Reset Logic
- [ ] `never` reset continues indefinitely
- [ ] `monthly` reset triggers on new month
- [ ] `yearly` reset triggers on new year
- [ ] Reset sets number back to 1
- [ ] `last_reset_date` updates correctly

#### 2.4 Preview vs Assignment
- [ ] Preview doesn't increment current_number
- [ ] Preview multiple times shows same result
- [ ] Assignment increments current_number
- [ ] Preview after assignment shows next number

---

### 3. Frontend Component

#### 3.1 Layout & Design
- [ ] Tabbed vertical layout renders correctly
- [ ] Three tabs visible: Invoice, Quotation, Project
- [ ] Active tab has colored border and background
- [ ] Tab icons display properly
- [ ] Form fields aligned properly
- [ ] No card styling (full-width sections)

#### 3.2 Form Functionality
- [ ] Enable toggle switches state
- [ ] Prefix input accepts valid characters
- [ ] Prefix input rejects invalid characters
- [ ] Current number input accepts positive integers
- [ ] Padding dropdown shows 2-8 options
- [ ] Date format dropdown has all options
- [ ] Reset rule dropdown has all options
- [ ] Live preview updates in real-time

#### 3.3 Live Preview
- [ ] Preview box displays formatted number
- [ ] Preview updates when prefix changes
- [ ] Preview updates when padding changes
- [ ] Preview updates when date format changes
- [ ] Preview updates when current number changes
- [ ] Preview shows next sequence number

#### 3.4 Actions
- [ ] "Preview Next" button fetches server preview
- [ ] "Save Settings" button saves successfully
- [ ] Success toast appears on save
- [ ] Error toast appears on failure
- [ ] Loading states show during async operations
- [ ] Buttons disabled during loading

#### 3.5 Recent Numbers Section
- [ ] Section is collapsible
- [ ] Shows up to 5 recent numbers
- [ ] Displays formatted numbers correctly
- [ ] Shows assignment dates
- [ ] Empty state handled gracefully

---

## 🧪 TEST CASES

### Test Case 1: Basic Setup (Invoice)
**Objective:** Configure basic invoice numbering

**Steps:**
1. Navigate to Settings → Document Number Format
2. Select Invoice tab
3. Enable custom numbering
4. Set prefix: "INV"
5. Set padding: 3
6. Keep date format: None
7. Keep reset: Never
8. Click "Save Settings"

**Expected Result:**
- Settings saved successfully
- Live preview shows: `INV-001`
- Next preview shows: `INV-001`

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 2: Date Formatting (Quotation)
**Objective:** Test date token inclusion

**Steps:**
1. Select Quotation tab
2. Enable custom numbering
3. Set prefix: "QUO"
4. Set padding: 4
5. Set date format: "Month + Year"
6. Set current number: 0
7. Click "Save Settings"

**Expected Result:**
- Preview shows: `QUO-1125-0001` (where 1125 is Nov 2025)
- Date token matches current month/year

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 3: Assignment & Increment
**Objective:** Verify atomic assignment

**Steps:**
1. Configure Invoice settings (prefix: "INV", padding: 3)
2. Create a new invoice via API
3. Call `/api/document-settings/invoice/assign` with invoice ID
4. Check response
5. Call assign again with same ID

**Expected Result:**
- First call assigns `INV-001`, increments counter
- Second call returns same number (already assigned)
- `document_number_history` has 1 record
- Settings `current_number` is now 1

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 4: Monthly Reset
**Objective:** Test monthly reset logic

**Steps:**
1. Set invoice settings: reset_rule = "monthly"
2. Set current_number = 25
3. Set last_reset_date = last month
4. Call `/assign` endpoint

**Expected Result:**
- Counter resets to 1
- Generated number is `INV-001`
- `last_reset_date` updates to current month

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 5: Yearly Reset
**Objective:** Test yearly reset logic

**Steps:**
1. Set quotation settings: reset_rule = "yearly"
2. Set current_number = 150
3. Set last_reset_date = last year
4. Call `/assign` endpoint

**Expected Result:**
- Counter resets to 1
- Generated number includes current year
- `last_reset_date` updates to current date

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 6: Concurrent Requests
**Objective:** Ensure no duplicate numbers under concurrent load

**Steps:**
1. Configure settings with enabled = true
2. Make 10 simultaneous `/assign` requests for different document IDs
3. Check `document_number_history` table

**Expected Result:**
- 10 unique numbers generated
- No duplicates
- Sequence is 1-10 (in any order)
- All transactions committed successfully

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 7: Disabled Feature Fallback
**Objective:** Verify existing numbering continues when disabled

**Steps:**
1. Set invoice settings: enabled = false
2. Call `/assign` endpoint
3. Check response

**Expected Result:**
- Response: `{ success: false, useExisting: true }`
- No record in `document_number_history`
- System falls back to existing numbering

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 8: Validation Errors
**Objective:** Test input validation

**Steps:**
1. Try to save with invalid prefix: "INV@123"
2. Try padding_length = 10
3. Try current_number = -5
4. Try invalid reset_rule: "daily"

**Expected Result:**
- Each returns appropriate error message
- Settings not saved
- Error toast appears in UI

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 9: Tab Switching
**Objective:** Test UI state management

**Steps:**
1. Configure Invoice settings
2. Switch to Quotation tab
3. Configure Quotation settings
4. Switch back to Invoice tab

**Expected Result:**
- Each tab retains its own settings
- Form fields populate correctly on switch
- Live preview updates for active tab
- No data loss between switches

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 10: History Tracking
**Objective:** Verify audit trail

**Steps:**
1. Assign numbers to 3 different invoices
2. Call `/api/document-settings/invoice/history`
3. Verify response

**Expected Result:**
- History shows 3 records
- Each has: type, document_id, generated_number, assigned_at
- Sorted by assigned_at DESC
- No duplicate document_ids

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 11: Non-Admin Access
**Objective:** Security check

**Steps:**
1. Login as non-admin user
2. Try to access `/api/document-settings`

**Expected Result:**
- Returns 403 Forbidden
- Error message: "Admin access required"

**Status:** [ ] PASS [ ] FAIL

---

### Test Case 12: Integration with PDF Export
**Objective:** End-to-end workflow

**Steps:**
1. Enable invoice numbering
2. Create new invoice
3. Add line items
4. Export to PDF
5. Check PDF content

**Expected Result:**
- PDF displays custom number (e.g., `INV-001`)
- Number persisted in database
- Subsequent export shows same number

**Status:** [ ] PASS [ ] FAIL

---

## 🔍 VALIDATION RULES

### Input Validation
- [ ] Prefix: max 50 chars, alphanumeric + hyphens only
- [ ] Padding length: 1-8 only
- [ ] Current number: non-negative integers only
- [ ] Reset rule: enum values only
- [ ] Type: enum values only

### Business Logic Validation
- [ ] Can't create duplicate settings for same type
- [ ] Can't assign number to same document twice
- [ ] Reset date updates only on actual reset
- [ ] Preview doesn't modify database state
- [ ] Disabled feature doesn't break existing flow

---

## 🚨 ERROR SCENARIOS

### Scenario 1: Database Connection Lost
**Test:** Disconnect database during assignment
**Expected:** Transaction rolls back, error logged, no partial state

### Scenario 2: Invalid Document ID
**Test:** Call `/assign` with non-existent document ID
**Expected:** Error returned, no history record created

### Scenario 3: Malformed Settings
**Test:** Manually corrupt settings in database
**Expected:** Validation catches errors, defaults applied

### Scenario 4: Concurrent Reset
**Test:** Two requests trigger reset simultaneously
**Expected:** Transaction isolation prevents race condition

---

## 📊 PERFORMANCE BENCHMARKS

- [ ] `/next` endpoint responds in < 50ms
- [ ] `/assign` endpoint responds in < 200ms (with transaction)
- [ ] UI renders in < 100ms
- [ ] Live preview updates in < 50ms
- [ ] Concurrent 100 requests handled without timeout

---

## 🔄 ROLLBACK VERIFICATION

- [ ] Rollback script removes both tables
- [ ] No orphaned data remains
- [ ] Existing tables unaffected
- [ ] Application continues to function
- [ ] No breaking errors in logs

---

## ✅ FINAL CHECKLIST

### Backend
- [ ] All API endpoints functional
- [ ] Authorization working correctly
- [ ] Transaction isolation working
- [ ] Error handling robust
- [ ] Logging comprehensive

### Frontend
- [ ] UI matches design spec
- [ ] All form fields working
- [ ] Live preview accurate
- [ ] Error states handled
- [ ] Loading states smooth

### Integration
- [ ] Invoice assignment works
- [ ] Quotation assignment works
- [ ] Project assignment works
- [ ] PDF generation uses custom numbers
- [ ] Existing numbering unaffected

### Documentation
- [ ] Integration guide complete
- [ ] API documented
- [ ] Component props documented
- [ ] Rollback procedure tested

### Security
- [ ] Admin-only access enforced
- [ ] SQL injection prevented
- [ ] XSS vulnerabilities checked
- [ ] Input sanitization working

---

## 🎓 SIGN-OFF

**Tested By:** _________________  
**Date:** _________________  
**Environment:** _________________  
**Result:** [ ] APPROVED [ ] NEEDS REVISION

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
