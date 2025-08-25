// Test script to check backend connectivity
const axios = require('axios');

const testBackendConnection = async () => {
  const testUrls = [
    'http://localhost:8000/api/auth/check-username/?username=testuser',
    'http://51.21.246.24/api/auth/check-username/?username=testuser',
    'https://startlinker.com/api/auth/check-username/?username=testuser'
  ];

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✅ Success: ${url}`);
      console.log('Response:', response.data);
    } catch (error) {
      console.log(`❌ Failed: ${url}`);
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }
    console.log('---');
  }
};

testBackendConnection();
