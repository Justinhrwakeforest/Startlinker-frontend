import React from 'react';

const TestUploadForm = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>🎉 Test Upload Form Works!</h1>
      <p>If you see this, the routing is working perfectly.</p>
      <p>This means the issue is specifically with the StartupUploadForm component.</p>
      <div style={{ 
        background: '#f0f8ff', 
        padding: '15px', 
        border: '1px solid #0066cc',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <strong>Next steps:</strong>
        <ol>
          <li>Check browser console for JavaScript errors</li>
          <li>Verify StartupUploadForm.js file exists and has correct syntax</li>
          <li>Check for import/export issues</li>
        </ol>
      </div>
    </div>
  );
};

export default TestUploadForm;