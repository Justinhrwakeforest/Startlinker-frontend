import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, Check } from 'lucide-react';
import api from '../../services/api';

const AddParticipants = ({ conversation, isOpen, onClose, onParticipantsAdded }) => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/auth/chat-users/');
            
            // Filter out users who are already participants
            const currentParticipantIds = conversation.participants?.map(p => p.id) || [];
            const allUsers = response.data.results || response.data || [];
            const availableUsers = allUsers.filter(user => 
                !currentParticipantIds.includes(user.id)
            );
            
            setUsers(availableUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleUserToggle = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u.id === user.id);
            if (isSelected) {
                return prev.filter(u => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    };

    const handleAddParticipants = async () => {
        if (selectedUsers.length === 0) return;

        try {
            setAdding(true);
            const response = await api.post(`/api/messaging/conversations/${conversation.id}/add_participants/`, {
                participant_ids: selectedUsers.map(u => u.id)
            });

            alert(`Successfully added ${selectedUsers.length} participant(s) to the group!`);
            onParticipantsAdded?.();
            onClose();
        } catch (error) {
            console.error('Error adding participants:', error);
            alert('Failed to add participants. Please try again.');
        } finally {
            setAdding(false);
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
                            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                            Add Participants
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Add new members to {conversation.group_name || 'this group'}
                    </p>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Selected users summary */}
                {selectedUsers.length > 0 && (
                    <div className="p-4 bg-blue-50 border-b border-gray-200">
                        <div className="flex items-center text-sm text-blue-700">
                            <Users className="h-4 w-4 mr-2" />
                            {selectedUsers.length} user(s) selected
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedUsers.map(user => (
                                <span
                                    key={user.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                    {user.username}
                                    <button
                                        onClick={() => handleUserToggle(user)}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* User list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">
                                {searchQuery ? 'No users found' : 'No available users to add'}
                            </p>
                            {searchQuery && (
                                <p className="text-sm text-gray-400 mt-1">
                                    Try a different search term
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredUsers.map(user => {
                                const isSelected = selectedUsers.some(u => u.id === user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserToggle(user)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            isSelected ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {user.full_name || user.username}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddParticipants}
                            disabled={selectedUsers.length === 0 || adding}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm font-medium"
                        >
                            {adding ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            ) : (
                                <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddParticipants;