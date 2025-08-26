import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Settings,
  Save,
  ArrowLeft,
  RefreshCw,
  Eye,
  Bell,
  Monitor,
  AlertTriangle,
  Info,
  Grid3X3,
  TestTube,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  VideoIcon,
  AudioWaveform,
  Target,

} from 'lucide-react';
import { cameraService } from '@/services/camera.service';
// Remove the CameraSettings import since it doesn't exist
import { Camera as CameraType } from '@/types/camera.types';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface CameraSettingsProps {
  className?: string;
}

interface StreamSettings {
  resolution: string;
  fps: number;
  bitrate: number;
  quality: 'auto' | 'high' | 'medium' | 'low';
  codec: 'h264' | 'h265' | 'mjpeg';
  audio_enabled: boolean;
  audio_bitrate: number;
}

interface DetectionSettings {
  enabled: boolean;
  confidence_threshold: number;
  detection_frequency: number;
  save_unknown_faces: boolean;
  blur_unknown_faces: boolean;
  detection_zones: Array<{
    id: string;
    name: string;
    points: Array<[number, number]>;
    enabled: boolean;
  }>;
  excluded_zones: Array<{
    id: string;
    name: string;
    points: Array<[number, number]>;
    enabled: boolean;
  }>;
}

interface NotificationSettings {
  email_notifications: boolean;
  webhook_url: string;
  notification_cooldown: number;
  notify_unknown_faces: boolean;
  notify_known_faces: boolean;
  notify_system_events: boolean;
}

interface RecordingSettings {
  enabled: boolean;
  record_on_detection: boolean;
  record_duration: number;
  max_storage_days: number;
  compression_level: number;
  record_audio: boolean;
}

interface SystemInfo {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  uptime: number;
  network_speed: {
    upload: number;
    download: number;
  };
  firmware_version: string;
  last_maintenance: string;
}

// interface BasicSettings {
//   name: string;
//   description: string;
//   location: string;
//   tags: string[];
//   is_active: boolean;
//   timezone: string;
// }

