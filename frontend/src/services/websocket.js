import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Connect to WebSocket server
  connect(url, options = {}) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return this.socket;
    }

    const defaultOptions = {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      ...options
    };

    this.socket = io(url || process.env.REACT_APP_WEBSOCKET_URL, defaultOptions);

    // Set up event handlers
    this.setupEventHandlers();

    return this.socket;
  }

  // Set up default event handlers
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection:established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:lost', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection:failed', error);
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnection attempt', attemptNumber);
      this.emit('connection:reconnecting', attemptNumber);
    });
  }

  // Emit event to server
  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }

    return true;
  }

  // Listen for events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    // Register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    } else {
      this.listeners.clear();
      if (this.socket) {
        this.socket.removeAllListeners();
      }
    }
  }

  // Join a room
  joinRoom(room) {
    return new Promise((resolve, reject) => {
      this.emit('join', room, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Failed to join room'));
        }
      });
    });
  }

  // Leave a room
  leaveRoom(room) {
    return new Promise((resolve, reject) => {
      this.emit('leave', room, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Failed to leave room'));
        }
      });
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Notification-specific WebSocket handlers
export const notificationSocket = {
  connect: (userId, token) => {
    const socket = websocketService.connect(process.env.REACT_APP_WEBSOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      websocketService.joinRoom(`user_${userId}`);
    });

    return socket;
  },

  onNotification: (callback) => {
    websocketService.on('notification', callback);
  },

  onInventoryAlert: (callback) => {
    websocketService.on('inventory_alert', callback);
  },

  onOrderUpdate: (callback) => {
    websocketService.on('order_update', callback);
  },

  disconnect: () => {
    websocketService.disconnect();
  }
};
