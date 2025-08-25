// Test file for avatar utilities
import { getFirstNameInitials, getAvatarUrl } from './avatarUtils';

// Test cases for getFirstNameInitials
const testCases = [
    {
        input: { first_name: 'John' },
        expected: 'JO',
        description: 'Single first name - should return first two letters'
    },
    {
        input: { first_name: 'A' },
        expected: 'A',
        description: 'Single letter first name - should return just that letter'
    },
    {
        input: { first_name: 'Alice' },
        expected: 'AL',
        description: 'First name Alice - should return AL'
    },
    {
        input: { display_name: 'Bob Smith' },
        expected: 'BO',
        description: 'Display name with last name - should return first two letters of first name'
    },
    {
        input: { username: 'charlie123' },
        expected: 'CH',
        description: 'Only username available - should return first two letters'
    },
    {
        input: { first_name: 'David', last_name: 'Johnson' },
        expected: 'DA',
        description: 'First and last name - should return first two letters of first name'
    },
    {
        input: {},
        expected: 'U',
        description: 'No name fields - should return U for User'
    },
    {
        input: { first_name: '  Emma  ' },
        expected: 'EM',
        description: 'Name with spaces - should trim and return first two letters'
    },
    {
        input: { first_name: 'François' },
        expected: 'FR',
        description: 'Name with special characters - should handle correctly'
    },
    {
        input: { first_name: 'Xi' },
        expected: 'XI',
        description: 'Two letter name - should return both letters'
    }
];

// Run tests
console.log('Testing getFirstNameInitials function:\n');
console.log('=' .repeat(50));

testCases.forEach((testCase, index) => {
    const result = getFirstNameInitials(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);
    console.log(`Expected: "${testCase.expected}"`);
    console.log(`Got: "${result}"`);
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('-'.repeat(50));
});

// Test avatar URL generation
console.log('\nTesting getAvatarUrl function:\n');
console.log('='.repeat(50));

const avatarTestCases = [
    {
        input: { first_name: 'John', avatar_url: 'https://example.com/avatar.jpg' },
        description: 'User with avatar_url - should return the avatar URL'
    },
    {
        input: { first_name: 'Alice' },
        description: 'User without avatar - should generate UI Avatars URL with "AL"'
    },
    {
        input: { display_name: 'Bob Smith' },
        description: 'User with display name - should generate UI Avatars URL with "BO"'
    }
];

avatarTestCases.forEach((testCase, index) => {
    const result = getAvatarUrl(testCase.input, 48);
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);
    console.log(`Generated URL: ${result}`);
    
    if (testCase.input.avatar_url) {
        console.log(`Status: ${result === testCase.input.avatar_url ? '✅ Returns provided avatar URL' : '❌ Should return provided URL'}`);
    } else {
        const initials = getFirstNameInitials(testCase.input);
        const containsInitials = result.includes(encodeURIComponent(initials));
        console.log(`Expected initials in URL: "${initials}"`);
        console.log(`Status: ${containsInitials ? '✅ Contains correct initials' : '❌ Missing correct initials'}`);
    }
    console.log('-'.repeat(50));
});

export default testCases;