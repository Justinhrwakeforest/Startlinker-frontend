import React from 'react';
import { 
    MoreVertical, Pin, Megaphone, Copy, Reply, Edit, 
    Trash2, Flag, UserX, Shield 
} from 'lucide-react';

const MessageContextMenu = ({ 
    message, 
    currentUser, 
    isAdmin, 
    isModerator,
    onPin,
    onAnnounce,
    onDelete,
    onEdit,
    onReply,
    onCopy,
    position,
    onClose
}) => {
    const isOwnMessage = message.sender.id === currentUser.id;
    const canModerate = isAdmin || isModerator;

    const handleAction = (action) => {
        action();
        onClose();
    };

    return (
        <div 
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
            style={{ 
                top: position.y, 
                left: position.x,
                maxHeight: '80vh',
                overflowY: 'auto'
            }}
        >
            {/* Basic Actions */}
            <button
                onClick={() => handleAction(onReply)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
            >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
            </button>

            <button
                onClick={() => handleAction(onCopy)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
            >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
            </button>

            {/* Own Message Actions */}
            {isOwnMessage && (
                <>
                    <button
                        onClick={() => handleAction(onEdit)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                    </button>
                </>
            )}

            {/* Moderation Actions */}
            {canModerate && (
                <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                        onClick={() => handleAction(onPin)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                    >
                        <Pin className="h-4 w-4" />
                        <span>{message.is_pinned ? 'Unpin' : 'Pin'} Message</span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => handleAction(onAnnounce)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                        >
                            <Megaphone className="h-4 w-4" />
                            <span>{message.is_announcement ? 'Remove' : 'Make'} Announcement</span>
                        </button>
                    )}
                </>
            )}

            {/* Delete Action */}
            {(isOwnMessage || canModerate) && (
                <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                        onClick={() => handleAction(onDelete)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Message</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default MessageContextMenu;