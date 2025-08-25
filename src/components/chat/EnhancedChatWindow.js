// Enhanced Chat Window Component with improved UI/UX
import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, Paperclip, Smile, Mic, Image, MoreVertical, 
    Phone, Video, Search, Settings, X, Check, CheckCheck,
    Reply, Edit, Trash2, Copy, Forward, Star, Pin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import '../../styles/chat-ui-enhanced.css';

const EnhancedChatWindow = ({ 
    conversation, 
    onSendMessage, 
    loading, 
    currentUser,
    isMobile 
}) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [conversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!message.trim() && !replyTo) return;

        try {
            await onSendMessage(message, replyTo?.id);
            setMessage('');
            setReplyTo(null);
            setEditingMessage(null);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Handle file upload
            console.log('Files selected:', files);
        }
    };

    const handleEmojiSelect = (emoji) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return format(date, 'HH:mm');
        } else if (diffInHours < 168) { // Less than a week
            return format(date, 'EEE HH:mm');
        } else {
            return format(date, 'MMM dd, HH:mm');
        }
    };

    const renderMessage = (msg, index) => {
        const isOwn = msg.sender === currentUser?.id;
        const showAvatar = index === 0 || 
            conversation.messages[index - 1]?.sender !== msg.sender;

        return (
            <div 
                key={msg.id} 
                className={`message-group ${isOwn ? 'own' : ''}`}
                onDoubleClick={() => setReplyTo(msg)}
            >
                {!isOwn && showAvatar && (
                    <div className="message-avatar">
                        {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt={msg.senderName} />
                        ) : (
                            <span>{msg.senderName?.[0]?.toUpperCase()}</span>
                        )}
                    </div>
                )}
                
                <div className="message-content-wrapper">
                    {!isOwn && showAvatar && (
                        <div className="message-sender-name">
                            {msg.senderName}
                        </div>
                    )}
                    
                    {msg.replyTo && (
                        <div className="message-reply-preview">
                            <Reply className="w-3 h-3" />
                            <span className="reply-text">{msg.replyTo.content}</span>
                        </div>
                    )}
                    
                    <div className="message-bubble">
                        <p className="message-text">{msg.content}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="message-attachments">
                                {msg.attachments.map((attachment, idx) => (
                                    <div key={idx} className="attachment-item">
                                        {attachment.type.startsWith('image/') ? (
                                            <img src={attachment.url} alt="attachment" />
                                        ) : (
                                            <div className="file-attachment">
                                                <File className="w-4 h-4" />
                                                <span>{attachment.name}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="message-meta">
                            <span className="message-time">
                                {formatMessageTime(msg.timestamp)}
                            </span>
                            {isOwn && (
                                <span className="message-status">
                                    {msg.read ? (
                                        <CheckCheck className="w-4 h-4 text-blue-500" />
                                    ) : msg.delivered ? (
                                        <CheckCheck className="w-4 h-4" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {msg.reactions && msg.reactions.length > 0 && (
                        <div className="message-reactions">
                            {msg.reactions.map((reaction, idx) => (
                                <span key={idx} className="reaction-badge">
                                    {reaction.emoji} {reaction.count}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!conversation) {
        return (
            <div className="chat-empty-state">
                <div className="empty-state-icon">
                    <Send className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="empty-state-title">Select a conversation</h3>
                <p className="empty-state-text">
                    Choose a conversation from the list to start messaging
                </p>
            </div>
        );
    }

    return (
        <div className="chat-messages-container">
            {/* Chat Header */}
            <div className="chat-messages-header">
                <div className="chat-recipient-info">
                    <div className="chat-recipient-avatar">
                        {conversation.avatar ? (
                            <img src={conversation.avatar} alt={conversation.display_name} />
                        ) : (
                            <span>{conversation.display_name?.[0]?.toUpperCase()}</span>
                        )}
                    </div>
                    <div className="chat-recipient-details">
                        <h3 className="chat-recipient-name">{conversation.display_name}</h3>
                        <span className="chat-recipient-status">
                            <span className="status-dot"></span>
                            {conversation.isOnline ? 'Active now' : `Last seen ${formatDistanceToNow(new Date(conversation.lastSeen))} ago`}
                        </span>
                    </div>
                </div>
                
                <div className="chat-header-actions">
                    <button className="chat-action-btn" title="Voice Call">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="chat-action-btn" title="Video Call">
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="chat-action-btn" title="Search">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="chat-action-btn" title="More Options">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="chat-messages-list">
                {loading ? (
                    <div className="loading-messages">
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                ) : (
                    <>
                        {conversation.messages?.map((msg, index) => renderMessage(msg, index))}
                        
                        {isTyping && (
                            <div className="typing-indicator-wrapper">
                                <div className="typing-dots">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                                <span className="typing-text">
                                    {conversation.display_name} is typing...
                                </span>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div className="reply-preview">
                    <div className="reply-content">
                        <Reply className="w-4 h-4" />
                        <div className="reply-message">
                            <span className="reply-author">{replyTo.senderName}</span>
                            <span className="reply-text">{replyTo.content}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setReplyTo(null)}
                        className="reply-close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Message Input */}
            <div className="chat-input-container">
                <div className="chat-input-wrapper">
                    <div className="chat-input-actions">
                        <button 
                            className="chat-input-btn"
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            title="Attach File"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <button 
                            className="chat-input-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Send Image"
                        >
                            <Image className="w-5 h-5" />
                        </button>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                    
                    <textarea
                        ref={inputRef}
                        className="chat-input-field"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows="1"
                    />
                    
                    <div className="chat-input-actions">
                        <button 
                            className="chat-input-btn"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Add Emoji"
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        
                        {message.trim() ? (
                            <button 
                                className="chat-send-btn"
                                onClick={handleSend}
                                title="Send Message"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        ) : (
                            <button 
                                className="chat-input-btn"
                                title="Voice Message"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="emoji-picker-popup">
                        <div className="emoji-grid">
                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'].map(emoji => (
                                <button
                                    key={emoji}
                                    className="emoji-btn"
                                    onClick={() => handleEmojiSelect(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedChatWindow;