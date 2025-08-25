import React, { useState } from 'react';
import api from '../services/api';

const ResumeUploadTest = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');

  const testUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setResult(null);
      
      console.log('Starting upload test...');
      console.log('File:', file);
      console.log('Title:', title);
      
      const response = await api.resumes.upload(file, title.trim(), false);
      console.log('Upload response:', response);
      
      setResult(response);
    } catch (err) {
      console.error('Upload test failed:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const testList = async () => {
    try {
      console.log('Testing resume list...');
      const response = await api.resumes.list();
      console.log('List response:', response);
      setResult(response);
    } catch (err) {
      console.error('List test failed:', err);
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Resume Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Test Resume"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">File:</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full px-3 py-2 border rounded"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Test Upload'}
          </button>
          
          <button
            onClick={testList}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test List
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div className="p-3 bg-green-100 border border-green-400 rounded">
            <strong>Success:</strong>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadTest;