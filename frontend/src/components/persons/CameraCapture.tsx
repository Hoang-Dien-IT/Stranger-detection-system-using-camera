import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  X,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cameraService } from '@/services/camera.service';
import { personService } from '@/services/person.service';
import { toast } from 'sonner';
import { Camera as CameraType } from '@/types/camera.types';

interface CameraCaptureProps {
  personId: string;
  personName: string;
  cameras: CameraType[];
  onComplete?: () => void;
  onCancel?: () => void;
  minImages?: number;
  maxImages?: number;
}

interface CapturedImage {
  id: string;
  imageData: string;
  timestamp: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  personId,
  personName,
  cameras,
  onComplete,
  onCancel,
  minImages = 8,
  maxImages = Infinity // Không giới hạn tối đa
}) => {
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [currentFps, setCurrentFps] = useState(10); // Default 10 FPS
  const [returningToDetails, setReturningToDetails] = useState(false);
  
  const videoRef = useRef<HTMLImageElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Image compression utility
  const compressImage = async (base64Data: string, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Return only the base64 part (without data:image/jpeg;base64,)
        resolve(compressedBase64.split(',')[1]);
      };
      
      img.src = `data:image/jpeg;base64,${base64Data}`;
    });
  };

  // Helper function to format image src
  const getImageSrc = (imageData: string) => {
    if (imageData.startsWith('data:image/')) {
      return imageData;
    }
    return `data:image/jpeg;base64,${imageData}`;
  };

  // Helper function to create blob URL for video display
  const createBlobUrl = (base64Data: string) => {
    try {
      const cleanBase64 = base64Data.startsWith('data:') 
        ? base64Data.split(',')[1] 
        : base64Data;
      
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return getImageSrc(base64Data);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      console.log('🔄 Component unmounting - cleaning up camera resources');
      
      if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort();
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      
      // Cleanup camera cache if we have a selected camera
      if (selectedCamera) {
        try {
          cameraService.cleanupCameraCache(selectedCamera.id);
          console.log('✅ Camera cache cleaned on unmount');
        } catch (error) {
          console.error('❌ Error cleaning camera cache on unmount:', error);
        }
      }
    };
  }, [selectedCamera]);

  const startStream = async (camera: CameraType) => {
    try {
      console.log('🔵 Starting stream for camera:', camera.name, camera.id);
      
      // Set states
      setSelectedCamera(camera);
      setStreamError(null);
      setIsStreaming(true);
      
      // Clear any existing frames
      setCurrentFrame(null);
      
      console.log('✅ States set, starting polling...');
      
      // Start polling immediately - skip camera tests for now
      startPollingStream(camera, true);
      
      toast.success(`Camera ${camera.name} started - Real-time mode`);
      
    } catch (error: any) {
      console.error('Error starting camera stream:', error);
      setStreamError(error.message || 'Failed to start camera');
      toast.error(error.message || 'Failed to start camera');
      setIsStreaming(false);
    }
  };

  const startPollingStream = (cameraToUse?: CameraType, forceStart = false) => {
    console.log('🔵 Starting continuous polling stream method');
    console.log('🔵 Camera parameter:', cameraToUse?.name);
    console.log('🔵 Force start:', forceStart);
    
    // Clear any existing interval first
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    const targetCamera = cameraToUse || selectedCamera;
    if (!targetCamera) {
      console.log('❌ No camera available for polling');
      return;
    }
    
    console.log('✅ Polling started for camera:', targetCamera.name);
    
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    const pollFrame = async () => {
      try {
        console.log('🔵 Polling frame from camera:', targetCamera.id);
        const frameResult = await cameraService.captureFrame(targetCamera.id);
        console.log('✅ Frame captured successfully');
        
        // Update display - just mark that we have a frame
        setCurrentFrame('frame-available');
        if (videoRef.current) {
          // Clean up previous blob URL
          if (videoRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoRef.current.src);
          }
          videoRef.current.src = createBlobUrl(frameResult.image_data);
        }
        
        setStreamError(null);
        setIsStreaming(true);
        consecutiveErrors = 0; // Reset error count on success
        
      } catch (error: any) {
        consecutiveErrors++;
        console.error(`❌ Polling frame error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        // Stop polling after too many consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('❌ Too many consecutive errors, stopping polling');
          if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
          }
          setStreamError(`Camera connection failed after ${maxConsecutiveErrors} attempts`);
          toast.error('Camera connection lost. Please restart the stream.');
          return;
        }
        
        // Handle specific error types
        if (error.response?.status === 401) {
          setStreamError('Authentication required. Please login again.');
          toast.error('Authentication failed. Please login again.');
          if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
          }
        } else if (error.message?.includes('timeout')) {
          setStreamError(`Camera timeout (${consecutiveErrors}/${maxConsecutiveErrors})`);
          // Continue polling for timeout errors
        } else {
          setStreamError(`Frame error (${consecutiveErrors}/${maxConsecutiveErrors}): ${error.message}`);
          // Continue polling for other errors
        }
      }
    };
    
    // Start polling immediately
    pollFrame();
    
    // Set up dynamic polling based on FPS setting
    const intervalMs = Math.floor(1000 / currentFps); // Convert FPS to milliseconds
    streamIntervalRef.current = setInterval(pollFrame, intervalMs);
    console.log(`✅ Polling interval set to ${intervalMs}ms (~${currentFps} FPS)`);
  };

  const stopStream = () => {
    console.log('🔵 Stopping camera stream');
    
    setIsStreaming(false);
    setCurrentFrame(null);
    setStreamError(null);
    
    // Clear polling interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
      console.log('✅ Polling interval cleared');
    }
    
    // Clear stream controller
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    
    // Clean up blob URLs
    if (videoRef.current && videoRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(videoRef.current.src);
      videoRef.current.src = '';
    }
    
    toast.info('Camera stream stopped');
  };

  const changeCamera = async () => {
    console.log('🔄 Changing camera - returning to camera selection');
    
    // Stop current streaming
    stopStream();
    
    // Cleanup camera cache if we have a selected camera
    if (selectedCamera) {
      try {
        await cameraService.cleanupCameraCache(selectedCamera.id);
        console.log('✅ Camera cache cleaned for camera change');
      } catch (error) {
        console.error('❌ Error cleaning camera cache:', error);
      }
    }
    
    // Reset to camera selection screen
    setSelectedCamera(null);
    toast.success('🔄 Camera disconnected. Select a different camera to continue.');
  };

  const exitCamera = async () => {
    console.log('🚪 Exiting camera completely');
    
    // Stop current streaming
    stopStream();
    
    // Cleanup camera cache if we have a selected camera
    if (selectedCamera) {
      try {
        await cameraService.cleanupCameraCache(selectedCamera.id);
        console.log('✅ Camera cache cleaned for exit');
      } catch (error) {
        console.error('❌ Error cleaning camera cache:', error);
      }
    }
    
    // Close the entire camera capture component
    toast.info('🚪 Camera capture closed. Returning to face management.');
    onCancel?.(); // Call the parent cancel function to close the component
  };

  const captureImage = async () => {
    if (!selectedCamera || isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      const result = await cameraService.captureFrame(selectedCamera.id);
      
      // Compress image before storing
      const compressedImageData = await compressImage(result.image_data);
      
      const newImage: CapturedImage = {
        id: `capture_${Date.now()}`,
        imageData: compressedImageData,
        timestamp: result.timestamp,
        uploaded: false,
        uploading: false
      };
      
      setCapturedImages(prev => [...prev, newImage]);
      toast.success('Image captured successfully');
      
    } catch (error: any) {
      console.error('Error capturing image:', error);
      toast.error(error.message || 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const removeImage = (imageId: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const uploadImages = async () => {
    if (capturedImages.length < minImages) {
      toast.error(`Please capture at least ${minImages} images`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const imagesToUpload = capturedImages.filter(img => !img.uploaded);
      let uploadedCount = 0;
      let totalUploadedCount = 0;
      
      for (const image of imagesToUpload) {
        try {
          // Mark as uploading
          setCapturedImages(prev => 
            prev.map(img => 
              img.id === image.id ? { ...img, uploading: true, error: undefined } : img
            )
          );
          
          // Upload image - handle both formats
          let base64Data = image.imageData;
          if (!base64Data) {
            throw new Error('Image data is empty');
          }
          
          console.log('🔵 Original image data length:', base64Data.length);
          
          if (base64Data.startsWith('data:image/')) {
            base64Data = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          }
          
          if (!base64Data || base64Data.length < 100) {
            throw new Error('Invalid base64 image data');
          }
          
          console.log('🔵 Uploading base64 data length:', base64Data.length);
          console.log('🔵 Estimated size in KB:', Math.round(base64Data.length * 0.75 / 1024));
          
          // Compress if too large (>500KB)
          if (base64Data.length > 500000) {
            console.log('🔵 Image too large, compressing...');
            base64Data = await compressImage(base64Data, 0.5);
            console.log('🔵 Compressed image data length:', base64Data.length);
          }
          
          await personService.addFaceImage(personId, base64Data);
          
          // Mark as uploaded
          setCapturedImages(prev => 
            prev.map(img => 
              img.id === image.id ? { ...img, uploading: false, uploaded: true } : img
            )
          );
          
          uploadedCount++;
          totalUploadedCount++;
          setUploadProgress((uploadedCount / imagesToUpload.length) * 100);
          
        } catch (error: any) {
          console.error('Error uploading image:', error);
          
          // Mark upload error
          setCapturedImages(prev => 
            prev.map(img => 
              img.id === image.id ? { 
                ...img, 
                uploading: false, 
                error: error.message || 'Upload failed' 
              } : img
            )
          );
        }
      }
      
      // Check total successful uploads (including previously uploaded)
      const finalSuccessCount = capturedImages.filter(img => img.uploaded).length + totalUploadedCount;
      
      if (totalUploadedCount > 0) {
        toast.success(`Successfully uploaded ${totalUploadedCount} new face images!`);
        
        // Show returning message
        setReturningToDetails(true);
        
        // Show completion message
        toast.success(`🎉 Face capture completed! Total: ${finalSuccessCount} images uploaded for ${personName}`);
        
        // Navigate back to person details after showing success
        setTimeout(() => {
          // Clean up camera resources before leaving
          if (selectedCamera) {
            stopStream();
          }
          
          // Call parent callback to return to person details
          onComplete?.();
        }, 2500); // 2.5 second delay to show success messages
      } else {
        toast.error('Failed to upload any new images. Please try again.');
      }
      
    } catch (error: any) {
      console.error('Error during upload process:', error);
      toast.error(error.message || 'Upload process failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const retryUpload = async (imageId: string) => {
    const image = capturedImages.find(img => img.id === imageId);
    if (!image) return;
    
    try {
      setCapturedImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, uploading: true, error: undefined } : img
        )
      );
      
      // Extract base64 data from data URL for retry upload
      let base64Data = image.imageData;
      if (base64Data.startsWith('data:image/')) {
        base64Data = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      }
      console.log('🔵 Retry uploading base64 data length:', base64Data.length);
      await personService.addFaceImage(personId, base64Data);
      
      setCapturedImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, uploading: false, uploaded: true } : img
        )
      );
      
      toast.success('Image uploaded successfully');
      
      // Check if all images are now uploaded successfully
      const updatedImages = capturedImages.map(img => 
        img.id === imageId ? { ...img, uploading: false, uploaded: true } : img
      );
      
      const allUploaded = updatedImages.every(img => img.uploaded);
      const hasMinimumImages = updatedImages.filter(img => img.uploaded).length >= minImages;
      
      // If all images are uploaded and we have minimum required, auto-return to details
      if (allUploaded && hasMinimumImages && !returningToDetails) {
        setTimeout(() => {
          toast.success(`🎉 All images uploaded successfully! Returning to Person Details...`);
          setReturningToDetails(true);
          
          setTimeout(() => {
            // Clean up camera resources
            if (selectedCamera) {
              stopStream();
            }
            onComplete?.();
          }, 2000);
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error retrying upload:', error);
      setCapturedImages(prev => 
        prev.map(img => 
          img.id === imageId ? { 
            ...img, 
            uploading: false, 
            error: error.message || 'Upload failed' 
          } : img
        )
      );
      toast.error('Failed to upload image');
    }
  };

  const canUpload = capturedImages.length >= minImages;
  const hasErrors = capturedImages.some(img => img.error);

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4">
  <div className="container mx-auto px-2 sm:px-4 space-y-3 sm:space-y-4">
        {/* Camera Selection */}
        {!selectedCamera && (
          <Card className="max-w-6xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Camera className="h-5 w-5 text-cyan-600" />
                <span>Chọn camera để chụp khuôn mặt</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    Hãy chọn camera để chụp ảnh khuôn mặt cho <strong>{personName}</strong>.<br/>
                    Cần chụp tối thiểu {minImages} ảnh, tối đa {maxImages} ảnh.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {cameras.map((camera) => (
                    <Card 
                      key={camera.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-cyan-200"
                      onClick={() => {
                        startStream(camera);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-cyan-800">{camera.name}</h3>
                            <Badge variant={camera.is_active ? "default" : "secondary"} className={camera.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                              {camera.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                            </Badge>
                          </div>
                          <p className="text-sm text-cyan-700">{camera.description}</p>
                          <div className="flex justify-between text-xs text-cyan-500">
                            <span>{camera.camera_type}</span>
                            <span>{camera.location}</span>
                          </div>
                          <Button size="sm" className="w-full bg-cyan-600 text-white hover:bg-cyan-700">
                            <Camera className="h-4 w-4 mr-2" />
                            Chọn camera
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {cameras.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription>
                      Không có camera nào khả dụng. Vui lòng thêm camera trước khi chụp ảnh khuôn mặt.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Stream and Capture */}
        {selectedCamera && (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Camera Info Header */}
            <Card className="bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Camera className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cyan-900">Camera: {selectedCamera.name}</h3>
                      <p className="text-sm text-cyan-700">Đang chụp ảnh cho {personName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isStreaming && (
                      <Badge variant="default" className="bg-emerald-600 text-xs">
                        <div className="w-2 h-2 bg-emerald-300 rounded-full mr-1 animate-pulse"></div>
                        Đang phát ({currentFps} FPS)
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={changeCamera} className="text-xs border-cyan-400 text-cyan-700">
                      <X className="h-3 w-3 mr-1" />
                      Đổi camera
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Camera Interface - Optimized Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              {/* Camera Feed - Main Area */}
              <div className="xl:col-span-3">
                <Card className="shadow-lg border-2 border-cyan-200">
                  <CardContent className="p-0">
                    {/* Camera Stream Container */}
                    <div className="relative bg-gradient-to-br from-cyan-900 to-black rounded-lg overflow-hidden">
                      <div className="aspect-video relative">
                        {isStreaming ? (
                          <>
                            <img
                              ref={videoRef}
                              className="w-full h-full object-cover"
                              alt="Camera stream"
                              style={{ 
                                display: currentFrame ? 'block' : 'none',
                                backgroundColor: 'black'
                              }}
                              src={currentFrame || undefined}
                              onError={(e) => {
                                console.error('❌ Camera stream image error:', e);
                                console.log('❌ Current frame:', currentFrame);
                                setStreamError('Image display error - Frame not loading');
                              }}
                              onLoad={() => {
                                console.log('✅ Camera stream image loaded successfully');
                                console.log('✅ Frame source:', currentFrame?.substring(0, 50) + '...');
                                setStreamError(null);
                              }}
                            />
                            {/* Debug info overlay - simplified */}
                            {!currentFrame && (
                              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                                <div className="text-center bg-black bg-opacity-60 p-4 rounded-lg max-w-md">
                                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="mb-2">Đang kết nối tới camera...</p>
                                  <div className="text-xs text-gray-300 space-y-1 mb-3">
                                    <p>Camera: {selectedCamera?.name || 'Không xác định'}</p>
                                    <p>Trạng thái: {isStreaming ? 'Đang kết nối' : 'Mất kết nối'}</p>
                                    {streamError && <p className="text-rose-400">Lỗi: {streamError}</p>}
                                  </div>
                                  <div className="space-y-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        if (!selectedCamera) return;
                                        try {
                                          console.log('🧪 Manual frame test');
                                          const result = await cameraService.captureFrame(selectedCamera.id);
                                          setCurrentFrame('frame-available');
                                          if (videoRef.current) {
                                            // Clean up previous blob URL
                                            if (videoRef.current.src.startsWith('blob:')) {
                                              URL.revokeObjectURL(videoRef.current.src);
                                            }
                                            videoRef.current.src = createBlobUrl(result.image_data);
                                          }
                                          toast.success('Camera connected!');
                                        } catch (error: any) {
                                          console.error('❌ Connection test failed:', error);
                                          toast.error('Connection failed: ' + error.message);
                                        }
                                      }}
                                      className="text-white border-white hover:bg-white hover:text-black text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Thử lại
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        if (!selectedCamera) return;
                                        try {
                                          console.log('🔧 Resetting camera connection');
                                          await cameraService.cleanupCameraCache(selectedCamera.id);
                                          toast.success('Camera reset!');
                                          setTimeout(() => {
                                            startPollingStream(selectedCamera, true);
                                          }, 500);
                                        } catch (error: any) {
                                          console.error('❌ Camera reset failed:', error);
                                          toast.error('Reset failed: ' + error.message);
                                        }
                                      }}
                                      className="text-white border-white hover:bg-white hover:text-black text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Đặt lại
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Connection status and controls overlay */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              <Badge variant="default" className="bg-emerald-600 text-xs">
                                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mr-1 animate-pulse"></div>
                                Đang phát ({currentFps} FPS)
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newFps = currentFps >= 15 ? 5 : currentFps + 5;
                                  setCurrentFps(newFps);
                                  if (isStreaming && selectedCamera) {
                                    startPollingStream(selectedCamera, true);
                                  }
                                }}
                                className="text-xs bg-black/50 text-white border-white/30 hover:bg-white hover:text-black px-2 py-1"
                              >
                                FPS: {currentFps}
                              </Button>
                            </div>
                            {/* Exit camera button */}
                            <div className="absolute top-2 right-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={exitCamera}
                                className="bg-rose-500/80 text-white border-rose-400 hover:bg-rose-600 hover:border-rose-500 text-xs px-2 py-1"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Thoát
                              </Button>
                            </div>
                            {/* Error overlay - improved design */}
                            {streamError && (
                              <div className="absolute bottom-16 left-2 right-2">
                                <Alert variant="destructive" className="bg-red-500/90 border-red-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  <AlertDescription className="text-white font-medium text-xs">
                                    {streamError}
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-white">
                            <div className="text-center">
                              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="mb-3 text-base font-medium">Chưa kết nối camera</p>
                              {streamError && (
                                <p className="text-red-400 text-sm mb-3 max-w-sm">{streamError}</p>
                              )}
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startStream(selectedCamera!)}
                                  className="text-white border-white hover:bg-white hover:text-black px-4"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Bắt đầu camera
                                </Button>
                                <br />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={changeCamera}
                                  className="text-cyan-500 border-cyan-400 hover:bg-cyan-400 hover:text-white px-4 mr-2"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Đổi camera
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={exitCamera}
                                  className="text-rose-500 border-rose-400 hover:bg-rose-500 hover:text-white px-4"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Thoát camera
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Capture Button - moved outside camera box */}
                    <div className="flex flex-col items-center mt-3 sm:mt-4">
                      <Button
                        size="lg"
                        onClick={captureImage}
                        disabled={!isStreaming || isCapturing || capturedImages.length >= maxImages}
                        className={`
                          rounded-full w-16 h-16 sm:w-20 sm:h-20 shadow-lg transition-all duration-200 mb-2
                          ${!isStreaming || isCapturing || capturedImages.length >= maxImages 
                            ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
                          }
                        `}
                      >
                        {isCapturing ? (
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white" />
                        ) : (
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
                        )}
                      </Button>
                      <div className="text-gray-700 text-xs bg-white/80 rounded px-2 py-1 text-center">
                        {isCapturing ? 'Đang chụp...' : 
                         capturedImages.length >= maxImages ? 'Đã đủ số lượng tối đa' :
                         !isStreaming ? 'Camera chưa sẵn sàng' : 'Nhấn để chụp'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls and Progress - Enhanced Right Column */}
              <div className="xl:col-span-2 space-y-3 sm:space-y-4 order-2">
                {/* Progress Info - Enhanced Design */}
                <Card className="border-2 border-cyan-100 bg-gradient-to-br from-cyan-50 to-emerald-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center">
                        <ImageIcon className="h-5 w-5 mr-2 text-cyan-600" />
                        <span className="text-cyan-800">Tiến trình chụp ảnh</span>
                      </div>
                      <Badge variant="outline" className="bg-white border-cyan-200 text-cyan-800">
                        {Math.round((capturedImages.length / minImages) * 100)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-cyan-700">Số ảnh đã chụp</span>
                        <span className="text-cyan-600 font-bold">{capturedImages.length} / {minImages} cần thiết</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={(capturedImages.length / minImages) * 100} 
                          className="h-3 bg-cyan-100"
                        />
                        <div className="flex justify-between text-xs text-cyan-500">
                          <span>Tối thiểu: {minImages}</span>
                          <span>Tối đa: {maxImages}</span>
                        </div>
                      </div>
                      
                      {capturedImages.length < minImages ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-700 font-medium flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Cần thêm {minImages - capturedImages.length} ảnh nữa
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Hãy chụp nhiều góc mặt và biểu cảm khác nhau để tăng độ chính xác
                          </p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-sm text-emerald-700 font-medium flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            Đã sẵn sàng tải lên!
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            Bạn có thể chụp thêm {maxImages - capturedImages.length} ảnh nếu muốn
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Captured Images Preview - Enhanced Layout */}
                {capturedImages.length > 0 && (
                  <Card className="border-2 border-cyan-100">
                    <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 to-emerald-50">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <ImageIcon className="h-5 w-5 mr-2 text-cyan-600" />
                          <span className="text-cyan-800">Ảnh đã chụp</span>
                        </div>
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 font-semibold">
                          {capturedImages.length} / {maxImages}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-cyan-700 mt-1">
                        Xem lại ảnh trước khi tải lên
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {capturedImages.map((image, index) => (
                          <div key={image.id} className={`
                            relative group bg-white border border-gray-200 rounded-lg p-3 
                            hover:shadow-md transition-all duration-200 image-preview-item
                            ${image.uploading ? 'status-uploading' : ''}
                            ${image.uploaded ? 'status-uploaded' : ''}
                            ${image.error ? 'status-error border-red-200 bg-red-50' : ''}
                          `}>
                            <div className="flex items-center space-x-4">
                              {/* Image Preview */}
                              <div className="flex-shrink-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                  <img
                                    src={getImageSrc(image.imageData)}
                                    alt={`Captured face ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              
                              {/* Image Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-cyan-900 truncate">
                                    Ảnh #{index + 1}
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    {/* Status Indicator */}
                                    {image.uploading && (
                                      <div className="flex items-center space-x-1 text-cyan-600">
                                        <div className="animate-spin rounded-full h-3 w-3 border border-cyan-600 border-t-transparent" />
                                        <span className="text-xs">Đang tải lên...</span>
                                      </div>
                                    )}
                                    {image.uploaded && (
                                      <div className="flex items-center space-x-1 text-emerald-600">
                                        <Check className="h-3 w-3" />
                                        <span className="text-xs font-medium">Đã tải lên</span>
                                      </div>
                                    )}
                                    {image.error && (
                                      <div className="flex items-center space-x-1 text-rose-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="text-xs font-medium">Lỗi</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Timestamp */}
                                <p className="text-xs text-cyan-500 mb-2">
                                  Đã chụp: {new Date(image.timestamp).toLocaleTimeString()}
                                </p>
                                
                                {/* Error Message */}
                                {image.error && (
                                  <p className="text-xs text-rose-600 bg-rose-50 p-1 rounded mb-2">
                                    {image.error}
                                  </p>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  {image.error && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => retryUpload(image.id)}
                                      disabled={image.uploading}
                                      className="text-xs px-2 py-1 h-6 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                                    >
                                      <RotateCcw className="h-2.5 w-2.5 mr-1" />
                                      Thử lại
                                    </Button>
                                  )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeImage(image.id)}
                                      disabled={image.uploading}
                                      className="text-xs px-2 py-1 h-6 border-rose-300 text-rose-700 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-2.5 w-2.5 mr-1" />
                                      Xóa
                                    </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-emerald-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-emerald-600">
                              {capturedImages.filter(img => img.uploaded).length}
                            </p>
                            <p className="text-xs text-black">Đã tải lên</p>
                          </div>
                          <div className="bg-cyan-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-cyan-600">
                              {capturedImages.filter(img => img.uploading).length}
                            </p>
                            <p className="text-xs text-black">Đang tải lên</p>
                          </div>
                          <div className="bg-rose-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-rose-600">
                              {capturedImages.filter(img => img.error).length}
                            </p>
                            <p className="text-xs text-black">Lỗi</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Đang tải ảnh lên...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Returning to Details - Enhanced */}
                {returningToDetails && (
                  <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-green-700">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Tải ảnh lên thành công!</p>
                            <p className="text-sm text-emerald-600">Đang quay lại trang chi tiết...</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-black">✅ Đã tải lên ảnh khuôn mặt cho <strong>{personName}</strong></span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                              {capturedImages.filter(img => img.uploaded).length} ảnh
                            </Badge>
                          </div>
                          <p className="text-xs text-black mt-1">
                            Bạn có thể tạo embedding khuôn mặt ở trang chi tiết nhân sự
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Validation Messages */}
                {!canUpload && capturedImages.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                      {capturedImages.length < minImages 
                        ? `Cần chụp ít nhất ${minImages} ảnh (còn thiếu ${minImages - capturedImages.length} ảnh).`
                        : `Tối đa ${maxImages} ảnh. Vui lòng xóa bớt ${capturedImages.length - maxImages} ảnh.`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {hasErrors && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <AlertDescription className="text-sm">
                      Một số ảnh tải lên thất bại. Hãy thử lại hoặc xóa ảnh lỗi.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Enhanced Design */}
  <Card className="bg-cyan-50 max-w-7xl mx-auto">
          <CardContent className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-black">
                {capturedImages.length > 0 ? (
                  <span>Sẵn sàng tải lên {capturedImages.length} ảnh cho <strong>{personName}</strong></span>
                ) : (
                  <span>Dùng camera để chụp ảnh khuôn mặt cho <strong>{personName}</strong></span>
                )}
              </div>
              
              <div className="flex space-x-2 sm:space-x-3">
                <Button 
                  variant="outline" 
                  onClick={onCancel} 
                  disabled={uploading || returningToDetails}
                  className="flex-1 sm:flex-none px-3 sm:px-4 text-xs sm:text-sm border-rose-300 text-rose-700"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Hủy
                </Button>
                
                {/* Complete & Return button - show when minimum images are captured */}
                {capturedImages.length >= minImages && capturedImages.some(img => img.uploaded) && !returningToDetails && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const uploadedCount = capturedImages.filter(img => img.uploaded).length;
                      toast.success(`✅ Đã hoàn tất chụp với ${uploadedCount} ảnh!`);
                      setReturningToDetails(true);
                      setTimeout(() => {
                        if (selectedCamera) {
                          stopStream();
                        }
                        onComplete?.();
                      }, 1500);
                    }}
                    disabled={uploading}
                    className="flex-1 sm:flex-none px-3 sm:px-4 text-xs sm:text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Hoàn tất & Quay lại
                  </Button>
                )}
                
                {capturedImages.length > 0 && !returningToDetails && (
                  <Button
                    onClick={uploadImages}
                    disabled={!canUpload || uploading || hasErrors}
                    className="flex-1 sm:flex-none min-w-24 sm:min-w-32 px-3 sm:px-4 text-xs sm:text-sm bg-cyan-600 text-white hover:bg-cyan-700"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2" />
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Tải lên {capturedImages.filter(img => !img.uploaded).length} ảnh
                      </>
                    )}
                  </Button>
                )}
                
                {returningToDetails && (
                  <Button
                    disabled
                    className="flex-1 sm:flex-none min-w-24 sm:min-w-32 px-3 sm:px-4 text-xs sm:text-sm bg-emerald-600 text-white"
                  >
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2" />
                    Đang quay lại...
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraCapture;
