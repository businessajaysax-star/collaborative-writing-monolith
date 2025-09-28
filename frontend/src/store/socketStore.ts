import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  notifications: any[];
  
  // Actions
  connectSocket: () => void;
  disconnectSocket: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  notifications: [],

  connectSocket: () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('Socket disconnected');
    });

    socket.on('notification:new', (notification) => {
      get().addNotification(notification);
    });

    socket.on('content:update', (data) => {
      console.log('Content updated:', data);
    });

    socket.on('comment:added', (data) => {
      console.log('Comment added:', data);
    });

    socket.on('review:assigned', (data) => {
      console.log('Review assigned:', data);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  emit: (event: string, data: any) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  },

  on: (event: string, callback: (data: any) => void) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event: string, callback?: (data: any) => void) => {
    const { socket } = get();
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },

  addNotification: (notification: any) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));


