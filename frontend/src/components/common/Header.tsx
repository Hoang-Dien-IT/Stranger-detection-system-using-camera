import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  Camera,
  Users,
  Eye,
  ChevronDown,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  HelpCircle,
  Keyboard,
  Plus,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cameraService } from '@/services/camera.service';
import { personService } from '@/services/person.service';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'camera' | 'person' | 'detection' | 'page';
  url: string;
  description?: string;
  icon?: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  sidebarOpen = true, 
  sidebarCollapsed = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isConnected, connectionState, lastMessage } = useWebSocketContext();

  // State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSearching, setIsSearching] = useState(false);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Apply theme class to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle WebSocket notifications
  useEffect(() => {
    if (lastMessage) {
      // ✅ FIX: lastMessage is already an object, no need to JSON.parse
      if (lastMessage.type === 'detection_alert' || lastMessage.type === 'system_notification') {
        handleNewNotification({
          id: Date.now().toString(),
          title: lastMessage.type === 'detection_alert' ? 'Detection Alert' : 'System Notification',
          message: lastMessage.data?.message || lastMessage.message || 'New notification received',
          type: lastMessage.type === 'detection_alert' ? 'warning' : 'info',
          timestamp: new Date().toISOString(),
          read: false,
          action: lastMessage.type === 'detection_alert' ? {
            label: 'View Detection',
            url: '/app/detections' // ✅ FIX: Add /app prefix
          } : undefined
        });
      }
    }
  }, [lastMessage]);

  // Search functionality
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      
      // Escape to close search
      if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Listen for custom events from WebSocket context
  useEffect(() => {
    const handleDetectionAlert = (event: CustomEvent) => {
      const data = event.detail;
      handleNewNotification({
        id: data.detection_id || Date.now().toString(),
        title: 'Face Detection Alert',
        message: data.detection_type === 'stranger' 
          ? `Unknown person detected at ${data.camera_name}`
          : `${data.person_name} detected at ${data.camera_name}`,
        type: data.detection_type === 'stranger' ? 'warning' : 'info',
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        action: {
          label: 'View Details',
          url: `/detections?filter=camera_${data.camera_id}`
        }
      });
    };

    const handleCameraStatus = (event: CustomEvent) => {
      const data = event.detail;
      if (data.status === 'offline') {
        handleNewNotification({
          id: `camera_${data.camera_id}_${Date.now()}`,
          title: 'Camera Status Alert',
          message: `Camera "${data.camera_name || 'Unknown'}" has gone offline`,
          type: 'error',
          timestamp: new Date().toISOString(),
          read: false,
          action: {
            label: 'Check Camera',
            url: `/cameras/${data.camera_id}`
          }
        });
      }
    };

    window.addEventListener('detection_alert', handleDetectionAlert as EventListener);
    window.addEventListener('camera_status', handleCameraStatus as EventListener);

    return () => {
      window.removeEventListener('detection_alert', handleDetectionAlert as EventListener);
      window.removeEventListener('camera_status', handleCameraStatus as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      // Initialize with some default notifications
      const initialNotifications: Notification[] = [
        {
          id: 'welcome',
          title: 'Welcome to Face Recognition SaaS',
          message: 'Your system is ready for face detection and recognition',
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      
      setNotifications(initialNotifications);
      setUnreadCount(initialNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results: SearchResult[] = [];
  
      // Search cameras (already correct)
      try {
        const cameras = await cameraService.getCameras();
        const matchingCameras = cameras
          .filter(camera => 
            camera.name.toLowerCase().includes(query.toLowerCase()) ||
            camera.location?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map(camera => ({
            id: `camera_${camera.id}`,
            title: camera.name,
            type: 'camera' as const, // ✅ Already correct
            url: `/cameras/${camera.id}`,
            description: `${camera.location || 'No location'} - ${camera.is_active ? 'Active' : 'Inactive'}`,
            icon: <Camera className="h-4 w-4" />
          }));
        results.push(...matchingCameras);
      } catch (error) {
        console.error('Error searching cameras:', error);
      }
  
      // Search persons (already correct)
      try {
        const persons = await personService.getPersons();
        const matchingPersons = persons
          .filter(person => 
            person.name.toLowerCase().includes(query.toLowerCase()) ||
            person.description?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map(person => ({
            id: `person_${person.id}`,
            title: person.name,
            type: 'person' as const, // ✅ Already correct
            url: `/persons/${person.id}`,
            description: person.description || 'Known person',
            icon: <User className="h-4 w-4" />
          }));
        results.push(...matchingPersons);
      } catch (error) {
        console.error('Error searching persons:', error);
      }
  
      // Add page results (FIX: Add 'as const' to type)
      const pageResults: SearchResult[] = [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'page' as const, // Add 'as const' to ensure literal type
          url: '/dashboard',
          description: 'System overview and analytics',
          icon: <BarChart3 className="h-4 w-4" />
        },
        {
          id: 'detections',
          title: 'Detection Logs',
          type: 'page' as const, // Add 'as const'
          url: '/detections',
          description: 'View all face detection logs',
          icon: <Eye className="h-4 w-4" />
        },
        {
          id: 'settings',
          title: 'Settings',
          type: 'page' as const, // Add 'as const'
          url: '/settings',
          description: 'System and user preferences',
          icon: <Settings className="h-4 w-4" />
        }
      ].filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.description.toLowerCase().includes(query.toLowerCase())
      );
  
      results.push(...pageResults);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep max 20 notifications
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification for important alerts
    if (notification.type === 'error' || notification.type === 'warning') {
      toast(notification.title, {
        description: notification.message,
        action: notification.action ? {
          label: notification.action.label,
          onClick: () => navigate(notification.action!.url)
        } : undefined
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success(`Switched to ${newTheme} theme`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (true) {
      case path === '/dashboard': return 'Dashboard';
      case path === '/cameras': return 'Cameras';
      case path === '/persons': return 'Known Persons';
      case path === '/detections': return 'Detection Logs';
      case path === '/analytics': return 'Analytics';
      case path === '/settings': return 'Settings';
      case path.startsWith('/admin'): return 'Administration';
      case path.startsWith('/cameras/'): return 'Camera Details';
      case path.startsWith('/persons/'): return 'Person Details';
      case path.startsWith('/settings/'): return 'Settings';
      default: return 'Face Recognition SaaS';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return '💡';
      default: return '📢';
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>

        {/* Connection Status */}
        <div className="hidden lg:flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Search cameras, persons...</span>
              <span className="sm:hidden">Search...</span>
              <kbd className="hidden sm:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="center">
            <Command>
              <CommandInput
                placeholder="Search cameras, persons, pages..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {isSearching ? (
                  <CommandEmpty>
                    <div className="flex items-center justify-center py-4">
                      <Activity className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </div>
                  </CommandEmpty>
                ) : searchResults.length === 0 && searchQuery ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <CommandGroup heading="Results">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => {
                              navigate(result.url);
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            {result.icon}
                            <div className="ml-2">
                              <div className="font-medium">{result.title}</div>
                              {result.description && (
                                <div className="text-sm text-muted-foreground">
                                  {result.description}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {searchQuery.length === 0 && (
                      <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => {
                          navigate('/cameras/new');
                          setSearchOpen(false);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Camera
                        </CommandItem>
                        <CommandItem onSelect={() => {
                          navigate('/persons/new');
                          setSearchOpen(false);
                        }}>
                          <Users className="h-4 w-4 mr-2" />
                          Add New Person
                        </CommandItem>
                        <CommandItem onSelect={() => {
                          navigate('/detections');
                          setSearchOpen(false);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Recent Detections
                        </CommandItem>
                        <CommandItem onSelect={() => {
                          navigate('/analytics');
                          setSearchOpen(false);
                        }}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Quick Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cameras/new')}
          className="hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Camera
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    onClick={() => {
                      markNotificationAsRead(notification.id);
                      if (notification.action) {
                        navigate(notification.action.url);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start space-x-2">
                        <span className="text-sm">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </div>
                          {notification.action && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                              {notification.action.label} →
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatNotificationTime(notification.timestamp)}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                
                {notifications.length > 10 && (
                  <DropdownMenuItem
                    className="text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Avatar className="h-8 w-8">
                {(() => {
                  let avatarSrc: string | undefined = undefined;
                  const AVATAR_BASE_URL = "http://localhost:8000";
                  if (user?.avatar_url) {
                    if (user.avatar_url.startsWith('http')) {
                      avatarSrc = user.avatar_url;
                    } else if (user.avatar_url.startsWith('/uploads/avatars/')) {
                      avatarSrc = AVATAR_BASE_URL + user.avatar_url;
                    } else {
                      avatarSrc = AVATAR_BASE_URL + '/uploads/avatars/' + user.avatar_url;
                    }
                  }
                  // eslint-disable-next-line no-console
                  console.log('Header Avatar URL:', user?.avatar_url, '-> src:', avatarSrc);
                  return <AvatarImage src={avatarSrc || '/default-avatar.png'} alt={user?.full_name} onError={e => (e.currentTarget.src = '/default-avatar.png')} />;
                })()}
                <AvatarFallback className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <div className="font-medium text-emerald-700">{user?.full_name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</div>
                {user?.is_admin && (
                  <Badge variant="secondary" className="w-fit text-xs bg-gradient-to-r from-teal-100 to-emerald-100 text-emerald-700 border-emerald-300">
                    <Shield className="h-3 w-3 mr-1 text-emerald-600" />
                    Quản trị viên
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/app/profile')}>
              <User className="h-4 w-4 mr-2 text-emerald-600" />
              Thông tin cá nhân
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <Settings className="h-4 w-4 mr-2 text-teal-600" />
              Tuỳ chỉnh giao diện
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setSearchOpen(true)}>
              <Keyboard className="h-4 w-4 mr-2 text-cyan-600" />
              Phím tắt
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/app/help')}>
              <HelpCircle className="h-4 w-4 mr-2 text-emerald-600" />
              Trợ giúp & Hỗ trợ
            </DropdownMenuItem>
            
            {user?.is_admin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2 text-emerald-600" />
                  Quản trị hệ thống
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-600 dark:text-rose-400">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;