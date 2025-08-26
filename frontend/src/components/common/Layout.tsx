import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Camera,
  Users,
  Eye,
  Activity,
  Settings,
  Bell,
  Home,
  User,
  Shield,
  Database,
  BarChart3,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  CircleDot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import NotificationSnackbar, { useNotificationsWithWebSocket } from '@/components/common/NotificationSnackbar';
import Header from '@/components/common/Header';
// import { toast } from 'sonner';

interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
}

interface NavigationItemType {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  subItems?: NavigationItemType[];
  permission?: string;
}

interface SystemStatus {
  cameras_online: number;
  cameras_total: number;
  active_detections: number;
  system_health: 'healthy' | 'warning' | 'critical';
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  network_status: 'connected' | 'disconnected' | 'unstable';
  last_backup?: string;
  uptime?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isConnected, connectionState } = useWebSocketContext();
  const notifications = useNotificationsWithWebSocket();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cameras_online: 0,
    cameras_total: 0,
    active_detections: 0,
    system_health: 'healthy',
    cpu_usage: 0,
    memory_usage: 0,
    storage_usage: 0,
    network_status: 'disconnected'
  });

  // Navigation items for Face Recognition SaaS
  const navigationItems: NavigationItemType[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: <Home className="h-5 w-5 text-teal-600" />,
      href: '/dashboard',
    },
    {
      id: 'cameras',
      label: 'Camera',
      icon: <Camera className="h-5 w-5 text-emerald-600" />,
      href: '/cameras',
      badge: systemStatus.cameras_online > 0 ? systemStatus.cameras_online : undefined,
      subItems: [
        { id: 'cameras-list', label: 'Danh sách camera', icon: <Camera className="h-4 w-4 text-emerald-600" />, href: '/cameras' },
        { id: 'cameras-add', label: 'Thêm camera', icon: <Plus className="h-4 w-4 text-teal-600" />, href: '/cameras/new' },
        { id: 'cameras-streaming', label: 'Xem trực tiếp', icon: <Play className="h-4 w-4 text-cyan-600" />, href: '/cameras/streaming' },
      ]
    },
    {
      id: 'persons',
      label: 'Người đã biết',
      icon: <Users className="h-5 w-5 text-cyan-600" />,
      href: '/persons',
      subItems: [
        { id: 'persons-list', label: 'Danh sách người', icon: <Users className="h-4 w-4 text-cyan-600" />, href: '/persons' },
        { id: 'persons-add', label: 'Thêm người', icon: <Plus className="h-4 w-4 text-teal-600" />, href: '/persons/new' },
        { id: 'persons-bulk', label: 'Nhập khẩu hàng loạt', icon: <Upload className="h-4 w-4 text-emerald-600" />, href: '/persons/bulk-import' },
      ]
    },
    {
      id: 'detections',
      label: 'Nhật ký nhận diện',
      icon: <Eye className="h-5 w-5 text-emerald-600" />,
      href: '/detections',
      badge: systemStatus.active_detections > 0 ? systemStatus.active_detections : undefined,
      subItems: [
        { id: 'detections-recent', label: 'Nhận diện gần đây', icon: <Clock className="h-4 w-4 text-cyan-600" />, href: '/detections' },
        { id: 'detections-strangers', label: 'Người lạ', icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, href: '/detections?filter=strangers' },
        { id: 'detections-known', label: 'Người đã biết', icon: <CheckCircle className="h-4 w-4 text-emerald-600" />, href: '/detections?filter=known' },
      ]
    },
    {
      id: 'analytics',
      label: 'Phân tích',
      icon: <BarChart3 className="h-5 w-5 text-cyan-600" />,
      href: '/analytics',
      subItems: [
        { id: 'analytics-overview', label: 'Tổng quan', icon: <BarChart3 className="h-4 w-4 text-cyan-600" />, href: '/analytics' },
        { id: 'analytics-reports', label: 'Báo cáo', icon: <FileText className="h-4 w-4 text-emerald-600" />, href: '/analytics/reports' },
        { id: 'analytics-trends', label: 'Xu hướng', icon: <Activity className="h-4 w-4 text-teal-600" />, href: '/analytics/trends' },
        { id: 'analytics-heatmap', label: 'Bản đồ nhiệt', icon: <Activity className="h-4 w-4 text-amber-500" />, href: '/analytics/heatmap' },
      ]
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: <Settings className="h-5 w-5 text-teal-600" />,
      href: '/settings',
      subItems: [
        { id: 'settings-profile', label: 'Hồ sơ cá nhân', icon: <User className="h-4 w-4 text-emerald-600" />, href: '/settings/profile' },
        { id: 'settings-preferences', label: 'Tuỳ chỉnh', icon: <Settings className="h-4 w-4 text-teal-600" />, href: '/settings/preferences' },
        { id: 'settings-notifications', label: 'Thông báo', icon: <Bell className="h-4 w-4 text-cyan-600" />, href: '/settings/notifications' },
        { id: 'settings-security', label: 'Bảo mật', icon: <Shield className="h-4 w-4 text-emerald-600" />, href: '/settings/security' },
      ]
    },
    {
      id: 'admin',
      label: 'Quản trị',
      icon: <Shield className="h-5 w-5 text-emerald-600" />,
      href: '/admin',
      permission: 'admin',
      subItems: [
        { id: 'admin-dashboard', label: 'Bảng điều khiển', icon: <Shield className="h-4 w-4 text-emerald-600" />, href: '/admin' },
        { id: 'admin-users', label: 'Quản lý người dùng', icon: <Users className="h-4 w-4 text-cyan-600" />, href: '/admin/users' },
        { id: 'admin-system', label: 'Tình trạng hệ thống', icon: <Activity className="h-4 w-4 text-amber-500" />, href: '/admin/system' },
        { id: 'admin-logs', label: 'Nhật ký hệ thống', icon: <FileText className="h-4 w-4 text-emerald-600" />, href: '/admin/logs' },
        { id: 'admin-backup', label: 'Sao lưu & Phục hồi', icon: <Database className="h-4 w-4 text-teal-600" />, href: '/admin/backup' },
      ]
    },
  ];

  // Filter navigation based on permissions
  const filteredNavigation = navigationItems.filter(item => {
    if (!item.permission) return true;
    if (!user) return false;
    if (user.is_admin) return true;
    return user.permissions?.includes(item.permission) || false;
  });

  // WebSocket event handlers
  useEffect(() => {
    const handleSystemHealth = (event: CustomEvent) => {
      const data = event.detail;
      setSystemStatus(prev => ({
        ...prev,
        system_health: (data.status as 'healthy' | 'warning' | 'critical') || prev.system_health,
        cpu_usage: typeof data.cpu_usage === 'number' ? data.cpu_usage : prev.cpu_usage,
        memory_usage: typeof data.memory_usage === 'number' ? data.memory_usage : prev.memory_usage,
        storage_usage: typeof data.storage_usage === 'number' ? data.storage_usage : prev.storage_usage,
        network_status: isConnected ? 'connected' : 'disconnected',
        last_backup: data.last_backup || prev.last_backup,
        uptime: typeof data.uptime === 'number' ? data.uptime : prev.uptime,
      }));
    };

    const handleCameraStatus = (event: CustomEvent) => {
      const data = event.detail;
      setSystemStatus(prev => ({
        ...prev,
        cameras_online: typeof data.cameras_online === 'number' ? data.cameras_online : prev.cameras_online,
        cameras_total: typeof data.cameras_total === 'number' ? data.cameras_total : prev.cameras_total,
      }));
    };

    const handleDetectionAlert = (event: CustomEvent) => {
      const data = event.detail;
      setSystemStatus(prev => ({
        ...prev,
        active_detections: typeof data.active_detections === 'number' ? data.active_detections : prev.active_detections,
      }));
    };

    window.addEventListener('system_health', handleSystemHealth as EventListener);
    window.addEventListener('camera_status', handleCameraStatus as EventListener);
    window.addEventListener('detection_alert', handleDetectionAlert as EventListener);

    return () => {
      window.removeEventListener('system_health', handleSystemHealth as EventListener);
      window.removeEventListener('camera_status', handleCameraStatus as EventListener);
      window.removeEventListener('detection_alert', handleDetectionAlert as EventListener);
    };
  }, [isConnected]);

  // Update network status
  useEffect(() => {
    setSystemStatus(prev => ({
      ...prev,
      network_status: isConnected ? 'connected' : 'disconnected'
    }));
  }, [isConnected]);

  // // Handle logout
  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate('/login');
  //     toast.success('Logged out successfully');
  //   } catch (err) {
  //     toast.error('Failed to logout');
  //   }
  // };

  // Get current page title
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    const item = navigationItems.find(item => 
      item.href === path || 
      item.subItems?.some(sub => sub.href === path) ||
      path.startsWith(item.href + '/')
    );
    
    if (item?.subItems) {
      const subItem = item.subItems.find(sub => sub.href === path || path.startsWith(sub.href + '/'));
      if (subItem) return subItem.label;
    }
    
    return item?.label || 'Dashboard';
  };

  // Get breadcrumb items
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];
    
    const item = navigationItems.find(item => 
      item.href === path || 
      item.subItems?.some(sub => sub.href === path) ||
      path.startsWith(item.href + '/')
    );
    
    if (item) {
      breadcrumbs.push({ label: item.label, href: item.href });
      
      if (item.subItems) {
        const subItem = item.subItems.find(sub => sub.href === path || path.startsWith(sub.href + '/'));
        if (subItem && subItem.href !== item.href) {
          breadcrumbs.push({ label: subItem.label, href: subItem.href });
        }
      }
    }
    
    return breadcrumbs;
  };

  // Get system health icon
  const getSystemHealthIcon = (health?: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CircleDot className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get connection status
  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return { color: 'text-green-600', icon: <Wifi className="h-3 w-3" />, text: 'Connected' };
      case 'connecting':
        return { color: 'text-yellow-600', icon: <Wifi className="h-3 w-3" />, text: 'Connecting...' };
      case 'error':
        return { color: 'text-red-600', icon: <WifiOff className="h-3 w-3" />, text: 'Connection Error' };
      default:
        return { color: 'text-gray-600', icon: <WifiOff className="h-3 w-3" />, text: 'Disconnected' };
    }
  };

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">FaceRecog</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">SaaS Platform</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            collapsed={sidebarCollapsed}
            currentPath={location.pathname}
          />
        ))}
      </nav>

      {/* System Status */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Status</span>
                {getSystemHealthIcon(systemStatus.system_health)}
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cameras</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {systemStatus.cameras_online}/{systemStatus.cameras_total}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CPU</span>
                  <span className={systemStatus.cpu_usage > 80 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}>
                    {systemStatus.cpu_usage}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Memory</span>
                  <span className={systemStatus.memory_usage > 85 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}>
                    {systemStatus.memory_usage}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-600 dark:text-gray-400">Network</span>
                  <div className="flex items-center space-x-1">
                    {getConnectionStatus().icon}
                    <span className={`text-xs ${getConnectionStatus().color}`}>
                      {getConnectionStatus().text}
                    </span>
                  </div>
                </div>

                {systemStatus.active_detections > 0 && (
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-600 dark:text-gray-400">Active Alerts</span>
                    <span className="text-red-500 font-medium">
                      {systemStatus.active_detections}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>;
  }

  return (
    <TooltipProvider>
      <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-30",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className={cn(
          "flex flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}>
          {/* Header */}
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
              <nav className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                {getBreadcrumbItems().map((item, index) => (
                  <React.Fragment key={item.href}>
                    {index > 0 && <ChevronRight className="h-3 w-3" />}
                    <button
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
                        index === getBreadcrumbItems().length - 1 && "text-gray-900 dark:text-gray-100 font-medium"
                      )}
                    >
                      {item.label}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getCurrentPageTitle()}
              </h1>
            </div>

            {/* Page Content */}
            {children || <Outlet />}
          </main>
        </div>

        {/* Notification Snackbar */}
        <NotificationSnackbar
          notifications={notifications.notifications}
          onDismiss={notifications.dismissNotification}
          onMarkAsRead={notifications.markAsRead}
          onClearAll={notifications.clearAll}
          position="top-right"
          maxVisible={3}
        />
      </div>
    </TooltipProvider>
  );
};

// Navigation Item Component
interface NavigationItemProps {
  item: NavigationItemType;
  collapsed: boolean;
  currentPath: string;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, collapsed, currentPath }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  
  const isActive = currentPath === item.href || 
                   item.subItems?.some(sub => sub.href === currentPath) ||
                   currentPath.startsWith(item.href + '/');
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const handleClick = () => {
    if (hasSubItems && !collapsed) {
      setExpanded(!expanded);
    } else {
      navigate(item.href);
    }
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-center relative",
              isActive && "bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-700 border-emerald-200"
            )}
            onClick={() => navigate(item.href)}
          >
            {item.icon}
            {item.badge && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
              >
                {item.badge}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-700 border-emerald-200">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start",
          isActive && "bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-700 border-emerald-200"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-2 flex-1">
          {item.icon}
          <span className="truncate">{item.label}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {item.badge && (
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              {item.badge}
            </Badge>
          )}
          {hasSubItems && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "transform rotate-180"
              )}
            />
          )}
        </div>
      </Button>

      {hasSubItems && expanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-4">
          {item.subItems?.map((subItem) => (
            <Button
              key={subItem.id}
              variant={currentPath === subItem.href || currentPath.startsWith(subItem.href + '/') ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start text-sm",
                (currentPath === subItem.href || currentPath.startsWith(subItem.href + '/')) && 
                "bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-700 border-emerald-200"
              )}
              onClick={() => navigate(subItem.href)}
            >
              <div className="flex items-center space-x-2">
                {subItem.icon}
                <span className="truncate">{subItem.label}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Layout;