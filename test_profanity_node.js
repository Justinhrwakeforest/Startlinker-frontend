// Node.js test runner for the profanity filter
const fs = require('fs');
const path = require('path');

// Read the profanity filter file
const profanityFilterPath = path.join(__dirname, 'src', 'utils', 'profanityFilter.js');
const profanityFilterCode = fs.readFileSync(profanityFilterPath, 'utf8');

// Create a mock exports object
const mockExports = {};

// Execute the profanity filter code in a controlled environment
const vm = require('vm');
const context = {
  exports: mockExports,
  module: { exports: mockExports },
  console: console
};

vm.createContext(context);
vm.runInContext(profanityFilterCode, context);

// Get the validateUserInput function
const validateUserInput = context.module.exports.validateUserInput || context.validateUserInput;

if (!validateUserInput) {
  console.log('❌ Could not find validateUserInput function');
  process.exit(1);
}

console.log('🧪 TESTING FRONTEND PROFANITY FILTER');
console.log('='.repeat(50));

// Test cases
const testCases = [
  // Offensive words that should be blocked
  { input: 'nigga', type: 'first_name', shouldPass: false },
  { input: 'Nigga', type: 'first_name', shouldPass: false },
  { input: 'NIGGA', type: 'first_name', shouldPass: false },
  { input: 'fuck', type: 'username', shouldPass: false },
  { input: 'shit', type: 'last_name', shouldPass: false },
  { input: 'f*ck', type: 'username', shouldPass: false },
  { input: 'n*gga', type: 'first_name', shouldPass: false },
  
  // Clean words that should pass
  { input: 'John', type: 'first_name', shouldPass: true },
  { input: 'Mary', type: 'first_name', shouldPass: true },
  { input: 'Smith', type: 'last_name', shouldPass: true },
  { input: 'testuser', type: 'username', shouldPass: true },
  { input: 'alice', type: 'first_name', shouldPass: true },
  
  // Reserved names (should be blocked for username only)
  { input: 'admin', type: 'username', shouldPass: false },
  { input: 'admin', type: 'first_name', shouldPass: true }, // OK for first name
  { input: 'test', type: 'username', shouldPass: false },
  { input: 'test', type: 'first_name', shouldPass: true }, // OK for first name
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = validateUserInput(testCase.input, testCase.type);
    const actuallyPassed = result.isValid;
    const expectedToPass = testCase.shouldPass;
    
    if (actuallyPassed === expectedToPass) {
      console.log(`✓ Test ${index + 1}: "${testCase.input}" (${testCase.type}) - PASS`);
      passed++;
    } else {
      console.log(`✗ Test ${index + 1}: "${testCase.input}" (${testCase.type}) - FAIL`);
      console.log(`   Expected: ${expectedToPass ? 'PASS' : 'BLOCK'}, Got: ${actuallyPassed ? 'PASS' : 'BLOCK'}`);
      if (!actuallyPassed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`✗ Test ${index + 1}: "${testCase.input}" (${testCase.type}) - ERROR`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Frontend profanity filter is working correctly.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Check the implementation.');
  process.exit(1);
}