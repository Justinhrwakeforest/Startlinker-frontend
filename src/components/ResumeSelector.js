import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Upload, Star, Clock } from 'lucide-react';

const ResumeSelector = ({ 
  selectedResumeId, 
  onResumeSelect, 
  allowUpload = false,
  onNewResumeUpload = null 
}) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      console.log('[RESUME] Fetching resumes...');
      const response = await api.resumes.list();
      console.log('[RESUME] Resume list response:', response);
      const resumeList = response.resumes || [];
      setResumes(resumeList);
      console.log('[RESUME] Set resumes:', resumeList);
      
      // Auto-select default resume if none selected
      if (!selectedResumeId && resumeList.length > 0) {
        const defaultResume = resumeList.find(r => r.is_default) || resumeList[0];
        console.log('[RESUME] Auto-selecting resume:', defaultResume.id);
        onResumeSelect(defaultResume.id);
      }
    } catch (error) {
      console.error('[RESUME] Failed to fetch resumes:', error);
      console.error('Error response:', error.response?.data);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RESUME] Resume upload started...');
    console.log('File:', uploadFile);
    console.log('Title:', uploadTitle.trim());
    
    if (!uploadFile || !uploadTitle.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setError('');
      console.log('[RESUME] Calling api.resumes.upload...');
      const response = await api.resumes.upload(uploadFile, uploadTitle.trim(), false);
      console.log('[RESUME] Upload response:', response);
      
      // Add new resume to list and select it
      const newResume = response.resume;
      setResumes(prev => [newResume, ...prev]);
      onResumeSelect(newResume.id);
      
      // Reset upload form
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadTitle('');
      
      if (onNewResumeUpload) {
        onNewResumeUpload(newResume);
      }
    } catch (error) {
      console.error('[RESUME] Upload failed:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading resumes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select Resume <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        {allowUpload && resumes.length < 5 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUploadForm(!showUploadForm);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload New
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Upload form */}
      {showUploadForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Upload New Resume</h4>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Resume title (e.g., Software Engineer Resume)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                required
              />
            </div>
            
            <div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, TXT (max 10MB)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUploadForm(false);
                  setUploadFile(null);
                  setUploadTitle('');
                }}
                className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resume list */}
      {resumes.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No resumes available.</p>
          {allowUpload && (
            <p className="text-xs mt-1">Upload your first resume to get started!</p>
          )}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 You can still submit your application without a resume. Upload one later from your profile.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedResumeId === resume.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onResumeSelect(resume.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FileText className={`w-5 h-5 ${
                    selectedResumeId === resume.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium text-sm truncate ${
                      selectedResumeId === resume.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {resume.title}
                    </h4>
                    {resume.is_default && (
                      <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{resume.file_type}</span>
                    <span>•</span>
                    <span>{resume.file_size_display}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(resume.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                {selectedResumeId === resume.id && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {resumes.length > 0 && (
        <div className="text-xs text-gray-500">
          {resumes.length}/5 resumes used
          {resumes.find(r => r.is_default) && (
            <span className="ml-2">• <Star className="w-3 h-3 inline text-yellow-500" /> indicates default resume</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeSelector;