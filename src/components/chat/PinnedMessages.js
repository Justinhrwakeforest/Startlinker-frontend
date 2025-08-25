import React, { useState, useEffect } from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';

const PinnedMessages = ({ conversationId, onMessageClick }) => {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (conversationId) {
            loadPinnedMessages();
        }
    }, [conversationId]);

    const loadPinnedMessages = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/messaging/messages/pinned/?conversation=${conversationId}`);
            setPinnedMessages(response.data);
        } catch (error) {
            console.error('Error loading pinned messages:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || pinnedMessages.length === 0) {
        return null;
    }

    const displayMessage = pinnedMessages[0];
    const hasMore = pinnedMessages.length > 1;

    return (
        <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="px-4 py-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                        <Pin className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div 
                                className="text-sm text-gray-700 cursor-pointer hover:underline"
                                onClick={() => onMessageClick(displayMessage)}
                            >
                                <span className="font-medium">{displayMessage.sender.username}:</span>{' '}
                                <span className="line-clamp-2">{displayMessage.content}</span>
                            </div>
                            {hasMore && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 flex items-center space-x-1"
                                >
                                    <span>{isExpanded ? 'Show less' : `+${pinnedMessages.length - 1} more pinned`}</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded pinned messages */}
                {isExpanded && hasMore && (
                    <div className="mt-3 space-y-2 border-t border-yellow-200 pt-3">
                        {pinnedMessages.slice(1).map((msg) => (
                            <div 
                                key={msg.id}
                                className="flex items-start space-x-2 cursor-pointer hover:bg-yellow-100 -mx-2 px-2 py-1 rounded"
                                onClick={() => onMessageClick(msg)}
                            >
                                <Pin className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">{msg.sender.username}:</span>{' '}
                                        <span className="line-clamp-1">{msg.content}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Pinned {formatDistanceToNow(new Date(msg.pinned_at), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinnedMessages;