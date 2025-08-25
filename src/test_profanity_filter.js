// Test script for the frontend profanity filter
import validateUserInput from './utils/profanityFilter';

function testProfanityFilter() {
  console.log('🧪 TESTING FRONTEND PROFANITY FILTER');
  console.log('=' .repeat(50));
  
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
    const result = validateUserInput(testCase.input, testCase.type);
    const actuallyPassed = result.isValid;
    const expectedToPass = testCase.shouldPass;
    
    if (actuallyPassed === expectedToPass) {
      console.log(`✅ Test ${index + 1}: "${testCase.input}" (${testCase.type}) - PASS`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.input}" (${testCase.type}) - FAIL`);
      console.log(`   Expected: ${expectedToPass ? 'PASS' : 'BLOCK'}, Got: ${actuallyPassed ? 'PASS' : 'BLOCK'}`);
      if (!actuallyPassed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Frontend profanity filter is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }
  
  return failed === 0;
}

// Export for use in React components or run directly
if (typeof window !== 'undefined') {
  window.testProfanityFilter = testProfanityFilter;
}

export default testProfanityFilter;