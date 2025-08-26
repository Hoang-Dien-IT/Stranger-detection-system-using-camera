import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Eye,
  Search,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Clock,
  Camera,
  Activity,
  AlertTriangle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Shield,
  Target,
  MapPin,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { detectionService, Detection, DetectionResponse } from '@/services/detection.service';
import { cameraService } from '@/services/camera.service';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Child component to handle image fallback and prevent flickering
const DetectionCardImage: React.FC<{ image_url?: string; image_path?: string; id: string; detection_type: string }> = ({ image_url, image_path, id, detection_type }) => {
  const initialSrc = image_url || (image_path ? `/backend/uploads/detections/${image_path}` : '/no-image.png');
  const [imgSrc, setImgSrc] = React.useState(initialSrc);
  React.useEffect(() => {
    setImgSrc(image_url || (image_path ? `/backend/uploads/detections/${image_path}` : '/no-image.png'));
    // eslint-disable-next-line
  }, [image_url, image_path, id]);
  return (
    <>
      <img
        src={imgSrc}
        alt="Detection"
        className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300 bg-white"
        onError={() => setImgSrc('/no-image.png')}
      />
      <div className="absolute top-2 left-2">
        <Badge variant={detection_type === 'stranger' ? 'destructive' : 'default'} className="text-xs px-2 py-1">
          {detection_type === 'stranger' ? 'Người lạ' : 'Đã biết'}
        </Badge>
      </div>
    </>
  );
};
// ✅ FIX: Update interfaces to match service types
interface DetectionCamera {
  id: string;
  name: string;
  location?: string;
  is_active: boolean;
  camera_type?: string;
}

interface DetectionStats {
  total_detections: number;
  stranger_detections: number;
  known_person_detections: number;
  today_detections: number;
  this_week_detections: number;
  cameras_active: number;
  detection_rate_per_day?: number;
}

interface DetectionFilter {
  limit?: number;
  offset?: number;
  camera_id?: string;
  detection_type?: string;
  start_date?: string;
  end_date?: string;
}

interface PaginationState {
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CleanupDialogState {
  open: boolean;
  daysToKeep: number;
  loading: boolean;
}

const DetectionsPage: React.FC = () => {
  const { isConnected } = useWebSocketContext();

  // ✅ Enhanced state management
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cameras, setCameras] = useState<DetectionCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cleanupDialog, setCleanupDialog] = useState<CleanupDialogState>({
    open: false,
    daysToKeep: 30,
    loading: false
  });
  
  // ✅ FIX: Proper default values aligned with backend
  const [filters, setFilters] = useState<DetectionFilter>({
    limit: 20,
    offset: 0
  });
  
  const [stats, setStats] = useState<DetectionStats>({
    total_detections: 0,
    stranger_detections: 0,
    known_person_detections: 0,
    today_detections: 0,
    this_week_detections: 0,
    cameras_active: 0
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  // ✅ Load initial data
  useEffect(() => {
    Promise.all([
      loadDetections(),
      loadCameras(),
      loadStats()
    ]);
  }, []);

  // ✅ Load detections when filters change
  useEffect(() => {
    if (!loading) {
      loadDetections();
    }
  }, [filters]);

  // ✅ FIX: Enhanced loadDetections with proper response handling
  const loadDetections = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      console.log('🔵 DetectionsPage: Loading detections with filters:', filters);
      
      const response = await detectionService.getDetections(filters);
      console.log('✅ DetectionsPage: Detections loaded:', response);
      
      // ✅ FIX: Handle both response formats properly
      if (Array.isArray(response)) {
        // Direct array response
        setDetections(response);
        setPagination(prev => ({
          ...prev,
          total: response.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }));
      } else if (response && typeof response === 'object' && 'detections' in response) {
        // Paginated response
        const paginatedResponse = response as DetectionResponse;
        setDetections(paginatedResponse.detections);
        updatePagination(paginatedResponse);
      } else {
        console.warn('⚠️ DetectionsPage: Unexpected response format:', response);
        setDetections([]);
      }
      
      if (!loading) {
        toast.success('✅ Detections refreshed');
      }
      
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error loading detections:', error);
      
      let errorMessage = 'Failed to load detections';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
      setDetections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Helper function to update pagination from response
  const updatePagination = (response: DetectionResponse) => {
    setPagination({
      total: response.total,
      currentPage: response.page,
      totalPages: response.pages,
      hasNext: response.has_next,
      hasPrev: response.has_prev
    });
  };

  const loadCameras = async () => {
    try {
      console.log('🔵 DetectionsPage: Loading cameras...');
      const camerasData = await cameraService.getCameras();
      
      // Transform cameras to match DetectionCamera interface
      const transformedCameras: DetectionCamera[] = camerasData.map(camera => ({
        id: camera.id,
        name: camera.name,
        location: camera.location,
        is_active: camera.is_active,
        camera_type: camera.camera_type
      }));
      
      setCameras(transformedCameras);
      console.log('✅ DetectionsPage: Cameras loaded:', transformedCameras.length);
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error loading cameras:', error);
      toast.error('Failed to load cameras');
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔵 DetectionsPage: Loading detection stats...');
      const statsData = await detectionService.getDetectionStats();
      
      // Transform stats to match our interface
      const transformedStats: DetectionStats = {
        total_detections: statsData.overview?.total_detections || 0,
        stranger_detections: statsData.overview?.stranger_detections || 0,
        known_person_detections: statsData.overview?.known_person_detections || 0,
        today_detections: statsData.time_based?.today || 0,
        this_week_detections: statsData.time_based?.this_week || 0,
        cameras_active: statsData.camera_stats?.active_cameras || 0,
        detection_rate_per_day: statsData.overview?.total_detections ? 
          (statsData.overview.total_detections / 7) : 0
      };
      
      setStats(transformedStats);
      console.log('✅ DetectionsPage: Stats loaded:', transformedStats);
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error loading stats:', error);
      // Keep default stats on error
    }
  };

  const handleDeleteDetection = async (detectionId: string) => {
    try {
      console.log('🗑️ DetectionsPage: Deleting detection:', detectionId);
      await detectionService.deleteDetection(detectionId);
      
      // Remove from local state
      setDetections(prev => prev.filter(d => d.id !== detectionId));
      toast.success('Detection deleted successfully');
      
      // Refresh stats
      loadStats();
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error deleting detection:', error);
      toast.error('Failed to delete detection');
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * (filters.limit || 20);
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  const handleFilterChange = (key: keyof DetectionFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({ limit: 20, offset: 0 });
    setSearchTerm('');
  };

  const handleExportDetections = async () => {
    try {
      toast.info('📤 Exporting detections...');
      console.log('🔵 DetectionsPage: Exporting detections with filters:', filters);
      
      // Get all detections (remove pagination for export)
      const exportFilters = { ...filters, limit: 10000, offset: 0 };
      const response = await detectionService.getDetections(exportFilters);
      const exportDetections = Array.isArray(response) ? response : 
        (response && 'detections' in response ? response.detections : []);
      
      if (exportDetections.length === 0) {
        toast.warning('⚠️ No detections to export');
        return;
      }
      
      // ✅ Create proper CSV with headers
      const csvHeaders = [
        'ID',
        'Date & Time',
        'Camera Name',
        'Camera Location',
        'Detection Type',
        'Person Name',
        'Confidence (%)',
        'Similarity Score (%)',
        'Alert Sent',
        'Bounding Box'
      ];
      
      const csvRows = exportDetections.map(detection => [
        detection.id,
        new Date(detection.timestamp).toLocaleString(),
        detection.camera_name || 'Unknown',
        detection.location || '',
        detection.detection_type === 'stranger' ? 'Unknown Person' : 'Known Person',
        detection.person_name || 'N/A',
        (detection.confidence * 100).toFixed(1),
        detection.similarity_score ? (detection.similarity_score * 100).toFixed(1) : 'N/A',
        detection.is_alert_sent ? 'Yes' : 'No',
        detection.bbox ? detection.bbox.join(',') : 'N/A'
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `detections_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`✅ Exported ${exportDetections.length} detections`);
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error exporting detections:', error);
      toast.error('Failed to export detections');
    }
  };

  const handleCleanupDetections = async () => {
    try {
      setCleanupDialog(prev => ({ ...prev, loading: true }));
      console.log('🧹 DetectionsPage: Cleaning up detections older than', cleanupDialog.daysToKeep, 'days');
      
      const result = await detectionService.cleanupOldDetections(cleanupDialog.daysToKeep);
      console.log('✅ DetectionsPage: Cleanup completed:', result);
      
      toast.success(`✅ Cleaned up old detections`);
      setCleanupDialog({ open: false, daysToKeep: 30, loading: false });
      
      // Reload data
      loadDetections();
      loadStats();
    } catch (error: any) {
      console.error('❌ DetectionsPage: Error cleaning up detections:', error);
      toast.error('Failed to cleanup detections');
      setCleanupDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ✅ Utility functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const detectionTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - detectionTime.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  // ✅ Filter detections based on search term
  const filteredDetections = detections.filter(detection => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      detection.person_name?.toLowerCase().includes(searchLower) ||
      detection.camera_name?.toLowerCase().includes(searchLower) ||
      detection.location?.toLowerCase().includes(searchLower) ||
      detection.detection_type.toLowerCase().includes(searchLower) ||
      detection.id.toLowerCase().includes(searchLower)
    );
  });

  // ✅ Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg">Đang tải dữ liệu nhận diện...</p>
          <p className="text-slate-500 text-sm mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          {/* Title and Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">Nhật ký nhận diện</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-slate-600">Theo dõi hoạt động nhận diện khuôn mặt thời gian thực</p>
                  {isConnected ? (
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm font-medium">Đang trực tuyến</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-sm font-medium">Mất kết nối</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadDetections();
                loadStats();
              }}
              disabled={refreshing}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang làm mới...' : 'Làm mới'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDetections}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCleanupDialog(prev => ({ ...prev, open: true }))}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Settings className="h-4 w-4 mr-2" />
              Dọn dẹp
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng phát hiện</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_detections.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.today_detections} hôm nay
                    {stats.detection_rate_per_day && (
                      <span> • {stats.detection_rate_per_day.toFixed(1)}/ngày trung bình</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người đã biết</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.known_person_detections.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_detections > 0 
                    ? `${((stats.known_person_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                    : '0% tổng số'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người lạ</p>
                <p className="text-3xl font-bold text-red-600">{stats.stranger_detections.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_detections > 0 
                    ? `${((stats.stranger_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                    : '0% tổng số'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Camera hoạt động</p>
                <p className="text-3xl font-bold text-purple-600">{stats.cameras_active.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {cameras.length} tổng camera
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Bộ lọc & Tìm kiếm</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm phát hiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              />
            </div>

            {/* Camera Filter */}
            <Select
              value={filters.camera_id || 'all_cameras'}
              onValueChange={(value) => handleFilterChange('camera_id', value === 'all_cameras' ? undefined : value)}
            >
              <SelectTrigger className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Tất cả Camera" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-xl">
                <SelectItem value="all_cameras">Tất cả Camera</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Detection Type Filter */}
            <Select
              value={filters.detection_type || 'all_types'}
              onValueChange={(value) => handleFilterChange('detection_type', value === 'all_types' ? undefined : value)}
            >
              <SelectTrigger className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-xl">
                <SelectItem value="all_types">Tất cả loại</SelectItem>
                <SelectItem value="known_person">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span>Người đã biết</span>
                  </div>
                </SelectItem>
                <SelectItem value="stranger">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Người lạ</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Start Date Filter */}
            <Input
              type="date"
              placeholder="Ngày bắt đầu"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* Active Filters Display */}
          {(searchTerm || Object.values(filters).some(v => v !== undefined && v !== 20 && v !== 0)) && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Bộ lọc đang hoạt động:</span>
              {searchTerm && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Tìm kiếm: {searchTerm}
                </Badge>
              )}
              {filters.camera_id && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Camera: {cameras.find(c => c.id === filters.camera_id)?.name || 'Không rõ'}
                </Badge>
              )}
              {filters.detection_type && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Loại: {filters.detection_type === 'known_person' ? 'Người đã biết' : 'Người lạ'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Danh sách nhận diện</span>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {filteredDetections.length} kết quả
                </Badge>
                {pagination.total > filteredDetections.length && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    trên tổng {pagination.total}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDetections.length > 0 ? (
              <div className="space-y-4">
                {filteredDetections.map((detection, index) => (
                  <motion.div
                    key={detection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.35 }}
                    className={`relative group rounded-2xl border-2 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden p-6 flex flex-col md:flex-row items-center ${detection.detection_type === 'stranger' ? 'border-red-400 bg-gradient-to-r from-red-50 via-white to-white' : 'border-emerald-400 bg-gradient-to-r from-emerald-50 via-white to-white'}`}
                    style={{ minHeight: 110 }}
                    onClick={async () => {
                      try {
                        setLoadingDetail(true);
                        const detail = await detectionService.getDetection(detection.id);
                        setSelectedDetection(detail);
                        setShowImageDialog(true);
                      } catch (err) {
                        toast.error('Không thể tải chi tiết nhận diện');
                      } finally {
                        setLoadingDetail(false);
                      }
                    }}
                  >
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:space-x-6 w-full">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className={`font-bold text-lg truncate ${detection.detection_type === 'stranger' ? 'text-red-700' : 'text-emerald-700'}`}>{detection.detection_type === 'stranger' ? 'Người lạ' : detection.person_name || 'Người đã biết'}</span>
                          <span className="text-xs text-gray-400">#{detection.id.slice(0, 8)}</span>
                          <Badge variant={detection.detection_type === 'stranger' ? 'destructive' : 'default'} className={`ml-2 px-2 py-1 text-xs ${detection.detection_type === 'stranger' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                            {detection.detection_type === 'stranger' ? 'Lạ' : 'Đã biết'}
                          </Badge>
                        </div>
                        <div className="flex items-center flex-wrap space-x-3 text-sm text-gray-600 mb-1">
                          <Camera className="h-4 w-4 mr-1 inline-block" />
                          <span>{detection.camera_name || 'Không xác định'}</span>
                          {detection.location && <span className="flex items-center"><MapPin className="h-4 w-4 ml-2 mr-1 inline-block" />{detection.location}</span>}
                          <Clock className="h-4 w-4 ml-2 mr-1 inline-block" />
                          <span title={new Date(detection.timestamp).toLocaleString()}>{formatTimeAgo(detection.timestamp)}</span>
                        </div>
                        <div className="flex items-center flex-wrap space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Target className="h-3 w-3 mr-1" />{formatConfidence(detection.confidence)}
                          </Badge>
                          {detection.similarity_score && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Shield className="h-3 w-3 mr-1" />{formatConfidence(detection.similarity_score)}
                            </Badge>
                          )}
                          {detection.is_alert_sent && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                              🔔 Đã gửi cảnh báo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl">
                          <DropdownMenuItem 
                            onClick={async (e) => {
                              e.stopPropagation();
                              setLoadingDetail(true);
                              try {
                                const detail = await detectionService.getDetection(detection.id);
                                setSelectedDetection(detail);
                                setShowImageDialog(true);
                              } catch (err) {
                                toast.error('Không thể tải chi tiết nhận diện');
                              } finally {
                                setLoadingDetail(false);
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {loadingDetail ? 'Đang tải...' : 'Xem chi tiết'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(detection.id);
                              toast.success('Đã sao chép mã nhận diện');
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Sao chép mã
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDetection(detection.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa nhận diện
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu nhận diện</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || Object.values(filters).some(v => v !== undefined && v !== 20 && v !== 0)
                    ? 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại. Hãy thử thay đổi điều kiện tìm kiếm.'
                    : 'Chưa có dữ liệu nhận diện nào được ghi nhận. Hãy đảm bảo camera đang hoạt động và bật tính năng nhận diện.'}
                </p>
                <div className="flex justify-center space-x-3">
                  {(searchTerm || Object.values(filters).some(v => v !== undefined && v !== 20 && v !== 0)) && (
                    <Button onClick={clearFilters} variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Xóa bộ lọc
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      loadDetections();
                      loadStats();
                    }}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-slate-600">
                  Hiển thị {((pagination.currentPage - 1) * (filters.limit || 20)) + 1} - {Math.min(pagination.currentPage * (filters.limit || 20), pagination.total)} trên tổng {pagination.total.toLocaleString()} kết quả
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <span className="text-sm text-slate-600 px-3">
                    Trang {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>


      {/* Modern Detection Detail Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl shadow-2xl border-0">
          {selectedDetection && (
            <div className="bg-blue-600 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-wide drop-shadow">Chi tiết phát hiện</span>
                <span className={`ml-4 px-4 py-1 rounded-full text-sm font-semibold shadow border ${selectedDetection.detection_type === 'stranger' ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white'}`}>
                  {selectedDetection.detection_type === 'stranger' ? 'Người lạ' : 'Người đã biết'}
                </span>
              </div>
              <span className="text-white text-xs font-mono opacity-80 bg-black/20 px-3 py-1 rounded-lg">{selectedDetection.id}</span>
            </div>
          )}
          {selectedDetection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white">
              {/* Modern Image Display */}
              <div className="flex flex-col items-center justify-center p-8">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50">
                  <img
                    src={selectedDetection.image_url || `/backend/uploads/detections/${selectedDetection.image_path || ''}`}
                    alt="Detection"
                    className="w-full h-full object-cover transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/no-image.png';
                      e.currentTarget.style.opacity = '0.3';
                    }}
                  />
                  {/* Overlay with detection info */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold shadow">
                    {formatConfidence(selectedDetection.confidence)} độ tin cậy
                  </div>
                  {selectedDetection.similarity_score && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white px-3 py-1 rounded text-xs font-semibold shadow">
                      {formatConfidence(selectedDetection.similarity_score)} tương đồng
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-3 py-1 rounded text-xs font-semibold shadow border ${selectedDetection.detection_type === 'stranger' ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white'}`}>
                      {selectedDetection.detection_type === 'stranger' ? 'Lạ' : 'Đã biết'}
                    </span>
                  </div>
                </div>
                {/* Bounding Box Info */}
                {selectedDetection.bbox && (
                  <div className="mt-6 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Khung viền</label>
                    <div className="mt-2 grid grid-cols-4 gap-3">
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow">
                        <p className="font-bold text-xs text-gray-600">X</p>
                        <p className="text-lg font-extrabold text-blue-700">{selectedDetection.bbox[0]}</p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow">
                        <p className="font-bold text-xs text-gray-600">Y</p>
                        <p className="text-lg font-extrabold text-blue-700">{selectedDetection.bbox[1]}</p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow">
                        <p className="font-bold text-xs text-gray-600">W</p>
                        <p className="text-lg font-extrabold text-blue-700">{selectedDetection.bbox[2]}</p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-xl text-center shadow">
                        <p className="font-bold text-xs text-gray-600">H</p>
                        <p className="text-lg font-extrabold text-blue-700">{selectedDetection.bbox[3]}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Modern Details Panel */}
              <div className="p-8 flex flex-col gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loại phát hiện</label>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold shadow border ${selectedDetection.detection_type === 'stranger' ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white'}`}>
                      {selectedDetection.detection_type === 'stranger' ? <AlertTriangle className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      {selectedDetection.detection_type === 'stranger' ? 'Người lạ' : 'Người đã biết'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Độ tin cậy</label>
                    <p className="mt-2 text-2xl font-extrabold text-blue-600">
                      {formatConfidence(selectedDetection.confidence)}
                    </p>
                  </div>
                  {selectedDetection.similarity_score && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Độ tương đồng</label>
                      <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                        {formatConfidence(selectedDetection.similarity_score)}
                      </p>
                    </div>
                  )}
                </div>
                {selectedDetection.person_name && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên người</label>
                    <p className="mt-2 text-lg font-bold text-gray-800">{selectedDetection.person_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Camera</label>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-gray-800">{selectedDetection.camera_name || 'Camera không xác định'}</p>
                    {selectedDetection.location && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedDetection.location}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian phát hiện</label>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-gray-800">{new Date(selectedDetection.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(selectedDetection.timestamp)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái cảnh báo</label>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold shadow border ${selectedDetection.is_alert_sent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-300 border-gray-400 text-gray-700'}`}>
                      {selectedDetection.is_alert_sent ? <span className="mr-1">🔔</span> : <span className="mr-1">🔕</span>}
                      {selectedDetection.is_alert_sent ? 'Đã gửi cảnh báo' : 'Không có cảnh báo'}
                    </span>
                  </div>
                </div>
                {/* Additional metadata if available */}
                {selectedDetection.metadata && Object.keys(selectedDetection.metadata).length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin bổ sung</label>
                    <div className="mt-2 bg-gray-100 p-4 rounded-xl shadow-inner">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedDetection.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <AlertDialog open={cleanupDialog.open} onOpenChange={(open) => setCleanupDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Dọn dẹp dữ liệu cũ</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ xóa vĩnh viễn các bản ghi nhận diện cũ hơn số ngày bạn chọn. Không thể hoàn tác!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Số ngày giữ lại</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={cleanupDialog.daysToKeep}
                onChange={(e) => setCleanupDialog(prev => ({ ...prev, daysToKeep: parseInt(e.target.value) || 30 }))}
                className="mt-1"
                disabled={cleanupDialog.loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Các bản ghi nhận diện cũ hơn {cleanupDialog.daysToKeep} ngày sẽ bị xóa vĩnh viễn.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="hover:bg-gray-50"
              disabled={cleanupDialog.loading}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanupDetections}
              disabled={cleanupDialog.loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {cleanupDialog.loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang dọn dẹp...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Dọn dẹp
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DetectionsPage;