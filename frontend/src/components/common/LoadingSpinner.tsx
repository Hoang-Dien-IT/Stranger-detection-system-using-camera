import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Camera, Eye } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars' | 'ripple' | 'brand' | 'face-scan' | 'camera-load';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  text?: string;
  overlay?: boolean;
  centered?: boolean;
  fullScreen?: boolean;
  className?: string;
  // New props for Face Recognition context
  progress?: number; // For showing progress percentage
  stage?: string; // For showing current loading stage
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  overlay = false,
  centered = true,
  fullScreen = false,
  className,
  progress,
  stage
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'w-3 h-3';
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      default: return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'text-teal-600';
      case 'secondary': return 'text-emerald-600';
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-rose-600';
      case 'gray': return 'text-slate-400';
      default: return 'text-teal-600';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const renderSpinner = () => {
    const baseClasses = cn(getSizeClasses(), getColorClasses());

    switch (variant) {
      case 'spinner':
        return <Loader2 className={cn(baseClasses, 'animate-spin')} />;

      case 'pulse':
        return (
          <div className={cn(baseClasses, 'rounded-full animate-pulse')}>
            <div className="w-full h-full bg-current rounded-full opacity-75" />
          </div>
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-bounce',
                  size === 'xs' ? 'w-1 h-1' :
                  size === 'sm' ? 'w-1.5 h-1.5' :
                  size === 'md' ? 'w-2 h-2' :
                  size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
                  getColorClasses()
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div className="flex space-x-1 items-center">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-current animate-pulse',
                  size === 'xs' ? 'w-0.5 h-2' :
                  size === 'sm' ? 'w-0.5 h-3' :
                  size === 'md' ? 'w-1 h-4' :
                  size === 'lg' ? 'w-1 h-6' : 'w-1.5 h-8',
                  getColorClasses()
                )}
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'ripple':
        return (
          <div className={cn('relative inline-flex', getSizeClasses())}>
            <div className={cn(
              'absolute inset-0 rounded-full border-2 border-current opacity-75 animate-ping',
              getColorClasses()
            )} />
            <div className={cn(
              'relative rounded-full border-2 border-current',
              getColorClasses()
            )} />
          </div>
        );

      case 'brand':
        return (
          <div className="relative">
            <Zap className={cn(baseClasses, 'animate-pulse')} />
            <div className={cn(
              'absolute inset-0 rounded-full animate-spin',
              getSizeClasses()
            )}>
              <div className="w-full h-full border-2 border-transparent border-t-current border-r-current rounded-full" />
            </div>
          </div>
        );

      // ✨ NEW: Face Recognition specific variants
      case 'face-scan':
        return (
          <div className="relative">
            <Eye className={cn(baseClasses, 'animate-pulse')} />
            <div className={cn(
              'absolute inset-0 rounded-full animate-spin',
              getSizeClasses()
            )}>
              <div className="w-full h-full border-2 border-transparent border-b-current border-l-current rounded-full" />
            </div>
          </div>
        );

      case 'camera-load':
        return (
          <div className="relative">
            <Camera className={cn(baseClasses)} />
            <div className={cn(
              'absolute -inset-1 rounded-full animate-pulse',
              'border-2 border-current opacity-50'
            )} />
          </div>
        );

      default:
        return <Loader2 className={cn(baseClasses, 'animate-spin')} />;
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      centered && 'text-center',
      className
    )}>
      {renderSpinner()}
      
      {/* Progress bar for Face Recognition tasks */}
      {progress !== undefined && (
        <div className="w-32 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full h-1.5 mt-2">
          <div 
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      
      {/* Loading stage indicator */}
      {stage && (
        <div className={cn(
          'text-xs text-emerald-700 mt-1',
          getTextSizeClasses()
        )}>
          {stage}
        </div>
      )}
      
      {text && (
        <div className={cn(
          'font-medium',
          getTextSizeClasses(),
          getColorClasses()
        )}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm dark:bg-gray-900 dark:bg-opacity-75">
        {content}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

// ✨ Enhanced preset components for Face Recognition SaaS
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ 
  text = 'Đang tải dữ liệu...' 
}) => (
  <LoadingSpinner 
    size="lg" 
    variant="brand" 
    text={text} 
    fullScreen 
  />
);

export const CardLoadingSpinner: React.FC<{ text?: string }> = ({ 
  text 
}) => (
  <LoadingSpinner 
    size="md" 
    variant="spinner" 
    text={text} 
    centered 
  />
);

export const ButtonLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="sm" 
    variant="spinner" 
    color="secondary"
    className="mr-2" 
  />
);

export const InlineLoadingSpinner: React.FC<{ size?: 'xs' | 'sm' | 'md' }> = ({ 
  size = 'sm' 
}) => (
  <LoadingSpinner 
    size={size} 
    variant="spinner" 
    centered={false} 
  />
);

// ✨ NEW: Face Recognition specific loaders
export const FaceScanLoader: React.FC<{ 
  progress?: number; 
  stage?: string; 
  text?: string 
}> = ({ progress, stage, text = 'Scanning faces...' }) => (
  <LoadingSpinner 
    size="lg" 
    variant="face-scan" 
    color="primary"
    text={text}
    progress={progress}
    stage={stage}
    centered 
  />
);

export const CameraLoadingSpinner: React.FC<{ text?: string }> = ({ 
  text = 'Đang kết nối tới camera...' 
}) => (
  <LoadingSpinner 
    size="md" 
    variant="camera-load" 
    color="primary"
    text={text} 
    centered 
  />
);

export const ProcessingLoader: React.FC<{ 
  progress?: number;
  stage?: string;
}> = ({ progress, stage }) => (
  <LoadingSpinner 
    size="md" 
    variant="bars" 
    color="primary"
    text="Đang xử lý..."
    progress={progress}
    stage={stage}
    centered 
  />
);

export default LoadingSpinner;