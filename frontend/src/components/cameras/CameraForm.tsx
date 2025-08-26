import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Save,
  TestTube,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';
import { Camera as CameraType, CameraCreate, CameraUpdate } from '@/types/camera.types';

// Giao diện form quản lý camera
interface CameraFormProps {
  camera?: CameraType | CameraCreate | null;
  onSave: (camera: CameraCreate | CameraUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  status?: 'success' | 'error' | 'warning';
  details?: {
    resolution?: string;
    fps?: number;
    codec?: string;
    bitrate?: string;
  };
}

const CameraForm: React.FC<CameraFormProps> = ({
  camera,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<CameraCreate>({
    name: '',
    description: '',
    camera_type: 'ip_camera',
    camera_url: '',
    detection_enabled: true,
    stream_settings: {
      resolution: '1920x1080',
      fps: 30,
      quality: 'high'
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(false);

  // Xử lý dữ liệu camera khi có thay đổi
  useEffect(() => {
    if (camera) {
      setFormData({
        name: camera.name || '',
        description: camera.description || '',
        location: camera.location || '',
        camera_type: camera.camera_type || 'ip_camera',
        camera_url: camera.camera_url || '',
        detection_enabled: camera.detection_enabled ?? true,
        is_streaming: camera.is_streaming ?? false,
        tags: camera.tags || [],
        stream_settings: {
          resolution: camera.stream_settings?.resolution || '1920x1080',
          fps: camera.stream_settings?.fps || 30,
          quality: camera.stream_settings?.quality || 'high'
        },
        alert_settings: {
          email_alerts: camera.alert_settings?.email_alerts ?? false,
          webhook_url: camera.alert_settings?.webhook_url || ''
        }
      });
    }
  }, [camera]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStreamSettingChange = (setting: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      stream_settings: {
        ...prev.stream_settings,
        [setting]: value
      }
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên camera là bắt buộc';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên camera phải có ít nhất 3 ký tự';
    }

    if (!formData.camera_url?.trim()) {
      newErrors.camera_url = 'URL camera là bắt buộc';
    } else if (!isValidCameraUrl(formData.camera_url)) {
      newErrors.camera_url = 'Vui lòng nhập URL camera hợp lệ';
    }

    if (formData.stream_settings?.fps && (formData.stream_settings.fps < 1 || formData.stream_settings.fps > 60)) {
      newErrors.fps = 'FPS phải nằm trong khoảng từ 1 đến 60';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCameraUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['rtsp:', 'http:', 'https:', 'rtmp:'].includes(urlObj.protocol);
    } catch {
      // Kiểm tra đường dẫn thiết bị như /dev/video0
      return /^\/dev\/video\d+$/.test(url) || /^\d+$/.test(url);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.camera_url) {
      toast.error('Vui lòng nhập URL camera trước');
      return;
    }

    if (!isValidCameraUrl(formData.camera_url)) {
      toast.error('Vui lòng nhập URL camera hợp lệ');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      console.log('Đang kiểm tra kết nối camera với dữ liệu:', formData);
      
      // Gọi service để test camera
      const { cameraService } = await import('@/services/camera.service');
      const result = await cameraService.testCameraConnection(formData);
      
      // Chuyển đổi kết quả từ service thành định dạng hiển thị
      const testResult: TestResult = {
        success: result.is_connected || result.status === 'success',
        message: result.message,
        status: result.status,
        details: result.stream_info ? {
          resolution: result.stream_info.resolution,
          fps: result.stream_info.fps,
          codec: result.stream_info.codec,
          bitrate: result.stream_info.bitrate
        } : undefined
      };
      
      setTestResult(testResult);
      
      if (testResult.success) {
        toast.success('Kiểm tra kết nối camera thành công!', {
          description: testResult.message
        });
      } else {
        toast.error('Kiểm tra kết nối camera thất bại', {
          description: testResult.message
        });
      }
    } catch (error: any) {
      console.error('Lỗi kiểm tra camera:', error);
      const result: TestResult = {
        success: false,
        message: error.message || 'Kiểm tra kết nối thất bại',
        status: 'error'
      };
      setTestResult(result);
      toast.error('Kiểm tra camera thất bại', {
        description: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng sửa các lỗi trong form');
      return;
    }

    try {
      await onSave(formData);
      // Kiểm tra camera có id để xác định có đang chỉnh sửa không
      const isEditing = !!(camera && 'id' in camera && camera.id);
      toast.success(isEditing ? 'Cập nhật camera thành công' : 'Thêm camera thành công');
    } catch (error) {
      toast.error('Không thể lưu camera');
    }
  };

  // Xác định có đang chỉnh sửa bằng cách kiểm tra camera có id không
  const isEditing = !!(camera && 'id' in camera && camera.id);

  const getUrlPlaceholder = () => {
    switch (formData.camera_type) {
      case 'ip_camera':
        return 'rtsp://taikhoan:matkhau@192.168.1.100:554/stream';
      case 'rtsp':
        return 'rtsp://192.168.1.100:554/stream1';
      case 'webcam':
        return '/dev/video0 hoặc 0';
      case 'usb':
      case 'usb_camera':
        return '/dev/video1 hoặc 1';
      default:
        return 'Nhập URL camera hoặc đường dẫn thiết bị';
    }
  };

  return (
    <Card className="max-w-5xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-slate-50/80 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white p-8">
        <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Camera className="h-8 w-8" />
          </div>
          <div>
            <span>{isEditing ? 'Chỉnh sửa camera' : 'Thêm camera mới'}</span>
            <p className="text-sm font-normal opacity-90 mt-1">
              {isEditing ? 'Cập nhật thông tin và cài đặt camera' : 'Thiết lập camera mới cho hệ thống giám sát'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-gradient-to-br from-white to-slate-50/50">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Thông tin cơ bản */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b-2 border-teal-100">
              <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Thông tin cơ bản</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3 group">
                <Label htmlFor="name" className="text-base font-semibold text-slate-700">Tên camera *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Camera cửa chính"
                  className={`h-12 text-base border-2 transition-all duration-300 focus:scale-[1.02] ${
                    errors.name 
                      ? 'border-red-400 bg-red-50 focus:border-red-500' 
                      : 'border-slate-200 bg-white/80 focus:border-teal-500 focus:bg-white'
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-3 group">
                <Label htmlFor="camera_type" className="text-base font-semibold text-slate-700">Loại camera *</Label>
                <Select 
                  value={formData.camera_type} 
                  onValueChange={(value) => handleSelectChange('camera_type', value)}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200 bg-white/80 focus:border-teal-500 transition-all duration-300">
                    <SelectValue placeholder="Chọn loại camera" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200">
                    <SelectItem value="ip_camera" className="text-base py-3">Camera IP (RTSP/HTTP)</SelectItem>
                    <SelectItem value="rtsp" className="text-base py-3">Camera RTSP</SelectItem>
                    <SelectItem value="webcam" className="text-base py-3">Webcam</SelectItem>
                    <SelectItem value="usb" className="text-base py-3">Camera USB</SelectItem>
                    <SelectItem value="usb_camera" className="text-base py-3">Camera USB (khác)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold text-slate-700">Mô tả</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả vị trí và mục đích sử dụng camera (tùy chọn)"
                rows={4}
                className="text-base border-2 border-slate-200 bg-white/80 focus:border-teal-500 focus:bg-white transition-all duration-300 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-semibold text-slate-700">Vị trí</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ví dụ: Lối vào chính, Cửa văn phòng"
                className="h-12 text-base border-2 border-slate-200 bg-white/80 focus:border-teal-500 focus:bg-white transition-all duration-300"
              />
            </div>
          </div>

          {/* Cấu hình camera */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b-2 border-emerald-100">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Wifi className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Cài đặt kết nối</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="camera_url" className="text-base font-semibold text-slate-700">URL camera / Đường dẫn thiết bị *</Label>
                <div className="relative">
                  <Input
                    id="camera_url"
                    name="camera_url"
                    type={showPassword ? "text" : "password"}
                    value={formData.camera_url}
                    onChange={handleInputChange}
                    placeholder={getUrlPlaceholder()}
                    className={`h-12 text-base pr-24 border-2 transition-all duration-300 ${
                      errors.camera_url 
                        ? 'border-red-400 bg-red-50 focus:border-red-500' 
                        : 'border-slate-200 bg-white/80 focus:border-teal-500 focus:bg-white'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-8 w-8 p-0 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testing || !formData.camera_url}
                      className="h-8 w-8 p-0 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <TestTube className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>
                  </div>
                </div>
                {errors.camera_url && (
                  <p className="text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.camera_url}
                  </p>
                )}
                <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium text-slate-700">Ví dụ định dạng URL:</p>
                  <p>• RTSP: rtsp://taikhoan:matkhau@ip:port/duongdan</p>
                  <p>• HTTP: http://ip:port/stream</p>
                  <p>• Webcam: /dev/video0 hoặc số thiết bị (0, 1, 2...)</p>
                </div>
              </div>

              {/* Kết quả kiểm tra */}
              {testResult && (
                <Alert 
                  variant={testResult.success ? "default" : "destructive"} 
                  className={`border-l-4 p-4 ${
                    testResult.success 
                      ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50' 
                      : 'border-l-red-500 bg-gradient-to-r from-red-50 to-rose-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {testResult.success ? (
                      <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className="font-semibold text-base">
                        {testResult.message}
                      </AlertDescription>
                      {testResult.success && testResult.details && (
                        <div className="mt-3 text-sm text-slate-700">
                          <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-lg">
                            <div className="flex justify-between">
                              <span className="font-medium">Độ phân giải:</span>
                              <span>{testResult.details.resolution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">FPS:</span>
                              <span>{testResult.details.fps}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Codec:</span>
                              <span>{testResult.details.codec}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Bitrate:</span>
                              <span>{testResult.details.bitrate}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </div>

          {/* Cài đặt stream */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b-2 border-cyan-100">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Cài đặt stream</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label htmlFor="resolution" className="text-base font-semibold text-slate-700">Độ phân giải</Label>
                <Select 
                  value={formData.stream_settings?.resolution} 
                  onValueChange={(value) => handleStreamSettingChange('resolution', value)}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200 bg-white/80 focus:border-cyan-500 transition-all duration-300">
                    <SelectValue placeholder="Chọn độ phân giải" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md">
                    <SelectItem value="640x480" className="text-base py-3">640x480 (VGA)</SelectItem>
                    <SelectItem value="1280x720" className="text-base py-3">1280x720 (HD)</SelectItem>
                    <SelectItem value="1920x1080" className="text-base py-3">1920x1080 (Full HD)</SelectItem>
                    <SelectItem value="2560x1440" className="text-base py-3">2560x1440 (2K)</SelectItem>
                    <SelectItem value="3840x2160" className="text-base py-3">3840x2160 (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fps" className="text-base font-semibold text-slate-700">Tốc độ khung hình (FPS)</Label>
                <Input
                  id="fps"
                  type="number"
                  value={formData.stream_settings?.fps || ''}
                  onChange={(e) => handleStreamSettingChange('fps', parseInt(e.target.value) || 30)}
                  placeholder="30"
                  className={`h-12 text-base border-2 transition-all duration-300 ${
                    errors.fps 
                      ? 'border-red-400 bg-red-50 focus:border-red-500' 
                      : 'border-slate-200 bg-white/80 focus:border-cyan-500 focus:bg-white'
                  }`}
                />
                {errors.fps && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{errors.fps}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="quality" className="text-base font-semibold text-slate-700">Chất lượng</Label>
                <Select 
                  value={formData.stream_settings?.quality} 
                  onValueChange={(value) => handleStreamSettingChange('quality', value)}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-slate-200 bg-white/80 focus:border-cyan-500 transition-all duration-300">
                    <SelectValue placeholder="Chọn chất lượng" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md">
                    <SelectItem value="low" className="text-base py-3">Thấp (nhanh hơn)</SelectItem>
                    <SelectItem value="medium" className="text-base py-3">Trung bình</SelectItem>
                    <SelectItem value="high" className="text-base py-3">Cao (chất lượng tốt hơn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cài đặt phát hiện */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b-2 border-orange-100">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Cài đặt phát hiện</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex-1">
                  <Label htmlFor="detection_enabled" className="text-base font-semibold text-slate-800">Bật phát hiện khuôn mặt</Label>
                  <p className="text-sm text-slate-600 mt-1">Tự động phát hiện khuôn mặt trong luồng camera</p>
                </div>
                <Switch
                  id="detection_enabled"
                  checked={formData.detection_enabled}
                  onCheckedChange={(checked) => handleSwitchChange('detection_enabled', checked)}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {/* Nút hành động form */}
          <div className="flex space-x-6 pt-8 border-t-2 border-slate-200">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  {isEditing ? 'Đang cập nhật...' : 'Đang thêm...'}
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-3" />
                  {isEditing ? 'Cập nhật camera' : 'Thêm camera'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-8 h-14 text-lg font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300"
            >
              <X className="w-5 h-5 mr-2" />
              Hủy bỏ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CameraForm;