#!/usr/bin/env node

/**
 * Document Number Settings API Test Script
 * 
 * Usage: 
 *   node server/tests/api-test.js
 * 
 * Requirements:
 *   - Server must be running
 *   - Admin JWT token required
 *   - Database must be migrated
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_JWT_TOKEN_HERE';

// HTTP client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test results
let passed = 0;
let failed = 0;

// Utility functions
function log(message) {
  console.log(`  ${message}`);
}

function success(message) {
  console.log(`  ✅ ${message}`);
  passed++;
}

function fail(message, error) {
  console.log(`  ❌ ${message}`);
  if (error) {
    console.log(`     Error: ${error.response?.data?.message || error.message}`);
  }
  failed++;
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Test functions
async function testGetAllSettings() {
  section('TEST 1: Get All Settings');
  try {
    const response = await api.get('/api/document-settings');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      success('Successfully fetched all settings');
      log(`Found ${response.data.data.length} settings`);
      
      // Verify types
      const types = response.data.data.map(s => s.type);
      if (types.includes('invoice') && types.includes('quotation') && types.includes('project')) {
        success('All three types present');
      } else {
        fail('Missing one or more types');
      }
    } else {
      fail('Invalid response structure');
    }
  } catch (error) {
    fail('Failed to fetch settings', error);
  }
}

async function testGetInvoiceSettings() {
  section('TEST 2: Get Invoice Settings');
  try {
    const response = await api.get('/api/document-settings/invoice');
    
    if (response.data.success && response.data.data.type === 'invoice') {
      success('Successfully fetched invoice settings');
      log(`Current number: ${response.data.data.current_number}`);
      log(`Enabled: ${response.data.data.enabled}`);
    } else {
      fail('Invalid invoice settings response');
    }
  } catch (error) {
    fail('Failed to fetch invoice settings', error);
  }
}

async function testUpdateInvoiceSettings() {
  section('TEST 3: Update Invoice Settings');
  try {
    const updateData = {
      prefix: 'INV',
      current_number: 0,
      padding_length: 4,
      include_year: true,
      include_month: false,
      reset_rule: 'yearly',
      enabled: true
    };
    
    const response = await api.post('/api/document-settings/invoice', updateData);
    
    if (response.data.success) {
      success('Successfully updated invoice settings');
      
      if (response.data.preview) {
        log(`Preview: ${response.data.preview}`);
      }
      
      // Verify update
      const verify = await api.get('/api/document-settings/invoice');
      if (verify.data.data.prefix === 'INV' && verify.data.data.padding_length === 4) {
        success('Settings persisted correctly');
      } else {
        fail('Settings did not persist');
      }
    } else {
      fail('Failed to update settings');
    }
  } catch (error) {
    fail('Failed to update invoice settings', error);
  }
}

async function testPreviewNext() {
  section('TEST 4: Preview Next Number');
  try {
    const response = await api.get('/api/document-settings/invoice/next');
    
    if (response.data.success && response.data.data.preview) {
      success('Successfully previewed next number');
      log(`Preview: ${response.data.data.preview}`);
      log(`Next sequence: ${response.data.data.nextSequence}`);
      
      // Call preview again - should be same
      const response2 = await api.get('/api/document-settings/invoice/next');
      if (response.data.data.preview === response2.data.data.preview) {
        success('Preview is consistent (no increment)');
      } else {
        fail('Preview incremented (should not happen)');
      }
    } else {
      fail('Invalid preview response');
    }
  } catch (error) {
    fail('Failed to preview next number', error);
  }
}

async function testAssignNumber() {
  section('TEST 5: Assign Document Number');
  try {
    // Generate random document ID for testing
    const testDocId = Math.floor(Math.random() * 10000);
    
    const response = await api.post('/api/document-settings/invoice/assign', {
      documentId: testDocId
    });
    
    if (response.data.success && response.data.data.number) {
      success('Successfully assigned document number');
      log(`Assigned: ${response.data.data.number}`);
      log(`Sequence: ${response.data.data.sequenceNumber}`);
      
      // Try to assign again - should return same number
      const response2 = await api.post('/api/document-settings/invoice/assign', {
        documentId: testDocId
      });
      
      if (response2.data.data.alreadyAssigned) {
        success('Duplicate assignment prevented');
      } else {
        fail('Duplicate assignment allowed (should not happen)');
      }
    } else {
      fail('Failed to assign number');
    }
  } catch (error) {
    fail('Failed to assign document number', error);
  }
}

async function testHistory() {
  section('TEST 6: Get Assignment History');
  try {
    const response = await api.get('/api/document-settings/invoice/history?limit=5');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      success('Successfully fetched history');
      log(`Records: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        log(`Latest: ${response.data.data[0].generated_number}`);
      }
    } else {
      fail('Invalid history response');
    }
  } catch (error) {
    fail('Failed to fetch history', error);
  }
}

async function testValidation() {
  section('TEST 7: Input Validation');
  
  // Test invalid prefix
  try {
    await api.post('/api/document-settings/invoice', {
      prefix: 'INV@123!',  // Invalid characters
      padding_length: 3
    });
    fail('Invalid prefix accepted (should reject)');
  } catch (error) {
    if (error.response?.status === 400) {
      success('Invalid prefix rejected');
    } else {
      fail('Unexpected error for invalid prefix', error);
    }
  }
  
  // Test invalid padding
  try {
    await api.post('/api/document-settings/invoice', {
      prefix: 'INV',
      padding_length: 10  // Out of range
    });
    fail('Invalid padding accepted (should reject)');
  } catch (error) {
    if (error.response?.status === 400) {
      success('Invalid padding rejected');
    } else {
      fail('Unexpected error for invalid padding', error);
    }
  }
  
  // Test invalid type
  try {
    await api.get('/api/document-settings/invalid-type');
    fail('Invalid type accepted (should reject)');
  } catch (error) {
    if (error.response?.status === 400) {
      success('Invalid type rejected');
    } else {
      fail('Unexpected error for invalid type', error);
    }
  }
}

async function testQuotationSettings() {
  section('TEST 8: Quotation Settings');
  try {
    const response = await api.post('/api/document-settings/quotation', {
      prefix: 'QUO',
      padding_length: 3,
      include_year: true,
      include_month: true,
      reset_rule: 'monthly',
      enabled: true
    });
    
    if (response.data.success) {
      success('Quotation settings updated');
      
      // Preview
      const preview = await api.get('/api/document-settings/quotation/next');
      if (preview.data.success) {
        success('Quotation preview generated');
        log(`Preview: ${preview.data.data.preview}`);
      }
    }
  } catch (error) {
    fail('Failed quotation test', error);
  }
}

async function testProjectSettings() {
  section('TEST 9: Project Settings');
  try {
    const response = await api.post('/api/document-settings/project', {
      prefix: 'PRO',
      padding_length: 5,
      include_year: false,
      include_month: false,
      reset_rule: 'never',
      enabled: false  // Disabled
    });
    
    if (response.data.success) {
      success('Project settings updated (disabled)');
      
      // Try to preview - should fail gracefully
      const preview = await api.get('/api/document-settings/project/next');
      if (!preview.data.success) {
        success('Preview correctly returns disabled status');
      }
    }
  } catch (error) {
    fail('Failed project test', error);
  }
}

async function testFormatTesting() {
  section('TEST 10: Format Testing Endpoint');
  try {
    const response = await api.post('/api/document-settings/test-format', {
      prefix: 'TEST',
      padding_length: 4,
      include_year: true,
      include_month: true,
      test_number: 42
    });
    
    if (response.data.success && response.data.formatted) {
      success('Format testing works');
      log(`Test format: ${response.data.formatted}`);
    } else {
      fail('Format testing failed');
    }
  } catch (error) {
    fail('Failed format test', error);
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log('🚀 Document Number Settings API Tests');
  console.log('='.repeat(60));
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Token: ${ADMIN_TOKEN.substring(0, 20)}...`);
  console.log('='.repeat(60));
  
  // Verify server is running
  try {
    await api.get('/api/health').catch(() => {});
    log('✅ Server is reachable\n');
  } catch {
    log('⚠️  Warning: Could not verify server health\n');
  }
  
  // Run tests
  await testGetAllSettings();
  await testGetInvoiceSettings();
  await testUpdateInvoiceSettings();
  await testPreviewNext();
  await testAssignNumber();
  await testHistory();
  await testValidation();
  await testQuotationSettings();
  await testProjectSettings();
  await testFormatTesting();
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log('  📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total: ${passed + failed}`);
  console.log(`  🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('  🎉 All API tests passed!\n');
    process.exit(0);
  } else {
    console.log('  ⚠️  Some tests failed. Please review.\n');
    process.exit(1);
  }
}

// Check if token is provided
if (ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
  console.error('\n❌ Error: Please set ADMIN_TOKEN environment variable');
  console.error('   Example: ADMIN_TOKEN=your_token node server/tests/api-test.js\n');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
