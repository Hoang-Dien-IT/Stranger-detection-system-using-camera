import React from 'react';
import { Card, CardContent, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Camera,
  Users,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Wifi,
  WifiOff,
  ExternalLink,
  RefreshCw,
  Info,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatItem {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'gray';
  description?: string;
  status?: 'healthy' | 'warning' | 'error' | 'offline';
  progress?: number; // ✅ Add progress support
  isStreaming?: boolean; // ✅ Add streaming indicator
  lastUpdated?: string; // ✅ Add last updated timestamp
  details?: Array<{
    label: string;
    value: string | number;
    status?: 'good' | 'warning' | 'error';
  }>;
  actions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
  href?: string;
  urgent?: boolean; // ✅ Add urgent flag for critical alerts
  metadata?: Record<string, any>; // ✅ Add Face Recognition specific metadata
}

interface StatsCardsProps {
  stats: StatItem[];
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
  showProgress?: boolean; // ✅ Add progress display option
  realTimeIndicator?: boolean; // ✅ Add real-time indicator
}

const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  loading = false,
  onRefresh,
  className,
  showProgress = false,
  realTimeIndicator = false
}) => {
  const getColorClasses = (color: StatItem['color'], status?: StatItem['status']) => {
    if (status === 'error' || status === 'offline') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
        text: 'text-red-900 dark:text-red-100',
        border: 'border-red-200 dark:border-red-800'
      };
    }
    
    if (status === 'warning') {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50',
        text: 'text-yellow-900 dark:text-yellow-100',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    }

    const colorMap = {
      blue: {
        bg: 'bg-gradient-to-br from-cyan-50 to-teal-50',
        icon: 'text-cyan-600 bg-cyan-100',
        text: 'text-cyan-900',
        border: 'border-cyan-200'
      },
      green: {
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        icon: 'text-emerald-600 bg-emerald-100',
        text: 'text-emerald-900',
        border: 'border-emerald-200'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600 bg-yellow-100',
        text: 'text-yellow-900',
        border: 'border-yellow-200'
      },
      red: {
        bg: 'bg-rose-50',
        icon: 'text-rose-600 bg-rose-100',
        text: 'text-rose-900',
        border: 'border-rose-200'
      },
      purple: {
        bg: 'bg-gradient-to-br from-cyan-50 to-purple-50',
        icon: 'text-purple-600 bg-purple-100',
        text: 'text-purple-900',
        border: 'border-purple-200'
      },
      indigo: {
        bg: 'bg-gradient-to-br from-cyan-50 to-indigo-50',
        icon: 'text-indigo-600 bg-indigo-100',
        text: 'text-indigo-900',
        border: 'border-indigo-200'
      },
      gray: {
        bg: 'bg-gray-50',
        icon: 'text-gray-600 bg-gray-100',
        text: 'text-gray-900',
        border: 'border-gray-200'
      }
    };
    return colorMap[color];
  };

  const getStatusIndicator = (status?: StatItem['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  // ✅ Enhanced loading skeleton
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color, stat.status);
          
          return (
            <Card
              key={stat.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer relative group",
                colors.bg,
                colors.border,
                stat.status === 'error' && "ring-2 ring-red-200 dark:ring-red-800",
                stat.status === 'warning' && "ring-2 ring-yellow-200 dark:ring-yellow-800",
                stat.urgent && "ring-2 ring-red-300 dark:ring-red-700 ring-opacity-50"
              )}
              onClick={() => stat.href && window.open(stat.href, '_blank')}
            >
              {/* ✅ Urgent indicator */}
              {stat.urgent && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}

              {/* ✅ Streaming indicator */}
              {stat.isStreaming && (
                <div className="absolute top-2 left-2 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}

              {/* ✅ Real-time indicator */}
              {realTimeIndicator && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <Wifi className="h-3 w-3 text-green-500" />
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className={cn("text-sm font-medium", colors.text)}>
                        {stat.title}
                      </p>
                      {getStatusIndicator(stat.status)}
                      {stat.description && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{stat.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    <div className="flex items-end space-x-2">
                      <p className={cn("text-3xl font-bold", colors.text)}>
                        {formatValue(stat.value)}
                      </p>
                      
                      {stat.change && (
                        <div className={cn(
                          "flex items-center space-x-1 text-sm",
                          stat.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {stat.change.type === 'increase' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">{Math.abs(stat.change.value)}%</span>
                        </div>
                      )}
                    </div>

                    {stat.change && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        vs {stat.change.period}
                      </p>
                    )}

                    {/* ✅ Last updated timestamp */}
                    {stat.lastUpdated && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(stat.lastUpdated)}
                      </p>
                    )}
                  </div>

                  <div className={cn("p-3 rounded-lg", colors.icon)}>
                    {stat.icon}
                  </div>
                </div>

                {/* ✅ Progress bar */}
                {showProgress && stat.progress !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Usage</span>
                      <span>{Math.round(stat.progress)}%</span>
                    </div>
                    <Progress 
                      value={stat.progress} 
                      className="h-2"
                      indicatorClassName={cn(
                        stat.progress > 90 ? 'bg-red-500' : 
                        stat.progress > 80 ? 'bg-orange-500' :
                        stat.progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                    />
                  </div>
                )}

                {/* Enhanced Details */}
                {stat.details && stat.details.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {stat.details.map((detail, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{detail.label}:</span>
                          <div className="flex items-center space-x-1">
                            <span className={cn("font-medium", colors.text)}>
                              {formatValue(detail.value)}
                            </span>
                            {detail.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            {detail.status === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                            {detail.status === 'good' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Actions */}
                {stat.actions && stat.actions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2 flex-wrap">
                      {stat.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Link Indicator */}
                {stat.href && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Enhanced Refresh Button */}
        {onRefresh && (
          <Card className="flex items-center justify-center hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <Button
                variant="outline"
                size="lg"
                onClick={onRefresh}
                className="w-full h-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
              >
                <RefreshCw className="h-6 w-6 mr-2 group-hover:animate-spin" />
                Refresh Stats
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default StatsCards;

// ✅ Enhanced Face Recognition specific configurations
export const createFaceRecognitionStats = (data: {
  cameras: {
    online: number;
    total: number;
    streaming: number;
    offline: number;
  };
  detections: {
    today: number;
    active: number;
    strangers: number;
    known: number;
  };
  persons: {
    total: number;
    withImages: number;
    recentAdditions: number;
  };
  system: {
    health: 'healthy' | 'warning' | 'error';
    cpuUsage: number;
    memoryUsage: number;
    uptime: string;
  };
}): StatItem[] => [
  {
    id: 'cameras-status',
    title: 'Camera Status',
    value: `${data.cameras.online}/${data.cameras.total}`,
    icon: <Camera className="h-6 w-6" />,
    color: data.cameras.online === data.cameras.total ? 'green' : 
           data.cameras.online > data.cameras.total / 2 ? 'yellow' : 'red',
    status: data.cameras.online === data.cameras.total ? 'healthy' : 
            data.cameras.online > 0 ? 'warning' : 'error',
    isStreaming: data.cameras.streaming > 0,
    urgent: data.cameras.offline > data.cameras.online,
    details: [
      { label: 'Online', value: data.cameras.online, status: 'good' },
      { label: 'Streaming', value: data.cameras.streaming, status: 'good' },
      { label: 'Offline', value: data.cameras.offline, status: data.cameras.offline > 0 ? 'error' : 'good' }
    ],
    actions: [
      {
        label: 'Manage',
        action: () => window.open('/cameras', '_blank'),
        icon: <ExternalLink className="h-3 w-3" />
      }
    ],
    href: '/cameras',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'live-detections',
    title: 'Today Detections',
    value: data.detections.today,
    icon: <Eye className="h-6 w-6" />,
    color: 'blue',
    urgent: data.detections.strangers > data.detections.known,
    change: {
      value: 15,
      type: 'increase',
      period: 'yesterday'
    },
    details: [
      { label: 'Known', value: data.detections.known, status: 'good' },
      { label: 'Strangers', value: data.detections.strangers, status: data.detections.strangers > 0 ? 'warning' : 'good' },
      { label: 'Active', value: data.detections.active, status: 'good' }
    ],
    actions: [
      {
        label: 'View Logs',
        action: () => window.open('/detections', '_blank'),
        icon: <Eye className="h-3 w-3" />
      },
      {
        label: 'Alerts',
        action: () => window.open('/alerts', '_blank'),
        icon: <Bell className="h-3 w-3" />,
        variant: data.detections.strangers > 0 ? 'destructive' : 'outline'
      }
    ],
    href: '/detections',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'known-persons',
    title: 'Known Persons',
    value: data.persons.total,
    icon: <Users className="h-6 w-6" />,
    color: 'purple',
    change: {
      value: data.persons.recentAdditions,
      type: 'increase',
      period: 'this week'
    },
    progress: data.persons.total > 0 ? (data.persons.withImages / data.persons.total) * 100 : 0,
    details: [
      { label: 'With Images', value: data.persons.withImages, status: 'good' },
      { label: 'Recent', value: data.persons.recentAdditions, status: 'good' }
    ],
    actions: [
      {
        label: 'Add Person',
        action: () => window.open('/persons/new', '_blank'),
        icon: <Users className="h-3 w-3" />
      }
    ],
    href: '/persons',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'system-health',
    title: 'System Health',
    value: data.system.health.charAt(0).toUpperCase() + data.system.health.slice(1),
    icon: <Activity className="h-6 w-6" />,
    color: data.system.health === 'healthy' ? 'green' : 
           data.system.health === 'warning' ? 'yellow' : 'red',
    status: data.system.health,
    urgent: data.system.health === 'error',
    progress: data.system.health === 'healthy' ? 95 : 
              data.system.health === 'warning' ? 70 : 30,
    details: [
      { label: 'CPU', value: `${data.system.cpuUsage}%`, status: data.system.cpuUsage > 80 ? 'warning' : 'good' },
      { label: 'Memory', value: `${data.system.memoryUsage}%`, status: data.system.memoryUsage > 85 ? 'warning' : 'good' },
      { label: 'Uptime', value: data.system.uptime, status: 'good' }
    ],
    actions: [
      {
        label: 'System Info',
        action: () => window.open('/admin/system', '_blank'),
        icon: <Server className="h-3 w-3" />
      }
    ],
    href: '/admin/system',
    lastUpdated: new Date().toISOString()
  }
];