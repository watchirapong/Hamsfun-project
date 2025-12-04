import { io, Socket } from 'socket.io-client';

interface SocketConfig {
    url: string;
    path: string;
    token: string;
}

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(config: SocketConfig): Socket {
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

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = SocketService.getInstance();
