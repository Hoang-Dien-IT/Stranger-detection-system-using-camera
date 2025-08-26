import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface StreamPlayerProps {
  cameraId: string;
  cameraName: string;
  apiUrl?: string;
  className?: string;
  onError?: (error: string) => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({
  cameraId,
  cameraName,
  apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000',
  className = '',
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Get token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('access_token'); // Use correct key
    console.log(`🔑 Getting auth token for ${cameraName}: ${token ? `Found (${token.substring(0, 20)}...)` : 'Not found'}`);
    return token || '';
  };

  // Clean API URL to avoid duplication
  const cleanApiUrl = apiUrl.replace(/\/api$/, '');
  
  // Create stream URL with fresh token
  const createStreamUrl = () => {
    const token = getAuthToken();
    const url = `${cleanApiUrl}/api/stream/${cameraId}/video?token=${encodeURIComponent(token)}&t=${Date.now()}`;
    console.log(`🔄 Creating stream URL for camera ${cameraName}: ${url.replace(/token=[^&]*/, 'token=***')}`);
    return url;
  };

  useEffect(() => {
    if (imgRef.current) {
      const streamUrl = createStreamUrl();
      imgRef.current.src = streamUrl;
      console.log(`� Starting stream for camera: ${cameraName}`);
    }
  }, [cameraId, cameraName]); // Remove cleanApiUrl dependency

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage('');
    setRetryCount(0);
    console.log(`✅ Stream loaded successfully for camera: ${cameraName}`);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    const error = `Failed to load stream from camera ${cameraName}`;
    setErrorMessage(error);
    onError?.(error);
    console.error(`❌ Stream error for camera ${cameraName}:`, error);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setRetryCount(prev => prev + 1);
    
    if (imgRef.current) {
      const streamUrl = createStreamUrl() + `&retry=${retryCount + 1}`;
      imgRef.current.src = streamUrl;
      console.log(`🔄 Retrying stream for camera ${cameraName}, attempt: ${retryCount + 1}`);
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent z-10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-200 font-semibold text-base drop-shadow">{cameraName}</span>
          </div>
          <div className="flex items-center space-x-2">
            {!hasError && !isLoading && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-200 text-xs font-semibold">TRỰC TIẾP</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
            <p className="text-cyan-200 text-sm">Đang tải luồng video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-20">
          <div className="text-center p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-3">Không thể tải luồng từ camera: {errorMessage}</p>
            <button
              onClick={handleRetry}
              className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại ({retryCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Stream Image */}
      <img
        ref={imgRef}
        alt={`Stream from ${cameraName}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ minHeight: '240px' }}
      />

      {/* Detection Overlay Info */}
      {!hasError && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-cyan-100 font-medium">
              Nhận diện khuôn mặt: <span className="text-emerald-200 font-semibold">Đang hoạt động</span>
            </div>
            <div className="text-xs text-cyan-200">
              Camera ID: {cameraId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamPlayer;