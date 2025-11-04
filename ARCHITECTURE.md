# Document Number Settings - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Settings Page                                                            │
│  └─> DocumentNumberSettings.tsx                                          │
│       ├─> Tabbed Vertical Layout (Invoice | Quotation | Project)         │
│       ├─> Live Preview (real-time format display)                        │
│       ├─> Form Fields (prefix, padding, date, reset)                     │
│       └─> Action Buttons (Preview Next, Save Settings)                   │
│                                                                           │
│                              ▼ HTTP/HTTPS                                 │
└───────────────────────────────────────────────────────────────────────┬─┘
                                                                          │
┌───────────────────────────────────────────────────────────────────────┼─┐
│                          BACKEND (Node.js + Express)                    │ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Routes: /api/document-settings                              │        │
│  │  └─> documentNumberSettings.js                               │        │
│  │       ├─> authenticate middleware                             │        │
│  │       ├─> requireAdmin middleware                             │        │
│  │       └─> Route handlers                                      │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                              ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Controller: documentNumberSettingsController.js             │        │
│  │  ├─> getAllSettings()                                         │        │
│  │  ├─> getSettingsByType()                                      │        │
│  │  ├─> updateSettings()                                         │        │
│  │  ├─> previewNext()                                            │        │
│  │  ├─> assignNumber()                                           │        │
│  │  ├─> getHistory()                                             │        │
│  │  └─> testFormat()                                             │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                              ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Utility: documentNumberGenerator.js                         │        │
│  │  ├─> formatDocumentNumber()  - Generate formatted string     │        │
│  │  ├─> generateDateToken()     - Create MMYY token             │        │
│  │  ├─> shouldReset()           - Check reset logic             │        │
│  │  ├─> previewNextNumber()     - Preview without increment     │        │
│  │  ├─> assignDocumentNumber()  - ATOMIC assignment             │        │
│  │  ├─> getAssignedNumber()     - Retrieve existing             │        │
│  │  └─> validateSettings()      - Input validation              │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                              ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Models: DocumentNumberSettings.js                           │        │
│  │  ├─> DocumentNumberSettings (Sequelize)                      │        │
│  │  └─> DocumentNumberHistory (Sequelize)                       │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                              ▼                                            │
└───────────────────────────────────────────────────────────────────────┬─┘
                                                                          │
┌───────────────────────────────────────────────────────────────────────┼─┐
│                          DATABASE (MySQL)                               │ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Table: document_number_settings                             │        │
│  │  ├─> id, type (UNIQUE)                                        │        │
│  │  ├─> prefix, current_number, padding_length                  │        │
│  │  ├─> include_year, include_month                             │        │
│  │  ├─> reset_rule, last_reset_date                             │        │
│  │  └─> enabled, created_at, updated_at                         │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  Table: document_number_history (Audit Trail)                │        │
│  │  ├─> id, type, document_id                                    │        │
│  │  ├─> generated_number (UNIQUE)                                │        │
│  │  ├─> sequence_number, date_token                             │        │
│  │  └─> assigned_at                                              │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1️⃣ Preview Next Number Flow (Non-destructive)

```
User clicks "Preview Next"
         │
         ▼
Frontend sends GET /api/document-settings/invoice/next
         │
         ▼
Controller: previewNext()
         │
         ▼
Utility: previewNextNumber('invoice')
         │
         ├─> Fetch settings from DB
         ├─> Check if reset needed
         ├─> Calculate next number (current + 1)
         ├─> Format number (prefix-date-padded)
         └─> Return preview (NO DATABASE UPDATE)
         │
         ▼
Frontend displays: "INV-1125-001"
```

### 2️⃣ Assign Document Number Flow (Atomic)

```
Invoice finalized / PDF exported
         │
         ▼
Backend calls: assignDocumentNumber('invoice', invoiceId)
         │
         ▼
START TRANSACTION (SERIALIZABLE)
         │
         ├─> Lock settings row (FOR UPDATE)
         ├─> Check if already assigned (prevent duplicate)
         ├─> Check if reset needed
         ├─> Calculate next number
         ├─> Format number
         ├─> Check for duplicate (safety)
         ├─> Update settings.current_number
         ├─> Insert into document_number_history
         └─> COMMIT TRANSACTION
         │
         ▼
Return: { success: true, number: "INV-1125-001" }
```

### 3️⃣ Save Settings Flow

