/**
 * Socket Service with Singleton pattern
 * Optimized for 10,000+ concurrent users
 */

import { io } from 'socket.io-client';

/**
 * Socket Service - Singleton pattern for WebSocket management
 */
class SocketService {
  constructor() {
    this.socket = null;
  }

  static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(config) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(config.url, {
      path: config.path,
      transports: ['websocket'],
      auth: {
        token: config.token,
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Connection Error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected:', reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = SocketService.getInstance();

