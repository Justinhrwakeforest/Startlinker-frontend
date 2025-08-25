// Test API connection
import api from './services/api';

console.log('Testing API connection...');

// Test basic connection
api.testConnection().then(result => {
  console.log('Connection test result:', result);
});

// Test stats endpoint
api.get('/api/stats/').then(response => {
  console.log('Stats response:', response.data);
}).catch(error => {
  console.error('Stats error:', error.message);
});

// Test auth check
api.checkAuth().then(result => {
  console.log('Auth check result:', result);
});

console.log('API test initiated...');