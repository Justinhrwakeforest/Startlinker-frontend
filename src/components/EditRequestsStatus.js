// src/components/EditRequestsStatus.js - Component for showing edit request status
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import api from '../services/api';

const EditRequestsStatus = ({ startupId, onClose }) => {
  const [editRequests, setEditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startupId) {
      fetchEditRequests();
    }
  }, [startupId]);

  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/startups/${startupId}/edit_requests/`);
      setEditRequests(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching edit requests:', error);
      setError('Failed to load edit requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-amber-600 bg-amber-100 border-amber-200',
          label: 'Pending Review'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600 bg-green-100 border-green-200',
          label: 'Approved & Applied'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600 bg-red-100 border-red-200',
          label: 'Rejected'
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          label: status
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (editRequests.length === 0) {
    return null; // Don't show anything if no edit requests
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Edit Requests</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Track the status of your edit requests
        </p>
      </div>

      <div className="p-6 space-y-4">
        {editRequests.map((request) => {
          const statusConfig = getStatusConfig(request.status);
          
          return (
            <div
              key={request.id}
              className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                    {statusConfig.icon}
                    <span className="ml-1">{statusConfig.label}</span>
                  </span>
                  <span className="text-sm text-slate-500">
                    {request.time_ago}
                  </span>
                </div>
              </div>

              {/* Show changes */}
              {request.changes_display && request.changes_display.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    Requested Changes:
                  </h4>
                  <div className="bg-slate-50 rounded-md p-3">
                    {request.changes_display.slice(0, 3).map((change, index) => (
                      <div key={index} className="text-xs text-slate-600 mb-1 last:mb-0">
                        • {change}
                      </div>
                    ))}
                    {request.changes_display.length > 3 && (
                      <div className="text-xs text-slate-500 italic">
                        ... and {request.changes_display.length - 3} more changes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show rejection reason if rejected */}
              {request.status === 'rejected' && request.review_notes && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h5 className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</h5>
                  <p className="text-xs text-red-700">{request.review_notes}</p>
                </div>
              )}

              {/* Show review info if reviewed */}
              {request.reviewed_by_username && (
                <div className="mt-3 text-xs text-slate-500">
                  Reviewed by {request.reviewed_by_username}
                  {request.reviewed_at && (
                    <span> on {new Date(request.reviewed_at).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helpful tips */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
        <div className="text-xs text-slate-600">
          <p className="mb-1">
            <strong>💡 Tips:</strong>
          </p>
          <ul className="space-y-1 text-xs">
            <li>• Edit requests are typically reviewed within 24-48 hours</li>
            <li>• You can submit new edit requests even if you have pending ones</li>
            <li>• Contact support if you have questions about rejected requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditRequestsStatus;