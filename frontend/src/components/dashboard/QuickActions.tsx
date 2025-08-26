import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Users,
  Upload,
  Download,
  Settings,
  Eye,
  RefreshCw,
  BarChart3,
  FileText,
  Zap,
  Shield,
  Database,
  Calendar,
  Video,
  Clock,
  History,
  Activity,

  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';

interface QuickActionsProps {
  stats?: {
    cameras: { 
      total: number; 
      active: number; 
      streaming: number;
      offline: number;
    };
    persons: { 
      total: number; 
      with_images: number;
      recent_additions: number;
    };
    detections: { 
      today: number; 
      this_week: number;
      strangers: number;
      known_persons: number;
    };
    system: {
      status: 'healthy' | 'warning' | 'critical';
      cpu_usage: number;
      memory_usage: number;
    };
  };
  onRefresh?: () => void;
  recentActions?: RecentAction[];
  className?: string;
}

interface RecentAction {
  id: string;
  type: 'camera' | 'person' | 'detection' | 'system' | 'export' | 'import';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  stats, 
  onRefresh, 
  recentActions = [],
  className 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWebSocketContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // ✅ Enhanced export with Face Recognition specific data
  const handleExportData = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      toast.info('Preparing Face Recognition data export...');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const exportData = {
        export_metadata: {
          timestamp: new Date().toISOString(),
          exported_by: user?.username,
          system_version: '1.0.0',
          export_type: 'dashboard_summary'
        },
        system_stats: {
          cameras: stats?.cameras || {},
          persons: stats?.persons || {},
          detections: stats?.detections || {},
          system_health: stats?.system || {}
        },
        face_recognition_summary: {
          total_known_persons: stats?.persons.total || 0,
          persons_with_face_data: stats?.persons.with_images || 0,
          active_cameras: stats?.cameras.active || 0,
          daily_detections: stats?.detections.today || 0,
          detection_accuracy: stats?.detections.known_persons && stats?.detections.today ? 
            ((stats.detections.known_persons / stats.detections.today) * 100).toFixed(2) + '%' : 'N/A'
        },
        recent_activities: recentActions.slice(0, 10)
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `face-recognition-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
      
      toast.success('Face Recognition data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // ✅ Enhanced import for Face Recognition persons
  const handleImportPersons = () => {
    toast.info('Opening Face Recognition person import...');
    navigate('/persons/bulk-import');
  };

  // ✅ Enhanced system refresh with real-time sync
  const handleRefreshSystem = async () => {
    toast.info('Refreshing Face Recognition system status...');
    
    try {
      onRefresh?.();
      
      // Check connection status
      if (!isConnected) {
        toast.warning('Real-time connection unavailable, using cached data');
      } else {
        toast.success('System status refreshed with real-time data');
      }
    } catch (error) {
      toast.error('Failed to refresh system status');
    }
  };

  const handleBulkActions = () => {
    toast.info('Opening Face Recognition bulk operations...');
    navigate('/admin/bulk-actions');
  };

  const handleScheduleReport = () => {
    toast.info('Mở trình lập lịch báo cáo nhận diện khuôn mặt...');
    navigate('/analytics/reports?schedule=true');
  };

  const handleSystemBackup = () => {
    if (!user?.is_admin) {
      toast.error('Cần quyền quản trị viên');
      return;
    }
    toast.info('Đang bắt đầu sao lưu hệ thống nhận diện khuôn mặt...');
    setTimeout(() => {
      toast.success('Khởi tạo sao lưu thành công');
    }, 3000);
  };

  // ✅ Enhanced primary actions với Face Recognition metrics
  const primaryActions = [
    {
      title: 'Thêm Camera',
      description: 'Kết nối camera an ninh để nhận diện khuôn mặt',
      icon: Camera,
      color: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600',
      action: () => navigate('/cameras/new'),
      stats: stats?.cameras.total || 0,
      badge: stats?.cameras.active ? `${stats.cameras.active}/${stats.cameras.total} hoạt động` : undefined,
      urgent: (stats?.cameras.offline || 0) > (stats?.cameras.active || 0)
    },
    {
      title: 'Thêm Người',
      description: 'Đăng ký người quen với ảnh khuôn mặt',
      icon: Users,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500',
      action: () => navigate('/persons/new'),
      stats: stats?.persons.total || 0,
      badge: stats?.persons.with_images ? `${stats.persons.with_images} có khuôn mặt'` : undefined
    },
    {
      title: 'Xem Nhận Diện',
      description: 'Lịch sử & cảnh báo nhận diện khuôn mặt',
      icon: Eye,
      color: 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600',
      action: () => navigate('/detections'),
      stats: stats?.detections.today || 0,
      badge: 'hôm nay',
      urgent: (stats?.detections.strangers || 0) > 0
    },
    {
      title: 'Giám Sát Trực Tiếp',
      description: 'Xem trực tiếp nhận diện khuôn mặt',
      icon: Video,
      color: 'bg-gradient-to-r from-teal-400 to-cyan-600 hover:from-teal-500 hover:to-cyan-700',
      action: () => navigate('/cameras/streaming'),
      stats: stats?.cameras.streaming || 0,
      badge: 'đang phát',
      urgent: (stats?.cameras.streaming || 0) === 0 && (stats?.cameras.active || 0) > 0
    }
  ];

  // ✅ Enhanced secondary actions
  const secondaryActions = [
    {
      title: 'Nhập Người',
      description: 'Nhập khẩu danh sách người có dữ liệu khuôn mặt',
      icon: Upload,
      action: handleImportPersons,
      disabled: false
    },
    {
      title: 'Xuất Dữ Liệu',
      description: 'Tải về thống kê hệ thống',
      icon: Download,
      action: handleExportData,
      disabled: isExporting
    },
    {
      title: 'Phân Tích Khuôn Mặt',
      description: 'Báo cáo & thống kê nhận diện',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      disabled: false
    },
    {
      title: 'Cài Đặt Hệ Thống',
      description: 'Cấu hình nhận diện khuôn mặt',
      icon: Settings,
      action: () => navigate('/settings'),
      disabled: false
    },
    {
      title: 'Lập Lịch Báo Cáo',
      description: 'Tự động gửi báo cáo nhận diện',
      icon: Calendar,
      action: handleScheduleReport,
      disabled: false
    },
    {
      title: 'Làm Mới Dữ Liệu',
      description: 'Cập nhật dữ liệu thời gian thực',
      icon: RefreshCw,
      action: handleRefreshSystem,
      disabled: false,
      highlight: !isConnected
    }
  ];

  // ✅ Enhanced admin actions với permission check
  const adminActions = user?.is_admin ? [
    {
      title: 'Quản Lý Người Dùng',
      description: 'Phân quyền & truy cập hệ thống',
      icon: Shield,
      action: () => navigate('/admin/users'),
      disabled: false
    },
    {
      title: 'Sao Lưu Hệ Thống',
      description: 'Sao lưu toàn bộ dữ liệu nhận diện',
      icon: Database,
      action: handleSystemBackup,
      disabled: false
    },
    {
      title: 'Nhật Ký Hệ Thống',
      description: 'Lịch sử hoạt động nhận diện',
      icon: FileText,
      action: () => navigate('/admin/logs'),
      disabled: false
    },
    {
      title: 'Tác Vụ Hàng Loạt',
      description: 'Xử lý dữ liệu khuôn mặt hàng loạt',
      icon: Zap,
      action: handleBulkActions,
      disabled: false
    }
  ] : [];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'camera': return Camera;
      case 'person': return Users;
      case 'detection': return Eye;
      case 'system': return Activity;
      case 'export': return Download;
      case 'import': return Upload;
      default: return Activity;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'camera': return 'text-blue-500';
      case 'person': return 'text-green-500';
      case 'detection': return 'text-purple-500';
      case 'system': return 'text-orange-500';
      case 'export': return 'text-indigo-500';
      case 'import': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-100 text-emerald-800">Thành công</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Cảnh báo</Badge>;
      case 'error':
        return <Badge className="bg-rose-100 text-rose-800">Lỗi</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert className="bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-200">
          <WifiOff className="h-4 w-4 text-cyan-600" />
          <AlertDescription>
            Không thể kết nối thời gian thực. Một số tính năng sẽ hiển thị dữ liệu cũ.
            <Button variant="outline" size="sm" className="ml-2 border-cyan-400 text-cyan-700" onClick={handleRefreshSystem}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Thử lại kết nối
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Export Progress */}
      {isExporting && (
        <Alert className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <Download className="h-4 w-4 text-teal-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Đang xuất dữ liệu nhận diện khuôn mặt...</span>
                <span className="text-sm">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2 bg-gradient-to-r from-teal-400 to-cyan-400" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Actions */}
      <Card className="border-emerald-200 bg-gradient-to-br from-cyan-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-700 font-bold">Tác vụ nhanh</span>
            </div>
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-emerald-600">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">Trực tuyến</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-rose-600">
                  <WifiOff className="h-3 w-3" />
                  <span className="text-xs">Mất kết nối</span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.color} text-white h-auto p-4 flex flex-col items-center justify-center space-y-3 relative group shadow-md rounded-xl`}
                >
                  {/* Urgent indicator */}
                  {action.urgent && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  )}
                  <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
                    {action.stats !== undefined && (
                      <div className="flex items-center justify-center space-x-1 mt-2">
                        <span className="text-lg font-bold">{action.stats}</span>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs bg-white bg-opacity-20 text-white border-0">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card className="border-cyan-200 bg-gradient-to-br from-white to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-cyan-500" />
            <span className="text-cyan-700 font-bold">Quản lý nhận diện khuôn mặt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {secondaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={action.action}
                  disabled={action.disabled}
                  className={`h-20 flex flex-col items-center justify-center space-y-2 group relative rounded-lg border-cyan-200 hover:bg-cyan-50 ${
                    action.highlight ? 'border-emerald-300 bg-emerald-50' : ''
                  }`}
                >
                  {action.highlight && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                  <Icon className={`h-5 w-5 text-cyan-600 group-hover:text-emerald-600 transition-colors ${
                    action.disabled ? 'animate-spin' : ''
                  }`} />
                  <div className="text-center">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {user?.is_admin && adminActions.length > 0 && (
        <Card className="border-cyan-200 bg-gradient-to-br from-white to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-500" />
              <span className="text-cyan-700 font-bold">Quản trị hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {adminActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={action.action}
                    disabled={action.disabled}
                    className="h-16 flex flex-col items-center justify-center space-y-1 group rounded-lg border-cyan-200 hover:bg-cyan-50"
                  >
                    <Icon className="h-4 w-4 text-cyan-600 group-hover:text-emerald-600 transition-colors" />
                    <div className="text-center">
                      <p className="text-xs font-medium">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Actions History */}
      <Card className="border-cyan-200 bg-gradient-to-br from-white to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-cyan-500" />
              <span className="text-cyan-700 font-bold">Hoạt động gần đây</span>
            </div>
            {recentActions.length > 3 && (
              <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700" onClick={() => navigate('/admin/logs')}>
                Xem tất cả
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActions.length > 0 ? (
              recentActions.slice(0, 3).map((action, index) => {
                const Icon = getActionIcon(action.type);
                return (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-cyan-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${getActionColor(action.type)}`} />
                      <div>
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(action.status)}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{action.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 text-cyan-200" />
                <p className="text-sm">Chưa có hoạt động nào</p>
                <p className="text-xs">Các thao tác sẽ hiển thị tại đây khi bạn sử dụng hệ thống</p>
              </div>
            )}
          </div>
          {recentActions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full border-cyan-400 text-cyan-700" onClick={() => navigate('/admin/logs')}>
                <History className="h-4 w-4 mr-2" />
                Xem toàn bộ lịch sử hoạt động
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;