```
User modifies form and clicks "Save"
         │
         ▼
Frontend sends POST /api/document-settings/invoice
  Body: { prefix: "INV", padding_length: 4, enabled: true, ... }
         │
         ▼
Controller: updateSettings()
         │
         ├─> Validate inputs (validateSettings())
         │   ├─> Check prefix format
         │   ├─> Check padding range (1-8)
         │   ├─> Check reset_rule enum
         │   └─> Return validation result
         │
         ├─> Find or create settings row
         ├─> Update database record
         ├─> Generate preview of next number
         └─> Return success + preview
         │
         ▼
Frontend shows toast: "Settings saved successfully"
Frontend updates live preview: "INV-0001"
```

---

## Integration Flow

### Invoice Workflow (Example)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INVOICE LIFECYCLE                                 │
└─────────────────────────────────────────────────────────────────────┘

1. Invoice Created
   └─> Saved with temporary ID
   └─> No custom number yet

2. User adds line items, client info, etc.
   └─> Draft status
   └─> No custom number yet

3. User clicks "Finalize" or "Export PDF"
   │
   ▼
   ┌─────────────────────────────────────────┐
   │  Check: Is custom numbering enabled?    │
   │  Query: document_number_settings         │
   │  WHERE type='invoice' AND enabled=1     │
   └─────────────────────────────────────────┘
             │                    │
             │ YES                │ NO
             ▼                    ▼
   ┌──────────────────┐   ┌─────────────────────┐
   │ Assign Custom #  │   │ Use existing system │
   │ assignDocument   │   │ (e.g., INV-{id})    │
   │ Number()         │   │                     │
   └──────────────────┘   └─────────────────────┘
             │                    │
             ▼                    ▼
   ┌──────────────────┐   ┌─────────────────────┐
   │ Update invoice   │   │ Continue normally   │
   │ custom_number    │   │                     │
   │ field (optional) │   │                     │
   └──────────────────┘   └─────────────────────┘
             │                    │
             └────────┬───────────┘
                      ▼
           ┌─────────────────────┐
           │ Generate PDF with   │
           │ appropriate number  │
           └─────────────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ Email / Download    │
           └─────────────────────┘
```

---

## Reset Logic Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RESET LOGIC DECISION TREE                         │
└─────────────────────────────────────────────────────────────────────┘

Current Settings:
  - reset_rule: 'monthly'
  - current_number: 45
  - last_reset_date: '2024-10-15'

New Assignment Request: 2024-11-03
         │
         ▼
   ┌──────────────────────┐
   │ Check reset_rule     │
   └──────────────────────┘
         │
         ├─> "never" ─────────> Continue with current_number + 1
         │
         ├─> "monthly" ───────> Compare month/year
         │                       │
         │                       ├─> Same month? ──> No reset
         │                       └─> Different?  ──> RESET TO 1
         │
         └─> "yearly" ────────> Compare year
                                 │
                                 ├─> Same year? ──> No reset
                                 └─> Different?  ──> RESET TO 1

In this example:
  - reset_rule = 'monthly'
  - last_reset = October 2024
  - current date = November 2024
  - Result: RESET TO 1
  - Update last_reset_date = 2024-11-03
  - Assign number: INV-1125-001 (sequence = 1)
```

---

## Concurrent Request Handling

```
┌─────────────────────────────────────────────────────────────────────┐
│               CONCURRENT ASSIGNMENT PROTECTION                       │
└─────────────────────────────────────────────────────────────────────┘

Two requests arrive simultaneously:
  Request A: Assign number to Invoice #100
  Request B: Assign number to Invoice #101

Current settings: current_number = 5

┌──────────────────────┐        ┌──────────────────────┐
│   Request A          │        │   Request B          │
└──────────────────────┘        └──────────────────────┘
         │                                │
         ▼                                ▼
   START TRANSACTION              START TRANSACTION
   (SERIALIZABLE)                 (SERIALIZABLE)
         │                                │
         ▼                                │
   LOCK settings row                      │
   (FOR UPDATE)                           │
         │                                │
         ├─> Read current_number: 5       │
         ├─> Calculate next: 6            │
         ├─> Update current_number: 6     │
         ├─> Insert history: INV-006      │
         └─> COMMIT                       │
                                          ▼
                                    WAITS for lock...
                                          │
                                    Lock acquired
                                          │
                                    Read current_number: 6
                                    Calculate next: 7
                                    Update current_number: 7
                                    Insert history: INV-007
                                    COMMIT

Result:
  - Request A: INV-006 (sequence 6)
  - Request B: INV-007 (sequence 7)
  - No duplicates!
  - No gaps!
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                           │
└─────────────────────────────────────────────────────────────────────┘

Assignment Request
         │
         ▼
   ┌──────────────────────────────┐
   │ Try: assignDocumentNumber()  │
   └──────────────────────────────┘
         │
         ├─> Settings not found ──────> Return: { useExisting: true }
         │                               └─> Fallback to old system
         │
         ├─> Feature disabled ────────> Return: { useExisting: true }
         │                               └─> Fallback to old system
         │
         ├─> Already assigned ────────> Return: { alreadyAssigned: true }
         │                               └─> Return existing number
         │
         ├─> Transaction error ───────> Rollback + Log error
         │                               └─> Throw error to handler
         │
         └─> Success ──────────────────> Return: { success: true, number }

Controller Level:
         │
         ▼
   ┌──────────────────────────────┐
   │ Catch any errors             │
   │ ├─> Log to console            │
   │ ├─> Don't break invoice flow  │
   │ └─> Return gracefully         │
   └──────────────────────────────┘

Result:
  - System NEVER crashes
  - Always has fallback
  - Errors logged for debugging
  - User experience uninterrupted
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────┘

Incoming Request
         │
         ▼
┌─────────────────────┐
│ Layer 1: HTTPS/TLS  │  (Transport security)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Layer 2: Auth       │  authenticate() middleware
│ - JWT validation    │  └─> Verify token
│ - Token expiry      │  └─> Check expiration
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Layer 3: Authz      │  requireAdmin() middleware
│ - Role check        │  └─> Verify role === 'admin'
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Layer 4: Validation │  validateSettings()
│ - Input sanitize    │  └─> Regex checks
│ - Type checking     │  └─> Enum validation
│ - Range validation  │  └─> Min/max checks
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Layer 5: Database   │  Sequelize ORM
│ - Parameterized     │  └─> Prevent SQL injection
│ - Transactions      │  └─> ACID compliance
│ - Constraints       │  └─> Enforce data integrity
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Layer 6: Audit      │  document_number_history
│ - Log all assigns   │  └─> Immutable audit trail
│ - Track who/when    │  └─> Compliance ready
└─────────────────────┘
         │
         ▼
    SUCCESS 200 OK
```

---

## Files & Directory Structure

```
Finvo/
│
├── server/
│   ├── migrations/
│   │   ├── 001_document_number_settings.sql         ← Database schema
│   │   └── 001_document_number_settings_rollback.sql ← Rollback script
│   │
│   ├── models/
│   │   └── DocumentNumberSettings.js                ← Sequelize models
│   │
│   ├── controllers/
│   │   └── documentNumberSettingsController.js      ← API handlers
│   │
│   ├── routes/
│   │   └── documentNumberSettings.js                ← Route definitions
│   │
│   ├── utils/
│   │   └── documentNumberGenerator.js               ← Core logic
│   │
│   └── tests/
│       ├── documentNumberGenerator.test.js          ← Unit tests
│       └── api-test.js                              ← API tests
│
├── frontend/
│   └── src/
│       └── components/
│           └── settings/
│               └── DocumentNumberSettings.tsx       ← UI component
│
├── INTEGRATION_GUIDE.md                             ← How to integrate
├── QA_CHECKLIST.md                                  ← Testing guide
├── FEATURE_SUMMARY.md                               ← File listing
└── DEPLOYMENT_SUMMARY.md                            ← Deployment guide
```

---

## Component Interaction Map

```
Settings Page
      │
      └─> DocumentNumberSettings Component
            │
            ├─> useState (activeTab, settings, formData)
            ├─> useEffect (fetch on mount, update on tab change)
            │
            ├─> API Calls:
            │     ├─> GET /api/document-settings (fetch all)
            │     ├─> GET /api/document-settings/:type (fetch specific)
            │     ├─> POST /api/document-settings/:type (update)
            │     └─> GET /api/document-settings/:type/next (preview)
            │
            ├─> Event Handlers:
            │     ├─> handleInputChange (form updates)
            │     ├─> handleSave (persist to DB)
            │     └─> handlePreviewNext (fetch preview)
            │
            └─> UI Elements:
                  ├─> Vertical Tabs (Invoice | Quotation | Project)
                  ├─> Live Preview Box
                  ├─> Form Fields (7 inputs)
                  ├─> Action Buttons (2)
                  └─> Recent Numbers Section (collapsible)
```

---

This architecture provides:

✅ **Separation of Concerns** - Clear layer boundaries  
✅ **Security** - Multiple validation layers  
✅ **Scalability** - Transaction-safe concurrent handling  
✅ **Maintainability** - Well-organized file structure  
✅ **Reliability** - Comprehensive error handling  
✅ **Auditability** - Complete history tracking  
✅ **Testability** - Unit and integration tests included  
