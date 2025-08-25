// Simple test for key profanity cases
console.log('🧪 TESTING FRONTEND PROFANITY FILTER');
console.log('='.repeat(50));

// Simulate the core profanity checking logic
const OFFENSIVE_WORDS = [
  'fuck', 'shit', 'bitch', 'bastard', 'damn', 'hell',
  'ass', 'asshole', 'piss', 'crap', 'suck', 'dick', 'cock',
  'pussy', 'cunt', 'twat', 'whore', 'slut', 'tits', 'boobs',
  'nigga', 'nigger', 'fag', 'faggot', 'dyke', 'retard',
  'f*ck', 'f**k', 'sh*t', 'n*gga', 'n**ga'
];

const RESERVED_NAMES = [
  'admin', 'administrator', 'root', 'user', 'test', 'demo', 'guest'
];

function containsOffensiveWord(text) {
  if (!text) return { isOffensive: false, word: null };
  
  const normalizedText = text.toLowerCase().trim();
  
  for (const word of OFFENSIVE_WORDS) {
    const normalizedWord = word.toLowerCase();
    
    // Exact match
    if (normalizedText === normalizedWord) {
      return { isOffensive: true, word: word };
    }
    
    // Word boundary check
    const wordRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(normalizedText)) {
      return { isOffensive: true, word: word };
    }
  }
  
  return { isOffensive: false, word: null };
}

function isReservedName(text) {
  if (!text) return { isReserved: false, word: null };
  
  const normalizedText = text.toLowerCase().trim();
  
  for (const reserved of RESERVED_NAMES) {
    if (normalizedText === reserved) {
      return { isReserved: true, word: reserved };
    }
  }
  
  return { isReserved: false, word: null };
}

function validateUserInput(text, type = 'general') {
  if (!text || typeof text !== 'string') {
    return { isValid: true, error: null };
  }
  
  // Check for profanity
  const profanityCheck = containsOffensiveWord(text);
  if (profanityCheck.isOffensive) {
    const messages = {
      username: 'This username contains inappropriate content and cannot be used. Please choose a different username.',
      first_name: 'This first name contains inappropriate content and cannot be used. Please use your real first name.',
      last_name: 'This last name contains inappropriate content and cannot be used. Please use your real last name.',
      general: 'This text contains inappropriate content and cannot be used.'
    };
    
    return { 
      isValid: false, 
      error: messages[type] || messages.general,
      word: profanityCheck.word
    };
  }
  
  // Check for reserved names (only for usernames)
  if (type === 'username') {
    const reservedCheck = isReservedName(text);
    if (reservedCheck.isReserved) {
      return { 
        isValid: false, 
        error: `'${text}' is a reserved username and cannot be used.`,
        word: reservedCheck.word
      };
    }
  }
  
  return { isValid: true, error: null };
}

// Test cases
const testCases = [
  // Critical test cases
  { input: 'nigga', type: 'first_name', shouldPass: false, description: 'CRITICAL: nigga as first name' },
  { input: 'Nigga', type: 'first_name', shouldPass: false, description: 'CRITICAL: Nigga as first name' },
  { input: 'nigga', type: 'username', shouldPass: false, description: 'CRITICAL: nigga as username' },
  { input: 'fuck', type: 'first_name', shouldPass: false, description: 'fuck as first name' },
  { input: 'shit', type: 'last_name', shouldPass: false, description: 'shit as last name' },
  
  // Clean cases
  { input: 'John', type: 'first_name', shouldPass: true, description: 'John as first name' },
  { input: 'Mary', type: 'first_name', shouldPass: true, description: 'Mary as first name' },
  { input: 'testuser', type: 'username', shouldPass: true, description: 'testuser as username' },
  
  // Reserved names
  { input: 'admin', type: 'username', shouldPass: false, description: 'admin as username (reserved)' },
  { input: 'admin', type: 'first_name', shouldPass: true, description: 'admin as first name (OK)' }
];

let passed = 0;
let failed = 0;
let criticalFailed = 0;

testCases.forEach((testCase, index) => {
  const result = validateUserInput(testCase.input, testCase.type);
  const actuallyPassed = result.isValid;
  const expectedToPass = testCase.shouldPass;
  
  if (actuallyPassed === expectedToPass) {
    console.log(`✓ Test ${index + 1}: ${testCase.description} - PASS`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1}: ${testCase.description} - FAIL`);
    console.log(`   Input: "${testCase.input}" (${testCase.type})`);
    console.log(`   Expected: ${expectedToPass ? 'ALLOW' : 'BLOCK'}, Got: ${actuallyPassed ? 'ALLOW' : 'BLOCK'}`);
    if (!actuallyPassed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    failed++;
    
    if (testCase.description.includes('CRITICAL')) {
      criticalFailed++;
    }
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);

if (criticalFailed > 0) {
  console.log(`🚨 CRITICAL: ${criticalFailed} critical tests failed!`);
}

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Frontend profanity filter is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Check the implementation.');
}