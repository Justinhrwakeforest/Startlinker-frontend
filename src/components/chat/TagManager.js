import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, Trash2 } from 'lucide-react';
import api from '../../services/api';

const TagManager = ({ conversation, isOpen, onClose, onTagsUpdate }) => {
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && conversation) {
            loadTags();
        }
    }, [isOpen, conversation]);

    const loadTags = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/messaging/conversations/${conversation.id}/get_tags/`);
            setTags(response.data.tags || []);
        } catch (error) {
            console.error('Error loading tags:', error);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = async () => {
        if (!newTag.trim()) return;

        if (tags.includes(newTag.trim())) {
            alert('Tag already exists');
            return;
        }

        try {
            setSaving(true);
            const updatedTags = [...tags, newTag.trim()];
            
            await api.post(`/messaging/conversations/${conversation.id}/update_tags/`, {
                tags: updatedTags
            });

            setTags(updatedTags);
            setNewTag('');
            onTagsUpdate?.(updatedTags);
        } catch (error) {
            console.error('Error adding tag:', error);
            alert('Failed to add tag');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveTag = async (tagToRemove) => {
        try {
            setSaving(true);
            const updatedTags = tags.filter(tag => tag !== tagToRemove);
            
            await api.post(`/messaging/conversations/${conversation.id}/update_tags/`, {
                tags: updatedTags
            });

            setTags(updatedTags);
            onTagsUpdate?.(updatedTags);
        } catch (error) {
            console.error('Error removing tag:', error);
            alert('Failed to remove tag');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddTag();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-96 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Tag className="h-5 w-5 mr-2 text-blue-600" />
                            Manage Tags
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Add tags to categorize and organize your conversation
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* Add new tag */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add New Tag
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter tag name..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                                disabled={saving}
                            />
                            <button
                                onClick={handleAddTag}
                                disabled={!newTag.trim() || saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
                            >
                                <Plus className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Existing tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Current Tags ({tags.length})
                        </label>
                        
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading tags...</p>
                            </div>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-700 font-medium">No tags added yet</p>
                                <p className="text-sm text-gray-500 mt-1">Add your first tag above</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        <div className="flex items-center">
                                            <Tag className="h-4 w-4 text-blue-600 mr-2" />
                                            <span className="text-gray-900 font-medium text-sm">{tag}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            disabled={saving}
                                            className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors p-1"
                                            title="Remove tag"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagManager;