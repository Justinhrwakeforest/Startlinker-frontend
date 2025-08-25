// frontend/src/components/chat/MessageSearch.js
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp, Calendar, User, File, Mic } from 'lucide-react';
import { format } from 'date-fns';

const MessageSearch = ({ isOpen, onClose, messages, onMessageSelect, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [filters, setFilters] = useState({
        sender: 'all',
        type: 'all',
        dateRange: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setCurrentResultIndex(0);
            setIsSearching(false);
            searchInputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.length > 0) {
            performSearch();
        } else {
            setSearchResults([]);
            setCurrentResultIndex(0);
        }
    }, [searchQuery, filters, messages]);

    const performSearch = async () => {
        setIsSearching(true);
        
        try {
            const query = searchQuery.toLowerCase();
            let filteredMessages = messages;

            // Apply filters
            if (filters.sender !== 'all') {
                filteredMessages = filteredMessages.filter(msg => 
                    filters.sender === 'me' 
                        ? msg.sender?.id === currentUser?.id
                        : msg.sender?.id !== currentUser?.id
                );
            }

            if (filters.type !== 'all') {
                filteredMessages = filteredMessages.filter(msg => {
                    switch (filters.type) {
                        case 'text':
                            return msg.content && !msg.voice_file && (!msg.attachments || msg.attachments.length === 0);
                        case 'voice':
                            return msg.voice_file;
                        case 'files':
                            return msg.attachments && msg.attachments.length > 0;
                        default:
                            return true;
                    }
                });
            }

            if (filters.dateRange !== 'all') {
                const now = new Date();
                const filterDate = new Date();
                
                switch (filters.dateRange) {
                    case 'today':
                        filterDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        filterDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        filterDate.setMonth(now.getMonth() - 1);
                        break;
                    default:
                        filterDate = null;
                }
                
                if (filterDate) {
                    filteredMessages = filteredMessages.filter(msg => 
                        new Date(msg.sent_at) >= filterDate
                    );
                }
            }

            // Search in message content
            const results = filteredMessages.filter(msg => {
                if (msg.content && msg.content.toLowerCase().includes(query)) {
                    return true;
                }
                if (msg.sender?.username?.toLowerCase().includes(query)) {
                    return true;
                }
                if (msg.attachments) {
                    return msg.attachments.some(att => 
                        att.file_name?.toLowerCase().includes(query)
                    );
                }
                return false;
            });

            // Sort by relevance and date
            const sortedResults = results.sort((a, b) => {
                const aScore = getRelevanceScore(a, query);
                const bScore = getRelevanceScore(b, query);
                
                if (aScore !== bScore) {
                    return bScore - aScore;
                }
                
                return new Date(b.sent_at) - new Date(a.sent_at);
            });

            setSearchResults(sortedResults);
            setCurrentResultIndex(0);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const getRelevanceScore = (message, query) => {
        let score = 0;
        const content = message.content?.toLowerCase() || '';
        const sender = message.sender?.username?.toLowerCase() || '';
        
        // Exact match gets highest score
        if (content === query) score += 100;
        
        // Content starts with query
        if (content.startsWith(query)) score += 50;
        
        // Sender name matches
        if (sender.includes(query)) score += 30;
        
        // Content contains query
        if (content.includes(query)) score += 20;
        
        // Boost score for recent messages
        const messageDate = new Date(message.sent_at);
        const daysDiff = (new Date() - messageDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 1) score += 10;
        else if (daysDiff < 7) score += 5;
        
        return score;
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;
        
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? 
                <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">{part}</mark> : 
                part
        );
    };

    const navigateResults = (direction) => {
        if (searchResults.length === 0) return;
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentResultIndex + 1) % searchResults.length;
        } else {
            newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
        }
        
        setCurrentResultIndex(newIndex);
        onMessageSelect(searchResults[newIndex]);
    };

    const handleResultClick = (message, index) => {
        setCurrentResultIndex(index);
        onMessageSelect(message);
    };

    const formatMessageTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            
            if (date.toDateString() === now.toDateString()) {
                return format(date, 'HH:mm');
            } else {
                return format(date, 'MMM d, HH:mm');
            }
        } catch {
            return 'Unknown time';
        }
    };

    const getMessageIcon = (message) => {
        if (message.voice_file) {
            return <Mic className="w-4 h-4 text-green-500" />;
        } else if (message.attachments && message.attachments.length > 0) {
            return <File className="w-4 h-4 text-blue-500" />;
        } else {
            return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Search Messages</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Search input */}
                    <div className="relative">
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-70" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchResults.length > 0) {
                                    onMessageSelect(searchResults[currentResultIndex]);
                                } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    navigateResults('next');
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    navigateResults('prev');
                                }
                            }}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                    
                    {/* Search results summary */}
                    {searchResults.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-white text-opacity-90">
                                {searchResults.length} message{searchResults.length !== 1 ? 's' : ''} found
                            </p>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => navigateResults('prev')}
                                    disabled={searchResults.length === 0}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-white text-opacity-90">
                                    {searchResults.length > 0 ? currentResultIndex + 1 : 0} / {searchResults.length}
                                </span>
                                <button
                                    onClick={() => navigateResults('next')}
                                    disabled={searchResults.length === 0}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="border-b border-gray-200 p-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <span className="text-sm font-medium">Filters</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showFilters && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                                <select
                                    value={filters.sender}
                                    onChange={(e) => setFilters({...filters, sender: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                >
                                    <option value="all">All</option>
                                    <option value="me">Me</option>
                                    <option value="others">Others</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                >
                                    <option value="all">All</option>
                                    <option value="text">Text</option>
                                    <option value="voice">Voice</option>
                                    <option value="files">Files</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                >
                                    <option value="all">All time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This week</option>
                                    <option value="month">This month</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {searchQuery.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Start typing to search messages</p>
                            <p className="text-gray-400 text-sm mt-2">Search through your conversation history</p>
                        </div>
                    ) : searchResults.length === 0 && !isSearching ? (
                        <div className="text-center py-12">
                            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No messages found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map((message, index) => (
                                <div
                                    key={message.id}
                                    onClick={() => handleResultClick(message, index)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        index === currentResultIndex
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            {getMessageIcon(message)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {message.sender?.username || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatMessageTime(message.sent_at)}
                                                </p>
                                            </div>
                                            
                                            <div className="text-sm text-gray-700">
                                                {message.voice_file ? (
                                                    <span className="italic text-green-600">Voice message</span>
                                                ) : message.attachments && message.attachments.length > 0 ? (
                                                    <span className="italic text-blue-600">
                                                        {message.attachments.length} file{message.attachments.length !== 1 ? 's' : ''}
                                                        {message.content && ': '}
                                                        {message.content && highlightText(message.content, searchQuery)}
                                                    </span>
                                                ) : (
                                                    <p className="truncate">
                                                        {highlightText(message.content || '', searchQuery)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageSearch;