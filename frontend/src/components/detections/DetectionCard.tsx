import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Eye,
  Clock,
  Camera,
  User,
  AlertTriangle,
  UserCheck,
  MoreHorizontal,
  ExternalLink,
  Download,
  Trash2,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Detection } from '@/types/detection.types';
import { cn } from '@/lib/utils';

interface DetectionCardProps {
  detection: Detection;
  onView?: (detection: Detection) => void;
  onDelete?: (detection: Detection) => void;
  onDownloadImage?: (detection: Detection) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const DetectionCard: React.FC<DetectionCardProps> = ({
  detection,
  onView,
  onDelete,
  onDownloadImage,
  showActions = true,
  compact = false,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const detectionTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - detectionTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getDetectionTypeColor = (type: string) => {
    return type === 'stranger' ? 'destructive' : 'default';
  };

  const getDetectionTypeIcon = (type: string) => {
    return type === 'stranger' ? AlertTriangle : UserCheck;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-rose-600 bg-rose-100';
  };

  const DetectionIcon = getDetectionTypeIcon(detection.detection_type);

  const handleDownloadImage = () => {
    if (detection.image_url) {
      const link = document.createElement('a');
      link.href = detection.image_url;
      link.download = `detection_${detection.id}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onDownloadImage?.(detection);
  };

  if (compact) {
    return (
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={!imageError ? detection.image_url : undefined} 
                alt="Detection"
                onError={() => setImageError(true)}
              />
              <AvatarFallback className={cn(
                detection.detection_type === 'stranger' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              )}>
                <DetectionIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium truncate text-sm">
                  {detection.detection_type === 'stranger' ? 'Unknown Person' : detection.person_name}
                </p>
                <Badge variant={getDetectionTypeColor(detection.detection_type)} className="text-xs">
                  {detection.detection_type === 'stranger' ? 'Stranger' : 'Known'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{formatTimeAgo(detection.timestamp)}</p>
            </div>
            
            <Badge variant="outline" className={cn("text-xs border-emerald-200", getConfidenceColor(detection.confidence))}>
              {formatConfidence(detection.confidence)}
            </Badge>
            
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(detection);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200 cursor-pointer group", className)}>
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {!imageError && detection.image_url ? (
            <img
              src={detection.image_url}
              alt="Detection"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DetectionIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          {/* Overlay Badges */}
          <div className="absolute top-3 left-3">
            <Badge variant={getDetectionTypeColor(detection.detection_type)} className="bg-gradient-to-r from-cyan-100 to-emerald-100 text-emerald-800 border-emerald-200">
              {detection.detection_type === 'stranger' ? 'Stranger' : 'Known Person'}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className={cn("bg-white/90 border-emerald-200", getConfidenceColor(detection.confidence))}>
              {formatConfidence(detection.confidence)}
            </Badge>
          </div>
          
          {/* Bounding Box Indicator */}
          {detection.bbox && detection.bbox.length === 4 && (
            <div className="absolute bottom-3 left-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="bg-white/90 border-cyan-200 text-cyan-700">
                      <Target className="h-3 w-3 mr-1" />
                      Face Detected
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bounding Box: [{detection.bbox.join(', ')}]</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">
                {detection.detection_type === 'stranger' ? 'Unknown Person' : detection.person_name}
              </h3>
              {detection.similarity_score && (
                <p className="text-sm text-gray-600">
                  Similarity: {formatConfidence(detection.similarity_score)}
                </p>
              )}
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(detection)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadImage}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(detection.image_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(detection)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Metadata */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              <span className="truncate">{detection.camera_name || 'Unknown Camera'}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{formatTimeAgo(detection.timestamp)}</span>
              <span className="mx-2">•</span>
              <span className="text-xs">{new Date(detection.timestamp).toLocaleString()}</span>
            </div>
            
            {detection.person_id && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="truncate">Person ID: {detection.person_id}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(detection);
                }}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectionCard;