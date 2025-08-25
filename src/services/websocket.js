// frontend/src/services/websocket.js
class WebSocketService {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.messageHandlers = [];
        this.statusHandlers = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
    }

    connect(roomId, token) {
        if (this.socket) {
            this.disconnect();
        }

        this.roomId = roomId;
        
        // Create WebSocket connection with authentication
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.REACT_APP_WS_HOST || window.location.host.replace(':3000', ':8000');
        const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${roomId}/`;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event) => {
            console.log('WebSocket connected to room:', roomId);
            this.reconnectAttempts = 0;
            
            // Send authentication if token provided
            if (token) {
                this.send({
                    type: 'auth',
                    token: token
                });
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            
            // Only attempt reconnection if it wasn't intentional
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                    this.connect(roomId, token);
                }, this.reconnectInterval);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Disconnecting intentionally');
            this.socket = null;
        }
        this.roomId = null;
        this.messageHandlers = [];
        this.statusHandlers = [];
    }

    handleMessage(data) {
        switch (data.type) {
            case 'message':
                this.messageHandlers.forEach(handler => handler(data.message));
                break;
            case 'user_status':
                this.statusHandlers.forEach(handler => handler(data));
                break;
            case 'typing':
                this.notifyTypingHandlers(data);
                break;
            case 'read_receipt':
                this.notifyReadReceiptHandlers(data);
                break;
            case 'message_deleted':
                this.notifyMessageDeletedHandlers(data);
                break;
            case 'call_signal':
                this.notifyCallSignalHandlers(data);
                break;
            case 'call_status_update':
                this.notifyCallStatusHandlers(data);
                break;
            case 'call_notification':
                console.log('📞 WebSocket received call notification:', data);
                this.notifyCallNotificationHandlers(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
            return true;
        }
        console.warn('WebSocket not connected, cannot send:', data);
        return false;
    }

    sendMessage(content, replyTo = null) {
        return this.send({
            type: 'message',
            content: content,
            reply_to: replyTo
        });
    }

    sendTyping(isTyping) {
        return this.send({
            type: 'typing',
            is_typing: isTyping
        });
    }

    markAsRead(messageId) {
        return this.send({
            type: 'read_receipt',
            message_id: messageId
        });
    }

    deleteMessage(messageId) {
        return this.send({
            type: 'delete_message',
            message_id: messageId
        });
    }

    // Event handlers
    onMessage(handler) {
        this.messageHandlers.push(handler);
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    onUserStatus(handler) {
        this.statusHandlers.push(handler);
        return () => {
            this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
        };
    }

    onTyping(handler) {
        if (!this.typingHandlers) this.typingHandlers = [];
        this.typingHandlers.push(handler);
        return () => {
            this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
        };
    }

    onReadReceipt(handler) {
        if (!this.readReceiptHandlers) this.readReceiptHandlers = [];
        this.readReceiptHandlers.push(handler);
        return () => {
            this.readReceiptHandlers = this.readReceiptHandlers.filter(h => h !== handler);
        };
    }

    onMessageDeleted(handler) {
        if (!this.messageDeletedHandlers) this.messageDeletedHandlers = [];
        this.messageDeletedHandlers.push(handler);
        return () => {
            this.messageDeletedHandlers = this.messageDeletedHandlers.filter(h => h !== handler);
        };
    }

    notifyTypingHandlers(data) {
        if (this.typingHandlers) {
            this.typingHandlers.forEach(handler => handler(data));
        }
    }

    notifyReadReceiptHandlers(data) {
        if (this.readReceiptHandlers) {
            this.readReceiptHandlers.forEach(handler => handler(data));
        }
    }

    notifyMessageDeletedHandlers(data) {
        if (this.messageDeletedHandlers) {
            this.messageDeletedHandlers.forEach(handler => handler(data));
        }
    }

    notifyCallSignalHandlers(data) {
        if (this.callSignalHandlers) {
            this.callSignalHandlers.forEach(handler => handler(data));
        }
    }

    notifyCallStatusHandlers(data) {
        if (this.callStatusHandlers) {
            this.callStatusHandlers.forEach(handler => handler(data));
        }
    }

    notifyCallNotificationHandlers(data) {
        if (this.callNotificationHandlers) {
            this.callNotificationHandlers.forEach(handler => handler(data));
        }
    }

    onCallSignal(handler) {
        if (!this.callSignalHandlers) this.callSignalHandlers = [];
        this.callSignalHandlers.push(handler);
        return () => {
            this.callSignalHandlers = this.callSignalHandlers.filter(h => h !== handler);
        };
    }

    onCallStatus(handler) {
        if (!this.callStatusHandlers) this.callStatusHandlers = [];
        this.callStatusHandlers.push(handler);
        return () => {
            this.callStatusHandlers = this.callStatusHandlers.filter(h => h !== handler);
        };
    }

    onCallNotification(handler) {
        if (!this.callNotificationHandlers) this.callNotificationHandlers = [];
        this.callNotificationHandlers.push(handler);
        return () => {
            this.callNotificationHandlers = this.callNotificationHandlers.filter(h => h !== handler);
        };
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    getConnectionState() {
        if (!this.socket) return 'DISCONNECTED';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'CONNECTED';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'DISCONNECTED';
            default:
                return 'UNKNOWN';
        }
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;