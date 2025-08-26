import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Bell,
  Users,
  Camera,
  Shield,
  Clock,
  ExternalLink,
  Eye,
  Settings,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'detection' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: 'detection' | 'system' | 'user' | 'camera' | 'security';
  metadata?: {
    camera_id?: string;
    camera_name?: string;
    person_name?: string;
    confidence?: number;
    image_url?: string;
    detection_id?: string;
    user_id?: string;
    action_url?: string;
    [key: string]: any;
  };
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  autoHide?: boolean;
  duration?: number;
}

interface NotificationSnackbarProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
  className?: string;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onClearAll,
  position = 'top-right',
  maxVisible = 5,
  className
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter and sort notifications
  useEffect(() => {
    const sortedNotifications = [...notifications]
      .sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    setVisibleNotifications(sortedNotifications.slice(0, isExpanded ? notifications.length : maxVisible));
  }, [notifications, maxVisible, isExpanded]);

  // Auto-hide notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    visibleNotifications.forEach((notification) => {
      if (notification.autoHide !== false && notification.type !== 'detection') {
        const duration = notification.duration || getDefaultDuration(notification.priority);
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, onDismiss]);



  const getDefaultDuration = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 10000; // 10 seconds
      case 'high': return 8000;     // 8 seconds
      case 'medium': return 6000;   // 6 seconds
      case 'low': return 4000;      // 4 seconds
      default: return 6000;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-teal-600" />;
      case 'detection':
        return <Eye className="h-5 w-5 text-cyan-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-emerald-600" />;
      default:
        return <Bell className="h-5 w-5 text-teal-600" />;
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'detection':
        return <Eye className="h-4 w-4" />;
      case 'camera':
        return <Camera className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-rose-500 bg-rose-50';
      case 'high':
        return 'border-l-amber-500 bg-amber-50';
      case 'medium':
        return 'border-l-cyan-500 bg-cyan-50';
      case 'low':
        return 'border-l-teal-500 bg-teal-50';
      default:
        return 'border-l-slate-400 bg-slate-50';
    }
  };

  const getPriorityBadgeColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'low':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  const notificationContainer = (
    <div className={cn(
      'fixed z-50 flex flex-col space-y-2 max-w-sm w-full',
      getPositionClasses(),
      className
    )}>
      {/* Header when multiple notifications */}
      {notifications.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {notifications.length} Notifications
            </span>
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {notifications.length > maxVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
              >
                {isExpanded ? 'Show Less' : `+${notifications.length - maxVisible}`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {visibleNotifications.map((notification, index) => (
          <Card
            key={notification.id}
            className={cn(
              'border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md',
              getPriorityColor(notification.priority),
              !notification.read && 'ring-2 ring-blue-200',
              'animate-in slide-in-from-right-full duration-300',
              index > 0 && 'delay-75'
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      {notification.category && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          {getCategoryIcon(notification.category)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {notification.priority !== 'low' && (
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getPriorityBadgeColor(notification.priority))}
                        >
                          {notification.priority}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Detection specific content */}
                  {notification.type === 'detection' && notification.metadata && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        {notification.metadata.camera_name && (
                          <div className="flex items-center space-x-1">
                            <Camera className="h-3 w-3" />
                            <span>{notification.metadata.camera_name}</span>
                          </div>
                        )}
                        {notification.metadata.confidence && (
                          <Badge variant="outline" className="text-xs bg-gradient-to-r from-teal-100 to-emerald-100 text-emerald-700 border-emerald-300">
                            {(notification.metadata.confidence * 100).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      
                      {notification.metadata.image_url && (
                        <div className="flex items-center space-x-2">
                          <img
                            src={notification.metadata.image_url}
                            alt="Detection"
                            className="w-12 h-12 rounded object-cover border"
                          />
                          {notification.metadata.person_name && (
                            <div>
                              <p className="text-sm font-medium">{notification.metadata.person_name}</p>
                              <p className="text-xs text-emerald-700">Đã nhận diện khuôn mặt</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* System status for system notifications */}
                  {notification.type === 'system' && notification.metadata && (
                    <div className="mb-2">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {notification.metadata.status === 'online' && (
                          <div className="flex items-center space-x-1 text-emerald-600">
                            <Wifi className="h-3 w-3" />
                            <span>Trực tuyến</span>
                          </div>
                        )}
                        {notification.metadata.status === 'offline' && (
                          <div className="flex items-center space-x-1 text-rose-600">
                            <WifiOff className="h-3 w-3" />
                            <span>Mất kết nối</span>
                          </div>
                        )}
                        {notification.metadata.cpu_usage && (
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3" />
                            <span>CPU: {notification.metadata.cpu_usage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(notification.timestamp)}</span>
                    </div>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {notification.actions.slice(0, 2).map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.variant || "outline"}
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.action();
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                        {notification.metadata?.action_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(notification.metadata?.action_url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show more indicator */}
      {!isExpanded && notifications.length > maxVisible && (
        <Card className="border-dashed border-2 border-teal-300 bg-gradient-to-r from-teal-50 to-emerald-50">
          <CardContent className="p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-sm text-emerald-700"
            >
              Hiển thị thêm {notifications.length - maxVisible} thông báo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return createPortal(notificationContainer, document.body);
};

export default NotificationSnackbar;

// Hook for using notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after duration if specified
    if (newNotification.autoHide !== false) {
      const duration = newNotification.duration || 6000;
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, duration);
    }

    return newNotification.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Utility functions for common notification types
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      priority: 'medium',
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      priority: 'high',
      autoHide: false,
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      priority: 'medium',
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      priority: 'low',
      ...options,
    });
  }, [addNotification]);

  const showDetection = useCallback((
    detectionType: 'known_person' | 'stranger',
    personName: string,
    cameraName: string,
    confidence: number,
    imageUrl?: string,
    options?: Partial<Notification>
  ) => {
    const isStranger = detectionType === 'stranger';
    
    return addNotification({
      type: 'detection',
      category: 'detection',
      title: isStranger ? '⚠️ Unknown Person Detected' : '✅ Known Person Detected',
      message: isStranger 
        ? `Unknown person detected at ${cameraName}` 
        : `${personName} detected at ${cameraName}`,
      priority: isStranger ? 'high' : 'medium',
      metadata: {
        person_name: personName,
        camera_name: cameraName,
        confidence,
        image_url: imageUrl,
        detection_type: detectionType,
      },
      autoHide: isStranger ? false : true, // Strangers require manual dismiss
      actions: isStranger ? [
        {
          label: 'View Details',
          action: () => {
            // Navigate to detection details
            window.location.href = `/detections?filter=${detectionType}`;
          },
          variant: 'default'
        },
        {
          label: 'Add Person',
          action: () => {
            // Navigate to add person page
            window.location.href = '/persons/new';
          },
          variant: 'outline'
        }
      ] : [
        {
          label: 'View Camera',
          action: () => {
            // Navigate to camera view
            window.location.href = `/cameras/${options?.metadata?.camera_id}`;
          },
          variant: 'outline'
        }
      ],
      ...options,
    });
  }, [addNotification]);

  const showSystemAlert = useCallback((
    alertType: 'camera_offline' | 'high_cpu' | 'storage_full' | 'connection_lost',
    message: string,
    metadata?: any,
    options?: Partial<Notification>
  ) => {
    const alertConfig = {
      camera_offline: {
        title: '📹 Camera Offline',
        priority: 'high' as const,
        category: 'camera' as const,
      },
      high_cpu: {
        title: '⚡ High CPU Usage',
        priority: 'medium' as const,
        category: 'system' as const,
      },
      storage_full: {
        title: '💾 Storage Full',
        priority: 'critical' as const,
        category: 'system' as const,
      },
      connection_lost: {
        title: '🔌 Connection Lost',
        priority: 'high' as const,
        category: 'system' as const,
      }
    };
  
    const config = alertConfig[alertType];
  
    return addNotification({
      type: 'system',
      title: config.title,
      message,
      priority: config.priority,
      category: config.category,
      metadata,
      autoHide: config.priority !== 'critical',
      ...options,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
    markAllAsRead,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDetection,
    showSystemAlert,
  };
};

// Add to useNotifications hook
const useNotificationsWithWebSocket = () => {
  const notifications = useNotifications();
  
  useEffect(() => {
    // Listen for WebSocket events
    const handleDetectionAlert = (event: CustomEvent) => {
      const data = event.detail;
      notifications.showDetection(
        data.detection_type,
        data.person_name || 'Unknown Person',
        data.camera_name,
        data.confidence,
        data.image_url,
        {
          metadata: {
            detection_id: data.detection_id,
            camera_id: data.camera_id,
          }
        }
      );
    };

    const handleCameraStatus = (event: CustomEvent) => {
      const data = event.detail;
      if (data.status === 'offline') {
        notifications.showSystemAlert(
          'camera_offline',
          `Camera "${data.camera_name}" has gone offline`,
          { camera_id: data.camera_id }
        );
      }
    };

    const handleSystemHealth = (event: CustomEvent) => {
      const data = event.detail;
      if (data.cpu_usage > 90) {
        notifications.showSystemAlert(
          'high_cpu',
          `System CPU usage is at ${data.cpu_usage}%`,
          { cpu_usage: data.cpu_usage }
        );
      }
    };

    window.addEventListener('detection_alert', handleDetectionAlert as EventListener);
    window.addEventListener('camera_status', handleCameraStatus as EventListener);
    window.addEventListener('system_health', handleSystemHealth as EventListener);

    return () => {
      window.removeEventListener('detection_alert', handleDetectionAlert as EventListener);
      window.removeEventListener('camera_status', handleCameraStatus as EventListener);
      window.removeEventListener('system_health', handleSystemHealth as EventListener);
    };
  }, [notifications]);

  return notifications;
};

export { useNotificationsWithWebSocket };