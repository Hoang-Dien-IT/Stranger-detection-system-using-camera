import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Filter,
  Search,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  Download,
  Sliders
} from 'lucide-react';
import { DetectionFilter as DetectionFilterType } from '@/types/detection.types';
import { cameraService } from '@/services/camera.service';
import { Camera } from '@/types/camera.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DetectionFilterProps {
  onFilterChange: (filters: DetectionFilterType) => void;
  onExport?: () => void;
  initialFilters?: Partial<DetectionFilterType>;
  showAdvanced?: boolean;
  className?: string;
}

const DetectionFilterComponent: React.FC<DetectionFilterProps> = ({
  onFilterChange,
  onExport,
  initialFilters = {},
  showAdvanced = true,
  className = ""
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [filters, setFilters] = useState<DetectionFilterType>({
    limit: 20,
    offset: 0,
    ...initialFilters
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [realTimeFilter, setRealTimeFilter] = useState(false);

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    if (realTimeFilter) {
      const interval = setInterval(() => {
        handleApplyFilters();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeFilter, filters]);

  const loadCameras = async () => {
    try {
      const camerasData = await cameraService.getCameras();
      setCameras(camerasData);
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  };

  const handleFilterChange = (key: keyof DetectionFilterType, value: any) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);
    
    if (!realTimeFilter) {
      // Only apply filters immediately if not in real-time mode
      handleApplyFilters(newFilters);
    }
  };

  // ✅ Fix: Add search to filters object
  const handleApplyFilters = (customFilters?: DetectionFilterType) => {
    const filtersToApply = customFilters || {
      ...filters,
      search: searchTerm, // Add this
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      min_confidence: confidenceRange[0] / 100, // Add this
      max_confidence: confidenceRange[1] / 100, // Add this
    };
    
    onFilterChange(filtersToApply);
  };

  const handleResetFilters = () => {
    const resetFilters: DetectionFilterType = {
      limit: 20,
      offset: 0
    };
    
    setFilters(resetFilters);
    setSearchTerm('');
    setConfidenceRange([0, 100]);
    setStartDate(undefined);
    setEndDate(undefined);
    setRealTimeFilter(false);
    onFilterChange(resetFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Add search to filters
    handleFilterChange('search', value);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.camera_id) count++;
    if (filters.detection_type) count++;
    if (startDate || endDate) count++;
    if (confidenceRange[0] > 0 || confidenceRange[1] < 100) count++;
    if (searchTerm) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-gradient-to-r from-cyan-100 to-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {showAdvanced && (
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-400 text-cyan-700"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Nâng cao
              </Button>
            )}
            
            {onExport && (
              <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Xuất dữ liệu
              </Button>
            )}
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700" onClick={handleResetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-cyan-700 font-bold">Tìm kiếm</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm theo tên người, camera..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 border-cyan-300 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Camera Filter */}
          <div className="space-y-2">
            <Label className="text-cyan-700 font-bold">Camera</Label>
            <Select
              value={filters.camera_id || 'all_cameras'}
              onValueChange={(value) => handleFilterChange('camera_id', value === 'all_cameras' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả camera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_cameras">Tất cả camera</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detection Type Filter */}
          <div className="space-y-2">
            <Label className="text-cyan-700 font-bold">Loại nhận diện</Label>
            <Select
              value={filters.detection_type || 'all_types'}
              onValueChange={(value) => handleFilterChange('detection_type', value === 'all_types' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">Tất cả loại</SelectItem>
                <SelectItem value="known_person">Người đã đăng ký</SelectItem>
                <SelectItem value="stranger">Người lạ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Results per page */}
          <div className="space-y-2">
            <Label className="text-cyan-700 font-bold">Số kết quả/trang</Label>
            <Select
              value={filters.limit?.toString() || '20'}
              onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-cyan-700 font-bold">Khoảng ngày</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Từ ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Đến ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                handleFilterChange('start_date', undefined);
                handleFilterChange('end_date', undefined);
              }}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Xóa ngày
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && isAdvancedOpen && (
          <div className="space-y-6 p-4 border rounded-lg bg-gradient-to-br from-cyan-50 to-emerald-50">
            <h4 className="font-bold text-cyan-700">Bộ lọc nâng cao</h4>
            
            {/* Confidence Range */}
            <div className="space-y-2">
              <Label className="text-cyan-700 font-bold">Độ tin cậy: {confidenceRange[0]}% - {confidenceRange[1]}%</Label>
              <Slider
                value={confidenceRange}
                onValueChange={setConfidenceRange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Results Limit */}
            <div className="space-y-2">
              <Label className="text-cyan-700 font-bold">Số kết quả/trang</Label>
              <Select
                value={filters.limit?.toString() || '20'}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Real-time Updates */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-cyan-700 font-bold">Tự động cập nhật</Label>
                <p className="text-sm text-cyan-600">Tự động làm mới kết quả mỗi 5 giây</p>
              </div>
              <Switch
                checked={realTimeFilter}
                onCheckedChange={setRealTimeFilter}
              />
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="flex space-x-2">
          <Button onClick={() => handleApplyFilters()} className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold">
            <Filter className="h-4 w-4 mr-2" />
            Áp dụng bộ lọc
          </Button>
          
          {hasActiveFilters && (
            <Button variant="outline" className="border-cyan-400 text-cyan-700" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm text-cyan-700 font-bold">Bộ lọc đang áp dụng:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.camera_id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">
                  Camera: {cameras.find(c => c.id === filters.camera_id)?.name || 'Không rõ'}
                  <button
                    onClick={() => handleFilterChange('camera_id', undefined)}
                    className="ml-1 hover:text-cyan-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filters.detection_type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                  Loại: {filters.detection_type === 'known_person' ? 'Người đã đăng ký' : 'Người lạ'}
                  <button
                    onClick={() => handleFilterChange('detection_type', undefined)}
                    className="ml-1 hover:text-emerald-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {(startDate || endDate) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">
                  Khoảng ngày
                  <button
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                    className="ml-1 hover:text-cyan-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetectionFilterComponent;