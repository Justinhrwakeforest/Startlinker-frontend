import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AnalysisList = ({ analyses, onAnalysisClick }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No analyses yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload your first pitch deck to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <button
          key={analysis.id}
          onClick={() => onAnalysisClick(analysis.id)}
          className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {analysis.original_filename}
              </p>
              <div className="flex items-center mt-1 space-x-2">
                {getStatusIcon(analysis.status)}
                <span className="text-sm text-gray-600">
                  {getStatusText(analysis.status)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-2">
              {formatDate(analysis.created_at)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AnalysisList;