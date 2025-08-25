// Modern Chat UI Component with Enhanced UX
import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, X, Search, Plus, Filter, Settings,
    Send, Paperclip, Smile, Mic, Phone, Video, MoreVertical,
    Bell, BellOff, Archive, Trash2, Pin, Star
} from 'lucide-react';
import EnhancedChatWindow from './EnhancedChatWindow';
import '../../styles/chat-ui-enhanced.css';

const ModernChatUI = ({ isOpen, onClose }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, archived
    const [loading, setLoading] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        if (isOpen) {
            loadMockConversations();
        }
    }, [isOpen]);

    const loadMockConversations = () => {
        const mockData = [
            {
                id: 1,
                display_name: 'John Doe',
                avatar: null,
                last_message: 'Hey, how about that startup idea we discussed?',
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                unread_count: 2,
                isOnline: true,
                isPinned: true,
                messages: [
                    {
                        id: 1,
                        sender: 'other',
                        senderName: 'John Doe',
                        content: 'Hi there! I wanted to discuss the new project proposal.',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30),
                        read: true,
                        delivered: true
                    },
                    {
                        id: 2,
                        sender: 'me',
                        senderName: 'You',
                        content: 'Sure! I\'ve reviewed the documents you sent. The idea looks promising.',
                        timestamp: new Date(Date.now() - 1000 * 60 * 25),
                        read: true,
                        delivered: true
                    },
                    {
                        id: 3,
                        sender: 'other',
                        senderName: 'John Doe',
                        content: 'Great! When can we schedule a meeting to discuss the implementation details?',
                        timestamp: new Date(Date.now() - 1000 * 60 * 20),
                        read: true,
                        delivered: true
                    },
                    {
                        id: 4,
                        sender: 'me',
                        senderName: 'You',
                        content: 'I\'m available tomorrow afternoon or Friday morning. What works best for you?',
                        timestamp: new Date(Date.now() - 1000 * 60 * 15),
                        read: true,
                        delivered: true
                    },
                    {
                        id: 5,
                        sender: 'other',
                        senderName: 'John Doe',
                        content: 'Hey, how about that startup idea we discussed?',
                        timestamp: new Date(Date.now() - 1000 * 60 * 5),
                        read: false,
                        delivered: true
                    }
                ]
            },
            {
                id: 2,
                display_name: 'Sarah Wilson',
                avatar: null,
                last_message: 'The presentation went really well!',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                unread_count: 0,
                isOnline: true,
                messages: [
                    {
                        id: 1,
                        sender: 'other',
                        senderName: 'Sarah Wilson',
                        content: 'The presentation went really well!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        read: true,
                        delivered: true
                    }
                ]
            },
            {
                id: 3,
                display_name: 'Tech Innovators Group',
                avatar: null,
                last_message: 'Alex: Anyone interested in the hackathon?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                unread_count: 5,
                isOnline: false,
                isGroup: true,
                messages: []
            },
            {
                id: 4,
                display_name: 'Emily Chen',
                avatar: null,
                last_message: 'Thanks for the feedback on my pitch!',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
                unread_count: 0,
                isOnline: false,
                lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 3),
                messages: []
            },
            {
                id: 5,
                display_name: 'Michael Brown',
                avatar: null,
                last_message: 'Can you review the investment proposal?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
                unread_count: 1,
                isOnline: false,
                lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24),
                messages: []
            }
        ];

        setConversations(mockData);
    };

    const handleSendMessage = async (message, replyToId) => {
        if (!selectedConversation) return;

        const newMessage = {
            id: Date.now(),
            sender: 'me',
            senderName: 'You',
            content: message,
            timestamp: new Date(),
            read: false,
            delivered: true
        };

        setSelectedConversation(prev => ({
            ...prev,
            messages: [...(prev.messages || []), newMessage]
        }));

        // Update conversation in list
        setConversations(prev => prev.map(conv => 
            conv.id === selectedConversation.id
                ? { ...conv, last_message: message, timestamp: new Date() }
                : conv
        ));
    };

    const filteredConversations = conversations.filter(conv => {
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!conv.display_name.toLowerCase().includes(query) &&
                !conv.last_message?.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Apply status filter
        if (filter === 'unread' && conv.unread_count === 0) return false;
        if (filter === 'archived' && !conv.isArchived) return false;

        return true;
    });

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const hours = diff / (1000 * 60 * 60);
        
        if (hours < 1) {
            const mins = Math.floor(diff / (1000 * 60));
            return `${mins}m`;
        } else if (hours < 24) {
            return `${Math.floor(hours)}h`;
        } else if (hours < 168) {
            return `${Math.floor(hours / 24)}d`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="enhanced-chat-container">
            <div className="enhanced-chat-modal">
                {/* Header */}
                <div className="enhanced-chat-header">
                    <div className="chat-header-left">
                        <div className="chat-header-icon">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="chat-header-title">Messages</h2>
                            <p className="chat-header-subtitle">
                                {conversations.reduce((acc, conv) => acc + conv.unread_count, 0)} unread messages
                            </p>
                        </div>
                    </div>
                    
                    <div className="chat-header-actions">
                        <button className="chat-header-btn" title="Settings">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button className="chat-header-btn" onClick={onClose} title="Close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="enhanced-chat-body">
                    {/* Sidebar */}
                    <div className={`chat-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                        {/* Search */}
                        <div className="chat-search">
                            <div className="relative">
                                <Search className="chat-search-icon w-5 h-5" />
                                <input
                                    type="text"
                                    className="chat-search-input"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="chat-filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                                onClick={() => setFilter('unread')}
                            >
                                Unread
                            </button>
                            <button
                                className={`filter-tab ${filter === 'archived' ? 'active' : ''}`}
                                onClick={() => setFilter('archived')}
                            >
                                Archived
                            </button>
                        </div>

                        {/* Conversations List */}
                        <div className="conversation-list">
                            {filteredConversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                                    onClick={() => setSelectedConversation(conv)}
                                >
                                    <div className="conversation-avatar">
                                        {conv.avatar ? (
                                            <img src={conv.avatar} alt={conv.display_name} />
                                        ) : (
                                            <span>{conv.display_name[0].toUpperCase()}</span>
                                        )}
                                        {conv.isOnline && <span className="online-status"></span>}
                                    </div>
                                    
                                    <div className="conversation-info">
                                        <div className="conversation-header">
                                            <h4 className="conversation-name">
                                                {conv.isPinned && <Pin className="w-3 h-3 inline mr-1" />}
                                                {conv.display_name}
                                            </h4>
                                            <span className="conversation-time">
                                                {formatTime(conv.timestamp)}
                                            </span>
                                        </div>
                                        <div className="conversation-preview">
                                            <p className="conversation-last-message">
                                                {conv.last_message}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="unread-badge">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* New Chat Button */}
                        <div className="sidebar-footer">
                            <button 
                                className="new-chat-btn"
                                onClick={() => setShowNewChatModal(true)}
                            >
                                <Plus className="w-5 h-5" />
                                <span>New Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="chat-window-container">
                        <EnhancedChatWindow
                            conversation={selectedConversation}
                            onSendMessage={handleSendMessage}
                            loading={loading}
                            currentUser={{ id: 'me', name: 'You' }}
                            isMobile={window.innerWidth < 768}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Additional styles for new components
const additionalStyles = `
.chat-filter-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
    border-bottom: 1px solid var(--chat-border);
}

.filter-tab {
    flex: 1;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--chat-text-secondary);
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-tab:hover {
    background: var(--chat-bg-secondary);
}

.filter-tab.active {
    background: var(--chat-primary);
    color: white;
}

.conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.conversation-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--chat-border);
}

.new-chat-btn {
    width: 100%;
    padding: 12px;
    border: none;
    background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-primary-light) 100%);
    color: white;
    font-size: 14px;
    font-weight: 500;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.new-chat-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(91, 95, 199, 0.3);
}

.chat-window-container {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.reply-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    background: var(--chat-bg-tertiary);
    border-top: 1px solid var(--chat-border);
}

.reply-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.reply-message {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.reply-author {
    font-size: 12px;
    font-weight: 600;
    color: var(--chat-primary);
}

.reply-text {
    font-size: 13px;
    color: var(--chat-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
}

.reply-close {
    padding: 4px;
    border: none;
    background: transparent;
    color: var(--chat-text-muted);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.reply-close:hover {
    background: var(--chat-bg-secondary);
    color: var(--chat-text-primary);
}

.emoji-picker-popup {
    position: absolute;
    bottom: 60px;
    right: 20px;
    background: white;
    border: 1px solid var(--chat-border);
    border-radius: 12px;
    padding: 12px;
    box-shadow: var(--chat-shadow-lg);
    z-index: 100;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    max-width: 320px;
}

.emoji-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.emoji-btn:hover {
    background: var(--chat-bg-secondary);
    transform: scale(1.2);
}

.chat-action-btn {
    padding: 8px;
    border: none;
    background: transparent;
    color: var(--chat-text-secondary);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.chat-action-btn:hover {
    background: var(--chat-bg-secondary);
    color: var(--chat-primary);
}

.loading-messages {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.typing-text {
    font-size: 13px;
    color: var(--chat-text-secondary);
    margin-left: 8px;
}

.message-sender-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--chat-text-secondary);
    margin-bottom: 4px;
    margin-left: 4px;
}

.message-reply-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--chat-bg-secondary);
    border-left: 2px solid var(--chat-primary);
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--chat-text-secondary);
}

.message-attachments {
    margin-top: 8px;
}

.attachment-item img {
    max-width: 200px;
    border-radius: 8px;
    margin-top: 4px;
}

.file-attachment {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--chat-bg-secondary);
    border-radius: 8px;
    margin-top: 4px;
    font-size: 13px;
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}

.message-status {
    display: flex;
    align-items: center;
}

.message-reactions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
}

.reaction-badge {
    padding: 2px 6px;
    background: var(--chat-bg-secondary);
    border: 1px solid var(--chat-border);
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 2px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: var(--chat-success);
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
}
`;

// Inject additional styles
const styleSheet = document.createElement("style");
styleSheet.innerText = additionalStyles;
document.head.appendChild(styleSheet);

export default ModernChatUI;