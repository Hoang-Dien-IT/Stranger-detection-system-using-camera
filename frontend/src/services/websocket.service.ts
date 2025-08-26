import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export interface DetectionAlert {
  type: 'detection_alert';
  data: {
    camera_name: string;
    detection_type: string;
    person_name?: string;
    confidence: number;
    timestamp: string;
    image_url?: string;
  };
}

export interface SystemNotification {
  type: 'system_notification';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}


export type WebSocketMessage = DetectionAlert | SystemNotification;

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string): void {
    this.userId = userId;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      query: { user_id: userId }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('detection_alert', (data: DetectionAlert['data']) => {
      this.handleDetectionAlert(data);
    });

    this.socket.on('system_notification', (data: SystemNotification) => {
      this.handleSystemNotification(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleDetectionAlert(data: DetectionAlert['data']): void {
    const message = data.detection_type === 'stranger' 
      ? `Stranger detected at ${data.camera_name}`
      : `${data.person_name} detected at ${data.camera_name}`;

    if (data.detection_type === 'stranger') {
      toast.error(message, {
        duration: 5000,
        icon: '🚨',
      });
    } else {
      toast.success(message, {
        duration: 3000,
        icon: '👋',
      });
    }

    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('detection_alert', { detail: data }));
  }

  private handleSystemNotification(data: SystemNotification): void {
    switch (data.severity) {
      case 'error':
        toast.error(data.message);
        break;
      case 'warning':
        toast.error(data.message, { icon: '⚠️' });
        break;
      case 'success':
        toast.success(data.message);
        break;
      default:
        toast(data.message, { icon: 'ℹ️' });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('system_notification', { detail: data }));
  }

  sendMessage(message: any): void {
    if (this.socket) {
      this.socket.emit('message', message);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();