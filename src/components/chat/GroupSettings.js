// frontend/src/components/chat/GroupSettings.js
import React, { useState, useEffect, useContext } from 'react';
import { getAvatarUrl, getUserDisplayName } from '../../utils/avatarUtils';
import { 
    Settings, X, Users, Shield, UserPlus, UserMinus, Crown, 
    Edit3, Image, Link, Copy, Trash2, AlertCircle, Check,
    Lock, Unlock, Volume2, VolumeX, Calendar, Pin, Hash,
    Search, MoreVertical, Ban, UserX, MessageSquare
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const GroupSettings = ({ conversation, isOpen, onClose, onUpdate }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    
    // Group settings state
    const [groupName, setGroupName] = useState(conversation?.group_name || '');
    const [groupDescription, setGroupDescription] = useState(conversation?.group_description || '');
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [inviteLink, setInviteLink] = useState('');
    const [groupRules, setGroupRules] = useState('');
    
    // Member management state
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberActions, setShowMemberActions] = useState(false);
    
    // Moderator management
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const [isCurrentUserModerator, setIsCurrentUserModerator] = useState(false);

    useEffect(() => {
        if (isOpen && conversation) {
            loadGroupDetails();
            loadMembers();
        }
    }, [isOpen, conversation]);

    const loadGroupDetails = async () => {
        try {
            setLoading(true);
            // Load additional group details if needed
            const response = await api.get(`/messaging/conversations/${conversation.id}/`);
            const groupData = response.data;
            
            setGroupName(groupData.group_name || '');
            setGroupDescription(groupData.group_description || '');
            
            // Check current user permissions
            const currentUserParticipant = groupData.participant_settings?.find(
                p => p.user.id === currentUser.id
            );
            setIsCurrentUserAdmin(currentUserParticipant?.is_admin || false);
            setIsCurrentUserModerator(currentUserParticipant?.is_moderator || false);
            
        } catch (error) {
            console.error('Error loading group details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        try {
            // For now, use conversation participants
            // In a real implementation, you'd have a dedicated endpoint
            setMembers(conversation.participants || []);
        } catch (error) {
            console.error('Error loading members:', error);
        }
    };

    const updateGroupSettings = async () => {
        try {
            setLoading(true);
            const response = await api.patch(`/messaging/conversations/${conversation.id}/`, {
                group_name: groupName,
                group_description: groupDescription
            });
            
            onUpdate(response.data);
            alert('Group settings updated successfully!');
        } catch (error) {
            console.error('Error updating group settings:', error);
            alert('Failed to update group settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateInviteLink = async () => {
        try {
            // This would call a backend endpoint to generate an invite link
            const response = await api.post(`/messaging/conversations/${conversation.id}/generate-invite/`);
            setInviteLink(response.data.invite_link);
        } catch (error) {
            console.error('Error generating invite link:', error);
            alert('Failed to generate invite link. This feature will be available soon.');
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await api.get(`/auth/search/?q=${encodeURIComponent(query)}`);
            // Filter out users who are already members
            const existingMemberIds = members.map(m => m.id);
            const filteredResults = (response.data.results || response.data || [])
                .filter(user => !existingMemberIds.includes(user.id));
            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        }
    };

    const addMember = async (userId) => {
        try {
            setLoading(true);
            await api.post(`/messaging/conversations/${conversation.id}/add-member/`, {
                user_id: userId
            });
            loadMembers(); // Reload members
            setSearchResults([]);
            setSearchQuery('');
            alert('Member added successfully!');
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member. This feature will be available soon.');
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member from the group?')) {
            return;
        }

        try {
            setLoading(true);
            await api.post(`/messaging/conversations/${conversation.id}/remove-member/`, {
                user_id: userId
            });
            loadMembers(); // Reload members
            alert('Member removed successfully!');
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member. This feature will be available soon.');
        } finally {
            setLoading(false);
        }
    };

    const toggleModerator = async (userId, isModerator) => {
        try {
            setLoading(true);
            await api.post(`/messaging/conversations/${conversation.id}/toggle-moderator/`, {
                user_id: userId,
                is_moderator: !isModerator
            });
            loadMembers(); // Reload members
            alert(`Member ${!isModerator ? 'promoted to' : 'removed from'} moderator role!`);
        } catch (error) {
            console.error('Error toggling moderator:', error);
            alert('Failed to update moderator status. This feature will be available soon.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'members', name: 'Members', icon: Users },
        { id: 'moderation', name: 'Moderation', icon: Shield },
        { id: 'invite', name: 'Invite', icon: Link }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Group Settings</h3>
                            <p className="text-sm text-gray-600">{conversation?.group_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                    >
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex h-[calc(90vh-120px)]">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50 border-r overflow-y-auto">
                        <div className="p-4">
                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                activeTab === tab.id
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>{tab.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h4>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Group Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={groupName}
                                                    onChange={(e) => setGroupName(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                                    placeholder="Enter group name"
                                                    disabled={!isCurrentUserAdmin}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={groupDescription}
                                                    onChange={(e) => setGroupDescription(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                                                    rows={3}
                                                    placeholder="What's this group about?"
                                                    disabled={!isCurrentUserAdmin}
                                                />
                                            </div>

                                            {isCurrentUserAdmin && (
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={updateGroupSettings}
                                                        disabled={loading}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                                    >
                                                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                                        <span>Save Changes</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-gray-600">Created</div>
                                                <div className="font-medium">
                                                    {new Date(conversation?.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-gray-600">Members</div>
                                                <div className="font-medium">{members.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Members Management */}
                            {activeTab === 'members' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-semibold text-gray-900">Members ({members.length})</h4>
                                        {(isCurrentUserAdmin || isCurrentUserModerator) && (
                                            <button
                                                onClick={() => setActiveTab('invite')}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                <span>Add Members</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={getAvatarUrl(member, 40)}
                                                        alt={member.display_name || member.username}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {member.display_name || member.username}
                                                            {member.id === currentUser.id && (
                                                                <span className="ml-2 text-xs text-blue-600">(You)</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">@{member.username}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    {/* Role badges */}
                                                    {member.is_admin && (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center space-x-1">
                                                            <Crown className="h-3 w-3" />
                                                            <span>Admin</span>
                                                        </span>
                                                    )}
                                                    {member.is_moderator && !member.is_admin && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center space-x-1">
                                                            <Shield className="h-3 w-3" />
                                                            <span>Moderator</span>
                                                        </span>
                                                    )}
                                                    
                                                    {/* Actions (only for admins) */}
                                                    {isCurrentUserAdmin && member.id !== currentUser.id && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setShowMemberActions(!showMemberActions);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                            
                                                            {showMemberActions && selectedMember?.id === member.id && (
                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                toggleModerator(member.id, member.is_moderator);
                                                                                setShowMemberActions(false);
                                                                            }}
                                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                                                        >
                                                                            <Shield className="h-4 w-4" />
                                                                            <span>{member.is_moderator ? 'Remove Moderator' : 'Make Moderator'}</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                removeMember(member.id);
                                                                                setShowMemberActions(false);
                                                                            }}
                                                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                                                        >
                                                                            <UserMinus className="h-4 w-4" />
                                                                            <span>Remove from Group</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Moderation Tab */}
                            {activeTab === 'moderation' && (
                                <div className="space-y-6">
                                    <h4 className="text-lg font-semibold text-gray-900">Moderation Tools</h4>
                                    
                                    {(isCurrentUserAdmin || isCurrentUserModerator) ? (
                                        <div className="space-y-4">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                    <h5 className="font-medium text-yellow-800">Moderation Features</h5>
                                                </div>
                                                <p className="text-sm text-yellow-700">
                                                    Advanced moderation tools including message deletion, member muting, and ban management will be available soon.
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-gray-200 rounded-lg p-4">
                                                    <h5 className="font-medium text-gray-900 mb-2">Message Management</h5>
                                                    <p className="text-sm text-gray-600 mb-3">Delete inappropriate messages and pin important announcements.</p>
                                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed" disabled>
                                                        Coming Soon
                                                    </button>
                                                </div>
                                                
                                                <div className="border border-gray-200 rounded-lg p-4">
                                                    <h5 className="font-medium text-gray-900 mb-2">Member Actions</h5>
                                                    <p className="text-sm text-gray-600 mb-3">Mute, timeout, or ban members who violate group rules.</p>
                                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed" disabled>
                                                        Coming Soon
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h5 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h5>
                                            <p className="text-gray-600">Only group admins and moderators can access moderation tools.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invite Tab */}
                            {activeTab === 'invite' && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Invite New Members</h4>
                                        
                                        {/* User Search */}
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search users to invite..."
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(e.target.value);
                                                        searchUsers(e.target.value);
                                                    }}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                                />
                                            </div>

                                            {/* Search Results */}
                                            {searchResults.length > 0 && (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {searchResults.map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <img
                                                                    src={getAvatarUrl(user, 40)}
                                                                    alt={user.display_name || user.username}
                                                                    className="w-10 h-10 rounded-full"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {user.display_name || user.username}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">@{user.username}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => addMember(user.id)}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                                <span>Add</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Invite Link Section */}
                                    <div className="border-t pt-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Invite Link</h4>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Link className="h-5 w-5 text-blue-600" />
                                                <h5 className="font-medium text-blue-800">Share Invite Link</h5>
                                            </div>
                                            <p className="text-sm text-blue-700 mb-4">
                                                Generate a shareable link that allows people to join this group.
                                            </p>
                                            
                                            {inviteLink ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="text"
                                                            value={inviteLink}
                                                            readOnly
                                                            className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm"
                                                        />
                                                        <button
                                                            onClick={copyInviteLink}
                                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                            <span>Copy</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={generateInviteLink}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                                                >
                                                    <Link className="h-4 w-4" />
                                                    <span>Generate Invite Link</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupSettings;