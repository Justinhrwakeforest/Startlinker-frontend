// frontend/src/components/chat/ChatWindow.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, User, MoreVertical, Reply, Trash2, Edit3, Paperclip, Image, File, X, Smile, CreditCard, Archive, BellOff, Search, UserPlus, Info, LogOut, Calendar, Clock, Tag, Plus, Mic, Sparkles, Share2, Settings, Pin, Megaphone } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import webSocketService from '../../services/websocket';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { VoiceRecorder, VoiceMessagePlayer } from './VoiceMessage';
import { DragDropArea, FileUploadModal } from './DragDropArea';
import MessageSearch from './MessageSearch';
import SmartReplies from './SmartReplies';
import GroupSettings from './GroupSettings';
import MessageContextMenu from './MessageContextMenu';
import PinnedMessages from './PinnedMessages';
import TagManager from './TagManager';
import AddParticipants from './AddParticipants';
import ConversationInfo from './ConversationInfo';
import EnhancedMessageItem from './EnhancedMessageUI';
import '../../styles/enhanced-message-ui.css';

// Helper function to construct media URL
const getMediaUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Otherwise, prepend the backend URL
    const baseURL = process.env.REACT_APP_API_URL || 'https://startlinker-backend.onrender.com';
    
    // Ensure proper URL construction
    if (url.startsWith('/')) {
        return baseURL + url;
    } else {
        return `${baseURL}/media/${url}`;
    }
};

// Enhanced emoji reactions with categories
const EMOJI_REACTIONS = {
    'Popular': ['👍', '👎', '❤️', '😂', '😢', '😮', '😡', '🔥'],
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️'],
    'Objects': ['🔥', '💯', '💫', '⭐', '🌟', '✨', '⚡', '💥', '💢', '💨', '💦', '💤', '🎉', '🎊', '🎈', '🎁']
};

