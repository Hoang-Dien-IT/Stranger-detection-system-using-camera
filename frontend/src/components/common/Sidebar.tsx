import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useSidebarCounts } from '@/hooks/useSidebarCounts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SafeFaceLogo from '@/assets/images/SafeFace.png';
import {
  LayoutDashboard,
  Camera,
  Users,
  Settings,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus,
  Activity,
  Wifi,
  WifiOff,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
  Upload,
  TrendingUp,
  Bell,
  Lock,
  Video,
  UserPlus,
  Clock,
  AlertTriangle,
  LineChart,
  FileText,
  Calendar,
  Scan,
  Crown,
  Monitor,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  badge?: string;
  subItems?: {
    title: string;
    icon: any;
    path: string;
    badge?: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocketContext();
  const { counts } = useSidebarCounts();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // ✅ Enhanced menu structure with dynamic counts
  const menuItems: MenuItem[] = [
    {
      title: 'Tổng quan',
      icon: LayoutDashboard,
      path: '/app/dashboard',
    },
    {
      title: 'Camera',
      icon: Camera,
      path: '/app/cameras',
      badge: counts.isLoading ? '...' : counts.totalCameras.toString(),
      subItems: [
        {
          title: 'Tất cả camera',
          icon: Camera,
          path: '/app/cameras',
        },
        {
          title: 'Thêm camera',
          icon: Plus,
          path: '/app/cameras/new',
        },
        {
          title: 'Xem trực tiếp',
          icon: Video,
          path: '/app/live',
          badge: counts.isLoading ? '...' : counts.activeCameras.toString(),
        }
      ]
    },
    {
      title: 'Người đã biết',
      icon: Users,
      path: '/app/persons',
      badge: counts.isLoading ? '...' : counts.totalPersons.toString(),
      subItems: [
        {
          title: 'Tất cả người',
          icon: Users,
          path: '/app/persons',
        },
        {
          title: 'Thêm người',
          icon: UserPlus,
          path: '/app/persons/new',
        },
        // {
        //   title: 'Nhập danh sách',
        //   icon: Upload,
        //   path: '/app/persons/import',
        // }
      ]
    },
    {
      title: 'Nhận diện',
      icon: Shield,
      path: '/app/detections',
      badge: counts.isLoading ? '...' : counts.todayDetections.toString(),
      subItems: [
        {
          title: 'Lịch sử nhận diện',
          icon: Clock,
          path: '/app/detections/history',
        },
        {
          title: 'Cảnh báo',
          icon: AlertTriangle,
          path: '/app/detections/alerts',
          badge: counts.isLoading ? '...' : counts.unreadAlerts.toString(),
        }
      ]
    },
    {
      title: 'Phân tích',
      icon: BarChart3,
      path: '/app/analytics',
      subItems: [
        {
          title: 'Tổng quan',
          icon: TrendingUp,
          path: '/app/analytics/overview',
        },
        {
          title: 'Xu hướng',
          icon: LineChart,
          path: '/app/analytics/trends',
        },
        {
          title: 'Báo cáo',
          icon: FileText,
          path: '/app/analytics/reports',
        }
      ]
    },
    {
      title: 'Cài đặt',
      icon: Settings,
      path: '/app/settings',
      subItems: [
        {
          title: 'Chung',
          icon: Settings,
          path: '/app/settings/general',
        },
        {
          title: 'Nhận diện khuôn mặt',
          icon: Scan,
          path: '/app/settings/face-recognition',
        },
        {
          title: 'Thông báo',
          icon: Bell,
          path: '/app/settings/notifications',
        },
        {
          title: 'Bảo mật',
          icon: Shield,
          path: '/app/settings/security',
        }
      ]
    }
  ];

  const adminMenuItems: MenuItem[] = user?.is_admin ? [
    {
      title: 'Quản trị',
      icon: Crown,
      path: '/admin',
      subItems: [
        {
          title: 'Quản lý người dùng',
          icon: Users,
          path: '/admin/users',
        },
        {
          title: 'Giám sát hệ thống',
          icon: Monitor,
          path: '/admin/monitoring',
        },
        {
          title: 'Nhật ký hệ thống',
          icon: FileText,
          path: '/admin/logs',
        },
        {
          title: 'Sao lưu & Phục hồi',
          icon: Database,
          path: '/admin/backup',
        }
      ]
    }
  ] : [];

  const isActive = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const isExpanded = (title: string): boolean => {
    return expandedItems.includes(title);
  };

  const toggleExpanded = (title: string): void => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleNavigation = (path: string): void => {
    navigate(path);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div 
      className={cn(
        "h-screen flex flex-col transition-all duration-300 border-r sidebar-container",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
  background: 'linear-gradient(180deg, #e0fdf2 0%, #ccfbf1 40%, #a7f3d0 100%)',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* ✅ Header với Modern Design */}
      <div 
        className="p-4 border-b border-slate-200/80"
        style={{
    background: 'linear-gradient(135deg, #e0fdf2 0%, #ccfbf1 50%, #a7f3d0 100%)',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img 
              src={SafeFaceLogo} 
              alt="SafeFace Logo" 
              className="h-32 w-auto object-contain"
              onError={(e) => {
                // Fallback to original design if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'flex items-center space-x-3';
                fallback.innerHTML = `
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%)">
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10.2V11.2C15.2 11.4 15.5 11.7 15.5 12.3V16.5C15.5 17.1 15.1 17.5 14.5 17.5H9.5C8.9 17.5 8.5 17.1 8.5 16.5V12.3C8.5 11.7 8.8 11.4 9.2 11.2V10.2C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10.2V11.2H13.5V10.2C13.5 8.7 12.8 8.2 12 8.2Z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-emerald-700">SafeFace</h2>
                    <p class="text-sm text-emerald-500">Nền tảng bảo mật AI</p>
                  </div>
                `;
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 hover:bg-slate-100 border border-slate-200/50 shadow-sm"
            style={{ color: '#475569' }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ✅ Connection Status */}
      <div 
        className="px-4 py-3 border-b border-slate-200/80"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div className="flex items-center justify-between">
          {!collapsed && (
            <span className="text-sm font-semibold text-slate-700">
              {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          )}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/30"></div>
                {!collapsed && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs shadow-sm">
                    <Wifi className="w-3 h-3 mr-1" />
                    Trực tuyến
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/30"></div>
                {!collapsed && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 text-xs shadow-sm">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Ngoại tuyến
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Enhanced Navigation Menu */}
      <ScrollArea 
        className="flex-1"
        style={{
          background: 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <div className="p-4 space-y-2">
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 px-2">
                Điều hướng
              </p>
            )}
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const expanded = isExpanded(item.title);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              
              return (
                <div key={item.title}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start transition-all duration-300 shadow-sm nav-item",
                            collapsed ? "px-3" : "px-4",
                            active && "nav-item active"
                          )}
                          style={active ? {
                            background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                            color: 'white',
                            borderColor: '#10b981',
                            boxShadow: '0 8px 25px -8px rgba(16, 185, 129, 0.5)'
                          } : {
                            color: '#047857',
                            background: 'transparent',
                            border: '1px solid transparent'
                          }}
                          onClick={() => {
                            if (hasSubItems && !collapsed) {
                              toggleExpanded(item.title);
                            } else {
                              handleNavigation(item.path);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          <Icon className={cn(
                            "w-5 h-5 transition-colors",
                            collapsed ? "mx-auto" : "mr-3"
                          )} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left font-medium">{item.title}</span>
                              <div className="flex items-center space-x-2">
                                {item.badge && (
                                  <Badge 
                                    className={cn(
                                      "text-xs shadow-sm",
                                      active 
                                        ? "bg-white/20 text-white border-white/30" 
                                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                                {hasSubItems && (
                                  expanded ? 
                                    <ChevronUp className="w-4 h-4" /> : 
                                    <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="bg-slate-900 text-white shadow-xl">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* ✅ Sub Items */}
                  {hasSubItems && !collapsed && expanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = location.pathname === subItem.path || 
                                         (subItem.path.includes('?') && location.pathname + location.search === subItem.path);
                        
                        return (
                          <Button
                            key={subItem.path}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-sm transition-all duration-200",
                              subActive && "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500"
                            )}
                            style={subActive ? {
                              background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
                              color: '#047857',
                              borderLeft: '3px solid #10b981'
                            } : {
                              color: '#64748b'
                            }}
                            onClick={() => handleNavigation(subItem.path)}
                          >
                            <SubIcon className="w-4 h-4 mr-3" />
                            <span className="font-medium">{subItem.title}</span>
                            {subItem.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {subItem.badge}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ✅ Admin Menu Items */}
            {adminMenuItems.length > 0 && (
              <>
                {!collapsed && (
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 px-2 pt-4">
                    Quản trị
                  </p>
                )}
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const expanded = isExpanded(item.title);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  
                  return (
                    <div key={item.title}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start transition-all duration-300 shadow-sm nav-item",
                                collapsed ? "px-3" : "px-4",
                                active && "nav-item active"
                              )}
                              style={active ? {
                                background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                                color: 'white',
                                borderColor: '#10b981',
                                boxShadow: '0 8px 25px -8px rgba(16, 185, 129, 0.5)'
                              } : {
                                color: '#047857',
                                background: 'transparent',
                                border: '1px solid transparent'
                              }}
                              onClick={() => {
                                if (hasSubItems && !collapsed) {
                                  toggleExpanded(item.title);
                                } else {
                                  handleNavigation(item.path);
                                }
                              }}
                            >
                              <Icon className={cn("mr-3", collapsed ? "w-5 h-5" : "w-5 h-5")} />
                              {!collapsed && (
                                <>
                                  <span className="font-medium">{item.title}</span>
                                  {hasSubItems && (
                                    <ChevronDown className={cn(
                                      "ml-auto w-4 h-4 transition-transform duration-200",
                                      expanded && "rotate-180"
                                    )} />
                                  )}
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      
                      {hasSubItems && expanded && !collapsed && (
                        <div className="ml-6 mt-2 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = location.pathname === subItem.path || 
                                             (subItem.path.includes('?') && location.pathname + location.search === subItem.path);
                            
                            return (
                              <Button
                                key={subItem.path}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "w-full justify-start text-sm transition-all duration-200",
                                  subActive && "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500"
                                )}
                                style={subActive ? {
                                  background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
                                  color: '#047857',
                                  borderLeft: '3px solid #10b981'
                                } : {
                                  color: '#64748b'
                                }}
                                onClick={() => handleNavigation(subItem.path)}
                              >
                                <SubIcon className="w-4 h-4 mr-3" />
                                <span className="font-medium">{subItem.title}</span>
                                {subItem.badge && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* ✅ System Status */}
      <div 
        className="p-4 border-t border-slate-200/80"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
        }}
      >
        {!collapsed && (
          <div 
            className="p-3 rounded-xl border shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              borderColor: '#e2e8f0'
            }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-red-500"
              )}></div>
              <span className="text-sm font-semibold text-emerald-700">Trạng thái hệ thống</span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Mạng:</span>
                <span className={cn(
                  "font-medium",
                  isConnected ? "text-emerald-600" : "text-red-600"
                )}>
                  {isConnected ? "Đã kết nối" : "Mất kết nối"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Camera:</span>
                <span className="font-medium text-emerald-600">{counts.isLoading ? '...' : counts.totalCameras} hoạt động</span>
              </div>
              <div className="flex justify-between">
                <span>Nhận diện:</span>
                <span className="font-medium text-emerald-600">Đang chạy</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ User Profile */}
      <div 
        className="p-4 border-t border-slate-200/80"
        style={{
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 100%)'
        }}
      >
        <div 
          className="flex items-center space-x-3 p-3 rounded-xl border shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderColor: '#e2e8f0'
          }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.full_name || 'Người dùng'}
              </p>
              <p className="text-xs text-slate-600 truncate">
                {user?.email || 'user@email.com'}
              </p>
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 text-red-600 border border-red-200/50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "top"} className="bg-slate-900 text-white shadow-xl">
                <p>Đăng xuất</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;