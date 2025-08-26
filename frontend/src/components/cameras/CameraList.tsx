import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Camera,
  Search,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CameraCard from './CameraCard';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraType } from '@/types/camera.types';

interface CameraListProps {
  cameras: CameraType[];
  loading?: boolean;
  onEdit: (camera: CameraType) => void;
  onDelete: (camera: CameraType) => void;
  onStartStream: (camera: CameraType) => void;
  onStopStream: (camera: CameraType) => void;
  onTestConnection: (camera: CameraType) => void;
  onToggleDetection?: (camera: CameraType) => void;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'created_at' | 'last_online' | 'status';
type SortOrder = 'asc' | 'desc';

const CameraList: React.FC<CameraListProps> = ({
  cameras,
  loading = false,
  onEdit,
  onDelete,
  onStartStream,
  onStopStream,
  onTestConnection,
  onToggleDetection,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredCameras = cameras
    .filter(camera => {
      const matchesSearch = 
        camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && camera.is_active) ||
                           (statusFilter === 'inactive' && !camera.is_active) ||
                           (statusFilter === 'streaming' && camera.is_streaming) ||
                           (statusFilter === 'detection' && camera.detection_enabled);
      
      const matchesType = typeFilter === 'all' || camera.camera_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'last_online':
          aValue = a.last_online ? new Date(a.last_online).getTime() : 0;
          bValue = b.last_online ? new Date(b.last_online).getTime() : 0;
          break;
        case 'status':
          aValue = a.is_streaming ? 3 : a.is_active ? 2 : 1;
          bValue = b.is_streaming ? 3 : b.is_active ? 2 : 1;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStats = () => {
    return {
      total: cameras.length,
      active: cameras.filter(c => c.is_active).length,
      streaming: cameras.filter(c => c.is_streaming).length,
      offline: cameras.filter(c => !c.is_active).length,
      detection: cameras.filter(c => c.detection_enabled).length
    };
  };

  const handleExport = () => {
    const csvContent = [
      ['Tên', 'Loại', 'Trạng Thái', 'Phát Hiện', 'URL', 'Ngày Tạo', 'Lần Cuối Online'].join(','),
      ...filteredCameras.map(camera => [
        `"${camera.name}"`,
        camera.camera_type,
        camera.is_streaming ? 'Đang Phát' : camera.is_active ? 'Hoạt Động' : 'Ngoại Tuyến',
        camera.detection_enabled ? 'Bật' : 'Tắt',
        `"${camera.camera_url}"`,
        new Date(camera.created_at).toLocaleDateString('vi-VN'),
        camera.last_online ? new Date(camera.last_online).toLocaleDateString('vi-VN') : 'Chưa có'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-camera-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-8 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 min-h-screen p-6">
        {/* Header đang tải */}
        <div className="animate-pulse">
          <div className="h-10 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-xl w-1/3 mb-3"></div>
          <div className="h-5 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg w-1/2"></div>
        </div>

        {/* Thống kê đang tải */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-lg bg-gradient-to-br from-white to-teal-50">
              <CardContent className="p-6">
                <div className="h-10 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gradient-to-r from-teal-200 to-emerald-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cards đang tải */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-xl bg-gradient-to-br from-white to-teal-100 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-teal-200 to-emerald-200 rounded-t-2xl mb-4"></div>
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-teal-200 to-emerald-200 rounded w-1/2"></div>
                  <div className="flex space-x-3 mt-6">
                    <div className="h-10 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg flex-1"></div>
                    <div className="h-10 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 p-6">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Phần đầu trang với thống kê tổng quan */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start space-y-6 xl:space-y-0">
          <div className="space-y-3">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-700 bg-clip-text text-transparent leading-tight">
              Hệ Thống Camera Giám Sát
            </h1>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-teal-200">
              <p className="text-lg font-medium text-teal-700">
                📹 {stats.total} camera tổng cộng • ✅ {stats.active} đang hoạt động • 🔴 {stats.streaming} phát trực tiếp • 🔍 {stats.detection} có nhận diện
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleExport}
              className="bg-white/90 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 font-semibold shadow-md"
            >
              <Download className="w-5 h-5 mr-3" />
              Xuất Báo Cáo Excel
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onRefresh}
              className="bg-white/90 border-2 border-cyan-300 text-cyan-800 hover:bg-cyan-50 hover:border-cyan-400 font-semibold shadow-md"
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              Cập Nhật Dữ Liệu
            </Button>
            <Button 
              onClick={() => navigate('/cameras/new')} 
              className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-700 hover:from-teal-700 hover:via-cyan-700 hover:to-emerald-800 text-white shadow-xl hover:shadow-2xl transition-all duration-500 font-bold text-lg px-6"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-3" />
              Thêm Camera Mới
            </Button>
          </div>
        </div>

        {/* Bảng điều khiển thống kê chi tiết */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-teal-50 to-cyan-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-200/30 rounded-full -mr-10 -mt-10"></div>
              <p className="text-4xl font-black bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">{stats.total}</p>
              <p className="text-sm font-bold text-teal-800 uppercase tracking-wide">Tổng Số Camera</p>
              <div className="mt-2 w-12 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 mx-auto rounded-full"></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50 to-green-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -mr-10 -mt-10"></div>
              <p className="text-4xl font-black bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-2">{stats.active}</p>
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Đang Hoạt Động</p>
              <div className="mt-2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto rounded-full"></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-red-50 to-rose-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 rounded-full -mr-10 -mt-10"></div>
              <p className="text-4xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">{stats.streaming}</p>
              <p className="text-sm font-bold text-red-800 uppercase tracking-wide">Phát Trực Tiếp</p>
              <div className="mt-2 w-12 h-1 bg-gradient-to-r from-red-400 to-rose-400 mx-auto rounded-full"></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-amber-50 to-orange-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -mr-10 -mt-10"></div>
              <p className="text-4xl font-black bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent mb-2">{stats.detection}</p>
              <p className="text-sm font-bold text-amber-800 uppercase tracking-wide">Nhận Diện Kích Hoạt</p>
              <div className="mt-2 w-12 h-1 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50 to-gray-100 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-200/30 rounded-full -mr-10 -mt-10"></div>
              <p className="text-4xl font-black bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2">{stats.offline}</p>
              <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">Ngoại Tuyến</p>
              <div className="mt-2 w-12 h-1 bg-gradient-to-r from-slate-400 to-gray-400 mx-auto rounded-full"></div>
            </CardContent>
          </Card>
        </div>

        {/* Bảng điều khiển tìm kiếm và lọc nâng cao */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-white via-teal-50 to-cyan-50 backdrop-blur-md border border-teal-200/50">
          <CardContent className="p-8">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Thanh tìm kiếm thông minh */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-teal-500" />
                </div>
                <Input
                  placeholder="🔍 Tìm kiếm camera theo tên, mô tả, vị trí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 h-14 text-lg font-medium border-3 border-teal-200 bg-white/90 focus:border-teal-500 focus:bg-white transition-all duration-400 rounded-xl shadow-lg"
                />
              </div>
              
              {/* Bộ lọc chuyên nghiệp */}
              <div className="flex flex-col lg:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-56 h-14 border-3 border-teal-200 bg-white/90 focus:border-teal-500 rounded-xl text-base font-medium">
                    <SelectValue placeholder="📊 Trạng thái hoạt động" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/98 backdrop-blur-md border-2 border-teal-200 rounded-xl">
                    <SelectItem value="all" className="text-base py-4">🌐 Tất Cả Trạng Thái</SelectItem>
                    <SelectItem value="active" className="text-base py-4">✅ Đang Hoạt Động</SelectItem>
                    <SelectItem value="inactive" className="text-base py-4">❌ Tạm Ngưng</SelectItem>
                    <SelectItem value="streaming" className="text-base py-4">🔴 Phát Trực Tiếp</SelectItem>
                    <SelectItem value="detection" className="text-base py-4">🔍 Nhận Diện Kích Hoạt</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full lg:w-56 h-14 border-3 border-teal-200 bg-white/90 focus:border-teal-500 rounded-xl text-base font-medium">
                    <SelectValue placeholder="📹 Loại thiết bị" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/98 backdrop-blur-md border-2 border-teal-200 rounded-xl">
                    <SelectItem value="all" className="text-base py-4">📂 Tất Cả Loại</SelectItem>
                    <SelectItem value="ip_camera" className="text-base py-4">🌐 Camera IP</SelectItem>
                    <SelectItem value="webcam" className="text-base py-4">💻 Webcam</SelectItem>
                    <SelectItem value="usb_camera" className="text-base py-4">🔌 Camera USB</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                  <SelectTrigger className="w-full lg:w-56 h-14 border-3 border-teal-200 bg-white/90 focus:border-teal-500 rounded-xl text-base font-medium">
                    <SelectValue placeholder="🔄 Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/98 backdrop-blur-md border-2 border-teal-200 rounded-xl">
                    <SelectItem value="name" className="text-base py-4">📝 Theo Tên</SelectItem>
                    <SelectItem value="created_at" className="text-base py-4">📅 Ngày Tạo</SelectItem>
                    <SelectItem value="last_online" className="text-base py-4">⏰ Lần Cuối Trực Tuyến</SelectItem>
                    <SelectItem value="status" className="text-base py-4">📊 Theo Trạng Thái</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-14 px-6 border-3 border-teal-200 bg-white/90 hover:bg-teal-50 text-teal-700 font-bold rounded-xl"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-6 w-6" /> : <SortDesc className="h-6 w-6" />}
                </Button>

                <div className="flex border-3 border-teal-200 rounded-xl bg-white/90 overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('grid')}
                    className="h-14 rounded-none border-r border-teal-200"
                  >
                    <Grid3X3 className="h-6 w-6" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setViewMode('list')}
                    className="h-14 rounded-none"
                  >
                    <List className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Nút reset bộ lọc */}
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="h-14 px-8 border-3 border-red-300 text-red-800 bg-red-50 hover:bg-red-100 font-bold rounded-xl"
                >
                  🗑️ Xóa Tất Cả Bộ Lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Khu vực hiển thị camera */}
        {filteredCameras.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10"
              : "space-y-8"
          }>
            {filteredCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onEdit={onEdit}
                onDelete={onDelete}
                onStartStream={onStartStream}
                onStopStream={onStopStream}
                onTestConnection={onTestConnection}
                onToggleDetection={onToggleDetection}
              />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-teal-50 to-cyan-100 border border-teal-200">
            <CardContent className="text-center py-24">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-100 via-cyan-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-teal-200">
                <Camera className="w-16 h-16 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-teal-800 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? '🔍 Không tìm thấy camera phù hợp với bộ lọc' 
                  : '📹 Chưa có camera nào trong hệ thống'}
              </h3>
              <p className="text-teal-700 mb-10 text-xl max-w-md mx-auto leading-relaxed">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Hãy thử điều chỉnh các tiêu chí tìm kiếm hoặc bộ lọc để xem thêm kết quả.'
                  : 'Bắt đầu xây dựng hệ thống giám sát bảo mật bằng cách thêm camera đầu tiên.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') ? (
                <Button 
                  onClick={() => navigate('/cameras/new')}
                  className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-700 hover:from-teal-700 hover:via-cyan-700 hover:to-emerald-800 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 font-bold text-xl px-10 py-4"
                  size="lg"
                >
                  <Plus className="w-6 h-6 mr-4" />
                  🚀 Thêm Camera Đầu Tiên
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="border-3 border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 font-bold text-lg px-8 py-4"
                  size="lg"
                >
                  🔄 Đặt Lại Bộ Lọc
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Thông tin tổng kết */}
        {filteredCameras.length > 0 && (
          <div className="text-center text-xl font-semibold text-teal-800 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
            📊 Hiển thị <span className="text-2xl font-bold text-cyan-700">{filteredCameras.length}</span> trong tổng số <span className="text-2xl font-bold text-emerald-700">{cameras.length}</span> camera
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraList;