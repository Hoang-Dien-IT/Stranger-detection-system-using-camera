import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { SystemHealth as SystemHealthType } from '@/types/admin.types';

interface SystemHealthProps {
  onRefresh?: () => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ onRefresh }) => {
  const [health, setHealth] = useState<SystemHealthType | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadHealthData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const healthData = await adminService.getSystemHealth();
      setHealth(healthData);
      onRefresh?.();
    } catch (error) {
      console.error('Error loading health data:', error);
      toast.error('Không thể tải dữ liệu sức khỏe hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Ổn định</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Cảnh báo</Badge>;
      case 'error':
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Lỗi</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Không xác định</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getProgressColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !health) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sức khỏe hệ thống</h2>
          <p className="text-gray-600">Theo dõi trạng thái và hiệu suất hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Tự động làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={loadHealthData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Trạng thái dịch vụ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Trạng thái dịch vụ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4" />
                <span className="font-medium">Cơ sở dữ liệu</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health?.database || 'unknown')}
                {getStatusBadge(health?.database || 'unknown')}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="h-4 w-4" />
                <span className="font-medium">Nhận diện khuôn mặt</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health?.face_recognition || 'unknown')}
                {getStatusBadge(health?.face_recognition || 'unknown')}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">WebSocket</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon('healthy')}
                {getStatusBadge('healthy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tài nguyên hệ thống */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Tài nguyên hệ thống</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span className="font-medium">Sử dụng CPU</span>
                </div>
                <span className="text-sm text-gray-600">
                  {health?.system.cpu.percent || 0}%
                </span>
              </div>
              <div className="relative">
                <Progress value={health?.system.cpu.percent || 0} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor(health?.system.cpu.percent || 0)}`}
                  style={{ width: `${health?.system.cpu.percent || 0}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4" />
                  <span className="font-medium">Sử dụng RAM</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatBytes(health?.system.memory.used || 0)} / {formatBytes(health?.system.memory.total || 0)}
                </span>
              </div>
              <div className="relative">
                <Progress value={health?.system.memory.percent || 0} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor(health?.system.memory.percent || 0)}`}
                  style={{ width: `${health?.system.memory.percent || 0}%` }}
                />
              </div>
            </div>

            {/* Disk Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="font-medium">Sử dụng ổ đĩa</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatBytes(health?.system.disk.used || 0)} / {formatBytes(health?.system.disk.total || 0)}
                </span>
              </div>
              <div className="relative">
                <Progress value={health?.system.disk.percent || 0} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor(health?.system.disk.percent || 0)}`}
                  style={{ width: `${health?.system.disk.percent || 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin hệ thống */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Thông tin hệ thống</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Phiên bản ứng dụng</span>
                <span className="text-sm text-gray-600">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Môi trường</span>
                <span className="text-sm text-gray-600">Sản xuất</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Phiên bản Node.js</span>
                <span className="text-sm text-gray-600">v18.16.0</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Thời gian hoạt động hệ thống</span>
                <span className="text-sm text-gray-600">{health?.uptime || 'Không xác định'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bộ nhớ khả dụng</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(health?.system.memory.available || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Dung lượng ổ đĩa trống</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(health?.system.disk.free || 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cảnh báo hiệu suất */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Cảnh báo hiệu suất</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {health?.system.cpu.percent && health.system.cpu.percent > 80 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">CPU sử dụng cao</p>
                  <p className="text-sm text-red-700">
                    CPU đang sử dụng {health.system.cpu.percent}%. Hãy kiểm tra các tiến trình đang chạy.
                  </p>
                </div>
              </div>
            )}

            {health?.system.memory.percent && health.system.memory.percent > 80 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">RAM sử dụng cao</p>
                  <p className="text-sm text-yellow-700">
                    RAM đang sử dụng {health.system.memory.percent}%. Hãy giải phóng bộ nhớ.
                  </p>
                </div>
              </div>
            )}

            {health?.system.disk.percent && health.system.disk.percent > 90 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Ổ đĩa sắp đầy</p>
                  <p className="text-sm text-red-700">
                    Ổ đĩa đang sử dụng {health.system.disk.percent}%. Vui lòng giải phóng dung lượng ngay.
                  </p>
                </div>
              </div>
            )}

            {(!health?.system.cpu.percent || health.system.cpu.percent <= 80) &&
             (!health?.system.memory.percent || health.system.memory.percent <= 80) &&
             (!health?.system.disk.percent || health.system.disk.percent <= 90) && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Tất cả hệ thống bình thường</p>
                  <p className="text-sm text-green-700">
                    Tất cả tài nguyên hệ thống đang hoạt động trong ngưỡng an toàn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-600 mt-2">Đang làm mới dữ liệu sức khỏe...</p>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;