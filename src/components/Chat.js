// frontend/src/components/Chat.js
import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Users, Search } from 'lucide-react';
import ChatSidebar from './chat/ChatSidebar';
import ChatWindow from './chat/ChatWindow';
import api from '../services/api';
import './chat/ChatAnimations.css';

const Chat = ({ isOpen, onClose, initialConversationId = null }) => {
    // State variables
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = useState(true);
    

    // Handle screen size changes
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setShowSidebar(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load conversations on mount
    useEffect(() => {
        if (isOpen) {
            loadConversations();
        } else {
            // Reset when chat is closed
            setUnreadCount(0);
            setConversations([]);
            setCurrentConversation(null);
            setShowSidebar(true);
        }
    }, [isOpen]);

    // Update unread count when conversations change
    useEffect(() => {
        loadUnreadCount();
    }, [conversations]);

    // Load initial conversation if provided
    useEffect(() => {
        if (initialConversationId && conversations.length > 0) {
            const conversation = conversations.find(c => c.id === initialConversationId);
            if (conversation) {
                setCurrentConversation(conversation);
            }
        }
    }, [initialConversationId, conversations]);

    const loadConversations = async () => {
        try {
            setSidebarLoading(true);
            const response = await api.messaging.getConversations();
            
            // Handle paginated response from DRF
            let conversationsData = [];
            if (response) {
                if (Array.isArray(response)) {
                    // Direct array response
                    conversationsData = response;
                } else if (response.results && Array.isArray(response.results)) {
                    // Paginated response
                    conversationsData = response.results;
                } else {
                    console.warn('Unexpected API response format:', response);
                    conversationsData = [];
                }
            }
            
            console.log('Loaded conversations:', conversationsData);
            setConversations(conversationsData);
            
            // If no conversations, reset unread count
            if (conversationsData.length === 0) {
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            
            // Show user-friendly error message
            if (error.response?.status === 401) {
                alert('Please log in to view your conversations.');
            } else if (error.response?.status >= 500) {
                alert('Server error. Please try again later.');
            } else {
                alert('Failed to load conversations. Please check your connection.');
            }
            
            setConversations([]); // Set empty array on error
            setUnreadCount(0); // Reset unread count on error
        } finally {
            setSidebarLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            // Calculate unread count from conversations
            if (Array.isArray(conversations)) {
                const totalUnread = conversations.reduce((sum, conv) => {
                    const convUnread = conv.unread_count || 0;
                    console.log(`Conversation ${conv.id}: ${convUnread} unread messages`);
                    return sum + convUnread;
                }, 0);
                console.log(`Total unread count: ${totalUnread}`);
                setUnreadCount(totalUnread);
            } else {
                console.log('No conversations array, setting unread count to 0');
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error calculating unread count:', error);
            setUnreadCount(0);
        }
    };

    const handleConversationSelect = async (conversation) => {
        if (conversation.id === currentConversation?.id) return;
        
        console.log('Selecting conversation:', conversation);
        
        try {
            setLoading(true);
            const conversationData = await api.messaging.getConversation(conversation.id);
            
            console.log('Loaded conversation data:', conversationData);
            setCurrentConversation(conversationData);
            
            // Mark messages as read
            if (conversationData.unread_count > 0) {
                await api.messaging.markAsRead({
                    conversation_id: conversation.id
                });
                
                // Refresh conversations to get updated unread counts
                await loadConversations();
                
                // Trigger navbar unread count refresh
                window.dispatchEvent(new CustomEvent('unreadCountChanged'));
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            
            // Show user-friendly error message
            if (error.response?.status === 404) {
                alert('Conversation not found. It may have been deleted.');
            } else if (error.response?.status === 403) {
                alert('You do not have permission to view this conversation.');
            } else {
                alert('Failed to open conversation. Please try again.');
            }
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

        // Refresh conversations to get accurate unread counts from backend
        loadConversations();
        
        // Trigger navbar unread count refresh
        window.dispatchEvent(new CustomEvent('unreadCountChanged'));
    };

    const handleSendMessage = async (content, replyTo = null, files = []) => {
        if (!currentConversation || (!content.trim() && files.length === 0)) return;

        try {
            const messageData = {
                conversation: currentConversation.id,
                content: content.trim(),
                reply_to: replyTo
            };

            // If files are included, use FormData
            if (files.length > 0) {
                const formData = new FormData();
                formData.append('conversation', currentConversation.id);
                formData.append('content', content.trim());
                if (replyTo) {
                    formData.append('reply_to', replyTo);
                }
                
                files.forEach((file, index) => {
                    formData.append('attachments', file);
                });

                const response = await api.post('/api/messaging/messages/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

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
            } else {
                // Regular text message
                const response = await api.messaging.sendMessage(messageData);

                // Update current conversation
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: [...(prev.messages || []), response],
                    last_message: response
                }));

                // Update conversation in sidebar
                setConversations(prev => {
                    if (!Array.isArray(prev)) {
                        console.warn('Conversations is not an array in handleSendMessage:', prev);
                        return [];
                    }
                    return prev.map(conv => 
                        conv.id === currentConversation.id 
                            ? { ...conv, last_message: response, updated_at: response.sent_at }
                            : conv
                    );
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show user-friendly error message
            if (error.response?.status === 403) {
                alert('You do not have permission to send messages in this conversation.');
            } else if (error.response?.status === 404) {
                alert('Conversation not found. It may have been deleted.');
            } else {
                alert('Failed to send message. Please try again.');
            }
            
            throw error;
        }
    };

    const handleStartNewChat = async (userId) => {
        try {
            const conversationData = await api.messaging.createConversation({
                participant_ids: [userId],
                is_group: false
            });

            console.log('Created new conversation:', conversationData);

            // Add to conversations list if new
            const conversationsArray = Array.isArray(conversations) ? conversations : [];
            const existingConv = conversationsArray.find(c => c.id === conversationData.id);
            if (!existingConv) {
                setConversations(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return [conversationData, ...prevArray];
                });
            }

            // Select the conversation
            setCurrentConversation(conversationData);
        } catch (error) {
            console.error('Error starting new chat:', error);
            
            // Show user-friendly error message
            if (error.response?.status === 400) {
                alert('Unable to start chat. Please try again.');
            } else if (error.response?.status === 404) {
                alert('User not found.');
            } else {
                alert('Failed to create conversation. Please try again.');
            }
        }
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm modal-backdrop">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isMobile ? 'h-full' : 'max-w-7xl h-[90vh]'} flex overflow-hidden transform transition-all duration-300 scale-100 modal-enter`}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {isMobile && currentConversation && (
                            <button
                                onClick={() => {
                                    setShowSidebar(true);
                                    setCurrentConversation(null);
                                }}
                                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 sm:hidden"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold">{isMobile && currentConversation ? currentConversation.display_name || 'Chat' : 'Messages'}</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {(!isMobile || !currentConversation) && (
                            <div className="relative hidden sm:block">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-sm text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-opacity-30 transition-all duration-200"
                                />
                            </div>
                        )}
                        <button
                            onClick={() => {
                                // Reset state when closing
                                setUnreadCount(0);
                                setConversations([]);
                                setCurrentConversation(null);
                                setShowSidebar(true);
                                onClose();
                            }}
                            className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className={`flex w-full ${isMobile ? 'mt-14' : 'mt-20'}`}>
                    {/* Sidebar */}
                    <div className={`${
                        isMobile 
                            ? (showSidebar && !currentConversation ? 'w-full' : 'hidden')
                            : 'w-1/3'
                    } border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white`}>
                        <ChatSidebar
                            conversations={filteredConversations}
                            currentConversation={currentConversation}
                            onConversationSelect={(conversation) => {
                                handleConversationSelect(conversation);
                                if (isMobile) {
                                    setShowSidebar(false);
                                }
                            }}
                            onStartNewChat={(userId) => {
                                handleStartNewChat(userId);
                                if (isMobile) {
                                    setShowSidebar(false);
                                }
                            }}
                            loading={sidebarLoading}
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Chat Window */}
                    <div className={`${
                        isMobile 
                            ? (currentConversation && !showSidebar ? 'w-full' : 'hidden')
                            : 'flex-1'
                    } bg-gradient-to-br from-white to-gray-50`}>
                        <ChatWindow
                            conversation={currentConversation}
                            onSendMessage={handleSendMessage}
                            onNewMessage={handleNewMessage}
                            loading={loading}
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;