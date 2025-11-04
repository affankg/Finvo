/**
 * Document Number Generator - Unit Tests
 * 
 * Run with: npm test
 * Or: node server/tests/documentNumberGenerator.test.js
 */

const {
  formatDocumentNumber,
  generateDateToken,
  shouldReset,
  validateSettings
} = require('../utils/documentNumberGenerator');

// Test results
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    failed++;
  }
}

function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    failed++;
  }
}

console.log('\n🧪 Running Document Number Generator Tests...\n');

// ============================================
// TEST SUITE 1: Format Generation
// ============================================
console.log('📋 Test Suite 1: Format Generation\n');

// Test 1.1: Prefix only
const settings1 = { prefix: 'INV', padding_length: 3 };
const result1 = formatDocumentNumber(settings1, 1);
assertEquals(result1, 'INV-001', 'Prefix with padding');

// Test 1.2: No prefix
const settings2 = { prefix: '', padding_length: 4 };
const result2 = formatDocumentNumber(settings2, 42);
assertEquals(result2, '0042', 'No prefix, just padded number');

// Test 1.3: Different padding lengths
const settings3 = { prefix: 'QUO', padding_length: 5 };
const result3 = formatDocumentNumber(settings3, 123);
assertEquals(result3, 'QUO-00123', 'Padding length 5');

// Test 1.4: Large number
const settings4 = { prefix: 'PRO', padding_length: 3 };
const result4 = formatDocumentNumber(settings4, 9999);
assertEquals(result4, 'PRO-9999', 'Number exceeds padding');

// ============================================
// TEST SUITE 2: Date Token Generation
// ============================================
console.log('\n📅 Test Suite 2: Date Token Generation\n');

const now = new Date();
const year = now.getFullYear().toString().slice(-2);
const month = (now.getMonth() + 1).toString().padStart(2, '0');

// Test 2.1: Year only
const dateSettings1 = { include_year: true, include_month: false };
const dateToken1 = generateDateToken(dateSettings1);
assertEquals(dateToken1, year, 'Year token only');

// Test 2.2: Month only
const dateSettings2 = { include_year: false, include_month: true };
const dateToken2 = generateDateToken(dateSettings2);
assertEquals(dateToken2, month, 'Month token only');

// Test 2.3: Both
const dateSettings3 = { include_year: true, include_month: true };
const dateToken3 = generateDateToken(dateSettings3);
assertEquals(dateToken3, `${month}${year}`, 'Month and year token');

// Test 2.4: Neither
const dateSettings4 = { include_year: false, include_month: false };
const dateToken4 = generateDateToken(dateSettings4);
assertEquals(dateToken4, '', 'No date token');

// ============================================
// TEST SUITE 3: Reset Logic
// ============================================
console.log('\n🔄 Test Suite 3: Reset Logic\n');

// Test 3.1: Never reset
const neverSettings = { reset_rule: 'never', last_reset_date: '2023-01-01' };
assert(!shouldReset(neverSettings), 'Never reset returns false');

// Test 3.2: Monthly reset (same month)
const sameMonthDate = new Date();
const monthlySettings1 = { 
  reset_rule: 'monthly', 
  last_reset_date: sameMonthDate.toISOString().split('T')[0]
};
assert(!shouldReset(monthlySettings1), 'Monthly reset - same month');

// Test 3.3: Monthly reset (different month)
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
const monthlySettings2 = { 
  reset_rule: 'monthly', 
  last_reset_date: lastMonth.toISOString().split('T')[0]
};
assert(shouldReset(monthlySettings2), 'Monthly reset - different month');

// Test 3.4: Yearly reset (same year)
const sameYearDate = new Date();
const yearlySettings1 = { 
  reset_rule: 'yearly', 
  last_reset_date: sameYearDate.toISOString().split('T')[0]
};
assert(!shouldReset(yearlySettings1), 'Yearly reset - same year');

// Test 3.5: Yearly reset (different year)
const yearlySettings2 = { 
  reset_rule: 'yearly', 
  last_reset_date: '2023-06-15'
};
assert(shouldReset(yearlySettings2), 'Yearly reset - different year');

// ============================================
// TEST SUITE 4: Validation
// ============================================
console.log('\n✔️ Test Suite 4: Input Validation\n');

// Test 4.1: Valid settings
const validSettings = {
  type: 'invoice',
  prefix: 'INV',
  padding_length: 3,
  current_number: 0,
  reset_rule: 'never'
};
const validation1 = validateSettings(validSettings);
assert(validation1.valid, 'Valid settings pass');

// Test 4.2: Invalid prefix
const invalidPrefix = { ...validSettings, prefix: 'INV@123' };
const validation2 = validateSettings(invalidPrefix);
assert(!validation2.valid, 'Invalid prefix fails');
assert(validation2.errors.length > 0, 'Invalid prefix has errors');

// Test 4.3: Invalid padding
const invalidPadding = { ...validSettings, padding_length: 10 };
const validation3 = validateSettings(invalidPadding);
assert(!validation3.valid, 'Invalid padding fails');

// Test 4.4: Invalid current number
const invalidNumber = { ...validSettings, current_number: -5 };
const validation4 = validateSettings(invalidNumber);
assert(!validation4.valid, 'Negative number fails');

// Test 4.5: Invalid type
const invalidType = { ...validSettings, type: 'invalid' };
const validation5 = validateSettings(invalidType);
assert(!validation5.valid, 'Invalid type fails');

// Test 4.6: Invalid reset rule
const invalidReset = { ...validSettings, reset_rule: 'daily' };
const validation6 = validateSettings(invalidReset);
assert(!validation6.valid, 'Invalid reset rule fails');

// ============================================
// TEST SUITE 5: Complete Format Generation
// ============================================
console.log('\n🎯 Test Suite 5: Complete Format\n');

// Test 5.1: All components
const completeSettings = {
  prefix: 'INV',
  padding_length: 4,
  include_year: true,
  include_month: true
};
const complete1 = formatDocumentNumber(completeSettings, 1);
const expectedFormat = `INV-${month}${year}-0001`;
assertEquals(complete1, expectedFormat, 'Complete format with all components');

// Test 5.2: Prefix + Year
const prefixYearSettings = {
  prefix: 'QUO',
  padding_length: 3,
  include_year: true,
  include_month: false
};
const complete2 = formatDocumentNumber(prefixYearSettings, 5);
const expectedFormat2 = `QUO-${year}-005`;
assertEquals(complete2, expectedFormat2, 'Prefix + Year format');

// ============================================
// TEST RESULTS
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review.\n');
  process.exit(1);
}