const CameraSettings: React.FC<CameraSettingsProps> = ({ className }) => {
  const { cameraId } = useParams<{ cameraId: string }>();
  const navigate = useNavigate();

  // Core state
  const [camera, setCamera] = useState<CameraType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [basicSettings, setBasicSettings] = useState({
    name: '',
    description: '',
    location: '',
    tags: [] as string[],
    is_active: true,
    timezone: 'UTC'
  });

  const RecordIcon = ({ className }: { className?: string }) => (
    <div className={`rounded-full bg-red-500 ${className}`} />
  );
  

  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    resolution: '1920x1080',
    fps: 30,
    bitrate: 2500,
    quality: 'auto',
    codec: 'h264',
    audio_enabled: false,
    audio_bitrate: 128
  });

  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>({
    enabled: true,
    confidence_threshold: 0.7,
    detection_frequency: 1,
    save_unknown_faces: true,
    blur_unknown_faces: false,
    detection_zones: [],
    excluded_zones: []
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    webhook_url: '',
    notification_cooldown: 300,
    notify_unknown_faces: true,
    notify_known_faces: false,
    notify_system_events: true
  });

  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings>({
    enabled: false,
    record_on_detection: true,
    record_duration: 30,
    max_storage_days: 30,
    compression_level: 3,
    record_audio: false
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Load camera data
  useEffect(() => {
    if (!cameraId) {
      setError('Camera ID not provided');
      setLoading(false);
      return;
    }

    const loadCameraSettings = async () => {
      try {
        setLoading(true);
        const [cameraData, settingsData, systemData] = await Promise.all([
          cameraService.getCamera(cameraId),
          cameraService.getCameraSettings(cameraId),
          cameraService.getSystemInfo(cameraId).catch(() => null)
        ]);

        setCamera(cameraData);
        
        // Load basic settings
        setBasicSettings({
          name: cameraData.name || '',
          description: cameraData.description || '',
          location: cameraData.location || '',
          tags: cameraData.tags || [],
          is_active: cameraData.is_active,
          timezone: cameraData.timezone || 'UTC'
        });

        // Load other settings
        // In the loadCameraSettings function, add type assertion for the quality field
        if (settingsData.stream_settings) {
          setStreamSettings({ 
            ...streamSettings, 
            ...settingsData.stream_settings,
            // Ensure quality is properly typed
            quality: (settingsData.stream_settings.quality as 'auto' | 'high' | 'medium' | 'low') || 'auto'
          });
        }
        if (settingsData.detection_settings) {
          setDetectionSettings({ ...detectionSettings, ...settingsData.detection_settings });
        }
        if (settingsData.notification_settings) {
          setNotificationSettings({ ...notificationSettings, ...settingsData.notification_settings });
        }
        if (settingsData.recording_settings) {
          setRecordingSettings({ ...recordingSettings, ...settingsData.recording_settings });
        }

        setSystemInfo(systemData);
      } catch (err) {
        setError('Failed to load camera settings');
        console.error('Error loading camera settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCameraSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId]);

  // Handle save settings
  const handleSaveSettings = async () => {
    if (!camera) return;

    try {
      setSaving(true);
      
      // Update camera basic info
      await cameraService.updateCamera(camera.id, basicSettings);
      
      // Update detailed settings
      const settingsData = {
        stream_settings: streamSettings,
        detection_settings: detectionSettings,
        notification_settings: notificationSettings,
        recording_settings: recordingSettings
      };
      
      await cameraService.updateCameraSettings(camera.id, settingsData);
      
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Test camera connection
  const handleTestConnection = async () => {
    if (!camera) return;

    try {
      setTesting(true);
      const result = await cameraService.testConnection(camera.id);
      
      if (result.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (err) {
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setStreamSettings({
      resolution: '1920x1080',
      fps: 30,
      bitrate: 2500,
      quality: 'auto',
      codec: 'h264',
      audio_enabled: false,
      audio_bitrate: 128
    });

    setDetectionSettings({
      enabled: true,
      confidence_threshold: 0.7,
      detection_frequency: 1,
      save_unknown_faces: true,
      blur_unknown_faces: false,
      detection_zones: [],
      excluded_zones: []
    });

    setHasChanges(true);
    toast.success('Settings reset to defaults');
  };

  // Export settings
  const handleExportSettings = () => {
    const exportData = {
      basic_settings: basicSettings,
      stream_settings: streamSettings,
      detection_settings: detectionSettings,
      notification_settings: { ...notificationSettings, webhook_url: '' }, // Remove sensitive data
      recording_settings: recordingSettings,
      exported_at: new Date().toISOString(),
      camera_name: camera?.name
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${camera?.name || 'camera'}_settings.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully');
  };

  // Helper functions
  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
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
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${className}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-slate-50/80 border-b border-slate-200 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cameras')}
              className="hover:bg-teal-50 hover:text-teal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Cài đặt camera</h1>
                <p className="text-sm text-slate-600">{camera.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
              className="border-slate-300 hover:bg-teal-50 hover:border-teal-300"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Kiểm tra kết nối
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSettings}
              className="border-slate-300 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất cài đặt
            </Button>

            <Button
              onClick={handleSaveSettings}
              disabled={saving || !hasChanges}
              size="sm"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Alert className="mt-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Bạn có những thay đổi chưa được lưu. Đừng quên lưu cài đặt của mình.
            </AlertDescription>
          </Alert>
        )}
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="basic" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <Camera className="w-4 h-4" />
              <span>Cơ bản</span>
            </TabsTrigger>
            <TabsTrigger value="stream" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <VideoIcon className="w-4 h-4" />
              <span>Luồng video</span>
            </TabsTrigger>
            <TabsTrigger value="detection" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <Eye className="w-4 h-4" />
              <span>Phát hiện</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <Bell className="w-4 h-4" />
              <span>Thông báo</span>
            </TabsTrigger>
            <TabsTrigger value="recording" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <RecordIcon className="h-5 w-5" />
              <span>Ghi hình</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-emerald-50 data-[state=active]:text-teal-700">
              <Monitor className="w-4 h-4" />
              <span>Hệ thống</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Settings */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <span>Thông tin cơ bản</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Tên camera</Label>
                    <Input
                      id="name"
                      value={basicSettings.name}
                      onChange={(e) => {
                        setBasicSettings(prev => ({ ...prev, name: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Nhập tên camera"
                      className="border-slate-300 focus:border-teal-500 focus:ring-teal-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-slate-700 font-medium">Vị trí</Label>
                    <Input
                      id="location"
                      value={basicSettings.location}
                      onChange={(e) => {
                        setBasicSettings(prev => ({ ...prev, location: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Ví dụ: Lối vào chính, Sảnh văn phòng"
                      className="border-slate-300 focus:border-teal-500 focus:ring-teal-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700 font-medium">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={basicSettings.description}
                    onChange={(e) => {
                      setBasicSettings(prev => ({ ...prev, description: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="Nhập mô tả camera"
                    rows={3}
                    className="border-slate-300 focus:border-teal-500 focus:ring-teal-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-slate-700 font-medium">Múi giờ</Label>
                    <Select
                      value={basicSettings.timezone}
                      onValueChange={(value) => {
                        setBasicSettings(prev => ({ ...prev, timezone: value }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-teal-500">
                        <SelectValue placeholder="Chọn múi giờ" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm">
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</SelectItem>
                        <SelectItem value="America/New_York">Giờ phương Đông</SelectItem>
                        <SelectItem value="America/Chicago">Giờ miền Trung</SelectItem>
                        <SelectItem value="America/Denver">Giờ miền Núi</SelectItem>
                        <SelectItem value="America/Los_Angeles">Giờ Thái Bình Dương</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Asia/Shanghai">Thượng Hải</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Trạng thái camera</Label>
                      <p className="text-sm text-slate-600">Bật hoặc tắt camera này</p>
                    </div>
                    <Switch
                      checked={basicSettings.is_active}
                      onCheckedChange={(checked) => {
                        setBasicSettings(prev => ({ ...prev, is_active: checked }));
                        setHasChanges(true);
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stream Settings */}
          <TabsContent value="stream" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Settings */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg">
                      <VideoIcon className="h-5 w-5 text-white" />
                    </div>
                    <span>Cài đặt video</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Độ phân giải</Label>
                    <Select
                      value={streamSettings.resolution}
                      onValueChange={(value) => {
                        setStreamSettings(prev => ({ ...prev, resolution: value }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-cyan-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm">
                        <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                        <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
                        <SelectItem value="1280x720">HD (1280x720)</SelectItem>
                        <SelectItem value="854x480">SD (854x480)</SelectItem>
                        <SelectItem value="640x360">Thấp (640x360)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Tốc độ khung hình: {streamSettings.fps} FPS</Label>
                    <Slider
                      value={[streamSettings.fps]}
                      onValueChange={([value]: [number]) => {
                        setStreamSettings(prev => ({ ...prev, fps: value }));
                        setHasChanges(true);
                      }}
                      max={60}
                      min={1}
                      step={1}
                      className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-teal-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1 FPS</span>
                      <span>60 FPS</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Bitrate: {streamSettings.bitrate} Kbps</Label>
                    <Slider
                      value={[streamSettings.bitrate]}
                      onValueChange={([value]: [number]) => {
                        setStreamSettings(prev => ({ ...prev, bitrate: value }));
                        setHasChanges(true);
                      }}
                      max={10000}
                      min={500}
                      step={100}
                      className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-teal-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>500 Kbps</span>
                      <span>10 Mbps</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Codec video</Label>
                    <Select
                      value={streamSettings.codec}
                      onValueChange={(value: any) => {
                        setStreamSettings(prev => ({ ...prev, codec: value }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-cyan-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm">
                        <SelectItem value="h264">H.264 (Khuyến nghị)</SelectItem>
                        <SelectItem value="h265">H.265/HEVC</SelectItem>
                        <SelectItem value="mjpeg">MJPEG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Cài đặt chất lượng</Label>
                    <Select
                      value={streamSettings.quality}
                      onValueChange={(value: any) => {
                        setStreamSettings(prev => ({ ...prev, quality: value }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-cyan-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm">
                        <SelectItem value="auto">Tự động</SelectItem>
                        <SelectItem value="high">Chất lượng cao</SelectItem>
                        <SelectItem value="medium">Chất lượng trung bình</SelectItem>
                        <SelectItem value="low">Chất lượng thấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Settings */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <AudioWaveform className="h-5 w-5 text-white" />
                    </div>
                    <span>Cài đặt âm thanh</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Bật âm thanh</Label>
                      <p className="text-sm text-slate-600">Ghi âm thanh cùng với video</p>
                    </div>
                    <Switch
                      checked={streamSettings.audio_enabled}
                      onCheckedChange={(checked) => {
                        setStreamSettings(prev => ({ ...prev, audio_enabled: checked }));
                        setHasChanges(true);
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500"
                    />
                  </div>

                  {streamSettings.audio_enabled && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Bitrate âm thanh: {streamSettings.audio_bitrate} Kbps</Label>
                      <Slider
                        value={[streamSettings.audio_bitrate]}
                        onValueChange={([value]: [number]) => {
                          setStreamSettings(prev => ({ ...prev, audio_bitrate: value }));
                          setHasChanges(true);
                        }}
                        max={320}
                        min={64}
                        step={32}
                        className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-emerald-500 [&_[role=slider]]:to-teal-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>64 Kbps</span>
                        <span>320 Kbps</span>
                      </div>
                    </div>
                  )}

                  <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Việc ghi âm có thể không hợp pháp ở tất cả các khu vực pháp lý. Vui lòng kiểm tra luật pháp địa phương trước khi bật.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detection Settings */}
          <TabsContent value="detection" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Face Detection */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <span>Phát hiện khuôn mặt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Bật phát hiện</Label>
                      <p className="text-sm text-slate-600">Phát hiện khuôn mặt trong luồng video</p>
                    </div>
                    <Switch
                      checked={detectionSettings.enabled}
                      onCheckedChange={(checked) => {
                        setDetectionSettings(prev => ({ ...prev, enabled: checked }));
                        setHasChanges(true);
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500"
                    />
                  </div>

                  {detectionSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Ngưỡng tin cậy: {(detectionSettings.confidence_threshold * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[detectionSettings.confidence_threshold]}
                          onValueChange={([value]: [number]) => {
                            setDetectionSettings(prev => ({ ...prev, confidence_threshold: value }));
                            setHasChanges(true);
                          }}
                          max={1}
                          min={0.1}
                          step={0.05}
                          className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-teal-500 [&_[role=slider]]:to-emerald-500"
                        />
                        <p className="text-xs text-slate-500">Giá trị cao hơn giảm phát hiện sai</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Tần suất phát hiện</Label>
                        <Select
                          value={detectionSettings.detection_frequency.toString()}
                          onValueChange={(value) => {
                            setDetectionSettings(prev => ({ ...prev, detection_frequency: parseInt(value) }));
                            setHasChanges(true);
                          }}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-teal-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-sm">
                            <SelectItem value="1">Mỗi khung hình</SelectItem>
                            <SelectItem value="2">Mỗi 2 khung hình</SelectItem>
                            <SelectItem value="5">Mỗi 5 khung hình</SelectItem>
                            <SelectItem value="10">Mỗi 10 khung hình</SelectItem>
                            <SelectItem value="30">Mỗi 30 khung hình</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-slate-200" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="space-y-0.5">
                            <Label className="text-slate-700 font-medium">Lưu khuôn mặt lạ</Label>
                            <p className="text-sm text-slate-600">Lưu trữ hình ảnh của khuôn mặt không nhận diện được</p>
                          </div>
                          <Switch
                            checked={detectionSettings.save_unknown_faces}
                            onCheckedChange={(checked) => {
                              setDetectionSettings(prev => ({ ...prev, save_unknown_faces: checked }));
                              setHasChanges(true);
                            }}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="space-y-0.5">
                            <Label className="text-slate-700 font-medium">Làm mờ khuôn mặt lạ</Label>
                            <p className="text-sm text-slate-600">Làm mờ khuôn mặt không nhận diện được trong bản ghi</p>
                          </div>
                          <Switch
                            checked={detectionSettings.blur_unknown_faces}
                            onCheckedChange={(checked) => {
                              setDetectionSettings(prev => ({ ...prev, blur_unknown_faces: checked }));
                              setHasChanges(true);
                            }}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Detection Zones */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <span>Vùng phát hiện</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Cấu hình các khu vực cụ thể để phát hiện khuôn mặt. Tính năng này yêu cầu luồng camera phải hoạt động.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Vùng phát hiện đang hoạt động</Label>
                    {detectionSettings.detection_zones.length > 0 ? (
                      <div className="space-y-2">
                        {detectionSettings.detection_zones.map((zone) => (
                          <div key={zone.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100">
                            <span className="text-sm font-medium text-slate-700">{zone.name}</span>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={zone.enabled}
                                onCheckedChange={(checked) => {
                                  setDetectionSettings(prev => ({
                                    ...prev,
                                    detection_zones: prev.detection_zones.map(z =>
                                      z.id === zone.id ? { ...z, enabled: checked } : z
                                    )
                                  }));
                                  setHasChanges(true);
                                }}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-emerald-500"
                              />
                              <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-300">
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200">Chưa cấu hình vùng phát hiện nào</p>
                    )}
                  </div>

                  <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50" disabled>
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Cấu hình vùng (Sắp ra mắt)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <span>Cài đặt thông báo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-slate-700 font-medium">Thông báo email</Label>
                      <p className="text-sm text-slate-600">Gửi thông báo qua email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) => {
                        setNotificationSettings(prev => ({ ...prev, email_notifications: checked }));
                        setHasChanges(true);
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook_url" className="text-slate-700 font-medium">URL Webhook (tùy chọn)</Label>
                    <Input
                      id="webhook_url"
                      type="url"
                      value={notificationSettings.webhook_url}
                      onChange={(e) => {
                        setNotificationSettings(prev => ({ ...prev, webhook_url: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="https://webhook-url-cua-ban.com/notifications"
                      className="border-slate-300 focus:border-amber-500 focus:ring-amber-200"
                    />
                    <p className="text-xs text-slate-500">Yêu cầu HTTP POST sẽ được gửi đến URL này</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Thời gian chờ thông báo: {notificationSettings.notification_cooldown}s</Label>
                    <Slider
                      value={[notificationSettings.notification_cooldown]}
                      onValueChange={([value]: [number]) => {
                        setNotificationSettings(prev => ({ ...prev, notification_cooldown: value }));
                        setHasChanges(true);
                      }}
                      max={3600}
                      min={30}
                      step={30}
                      className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>30 giây</span>
                      <span>1 giờ</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Loại thông báo</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="space-y-0.5">
                        <Label className="text-slate-700 font-medium">Phát hiện khuôn mặt lạ</Label>
                        <p className="text-sm text-slate-600">Cảnh báo khi phát hiện khuôn mặt lạ</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_unknown_faces}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, notify_unknown_faces: checked }));
                          setHasChanges(true);
                        }}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-500 data-[state=checked]:to-pink-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="space-y-0.5">
                        <Label className="text-slate-700 font-medium">Phát hiện khuôn mặt quen</Label>
                        <p className="text-sm text-slate-600">Cảnh báo khi phát hiện khuôn mặt quen</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_known_faces}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, notify_known_faces: checked }));
                          setHasChanges(true);
                        }}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="space-y-0.5">
                        <Label className="text-slate-700 font-medium">Sự kiện hệ thống</Label>
                        <p className="text-sm text-slate-600">Cảnh báo về vấn đề hệ thống và thay đổi trạng thái</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_system_events}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, notify_system_events: checked }));
                          setHasChanges(true);
                        }}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recording Settings */}
          <TabsContent value="recording" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                    <RecordIcon className="h-5 w-5" />
                  </div>
                  <span>Cài đặt ghi hình</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 font-medium">Bật ghi hình</Label>
                    <p className="text-sm text-slate-600">Tự động ghi hình video</p>
                  </div>
                  <Switch
                    checked={recordingSettings.enabled}
                    onCheckedChange={(checked) => {
                      setRecordingSettings(prev => ({ ...prev, enabled: checked }));
                      setHasChanges(true);
                    }}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-500 data-[state=checked]:to-pink-500"
                  />
                </div>

                {recordingSettings.enabled && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="space-y-0.5">
                          <Label className="text-slate-700 font-medium">Ghi khi phát hiện</Label>
                          <p className="text-sm text-slate-600">Chỉ ghi khi phát hiện khuôn mặt</p>
                        </div>
                        <Switch
                          checked={recordingSettings.record_on_detection}
                          onCheckedChange={(checked) => {
                            setRecordingSettings(prev => ({ ...prev, record_on_detection: checked }));
                            setHasChanges(true);
                          }}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Thời lượng ghi: {recordingSettings.record_duration}s</Label>
                        <Slider
                          value={[recordingSettings.record_duration]}
                          onValueChange={([value]: [number]) => {
                            setRecordingSettings(prev => ({ ...prev, record_duration: value }));
                            setHasChanges(true);
                          }}
                          max={300}
                          min={10}
                          step={5}
                          className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-red-500 [&_[role=slider]]:to-pink-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>10 giây</span>
                          <span>5 phút</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Lưu trữ: {recordingSettings.max_storage_days} ngày</Label>
                        <Slider
                          value={[recordingSettings.max_storage_days]}
                          onValueChange={([value]: [number]) => {
                            setRecordingSettings(prev => ({ ...prev, max_storage_days: value }));
                            setHasChanges(true);
                          }}
                          max={365}
                          min={1}
                          step={1}
                          className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>1 ngày</span>
                          <span>1 năm</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Mức nén: {recordingSettings.compression_level}</Label>
                        <Slider
                          value={[recordingSettings.compression_level]}
                          onValueChange={([value]: [number]) => {
                            setRecordingSettings(prev => ({ ...prev, compression_level: value }));
                            setHasChanges(true);
                          }}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-green-500 [&_[role=slider]]:to-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Thấp (File lớn)</span>
                          <span>Cao (File nhỏ)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                        <div className="space-y-0.5">
                          <Label className="text-slate-700 font-medium">Ghi âm thanh</Label>
                          <p className="text-sm text-slate-600">Bao gồm âm thanh trong bản ghi</p>
                        </div>
                        <Switch
                          checked={recordingSettings.record_audio}
                          onCheckedChange={(checked) => {
                            setRecordingSettings(prev => ({ ...prev, record_audio: checked }));
                            setHasChanges(true);
                          }}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Information */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-slate-600 to-gray-700 rounded-lg">
                      <Monitor className="h-5 w-5 text-white" />
                    </div>
                    <span>Trạng thái hệ thống</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {systemInfo ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-sm text-slate-700">Sử dụng CPU</Label>
                            <span className={`text-sm font-medium ${getStatusColor(systemInfo.cpu_usage, { warning: 70, critical: 90 })}`}>
                              {systemInfo.cpu_usage}%
                            </span>
                          </div>
                          <Progress value={systemInfo.cpu_usage} className={`h-2 ${getProgressColor(systemInfo.cpu_usage)}`} />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-sm text-slate-700">Sử dụng bộ nhớ</Label>
                            <span className={`text-sm font-medium ${getStatusColor(systemInfo.memory_usage, { warning: 80, critical: 95 })}`}>
                              {systemInfo.memory_usage}%
                            </span>
                          </div>
                          <Progress value={systemInfo.memory_usage} className={`h-2 ${getProgressColor(systemInfo.memory_usage)}`} />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-sm text-slate-700">Sử dụng ổ đĩa</Label>
                            <span className={`text-sm font-medium ${getStatusColor(systemInfo.disk_usage, { warning: 80, critical: 95 })}`}>
                              {systemInfo.disk_usage}%
                            </span>
                          </div>
                          <Progress value={systemInfo.disk_usage} className={`h-2 ${getProgressColor(systemInfo.disk_usage)}`} />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-sm text-slate-700">Nhiệt độ</Label>
                            <span className={`text-sm font-medium ${getStatusColor(systemInfo.temperature, { warning: 70, critical: 85 })}`}>
                              {systemInfo.temperature}°C
                            </span>
                          </div>
                          <Progress value={(systemInfo.temperature / 100) * 100} className="h-2" />
                        </div>
                      </div>

                      <Separator className="bg-slate-200" />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-slate-600">Thời gian hoạt động</Label>
                          <p className="font-medium text-slate-800">{formatUptime(systemInfo.uptime)}</p>
                        </div>
                        <div>
                          <Label className="text-slate-600">Phiên bản firmware</Label>
                          <p className="font-medium text-slate-800">{systemInfo.firmware_version}</p>
                        </div>
                        <div>
                          <Label className="text-slate-600">Tốc độ tải lên</Label>
                          <p className="font-medium text-slate-800">{formatBytes(systemInfo.network_speed.upload)}/s</p>
                        </div>
                        <div>
                          <Label className="text-slate-600">Tốc độ tải xuống</Label>
                          <p className="font-medium text-slate-800">{formatBytes(systemInfo.network_speed.download)}/s</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">Thông tin hệ thống không khả dụng</p>
                      <Button variant="outline" size="sm" className="mt-2 hover:bg-slate-50" onClick={handleTestConnection}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <span>Hành động hệ thống</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-slate-50" onClick={handleResetDefaults}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Đặt lại về mặc định
                    </Button>

                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-emerald-50 hover:border-emerald-300" onClick={handleExportSettings}>
                      <Download className="w-4 h-4 mr-2" />
                      Xuất cài đặt
                    </Button>

                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-blue-50" disabled>
                      <Upload className="w-4 h-4 mr-2" />
                      Nhập cài đặt
                    </Button>

                    <Separator className="bg-slate-200" />

                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-amber-50" disabled>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Khởi động lại camera
                    </Button>

                    <Button variant="destructive" className="w-full justify-start hover:bg-red-600" disabled>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Khôi phục cài đặt gốc
                    </Button>
                  </div>

                  <Alert className="mt-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Một số hành động yêu cầu truy cập vật lý vào camera hoặc có thể gây gián đoạn dịch vụ tạm thời.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CameraSettings;