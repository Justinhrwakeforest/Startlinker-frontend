// frontend/src/components/Messages.js
import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Search, ArrowLeft, X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import ChatSidebar from './chat/ChatSidebar';
import ChatWindow from './chat/ChatWindow';
import api from '../services/api';
import '../styles/chat-enhancements.css';

// Add enhanced styles
const styles = `
.notification-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: .8;
        transform: scale(1.05);
    }
}

.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.smooth-scroll {
    scroll-behavior: smooth;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

const Messages = () => {
    const navigate = useNavigate();
    const { conversationId } = useParams();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [messageSearchResults, setMessageSearchResults] = useState([]);
    const [isMessageSearching, setIsMessageSearching] = useState(false);
    const [showMessageSearch, setShowMessageSearch] = useState(false);

    // Handle responsive design
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
        loadUnreadCount();
    }, []);

    // Listen for unread count changes
    useEffect(() => {
        const handleUnreadCountChange = () => {
            loadUnreadCount();
            loadConversations();
        };

        window.addEventListener('unreadCountChanged', handleUnreadCountChange);
        
        return () => {
            window.removeEventListener('unreadCountChanged', handleUnreadCountChange);
        };
    }, []);

    // Load specific conversation if provided in URL
    useEffect(() => {
        if (conversationId && conversations.length > 0) {
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                handleConversationSelect(conversation);
            }
        }
    }, [conversationId, conversations]);

    // Handle URL parameters for starting new chat
    useEffect(() => {
        const userId = searchParams.get('user');
        const username = searchParams.get('username');
        
        if (userId && conversations.length > 0) {
            // Check if conversation already exists
            const existingConversation = conversations.find(conv => 
                conv.other_participant && conv.other_participant.id === parseInt(userId)
            );
            
            if (existingConversation) {
                // Select existing conversation
                handleConversationSelect(existingConversation);
            } else {
                // Start new conversation
                handleStartNewChat(parseInt(userId));
            }
            
            // Clean up URL parameters
            navigate('/messages', { replace: true });
        }
    }, [searchParams, conversations, navigate]);

    const loadConversations = async () => {
        try {
            setSidebarLoading(true);
            const response = await api.get('/api/messaging/conversations/');
            
            // Handle paginated response from DRF
            let conversationsData = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    conversationsData = response.data;
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    conversationsData = response.data.results;
                } else {
                    console.warn('Unexpected API response format:', response.data);
                    conversationsData = [];
                }
            }
            
            setConversations(conversationsData);
        } catch (error) {
            console.error('Error loading conversations:', error);
            setConversations([]);
        } finally {
            setSidebarLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await api.get('/api/messaging/unread-count/');
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const handleConversationSelect = async (conversation) => {
        if (conversation.id === currentConversation?.id) return;
        
        try {
            setLoading(true);
            const response = await api.get(`/api/messaging/conversations/${conversation.id}/`);
            setCurrentConversation(response.data);
            
            // Update URL without causing a page reload
            navigate(`/messages/${conversation.id}`, { replace: true });
            
            // Always mark messages as read when viewing a conversation
            await api.post('/api/messaging/mark-read/', {
                conversation_id: conversation.id
            });
            
            // Update conversation in list to show 0 unread count
            setConversations(prev => {
                if (!Array.isArray(prev)) {
                    console.warn('Conversations is not an array in handleConversationSelect:', prev);
                    return [];
                }
                return prev.map(c => 
                    c.id === conversation.id 
                        ? { ...c, unread_count: 0 }
                        : c
                );
            });
            loadUnreadCount();
            
            // Trigger navbar unread count refresh
            window.dispatchEvent(new CustomEvent('unreadCountChanged'));
        } catch (error) {
            console.error('Error loading conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        // Update current conversation if it matches
        if (currentConversation && message.conversation === currentConversation.id) {
            setCurrentConversation(prev => ({
                ...prev,
                messages: [...(prev.messages || []), message],
                last_message: message
            }));
        }

        // Update conversation in sidebar
        setConversations(prev => {
            if (!Array.isArray(prev)) {
                console.warn('Conversations is not an array in handleNewMessage:', prev);
                return [];
            }
            return prev.map(conv => {
                if (conv.id === message.conversation) {
                    return {
                        ...conv,
                        last_message: message,
                        updated_at: message.sent_at,
                        unread_count: message.conversation === currentConversation?.id ? 0 : conv.unread_count + 1
                    };
                }
                return conv;
            });
        });

        // Update total unread count
        if (message.conversation !== currentConversation?.id) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const handleSendMessage = async (content, replyTo = null, attachments = []) => {
        if (!currentConversation || (!content.trim() && attachments.length === 0)) return;

        try {
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('conversation', currentConversation.id);
            formData.append('content', content.trim());
            if (replyTo) {
                formData.append('reply_to', replyTo);
            }

            // Add file attachments
            attachments.forEach((file, index) => {
                formData.append(`attachments`, file);
            });

            const response = await api.post('/api/messaging/messages/', formData);

            // Update current conversation
            setCurrentConversation(prev => ({
                ...prev,
                messages: [...(prev.messages || []), response.data],
                last_message: response.data
            }));

            // Update conversation in sidebar
            setConversations(prev => {
                if (!Array.isArray(prev)) {
                    console.warn('Conversations is not an array in handleSendMessage:', prev);
                    return [];
                }
                return prev.map(conv => 
                    conv.id === currentConversation.id 
                        ? { ...conv, last_message: response.data, updated_at: response.data.sent_at }
                        : conv
                );
            });

        } catch (error) {
            console.error('Error sending message:', error);
            console.error('Server response:', error.response?.data);
            console.error('Status code:', error.response?.status);
            throw error;
        }
    };

    const handleStartNewChat = async (userId) => {
        try {
            console.log('Creating new conversation with user ID:', userId);
            const response = await api.post('/api/messaging/conversations/', {
                participant_ids: [userId],
                is_group: false
            });
            console.log('Conversation created successfully:', response.data);

            // Add to conversations list if new
            const conversationsArray = Array.isArray(conversations) ? conversations : [];
            const existingConv = conversationsArray.find(c => c.id === response.data.id);
            if (!existingConv) {
                console.log('Adding new conversation to list');
                setConversations(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return [response.data, ...prevArray];
                });
            } else {
                console.log('Conversation already exists in list');
            }

            // Select the conversation
            console.log('Selecting conversation:', response.data.id);
            setCurrentConversation(response.data);
            navigate(`/messages/${response.data.id}`, { replace: true });
        } catch (error) {
            console.error('Error starting new chat:', error);
            console.error('Error details:', error.response?.data);
            alert('Failed to start chat. Please try again.');
        }
    };

    const handleBackToList = () => {
        setCurrentConversation(null);
        navigate('/messages', { replace: true });
    };

    const handleMessageSearch = async (query) => {
        setMessageSearchQuery(query);
        
        if (!query.trim()) {
            setMessageSearchResults([]);
            return;
        }

        try {
            setIsMessageSearching(true);
            const response = await api.get('/api/messaging/messages/search/', {
                params: { 
                    q: query,
                    conversation: currentConversation?.id || undefined
                }
            });
            
            setMessageSearchResults(response.data.results || []);
        } catch (error) {
            console.error('Error searching messages:', error);
            setMessageSearchResults([]);
        } finally {
            setIsMessageSearching(false);
        }
    };

    const handleMessageSearchResultClick = (message) => {
        // If the message is in a different conversation, switch to it
        if (message.conversation !== currentConversation?.id) {
            const conversation = conversations.find(c => c.id === message.conversation);
            if (conversation) {
                handleConversationSelect(conversation);
            }
        }
        
        // Close search
        setShowMessageSearch(false);
        setMessageSearchQuery('');
        setMessageSearchResults([]);
        
        // TODO: Scroll to the specific message in the conversation
    };

    const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter(conv => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            conv.display_name?.toLowerCase().includes(query) ||
            conv.other_participant?.username?.toLowerCase().includes(query) ||
            conv.last_message?.content?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Modern Header */}
            <div className="bg-white border-b border-gray-100 flex-shrink-0">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {isMobile && currentConversation && (
                                <button
                                    onClick={handleBackToList}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                            )}
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                                    <p className="text-sm text-gray-500">Stay connected with your network</p>
                                </div>
                                {unreadCount > 0 && (
                                    <div className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {!isMobile && (
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowMessageSearch(!showMessageSearch)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Search messages"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Message Search Modal */}
            {showMessageSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Search Messages</h3>
                                    <p className="text-sm text-gray-600">Find messages across all conversations</p>
                                </div>
                                <button
                                    onClick={() => setShowMessageSearch(false)}
                                    className="text-gray-400 hover:text-gray-600 rounded-lg p-2 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-4 relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={messageSearchQuery}
                                    onChange={(e) => handleMessageSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {isMessageSearching ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                                    <p className="text-sm text-gray-500">Searching messages...</p>
                                </div>
                            ) : messageSearchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {messageSearchResults.map((message) => (
                                        <button
                                            key={message.id}
                                            onClick={() => handleMessageSearchResultClick(message)}
                                            className="w-full text-left p-4 hover:bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <img
                                                    src={getAvatarUrl(message.sender, 32)}
                                                    alt={message.sender?.username}
                                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {message.sender?.username || 'Unknown User'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(message.sent_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : messageSearchQuery.trim() ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-600 mb-1">No messages found</p>
                                    <p className="text-sm text-gray-500">for "{messageSearchQuery}"</p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <p className="text-gray-600 mb-1">Search Messages</p>
                                    <p className="text-sm text-gray-500">Start typing to find messages</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className={`
                    w-full md:w-80 bg-gray-50 border-r border-gray-200 flex-shrink-0
                    ${isMobile && currentConversation ? 'hidden' : 'block'}
                `}>
                    <ChatSidebar
                        conversations={filteredConversations}
                        currentConversation={currentConversation}
                        onConversationSelect={handleConversationSelect}
                        onStartNewChat={handleStartNewChat}
                        loading={sidebarLoading}
                        isMobile={isMobile}
                    />
                </div>

                {/* Chat Area */}
                <div className={`
                    flex-1 bg-white
                    ${isMobile && !currentConversation ? 'hidden' : 'block'}
                `}>
                    {currentConversation ? (
                        <ChatWindow
                            conversation={currentConversation}
                            onSendMessage={handleSendMessage}
                            onNewMessage={handleNewMessage}
                            loading={loading}
                            isMobile={isMobile}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                            <div className="text-center max-w-md mx-auto px-6">
                                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-10 w-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Welcome to Messages</h3>
                                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                                    Select a conversation from the sidebar to start messaging, or create a new chat to connect with someone in your network.
                                </p>
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-medium text-gray-900 mb-4 text-left">Quick Tips:</h4>
                                    <ul className="text-sm text-gray-600 space-y-3 text-left">
                                        <li className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Use the search bar to find conversations quickly</span>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Create groups to chat with multiple people</span>
                                        </li>
                                        <li className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <span>Online indicators show who's available</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;