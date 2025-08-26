import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionAttempts: number;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'; // ✅ ADD this
  sendMessage: (message: any) => void;
  sendPing: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected'); // ✅ ADD this
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = () => {
    if (!isAuthenticated || !user?.id) {
      console.log('❌ WebSocket: User not authenticated');
      return;
    }

    if (socket?.readyState === WebSocket.CONNECTING || socket?.readyState === WebSocket.OPEN) {
      console.log('🔗 WebSocket: Already connected or connecting');
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/api/ws/${user.id}`;
      console.log('🔗 WebSocket: Connecting to:', wsUrl);
      
      setConnectionState('connecting'); // ✅ ADD this
      
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('✅ WebSocket: Connected successfully');
        setIsConnected(true);
        setConnectionState('connected'); // ✅ ADD this
        setConnectionAttempts(0);
        
        pingIntervalRef.current = setInterval(() => {
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        if (connectionAttempts > 0) {
          toast.success('🔗 Real-time connection restored', {
            description: 'You will now receive live updates',
            duration: 3000
          });
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'connection_established':
              console.log('✅ WebSocket: Connection established');
              break;
              
            case 'detection_alert':
              console.log('🚨 WebSocket: Detection alert received', message.data);
              if (message.data) {
                toast.warning(`🚨 ${message.data.detection_type === 'stranger' ? 'Stranger' : 'Person'} Detected`, {
                  description: `${message.data.person_name || 'Unknown person'} at ${message.data.camera_name}`,
                  duration: 5000
                });
              }
              break;
              
            case 'camera_status':
              console.log('📹 WebSocket: Camera status update', message.data);
              if (message.data?.status === 'offline') {
                toast.error(`📹 Camera Offline: ${message.data.camera_name}`, {
                  description: 'Camera connection lost',
                  duration: 4000
                });
              }
              break;
              
            case 'system_alert':
              console.log('⚠️ WebSocket: System alert', message.data);
              toast.warning('⚠️ System Alert', {
                description: message.message || 'System notification',
                duration: 4000
              });
              break;
              
            case 'test_detection':
              console.log('🧪 WebSocket: Test message received');
              toast.info('🧪 WebSocket Test', {
                description: 'Connection test successful',
                duration: 3000
              });
              break;
              
            case 'pong':
              console.log('🏓 WebSocket: Pong received');
              break;
              
            default:
              console.log('📬 WebSocket: Message received:', message.type);
          }
        } catch (error) {
          console.error('❌ WebSocket: Error parsing message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('❌ WebSocket: Connection closed', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected'); // ✅ ADD this
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        if (event.code !== 1000 && connectionAttempts < maxReconnectAttempts) {
          toast.error('🔌 Connection to real-time update lost', {
            description: `Attempting to reconnect... (${connectionAttempts + 1}/${maxReconnectAttempts})`,
            duration: 3000
          });
        }
        
        if (connectionAttempts < maxReconnectAttempts && isAuthenticated) {
          const nextAttempt = connectionAttempts + 1;
          setConnectionAttempts(nextAttempt);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 WebSocket: Reconnection attempt ${nextAttempt}/${maxReconnectAttempts}`);
            connect();
          }, reconnectDelay * nextAttempt);
        } else if (connectionAttempts >= maxReconnectAttempts) {
          setConnectionState('error'); // ✅ ADD this
          toast.error('❌ Real-time connection failed', {
            description: 'Please refresh the page to restore connection',
            duration: 0
          });
        }
      };

      newSocket.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        setIsConnected(false);
        setConnectionState('error'); // ✅ ADD this
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('❌ WebSocket: Failed to create connection:', error);
      setIsConnected(false);
      setConnectionState('error'); // ✅ ADD this
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    if (socket) {
      socket.close(1000, 'Component unmounting');
      setSocket(null);
    }
    
    setIsConnected(false);
    setConnectionState('disconnected'); // ✅ ADD this
    setConnectionAttempts(0);
  };

  const sendMessage = (message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket: Cannot send message - not connected');
    }
  };

  const sendPing = () => {
    sendMessage({ type: 'ping' });
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔗 WebSocket: Starting connection for user:', user.id);
      connect();
    } else {
      console.log('❌ WebSocket: User not authenticated, disconnecting');
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    lastMessage,
    connectionAttempts,
    connectionState, // ✅ ADD this
    sendMessage,
    sendPing
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};