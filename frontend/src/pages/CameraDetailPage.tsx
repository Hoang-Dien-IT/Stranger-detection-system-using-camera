import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
  ArrowLeft,
  Settings,
  Play,
  Square,
  MapPin,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Wifi,
  Activity,
  Info,
  Video,
  Clock,
  Calendar
} from 'lucide-react';
import { cameraService } from '@/services/camera.service';
import { Camera as CameraType } from '@/types/camera.types';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
// import CameraSettings from '@/components/cameras/CameraSettings';

// ✅ Interfaces theo backend response structure
interface CameraStats {
  uptime: number;
  last_detection: string | null;
  total_detections: number;
  streaming_time: number;
  viewers_count: number;
}

interface StreamStatus {
  is_streaming: boolean;
  is_recording: boolean;
  viewers_count: number;
  uptime: number;
  frame_rate: number;
  resolution: string;
}

const CameraDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // ✅ State management
  const [camera, setCamera] = useState<CameraType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [stats, setStats] = useState<CameraStats | null>(null);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (id) {
      loadCameraData(id);
      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        loadCameraStatus(id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [id]);

  // ✅ Load camera data từ backend
  const loadCameraData = async (cameraId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 CameraDetailPage: Loading camera data for:', cameraId);
      
      // Load camera details
      const cameraResponse = await cameraService.getCamera(cameraId);
      console.log('✅ CameraDetailPage: Camera loaded:', cameraResponse);
      setCamera(cameraResponse);
      
      // Load additional data
      await Promise.all([
        loadCameraStatus(cameraId),
        loadCameraStats(cameraId)
      ]);
      
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error loading camera:', error);
      setError(error.message || 'Failed to load camera details');
      toast.error(`Failed to load camera details: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load stream status
  const loadCameraStatus = async (cameraId: string) => {
    try {
      console.log('🔵 CameraDetailPage: Loading camera status for:', cameraId);
      
      // Sử dụng endpoint có trong backend
      const response = await fetch(`/api/stream/${cameraId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('✅ CameraDetailPage: Stream status loaded:', statusData);
        setStreamStatus(statusData);
      } else {
        // Fallback nếu endpoint không có
        console.warn('⚠️ CameraDetailPage: Stream status endpoint not available, using fallback');
        setStreamStatus({
          is_streaming: camera?.is_streaming || false,
          is_recording: camera?.is_recording || false,
          viewers_count: 0,
          uptime: 0,
          frame_rate: 30,
          resolution: camera?.stream_settings?.resolution || '640x480'
        });
      }
    } catch (error) {
      console.warn('⚠️ CameraDetailPage: Error loading stream status, using fallback:', error);
      setStreamStatus({
        is_streaming: camera?.is_streaming || false,
        is_recording: camera?.is_recording || false,
        viewers_count: 0,
        uptime: 0,
        frame_rate: 30,
        resolution: camera?.stream_settings?.resolution || '640x480'
      });
    }
  };

  // ✅ Load camera statistics - placeholder vì backend chưa có
  const loadCameraStats = async (cameraId: string) => {
    try {
      console.log('🔵 CameraDetailPage: Loading camera stats for:', cameraId);
      
      // TODO: Implement when backend has endpoint
      // For now, return mock data
      setStats({
        uptime: 86400, // 1 day
        last_detection: new Date().toISOString(),
        total_detections: 142,
        streaming_time: 3600, // 1 hour
        viewers_count: 1
      });
    } catch (error) {
      console.warn('⚠️ CameraDetailPage: Error loading camera stats:', error);
      setStats(null);
    }
  };

  // ✅ Start streaming - sử dụng backend endpoint
  const handleStartStream = async () => {
    if (!camera) return;
    
    try {
      setStreamLoading(true);
      console.log('🔵 CameraDetailPage: Starting stream for:', camera.id);
      
      await cameraService.startStreaming(camera.id);
      
      // Update local state
      setCamera(prev => prev ? { ...prev, is_streaming: true } : null);
      await loadCameraStatus(camera.id);
      
      toast.success('Stream started successfully');
      console.log('✅ CameraDetailPage: Stream started successfully');
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error starting stream:', error);
      toast.error(`Failed to start stream: ${error.message || 'Unknown error'}`);
    } finally {
      setStreamLoading(false);
    }
  };

  // ✅ Stop streaming - sử dụng backend endpoint
  const handleStopStream = async () => {
    if (!camera) return;
    
    try {
      setStreamLoading(true);
      console.log('🔵 CameraDetailPage: Stopping stream for:', camera.id);
      
      await cameraService.stopStreaming(camera.id);
      
      // Update local state
      setCamera(prev => prev ? { ...prev, is_streaming: false } : null);
      await loadCameraStatus(camera.id);
      
      toast.success('Stream stopped successfully');
      console.log('✅ CameraDetailPage: Stream stopped successfully');
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error stopping stream:', error);
      toast.error(`Failed to stop stream: ${error.message || 'Unknown error'}`);
    } finally {
      setStreamLoading(false);
    }
  };

  // ✅ Test camera connection - sử dụng backend endpoint
  const handleTestConnection = async () => {
    if (!camera) return;
    
    try {
      setConnectionTesting(true);
      console.log('🔵 CameraDetailPage: Testing camera connection for:', camera.id);
      
      // ✅ Show loading toast
      toast.info(`🔍 Testing connection to ${camera.name}...`);
      
      const result = await cameraService.testCamera(camera.id);
      console.log('✅ CameraDetailPage: Connection test result:', result);
      
      // ✅ Enhanced result handling based on backend response
      if (result.is_connected) {
        // ✅ Success - show detailed info
        const successMessage = result.status === 'success' 
          ? `✅ ${camera.name}: ${result.message}`
          : `✅ ${camera.name} connection successful`;
        
        toast.success(successMessage, {
          description: result.connection_type ? `Connection Type: ${result.connection_type}` : undefined
        });
        
        // ✅ Update camera last_online status if needed
        if (camera.camera_type !== 'webcam') {
          await loadCameraData(camera.id); // Refresh to get updated last_online
        }
      } else if (result.status === 'warning') {
        // ✅ Warning - show warning message
        toast.warning(`⚠️ ${camera.name}: ${result.message}`, {
          description: 'Camera configuration may need attention'
        });
      } else {
        // ✅ Error - show detailed error
        toast.error(`❌ ${camera.name}: ${result.message}`, {
          description: result.camera_url ? `URL: ${result.camera_url}` : 'Check camera configuration'
        });
      }
      
      // ✅ Show additional info for different camera types
      if (result.camera_type === 'webcam') {
        toast.info('💡 Webcam cameras are tested locally when streaming starts');
      }
      
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error testing connection:', error);
      toast.error(`❌ Connection test failed: ${error.message || 'Unknown error'}`, {
        description: 'Please check your network connection and camera settings'
      });
    } finally {
      setConnectionTesting(false);
    }
  };

  // ✅ Start/Stop detection
  const handleToggleDetection = async () => {
    if (!camera) return;
    
    try {
      console.log('🔵 CameraDetailPage: Toggling detection for:', camera.id);
      
      if (camera.detection_enabled) {
        await cameraService.stopDetection(camera.id);
        toast.success('Detection stopped');
      } else {
        await cameraService.startDetection(camera.id);
        toast.success('Detection started');
      }
      
      // Reload camera data
      await loadCameraData(camera.id);
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error toggling detection:', error);
      toast.error(`Failed to toggle detection: ${error.message || 'Unknown error'}`);
    }
  };

  // ✅ Capture snapshot
  const handleCaptureSnapshot = async () => {
    if (!camera) return;
    
    try {
      console.log('🔵 CameraDetailPage: Capturing snapshot for:', camera.id);
      
      // Use direct API call since captureSnapshot method doesn't exist
      const response = await fetch(`/api/cameras/${camera.id}/snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to capture snapshot: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ CameraDetailPage: Snapshot captured:', result);
      
      toast.success('Snapshot captured successfully');
    } catch (error: any) {
      console.error('❌ CameraDetailPage: Error capturing snapshot:', error);
      toast.error(`Failed to capture snapshot: ${error.message || 'Unknown error'}`);
    }
  };

  // ✅ Helper functions
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !camera) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Not Found</h3>
            <p className="text-gray-600 mb-4">{error || 'The requested camera could not be found.'}</p>
            <Button onClick={() => navigate('/cameras')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cameras
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cameras')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{camera.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{camera.description || 'Camera Details'}</span>
                  <span>•</span>
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCameraData(camera.id)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={connectionTesting}
            >
              {connectionTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>

            {camera.is_streaming ? (
              <Button 
                variant="outline" 
                onClick={handleStopStream}
                disabled={streamLoading}
              >
                {streamLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                Stop Stream
              </Button>
            ) : (
              <Button 
                onClick={handleStartStream}
                disabled={streamLoading}
              >
                {streamLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Stream
              </Button>
            )}
            
            <Button variant="outline" onClick={() => navigate(`/cameras/${camera.id}/settings`)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stream">Live Stream</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Camera Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="w-5 h-5" />
                      <span>Camera Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="font-medium">{camera.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="font-medium capitalize">{camera.camera_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">URL</label>
                        <p className="font-medium text-sm font-mono">
                          {camera.camera_url || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created</label>
                        <p className="font-medium">
                          {new Date(camera.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {getStatusIcon(camera.is_active)}
                          <span className={`text-sm font-medium ${getStatusColor(camera.is_active)}`}>
                            {camera.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Camera Status</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {getStatusIcon(camera.is_streaming)}
                          <span className={`text-sm font-medium ${getStatusColor(camera.is_streaming)}`}>
                            {camera.is_streaming ? 'Streaming' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Stream Status</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {getStatusIcon(camera.detection_enabled)}
                          <span className={`text-sm font-medium ${getStatusColor(camera.detection_enabled)}`}>
                            {camera.detection_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Detection</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {getStatusIcon(camera.is_recording)}
                          <span className={`text-sm font-medium ${getStatusColor(camera.is_recording)}`}>
                            {camera.is_recording ? 'Recording' : 'Stopped'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Recording</p>
                      </div>
                    </div>

                    {camera.location && (
                      <div className="pt-4 border-t">
                        <label className="text-sm font-medium text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Location
                        </label>
                        <p className="font-medium">{camera.location}</p>
                      </div>
                    )}

                    {camera.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-800">{camera.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Camera Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleToggleDetection}
                      >
                        {camera.detection_enabled ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Stop Detection
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Start Detection
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCaptureSnapshot}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Snapshot
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleTestConnection}
                        disabled={connectionTesting}
                      >
                        {connectionTesting ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wifi className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/cameras/${camera.id}/settings`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Camera Preview & Stats */}
              <div className="space-y-6">
                {/* Live Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Video className="w-5 h-5" />
                      <span>Live Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {camera.is_streaming ? (
                        <img
                          src={`/api/cameras/${camera.id}/snapshot`}
                          alt="Camera preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <div class="text-center">
                                  <div class="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                                  <p class="text-gray-500 text-sm">Preview Not Available</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Camera Offline</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Resolution</span>
                        <span className="font-medium">
                          {streamStatus?.resolution || camera.stream_settings?.resolution || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">FPS</span>
                        <span className="font-medium">
                          {streamStatus?.frame_rate || camera.stream_settings?.fps || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quality</span>
                        <span className="font-medium">
                          {camera.stream_settings?.quality || 'N/A'}
                        </span>
                      </div>
                      {streamStatus && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Viewers</span>
                            <span className="font-medium">{streamStatus.viewers_count}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Uptime</span>
                            <span className="font-medium">{formatUptime(streamStatus.uptime)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>Thống kê nhanh</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tổng số nhận diện</span>
                        <span className="font-medium">{stats.total_detections}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Nhận diện gần nhất</span>
                        <span className="font-medium">
                          {stats.last_detection ? new Date(stats.last_detection).toLocaleString() : 'Không có'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Thời gian phát trực tiếp</span>
                        <span className="font-medium">{formatUptime(stats.streaming_time)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Thời gian hoạt động</span>
                        <span className="font-medium">{formatUptime(stats.uptime)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Stream Tab */}
          <TabsContent value="stream">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Phát trực tiếp</span>
                  {camera.is_streaming && (
                    <Badge className="bg-red-100 text-red-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      TRỰC TIẾP
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {camera.is_streaming ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="w-16 h-16 mx-auto mb-4" />
                        <p className="mb-2">Đang phát trực tiếp</p>
                        <p className="text-sm text-gray-300">
                          Đường dẫn phát: /api/stream/{camera.id}/video
                        </p>
                        {/* TODO: Implement actual video stream component */}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4" />
                        <p className="mb-2">Camera chưa phát trực tiếp</p>
                        <Button onClick={handleStartStream} disabled={streamLoading}>
                          {streamLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Bắt đầu phát trực tiếp
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stream Controls */}
                {camera.is_streaming && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Resolution: {streamStatus?.resolution || 'N/A'}</span>
                      <span>FPS: {streamStatus?.frame_rate || 'N/A'}</span>
                      <span>Viewers: {streamStatus?.viewers_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCaptureSnapshot}>
                          <Camera className="w-4 h-4 mr-2" />
                          Chụp ảnh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleStopStream} disabled={streamLoading}>
                          {streamLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Square className="w-4 h-4 mr-2" />
                          )}
                          Dừng phát trực tiếp
                        </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Thống kê hiệu suất</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.total_detections || 0}
                      </div>
                      <div className="text-sm text-gray-600">Tổng số nhận diện</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {formatUptime(stats?.uptime || 0)}
                        </div>
                        <div className="text-xs text-gray-600">Thời gian hoạt động</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {formatUptime(stats?.streaming_time || 0)}
                        </div>
                        <div className="text-xs text-gray-600">Thời gian phát trực tiếp</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Mốc thời gian</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-medium">
                        {new Date(camera.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {camera.updated_at && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Cập nhật lần cuối:</span>
                        <span className="font-medium">
                          {new Date(camera.updated_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {camera.last_online && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Wifi className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Lần online gần nhất:</span>
                        <span className="font-medium">
                          {new Date(camera.last_online).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {stats?.last_detection && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Nhận diện gần nhất:</span>
                        <span className="font-medium">
                          {new Date(stats.last_detection).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          {/* <TabsContent value="settings">
            <CameraSettings cameraId={camera.id} />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
};

export default CameraDetailPage;