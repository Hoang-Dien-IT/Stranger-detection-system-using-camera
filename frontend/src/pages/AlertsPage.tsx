import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  RefreshCw,
  Bell,
  Shield,
  Camera,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { detectionService, Detection } from '@/services/detection.service';
import { cameraService } from '@/services/camera.service';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';

// Helper functions
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const getAlertSeverity = (detection: Detection) => {
  if (detection.detection_type === 'stranger' && detection.confidence > 0.8) {
    return 'high';
  } else if (detection.detection_type === 'stranger') {
    return 'medium';
  } else if (detection.detection_type === 'unknown') {
    return 'low';
  }
  return 'info';
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'low':
      return 'bg-yellow-100 text-yellow-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AlertsPage: React.FC = () => {
  const { isConnected, lastMessage } = useWebSocketContext();
  const [alerts, setAlerts] = useState<Detection[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCamera, setFilterCamera] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    high: 0,
    medium: 0,
    low: 0,
    unread: 0
  });

  const loadCameras = async () => {
    try {
      const camerasData = await cameraService.getCameras();
      setCameras(camerasData);
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await detectionService.getDetections({ limit: 1000 });
      const allDetections = Array.isArray(response) ? response : response.detections || [];
      
      // Filter only alerts (stranger and unknown detections)
      const alertDetections = allDetections.filter(d => 
        d.detection_type === 'stranger' || d.detection_type === 'unknown'
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAlerts = alertDetections.filter(d => 
        new Date(d.timestamp) >= today
      );
      
      setStats({
        total: alertDetections.length,
        today: todayAlerts.length,
        high: alertDetections.filter(d => getAlertSeverity(d) === 'high').length,
        medium: alertDetections.filter(d => getAlertSeverity(d) === 'medium').length,
        low: alertDetections.filter(d => getAlertSeverity(d) === 'low').length,
        unread: alertDetections.filter(d => !d.is_alert_sent).length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAlerts = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await detectionService.getDetections({
        offset: (page - 1) * 20,
        limit: 20,
        camera_id: filterCamera !== 'all' ? filterCamera : undefined,
        detection_type: filterSeverity !== 'all' ? filterSeverity : undefined,
      });
      
      let detections: Detection[] = [];
      
      if (Array.isArray(response)) {
        detections = response;
        setTotalPages(Math.ceil(response.length / 20));
      } else {
        detections = response.detections || [];
        setTotalPages(Math.ceil((response.total || 0) / 20));
      }
      
      // Filter only alerts (stranger and unknown detections)
      const alertDetections = detections.filter(d => 
        d.detection_type === 'stranger' || d.detection_type === 'unknown'
      );
      
      setAlerts(alertDetections);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCamera, filterSeverity]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAlerts(currentPage),
      loadStats()
    ]);
    setRefreshing(false);
    toast.success('Alerts refreshed');
  };

  const handleExport = async () => {
    try {
      toast.info('Export functionality coming soon');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      // Update alert as read - this would need backend API
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  // Real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        if (message.type === 'detection_alert') {
          const newDetection = message.data;
          // Only add if it's an alert (stranger or unknown)
          if (newDetection.detection_type === 'stranger' || newDetection.detection_type === 'unknown') {
            setAlerts(prev => [newDetection, ...prev.slice(0, 19)]);
            loadStats();
            toast.error(`New Alert: ${newDetection.person_name || 'Unknown Person'} detected!`);
          }
        }
      } catch (error) {
        console.warn('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadCameras(),
        loadAlerts(currentPage),
        loadStats()
      ]);
    };
    
    loadInitialData();
  }, [currentPage, loadAlerts]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            Cảnh báo an ninh
          </h1>
          <p className="text-gray-600 mt-2">
            Theo dõi và quản lý các cảnh báo an ninh, hoạt động đáng ngờ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className="flex items-center space-x-1"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Trực tiếp' : 'Mất kết nối'}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng cảnh báo</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hôm nay</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mức độ cao</p>
                <p className="text-2xl font-bold text-red-600">{stats.high}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mức độ trung bình</p>
                <p className="text-2xl font-bold text-orange-600">{stats.medium}</p>
              </div>
              <Shield className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mức độ thấp</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
              </div>
              <Eye className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chưa đọc</p>
                <p className="text-2xl font-bold text-purple-600">{stats.unread}</p>
              </div>
              <Bell className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
              <Input
                placeholder="Tìm kiếm cảnh báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Camera</label>
              <Select value={filterCamera} onValueChange={setFilterCamera}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả camera</SelectItem>
                  {cameras.map(camera => (
                    <SelectItem key={camera.id} value={camera.id}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mức độ</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="stranger">Cao (Người lạ)</SelectItem>
                  <SelectItem value="unknown">Trung bình (Không xác định)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo an ninh</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày & Giờ</TableHead>
                  <TableHead>Camera</TableHead>
                  <TableHead>Loại cảnh báo</TableHead>
                  <TableHead>Độ tin cậy</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const severity = getAlertSeverity(alert);
                  return (
                    <TableRow key={alert.id} className={severity === 'high' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {formatDate(alert.timestamp || new Date().toISOString())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Camera className="h-4 w-4 text-gray-500" />
                          <span>{alert.camera_name || 'Không xác định'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>
                            {alert.detection_type === 'stranger' ? 'Người lạ' : 'Không xác định'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.confidence > 0.8 ? 'default' : 'secondary'}>
                          {((alert.confidence || 0) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(severity)}>
                          {severity === 'high' ? 'Cao' : severity === 'medium' ? 'Trung bình' : severity === 'low' ? 'Thấp' : 'Thông tin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.is_alert_sent ? 'default' : 'destructive'}>
                          {alert.is_alert_sent ? 'Đã gửi' : 'Chưa đọc'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!alert.is_alert_sent && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {alerts.length === 0 && !loading && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có cảnh báo nào</h3>
              <p className="text-gray-500">Tất cả hệ thống đều an toàn. Không phát hiện cảnh báo an ninh.</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Tiếp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
