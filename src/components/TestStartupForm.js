// src/components/TestStartupForm.js - Minimal test component
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const TestStartupForm = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [industries, setIndustries] = useState([]);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    console.log('TestStartupForm mounted');
    console.log('AuthContext:', authContext);
    
    const testAPI = async () => {
      try {
        console.log('Testing API call...');
        const response = await api.get('/api/startups/industries/');
        console.log('API Response:', response.data);
        setIndustries(response.data.results || response.data);
        setLoading(false);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (!authContext) {
    return <div>AuthContext is null</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Startup Form</h1>
      <p>User: {authContext.user?.username || 'Not logged in'}</p>
      <p>Is Authenticated: {authContext.isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Industries loaded: {industries.length}</p>
      
      <h3>Industries:</h3>
      <ul>
        {industries.map(industry => (
          <li key={industry.id}>
            {industry.icon} {industry.name}
          </li>
        ))}
      </ul>
      
      <button onClick={() => console.log('AuthContext:', authContext)}>
        Log AuthContext
      </button>
    </div>
  );
};

export default TestStartupForm;