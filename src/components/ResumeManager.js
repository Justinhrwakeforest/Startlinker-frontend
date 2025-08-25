import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await api.resumes.list();
      setResumes(response.resumes || []);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await api.resumes.upload(uploadFile, uploadTitle.trim(), makeDefault);
      setSuccess('Resume uploaded successfully!');
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadTitle('');
      setMakeDefault(false);
      fetchResumes();
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      await api.resumes.setDefault(resumeId);
      setSuccess('Default resume updated successfully!');
      fetchResumes();
    } catch (error) {
      console.error('Failed to set default resume:', error);
      setError('Failed to update default resume');
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      await api.resumes.delete(resumeId);
      setSuccess('Resume deleted successfully!');
      fetchResumes();
    } catch (error) {
      console.error('Failed to delete resume:', error);
      setError('Failed to delete resume');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="resume-manager">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">My Resumes</h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={resumes.length >= 5}
        >
          {showUploadForm ? 'Cancel' : 'Upload Resume'}
        </button>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Upload New Resume</h4>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Software Engineer Resume, Marketing Resume"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="makeDefault"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="makeDefault" className="ml-2 text-sm text-gray-700">
                Set as default resume
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadFile(null);
                  setUploadTitle('');
                  setMakeDefault(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Resume limit warning */}
      {resumes.length >= 5 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          You've reached the maximum of 5 resumes. Delete an existing resume to upload a new one.
        </div>
      )}

      {/* Resume list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No resumes uploaded yet.</p>
          <p className="text-sm">Upload your first resume to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className={`border rounded-lg p-4 ${
                resume.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{resume.title}</h4>
                    {resume.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>{resume.file_type}</span>
                    <span className="mx-2">•</span>
                    <span>{resume.file_size_display}</span>
                    <span className="mx-2">•</span>
                    <span>Uploaded {formatDate(resume.uploaded_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download button */}
                  <a
                    href={resume.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Download
                  </a>

                  {/* Set as default button */}
                  {!resume.is_default && (
                    <button
                      onClick={() => handleSetDefault(resume.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Set Default
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>You can upload up to 5 resumes. Set one as default for quick job applications.</p>
      </div>
    </div>
  );
};

export default ResumeManager;