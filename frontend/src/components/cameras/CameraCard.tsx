import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  MoreVertical,
  Play,
  Square,
  Eye,
  Settings,
  Trash2,
  AlertCircle,
  MapPin,
  Clock,
  Signal,
  SignalHigh,
  SignalLow,
  Wifi,
  WifiOff,
  Video,
  VideoOff,
  Activity,
  Users,
  CheckCircle,
  XCircle,
  Monitor,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraType } from '@/types/camera.types';
import { toast } from 'sonner';

// ✅ TÍNH NĂNG: Interface được nâng cấp phù hợp với khả năng backend
interface CameraCardProps {
  camera: CameraType;
  onEdit: (camera: CameraType) => void;
  onDelete: (camera: CameraType) => void;
  onStartStream: (camera: CameraType) => void;
  onStopStream: (camera: CameraType) => void;
  onTestConnection: (camera: CameraType) => void;
  onToggleDetection?: (camera: CameraType) => void;
  onTakeSnapshot?: (camera: CameraType) => void; // ✅ THÊM: Tính năng chụp ảnh từ backend
  streamStats?: {
    viewers: number;
    uptime: string;
    bandwidth: string;
    frame_rate?: number;
    resolution?: string;
  };
  loading?: boolean;
}

const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  onEdit,
  onDelete,
  onStartStream,
  onStopStream,
  onTestConnection,
  onToggleDetection,
  onTakeSnapshot,
  streamStats,
  loading = false
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Hiển thị trạng thái camera
  const getStatusBadge = () => {
    if (camera.is_streaming) {
      return (
        <Badge className="bg-emerald-600 text-white shadow-lg border border-emerald-700">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-bounce" />
          Đang Phát
        </Badge>
      );
    } else if (camera.is_active) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-900 border border-amber-300">Sẵn Sàng</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-rose-100 text-rose-900 border border-rose-300">Ngoại Tuyến</Badge>;
    }
  };

  // Hiển thị icon tín hiệu
  const getSignalIcon = () => {
    if (camera.is_streaming) {
      return <SignalHigh className="h-4 w-4 text-emerald-600" />;
    } else if (camera.is_active) {
      return <Signal className="h-4 w-4 text-amber-600" />;
    } else {
      return <SignalLow className="h-4 w-4 text-rose-600" />;
    }
  };

  // Hiển thị icon kết nối
  const getConnectionIcon = () => {
    if (camera.is_streaming || camera.is_active) {
      return <Wifi className="h-4 w-4 text-emerald-600" />;
    } else {
      return <WifiOff className="h-4 w-4 text-rose-600" />;
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  // Định dạng thời gian hoạt động
  const formatUptime = (uptime: string | number) => {
    try {
      const seconds = typeof uptime === 'string' ? parseInt(uptime) : uptime;
      if (isNaN(seconds)) return '0 phút';
      
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (days > 0) return `${days} ngày ${hours} giờ`;
      if (hours > 0) return `${hours} giờ ${minutes} phút`;
      return `${minutes} phút`;
    } catch {
      return '0 phút';
    }
  };

  // Lấy URL xem trước
  const getPreviewUrl = () => {
    if (camera.is_streaming) {
      return `/api/stream/${camera.id}/snapshot`;
    }
    return null;
  };

  // Chụp ảnh nhanh
  const handleTakeSnapshot = async () => {
    if (!onTakeSnapshot) return;
    
    setSnapshotLoading(true);
    try {
      await onTakeSnapshot(camera);
      toast.success('Chụp ảnh thành công');
    } catch (error: any) {
      toast.error(`Không thể chụp ảnh: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  // Hiển thị loại camera
  const getCameraTypeDisplay = () => {
    switch (camera.camera_type) {
      case 'webcam':
        return { label: 'Webcam', icon: Monitor };
      case 'ip_camera':
        return { label: 'Camera IP', icon: Camera };
      case 'usb_camera':
        return { label: 'Camera USB', icon: Monitor };
      default:
        return { label: camera.camera_type, icon: Camera };
    }
  };

  const cameraTypeInfo = getCameraTypeDisplay();
  const CameraTypeIcon = cameraTypeInfo.icon;

  // Ẩn thông tin URL để bảo mật
  const getMaskedUrl = (url: string) => {
    try {
      // Thay thế thông tin đăng nhập trong URL để bảo mật
      return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1***$2');
    } catch {
      return 'URL không hợp lệ';
    }
  };

  // Phát hiện giao thức kết nối
  const getProtocolInfo = (url: string) => {
    try {
      if (url.startsWith('rtsp://')) return { protocol: 'RTSP', color: 'blue' };
      if (url.startsWith('http://') || url.startsWith('https://')) return { protocol: 'HTTP', color: 'green' };
      if (url.startsWith('ws://') || url.startsWith('wss://')) return { protocol: 'WebSocket', color: 'purple' };
      return { protocol: 'Tùy Chỉnh', color: 'gray' };
    } catch {
      return { protocol: 'Không Xác Định', color: 'gray' };
    }
  };

  const protocolInfo = getProtocolInfo(camera.camera_url || '');

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 border border-slate-200 rounded-xl bg-gradient-to-br from-white via-slate-50 to-blue-50 group hover:scale-[1.02] hover:border-blue-300">
      <CardContent className="p-0">
        {/* Khung hiển thị camera */}
        <div className="aspect-video bg-gradient-to-br from-slate-200 via-slate-300 to-blue-200 relative overflow-hidden rounded-t-xl">
          {camera.is_streaming ? (
            <div className="relative w-full h-full">
              {!imageError ? (
                <img
                  src={getPreviewUrl() || ''}
                  alt={`Xem trước ${camera.name}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 animate-pulse flex items-center justify-center backdrop-blur-sm">
                      <div className="w-6 h-6 bg-white rounded-full animate-ping" />
                    </div>
                    <p className="text-base font-semibold">Đang Phát Trực Tiếp</p>
                    <p className="text-sm opacity-90 mt-1">
                      {camera.stream_settings?.resolution || '1920x1080'} @ {camera.stream_settings?.fps || 30}fps
                    </p>
                  </div>
                </div>
              )}
              
              {/* Chỉ báo trực tiếp */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center shadow-lg backdrop-blur-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-bounce" />
                TRỰC TIẾP
              </div>

              {/* Số người xem */}
              {streamStats && (
                <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-2 rounded-lg text-sm flex items-center backdrop-blur-md">
                  <Users className="w-4 h-4 mr-2" />
                  {streamStats.viewers} người xem
                </div>
              )}

              {/* Chỉ báo tốc độ khung hình */}
              {streamStats?.frame_rate && (
                <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center backdrop-blur-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  {streamStats.frame_rate} FPS
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CameraTypeIcon className="w-10 h-10 text-white" />
                  </div>
                  {camera.is_active ? (
                    <CheckCircle className="w-7 h-7 text-emerald-500 absolute -bottom-1 -right-2 bg-white rounded-full shadow-md" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-500 absolute -bottom-1 -right-2 bg-white rounded-full shadow-md" />
                  )}
                </div>
                <p className="text-base text-slate-700 font-semibold mb-1">
                  {camera.is_active ? 'Camera Sẵn Sàng' : 'Camera Ngoại Tuyến'}
                </p>
                <p className="text-sm text-slate-500">
                  {camera.is_active ? 'Nhấp để bắt đầu phát' : 'Kiểm tra kết nối'}
                </p>
              </div>
            </div>
          )}

          {/* Trạng thái overlay */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>

          {/* Trạng thái phát hiện */}
          {camera.detection_enabled && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="bg-white/95 text-violet-700 border-violet-300 shadow-lg backdrop-blur-sm">
                <Activity className="w-3 h-3 mr-1" />
                Phát Hiện BẬT
              </Badge>
            </div>
          )}

          {/* Cường độ tín hiệu */}
          <div className="absolute top-3 right-3 bg-black/40 rounded-full p-2 backdrop-blur-md">
            {getSignalIcon()}
          </div>

          {/* Menu hành động - Cải thiện */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="h-9 w-9 p-0 backdrop-blur-md bg-white/85 hover:bg-white/95 shadow-lg border border-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white/95 backdrop-blur-md border border-white/20">
                <DropdownMenuItem onClick={() => navigate(`/cameras/${camera.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem Chi Tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/cameras/${camera.id}/stream`)}>
                  <Video className="h-4 w-4 mr-2" />
                  Toàn Màn Hình
                </DropdownMenuItem>
                {onTakeSnapshot && (
                  <DropdownMenuItem 
                    onClick={handleTakeSnapshot}
                    disabled={snapshotLoading || !camera.is_active}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {snapshotLoading ? 'Đang chụp...' : 'Chụp Ảnh'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(camera)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Chỉnh Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTestConnection(camera)}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Kiểm Tra Kết Nối
                </DropdownMenuItem>
                {onToggleDetection && (
                  <DropdownMenuItem onClick={() => onToggleDetection(camera)}>
                    {camera.detection_enabled ? (
                      <>
                        <VideoOff className="h-4 w-4 mr-2" />
                        Tắt Phát Hiện
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Bật Phát Hiện
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(camera)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Camera
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Thông tin camera */}
        <div className="p-5 bg-gradient-to-r from-white to-slate-50">
          <div className="space-y-4">
            {/* Tiêu đề */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 truncate flex-1 text-lg">
                  {camera.name}
                </h3>
                <div className="flex items-center space-x-2 ml-3">
                  {getConnectionIcon()}
                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800">
                    <CameraTypeIcon className="w-3 h-3 mr-1" />
                    {cameraTypeInfo.label}
                  </Badge>
                </div>
              </div>
              {camera.description && (
                <p className="text-sm text-slate-600 truncate leading-relaxed">
                  {camera.description}
                </p>
              )}
            </div>

            {/* Vị trí và ngày tháng */}
            <div className="space-y-3">
              {camera.location && (
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium">{camera.location}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                  <span>Thêm ngày {formatDate(camera.created_at)}</span>
                </div>
                {camera.last_online && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    Lần cuối: {formatDate(camera.last_online)}
                  </span>
                )}
              </div>
            </div>

            {/* Thống kê stream - Cải thiện */}
            {camera.is_streaming && streamStats && (
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-xs text-emerald-700 font-semibold">Thời Gian</p>
                    <p className="text-sm font-bold text-emerald-900">
                      {formatUptime(streamStats.uptime)}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-xs text-emerald-700 font-semibold">Người Xem</p>
                    <p className="text-sm font-bold text-emerald-900">{streamStats.viewers}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <p className="text-xs text-emerald-700 font-semibold">Chất Lượng</p>
                    <p className="text-sm font-bold text-emerald-900">
                      {camera.stream_settings?.quality || 'HD'}
                    </p>
                  </div>
                </div>
                {(streamStats.bandwidth || streamStats.frame_rate) && (
                  <div className="grid grid-cols-2 gap-3 text-center mt-3 pt-3 border-t border-emerald-200">
                    {streamStats.bandwidth && (
                      <div className="bg-white/70 rounded-lg p-2">
                        <p className="text-xs text-emerald-700 font-semibold">Băng Thông</p>
                        <p className="text-sm font-bold text-emerald-900">{streamStats.bandwidth}</p>
                      </div>
                    )}
                    {streamStats.frame_rate && (
                      <div className="bg-white/70 rounded-lg p-2">
                        <p className="text-xs text-emerald-700 font-semibold">FPS</p>
                        <p className="text-sm font-bold text-emerald-900">{streamStats.frame_rate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thông tin URL Stream - Cải thiện */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600 font-semibold">Nguồn Kết Nối</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs border-${protocolInfo.color}-200 text-${protocolInfo.color}-700 bg-${protocolInfo.color}-50`}
                >
                  {protocolInfo.protocol}
                </Badge>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                <p className="text-xs font-mono text-slate-700 truncate mb-2">
                  {getMaskedUrl(camera.camera_url || '')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {camera.camera_type === 'webcam' ? 'Thiết bị nội bộ' : 'Nguồn mạng'}
                  </span>
                  {camera.is_active && (
                    <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                      Đã kết nối
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nút hành động - Cải thiện */}
            <div className="flex space-x-3 pt-3">
              {camera.is_streaming ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopStream(camera)}
                  className="flex-1 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 font-medium"
                  disabled={loading}
                >
                  <Square className="w-4 h-4 mr-2" />
                  {loading ? 'Đang dừng...' : 'Dừng Phát'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onStartStream(camera)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md"
                  disabled={!camera.is_active || loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? 'Đang khởi động...' : 'Bắt Đầu Phát'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/cameras/${camera.id}`)}
                className="px-4 bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Xem Chi Tiết"
              >
                <Eye className="w-4 h-4" />
              </Button>
              {onTakeSnapshot && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTakeSnapshot}
                  className="px-4 bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                  disabled={!camera.is_active || snapshotLoading}
                  title="Chụp Ảnh Nhanh"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCard;