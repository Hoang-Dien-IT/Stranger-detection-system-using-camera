import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
// import { useAuth } from '@/hooks/useAuth';
import { detectionService } from '@/services/detection.service';
// import { cameraService } from '@/services/camera.service';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AnalyticsStats {
  total_detections: number;
  known_detections: number;
  stranger_detections: number;
  accuracy_rate: number;
  cameras_active: number;
  top_cameras: Array<{
    camera_name: string;
    detection_count: number;
    accuracy: number;
  }>;
  detection_trends: Array<{
    date: string;
    known: number;
    strangers: number;
    total: number;
  }>;
  hourly_patterns: Array<{
    hour: number;
    detections: number;
  }>;
  detection_types: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const AnalyticsPage: React.FC = () => {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<AnalyticsStats>({
    total_detections: 0,
    known_detections: 0,
    stranger_detections: 0,
    accuracy_rate: 0,
    cameras_active: 0,
    top_cameras: [],
    detection_trends: [],
    hourly_patterns: [],
    detection_types: []
  });

  useEffect(() => {
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load real data from backend
      const [analyticsResponse, chartResponse] = await Promise.all([
        detectionService.getAnalytics(timeRange),
        detectionService.getChartData(timeRange, 'area')
      ]);
      
      // Transform data for display with custom colors
      const transformedStats: AnalyticsStats = {
        total_detections: analyticsResponse.overview.total_detections,
        known_detections: analyticsResponse.overview.known_person_detections,
        stranger_detections: analyticsResponse.overview.stranger_detections,
        accuracy_rate: analyticsResponse.overview.detection_accuracy,
        cameras_active: analyticsResponse.camera_stats.active_cameras,
        top_cameras: analyticsResponse.top_cameras.map(camera => ({
          camera_name: camera.camera_name,
          detection_count: camera.detection_count,
          accuracy: camera.stranger_count > 0 ? 
            ((camera.detection_count - camera.stranger_count) / camera.detection_count * 100) : 100
        })),
        detection_trends: chartResponse.labels.map((label, index) => ({
          date: label,
          known: chartResponse.datasets.find(d => d.label.includes('Known'))?.data[index] || 0,
          strangers: chartResponse.datasets.find(d => d.label.includes('Stranger'))?.data[index] || 0,
          total: (chartResponse.datasets.find(d => d.label.includes('Known'))?.data[index] || 0) + 
                 (chartResponse.datasets.find(d => d.label.includes('Stranger'))?.data[index] || 0)
        })),
        hourly_patterns: Object.entries(analyticsResponse.hourly_pattern).map(([hour, detections]) => ({
          hour: parseInt(hour.split(':')[0]),
          detections: detections as number
        })),
        detection_types: [
          { 
            name: 'Người Quen Biết', 
            value: analyticsResponse.overview.known_person_detections, 
            color: '#059669' // Emerald-600 
          },
          { 
            name: 'Người Lạ', 
            value: analyticsResponse.overview.stranger_detections, 
            color: '#DC2626' // Red-600
          }
        ]
      };
      
      setStats(transformedStats);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Không thể tải dữ liệu thống kê');
      
      // Fallback to empty data
      setStats({
        total_detections: 0,
        known_detections: 0,
        stranger_detections: 0,
        accuracy_rate: 0,
        cameras_active: 0,
        top_cameras: [],
        detection_trends: [],
        hourly_patterns: [],
        detection_types: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      toast.info('🔄 Đang xuất báo cáo thống kê...');
      
      const blob = await detectionService.exportStats(timeRange, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-thong-ke-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Xuất báo cáo thống kê thành công');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('❌ Không thể xuất báo cáo thống kế');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Bảng Điều Khiển Thống Kê
          </h1>
          <p className="text-slate-600">Báo cáo chi tiết về hoạt động nhận diện khuôn mặt</p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-slate-300 focus:border-slate-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 giờ qua</SelectItem>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline" className="border-slate-300 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleExportReport} className="bg-slate-800 hover:bg-slate-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Tổng số nhận diện</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Eye className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total_detections.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-medium">
              +12.5% so với kỳ trước
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Người quen biết</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <Users className="h-4 w-4 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.known_detections.toLocaleString()}</div>
            <p className="text-xs text-slate-600">
              {stats.total_detections > 0 
                ? `${((stats.known_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                : '0% tổng số'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Người lạ phát hiện</CardTitle>
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.stranger_detections.toLocaleString()}</div>
            <p className="text-xs text-slate-600">
              {stats.total_detections > 0 
                ? `${((stats.stranger_detections / stats.total_detections) * 100).toFixed(1)}% tổng số`
                : '0% tổng số'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Tỷ lệ quen biết</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <Target className="h-4 w-4 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.accuracy_rate}%</div>
            <p className="text-xs text-emerald-600 font-medium">
              +0.3% cải thiện
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-slate-100 border border-slate-200">
          <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:text-slate-800">
            Xu hướng nhận diện
          </TabsTrigger>
          <TabsTrigger value="patterns" className="data-[state=active]:bg-white data-[state=active]:text-slate-800">
            Mẫu thời gian
          </TabsTrigger>
          <TabsTrigger value="cameras" className="data-[state=active]:bg-white data-[state=active]:text-slate-800">
            Hiệu suất camera
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-slate-800">
            Tổng quan
          </TabsTrigger>
        </TabsList>

        {/* Detection Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-slate-800">Xu hướng nhận diện theo thời gian</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.detection_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={stats.detection_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="known" 
                      stackId="1"
                      stroke="#059669" 
                      fill="#059669" 
                      fillOpacity={0.6}
                      name="Người quen biết"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="strangers" 
                      stackId="1"
                      stroke="#DC2626" 
                      fill="#DC2626" 
                      fillOpacity={0.6}
                      name="Người lạ"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="font-medium">Không có dữ liệu xu hướng nhận diện</p>
                    <p className="text-sm">Dữ liệu sẽ xuất hiện khi có hoạt động nhận diện</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Patterns */}
        <TabsContent value="patterns" className="space-y-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-slate-800">Mẫu nhận diện theo giờ</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.hourly_patterns.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.hourly_patterns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Bar dataKey="detections" fill="#475569" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="font-medium">Không có dữ liệu mẫu theo giờ</p>
                    <p className="text-sm">Dữ liệu sẽ xuất hiện khi có hoạt động nhận diện</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Performance */}
        <TabsContent value="cameras" className="space-y-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-slate-800">Camera hiệu suất cao nhất</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.top_cameras.length > 0 ? (
                <div className="space-y-4">
                  {stats.top_cameras.map((camera, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Camera className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{camera.camera_name}</p>
                          <p className="text-sm text-slate-600">
                            {camera.detection_count} lần nhận diện
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="default" 
                          className="bg-slate-800 text-white hover:bg-slate-700"
                        >
                          {camera.accuracy.toFixed(1)}% độ chính xác
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="font-medium">Không có dữ liệu hiệu suất camera</p>
                    <p className="text-sm">Dữ liệu sẽ xuất hiện khi camera bắt đầu hoạt động</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <CardTitle className="text-slate-800">Phân bố nhận diện</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {stats.detection_types.length > 0 && stats.total_detections > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Pie
                          data={stats.detection_types}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {stats.detection_types.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-4 mt-4">
                      {stats.detection_types.map((type, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm text-slate-700 font-medium">
                            {type.name}: {type.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="font-medium">Không có dữ liệu phân bố nhận diện</p>
                      <p className="text-sm">Dữ liệu sẽ xuất hiện khi có hoạt động nhận diện</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <CardTitle className="text-slate-800">Tóm tắt hàng tuần</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {stats.detection_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.detection_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                      <YAxis tick={{ fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#475569" 
                        strokeWidth={3}
                        name="Tổng số nhận diện"
                        dot={{ fill: '#475569', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="font-medium">Không có dữ liệu tóm tắt hàng tuần</p>
                      <p className="text-sm">Dữ liệu sẽ xuất hiện khi có hoạt động nhận diện</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;