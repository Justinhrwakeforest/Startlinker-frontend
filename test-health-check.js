// Test script to check backend health
const axios = require('axios');

const testBackendHealth = async () => {
  const testUrls = [
    'http://localhost:8000/health/',
    'http://51.21.246.24/health/',
    'https://startlinker.com/health/',
    'http://localhost:8000/api/',
    'http://51.21.246.24/api/',
    'https://startlinker.com/api/'
  ];

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { timeout: 5000 });
      console.log(`✅ Success: ${url}`);
      console.log('Status:', response.status);
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

testBackendHealth();
