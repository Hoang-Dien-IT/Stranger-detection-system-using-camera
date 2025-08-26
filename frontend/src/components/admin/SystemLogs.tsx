import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Filter,
  Calendar,
  User,
  Camera,
  Activity,
  Database,
  Shield,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { adminService } from '@/services/admin.service';
import { SystemLog } from '@/types/admin.types'; // ✅ Import unified type
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ✅ Enhanced interface dựa trên backend structure từ #backend
interface LogEntry extends SystemLog {
  // Additional frontend-specific properties if needed
  formatted_timestamp?: string;
  user_display_name?: string;
}

interface SystemLogsProps {
  onRefresh?: () => void;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ onRefresh }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLogs(true);
      }, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // ✅ Enhanced loadLogs function with proper error handling
  const loadLogs = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setRefreshing(true);
      
      console.log('🔵 SystemLogs: Đang tải nhật ký hệ thống...');
      
      // ✅ Use backend service với proper parameters
      const logsData = await adminService.getSystemLogs(100, levelFilter !== 'all' ? levelFilter : undefined, categoryFilter !== 'all' ? categoryFilter : undefined);
      
      // ✅ Transform logs với proper formatting
      const transformedLogs: LogEntry[] = logsData.map(log => ({
        ...log,
        formatted_timestamp: new Date(log.timestamp).toLocaleString(),
        user_display_name: log.user_id ? `User ${log.user_id.slice(-6)}` : undefined
      }));
      
      setLogs(transformedLogs);
      setLastUpdated(new Date());
      
      console.log('✅ SystemLogs: Đã tải', transformedLogs.length, 'nhật ký');
      
      if (!isAutoRefresh) {
        toast.success(`Đã tải ${transformedLogs.length} nhật ký hệ thống`);
      }
      
      onRefresh?.();
    } catch (error: any) {
      console.error('❌ SystemLogs: Lỗi khi tải nhật ký:', error);
      
      if (!isAutoRefresh) {
        toast.error(`Không thể tải nhật ký hệ thống: ${error.message || 'Lỗi không xác định'}`);
      }
      
      // ✅ Set fallback data để tránh crash
      if (logs.length === 0) {
        setLogs([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Enhanced export function
  const handleExportLogs = () => {
    try {
      const filteredLogs = getFilteredLogs();
      
      if (filteredLogs.length === 0) {
        toast.warning('Không có nhật ký để xuất');
        return;
      }
      
      const csvContent = [
        // ✅ Enhanced CSV headers
        ['Timestamp', 'Level', 'Category', 'Message', 'User ID', 'Camera ID', 'IP Address', 'Session ID'].join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.level,
          log.category || '',
          `"${log.message.replace(/"/g, '""')}"`,
          log.user_id || '',
          log.camera_id || '',
          log.ip_address || '',
          log.session_id || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Xuất thành công ${filteredLogs.length} nhật ký`);
    } catch (error) {
      console.error('❌ SystemLogs: Export error:', error);
      toast.error('Xuất nhật ký thất bại');
    }
  };

  // ✅ Enhanced filtering function
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.camera_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toString().toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = levelFilter === 'all' || log.level.toLowerCase() === levelFilter.toLowerCase();
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

      return matchesSearch && matchesLevel && matchesCategory;
    });
  };

  // ✅ Enhanced icon functions
  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'auth':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'camera':
        return <Camera className="h-4 w-4 text-blue-500" />;
      case 'detection':
        return <Eye className="h-4 w-4 text-orange-500" />;
      case 'user':
        return <User className="h-4 w-4 text-indigo-500" />;
      case 'api':
        return <Activity className="h-4 w-4 text-cyan-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      critical: 'bg-red-200 text-red-900 border-red-300',
      error: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      debug: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={`border ${colors[level.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      system: 'bg-purple-100 text-purple-800',
      auth: 'bg-green-100 text-green-800',
      camera: 'bg-blue-100 text-blue-800',
      detection: 'bg-orange-100 text-orange-800',
      user: 'bg-indigo-100 text-indigo-800',
      api: 'bg-cyan-100 text-cyan-800'
    };
    
    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const logTime = new Date(timestamp);
      const diffInSeconds = Math.floor((now.getTime() - logTime.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  // ✅ Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = logs.map(log => log.category).filter(Boolean);
    return [...new Set(categories)];
  };

  // ✅ Clear logs function (admin only)
  const handleClearLogs = async () => {
    try {
      setLoading(true);
      await adminService.clearSystemLogs();
      setLogs([]);
      toast.success('System logs cleared successfully');
    } catch (error: any) {
      console.error('❌ SystemLogs: Error clearing logs:', error);
      toast.error(`Failed to clear logs: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = getFilteredLogs();

  // ✅ Enhanced loading state
  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Đang tải nhật ký hệ thống...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Enhanced Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h2>
              <p className="text-gray-600">Theo dõi hoạt động và sự kiện hệ thống</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Cập nhật lần cuối: {lastUpdated.toLocaleString()} • {filteredLogs.length} nhật ký
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`shadow-sm ${autoRefresh ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Tự động làm mới
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
            className="shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadLogs()}
            disabled={refreshing}
            className="shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shadow-sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa nhật ký
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xóa toàn bộ nhật ký hệ thống</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn xóa tất cả nhật ký hệ thống? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" size="sm">
                  Hủy
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                  Xóa tất cả nhật ký
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ✅ Enhanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Bộ lọc</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm nhật ký..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                  <SelectItem value="error">Lỗi</SelectItem>
                  <SelectItem value="warning">Cảnh báo</SelectItem>
                  <SelectItem value="info">Thông tin</SelectItem>
                  <SelectItem value="debug">Gỡ lỗi</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="system">Hệ thống</SelectItem>
                  <SelectItem value="auth">Xác thực</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="detection">Phát hiện</SelectItem>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setLevelFilter('all');
                  setCategoryFilter('all');
                }}
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-red-700 font-medium">Nghiêm trọng</p>
                <p className="text-xl font-bold text-red-900">{logs.filter(l => l.level.toLowerCase() === 'critical').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-red-700 font-medium">Lỗi</p>
                <p className="text-xl font-bold text-red-900">{logs.filter(l => l.level.toLowerCase() === 'error').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Cảnh báo</p>
                <p className="text-xl font-bold text-yellow-900">{logs.filter(l => l.level.toLowerCase() === 'warning').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Thông tin</p>
                <p className="text-xl font-bold text-blue-900">{logs.filter(l => l.level.toLowerCase() === 'info').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Gỡ lỗi</p>
                <p className="text-xl font-bold text-gray-900">{logs.filter(l => l.level.toLowerCase() === 'debug').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-purple-700 font-medium">Tổng</p>
                <p className="text-xl font-bold text-purple-900">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ Enhanced Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nhật ký gần đây ({filteredLogs.length})</span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {refreshing && (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang làm mới...</span>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-start space-x-3 p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getLevelBadge(log.level)}
                          {log.category && getCategoryBadge(log.category)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{getTimeAgo(log.timestamp)}</span>
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2 group-hover:text-gray-700">{log.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.user_id && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>User: {log.user_id.slice(-8)}</span>
                          </div>
                        )}
                        {log.camera_id && (
                          <div className="flex items-center space-x-1">
                            <Camera className="w-3 h-3" />
                            <span>Camera: {log.camera_id.slice(-8)}</span>
                          </div>
                        )}
                        {log.ip_address && (
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>IP: {log.ip_address}</span>
                          </div>
                        )}
                        {log.session_id && (
                          <div className="flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Session: {log.session_id.slice(-8)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhật ký</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || levelFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc.'
                      : 'Không có nhật ký hệ thống.'}
                  </p>
                  <Button variant="outline" onClick={() => loadLogs()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm mới nhật ký
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedLog && getLevelIcon(selectedLog.level)}
              <span>Chi tiết nhật ký</span>
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin cơ bản</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mức độ:</span>
                      {getLevelBadge(selectedLog.level)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Danh mục:</span>
                      {selectedLog.category ? getCategoryBadge(selectedLog.category) : <span className="text-gray-400">N/A</span>}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian:</span>
                      <span>{formatTimestamp(selectedLog.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin liên quan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã người dùng:</span>
                      <span className="font-mono text-xs">{selectedLog.user_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã camera:</span>
                      <span className="font-mono text-xs">{selectedLog.camera_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Địa chỉ IP:</span>
                      <span className="font-mono text-xs">{selectedLog.ip_address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã phiên:</span>
                      <span className="font-mono text-xs">{selectedLog.session_id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Nội dung</h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-900">{selectedLog.message}</p>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                <h4 className="font-semibold text-gray-900 mb-2">Chi tiết bổ sung</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {typeof selectedLog.details === 'object' 
                        ? JSON.stringify(selectedLog.details, null, 2)
                        : selectedLog.details
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemLogs;