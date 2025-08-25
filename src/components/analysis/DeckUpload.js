import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckSquare } from 'lucide-react';
import api from '../../services/api';

const DeckUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setError('');
    
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    
    // Validate file size (25MB)
    const maxSize = 25 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 25MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !consentChecked) return;
    
    setUploading(true);
    setError('');
    
    try {
      const response = await api.analysis.upload(file);
      onUploadSuccess(response.id);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload pitch deck');
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Upload Your Pitch Deck
      </h2>

      {/* Drag and Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        {file ? (
          <div className="space-y-4">
            <FileText className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleButtonClick}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Choose Different File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drag and drop your pitch deck here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or{' '}
                <button
                  onClick={handleButtonClick}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PDF files only, max 25MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Consent Checkbox */}
      {file && (
        <div className="mt-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I acknowledge that my deck will be processed by a third-party AI for analysis. 
              StartLinker does not store decks long-term and will delete the file after 7 days.
            </span>
          </label>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={!consentChecked || uploading}
          className={`mt-6 w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            consentChecked && !uploading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Uploading...
            </span>
          ) : (
            'Start Analysis'
          )}
        </button>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <CheckSquare className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Your Privacy Matters</p>
            <p className="text-sm text-blue-700 mt-1">
              We use industry-leading AI providers with zero-retention policies. 
              Your pitch deck is automatically deleted after 7 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckUpload;