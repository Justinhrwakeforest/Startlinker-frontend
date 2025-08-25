import React, { useState, useEffect, useContext } from 'react';
import { X, Users, Calendar, MessageCircle, User, Shield, Crown, Clock, Hash, Settings, UserPlus, UserMinus, MoreVertical, Edit, Trash2, Volume2, VolumeX, Pin, UnPin, Star, AlertTriangle, Ban, Mute, Shield as ShieldCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const ConversationInfo = ({ conversation, isOpen, onClose, displayMode = 'modal' }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [participants, setParticipants] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [showMemberActions, setShowMemberActions] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [isUserModerator, setIsUserModerator] = useState(false);

    useEffect(() => {
        if (isOpen && conversation) {
            loadConversationDetails();
        }
    }, [isOpen, conversation]);

    const loadConversationDetails = async () => {
        try {
            setLoading(true);
            // Load detailed conversation info including participants and stats
            const response = await api.get(`/messaging/conversations/${conversation.id}/`);
            const participantSettings = response.data.participant_settings || [];
            setParticipants(participantSettings);
            
            // Check current user's role
            const currentUserParticipant = participantSettings.find(p => p.user?.id === currentUser?.id);
            setIsUserAdmin(currentUserParticipant?.is_admin || false);
            setIsUserModerator(currentUserParticipant?.is_moderator || false);
            
            // Calculate stats
            const messageCount = response.data.messages?.length || 0;
            const lastActivity = response.data.updated_at;
            
            setStats({
                messageCount,
                lastActivity,
                participantCount: response.data.participants?.length || 0,
                adminCount: participantSettings.filter(p => p.is_admin).length,
                moderatorCount: participantSettings.filter(p => p.is_moderator).length
            });
        } catch (error) {
            console.error('Error loading conversation details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (participant) => {
        if (participant.is_admin) {
            return <Crown className="h-4 w-4 text-yellow-500" title="Admin" />;
        }
        if (participant.is_moderator) {
            return <Shield className="h-4 w-4 text-blue-500" title="Moderator" />;
        }
        return <User className="h-4 w-4 text-gray-400" title="Member" />;
    };

    const getRoleLabel = (participant) => {
        if (participant.is_admin) return 'Admin';
        if (participant.is_moderator) return 'Moderator';
        return 'Member';
    };

    const handlePromoteToModerator = async (participantId) => {
        try {
            await api.post(`/messaging/conversations/${conversation.id}/promote_moderator/`, {
                user_id: participantId
            });
            alert('User promoted to moderator');
            loadConversationDetails();
            setShowMemberActions(null);
        } catch (error) {
            console.error('Error promoting user:', error);
            alert('Failed to promote user');
        }
    };

    const handlePromoteToAdmin = async (participantId) => {
        try {
            await api.post(`/messaging/conversations/${conversation.id}/promote_admin/`, {
                user_id: participantId
            });
            alert('User promoted to admin');
            loadConversationDetails();
            setShowMemberActions(null);
        } catch (error) {
            console.error('Error promoting user:', error);
            alert('Failed to promote user');
        }
    };

    const handleDemoteUser = async (participantId) => {
        try {
            await api.post(`/messaging/conversations/${conversation.id}/demote/`, {
                user_id: participantId
            });
            alert('User role updated');
            loadConversationDetails();
            setShowMemberActions(null);
        } catch (error) {
            console.error('Error demoting user:', error);
            alert('Failed to update user role');
        }
    };

    const handleRemoveMember = async (participantId) => {
        if (window.confirm('Are you sure you want to remove this member from the group?')) {
            try {
                await api.post(`/messaging/conversations/${conversation.id}/remove_participant/`, {
                    user_id: participantId
                });
                alert('Member removed from group');
                loadConversationDetails();
                setShowMemberActions(null);
            } catch (error) {
                console.error('Error removing member:', error);
                alert('Failed to remove member');
            }
        }
    };

    const canManageMember = (participant) => {
        if (!conversation.is_group) return false;
        if (participant.user?.id === currentUser?.id) return false; // Can't manage yourself
        
        // Admin can manage everyone except other admins
        if (isUserAdmin) {
            return !participant.is_admin || participant.user?.id === currentUser?.id;
        }
        
        // Moderator can only manage regular members
        if (isUserModerator) {
            return !participant.is_admin && !participant.is_moderator;
        }
        
        return false;
    };

    if (!isOpen) return null;

    const containerClasses = displayMode === 'sidebar' 
        ? "fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-gray-200"
        : "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";

    const contentClasses = displayMode === 'sidebar'
        ? "h-full flex flex-col"
        : "bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col";

    return (
        <div className={containerClasses}>
            {displayMode === 'modal' && <div className="absolute inset-0" onClick={onClose}></div>}
            <div className={contentClasses} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            {conversation.is_group ? (
                                <Users className="h-5 w-5 mr-2 text-blue-600" />
                            ) : (
                                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                            )}
                            {conversation.is_group ? 'Group Info' : 'Chat Info'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Group Title */}
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                            {conversation.is_group ? (
                                <Users className="h-8 w-8 text-white" />
                            ) : (
                                <User className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <h4 className="font-semibold text-gray-900">
                            {conversation.display_name || conversation.group_name || 'Direct Chat'}
                        </h4>
                        {conversation.group_description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {conversation.group_description}
                            </p>
                        )}
                    </div>

                    {/* Tabs */}
                    {conversation.is_group && (
                        <div className="flex space-x-1 bg-white bg-opacity-50 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'info'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Info
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'members'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Members ({participants.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading conversation info...</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Info Tab */}
                            {(!conversation.is_group || activeTab === 'info') && (
                                <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {conversation.display_name || conversation.group_name || 'Direct Chat'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Type:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {conversation.is_group ? 'Group Chat' : 'Direct Message'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Created:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {format(new Date(conversation.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    {stats.lastActivity && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Last Activity:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {conversation.group_description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {conversation.group_description}
                                    </p>
                                </div>
                            )}

                                    {/* Enhanced Statistics */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                                <MessageCircle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                                <div className="text-lg font-semibold text-blue-900">
                                                    {stats.messageCount || 0}
                                                </div>
                                                <div className="text-xs text-blue-600">Messages</div>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                                <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                                <div className="text-lg font-semibold text-green-900">
                                                    {stats.participantCount || 0}
                                                </div>
                                                <div className="text-xs text-green-600">
                                                    {conversation.is_group ? 'Members' : 'Participants'}
                                                </div>
                                            </div>
                                            {conversation.is_group && (
                                                <>
                                                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                                                        <Crown className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                                                        <div className="text-lg font-semibold text-yellow-900">
                                                            {stats.adminCount || 0}
                                                        </div>
                                                        <div className="text-xs text-yellow-600">Admins</div>
                                                    </div>
                                                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                                                        <Shield className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                                                        <div className="text-lg font-semibold text-purple-900">
                                                            {stats.moderatorCount || 0}
                                                        </div>
                                                        <div className="text-xs text-purple-600">Moderators</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Technical Info */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Technical Info</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <Hash className="h-3 w-3" />
                                                <span>ID: {conversation.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Members Tab */}
                            {conversation.is_group && activeTab === 'members' && (
                                <div className="space-y-4">
                                    {/* Action Buttons */}
                                    {(isUserAdmin || isUserModerator) && (
                                        <div className="flex space-x-2">
                                            <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                                <UserPlus className="h-4 w-4" />
                                                <span>Add Members</span>
                                            </button>
                                            {isUserAdmin && (
                                                <button className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                                                    <Settings className="h-4 w-4" />
                                                    <span>Settings</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Members List */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">
                                            All Members ({participants.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {participants.map((participant, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                <span className="text-white font-semibold text-sm">
                                                                    {participant.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                                                </span>
                                                            </div>
                                                            {participant.user?.is_online && (
                                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {participant.user?.full_name || participant.user?.username}
                                                                </div>
                                                                {participant.user?.id === currentUser?.id && (
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                @{participant.user?.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center space-x-1">
                                                            {getRoleIcon(participant)}
                                                            <span className="text-xs text-gray-500">
                                                                {getRoleLabel(participant)}
                                                            </span>
                                                        </div>
                                                        {canManageMember(participant) && (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setShowMemberActions(
                                                                        showMemberActions === participant.user?.id ? null : participant.user?.id
                                                                    )}
                                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </button>
                                                                
                                                                {/* Member Actions Dropdown */}
                                                                {showMemberActions === participant.user?.id && (
                                                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                                        <div className="py-1">
                                                                            {!participant.is_moderator && !participant.is_admin && (
                                                                                <button
                                                                                    onClick={() => handlePromoteToModerator(participant.user?.id)}
                                                                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                                >
                                                                                    <Shield className="h-4 w-4 mr-2 text-blue-500" />
                                                                                    Promote to Moderator
                                                                                </button>
                                                                            )}
                                                                            {!participant.is_admin && isUserAdmin && (
                                                                                <button
                                                                                    onClick={() => handlePromoteToAdmin(participant.user?.id)}
                                                                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                                >
                                                                                    <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                                                                                    Promote to Admin
                                                                                </button>
                                                                            )}
                                                                            {(participant.is_moderator || participant.is_admin) && isUserAdmin && (
                                                                                <button
                                                                                    onClick={() => handleDemoteUser(participant.user?.id)}
                                                                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                                >
                                                                                    <User className="h-4 w-4 mr-2 text-gray-500" />
                                                                                    Demote to Member
                                                                                </button>
                                                                            )}
                                                                            <div className="border-t border-gray-100 my-1"></div>
                                                                            <button
                                                                                onClick={() => handleRemoveMember(participant.user?.id)}
                                                                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                            >
                                                                                <UserMinus className="h-4 w-4 mr-2" />
                                                                                Remove from Group
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
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                {displayMode === 'modal' && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationInfo;