import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Eye,
  Camera,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  Shield,
  Activity,
  Wifi,
  HardDrive,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ChevronDown,
  Circle,
  Database,
  Target,
  MapPin,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define activity severity type
type ActivitySeverity = 'info' | 'warning' | 'error' | 'success' | 'critical';

export interface ActivityItem {
  id: string;
  type: 'detection' | 'camera' | 'user' | 'system' | 'security' | 'backup' | 'maintenance';
  title: string;
  description: string;
  timestamp: string;
  severity?: ActivitySeverity;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'active' | 'resolved' | 'pending' | 'failed';
  category?: string;
  location?: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  metadata?: {
    camera_id?: string;
    camera_name?: string;
    person_id?: string;
    person_name?: string;
    confidence?: number;
    image_url?: string;
    user_id?: string;
    user_name?: string;
    ip_address?: string;
    duration?: number;
    file_size?: number;
    error_code?: string;
    previous_value?: string;
    new_value?: string;
    affected_cameras?: number;
    detection_zone?: string;
    action_taken?: string;
    [key: string]: any;
  };
  actions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  groupByDate?: boolean;
  showImages?: boolean;
  showMetadata?: boolean;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = [], // Add default value
  onViewAll,
  onRefresh,
  loading = false,
  showFilters = true,
  maxItems = 10,
  autoRefresh = false,
  refreshInterval = 30000,
  groupByDate = true,
  showImages = true,
  showMetadata = true,
  className
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Helper function to safely format severity
  const formatSeverity = (severity: ActivitySeverity | undefined): string => {
    if (!severity) return 'Không xác định';
    switch (severity) {
      case 'info': return 'Thông tin';
      case 'warning': return 'Cảnh báo';
      case 'error': return 'Lỗi';
      case 'success': return 'Thành công';
      case 'critical': return 'Nghiêm trọng';
      default: return 'Không xác định';
    }
  };

  // Helper function to get unique severities with proper typing
  const getUniqueSeverities = (): ActivitySeverity[] => {
    const severities = activities
      .map(activity => activity.severity)
      .filter((severity): severity is ActivitySeverity => {
        return severity !== undefined && severity !== null;
      });
    
    return Array.from(new Set(severities));
  };

  // Fix the onClick handler for severity filter
  const handleSeverityFilter = (severity: ActivitySeverity | 'all') => {
    setFilterSeverity(severity);
  };

  // // Helper to get severity badge variant
  // const getSeverityVariant = (severity: ActivitySeverity | undefined) => {
  //   switch (severity) {
  //     case 'error':
  //     case 'critical':
  //       return 'destructive';
  //     case 'warning':
  //       return 'secondary';
  //     case 'success':
  //       return 'default';
  //     case 'info':
  //       return 'outline';a
  //     default:
  //       return 'outline';
  //   }
  // };

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh, refreshInterval]);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities]; // Create a copy to avoid mutating original array

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Apply severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(activity => activity.severity === filterSeverity);
    }

    // Sort by timestamp (newest first)
    filtered = filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit items
    return filtered.slice(0, maxItems);
  }, [activities, filterType, filterSeverity, maxItems]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    if (!groupByDate) return { today: filteredActivities };

    const groups: Record<string, ActivityItem[]> = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

    filteredActivities.forEach(activity => {
      const activityDate = new Date(activity.timestamp).toDateString();
      let groupKey = activityDate;

      if (activityDate === today) {
        groupKey = 'Today';
      } else if (activityDate === yesterday) {
        groupKey = 'Yesterday';
      } else {
        groupKey = new Date(activity.timestamp).toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  }, [filteredActivities, groupByDate]);

  const getActivityIcon = (type: string, severity?: string) => {
    const iconClasses = "h-4 w-4";
    
    switch (type) {
      case 'detection':
        return <Eye className={iconClasses} />;
      case 'camera':
        return <Camera className={iconClasses} />;
      case 'user':
        return <User className={iconClasses} />;
      case 'security':
        return <Shield className={iconClasses} />;
      case 'backup':
        return <Database className={iconClasses} />;
      case 'maintenance':
        return <Settings className={iconClasses} />;
      case 'system':
        if (severity === 'error' || severity === 'critical') return <AlertTriangle className={iconClasses} />;
        if (severity === 'success') return <CheckCircle className={iconClasses} />;
        return <Activity className={iconClasses} />;
      default:
        return <Circle className={iconClasses} />;
    }
  };

  const getActivityColor = (type: string, severity?: string) => {
    if (severity === 'critical') return 'text-red-700 bg-red-100 border-red-200';
    if (severity === 'error') return 'text-red-600 bg-red-50 border-red-200';
    if (severity === 'warning') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (severity === 'success') return 'text-green-600 bg-green-50 border-green-200';
    
    switch (type) {
      case 'detection':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'camera':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'user':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'security':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'backup':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'maintenance':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadge = (severity?: ActivitySeverity, priority?: string) => {
    if (priority === 'urgent' || severity === 'critical') {
      return <Badge variant="destructive" className="animate-pulse bg-rose-100 text-rose-800 border-rose-300">Nghiêm trọng</Badge>;
    }
    switch (severity) {
      case 'error':
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-300">Lỗi</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Cảnh báo</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300">Thành công</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Thông tin</Badge>;
      default:
        return null;
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case 'high':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'low':
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const formatDetailedTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getUniqueTypes = () => {
    const types = [...new Set(activities.map(activity => activity.type))];
    return types;
  };

  const renderMetadata = (metadata: ActivityItem['metadata']) => {
    if (!metadata || !showMetadata) return null;

    const items = [];
    
    if (metadata.camera_name) {
      items.push({ label: 'Camera', value: metadata.camera_name, icon: <Camera className="h-3 w-3" /> });
    }
    if (metadata.person_name) {
      items.push({ label: 'Person', value: metadata.person_name, icon: <User className="h-3 w-3" /> });
    }
    if (metadata.confidence) {
      items.push({ label: 'Confidence', value: `${(metadata.confidence * 100).toFixed(1)}%`, icon: <Target className="h-3 w-3" /> });
    }
    if (metadata.user_name) {
      items.push({ label: 'User', value: metadata.user_name, icon: <User className="h-3 w-3" /> });
    }
    if (metadata.ip_address) {
      items.push({ label: 'IP', value: metadata.ip_address, icon: <Wifi className="h-3 w-3" /> });
    }
    if (metadata.duration) {
      items.push({ label: 'Duration', value: `${metadata.duration}s`, icon: <Clock className="h-3 w-3" /> });
    }
    if (metadata.file_size) {
      items.push({ label: 'Size', value: `${(metadata.file_size / 1024 / 1024).toFixed(1)}MB`, icon: <HardDrive className="h-3 w-3" /> });
    }
    if (metadata.detection_zone) {
      items.push({ label: 'Zone', value: metadata.detection_zone, icon: <MapPin className="h-3 w-3" /> });
    }

    if (items.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-1">
            {item.icon}
            <span>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderActivityActions = (activity: ActivityItem) => {
    if (!activity.actions || activity.actions.length === 0) return null;

    return (
      <div className="flex items-center space-x-1 mt-2">
        {activity.actions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={action.action}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
        
        {activity.actions.length > 2 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {activity.actions.slice(2).map((action, index) => (
                <DropdownMenuItem key={index} onClick={action.action}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <Card className={cn("border-cyan-200 bg-gradient-to-br from-white to-cyan-50", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-cyan-700">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="ml-2 text-cyan-600">Đang tải hoạt động...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
  <Card className={cn("border-cyan-200 bg-gradient-to-br from-white to-cyan-50", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-bold text-cyan-700">Hoạt động gần đây</CardTitle>
            {activities.length > 0 && (
              <Badge variant="outline" className="ml-2 border-cyan-400 text-cyan-700">
                {activities.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Filters */}
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700">
                    <Filter className="h-4 w-4 mr-2" />
                    Bộ lọc
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Lọc theo loại</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    <span className={filterType === 'all' ? 'font-bold text-cyan-700' : ''}>Tất cả</span>
                  </DropdownMenuItem>
                  {getUniqueTypes().map(type => (
                    <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                      <span className={filterType === type ? 'font-bold text-cyan-700' : ''}>
                        {type === 'detection' ? 'Nhận diện' : type === 'camera' ? 'Camera' : type === 'user' ? 'Người dùng' : type === 'system' ? 'Hệ thống' : type === 'security' ? 'Bảo mật' : type === 'backup' ? 'Sao lưu' : type === 'maintenance' ? 'Bảo trì' : type}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Lọc theo mức độ</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSeverityFilter('all')}>
                    <span className={filterSeverity === 'all' ? 'font-bold text-cyan-700' : ''}>Tất cả</span>
                  </DropdownMenuItem>
                  {getUniqueSeverities().map(severity => (
                    <DropdownMenuItem 
                      key={severity} 
                      onClick={() => handleSeverityFilter(severity)}
                    >
                      <span className={filterSeverity === severity ? 'font-bold text-cyan-700' : ''}>
                        {formatSeverity(severity)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Refresh Button */}
            {onRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700" onClick={onRefresh} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Làm mới</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* View All Button */}
            {onViewAll && (
              <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-700" onClick={onViewAll}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Xem tất cả
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredActivities.length > 0 ? (
            <ScrollArea className="h-96">
              {Object.entries(groupedActivities).map(([dateGroup, groupActivities]) => (
                <div key={dateGroup} className="mb-6 last:mb-0">
                  {groupByDate && (
                    <div className="flex items-center space-x-2 mb-3">
                      <h4 className="text-sm font-medium text-gray-700">{dateGroup}</h4>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {groupActivities.map((activity) => {
                      const isExpanded = expandedItems.has(activity.id);
                      
                      return (
                        <div
                          key={activity.id}
                          className={cn(
                            "flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-all duration-200",
                            activity.priority === 'urgent' && "border-red-200 bg-red-50/50",
                            activity.severity === 'critical' && "border-red-300 bg-red-50"
                          )}
                        >
                          {/* Priority Indicator */}
                          <div className="flex flex-col items-center space-y-1 pt-1">
                            {getPriorityIndicator(activity.priority)}
                            <div className={cn(
                              "p-2 rounded-full border",
                              getActivityColor(activity.type, activity.severity)
                            )}>
                              {getActivityIcon(activity.type, activity.severity)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                <h5 className="font-medium text-sm text-gray-900 truncate">
                                  {activity.title}
                                </h5>
                                {getSeverityBadge(activity.severity, activity.priority)}
                                {activity.status && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      activity.status === 'active' && "bg-blue-50 text-blue-700 border-blue-200",
                                      activity.status === 'resolved' && "bg-green-50 text-green-700 border-green-200",
                                      activity.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                      activity.status === 'failed' && "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    {activity.status}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0 ml-2">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span>{formatTimeAgo(activity.timestamp)}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{formatDetailedTimestamp(activity.timestamp)}</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                {(activity.metadata || activity.actions) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => toggleItemExpansion(activity.id)}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "h-3 w-3 transition-transform",
                                        isExpanded && "transform rotate-180"
                                      )}
                                    />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {activity.description}
                            </p>

                            {/* Category and Location */}
                            {(activity.category || activity.location) && (
                              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                {activity.category && (
                                  <div className="flex items-center space-x-1">
                                    <Hash className="h-3 w-3" />
                                    <span>{activity.category}</span>
                                  </div>
                                )}
                                {activity.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{activity.location}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                {renderMetadata(activity.metadata)}
                                {renderActivityActions(activity)}
                                
                                {/* Additional details */}
                                {activity.metadata?.error_code && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                    <span className="font-medium text-red-800">Error Code: </span>
                                    <span className="text-red-700">{activity.metadata.error_code}</span>
                                  </div>
                                )}
                                
                                {activity.metadata?.action_taken && (
                                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                    <span className="font-medium text-blue-800">Action Taken: </span>
                                    <span className="text-blue-700">{activity.metadata.action_taken}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Image/Avatar */}
                          {showImages && activity.metadata?.image_url && (
                            <div className="flex-shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={activity.metadata.image_url} alt="Activity" />
                                <AvatarFallback>
                                  {getActivityIcon(activity.type, activity.severity)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-cyan-700 mb-2">Chưa có hoạt động nào</h3>
              <p className="text-cyan-600 text-sm max-w-sm mx-auto">
                {filterType !== 'all' || filterSeverity !== 'all' 
                  ? 'Không có hoạt động nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi bộ lọc.'
                  : 'Khi có sự kiện xảy ra trong hệ thống, chúng sẽ hiển thị tại đây.'
                }
              </p>
              {(filterType !== 'all' || filterSeverity !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-cyan-400 text-cyan-700"
                  onClick={() => {
                    setFilterType('all');
                    setFilterSeverity('all');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div className="flex items-center justify-center mt-4 text-xs text-cyan-600">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Tự động làm mới mỗi {Math.floor(refreshInterval / 1000)} giây
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RecentActivity;