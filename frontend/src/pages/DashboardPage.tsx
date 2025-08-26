import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Users,  
  Activity,
  Plus,
  Eye,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cameraService } from '@/services/camera.service';
import { personService } from '@/services/person.service';
import { detectionService } from '@/services/detection.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface DashboardStats {
  cameras: {
    total: number;
    active: number;
    streaming: number;
    offline: number;
  };
  persons: {
    total: number;
    active: number;
    verified: number;
  };
  detections: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    accuracy: number;
  };
  recentDetections: any[];
  systemHealth: 'healthy' | 'warning' | 'error';
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    cameras: { total: 0, active: 0, streaming: 0, offline: 0 },
    persons: { total: 0, active: 0, verified: 0 },
    detections: { today: 0, thisWeek: 0, thisMonth: 0, accuracy: 0 },
    recentDetections: [],
    systemHealth: 'healthy'
  });

  // ✅ Enhanced chart data với realistic values
  const chartData = [
    { name: 'Mon', detections: 24, known: 18, strangers: 6, accuracy: 98.5 },
    { name: 'Tue', detections: 31, known: 22, strangers: 9, accuracy: 97.8 },
    { name: 'Wed', detections: 45, known: 32, strangers: 13, accuracy: 98.9 },
    { name: 'Thu', detections: 38, known: 28, strangers: 10, accuracy: 99.1 },
    { name: 'Fri', detections: 52, known: 41, strangers: 11, accuracy: 98.7 },
    { name: 'Sat', detections: 29, known: 19, strangers: 10, accuracy: 97.9 },
    { name: 'Sun', detections: 18, known: 12, strangers: 6, accuracy: 98.3 },
  ];

  // ✅ Load dashboard data với proper error handling
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // ✅ Load data với fallback values
      const loadCameras = async () => {
        try {
          const response = await cameraService.getCameras();
          return Array.isArray(response) ? response : [];
        } catch (error) {
          console.warn('Failed to load cameras:', error);
          return [];
        }
      };

      const loadPersons = async () => {
        try {
          const response = await personService.getPersons();
          return Array.isArray(response) ? response : [];
        } catch (error) {
          console.warn('Failed to load persons:', error);
          return [];
        }
      };

      const loadDetections = async () => {
        try {
          const response = await detectionService.getDetections({ limit: 10 });
          return Array.isArray(response) ? response : 
                 (response && typeof response === 'object' && response !== null && 'detections' in response) ? (response as any).detections : [];
        } catch (error) {
          console.warn('Failed to load detections:', error);
          return [];
        }
      };

      // Load all data in parallel với individual error handling
      const [camerasResponse, personsResponse, detectionsResponse] = await Promise.all([
        loadCameras(),
        loadPersons(),
        loadDetections()
      ]);

      // ✅ Calculate camera stats
      const cameras = {
        total: camerasResponse.length,
        active: camerasResponse.filter((c: any) => c.is_active).length,
        streaming: camerasResponse.filter((c: any) => c.is_streaming).length,
        offline: camerasResponse.filter((c: any) => !c.is_active).length
      };

      // ✅ Calculate person stats
      const persons = {
        total: personsResponse.length,
        active: personsResponse.filter((p: any) => p.is_active !== false).length,
        verified: personsResponse.filter((p: any) => p.is_verified === true).length
      };

      // ✅ Calculate detection stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayDetections = detectionsResponse.filter((d: any) => 
        new Date(d.timestamp) >= today
      );
      
      const weekDetections = detectionsResponse.filter((d: any) => 
        new Date(d.timestamp) >= weekAgo
      );

      // Calculate accuracy from recent detections
      const recentDetections = detectionsResponse.slice(0, 50);
      const avgConfidence = recentDetections.length > 0 
        ? recentDetections.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) / recentDetections.length
        : 0;

      const detections = {
        today: todayDetections.length,
        thisWeek: weekDetections.length,
        thisMonth: detectionsResponse.filter((d: any) => 
          new Date(d.timestamp) >= monthAgo
        ).length,
        accuracy: avgConfidence * 100
      };

      // ✅ Calculate system health
      const systemHealth: 'healthy' | 'warning' | 'error' = 
        cameras.offline > cameras.active ? 'error' :
        cameras.offline > 0 ? 'warning' : 'healthy';

      setStats({
        cameras,
        persons,
        detections,
        recentDetections: detectionsResponse.slice(0, 8),
        systemHealth
      });

      setLastUpdated(new Date());

      if (isRefresh) {
        toast.success('Dashboard data refreshed successfully');
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (isRefresh) {
        toast.error('Failed to refresh dashboard data');
      } else {
        toast.error('Failed to load dashboard data. Using default values.');
        // Set default/mock data when initial load fails
        setStats({
          cameras: { total: 0, active: 0, streaming: 0, offline: 0 },
          persons: { total: 0, active: 0, verified: 0 },
          detections: { today: 0, thisWeek: 0, thisMonth: 0, accuracy: 0 },
          recentDetections: [],
          systemHealth: 'error'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // // ✅ Get color scheme cho stats cards
  // const getStatCardColor = (type: string) => {
  //   const colors = {
  //     cameras: {
  //       icon: 'text-blue-600',
  //       bg: 'bg-blue-50',
  //       border: 'border-blue-200',
  //       accent: 'text-blue-700'
  //     },
  //     persons: {
  //       icon: 'text-green-600',
  //       bg: 'bg-green-50',
  //       border: 'border-green-200',
  //       accent: 'text-green-700'
  //     },
  //     detections: {
  //       icon: 'text-purple-600',
  //       bg: 'bg-purple-50',
  //       border: 'border-purple-200',
  //       accent: 'text-purple-700'
  //     },
  //     security: {f
  //       icon: stats.systemHealth === 'healthy' ? 'text-emerald-600' : 
  //             stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600',
  //       bg: stats.systemHealth === 'healthy' ? 'bg-emerald-50' : 
  //           stats.systemHealth === 'warning' ? 'bg-yellow-50' : 'bg-red-50',
  //       border: stats.systemHealth === 'healthy' ? 'border-emerald-200' : 
  //               stats.systemHealth === 'warning' ? 'border-yellow-200' : 'border-red-200',
  //       accent: stats.systemHealth === 'healthy' ? 'text-emerald-700' : 
  //               stats.systemHealth === 'warning' ? 'text-yellow-700' : 'text-red-700'
  //     }
  //   };
  //   return colors[type as keyof typeof colors] || colors.cameras;
  // };

  // ✅ Custom tooltip cho charts
// Cập nhật CustomTooltip trong DashboardPage
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg backdrop-blur-sm">
        <p className="font-semibold text-slate-900 mb-2">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}${entry.name === 'accuracy' ? '%' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="p-6 space-y-8">
        {/* ✅ Enhanced Header với màu sáng */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent">
                Bảng điều khiển
              </h1>
              <div className="flex items-center space-x-2">
                {stats.systemHealth === 'healthy' && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Hệ thống ổn định
                  </Badge>
                )}
                {stats.systemHealth === 'warning' && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 shadow-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Cảnh báo hệ thống
                  </Badge>
                )}
                {stats.systemHealth === 'error' && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 shadow-sm">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Lỗi hệ thống
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-slate-600">
              <p>Chào mừng trở lại, <span className="font-semibold text-slate-900">{user?.full_name}</span></p>
              {lastUpdated && (
                <div className="flex items-center space-x-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Cập nhật lúc {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="flex items-center bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Làm mới
            </Button>
            <Button 
              onClick={() => navigate('/cameras/new')} 
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Camera
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/persons/new')} 
              className="flex items-center bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Thêm người
            </Button>
          </div>
        </div>
  
        {/* ✅ Enhanced Stats Cards với light theme đẹp */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cameras Card */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Hệ thống Camera</CardTitle>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-200">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">{stats.cameras.total}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                    <span className="text-emerald-700 font-medium">{stats.cameras.active} đang hoạt động</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-700 font-medium">{stats.cameras.streaming} đang phát trực tiếp</span>
                  </div>
                </div>
                {stats.cameras.offline > 0 && (
                  <div className="flex items-center space-x-1 text-sm">
                    <WifiOff className="w-3 h-3 text-red-600" />
                    <span className="text-red-700 font-medium">{stats.cameras.offline} ngoại tuyến</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
  
          {/* Persons Card */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Người đã biết</CardTitle>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-200">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">{stats.persons.total}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                    <span className="text-emerald-700 font-medium">{stats.persons.active} đang hoạt động</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">{stats.persons.verified} đã xác thực</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Detections Card */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Hoạt động hôm nay</CardTitle>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-200">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">{stats.detections.today}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    <span className="text-purple-700 font-medium">{stats.detections.thisWeek} trong tuần</span>
                  </div>
                  {stats.detections.accuracy > 0 && (
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">{stats.detections.accuracy.toFixed(1)}% độ chính xác</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Security Status Card */}
          <Card className={cn(
            "bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300",
            stats.systemHealth === 'healthy' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50' :
            stats.systemHealth === 'warning' ? 'bg-gradient-to-br from-amber-50 to-amber-100/50' :
            'bg-gradient-to-br from-red-50 to-red-100/50'
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Trạng thái an ninh</CardTitle>
              <div className={cn(
                "p-3 rounded-xl border",
                stats.systemHealth === 'healthy' ? 'bg-emerald-500/10 border-emerald-200' :
                stats.systemHealth === 'warning' ? 'bg-amber-500/10 border-amber-200' :
                'bg-red-500/10 border-red-200'
              )}>
                <Shield className={cn(
                  "h-6 w-6",
                  stats.systemHealth === 'healthy' ? 'text-emerald-600' :
                  stats.systemHealth === 'warning' ? 'text-amber-600' : 'text-red-600'
                )} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className={cn(
                  "text-2xl font-bold capitalize",
                  stats.systemHealth === 'healthy' ? 'text-emerald-700' :
                  stats.systemHealth === 'warning' ? 'text-amber-700' : 'text-red-700'
                )}>
                  {stats.systemHealth === 'healthy' ? 'Tất cả hệ thống' : 
                   stats.systemHealth === 'warning' ? 'Có vấn đề nhỏ' : 'Cần chú ý'}
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  {stats.systemHealth === 'healthy' && (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Tất cả hệ thống hoạt động bình thường</span>
                    </>
                  )}
                  {stats.systemHealth === 'warning' && (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span className="text-amber-700 font-medium">Một số hệ thống cần kiểm tra</span>
                    </>
                  )}
                  {stats.systemHealth === 'error' && (
                    <>
                      <WifiOff className="w-3 h-3 text-red-600" />
                      <span className="text-red-700 font-medium">Phát hiện lỗi nghiêm trọng</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* ✅ Enhanced Charts với light theme */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Detection Activity Chart */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Biểu đồ phát hiện</CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-600 font-medium">Người đã biết</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-600 font-medium">Người lạ</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="knownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="strangersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="known" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="url(#knownGradient)"
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="strangers" 
                    stackId="1"
                    stroke="#EF4444" 
                    fill="url(#strangersGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          {/* Detection Accuracy Chart */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Độ chính xác nhận diện</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm">
                  Avg: {(chartData.reduce((sum, d) => sum + d.accuracy, 0) / chartData.length).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis 
                    domain={[95, 100]} 
                    stroke="#64748B" 
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10B981"
                    fill="url(#accuracyGradient)"
                    strokeWidth={4}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
  
        {/* ✅ Enhanced Activity Section với light theme */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Detections */}
          <Card className="xl:col-span-2 bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Nhận diện gần đây</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/detections')}
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                {stats.recentDetections.length > 0 ? (
                  stats.recentDetections.map((detection, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50/50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-all duration-200 shadow-sm">
                      <div className={cn(
                        "w-4 h-4 rounded-full shadow-sm",
                        detection.detection_type === 'stranger' ? 'bg-red-500' : 'bg-emerald-500'
                      )} />
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">
                            {detection.detection_type === 'stranger' ? 'Người lạ' : detection.person_name || 'Người đã biết'}
                          </p>
                          <Badge 
                            variant={detection.detection_type === 'stranger' ? 'destructive' : 'default'} 
                            className={cn(
                              "text-xs shadow-sm",
                              detection.detection_type === 'stranger' 
                                ? 'bg-red-100 text-red-800 border-red-300' 
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            )}
                          >
                            {detection.detection_type === 'stranger' ? 'Người lạ' : 'Đã biết'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Camera className="w-3 h-3" />
                            <span>{detection.camera_name || 'Không rõ camera'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{(detection.confidence * 100).toFixed(1)}% độ tin cậy</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-500 text-right">
                        <div className="font-medium">{new Date(detection.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs">{new Date(detection.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Chưa có nhận diện gần đây</p>
                    <p className="text-sm text-slate-400">Hoạt động nhận diện sẽ hiển thị tại đây khi có người được nhận diện</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
  
          {/* Quick Actions */}
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-t-lg">
              <CardTitle className="text-xl font-bold text-slate-900">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                  onClick={() => navigate('/cameras')}
                >
                  <Camera className="w-4 h-4 mr-3 text-blue-600" />
                  <span className="text-slate-700">Quản lý Camera</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                  onClick={() => navigate('/persons')}
                >
                  <Users className="w-4 h-4 mr-3 text-emerald-600" />
                  <span className="text-slate-700">Quản lý người đã biết</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                  onClick={() => navigate('/detections')}
                >
                  <Eye className="w-4 h-4 mr-3 text-purple-600" />
                  <span className="text-slate-700">Xem nhật ký nhận diện</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm"
                  onClick={() => navigate('/analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-3 text-orange-600" />
                  <span className="text-slate-700">Phân tích & Báo cáo</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                  onClick={() => navigate('/settings')}
                >
                  <Activity className="w-4 h-4 mr-3 text-slate-600" />
                  <span className="text-slate-700">Cài đặt hệ thống</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;