import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Play,
  Square,
  Maximize,
  Grid3x3,
  Grid2x2,
  List,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Fullscreen,
  Minimize,
  Circle,
  Eye,
  Users,
  Settings,
  MonitorPlay,
  Activity,
  Shield,
  Target,
  Video,
  VideoOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { cameraService } from '@/services/camera.service';
import { detectionService, Detection } from '@/services/detection.service';
import { toast } from 'sonner';
import StreamPlayer from '../components/stream/StreamPlayer';
import DetectionAlerts from '../components/monitoring/DetectionAlertsSimple';

// ✅ FIX: Update interfaces to match backend structure từ #backend
interface CameraDevice {
  id: string;
  name: string;
  camera_type: 'webcam' | 'ip_camera' | 'rtsp' | 'usb' | 'usb_camera';
  description?: string;
  location?: string;
  is_active: boolean;
  is_streaming: boolean;
  detection_enabled: boolean;
  created_at: string;
  updated_at?: string;
  camera_url?: string;
  stream_url?: string;
  rtsp_url?: string;
  stream_settings?: {
    resolution?: string;
    fps?: number;
    quality?: string;
  };
}

interface LiveCameraStream {
  id: string;
  camera: CameraDevice;
  isStreaming: boolean;
  isRecording: boolean;
  viewCount: number;
  lastDetection?: Detection;
  streamUrl?: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  // ✅ Add streaming stats từ backend
  stats?: {
    uptime: number;
    frame_rate: number;
    resolution: string;
    viewers_count: number;
  };
}

interface StreamLayout {
  type: '1x1' | '2x2' | '3x3' | '4x4' | 'list';
  label: string;
  icon: React.ReactNode;
  maxStreams: number;
}

