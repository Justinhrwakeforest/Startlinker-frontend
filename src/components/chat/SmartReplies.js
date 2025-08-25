// frontend/src/components/chat/SmartReplies.js
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, RefreshCw } from 'lucide-react';

const SmartReplies = ({ lastMessage, onSelectReply, isVisible, context = 'general' }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isVisible && lastMessage && lastMessage.content) {
            generateSuggestions(lastMessage.content, context);
        }
    }, [lastMessage, isVisible, context]);

    const generateSuggestions = async (messageContent, context) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // For now, we'll use predefined smart replies based on patterns
            // In a real app, you'd call an AI service like OpenAI GPT
            const suggestions = generateContextualReplies(messageContent, context);
            setSuggestions(suggestions);
        } catch (err) {
            setError('Failed to generate suggestions');
            console.error('Smart replies error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const generateContextualReplies = (messageContent, context) => {
        const message = messageContent.toLowerCase();
        
        // Common patterns and their suggested replies
        const patterns = [
            // Greetings
            {
                pattern: /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
                replies: [
                    "Hello! How are you?",
                    "Hi there! 👋",
                    "Hey! Good to hear from you",
                    "Hello! What's up?"
                ]
            },
            // Questions
            {
                pattern: /\?$/,
                replies: [
                    "Let me think about that...",
                    "That's a great question!",
                    "I'll get back to you on that",
                    "Good point, let me check"
                ]
            },
            // Thanks
            {
                pattern: /(thanks|thank you|thx|appreciate)/i,
                replies: [
                    "You're welcome! 😊",
                    "No problem at all!",
                    "Happy to help!",
                    "Anytime! 👍"
                ]
            },
            // Meetings
            {
                pattern: /(meeting|call|schedule|appointment)/i,
                replies: [
                    "Let me check my calendar",
                    "What time works best for you?",
                    "I'll send you a meeting invite",
                    "Sounds good, let's schedule it"
                ]
            },
            // Urgent/Important
            {
                pattern: /(urgent|important|asap|rush|priority)/i,
                replies: [
                    "I'll handle this right away",
                    "Got it, treating as priority",
                    "On it! Will get back to you soon",
                    "Understood, working on it now"
                ]
            },
            // Files/Documents
            {
                pattern: /(file|document|attachment|send|share)/i,
                replies: [
                    "I'll send that over shortly",
                    "Let me find that file for you",
                    "Sure, I'll share it with you",
                    "I'll get that document ready"
                ]
            },
            // Yes/No questions
            {
                pattern: /(can you|could you|would you|are you|do you|will you)/i,
                replies: [
                    "Yes, I can help with that",
                    "Sure thing!",
                    "Absolutely!",
                    "Of course!"
                ]
            },
            // Project/Work related
            {
                pattern: /(project|task|work|deadline|progress)/i,
                replies: [
                    "Let me update you on the progress",
                    "I'll check the current status",
                    "Good point, let's discuss this",
                    "I'll look into that right away"
                ]
            },
            // Problems/Issues
            {
                pattern: /(problem|issue|error|bug|broken|not working)/i,
                replies: [
                    "I'll help you resolve this",
                    "Let me investigate this issue",
                    "I'll look into this right away",
                    "Thanks for bringing this up"
                ]
            },
            // Positive responses
            {
                pattern: /(great|awesome|excellent|perfect|amazing|love it)/i,
                replies: [
                    "Glad you like it! 🎉",
                    "Thanks! That means a lot",
                    "Wonderful! 😊",
                    "So happy to hear that!"
                ]
            }
        ];

        // Context-specific suggestions
        const contextSuggestions = {
            business: [
                "I'll follow up on this",
                "Let me schedule a meeting",
                "I'll send you the details",
                "Thanks for the update"
            ],
            casual: [
                "Sounds good! 👍",
                "Haha, that's funny 😄",
                "Totally agree!",
                "Nice! 🙌"
            ],
            support: [
                "I'm here to help",
                "Let me check on that",
                "I'll get this resolved",
                "Thank you for your patience"
            ]
        };

        // Find matching pattern
        for (const patternObj of patterns) {
            if (patternObj.pattern.test(message)) {
                return patternObj.replies.slice(0, 3);
            }
        }

        // Return context-specific suggestions if no pattern matches
        return contextSuggestions[context] || contextSuggestions.casual;
    };

    const refreshSuggestions = () => {
        if (lastMessage && lastMessage.content) {
            generateSuggestions(lastMessage.content, context);
        }
    };

    if (!isVisible || !lastMessage) return null;

    return (
        <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Smart Replies</span>
                </div>
                <button
                    onClick={refreshSuggestions}
                    disabled={isLoading}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Refresh suggestions"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            {error ? (
                <div className="text-sm text-red-600 py-2">
                    {error}
                </div>
            ) : isLoading ? (
                <div className="flex space-x-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 animate-pulse rounded-full px-3 py-2 flex-1">
                            <div className="h-4 bg-gray-300 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectReply(suggestion)}
                            className="inline-flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
                        >
                            <span>{suggestion}</span>
                            <Send className="h-3 w-3 opacity-60" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartReplies;