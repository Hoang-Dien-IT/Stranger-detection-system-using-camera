import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  Camera,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  RefreshCw,
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
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return 'Không xác định';
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Đang xử lý' },
    processed: { color: 'bg-emerald-100 text-emerald-800', text: 'Đã xử lý' },
    flagged: { color: 'bg-red-100 text-red-800', text: 'Cảnh báo' },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <Badge className={config.color}>
      {config.text}
    </Badge>
  );
};


const DetectionHistoryPage: React.FC = () => {
  const { isConnected, lastMessage } = useWebSocketContext();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCamera, setFilterCamera] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    known: 0,
    unknown: 0
  });
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  // Xây dựng URL ảnh từ trường image_path hoặc file_name
  const getDetectionImageUrl = (detection: Detection) => {
    if (!detection || !detection.image_path) return '';
    // Nếu image_path đã là URL tuyệt đối hợp lệ thì trả về luôn
    if (/^https?:\/\//.test(detection.image_path)) return detection.image_path;
    // Nếu image_path đã chứa '/uploads/detections/' thì chỉ ghép domain
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    if (detection.image_path.includes('/uploads/detections/')) {
      return `${backendUrl}${detection.image_path.startsWith('/') ? '' : '/'}${detection.image_path}`;
    }
    // Nếu image_path là tên file hoặc có chứa \ thì chỉ lấy tên file cuối cùng
    const fileName = detection.image_path.split(/[\\/]/).pop();
    return `${backendUrl}/uploads/detections/${fileName}`;
  };

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      processed: { color: 'bg-green-100 text-green-800', text: 'Processed' },
      flagged: { color: 'bg-red-100 text-red-800', text: 'Flagged' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

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
      // Try to load stats with large limit (now allowed up to 1000)
      const response = await detectionService.getDetections({ limit: 1000 });
      const allDetections = Array.isArray(response) ? response : response.detections || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayDetections = allDetections.filter(d => 
        new Date(d.timestamp) >= today
      );
      
      setStats({
        total: allDetections.length,
        today: todayDetections.length,
        known: allDetections.filter(d => d.detection_type === 'known_person').length,
        unknown: allDetections.filter(d => d.detection_type === 'stranger').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error loading detection statistics');
      
      // Set default stats in case of error
      setStats({
        total: 0,
        today: 0,
        known: 0,
        unknown: 0
      });
    }
  };

  const loadDetections = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await detectionService.getDetections({
        offset: (page - 1) * 20,
        limit: 20,
        camera_id: filterCamera !== 'all' ? filterCamera : undefined,
        detection_type: filterType !== 'all' ? filterType : undefined,
      });
      
      if (Array.isArray(response)) {
        setDetections(response);
        setTotalPages(Math.ceil(response.length / 20));
      } else {
        setDetections(response.detections || []);
        setTotalPages(Math.ceil((response.total || 0) / 20));
      }
    } catch (error) {
      console.error('Error loading detections:', error);
      toast.error('Failed to load detection history');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCamera, filterType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDetections(currentPage),
      loadStats()
    ]);
    setRefreshing(false);
    toast.success('Detection history refreshed');
  };

  const handleExport = async () => {
    try {
      toast.info('Export functionality coming soon');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'known_person':
        return 'Người quen';
      case 'stranger':
        return 'Người lạ';
      case 'unknown':
        return 'Không xác định';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'known_person':
        return 'bg-emerald-100 text-emerald-800';
      case 'stranger':
        return 'bg-red-100 text-red-800';
      case 'unknown':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        if (message.type === 'detection_alert') {
          // Add new detection to the top of the list
          const newDetection = message.data;
          setDetections(prev => [newDetection, ...prev.slice(0, 19)]); // Keep last 20
          loadStats(); // Update stats
          toast.success(`New detection: ${newDetection.person_name || 'Unknown Person'}`);
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
        loadDetections(currentPage),
        loadStats()
      ]);
    };
    
    loadInitialData();
  }, [currentPage, loadDetections]);

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">Lịch Sử Nhận Diện</h1>
          <p className="text-slate-600 mt-2">
            Quản lý & tra cứu các sự kiện nhận diện khuôn mặt
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className="flex items-center space-x-1"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Trực tuyến' : 'Mất kết nối'}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Xuất file
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tổng số nhận diện</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Trong ngày</p>
                <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Người quen</p>
                <p className="text-2xl font-bold text-slate-900">{stats.known}</p>
              </div>
              <User className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Người lạ</p>
                <p className="text-2xl font-bold text-slate-900">{stats.unknown}</p>
              </div>
              <User className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow">
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
                placeholder="Nhập từ khoá..."
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
              <label className="block text-sm font-medium mb-2">Loại nhận diện</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="known_person">Người quen</SelectItem>
                  <SelectItem value="stranger">Người lạ</SelectItem>
                  <SelectItem value="unknown">Không xác định</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Table */}
      <Card className="border-slate-200 shadow">
        <CardHeader>
          <CardTitle>Sự kiện nhận diện</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-700" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Camera</TableHead>
                  <TableHead>Người</TableHead>
                  <TableHead>Độ tin cậy</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detections.map((detection) => (
                  <TableRow key={detection.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">
                          {formatDate(detection.timestamp || new Date().toISOString())}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-slate-500" />
                        <span>{detection.camera_name || 'Không xác định'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{detection.person_name || 'Người lạ'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={detection.confidence > 0.8 ? 'default' : 'secondary'}>
                        {((detection.confidence || 0) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(detection.detection_type || 'unknown')}>
                        {getTypeDisplayName(detection.detection_type || 'unknown')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetection(detection);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
      {/* Modal hiển thị chi tiết detection - chỉ render 1 lần ngoài Table */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết sự kiện nhận diện</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về sự kiện nhận diện khuôn mặt
            </DialogDescription>
          </DialogHeader>
          {selectedDetection && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <img
                  src={getDetectionImageUrl(selectedDetection)}
                  alt="Detected Face"
                  className="w-48 h-48 object-cover rounded shadow border"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Thời gian:</div>
                <div>{formatDate(selectedDetection.timestamp)}</div>
                <div className="font-semibold">Camera:</div>
                <div>{selectedDetection.camera_name || 'Không xác định'}</div>
                <div className="font-semibold">Người:</div>
                <div>{selectedDetection.person_name || 'Người lạ'}</div>
                <div className="font-semibold">Độ tin cậy:</div>
                <div>{((selectedDetection.confidence || 0) * 100).toFixed(1)}%</div>
                <div className="font-semibold">Loại:</div>
                <div>
                  <Badge className={getTypeColor(selectedDetection.detection_type || 'unknown')}>
                    {getTypeDisplayName(selectedDetection.detection_type || 'unknown')}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </TableBody>
            </Table>
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
              <span className="text-sm text-slate-600">
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

export default DetectionHistoryPage;