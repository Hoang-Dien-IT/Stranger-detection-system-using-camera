import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Plus,
  Search,
  MoreVertical,
  Play,
  Square,
  Eye,
  Settings,
  Trash2,
  MapPin,
  Calendar,
  MonitorPlay,
  RefreshCw,
  Filter,
  Grid3x3,
  List,
  Video,
  Shield,
  Signal,
  Power,
  PowerOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { motion } from 'framer-motion';
import { cameraService } from '@/services/camera.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// ✅ FIX: Update interface to match backend response from #backend
interface CameraDevice {
  id: string;
  name: string;
  camera_type: 'webcam' | 'ip_camera' | 'rtsp' | 'usb' | 'usb_camera'; // ✅ Match backend enum
  description?: string;
  location?: string;
  is_active: boolean;
  is_streaming: boolean;
  detection_enabled: boolean;
  created_at: string;
  updated_at?: string;
  last_online?: string;
  camera_url?: string;
  stream_url?: string; // ✅ Add alternative URL field
  rtsp_url?: string; // ✅ Add RTSP URL field
  // ✅ Add additional fields from backend
  stream_settings?: {
    resolution?: string;
    fps?: number;
    quality?: string;
  };
  alert_settings?: {
    email_alerts?: boolean;
    webhook_url?: string;
  };
  tags?: string[];
  timezone?: string;
  is_recording?: boolean; // ✅ Add recording status
}

interface CameraStats {
  total: number;
  active: number;
  streaming: number;
  offline: number;
}