const LiveMonitoringPage: React.FC = () => {
  const { isConnected, lastMessage } = useWebSocketContext();
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeStreams, setActiveStreams] = useState<LiveCameraStream[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [layout, setLayout] = useState<StreamLayout['type']>('2x2');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'streaming' | 'detection'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ Add refs for video elements
  const streamRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const streamLayouts: StreamLayout[] = [
    { type: '1x1', label: 'Xem đơn', icon: <Maximize className="h-4 w-4" />, maxStreams: 1 },
    { type: '2x2', label: 'Lưới 2x2', icon: <Grid2x2 className="h-4 w-4" />, maxStreams: 4 },
    { type: '3x3', label: 'Lưới 3x3', icon: <Grid3x3 className="h-4 w-4" />, maxStreams: 9 },
    { type: '4x4', label: 'Lưới 4x4', icon: <Grid3x3 className="h-4 w-4" />, maxStreams: 16 },
    { type: 'list', label: 'Xem danh sách', icon: <List className="h-4 w-4" />, maxStreams: 8 }
  ];

  // ✅ Load initial data
  useEffect(() => {
    loadInitialData();
    return () => {
      // Cleanup intervals and streams
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      stopAllStreams();
    };
  }, []);

  // ✅ Auto refresh setup
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadRecentDetections();
        updateStreamStatus();
      }, 5000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // ✅ Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      try {
        // Check if data is valid JSON string
        if (typeof lastMessage.data === 'string' && lastMessage.data.trim()) {
          const message = JSON.parse(lastMessage.data);
          
          if (message.type === 'detection_alert') {
            handleNewDetection(message.data);
          } else if (message.type === 'stream_status') {
            handleStreamStatusUpdate(message.data);
          }
        }
      } catch (error) {
        console.warn('Failed to parse WebSocket message:', error, 'Data:', lastMessage.data);
      }
    }
  }, [lastMessage]);

  // ✅ Enhanced data loading with proper error handling
  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🔵 LiveMonitoringPage: Loading initial data...');
      
      await Promise.all([
        loadCameras(),
        loadRecentDetections()
      ]);
      
      console.log('✅ LiveMonitoringPage: Initial data loaded successfully');
    } catch (error) {
      console.error('❌ LiveMonitoringPage: Error loading initial data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Enhanced camera loading với backend integration
  const loadCameras = async () => {
    try {
      console.log('🔵 LiveMonitoringPage: Loading cameras...');
      
      // ✅ Use correct API endpoint from #backend
      const camerasData = await cameraService.getCameras();
      console.log('✅ LiveMonitoringPage: Raw cameras data:', camerasData);
      
      if (!Array.isArray(camerasData)) {
        console.warn('⚠️ LiveMonitoringPage: Invalid cameras data format:', camerasData);
        setCameras([]);
        setActiveStreams([]);
        return;
      }
      
      console.log('✅ LiveMonitoringPage: Cameras loaded:', camerasData.length);
      setCameras(camerasData);
      
      // ✅ Initialize streams for ALL cameras (not just active ones)
      const streams: LiveCameraStream[] = camerasData.map(camera => ({
        id: camera.id,
        camera,
        isStreaming: camera.is_streaming || false,
        isRecording: camera.is_recording || false,
        viewCount: 0,
        lastDetection: undefined,
        streamUrl: getStreamUrl(camera),
        status: camera.is_active ? 'online' : 'offline',
        stats: {
          uptime: 0,
          frame_rate: camera.stream_settings?.fps || 30,
          resolution: camera.stream_settings?.resolution || '1920x1080',
          viewers_count: 0
        }
      }));
      
      console.log('✅ LiveMonitoringPage: Active streams initialized:', streams.length);
      setActiveStreams(streams);
      
      // ✅ Auto-select first 4 cameras for initial display
      const autoSelected = streams.slice(0, 4).map(stream => stream.id);
      setSelectedCameras(autoSelected);
      
    } catch (error: any) {
      console.error('❌ LiveMonitoringPage: Error loading cameras:', error);
      toast.error(`Failed to load cameras: ${error.message || 'Unknown error'}`);
      
      // ✅ Set fallback empty state
      setCameras([]);
      setActiveStreams([]);
      setSelectedCameras([]);
    }
  };

  // ✅ Enhanced detection loading với proper filtering
  const loadRecentDetections = async () => {
    try {
      console.log('🔵 LiveMonitoringPage: Loading recent detections...');
      
      // ✅ Use proper detection service method từ #backend
      const response = await detectionService.getDetections({ 
        limit: 20,
        offset: 0
      });
      
      // Handle both array and paginated response
      const detections = Array.isArray(response) ? response : 
        (response && 'detections' in response ? response.detections : []);
      
      console.log('✅ LiveMonitoringPage: Recent detections loaded:', detections.length);
      setRecentDetections(detections);
      
    } catch (error: any) {
      console.error('❌ LiveMonitoringPage: Error loading recent detections:', error);
      // Don't show error toast for detections - not critical for live monitoring
      setRecentDetections([]);
    }
  };

  // ✅ Enhanced stream status update
  const updateStreamStatus = async () => {
    try {
      console.log('🔵 LiveMonitoringPage: Updating stream status...');
      
      // Update each active stream status
      const updatedStreams = await Promise.all(
        activeStreams.map(async (stream) => {
          try {
            // ✅ Get stream status from backend service
            const camera = await cameraService.getCamera(stream.id);
            if (camera) {
              return {
                ...stream,
                isStreaming: camera.is_streaming,
                camera: camera,
                status: (camera.is_active ? 'online' : 'offline') as 'online' | 'offline' | 'connecting' | 'error'
              };
            }
            return stream;
          } catch (error) {
            console.warn(`Failed to update status for camera ${stream.id}:`, error);
            return { ...stream, status: 'error' as 'online' | 'offline' | 'connecting' | 'error' };
          }
        })
      );
      
      setActiveStreams(updatedStreams);
      
    } catch (error) {
      console.error('❌ LiveMonitoringPage: Error updating stream status:', error);
    }
  };

  // ✅ Enhanced stream control với backend endpoints từ #backend
  const handleStartStream = async (cameraId: string) => {
    try {
      console.log('🔵 LiveMonitoringPage: Starting stream for camera:', cameraId);
      
      // Update UI immediately for better UX
      setActiveStreams(prev => prev.map(stream => 
        stream.id === cameraId 
          ? { ...stream, status: 'connecting' }
          : stream
      ));
      
      // ✅ Use backend stream service từ #backend/app/routers/stream.py
      await cameraService.startStreaming(cameraId);
      
      // Update stream status
      setActiveStreams(prev => prev.map(stream => 
        stream.id === cameraId 
          ? { ...stream, isStreaming: true, status: 'online' }
          : stream
      ));
      
      toast.success('Đã bắt đầu phát trực tiếp thành công');
      console.log('✅ LiveMonitoringPage: Stream started successfully');
      
    } catch (error: any) {
      console.error('❌ LiveMonitoringPage: Error starting stream:', error);
      
      // Revert UI state
      setActiveStreams(prev => prev.map(stream => 
        stream.id === cameraId 
          ? { ...stream, status: 'error' }
          : stream
      ));
      
      toast.error(`Không thể bắt đầu phát trực tiếp: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const handleStopStream = async (cameraId: string) => {
    try {
      console.log('🔵 LiveMonitoringPage: Stopping stream for camera:', cameraId);
      
      // ✅ Use backend stream service từ #backend/app/routers/stream.py
      await cameraService.stopStreaming(cameraId);
      
      // Update stream status
      setActiveStreams(prev => prev.map(stream => 
        stream.id === cameraId 
          ? { ...stream, isStreaming: false, status: 'online' }
          : stream
      ));
      
      toast.success('Đã dừng phát trực tiếp thành công');
      console.log('✅ LiveMonitoringPage: Stream stopped successfully');
      
    } catch (error: any) {
      console.error('❌ LiveMonitoringPage: Error stopping stream:', error);
      toast.error(`Không thể dừng phát trực tiếp: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  // ✅ FIX: Recording toggle - implement when backend supports it
  const handleToggleRecording = async (cameraId: string) => {
    try {
      const stream = activeStreams.find(s => s.id === cameraId);
      if (!stream) return;
      
      // ✅ TODO: Implement recording API when backend supports it
      console.log('🔵 LiveMonitoringPage: Recording toggle not yet implemented in backend');
      toast.info('Tính năng ghi hình sẽ sớm có sẵn');
      
      // For now, just toggle local state
      setActiveStreams(prev => prev.map(s => 
        s.id === cameraId 
          ? { ...s, isRecording: !s.isRecording }
          : s
      ));
      
    } catch (error: any) {
      console.error('❌ LiveMonitoringPage: Error toggling recording:', error);
      toast.error('Failed to toggle recording');
    }
  };

  // ✅ Enhanced camera selection with validation
  const handleSelectCamera = (cameraId: string) => {
    const currentLayout = streamLayouts.find(l => l.type === layout);
    const maxStreams = currentLayout?.maxStreams || 4;
    
    setSelectedCameras(prev => {
      if (prev.includes(cameraId)) {
        return prev.filter(id => id !== cameraId);
      } else if (prev.length < maxStreams) {
        return [...prev, cameraId];
      } else {
        toast.warning(`Maximum ${maxStreams} streams allowed for current layout`);
        return prev;
      }
    });
  };

  // ✅ Enhanced layout change with camera limit handling
  const handleLayoutChange = (newLayout: StreamLayout['type']) => {
    const layoutConfig = streamLayouts.find(l => l.type === newLayout);
    if (layoutConfig && selectedCameras.length > layoutConfig.maxStreams) {
      setSelectedCameras(prev => prev.slice(0, layoutConfig.maxStreams));
      toast.info(`Reduced to ${layoutConfig.maxStreams} cameras for ${layoutConfig.label}`);
    }
    setLayout(newLayout);
  };

  // ✅ Helper functions
  const getStreamUrl = (camera: CameraDevice): string => {
    // ✅ Use backend stream endpoints from #backend/app/routers/stream.py
    if (camera.camera_type === 'webcam') {
      return `/api/stream/${camera.id}/video`;
    } else if (camera.camera_url) {
      return `/api/stream/${camera.id}/video`;
    } else {
      return `/api/stream/${camera.id}/video`; // Backend will handle dummy stream
    }
  };

  const getGridClass = () => {
    switch (layout) {
      case '1x1': return 'grid-cols-1';
      case '2x2': return 'grid-cols-1 md:grid-cols-2';
      case '3x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '4x4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 'list': return 'grid-cols-1';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  const filteredStreams = activeStreams.filter(stream => {
    switch (filterStatus) {
      case 'streaming': return stream.isStreaming;
      case 'detection': return stream.lastDetection;
      default: return true;
    }
  });

  // ✅ WebSocket event handlers
  const handleNewDetection = (detectionData: Detection) => {
    console.log('🔔 LiveMonitoringPage: New detection received:', detectionData);
    
    // Update recent detections
    setRecentDetections(prev => [detectionData, ...prev.slice(0, 19)]);
    
    // Update stream with last detection
    setActiveStreams(prev => prev.map(stream => 
      stream.camera.id === detectionData.camera_id 
        ? { ...stream, lastDetection: detectionData }
        : stream
    ));
    
    // Show notification for stranger detection
    if (detectionData.detection_type === 'stranger') {
      toast.warning(`Unknown person detected at ${detectionData.camera_name}`, {
        duration: 5000,
      });
    }
  };

  const handleStreamStatusUpdate = (statusData: any) => {
    console.log('📡 LiveMonitoringPage: Stream status update:', statusData);
    
    setActiveStreams(prev => prev.map(stream => 
      stream.id === statusData.camera_id 
        ? {
            ...stream,
            isStreaming: statusData.is_streaming,
            stats: statusData.stats || stream.stats
          }
        : stream
    ));
  };

  // ✅ Cleanup function
  const stopAllStreams = () => {
    Object.values(streamRefs.current).forEach(video => {
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    });
  };

  // ✅ Refresh all data
  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 LiveMonitoringPage: Refreshing all data...');
      
      await Promise.all([
        loadCameras(),
        loadRecentDetections(),
        updateStreamStatus()
      ]);
      
      toast.success('✅ Monitoring data refreshed');
      console.log('✅ LiveMonitoringPage: All data refreshed successfully');
      
    } catch (error) {
      console.error('❌ LiveMonitoringPage: Error refreshing data:', error);
      toast.error('Failed to refresh monitoring data');
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ Format time ago helper
  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  // ✅ Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải giám sát trực tiếp...</p>
          <p className="text-gray-500 text-sm mt-2">Đang kết nối với luồng camera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ✅ Enhanced Header với better status indicators */}
      <motion.div 
        className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-lg sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Enhanced */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MonitorPlay className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Giám sát trực tiếp
                  </h1>
                  <p className="text-sm text-gray-600">Giám sát camera thời gian thực & phát hiện</p>
                </div>
              </div>
              
              {/* Connection Status - Enhanced */}
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={isConnected ? "default" : "destructive"} 
                  className={`flex items-center space-x-2 px-3 py-1 shadow-sm ${
                    isConnected 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      <span>Đã kết nối</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      <span>Mất kết nối</span>
                    </>
                  )}
                </Badge>

                {/* Stats - Enhanced */}
                <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Camera className="h-4 w-4" />
                    <span>{activeStreams.length} camera</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Video className="h-4 w-4" />
                    <span>{activeStreams.filter(s => s.isStreaming).length} đang phát</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{selectedCameras.length} đang xem</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>{recentDetections.length} phát hiện</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Enhanced Controls */}
            <div className="flex items-center space-x-3">
              {/* Layout Selector */}
              <Select value={layout} onValueChange={handleLayoutChange}>
                <SelectTrigger className="w-40 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-xl">
                  {streamLayouts.map(layoutOption => (
                    <SelectItem key={layoutOption.type} value={layoutOption.type}>
                      <div className="flex items-center space-x-2">
                        {layoutOption.icon}
                        <span>{layoutOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter */}
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'streaming' | 'detection')}>
                <SelectTrigger className="w-36 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-xl">
                  <SelectItem value="all">Tất cả Camera</SelectItem>
                  <SelectItem value="streaming">Đang phát</SelectItem>
                  <SelectItem value="detection">Có phát hiện</SelectItem>
                </SelectContent>
              </Select>

              {/* Control Buttons */}
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Đang làm mới...' : 'Làm mới'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* ✅ Enhanced Main Stream Grid */}
        <div className="flex-1 p-6">
          {selectedCameras.length === 0 ? (
            <motion.div 
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl p-8 text-center max-w-md">
                <CardContent className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                    <MonitorPlay className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Chưa chọn camera nào</h3>
                  <p className="text-gray-600">Chọn camera từ thanh bên để bắt đầu giám sát trực tiếp</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => {
                        if (activeStreams.length > 0) {
                          setSelectedCameras([activeStreams[0].id]);
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Bắt đầu giám sát
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleRefreshAll}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Làm mới Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              className={`grid gap-6 h-full ${getGridClass()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {selectedCameras.map((cameraId, index) => {
                const stream = activeStreams.find(s => s.id === cameraId);
                if (!stream) return null;

                return (
                  <motion.div
                    key={cameraId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                        {stream.isStreaming ? (
                          <StreamPlayer
                            cameraId={cameraId}
                            cameraName={stream.camera.name}
                            className="w-full h-full"
                            onError={(error) => {
                              console.error(`Stream error for camera ${cameraId}:`, error);
                              toast.error(error);
                              // Update stream status to error
                              setActiveStreams(prev => prev.map(s => 
                                s.id === cameraId 
                                  ? { ...s, status: 'error', isStreaming: false }
                                  : s
                              ));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <div className="text-center">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
                                stream.status === 'error' 
                                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                                  : stream.status === 'connecting'
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}>
                                {stream.status === 'error' ? (
                                  <AlertTriangle className="h-8 w-8 text-white" />
                                ) : stream.status === 'connecting' ? (
                                  <RefreshCw className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                  <VideoOff className="h-8 w-8 text-white" />
                                )}
                              </div>
                              <p className="text-lg font-semibold text-gray-700 mb-1">
                                {stream.status === 'error' ? 'Lỗi luồng phát' :
                                 stream.status === 'connecting' ? 'Đang kết nối...' : 'Luồng phát ngoại tuyến'}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">{stream.camera.name}</p>
                              {stream.status !== 'connecting' && (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                                  onClick={() => handleStartStream(cameraId)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Bắt đầu phát
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ✅ Enhanced Stream Status Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <Badge 
                            variant={stream.isStreaming ? "default" : "secondary"}
                            className={`shadow-lg text-xs ${
                              stream.isStreaming 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {stream.isStreaming ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                                LIVE
                              </>
                            ) : (
                              'OFFLINE'
                            )}
                          </Badge>
                          
                          {stream.isRecording && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 shadow-lg text-xs">
                              <Circle className="h-3 w-3 mr-1 fill-current animate-pulse" />
                              REC
                            </Badge>
                          )}
                          
                          {stream.camera.detection_enabled && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 shadow-lg text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          
                          {stream.lastDetection && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shadow-lg text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              ALERT
                            </Badge>
                          )}
                        </div>

                        {/* ✅ Enhanced Stream Controls */}
                        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleRecording(cameraId)}
                            className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg cursor-pointer"
                          >
                            {stream.isRecording ? (
                              <Square className="h-4 w-4 text-red-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-600" />
                            )}
                          </Button>
                          
                          {stream.isStreaming ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStopStream(cameraId)}
                              className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg cursor-pointer"
                            >
                              <Square className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartStream(cameraId)}
                              disabled={stream.status === 'connecting'}
                              className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg cursor-pointer"
                            >
                              {stream.status === 'connecting' ? (
                                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* ✅ Enhanced Stream Info Overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm mb-1">{stream.camera.name}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{stream.camera.location || 'Không rõ'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{stream.viewCount}</span>
                                  </div>
                                </div>
                              </div>
                              {stream.lastDetection && (
                                <div className="text-right">
                                  <p className="text-xs font-medium text-gray-900">Phát hiện cuối</p>
                                  <p className="text-xs text-gray-600">
                                    {formatTimeAgo(stream.lastDetection.timestamp)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ✅ Enhanced Sidebar với better organization */}
        <motion.div 
          className="w-80 bg-white/90 backdrop-blur-xl border-l border-slate-200/60 shadow-xl overflow-y-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Camera List Section */}
          <div className="p-6 border-b border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Camera khả dụng</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {filteredStreams.length}
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleRefreshAll}
                  disabled={refreshing}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                      selectedCameras.includes(stream.id) 
                        ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleSelectCamera(stream.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            stream.status === 'online' && stream.isStreaming ? 'bg-emerald-500' :
                            stream.status === 'online' ? 'bg-blue-500' :
                            stream.status === 'connecting' ? 'bg-yellow-500' :
                            stream.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">{stream.camera.name}</p>
                            <p className="text-xs text-gray-500 truncate">{stream.camera.location || 'Không có vị trí'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            variant={stream.isStreaming ? "default" : "secondary"}
                            className={`text-xs ${
                              stream.isStreaming 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {stream.isStreaming ? 'Trực tiếp' : 'Ngoại tuyến'}
                          </Badge>
                          {stream.camera.detection_enabled && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredStreams.length === 0 && (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Không có camera nào phù hợp với bộ lọc của bạn</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setFilterStatus('all')}
                    className="mt-2"
                  >
                    Hiển thị tất cả
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Real-time Detection Alerts */}
          <div className="p-6">
            <DetectionAlerts className="w-full" maxAlerts={8} />
          </div>
        </motion.div>
      </div>

      {/* ✅ Enhanced Connection Alert */}
      {!isConnected && (
        <motion.div
          className="fixed bottom-6 left-6 right-6 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-red-50 border-red-200 shadow-xl backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Mất kết nối với dịch vụ giám sát trực tiếp. Đang cố gắng kết nối lại...
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};

export default LiveMonitoringPage;