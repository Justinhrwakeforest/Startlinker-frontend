// frontend/src/components/chat/ChatSidebar.js
import React, { useState } from 'react';
import { Plus, User, Users, Clock, Search, X, Settings, UserPlus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarUrl, getUserDisplayName, getFirstNameInitials } from '../../utils/avatarUtils';
import api from '../../services/api';

const ChatSidebar = ({ 
    conversations, 
    currentConversation, 
    onConversationSelect, 
    onStartNewChat,
    loading,
    isMobile = false
}) => {
    
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [modalType, setModalType] = useState('chat'); // 'chat' or 'group'

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    const truncateMessage = (content, maxLength = 50) => {
        if (!content) return '';
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    };


    const ConversationItem = ({ conversation }) => {
        const isActive = currentConversation?.id === conversation.id;
        const hasUnread = conversation.unread_count > 0;

        return (
            <div
                onClick={() => onConversationSelect(conversation)}
                className={`
                    ${isMobile ? 'p-3' : 'px-4 py-3'} cursor-pointer hover:bg-gray-50 transition-colors border-l-4
                    ${isActive ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent hover:border-l-gray-200'}
                `}
            >
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                        {conversation.is_group ? (
                            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center`}>
                                <Users className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                            </div>
                        ) : (
                            <img
                                src={getAvatarUrl(conversation.other_participant, isMobile ? 40 : 48)}
                                alt={conversation.other_participant?.display_name || conversation.other_participant?.username || 'User'}
                                className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover ring-2 ring-gray-100`}
                                onError={(e) => {
                                    const user = conversation.other_participant;
                                    const name = user?.display_name || user?.first_name || user?.username || 'User';
                                    const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                                    
                                    const parent = e.target.parentNode;
                                    parent.innerHTML = `
                                        <div class="${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center ring-2 ring-gray-100">
                                            <span class="${isMobile ? 'text-sm' : 'text-base'} font-semibold text-white">${initials}</span>
                                        </div>
                                    `;
                                }}
                            />
                        )}
                        {/* Online indicator */}
                        {!conversation.is_group && conversation.other_participant?.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                    </div>

                    {/* Conversation info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`
                                text-sm font-medium truncate
                                ${hasUnread ? 'font-semibold text-gray-900' : 'text-gray-800'}
                            `}>
                                {conversation.display_name || 
                                 conversation.other_participant?.display_name ||
                                 conversation.other_participant?.username || 
                                 'Unknown User'}
                            </h3>
                            <div className="flex items-center space-x-2">
                                {conversation.last_message && (
                                    <span className="text-xs text-gray-500">
                                        {formatTime(conversation.last_message.sent_at)}
                                    </span>
                                )}
                                {hasUnread && (
                                    <div className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[18px] text-center">
                                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Last message preview */}
                        {conversation.last_message ? (
                            <p className={`
                                text-sm truncate
                                ${hasUnread ? 'font-medium text-gray-700' : 'text-gray-500'}
                            `}>
                                {conversation.last_message.sender?.username === 'You' ? 'You: ' : ''}
                                {truncateMessage(conversation.last_message.content, 40)}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400">No messages yet</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white border-b border-gray-100 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                <button
                    onClick={() => {
                        setModalType('chat');
                        setShowNewChatModal(true);
                    }}
                    className={`w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} rounded-lg transition-colors font-medium shadow-sm`}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>New Chat</span>
                </button>
                <button
                    onClick={() => {
                        setModalType('group');
                        setShowNewChatModal(true);
                    }}
                    className={`w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} rounded-lg transition-colors font-medium shadow-sm`}
                >
                    <Users className="h-4 w-4" />
                    <span>Create Group</span>
                </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">Start chatting with your network</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setModalType('chat');
                                    setShowNewChatModal(true);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span>Start New Chat</span>
                            </button>
                            <button
                                onClick={() => {
                                    setModalType('group');
                                    setShowNewChatModal(true);
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <Users className="h-4 w-4" />
                                <span>Create Group</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white">
                        {conversations.map(conversation => (
                            <ConversationItem 
                                key={conversation.id} 
                                conversation={conversation} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* New Chat/Group Modal */}
            {showNewChatModal && (
                <ChatModal
                    type={modalType}
                    onClose={() => {
                        setShowNewChatModal(false);
                        setModalType('chat');
                    }}
                    onStartChat={onStartNewChat}
                />
            )}
        </div>
    );
};

// Enhanced Chat Modal Component for both individual chats and groups
const ChatModal = ({ type, onClose, onStartChat }) => {
    
    const [currentStep, setCurrentStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupAvatar, setGroupAvatar] = useState(null);
    const searchTimeoutRef = React.useRef(null);

    // Load suggested users when modal opens
    React.useEffect(() => {
        // Clear any existing data
        setSuggestedUsers([]);
        setSuggestionsLoading(true);
        // Load fresh data
        loadSuggestedUsers();
    }, []);

    const loadSuggestedUsers = async () => {
        try {
            setSuggestionsLoading(true);
            
            // Try to load followers and following first
            let suggestedUsers = [];
            
            try {
                const [followersResponse, followingResponse] = await Promise.all([
                    api.get('/api/connect/follows/?type=followers').catch(() => ({ data: { results: [] } })),
                    api.get('/api/connect/follows/?type=following').catch(() => ({ data: { results: [] } }))
                ]);

                const followers = followersResponse.data.results || followersResponse.data || [];
                const following = followingResponse.data.results || followingResponse.data || [];
                
                // Extract user data from follow relationships
                const followerUsers = followers.map(follow => follow.follower || follow.user);
                const followingUsers = following.map(follow => follow.following || follow.user);
                
                // Combine and deduplicate users
                const connectedUsers = [...followerUsers, ...followingUsers].filter(user => user);
                suggestedUsers = connectedUsers.reduce((acc, user) => {
                    if (user && !acc.find(u => u.id === user.id)) {
                        acc.push({...user, from_connections: true});
                    }
                    return acc;
                }, []);
                
                console.log('Connected users found:', suggestedUsers.length);
            } catch (error) {
                console.log('No connections found, loading all users');
            }
            
            // If no connections found, load a sample of all users
            if (suggestedUsers.length === 0) {
                try {
                    console.log('Making API call to /api/auth/chat-users/');
                    const allUsersResponse = await api.get('/api/auth/chat-users/');
                    console.log('API response:', allUsersResponse.data);
                    const allUsers = allUsersResponse.data.results || [];
                    console.log('Parsed users:', allUsers);
                    suggestedUsers = allUsers.slice(0, 10).map(user => ({...user, from_connections: false})); // Show first 10 users
                    console.log('All users fallback loaded:', suggestedUsers.length, suggestedUsers);
                } catch (error) {
                    console.error('Error loading fallback users:', error);
                    console.error('Error details:', error.response?.data);
                    
                    // Final fallback - don't show any users if API fails
                    console.error('All user loading methods failed');
                    suggestedUsers = [];
                }
            }
            
            // Sort by display name
            suggestedUsers.sort((a, b) => {
                const nameA = a.display_name || a.username || '';
                const nameB = b.display_name || b.username || '';
                return nameA.localeCompare(nameB);
            });
            
            setSuggestedUsers(suggestedUsers.slice(0, 10)); // Show top 10 suggestions
        } catch (error) {
            console.error('Error loading suggested users:', error);
            setSuggestedUsers([]);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            // Try the user search endpoint first
            const response = await api.get(`/api/auth/search/?q=${encodeURIComponent(query)}`);
            const results = response.data.results || response.data || [];
            
            // Ensure we have user objects with proper structure
            const formattedResults = results.map(user => ({
                id: user.id,
                username: user.username,
                display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                avatar: user.avatar || user.profile_picture || user.avatar_url,
                profile_picture: user.profile_picture,
                avatar_url: user.avatar_url
            }));
            
            setSearchResults(formattedResults);
        } catch (error) {
            console.error('Error searching users:', error);
            // Fallback: clear results on error
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user) => {
        if (type === 'chat') {
            onStartChat(user.id);
            onClose();
        } else {
            // For groups, add to selected users
            if (!selectedUsers.some(u => u.id === user.id)) {
                setSelectedUsers([...selectedUsers, user]);
            }
        }
    };

    const removeSelectedUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    const handleCreateGroup = async () => {
        console.log('🟢 handleCreateGroup called in ChatModal');
        
        if (!groupName.trim() || selectedUsers.length === 0) {
            alert('Please provide a group name and select at least one member.');
            return;
        }

        // Direct API call instead of using prop function
        try {
            setLoading(true);
            const groupData = {
                group_name: groupName,
                group_description: groupDescription,
                participant_ids: selectedUsers.map(u => u.id),
                is_group: true
            };
            
            console.log('Creating group with data:', groupData);
            
            const response = await api.post('/api/messaging/conversations/', groupData);
            console.log('Group created successfully:', response.data);
            
            alert(`Group "${groupName}" created successfully!`);
            
            // Close modal and refresh
            onClose();
            
            // Force page reload to show new group
            window.location.reload();
            
        } catch (error) {
            console.error('Error creating group:', error);
            
            let errorMessage = 'Failed to create group. Please try again.';
            if (error.response?.data?.participant_ids) {
                errorMessage = error.response.data.participant_ids[0];
            } else if (error.response?.data?.group_name) {
                errorMessage = error.response.data.group_name[0];
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isGroupType = type === 'group';
    const title = isGroupType ? 'Create Group' : 'Start New Chat';
    const showSteps = isGroupType && currentStep > 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 animate-slideIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
                        {showSteps && (
                            <div className="flex items-center space-x-2 mt-2">
                                <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
                    {/* Step 1: User Search and Selection */}
                    {(!isGroupType || currentStep === 1) && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={isGroupType ? "Search users to add to group..." : "Search users..."}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (searchTimeoutRef.current) {
                                            clearTimeout(searchTimeoutRef.current);
                                        }
                                        searchTimeoutRef.current = setTimeout(() => {
                                            searchUsers(e.target.value);
                                        }, 300);
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                            </div>

                            {/* Selected Users (for groups) */}
                            {isGroupType && selectedUsers.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Members ({selectedUsers.length})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUsers.map(user => (
                                            <div key={user.id} className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-sm">
                                                <img
                                                    src={getAvatarUrl(user, 24)}
                                                    alt={user.display_name || user.username || 'User'}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                    onError={(e) => {
                                                        const name = user?.display_name || user?.first_name || user?.username || 'User';
                                                        const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                                                        const parent = e.target.parentNode;
                                                        e.target.outerHTML = `
                                                            <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                <span class="text-xs font-bold text-white">${initials}</span>
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {user.display_name || user.username}
                                                </span>
                                                <button
                                                    onClick={() => removeSelectedUser(user.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Users (when not searching) */}
                            {!searchQuery && !loading && suggestedUsers.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">
                                            {suggestedUsers.length > 0 && suggestedUsers[0]?.from_connections ? 'Suggested from your connections' : 'Recent users on platform'}
                                        </h4>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                            {suggestedUsers.length} users
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                                        {suggestedUsers.map(user => {
                                            const isSelected = selectedUsers.some(u => u.id === user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => !isSelected && handleUserSelect(user)}
                                                    className={`
                                                        flex items-center space-x-3 p-3 rounded-lg transition-colors border
                                                        ${isSelected 
                                                            ? 'bg-blue-50 border-blue-200 cursor-default' 
                                                            : 'hover:bg-gray-50 cursor-pointer border-gray-100 hover:border-gray-200'
                                                        }
                                                    `}
                                                >
                                                    <img
                                                        src={getAvatarUrl(user, 40)}
                                                        alt={user.display_name || user.username || 'User'}
                                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Suggestions Loading */}
                            {!searchQuery && suggestionsLoading && (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-500">Loading users from database...</p>
                                </div>
                            )}
                            
                            {/* Debug Info - shows when no users loaded */}
                            {!searchQuery && !suggestionsLoading && suggestedUsers.length === 0 && (
                                <div className="text-center py-4 bg-red-50 rounded-lg">
                                    <p className="text-sm text-red-600">No users loaded</p>
                                    <p className="text-xs text-red-500 mt-1">Check browser console for API errors</p>
                                </div>
                            )}

                            {/* Search Loading */}
                            {searchQuery && loading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-500">Searching users...</p>
                                </div>
                            )}

                            {/* Search Results */}
                            {searchQuery && searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">Search results</h4>
                                </div>
                            )}

                            {/* Search Results List */}
                            {searchQuery && (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {searchResults.map(user => {
                                    const isSelected = selectedUsers.some(u => u.id === user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => !isSelected && handleUserSelect(user)}
                                            className={`
                                                flex items-center space-x-3 p-3 rounded-lg transition-colors
                                                ${isSelected 
                                                    ? 'bg-blue-50 border border-blue-200' 
                                                    : 'hover:bg-gray-50 cursor-pointer border border-transparent'
                                                }
                                            `}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={getAvatarUrl(user, 40)}
                                                    alt={user.display_name || user.username || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200"
                                                    onError={(e) => {
                                                        // Fallback to colored div with initials
                                                        const name = user?.display_name || user?.first_name || user?.username || 'User';
                                                        const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                                                        
                                                        const parent = e.target.parentNode;
                                                        const onlineIndicator = parent.querySelector('.absolute.bottom-0');
                                                        parent.innerHTML = `
                                                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-1 ring-gray-200">
                                                                <span class="text-sm font-bold text-white">${initials}</span>
                                                            </div>
                                                            ${onlineIndicator ? onlineIndicator.outerHTML : ''}
                                                        `;
                                                    }}
                                                />
                                                {user.is_online && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {user.display_name || user.first_name + ' ' + user.last_name || user.username}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                                {user.headline && (
                                                    <p className="text-xs text-gray-400 truncate">{user.headline}</p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="text-blue-600">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            {user.is_verified && !isSelected && (
                                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                    })}
                                </div>
                            )}

                            {searchQuery && !loading && searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">
                                        <Search className="w-8 h-8 mx-auto" />
                                    </div>
                                    <p className="text-gray-500">No users found for "{searchQuery}"</p>
                                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Group Settings (only for groups) */}
                    {isGroupType && currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Users className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Details</h3>
                                <p className="text-gray-600">Give your group a name and description</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="Enter group name"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                                        maxLength={50}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description (optional)
                                    </label>
                                    <textarea
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        placeholder="What's this group about?"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
                                        maxLength={200}
                                    />
                                </div>

                                {/* Selected Members Summary */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Members ({selectedUsers.length + 1})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Current user */}
                                        <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-sm border border-green-200">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <Users className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">You (Admin)</span>
                                        </div>
                                        {selectedUsers.map(user => (
                                            <div key={user.id} className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-sm">
                                                <img
                                                    src={getAvatarUrl(user, 24)}
                                                    alt={user.display_name || user.username || 'User'}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                    onError={(e) => {
                                                        const name = user?.display_name || user?.first_name || user?.username || 'User';
                                                        const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                                                        e.target.outerHTML = `
                                                            <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                <span class="text-xs font-bold text-white">${initials}</span>
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {user.display_name || user.username}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-t bg-gray-50 flex justify-between">
                    <div>
                        {isGroupType && currentStep > 1 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancel
                        </button>
                        {isGroupType && currentStep === 1 && selectedUsers.length > 0 && (
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                Continue
                            </button>
                        )}
                        {isGroupType && currentStep === 2 && (
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                <span>Create Group</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;