const CamerasPage: React.FC = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'streaming' | 'offline'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; camera: CameraDevice | null }>({
    open: false,
    camera: null
  });

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
  toast.info('🔄 Đang làm mới danh sách camera...');
      } else {
        setLoading(true);
      }
      
      console.log('🔵 CamerasPage: Loading cameras...');
      const response = await cameraService.getCameras();
      console.log('✅ CamerasPage: Cameras loaded:', response.length);
      setCameras(response);
      
      if (showRefresh) {
  toast.success('✅ Đã làm mới danh sách camera');
      }
    } catch (error: any) {
      console.error('❌ CamerasPage: Error loading cameras:', error);
  toast.error(`Không thể tải danh sách camera: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCameraStats = (): CameraStats => {
    return {
      total: cameras.length,
      active: cameras.filter(c => c.is_active).length,
      streaming: cameras.filter(c => c.is_streaming).length,
      offline: cameras.filter(c => !c.is_active).length
    };
  };

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (filterStatus) {
        case 'active': return camera.is_active;
        case 'streaming': return camera.is_streaming;
        case 'offline': return !camera.is_active;
        default: return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // ✅ FIX: Update stream handling methods to use backend endpoints from #backend
  const handleStartStream = async (camera: CameraDevice) => {
    try {
      console.log('🔵 CamerasPage: Starting stream for camera:', camera.id);
      await cameraService.startStreaming(camera.id); // ✅ Use correct method name
  toast.success(`🎥 Đã bắt đầu phát trực tiếp cho ${camera.name}`);
      await loadCameras(); // ✅ Wait for reload
    } catch (error: any) {
      console.error('❌ CamerasPage: Error starting stream:', error);
  toast.error(`Không thể bắt đầu phát trực tiếp: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const handleStopStream = async (camera: CameraDevice) => {
    try {
      console.log('🔵 CamerasPage: Stopping stream for camera:', camera.id);
      await cameraService.stopStreaming(camera.id); // ✅ Use correct method name
  toast.success(`⏹️ Đã dừng phát trực tiếp cho ${camera.name}`);
      await loadCameras(); // ✅ Wait for reload
    } catch (error: any) {
      console.error('❌ CamerasPage: Error stopping stream:', error);
  toast.error(`Không thể dừng phát trực tiếp: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const handleDeleteCamera = async (camera: CameraDevice) => {
    try {
      console.log('🔵 CamerasPage: Deleting camera:', camera.id);
      await cameraService.deleteCamera(camera.id);
  toast.success(`🗑️ Đã xóa camera ${camera.name} thành công`);
      await loadCameras(); // ✅ Wait for reload
      setDeleteDialog({ open: false, camera: null });
    } catch (error: any) {
      console.error('❌ CamerasPage: Error deleting camera:', error);
  toast.error(`Không thể xóa camera: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  // ✅ FIX: Update test connection method to use backend endpoint
  const handleTestConnection = async (camera: CameraDevice) => {
    try {
      console.log('🔵 CamerasPage: Testing camera connection:', camera.id);
      
      // ✅ Show loading state
  toast.info(`🔍 Đang kiểm tra ${camera.name}...`);
      
      const result = await cameraService.testCamera(camera.id);
      console.log('✅ CamerasPage: Connection test result:', result);
      
      // ✅ Enhanced result display based on backend response
      if (result.is_connected) {
        if (result.status === 'success') {
          toast.success(`✅ ${camera.name}: ${result.message}`, {
            description: result.connection_type ? `Loại: ${result.connection_type}` : undefined
          });
        } else {
          toast.success(`✅ Kết nối với ${camera.name} thành công`);
        }
      } else if (result.status === 'warning') {
        toast.warning(`⚠️ ${camera.name}: ${result.message}`, {
          description: 'Cấu hình có thể cần kiểm tra lại'
        });
      } else {
        toast.error(`❌ ${camera.name}: ${result.message}`, {
          description: 'Vui lòng kiểm tra cấu hình và kết nối mạng của camera'
        });
      }
      
      // ✅ Special handling for different camera types
      if (result.camera_type === 'webcam') {
  toast.info(`💡 ${camera.name} (Webcam): Thiết bị cục bộ - không cần kiểm tra mạng`);
      }
      
    } catch (error: any) {
      console.error('❌ CamerasPage: Error testing camera connection:', error);
      toast.error(`❌ Không thể kiểm tra ${camera.name}`, {
        description: error.message || 'Lỗi không xác định'
      });
    }
  };

  // ✅ FIX: Add toggle detection method using backend endpoint
  const handleToggleDetection = async (camera: CameraDevice) => {
    try {
      const action = camera.detection_enabled ? 'stop' : 'start';
      console.log(`🔵 CamerasPage: ${action}ing detection for camera:`, camera.id);
      
      if (camera.detection_enabled) {
        await cameraService.stopDetection(camera.id);
  toast.success(`🛡️ Đã tắt phát hiện cho ${camera.name}`);
      } else {
        await cameraService.startDetection(camera.id);
  toast.success(`🛡️ Đã bật phát hiện cho ${camera.name}`);
      }
      
      await loadCameras(); // ✅ Reload to get updated status
    } catch (error: any) {
      console.error('❌ CamerasPage: Error toggling detection:', error);
  toast.error(`Không thể chuyển trạng thái phát hiện: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const getCameraStatusColor = (camera: CameraDevice) => {
    if (camera.is_streaming) return 'text-emerald-600';
    if (camera.is_active) return 'text-blue-600';
    return 'text-gray-400';
  };

  const getCameraStatusBg = (camera: CameraDevice) => {
    if (camera.is_streaming) return 'bg-emerald-100 border-emerald-200';
    if (camera.is_active) return 'bg-blue-100 border-blue-200';
    return 'bg-gray-100 border-gray-200';
  };

  // ✅ FIX: Add camera type display helper
  const getCameraTypeDisplay = (type: string) => {
    const viTypeMap: { [key: string]: string } = {
      'webcam': 'Webcam',
      'ip_camera': 'Camera IP',
      'rtsp': 'Camera RTSP',
      'usb': 'Camera USB',
      'usb_camera': 'Camera USB'
    };
    return viTypeMap[type] || type.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải danh sách camera...</p>
        </div>
      </div>
    );
  }

  const stats = getCameraStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* ✅ Modern Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Quản lý Camera
              </h1>
              <p className="text-gray-600">Theo dõi và quản lý các camera an ninh của bạn</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCameras(true)}
            disabled={refreshing}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          
          <Button 
            onClick={() => navigate('/cameras/new')} // ✅ FIX: Correct route
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Camera
          </Button>
        </div>
      </motion.div>

      {/* ✅ Stats Cards - Enhanced with better data display */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số Camera</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Tất cả thiết bị đã đăng ký</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Đang trực tuyến</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Power className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang phát trực tiếp</p>
                <p className="text-3xl font-bold text-purple-600">{stats.streaming}</p>
                <p className="text-xs text-gray-500 mt-1">Đang phát sóng</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ngoại tuyến</p>
                <p className="text-3xl font-bold text-red-600">{stats.offline}</p>
                <p className="text-xs text-gray-500 mt-1">Cần kiểm tra</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <PowerOff className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ Search and Filters */}
      <motion.div 
        className="flex flex-col lg:flex-row gap-4 items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center space-x-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm camera theo tên, vị trí hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 shadow-sm focus:shadow-md transition-shadow"
            />
          </div>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
            <SelectTrigger className="w-40 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-xl">
              <SelectItem value="all">Tất cả Camera</SelectItem>
              <SelectItem value="active">Chỉ đang hoạt động</SelectItem>
              <SelectItem value="streaming">Đang phát trực tiếp</SelectItem>
              <SelectItem value="offline">Ngoại tuyến</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* ✅ Cameras Display */}
      {filteredCameras.length > 0 ? (
        <motion.div 
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {filteredCameras.map((camera, index) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCameraStatusBg(camera)}`}>
                        <Camera className={`h-5 w-5 ${getCameraStatusColor(camera)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">{camera.name}</CardTitle>
                        <p className="text-sm text-gray-600">{getCameraTypeDisplay(camera.camera_type)}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl">
                        <DropdownMenuItem onClick={() => navigate(`/cameras/${camera.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/cameras/${camera.id}/stream`)}>
                          <MonitorPlay className="h-4 w-4 mr-2" />
                          Xem trực tiếp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/cameras/${camera.id}/edit`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTestConnection(camera)}>
                          <Signal className="h-4 w-4 mr-2" />
                          Kiểm tra kết nối
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleDetection(camera)}>
                          <Shield className="h-4 w-4 mr-2" />
                          {camera.detection_enabled ? 'Tắt' : 'Bật'} phát hiện
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({ open: true, camera })}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa Camera
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* ✅ Enhanced Status Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge 
                      variant={camera.is_active ? "default" : "secondary"}
                      className={`text-xs ${
                        camera.is_active 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {camera.is_active ? (
                        <>
                          <Power className="w-3 h-3 mr-1" />
                          Đang hoạt động
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3 mr-1" />
                          Ngoại tuyến
                        </>
                      )}
                    </Badge>

                    {camera.is_streaming && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-1 animate-pulse" />
                        Đang phát trực tiếp
                      </Badge>
                    )}

                    {camera.detection_enabled && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Đang phát hiện
                      </Badge>
                    )}

                    {camera.is_recording && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                        Đang ghi hình
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Camera Info */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {camera.description || 'Chưa có mô tả'}
                    </p>
                    
                    {camera.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{camera.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                        <span>Thêm ngày {new Date(camera.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* ✅ Add stream settings display */}
                    {camera.stream_settings && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Video className="h-3 w-3 mr-1" />
                        <span>
                          {camera.stream_settings.resolution || '1920x1080'} • {camera.stream_settings.fps || 30}fps
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Camera Preview */}
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden">
                    {camera.is_streaming ? (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600">Đang phát trực tiếp</p>
                        <div className="flex items-center justify-center mt-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75" />
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          {camera.is_active ? 'Camera sẵn sàng' : 'Camera ngoại tuyến'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {camera.is_active ? 'Nhấn bắt đầu để phát trực tiếp' : 'Vui lòng kiểm tra kết nối'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ✅ Enhanced Control Buttons */}
                  <div className="flex gap-2">
                    {camera.is_streaming ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopStream(camera)}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Dừng
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleStartStream(camera)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                        disabled={!camera.is_active}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Bắt đầu
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/cameras/${camera.id}/stream`)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      disabled={!camera.is_active}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/cameras/${camera.id}`)}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy camera nào' : 'Chưa có camera nào'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Không có camera nào phù hợp với tiêu chí tìm kiếm. Hãy thử thay đổi bộ lọc.'
                  : 'Hãy bắt đầu bằng cách thêm camera đầu tiên để giám sát.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/cameras/new')} // ✅ FIX: Correct route
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Camera đầu tiên
                </Button>
                {(searchTerm || filterStatus !== 'all') && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ✅ Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, camera: null })}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <span>Xóa Camera</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa <span className="font-semibold">"{deleteDialog.camera?.name}"</span> không?
              Hành động này không thể hoàn tác và sẽ xóa:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tất cả nhật ký phát hiện và bản ghi hình</li>
                <li>Cài đặt cấu hình camera</li>
                <li>Lịch sử phát trực tiếp và phân tích</li>
                <li>Dữ liệu nhận diện khuôn mặt liên quan</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-50">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.camera && handleDeleteCamera(deleteDialog.camera)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa Camera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CamerasPage;