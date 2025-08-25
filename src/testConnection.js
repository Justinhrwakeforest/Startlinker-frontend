// Test frontend to backend connection
import axios from 'axios';

// Test different approaches
const testConnection = async () => {
  console.log('Testing frontend to backend connection...');
  
  // Test 1: Direct HTTP request
  try {
    console.log('Test 1: Direct HTTP request to backend');
    const response = await axios.get('http://localhost:8000/stats/', {
      timeout: 5000,
      maxRedirects: 0
    });
    console.log('✓ Direct HTTP request successful:', response.status);
  } catch (error) {
    console.error('✗ Direct HTTP request failed:', error.message);
  }
  
  // Test 2: Using proxy (relative URL)
  try {
    console.log('Test 2: Using proxy (relative URL)');
    const response = await axios.get('/api/stats/', {
      timeout: 5000,
      maxRedirects: 0
    });
    console.log('✓ Proxy request successful:', response.status);
  } catch (error) {
    console.error('✗ Proxy request failed:', error.message);
  }
  
  // Test 3: Using fetch with proxy
  try {
    console.log('Test 3: Using fetch with proxy');
    const response = await fetch('/stats/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('✓ Fetch request successful:', response.status);
  } catch (error) {
    console.error('✗ Fetch request failed:', error.message);
  }
};

// Run tests
testConnection();

export default testConnection;