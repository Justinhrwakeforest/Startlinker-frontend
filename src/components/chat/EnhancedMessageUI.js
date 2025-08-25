// EnhancedMessageUI.js - Improved message display component
import React, { useState, useRef, useEffect } from 'react';
import { 
    MoreVertical, Reply, Trash2, Edit3, Heart, ThumbsUp, 
    Smile, Copy, Share2, Pin, Check, CheckCheck, Clock,
    Image as ImageIcon, File, Download, Play, Pause, X
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';

const EnhancedMessageItem = ({ 
    message, 
    isOwn, 
    onReply, 
    onDelete, 
    onEdit, 
    onReaction,
    onPin,
    previousMessage,
    nextMessage,
    currentUser 
}) => {
    const [showActions, setShowActions] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [imageLoading, setImageLoading] = useState(true);
    const [showFullImage, setShowFullImage] = useState(false);

    // Check if we should show timestamp (first message or different day)
    const showDateHeader = !previousMessage || 
        !isSameDay(new Date(message.sent_at), new Date(previousMessage.sent_at));
    
    // Group messages from same sender
    const isGrouped = previousMessage && 
        previousMessage.sender?.id === message.sender?.id &&
        !showDateHeader &&
        (new Date(message.sent_at) - new Date(previousMessage.sent_at)) < 60000; // Within 1 minute

    const isLastInGroup = !nextMessage || 
        nextMessage.sender?.id !== message.sender?.id ||
        (new Date(nextMessage.sent_at) - new Date(message.sent_at)) >= 60000;

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) {
            return format(date, 'h:mm a');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'MMM d, h:mm a');
        }
    };

    const formatDateHeader = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'EEEE, MMMM d, yyyy');
        }
    };

    const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            // Show toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideUp';
            toast.textContent = 'Message copied!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        } catch (error) {
            console.error('Failed to copy message:', error);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        return url.startsWith('/') ? baseURL + url : `${baseURL}/media/${url}`;
    };

    // Message status indicator
    const MessageStatus = () => {
        if (!isOwn) return null;
        
        return (
            <div className="flex items-center ml-1 text-xs">
                {message.is_read ? (
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                ) : message.delivered ? (
                    <CheckCheck className="w-4 h-4 text-gray-400" />
                ) : (
                    <Check className="w-4 h-4 text-gray-400" />
                )}
            </div>
        );
    };

    return (
        <>
            {/* Date header */}
            {showDateHeader && (
                <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        {formatDateHeader(message.sent_at)}
                    </div>
                </div>
            )}

            {/* Message container */}
            <div 
                className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-${isGrouped ? '1' : '3'} ${isOwn ? 'px-2 pr-4' : 'px-4 pl-2'} relative`}
            >
                {/* Avatar for non-owned messages */}
                {!isOwn && !isGrouped && (
                    <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                            {message.sender?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                    </div>
                )}
                {!isOwn && isGrouped && <div className="w-8 mr-3" />}

                <div className={`flex flex-col ${isOwn ? 'max-w-[85%]' : 'max-w-[80%]'} ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender name for group chats */}
                    {!isOwn && !isGrouped && (
                        <span className="text-xs text-gray-500 mb-1 ml-3">
                            {message.sender?.username || 'Unknown'}
                        </span>
                    )}

                    {/* Message bubble */}
                    <div 
                        className={`relative group ${message.is_deleted ? 'opacity-60' : ''}`}
                        onMouseEnter={() => setShowActions(true)}
                        onMouseLeave={() => setShowActions(false)}
                    >
                        {/* Reply indicator */}
                        {message.reply_to && (
                            <div className={`mb-2 p-2 rounded-lg border ${
                                isOwn ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="text-xs text-gray-500 mb-1">
                                    Replying to {message.reply_to.sender?.username}
                                </div>
                                <div className="text-sm text-gray-700 truncate">
                                    {message.reply_to.content}
                                </div>
                            </div>
                        )}

                        <div className={`
                            relative px-4 py-2.5 rounded-2xl shadow-sm
                            ${isOwn 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                : 'bg-white border border-gray-200 text-gray-800'
                            }
                            ${!isGrouped ? (isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}
                            ${isLastInGroup ? (isOwn ? 'rounded-br-sm' : 'rounded-bl-sm') : ''}
                            transition-all duration-200 hover:shadow-md
                        `}>
                            {/* Pinned/Announcement badge */}
                            {(message.is_pinned || message.is_announcement) && (
                                <div className="absolute -top-2 -right-2">
                                    <div className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full flex items-center">
                                        <Pin className="w-3 h-3 mr-1" />
                                        {message.is_announcement ? 'Announcement' : 'Pinned'}
                                    </div>
                                </div>
                            )}

                            {/* Message content */}
                            {message.is_deleted ? (
                                <div className="italic text-gray-500">
                                    Message deleted
                                </div>
                            ) : isEditing ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-2 text-gray-800 bg-gray-50 rounded border border-gray-300 resize-none"
                                        rows="2"
                                        autoFocus
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEdit(message.id, editContent)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* File attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="mb-2 space-y-2">
                                            {message.attachments.map((attachment, idx) => (
                                                <div key={idx} className="rounded-lg overflow-hidden">
                                                    {attachment.file_type?.startsWith('image/') ? (
                                                        <div className="relative">
                                                            <img
                                                                src={getMediaUrl(attachment.file)}
                                                                alt="Attachment"
                                                                className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => setShowFullImage(true)}
                                                                onLoad={() => setImageLoading(false)}
                                                            />
                                                            {imageLoading && (
                                                                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={getMediaUrl(attachment.file)}
                                                            download
                                                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <File className="w-5 h-5 mr-2 text-gray-600" />
                                                            <span className="text-sm text-gray-700 flex-1">
                                                                {attachment.file_name || 'Download file'}
                                                            </span>
                                                            <Download className="w-4 h-4 text-gray-500" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Voice message */}
                                    {message.message_type === 'voice' && message.voice_url && (
                                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                            <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <div className="flex-1 h-8 bg-gray-200 rounded-full relative overflow-hidden">
                                                <div className="absolute inset-0 bg-blue-500 opacity-30" style={{ width: '30%' }} />
                                            </div>
                                            <span className="text-xs text-gray-600">
                                                {message.voice_duration || '0:00'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Text content */}
                                    <div className="break-words whitespace-pre-wrap">
                                        {message.content}
                                    </div>

                                    {/* Edited indicator */}
                                    {message.edited_at && (
                                        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                            (edited)
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Reactions */}
                            {message.reaction_counts && Object.keys(message.reaction_counts).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200/30">
                                    {Object.entries(message.reaction_counts).map(([emoji, count]) => (
                                        <button
                                            key={emoji}
                                            onClick={() => onReaction(message.id, emoji)}
                                            className={`
                                                px-2 py-1 rounded-full text-sm flex items-center space-x-1
                                                ${message.user_reactions?.includes(emoji)
                                                    ? 'bg-blue-100 border border-blue-300'
                                                    : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                                                }
                                                transition-colors
                                            `}
                                        >
                                            <span>{emoji}</span>
                                            {count > 1 && <span className="text-xs font-medium">{count}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick actions on hover */}
                        {showActions && !message.is_deleted && !isEditing && (
                            <div className={`
                                absolute top-0 flex items-center space-x-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10
                                ${isOwn ? '-left-28' : '-right-28'}
                                animate-fadeIn
                            `}>
                                <button
                                    onClick={() => setShowReactions(!showReactions)}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                    title="React"
                                >
                                    <Smile className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => onReply(message)}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                    title="Reply"
                                >
                                    <Reply className="w-4 h-4 text-gray-600" />
                                </button>
                                {isOwn && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4 text-gray-600" />
                                    </button>
                                )}
                                <button
                                    onClick={handleCopyMessage}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="w-4 h-4 text-gray-600" />
                                </button>
                                {isOwn && (
                                    <button
                                        onClick={() => onDelete(message.id)}
                                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                )}

                                {/* Quick reactions popup */}
                                {showReactions && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex space-x-1">
                                        {quickReactions.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    onReaction(message.id, emoji);
                                                    setShowReactions(false);
                                                }}
                                                className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center text-lg transition-transform hover:scale-110"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Time and status */}
                    <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-400">
                            {formatMessageTime(message.sent_at)}
                        </span>
                        <MessageStatus />
                    </div>
                </div>
            </div>

            {/* Full image viewer modal */}
            {showFullImage && message.attachments && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowFullImage(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setShowFullImage(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    {message.attachments.map((attachment, idx) => (
                        attachment.file_type?.startsWith('image/') && (
                            <img
                                key={idx}
                                src={getMediaUrl(attachment.file)}
                                alt="Full size"
                                className="max-w-full max-h-full object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )
                    ))}
                </div>
            )}
        </>
    );
};

export default EnhancedMessageItem;