const EmojiPicker = ({ onEmojiSelect, onClose, isVisible, position = 'bottom' }) => {
    const [activeCategory, setActiveCategory] = useState('Popular');
    
    if (!isVisible) return null;
    
    const positionClasses = position === 'top' 
        ? 'top-full mt-2' 
        : 'bottom-full mb-2';
    
    return (
        <div 
            className={`absolute ${positionClasses} bg-white border border-gray-300 rounded-xl shadow-2xl p-3 z-50 w-72 sm:w-80 right-0`}
            onMouseLeave={onClose}
        >
            {/* Close button */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Add Reaction</span>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            
            {/* Category tabs */}
            <div className="flex space-x-1 mb-3 border-b border-gray-200 pb-2">
                {Object.keys(EMOJI_REACTIONS).map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                            activeCategory === category
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
            
            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                {EMOJI_REACTIONS[activeCategory].map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            onEmojiSelect(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-blue-50 rounded-lg transition-colors duration-200 transform hover:scale-110"
                        title={emoji}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            
            {/* Quick reactions */}
            <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600 block mb-2">Quick reactions:</span>
                <div className="flex space-x-1">
                    {EMOJI_REACTIONS['Popular'].slice(0, 6).map((emoji, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onEmojiSelect(emoji);
                                onClose();
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LinkPreview = ({ url }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                setLoading(true);
                // Using a CORS proxy for demo purposes - in production, you'd want your own backend endpoint
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();
                
                // Parse HTML to extract meta tags
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                const title = doc.querySelector('meta[property="og:title"]')?.content || 
                             doc.querySelector('title')?.textContent || 
                             url;
                             
                const description = doc.querySelector('meta[property="og:description"]')?.content || 
                                   doc.querySelector('meta[name="description"]')?.content || 
                                   '';
                                   
                const image = doc.querySelector('meta[property="og:image"]')?.content || 
                             doc.querySelector('meta[name="twitter:image"]')?.content || 
                             '';

                setPreview({ title, description, image, url });
                setError(false);
            } catch (err) {
                console.error('Error fetching link preview:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (loading) {
        return (
            <div className="border rounded p-3 bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
        );
    }

    if (error || !preview) {
        return (
            <div className="border rounded p-3 bg-gray-50">
                <div className="flex items-center text-blue-600 hover:text-blue-800">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="break-all">
                        {url}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded overflow-hidden bg-white hover:bg-gray-50 transition-colors">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                {preview.image && (
                    <img 
                        src={preview.image} 
                        alt={preview.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                )}
                <div className="p-3">
                    <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                        {preview.title}
                    </h4>
                    {preview.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {preview.description}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                        {new URL(url).hostname}
                    </p>
                </div>
            </a>
        </div>
    );
};

const MeetingScheduler = ({ isOpen, onClose, onSchedule, conversation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60'); // in minutes
    const [link, setLink] = useState('');

    // Set default values
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            setDate(tomorrow.toISOString().split('T')[0]);
            setTime('10:00');
            setTitle('');
            setDescription('');
            setDuration('60');
            setLink('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!title || !date || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const meetingData = {
            title,
            description,
            datetime: `${date}T${time}:00`,
            duration: parseInt(duration),
            link: link || null,
            conversation_id: conversation.id
        };

        onSchedule(meetingData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-semibold">Schedule Meeting</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meeting Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                placeholder="Enter meeting title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                rows={3}
                                placeholder="Meeting agenda or description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time *
                                </label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes)
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meeting Link (optional)
                            </label>
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                placeholder="https://zoom.us/j/... or Google Meet link"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Schedule Meeting
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ConversationTagger = ({ isOpen, onClose, conversation, currentTags, onTagsUpdate }) => {
    const [tags, setTags] = useState(currentTags || []);
    const [newTag, setNewTag] = useState('');
    const [predefinedTags] = useState([
        'Important', 'Project', 'Investor', 'Client', 'Team', 'Personal',
        'Meeting', 'Urgent', 'Follow-up', 'Review', 'Ideas'
    ]);

    useEffect(() => {
        if (isOpen) {
            setTags(currentTags || []);
            setNewTag('');
        }
    }, [isOpen, currentTags]);

    const handleAddTag = (tag) => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setNewTag('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newTag.trim()) {
            handleAddTag(newTag.trim());
            return;
        }

        try {
            // Update conversation tags via API
            await api.post(`/api/messaging/conversations/${conversation.id}/update_tags/`, {
                tags: tags
            });
            
            onTagsUpdate(tags);
            onClose();
        } catch (error) {
            console.error('Error updating tags:', error);
            alert('Failed to update tags. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Manage Tags</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                {tags.length === 0 && (
                                    <span className="text-gray-500 text-sm">No tags added</span>
                                )}
                            </div>
                        </div>

                        {/* Add New Tag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add New Tag
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Enter tag name"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddTag(newTag.trim())}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Predefined Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quick Add
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {predefinedTags.filter(tag => !tags.includes(tag)).map((tag, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleAddTag(tag)}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save Tags
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ChatWindow = ({ conversation, onSendMessage, onNewMessage, loading, isMobile = false }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [sending, setSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);
    const [businessCard, setBusinessCard] = useState(null);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [conversationTags, setConversationTags] = useState([]);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [showSmartReplies, setShowSmartReplies] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showAddParticipants, setShowAddParticipants] = useState(false);
    const [showConversationInfo, setShowConversationInfo] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModerator, setIsModerator] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messageInputRef = useRef(null);
    const optionsMenuRef = useRef(null);

    // Update messages when conversation changes
    useEffect(() => {
        if (conversation?.messages) {
            setMessages(conversation.messages);
            scrollToBottom();
        }
        
        // Check user permissions in group
        if (conversation?.is_group && conversation?.participant_settings) {
            const userParticipant = conversation.participant_settings.find(
                p => p.user.id === currentUser?.id
            );
            setIsAdmin(userParticipant?.is_admin || false);
            setIsModerator(userParticipant?.is_moderator || false);
        }
        
        // Mark all messages in this conversation as read
        if (conversation?.id && conversation?.unread_count > 0) {
            markConversationAsRead();
        }
        
        // Debug log to check user ID
        console.log('Current user:', currentUser);
        console.log('Messages:', conversation?.messages);
    }, [conversation, currentUser]);

    // WebSocket connection management (optional)
    useEffect(() => {
        if (conversation?.id) {
            // Try to connect to WebSocket but don't fail if it's not available
            try {
                webSocketService.connect(conversation.id);

                // Set up event listeners
                const unsubscribeMessage = webSocketService.onMessage((data) => {
                    if (data.message) {
                        // Handle all messages
                        setMessages(prev => [...prev, data.message]);
                        onNewMessage(data.message);
                        scrollToBottom();
                    }
                });

                const unsubscribeTyping = webSocketService.onTyping((data) => {
                    if (data.is_typing) {
                        setTypingUsers(prev => {
                            if (!prev.includes(data.username)) {
                                return [...prev, data.username];
                            }
                            return prev;
                        });
                    } else {
                        setTypingUsers(prev => prev.filter(user => user !== data.username));
                    }
                });

                const unsubscribeStatus = webSocketService.onUserStatus((data) => {
                    setConnectionStatus(webSocketService.getConnectionState());
                });

                // Update connection status
                setConnectionStatus(webSocketService.getConnectionState());

                return () => {
                    unsubscribeMessage();
                    unsubscribeTyping();
                    unsubscribeStatus();
                    webSocketService.disconnect();
                };
            } catch (error) {
                console.warn('WebSocket connection failed, using API-only mode:', error);
                setConnectionStatus('DISCONNECTED');
            }
        }
    }, [conversation?.id, onNewMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Message moderation functions
    const handlePinMessage = async (messageId) => {
        try {
            const response = await api.post(`/api/messaging/messages/${messageId}/pin/`);
            
            // Update the message in the messages list
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, is_pinned: response.data.pinned }
                    : msg
            ));
        } catch (error) {
            console.error('Error pinning message:', error);
            alert('Failed to pin message');
        }
    };

    const handleAnnounceMessage = async (message) => {
        try {
            const response = await api.post(`/api/messaging/messages/${message.id}/announce/`);
            
            // Update the message in the messages list
            setMessages(prev => prev.map(msg => 
                msg.id === message.id 
                    ? { ...msg, is_announcement: response.data.is_announcement }
                    : msg
            ));
            
            // Show notification
            alert(response.data.is_announcement ? 'Message marked as announcement!' : 'Announcement removed!');
        } catch (error) {
            console.error('Error making announcement:', error);
            alert('Failed to make announcement');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            await api.delete(`/api/messaging/messages/${messageId}/`);
            
            // Update the message to show as deleted instead of removing it
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString() }
                    : msg
            ));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            const response = await api.post(`/api/messaging/messages/${messageId}/edit/`, {
                content: newContent
            });
            
            // Update the message in the list
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
                    : msg
            ));
            
            setEditingMessage(null);
            setEditContent('');
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message');
        }
    };

    const handleMessageContextMenu = (e, message) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            message
        });
    };

    const scrollToMessage = (message) => {
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('bg-yellow-100');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100');
            }, 2000);
        }
    };

    // Click outside handler for options menu and context menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setShowOptionsMenu(false);
            }
            // Close context menu when clicking outside
            if (contextMenu) {
                setContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    // Menu option handlers
    const handleMuteConversation = async () => {
        try {
            const response = await api.post(`/api/messaging/conversations/${conversation.id}/mute/`, {
                duration: 8 // 8 hours default
            });
            alert(response.data.muted ? 'Conversation muted for 8 hours' : 'Conversation unmuted');
            setShowOptionsMenu(false);
        } catch (error) {
            console.error('Error muting conversation:', error);
            alert('Failed to mute conversation');
        }
    };

    const handleArchiveConversation = async () => {
        try {
            const response = await api.post(`/api/messaging/conversations/${conversation.id}/archive/`);
            alert(response.data.message);
            setShowOptionsMenu(false);
            // You might want to redirect or update the UI here
        } catch (error) {
            console.error('Error archiving conversation:', error);
            alert('Failed to archive conversation');
        }
    };

    const handleClearChat = async () => {
        if (window.confirm('Are you sure you want to clear all messages in this chat? This action cannot be undone.')) {
            try {
                const response = await api.post(`/api/messaging/conversations/${conversation.id}/clear_messages/`);
                
                // Clear messages from state
                setMessages([]);
                
                // Show success message
                alert(response.data.message);
                setShowOptionsMenu(false);
                
                // Optionally reload the conversation to get the system message
                const updatedConversation = await api.get(`/api/messaging/conversations/${conversation.id}/`);
                if (updatedConversation.data.messages) {
                    setMessages(updatedConversation.data.messages);
                }
            } catch (error) {
                console.error('Error clearing chat:', error);
                alert('Failed to clear chat. Please try again.');
            }
        }
    };

    const handleAddParticipants = () => {
        setShowAddParticipants(true);
        setShowOptionsMenu(false);
    };

    const handleViewInfo = () => {
        setShowConversationInfo(true);
        setShowOptionsMenu(false);
    };

    const handleLeaveConversation = async () => {
        if (conversation.is_group && window.confirm('Are you sure you want to leave this group?')) {
            try {
                const response = await api.post(`/api/messaging/conversations/${conversation.id}/leave/`);
                alert(response.data.message);
                setShowOptionsMenu(false);
                // Redirect to messages list
                window.location.href = '/messages';
            } catch (error) {
                console.error('Error leaving conversation:', error);
                alert('Failed to leave conversation');
            }
        }
    };

    const handleDeleteConversation = async () => {
        const confirmMessage = conversation.is_group 
            ? 'Are you sure you want to delete this entire group conversation? This will delete it for all participants and cannot be undone.'
            : 'Are you sure you want to delete this entire conversation? This action cannot be undone.';
            
        if (window.confirm(confirmMessage)) {
            try {
                const response = await api.delete(`/api/messaging/conversations/${conversation.id}/delete_conversation/`);
                alert(response.data.message);
                setShowOptionsMenu(false);
                
                // Redirect to messages list
                window.location.href = '/messages';
            } catch (error) {
                console.error('Error deleting conversation:', error);
                if (error.response?.data?.error) {
                    alert(error.response.data.error);
                } else {
                    alert('Failed to delete conversation. Please try again.');
                }
            }
        }
    };

    const handleScheduleMeeting = async (meetingData) => {
        try {
            // Create a special message with meeting data
            const meetingMessage = {
                conversation: conversation.id,
                content: `📅 Meeting scheduled: "${meetingData.title}"\n📅 ${new Date(meetingData.datetime).toLocaleString()}\n⏱️ Duration: ${meetingData.duration} minutes${meetingData.description ? `\n📝 ${meetingData.description}` : ''}${meetingData.link ? `\n🔗 ${meetingData.link}` : ''}`,
            };

            // Send the meeting message
            const response = await api.post('/api/messaging/messages/', meetingMessage);
            
            // Update current conversation
            setMessages(prev => [...prev, response.data]);
            
            // Show success message
            alert('Meeting scheduled and shared with conversation participants!');
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            alert('Failed to schedule meeting. Please try again.');
        }
    };

    const handleTagsUpdate = (newTags) => {
        setConversationTags(newTags);
    };


    // Load conversation tags
    useEffect(() => {
        if (conversation?.id) {
            const loadTags = async () => {
                try {
                    const response = await api.get(`/api/messaging/conversations/${conversation.id}/get_tags/`);
                    setConversationTags(response.data.tags || []);
                } catch (error) {
                    console.error('Error loading tags:', error);
                    setConversationTags([]);
                }
            };
            loadTags();
        }
    }, [conversation?.id]);

    const markConversationAsRead = async () => {
        if (!conversation?.id) return;
        
        try {
            await api.post('/api/messaging/mark-read/', {
                conversation_id: conversation.id
            });
            
            // Trigger unread count refresh
            window.dispatchEvent(new CustomEvent('unreadCountChanged'));
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    };

    const markMessageAsRead = async (messageId) => {
        try {
            await api.post('/api/messaging/mark-read/', {
                message_ids: [messageId]
            });
            
            // Update message in state
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, is_read: true }
                        : msg
                )
            );
            
            // Also send via WebSocket for real-time updates
            if (webSocketService.isConnected()) {
                webSocketService.markAsRead(messageId);
            }
            
            // Trigger unread count refresh
            window.dispatchEvent(new CustomEvent('unreadCountChanged'));
        } catch (error) {
            // Temporarily ignore read receipt errors to focus on video calls
            console.warn('Read receipt temporarily disabled:', error.message);
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        
        const validFiles = files.filter(file => {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                return false;
            }
            return true;
        });
        
        setSelectedFiles(prev => [...prev, ...validFiles]);
        event.target.value = ''; // Reset input
    };

    const handleDragDropFiles = (files) => {
        const validFiles = files.filter(file => {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                return false;
            }
            return true;
        });
        
        setUploadFiles(validFiles);
        setShowFileUpload(true);
    };

    const handleUploadFiles = (files) => {
        setSelectedFiles(prev => [...prev, ...files]);
        setUploadFiles([]);
    };

    const handleMessageSelect = (message) => {
        // Scroll to the selected message
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message briefly
            messageElement.classList.add('bg-yellow-100', 'border-yellow-300', 'border-2');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100', 'border-yellow-300', 'border-2');
            }, 3000);
        }
        setShowMessageSearch(false);
    };

    const handleSmartReplySelect = (reply) => {
        setMessageInput(reply);
        setShowSmartReplies(false);
        messageInputRef.current?.focus();
    };

    const getLastOtherMessage = () => {
        if (!messages || messages.length === 0) return null;
        // Find the last message from someone else
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (message.sender?.id !== currentUser?.id) {
                return message;
            }
        }
        return null;
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) {
            return <Image className="w-4 h-4" />;
        }
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            const response = await api.post(`/api/messaging/messages/${messageId}/react/`, {
                emoji: emoji
            });
            
            // Update the messages state with the new reaction data
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === messageId 
                        ? { 
                            ...msg, 
                            reaction_counts: response.data.added 
                                ? { ...msg.reaction_counts, [emoji]: (msg.reaction_counts[emoji] || 0) + 1 }
                                : { ...msg.reaction_counts, [emoji]: Math.max((msg.reaction_counts[emoji] || 1) - 1, 0) },
                            user_reactions: response.data.added 
                                ? [...(msg.user_reactions || []), emoji]
                                : (msg.user_reactions || []).filter(e => e !== emoji)
                        }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    };

    const loadBusinessCard = async () => {
        try {
            const response = await api.get('/api/messaging/business-cards/my_card/');
            setBusinessCard(response.data);
        } catch (error) {
            console.error('Error loading business card:', error);
            setBusinessCard(null);
        }
    };

    const handleShareBusinessCard = async () => {
        if (!businessCard) {
            alert('Please create a business card first');
            return;
        }

        try {
            // Send a message indicating business card is being shared
            await onSendMessage('📇 Business Card Shared', null, []);
            
            setShowBusinessCardModal(false);
        } catch (error) {
            console.error('Error sharing business card:', error);
            alert('Failed to share business card');
        }
    };

    // Load business card on component mount
    useEffect(() => {
        loadBusinessCard();
    }, []);

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && selectedFiles.length === 0) || sending) return;

        setSending(true);
        try {
            // Always use API for reliability
            await onSendMessage(messageInput.trim(), replyingTo?.id, selectedFiles);

            setMessageInput('');
            setReplyingTo(null);
            setSelectedFiles([]);
            messageInputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSendVoiceMessage = async (audioBlob, duration) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-message.webm');
            formData.append('conversation', conversation.id);
            formData.append('duration', duration);
            formData.append('message_type', 'voice');

            // Try to send via voice message API first
            try {
                const response = await api.post('/api/messaging/voice-messages/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Update current conversation with the new voice message
                setMessages(prev => [...prev, response.data]);
                scrollToBottom();
            } catch (voiceApiError) {
                console.log('Voice API not available, falling back to regular message API');
                
                // Fallback: send via regular message API
                formData.append('content', '🎤 Voice message');
                const response = await api.post('/api/messaging/messages/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Update current conversation with the new message
                setMessages(prev => [...prev, response.data]);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending voice message:', error);
            alert('Failed to send voice message. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);

        // Handle typing indicator (only if WebSocket is connected)
        if (webSocketService.isConnected()) {
            if (!isTyping) {
                setIsTyping(true);
                webSocketService.sendTyping(true);
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                webSocketService.sendTyping(false);
            }, 2000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // URL detection and preview functionality
    const extractUrls = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    };

    const formatMessageTime = (timestamp) => {
        try {
            // Check if timestamp is valid
            if (!timestamp) {
                return 'Unknown time';
            }

            const date = new Date(timestamp);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid time';
            }

            const now = new Date();
            
            // If today, show time only
            if (date.toDateString() === now.toDateString()) {
                return format(date, 'HH:mm');
            }
            
            // If this week, show day and time
            const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
                return format(date, 'EEE HH:mm');
            }
            
            // Otherwise show date and time
            return format(date, 'MMM d, HH:mm');
        } catch (error) {
            console.error('Error formatting message time:', error, 'timestamp:', timestamp);
            return 'Unknown time';
        }
    };

    const MessageItem = ({ message, isOwn, isMobile = false }) => {
        const [showActions, setShowActions] = useState(false);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [isEditing, setIsEditing] = useState(false);
        const [editContent, setEditContent] = useState(message.content);
        const [actionsTimeout, setActionsTimeout] = useState(null);
        const messageRef = useRef(null);
        const actionsRef = useRef(null);
        
        // Check if message is pinned or announcement
        const isPinned = message.is_pinned;
        const isAnnouncement = message.is_announcement;

        // Mark message as read when it comes into view - TEMPORARILY DISABLED
        useEffect(() => {
            // Temporarily disabled to focus on video call testing
            return () => {};
        }, [message.id, isOwn, message.is_read]);

        // Cleanup timeout on unmount
        useEffect(() => {
            return () => {
                if (actionsTimeout) {
                    clearTimeout(actionsTimeout);
                }
            };
        }, [actionsTimeout]);

        const handleReply = () => {
            setReplyingTo(message);
            messageInputRef.current?.focus();
        };

        const handleDelete = async () => {
            if (window.confirm('Are you sure you want to delete this message?')) {
                try {
                    await api.delete(`/api/messaging/messages/${message.id}/`);
                    
                    // Update message in state to show as deleted
                    setMessages(prevMessages => 
                        prevMessages.map(msg => 
                            msg.id === message.id 
                                ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString() }
                                : msg
                        )
                    );
                    
                    // Also send via WebSocket if connected
                    if (webSocketService.isConnected()) {
                        webSocketService.deleteMessage(message.id);
                    }
                } catch (error) {
                    console.error('Error deleting message:', error);
                    alert('Failed to delete message. Please try again.');
                }
            }
        };

        const handleEdit = () => {
            setIsEditing(true);
            setEditContent(message.content);
        };

        const handleSaveEdit = async () => {
            if (editContent.trim() === message.content) {
                setIsEditing(false);
                return;
            }

            try {
                const response = await api.post(`/api/messaging/messages/${message.id}/edit/`, {
                    content: editContent.trim()
                });
                
                // Update message in state
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg.id === message.id 
                            ? { ...msg, content: editContent.trim(), edited_at: new Date().toISOString() }
                            : msg
                    )
                );
                
                setIsEditing(false);
            } catch (error) {
                console.error('Error editing message:', error);
                if (error.response?.data?.error) {
                    alert(error.response.data.error);
                } else {
                    alert('Failed to edit message. Please try again.');
                }
            }
        };

        const handleCancelEdit = () => {
            setIsEditing(false);
            setEditContent(message.content);
        };

        const handleEmojiSelect = (emoji) => {
            handleReaction(message.id, emoji);
            setShowEmojiPicker(false);
        };

        const handleReactionClick = (emoji) => {
            handleReaction(message.id, emoji);
        };

        const handleShare = async () => {
            try {
                // Create a shareable text
                const shareText = `From ${message.sender?.username}: "${message.content}"`;
                
                if (navigator.share) {
                    // Use native share API if available
                    await navigator.share({
                        title: 'Shared Message',
                        text: shareText,
                    });
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareText);
                    alert('Message copied to clipboard!');
                }
                setShowActions(false);
            } catch (error) {
                console.error('Error sharing message:', error);
                // Fallback: copy to clipboard
                const shareText = `From ${message.sender?.username}: "${message.content}"`;
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert('Message copied to clipboard!');
                } catch (clipboardError) {
                    console.error('Clipboard error:', clipboardError);
                    alert('Unable to share message');
                }
            }
        };

        const handleMouseEnter = () => {
            if (actionsTimeout) {
                clearTimeout(actionsTimeout);
                setActionsTimeout(null);
            }
            setShowActions(true);
        };

        const handleMouseLeave = () => {
            // Only start timeout if we're actually leaving the entire hover area
            const timeout = setTimeout(() => {
                setShowActions(false);
                setShowEmojiPicker(false);
            }, 100);
            setActionsTimeout(timeout);
        };

        return (
            <div id={`message-${message.id}`} ref={messageRef} className={`flex ${isMobile ? 'mb-3 px-1' : 'mb-4'} ${isOwn ? 'justify-end' : 'justify-start'} ${isOwn ? 'message-send' : 'message-receive'} transition-all duration-300`}>
                <div className={`flex ${isMobile ? 'space-x-1' : 'space-x-2'} ${isMobile ? 'max-w-[90%]' : 'max-w-xs lg:max-w-md'} ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {message.sender?.avatar_url ? (
                            <img 
                                src={message.sender.avatar_url} 
                                alt={message.sender.username}
                                className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full`}
                            />
                        ) : (
                            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-300 rounded-full flex items-center justify-center`}>
                                <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
                            </div>
                        )}
                    </div>

                    {/* Message content with hover container */}
                    <div 
                        className="relative group"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Extended hover area to reach buttons */}
                        <div className={`
                            absolute top-0 h-full w-40 pointer-events-none
                            ${isOwn ? 'right-full' : 'left-full'}
                        `} />
                        
                        <div>
                        {/* Sender name (only for other users) */}
                        {!isOwn && (
                            <div className="text-xs text-gray-500 mb-1 font-medium">
                                {message.sender?.username || 'Unknown User'}
                            </div>
                        )}
                        
                        {/* Reply indicator */}
                        {message.reply_to && (
                            <div className={`
                                text-xs text-gray-500 mb-1 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400
                                ${isOwn ? 'text-right' : 'text-left'}
                            `}>
                                <div className="flex items-center space-x-2">
                                    <Reply className="h-3 w-3 text-blue-500" />
                                    <span className="font-medium text-blue-700">{message.reply_to.sender}</span>
                                </div>
                                <p className="text-gray-600 mt-1 truncate">{message.reply_to.content}</p>
                            </div>
                        )}

                        {/* Pinned/Announcement indicators */}
                        {(isPinned || isAnnouncement) && (
                            <div className={`flex items-center space-x-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {isPinned && (
                                    <div className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                        <Pin className="h-3 w-3" />
                                        <span>Pinned</span>
                                    </div>
                                )}
                                {isAnnouncement && (
                                    <div className="flex items-center space-x-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        <Megaphone className="h-3 w-3" />
                                        <span>Announcement</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message bubble */}
                        <div 
                            id={`message-${message.id}`}
                            className={`
                                px-4 py-3 message-bubble
                                ${isOwn 
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-l-2xl rounded-br-2xl shadow-lg' 
                                    : 'bg-white text-gray-900 rounded-r-2xl rounded-bl-2xl border border-gray-200 shadow-md'
                                }
                                ${message.is_deleted ? 'opacity-50 italic' : ''}
                                ${isAnnouncement ? 'ring-2 ring-red-400' : ''}
                                transition-all duration-200 hover:shadow-lg
                            `}
                            onContextMenu={(e) => handleMessageContextMenu(e, message)}>
                            {message.is_deleted ? (
                                <span className="text-sm">This message was deleted</span>
                            ) : (
                                <>
                                    {message.content && (
                                        isEditing ? (
                                            <div className="mb-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full text-sm bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 resize-none"
                                                    rows={Math.max(1, editContent.split('\n').length)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end space-x-2 mt-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-sm whitespace-pre-wrap mb-2">
                                                    {message.content}
                                                    {message.edited_at && (
                                                        <span className="text-xs opacity-75 ml-2">(edited)</span>
                                                    )}
                                                </div>
                                                
                                                {/* Link previews */}
                                                {(() => {
                                                    const urls = extractUrls(message.content);
                                                    if (urls.length > 0) {
                                                        return (
                                                            <div className="space-y-2 mb-2">
                                                                {urls.slice(0, 2).map((url, index) => (
                                                                    <LinkPreview key={index} url={url} />
                                                                ))}
                                                                {urls.length > 2 && (
                                                                    <div className="text-xs text-gray-500 italic">
                                                                        +{urls.length - 2} more link{urls.length > 3 ? 's' : ''}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </>
                                        )
                                    )}
                                    
                                    {/* Voice message */}
                                    {message.message_type === 'voice' && message.voice_file && (
                                        <VoiceMessagePlayer
                                            audioUrl={getMediaUrl(message.voice_file)}
                                            duration={message.voice_duration}
                                            isOwn={isOwn}
                                        />
                                    )}
                                    
                                    {/* Message attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            {message.attachments.map((attachment, index) => (
                                                <div key={index} className="border rounded p-2 bg-white bg-opacity-20">
                                                    {attachment.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        // Image attachment
                                                        <div>
                                                            <img 
                                                                src={attachment.file} 
                                                                alt={attachment.file_name}
                                                                className="max-w-xs rounded cursor-pointer"
                                                                onClick={() => window.open(attachment.file, '_blank')}
                                                            />
                                                            <p className="text-xs mt-1 opacity-75">{attachment.file_name}</p>
                                                        </div>
                                                    ) : (
                                                        // File attachment
                                                        <div className="flex items-center space-x-2">
                                                            <File className="w-4 h-4" />
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium">{attachment.file_name}</p>
                                                                <p className="text-xs opacity-75">{formatFileSize(attachment.file_size)}</p>
                                                            </div>
                                                            <a 
                                                                href={attachment.file} 
                                                                download={attachment.file_name}
                                                                className="text-xs underline"
                                                            >
                                                                Download
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Reactions */}
                        {message.reaction_counts && Object.keys(message.reaction_counts).length > 0 && (
                            <div className={`
                                flex flex-wrap gap-1 mt-2
                                ${isOwn ? 'justify-end' : 'justify-start'}
                            `}>
                                {Object.entries(message.reaction_counts).map(([emoji, count]) => (
                                    count > 0 && (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReactionClick(emoji)}
                                            className={`
                                                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105
                                                ${(message.user_reactions || []).includes(emoji)
                                                    ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-300 shadow-md'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                                                }
                                            `}
                                        >
                                            <span className="text-sm">{emoji}</span>
                                            <span className="bg-white bg-opacity-50 px-1 rounded-full text-xs">{count}</span>
                                        </button>
                                    )
                                ))}
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className={`
                            text-xs text-gray-500 mt-1
                            ${isOwn ? 'text-right' : 'text-left'}
                        `}>
                            {formatMessageTime(message.sent_at)}
                            {message.edited_at && (
                                <span className="ml-1 italic">(edited)</span>
                            )}
                        </div>

                        {/* Read receipts for own messages */}
                        {isOwn && message.read_receipts && message.read_receipts.length > 0 && (
                            <div className={`
                                text-xs text-gray-400 mt-1
                                ${isOwn ? 'text-right' : 'text-left'}
                            `}>
                                {message.read_receipts.length === 1 ? (
                                    <span>Read by {message.read_receipts[0].user?.username}</span>
                                ) : (
                                    <span>Read by {message.read_receipts.length} people</span>
                                )}
                            </div>
                        )}

                        {/* Thread indicator */}
                        {message.thread_count && message.thread_count > 0 && (
                            <div className={`
                                mt-2 text-xs
                                ${isOwn ? 'text-right' : 'text-left'}
                            `}>
                                <button
                                    onClick={() => {/* TODO: Open thread view */}}
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <Reply className="h-3 w-3" />
                                    <span>{message.thread_count} repl{message.thread_count === 1 ? 'y' : 'ies'}</span>
                                </button>
                            </div>
                        )}

                        {/* Read status indicator for own messages */}
                        {isOwn && (
                            <div className={`
                                flex justify-end mt-1
                            `}>
                                {message.read_receipts && message.read_receipts.length > 0 ? (
                                    <div className="flex text-blue-500" title="Read">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <svg className="w-3 h-3 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="flex text-gray-400" title="Delivered">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        {showActions && !message.is_deleted && (
                            <div 
                                ref={actionsRef}
                                className={`
                                    absolute top-0 flex space-x-1 pointer-events-auto bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-10
                                    ${isOwn ? 'right-full mr-1' : 'left-full ml-1'}
                                `}
                            >
                                <button
                                    onClick={handleReply}
                                    className="p-2 hover:bg-blue-50 rounded transition-colors duration-200 group"
                                    title="Reply"
                                >
                                    <Reply className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                                </button>
                                
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 hover:bg-yellow-50 rounded transition-colors duration-200 group"
                                        title="Add Reaction"
                                    >
                                        <Smile className="h-4 w-4 text-gray-600 group-hover:text-yellow-600" />
                                    </button>
                                    <EmojiPicker
                                        isVisible={showEmojiPicker}
                                        onEmojiSelect={handleEmojiSelect}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                </div>
                                
                                <button
                                    onClick={handleShare}
                                    className="p-2 hover:bg-green-50 rounded transition-colors duration-200 group"
                                    title="Share Message"
                                >
                                    <Share2 className="h-4 w-4 text-gray-600 group-hover:text-green-600" />
                                </button>
                                
                                {isOwn && message.content && (
                                    <button
                                        onClick={handleEdit}
                                        className="p-2 hover:bg-purple-50 rounded transition-colors duration-200 group"
                                        title="Edit"
                                    >
                                        <Edit3 className="h-4 w-4 text-gray-600 group-hover:text-purple-600" />
                                    </button>
                                )}
                                
                                {isOwn && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 hover:bg-red-50 rounded transition-colors duration-200 group"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600" />
                                    </button>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <DragDropArea 
            onFilesDropped={handleDragDropFiles}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <div className={`bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 ${isMobile ? 'px-2 py-3' : 'px-6 py-4'} flex items-center justify-between`}>
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg`}>
                        <User className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base truncate' : 'text-lg'}`}>
                            {conversation.display_name || conversation.other_participant?.username}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium ${
                                conversation.other_participant?.is_online ? 'text-green-600' : 'text-gray-500'
                            }`}>
                                {conversation.other_participant?.is_online ? (
                                    <span className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                        Online
                                    </span>
                                ) : 'Offline'}
                            </p>
                            <span className={`
                                inline-block w-2 h-2 rounded-full transition-colors duration-200
                                ${connectionStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                            `}></span>
                        </div>

                        
                        {/* Tags */}
                        {conversationTags.length > 0 && !isMobile && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {conversationTags.slice(0, 3).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {conversationTags.length > 3 && (
                                    <span className="text-xs text-gray-500 font-medium">
                                        +{conversationTags.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative" ref={optionsMenuRef}>
                        <button 
                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showOptionsMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="py-1">
                                    <button
                                        onClick={handleMuteConversation}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <BellOff className="w-4 h-4 mr-3" />
                                        <span>Mute conversation</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleArchiveConversation}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Archive className="w-4 h-4 mr-3" />
                                        <span>Archive conversation</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowMessageSearch(true)}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Search className="w-4 h-4 mr-3" />
                                        <span>Search in conversation</span>
                                    </button>
                                    
                                    {conversation.is_group && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setShowGroupSettings(true);
                                                    setShowOptionsMenu(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Settings className="w-4 h-4 mr-3" />
                                                <span>Group Settings</span>
                                            </button>
                                            <button
                                                onClick={handleAddParticipants}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <UserPlus className="w-4 h-4 mr-3" />
                                                <span>Add participants</span>
                                            </button>
                                        </>
                                    )}
                                    
                                    <button
                                        onClick={handleViewInfo}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Info className="w-4 h-4 mr-3" />
                                        <span>Conversation info</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowTagManager(true)}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Tag className="w-4 h-4 mr-3" />
                                        <span>Manage tags</span>
                                    </button>
                                    
                                    <div className="border-t border-gray-200 my-1"></div>
                                    
                                    <button
                                        onClick={handleClearChat}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        <Trash2 className="w-4 h-4 mr-3" />
                                        <span>Clear chat</span>
                                    </button>
                                    
                                    {conversation.is_group && (
                                        <button
                                            onClick={handleLeaveConversation}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            <span>Leave group</span>
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={handleDeleteConversation}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        <Trash2 className="w-4 h-4 mr-3" />
                                        <span>Delete conversation</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pinned Messages */}
            {conversation?.is_group && (
                <PinnedMessages 
                    conversationId={conversation.id}
                    onMessageClick={scrollToMessage}
                />
            )}

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-2 py-2' : 'px-3 py-4'} bg-gradient-to-br from-gray-50 to-white custom-scrollbar smooth-scroll`}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-500 font-medium">Loading messages...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <EnhancedMessageItem
                                key={message.id}
                                message={message}
                                isOwn={message.sender?.id === currentUser?.id}
                                onReply={setReplyingTo}
                                onDelete={handleDeleteMessage}
                                onEdit={handleEditMessage}
                                onReaction={handleReaction}
                                onPin={handlePinMessage}
                                previousMessage={index > 0 ? messages[index - 1] : null}
                                nextMessage={index < messages.length - 1 ? messages[index + 1] : null}
                                currentUser={currentUser}
                            />
                        ))}
                        
                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex justify-start mb-4 animate-fadeIn">
                                <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl px-4 py-3 shadow-md">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">
                                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
                <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Replying to {replyingTo.sender?.username}:</span>
                        </p>
                        <p className="text-sm text-blue-600 truncate">{replyingTo.content}</p>
                    </div>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Smart Replies */}
            <SmartReplies
                lastMessage={getLastOtherMessage()}
                onSelectReply={handleSmartReplySelect}
                isVisible={showSmartReplies && !replyingTo}
                context="general"
            />

            {/* Message input */}
            <div className={`bg-gradient-to-r from-white to-gray-50 border-t border-gray-200 ${isMobile ? 'px-2 py-3' : 'p-4'}`}>
                {/* File preview area */}
                {selectedFiles.length > 0 && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm bg-white rounded-lg p-2 shadow-sm">
                                    {getFileIcon(file)}
                                    <span className="flex-1 truncate font-medium">{file.name}</span>
                                    <span className="text-gray-500">{formatFileSize(file.size)}</span>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-red-400 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`flex ${isMobile ? 'flex-wrap gap-2' : 'space-x-2'}`}>
                    {/* Mobile: Show buttons in a row above input */}
                    {isMobile && (
                        <div className="w-full bg-gray-50 rounded-xl p-3 mb-3 shadow-sm border border-gray-100">
                            <div className="flex justify-center space-x-3">
                                {/* File upload button */}
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload-mobile"
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip"
                                    />
                                    <label
                                        htmlFor="file-upload-mobile"
                                        className="cursor-pointer flex flex-col items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md group-hover:bg-white"
                                    >
                                        <Paperclip className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">Attach</span>
                                    </label>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Upload files
                                        </div>
                                    </div>
                                </div>

                                {/* Business card button */}
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowBusinessCardModal(true)}
                                        className="flex flex-col items-center p-3 text-gray-600 hover:text-green-600 hover:bg-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                                    >
                                        <CreditCard className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">Card</span>
                                    </button>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Share business card
                                        </div>
                                    </div>
                                </div>

                                {/* Meeting scheduler button */}
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowMeetingScheduler(true)}
                                        className="flex flex-col items-center p-3 text-gray-600 hover:text-purple-600 hover:bg-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                                    >
                                        <Calendar className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">Meet</span>
                                    </button>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Schedule meeting
                                        </div>
                                    </div>
                                </div>

                                {/* Voice message button */}
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowVoiceRecorder(true)}
                                        className="flex flex-col items-center p-3 text-gray-600 hover:text-red-600 hover:bg-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                                    >
                                        <Mic className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">Voice</span>
                                    </button>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Record voice message
                                        </div>
                                    </div>
                                </div>

                                {/* Smart replies toggle */}
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowSmartReplies(!showSmartReplies)}
                                        className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md ${
                                            showSmartReplies 
                                                ? 'text-amber-600 bg-amber-50 shadow-md scale-105' 
                                                : 'text-gray-600 hover:text-amber-600 hover:bg-white'
                                        }`}
                                    >
                                        <Sparkles className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">Smart</span>
                                    </button>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            {showSmartReplies ? 'Hide smart replies' : 'Show smart replies'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Desktop: Show enhanced buttons inline with input */}
                    {!isMobile && (
                        <div className="flex space-x-1 mr-3">
                            {/* Business card button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setShowBusinessCardModal(true)}
                                    className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="Share business card"
                                >
                                    <CreditCard className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Meeting scheduler button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setShowMeetingScheduler(true)}
                                    className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="Schedule meeting"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Voice message button */}
                            <div className="relative group">
                                <button
                                    onClick={() => setShowVoiceRecorder(true)}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="Record voice message"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Smart replies toggle */}
                            <div className="relative group">
                                <button
                                    onClick={() => setShowSmartReplies(!showSmartReplies)}
                                    className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                                        showSmartReplies 
                                            ? 'text-amber-600 bg-amber-50' 
                                            : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                    }`}
                                    title={showSmartReplies ? 'Hide smart replies' : 'Show smart replies'}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input and send button row with integrated attachment */}
                    <div className={`flex ${isMobile ? 'w-full' : 'flex-1'} space-x-2`}>
                        {/* Message input container with integrated attachment button */}
                        <div className="relative flex-1">
                            <textarea
                                ref={messageInputRef}
                                value={messageInput}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className={`w-full resize-none border border-gray-300 rounded-xl ${isMobile ? 'pl-3 pr-10 py-2 text-sm' : 'pl-4 pr-12 py-3'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 text-gray-900`}
                                rows="1"
                                disabled={sending}
                            />
                            {/* Attachment button inside input */}
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload-integrated"
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip"
                                />
                                <label
                                    htmlFor="file-upload-integrated"
                                    className="cursor-pointer p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center"
                                    title="Attach files"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && selectedFiles.length === 0) || sending}
                            className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white ${isMobile ? 'px-3 py-2' : 'px-6 py-3'} rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center font-medium`}
                        >
                            {sending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Business Card Modal */}
            {showBusinessCardModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-semibold">Share Business Card</h3>
                                <button
                                    onClick={() => setShowBusinessCardModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            {businessCard ? (
                                <div>
                                    <div className="border rounded-lg p-4 mb-4 bg-gradient-to-br from-blue-50 to-indigo-100">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {businessCard.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{businessCard.full_name}</h4>
                                                {businessCard.title && (
                                                    <p className="text-sm text-gray-600">{businessCard.title}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {businessCard.company && (
                                            <p className="text-sm text-gray-700 mb-2">
                                                <strong>Company:</strong> {businessCard.company}
                                            </p>
                                        )}
                                        
                                        {businessCard.email && (
                                            <p className="text-sm text-gray-700 mb-2">
                                                <strong>Email:</strong> {businessCard.email}
                                            </p>
                                        )}
                                        
                                        {businessCard.bio && (
                                            <p className="text-sm text-gray-700 italic">"{businessCard.bio}"</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleShareBusinessCard}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Share Card
                                        </button>
                                        <button
                                            onClick={() => setShowBusinessCardModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Business Card</h4>
                                    <p className="text-gray-600 mb-4">
                                        You need to create a business card before you can share it.
                                    </p>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                // TODO: Navigate to business card creation
                                                alert('Business card creation feature coming soon!');
                                            }}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Create Card
                                        </button>
                                        <button
                                            onClick={() => setShowBusinessCardModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Meeting Scheduler Modal */}
            <MeetingScheduler
                isOpen={showMeetingScheduler}
                onClose={() => setShowMeetingScheduler(false)}
                onSchedule={handleScheduleMeeting}
                conversation={conversation}
            />

            {/* Conversation Tagger Modal */}
            <ConversationTagger
                isOpen={showTagManager}
                onClose={() => setShowTagManager(false)}
                conversation={conversation}
                currentTags={conversationTags}
                onTagsUpdate={handleTagsUpdate}
            />

            {/* Voice Recorder Modal */}
            <VoiceRecorder
                isOpen={showVoiceRecorder}
                onSend={handleSendVoiceMessage}
                onCancel={() => setShowVoiceRecorder(false)}
            />

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showFileUpload}
                onClose={() => {
                    setShowFileUpload(false);
                    setUploadFiles([]);
                }}
                files={uploadFiles}
                onFilesChange={setUploadFiles}
                onUpload={handleUploadFiles}
            />

            {/* Message Search Modal */}
            <MessageSearch
                isOpen={showMessageSearch}
                onClose={() => setShowMessageSearch(false)}
                messages={messages}
                onMessageSelect={handleMessageSelect}
                currentUser={currentUser}
            />

            {/* Group Settings Modal */}
            {conversation?.is_group && (
                <GroupSettings
                    conversation={conversation}
                    isOpen={showGroupSettings}
                    onClose={() => setShowGroupSettings(false)}
                    onUpdate={(updatedConversation) => {
                        // Handle group updates here
                        console.log('Group updated:', updatedConversation);
                        // You could add more logic here to update the parent component
                    }}
                />
            )}

            {/* Message Context Menu */}
            {contextMenu && (
                <MessageContextMenu
                    message={contextMenu.message}
                    currentUser={currentUser}
                    isAdmin={conversation?.is_group && conversation.participant_settings?.find(p => p.user.id === currentUser?.id)?.is_admin}
                    isModerator={conversation?.is_group && conversation.participant_settings?.find(p => p.user.id === currentUser?.id)?.is_moderator}
                    onPin={() => handlePinMessage(contextMenu.message)}
                    onAnnounce={() => handleAnnounceMessage(contextMenu.message)}
                    onDelete={() => handleDeleteMessage(contextMenu.message)}
                    onEdit={() => {
                        setEditingMessage(contextMenu.message);
                        setEditContent(contextMenu.message.content);
                    }}
                    onReply={() => setReplyingTo(contextMenu.message)}
                    onCopy={() => {
                        navigator.clipboard.writeText(contextMenu.message.content);
                        alert('Message copied to clipboard');
                    }}
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Tag Manager Modal */}
            <TagManager
                conversation={conversation}
                isOpen={showTagManager}
                onClose={() => setShowTagManager(false)}
                onTagsUpdate={handleTagsUpdate}
            />

            {/* Add Participants Modal */}
            {conversation?.is_group && (
                <AddParticipants
                    conversation={conversation}
                    isOpen={showAddParticipants}
                    onClose={() => setShowAddParticipants(false)}
                    onParticipantsAdded={() => {
                        // Refresh conversation data
                        window.location.reload();
                    }}
                />
            )}

            {/* Conversation Info Modal */}
            <ConversationInfo
                conversation={conversation}
                isOpen={showConversationInfo}
                onClose={() => setShowConversationInfo(false)}
            />

        </DragDropArea>
    );
};

export default ChatWindow;
