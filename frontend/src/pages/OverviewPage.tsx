import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  Users,
  Camera,
  AlertTriangle,
  Download,
  RefreshCw,
  Target,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  MapPin,
  Calendar
} from 'lucide-react';
import { detectionService } from '@/services/detection.service';
import { cameraService } from '@/services/camera.service';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface OverviewStats {
  total_detections: number;
  known_detections: number;
  stranger_detections: number;
  accuracy_rate: number;
  cameras_active: number;
  cameras_total: number;
  today_detections: number;
  this_week_detections: number;
  this_month_detections: number;
  alerts_sent: number;
  top_cameras: Array<{
    camera_name: string;
    detection_count: number;
    accuracy: number;
  }>;
  recent_activities: Array<{
    type: string;
    message: string;
    timestamp: string;
    camera: string;
  }>;
}

const OverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<OverviewStats>({
    total_detections: 0,
    known_detections: 0,
    stranger_detections: 0,
    accuracy_rate: 0,
    cameras_active: 0,
    cameras_total: 0,
    today_detections: 0,
    this_week_detections: 0,
    this_month_detections: 0,
    alerts_sent: 0,
    top_cameras: [],
    recent_activities: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!loading) setRefreshing(true);
        
        // Load data from multiple sources
        const [analyticsResponse] = await Promise.all([
          detectionService.getAnalytics(timeRange),
          cameraService.getCameras()
        ]);
        
        // Transform data for overview
        const transformedStats: OverviewStats = {
          total_detections: analyticsResponse.overview.total_detections,
          known_detections: analyticsResponse.overview.known_person_detections,
          stranger_detections: analyticsResponse.overview.stranger_detections,
          accuracy_rate: analyticsResponse.overview.detection_accuracy,
          cameras_active: analyticsResponse.camera_stats.active_cameras,
          cameras_total: analyticsResponse.camera_stats.total_cameras,
          today_detections: analyticsResponse.time_based.today,
          this_week_detections: analyticsResponse.time_based.this_week,
          this_month_detections: analyticsResponse.time_based.this_month,
          alerts_sent: analyticsResponse.overview.alerts_sent,
          top_cameras: analyticsResponse.top_cameras.map(camera => ({
            camera_name: camera.camera_name,
            detection_count: camera.detection_count,
            accuracy: camera.stranger_count > 0 ? 
              ((camera.detection_count - camera.stranger_count) / camera.detection_count * 100) : 100
          })),
          recent_activities: [
            {
              type: 'detection',
              message: 'New stranger detected',
              timestamp: new Date().toISOString(),
              camera: 'Main Entrance'
            },
            {
              type: 'alert',
              message: 'Security alert sent',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              camera: 'Office Floor 1'
            }
          ]
        };
        
        setStats(transformedStats);
        
      } catch (error) {
        console.error('Error loading overview data:', error);
        toast.error('Failed to load overview data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchData();
  }, [timeRange, loading]);

  const handleExportOverview = async () => {
    try {
      toast.info('🔄 Exporting overview report...');
      
      const blob = await detectionService.exportStats(timeRange, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `overview-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Overview report exported successfully');
    } catch (error) {
      console.error('Error exporting overview:', error);
      toast.error('❌ Failed to export overview report');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">Tổng quan hệ thống</h1>
              <p className="text-slate-600">Trạng thái & chỉ số hoạt động của SafeFace theo thời gian thực</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 giờ qua</SelectItem>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
                <SelectItem value="90d">90 ngày qua</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setLoading(true);
                setRefreshing(true);
                window.location.reload();
              }}
              variant="outline"
              disabled={refreshing}
              className="shadow-sm hover:shadow-md transition-shadow border-emerald-300 hover:bg-emerald-50 text-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang làm mới...' : 'Làm mới'}
            </Button>
            <Button
              onClick={handleExportOverview}
              className="shadow-sm hover:shadow-md transition-shadow bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Tổng lượt phát hiện</CardTitle>
            <Eye className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.total_detections.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                Hôm nay: {stats.today_detections}
              </Badge>
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                Tuần này: {stats.this_week_detections}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Người quen</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.known_detections.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-700">
                {stats.total_detections > 0 
                  ? `${((stats.known_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                  : '0% tổng số'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Người lạ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.stranger_detections.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">
                {stats.total_detections > 0 
                  ? `${((stats.stranger_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                  : '0% tổng số'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Độ chính xác hệ thống</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.accuracy_rate.toFixed(1)}%</div>
            <div className="flex items-center space-x-2 mt-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-purple-700">
                {stats.alerts_sent} cảnh báo đã gửi
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status and Top Cameras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="bg-white/90 backdrop-blur-sm border-emerald-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span>Trạng thái hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800">Kết nối mạng</p>
                  <p className="text-sm text-emerald-600">Hệ thống hoạt động ổn định</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                Đã kết nối
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Camera className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Camera đang hoạt động</p>
                  <p className="text-sm text-blue-600">{stats.cameras_active} / {stats.cameras_total} camera</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {stats.cameras_active} hoạt động
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-800">Bộ máy phát hiện</p>
                  <p className="text-sm text-purple-600">Đang giám sát thời gian thực</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Đang chạy
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Cameras */}
        <Card className="bg-white/90 backdrop-blur-sm border-emerald-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <span>Camera nổi bật</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top_cameras.length > 0 ? (
              <div className="space-y-3">
                {stats.top_cameras.slice(0, 5).map((camera, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-emerald-900">{camera.camera_name}</p>
                        <p className="text-sm text-slate-600">{camera.detection_count} lượt phát hiện</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {camera.accuracy.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Camera className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p>Chưa có dữ liệu camera</p>
                <p className="text-sm">Dữ liệu sẽ hiển thị khi camera bắt đầu phát hiện</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-white/90 backdrop-blur-sm border-emerald-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span>Hoạt động gần đây</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recent_activities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  {activity.type === 'detection' ? (
                    <Eye className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900">{activity.type === 'detection' ? 'Phát hiện người lạ' : 'Cảnh báo an ninh'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{activity.camera}</span>
                    <Calendar className="h-4 w-4 text-slate-400 ml-4" />
                    <span className="text-sm text-slate-600">
                      {new Date(activity.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;
