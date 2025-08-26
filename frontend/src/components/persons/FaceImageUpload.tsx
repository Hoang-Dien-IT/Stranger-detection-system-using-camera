import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  Camera,
  Check,
  AlertTriangle,
  FileImage,
  Plus,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { personService } from '@/services/person.service';
import { cameraService } from '@/services/camera.service';
import { toast } from 'sonner';
import CameraCapture from './CameraCapture';
import { Camera as CameraType } from '@/types/camera.types';

interface FaceImageUploadProps {
  personId: string;
  personName: string;
  existingImages?: FaceImage[];
  onComplete?: () => void;
  onImageAdded?: (image: FaceImage) => void;
  onImageRemoved?: (imageIndex: number) => void;
  allowSkip?: boolean;
  maxImages?: number;
}

interface FaceImage {
  id?: string;
  image_url: string;
  uploaded_at: string;
  is_primary?: boolean;
}

interface UploadState {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  progress: number;
}

const FaceImageUpload: React.FC<FaceImageUploadProps> = ({
  personId,
  personName,
  existingImages = [],
  onComplete,
  onImageAdded,
  onImageRemoved,
  allowSkip = false,
  maxImages = Infinity // Không giới hạn tối đa
}) => {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [validating, setValidating] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  
  // ✅ New states for camera capture
  const [uploadMethod, setUploadMethod] = useState<'files' | 'camera'>('files');
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loadingCameras, setLoadingCameras] = useState(false);

  // ✅ Load cameras when component mounts
  useEffect(() => {
    const loadCameras = async () => {
      try {
        setLoadingCameras(true);
        const cameraList = await cameraService.getCameras();
        setCameras(cameraList.filter(camera => camera.is_active));
      } catch (error) {
        console.error('Error loading cameras:', error);
        toast.error('Failed to load cameras');
      } finally {
        setLoadingCameras(false);
      }
    };

    loadCameras();
  }, []);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Không giới hạn số lượng ảnh tối đa
    const newUploads = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
      progress: 0
    }));

    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const uploadImage = async (index: number) => {
    const upload = uploads[index];
    if (!upload || upload.uploading || upload.uploaded) return;
  
    try {
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, uploading: true, progress: 0 } : u
      ));
  
      // Convert to base64
      const base64 = await convertToBase64(upload.file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map((u, i) => 
          i === index ? { ...u, progress: Math.min(u.progress + 10, 90) } : u
        ));
      }, 100);
  
      // ✅ Fix: Pass the base64 string directly, not wrapped in an object
      await personService.addFaceImage(personId, base64);
  
      clearInterval(progressInterval);
  
      setUploads(prev => prev.map((u, i) => 
        i === index ? { 
          ...u, 
          uploading: false, 
          uploaded: true, 
          progress: 100,
          error: undefined
        } : u
      ));
  
      onImageAdded?.({
        image_url: base64,
        uploaded_at: new Date().toISOString(),
        is_primary: existingImages.length === 0 && index === 0
      });
  
      toast.success('Face image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploads(prev => prev.map((u, i) => 
        i === index ? { 
          ...u, 
          uploading: false, 
          uploaded: false, 
          progress: 0,
          error: error.response?.data?.detail || 'Upload failed'
        } : u
      ));
      toast.error('Failed to upload image');
    }
  };

  const uploadAllImages = async () => {
    const pendingUploads = uploads
      .map((upload, index) => ({ upload, index }))
      .filter(({ upload }) => !upload.uploaded && !upload.uploading);

    if (pendingUploads.length === 0) {
      onComplete?.();
      return;
    }

    // Upload all pending images
    for (const { index } of pendingUploads) {
      await uploadImage(index);
    }

    // Update total progress
    updateTotalProgress();
  };

  const updateTotalProgress = () => {
    if (uploads.length === 0) {
      setTotalProgress(0);
      return;
    }

    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
    setTotalProgress(totalProgress / uploads.length);
  };

  const removeUpload = (index: number) => {
    const upload = uploads[index];
    if (upload.preview) {
      URL.revokeObjectURL(upload.preview);
    }
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageIndex: number) => {
    try {
      await personService.removeFaceImage(personId, imageIndex);
      onImageRemoved?.(imageIndex);
      toast.success('Face image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const validateImages = async () => {
    try {
      setValidating(true);
      await personService.validateFaceImages(personId);
      toast.success('Face images validated successfully');
    } catch (error: any) {
      console.error('Error validating images:', error);
      toast.error(error.response?.data?.detail || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const hasUploaded = uploads.some(u => u.uploaded);
  const hasUploading = uploads.some(u => u.uploading);
  const allUploaded = uploads.length > 0 && uploads.every(u => u.uploaded);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center px-2">
        <h3 className="text-lg font-semibold text-emerald-800">Thêm Ảnh Khuôn Mặt</h3>
        <p className="text-black mt-1 text-sm">
          Tải lên các ảnh rõ nét của <b className="text-black">{personName}</b>. <span className="text-emerald-600 font-semibold">Cần tối thiểu 8 ảnh</span> để hệ thống nhận diện chính xác hơn.
        </p>
      </div>

      {/* Upload Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-emerald-800">Chọn Phương Thức Tải Ảnh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* File Upload Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                uploadMethod === 'files' 
                  ? 'ring-2 ring-cyan-500 border-cyan-500' 
                  : 'hover:border-cyan-300'
              }`}
              onClick={() => setUploadMethod('files')}
            >
              <CardContent className="p-3 text-center">
                <FileImage className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-cyan-600" />
                <h3 className="font-medium text-sm text-cyan-800">Tải Ảnh Từ Máy Tính</h3>
                <p className="text-xs sm:text-sm text-black mt-1">
                  Chọn ảnh từ thiết bị của bạn
                </p>
              </CardContent>
            </Card>

            {/* Camera Capture Option */}
            <Card 
              className={`cursor-pointer transition-all ${
                uploadMethod === 'camera' 
                  ? 'ring-2 ring-emerald-500 border-emerald-500' 
                  : 'hover:border-emerald-300'
              } ${
                loadingCameras || cameras.length === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={() => {
                if (!loadingCameras && cameras.length > 0) {
                  setUploadMethod('camera');
                }
              }}
            >
              <CardContent className="p-3 text-center">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-emerald-600" />
                <h3 className="font-medium text-sm text-emerald-800">Chụp Ảnh Từ Camera</h3>
                <p className="text-xs sm:text-sm text-black mt-1">
                  {loadingCameras 
                    ? 'Đang tải danh sách camera...' 
                    : cameras.length === 0 
                      ? 'Không tìm thấy camera khả dụng'
                      : 'Chụp ảnh trực tiếp từ camera thiết bị'
                  }
                </p>
                {cameras.length > 0 && (
                  <Badge variant="outline" className="mt-1 text-xs border-emerald-300 text-black">
                    {cameras.length} camera khả dụng
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Camera Capture Interface */}
      {uploadMethod === 'camera' && cameras.length > 0 && (
        <CameraCapture
          personId={personId}
          personName={personName}
          cameras={cameras}
          onComplete={onComplete}
          onCancel={() => setUploadMethod('files')}
          minImages={1}
          maxImages={maxImages}
        />
      )}

      {/* File Upload Interface */}
      {uploadMethod === 'files' && (
        <>
          {/* Guidelines */}
          <Alert className="border-emerald-200 bg-emerald-50">
            <FileImage className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-black">
              <strong>Hướng dẫn chọn ảnh:</strong>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm text-black">
                <li>• <strong>Cần tối thiểu 8 ảnh khuôn mặt</strong> để hệ thống nhận diện chính xác</li>
                <li>• Ảnh rõ nét, đủ sáng, khuôn mặt nhìn rõ</li>
                <li>• Nên có nhiều góc mặt, biểu cảm khác nhau để tăng độ chính xác</li>
                <li>• Tránh đeo kính râm, khẩu trang hoặc bóng tối che mặt</li>
                <li>• Định dạng hỗ trợ: JPEG, PNG, GIF, BMP, WebP (tối đa 10MB/ảnh)</li>
              </ul>
            </AlertDescription>
          </Alert>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <Card className="border-teal-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-emerald-800">
              Ảnh Đã Có ({existingImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {existingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.image_url}
                    alt={`${personName} ${index + 1}`}
                    className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-lg border border-teal-200"
                  />
                  {image.is_primary && (
                    <Badge className="absolute top-0.5 left-0.5 text-xs bg-emerald-600 px-1 py-0">
                      Ảnh Chính
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-0.5 right-0.5 h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingImage(index)}
                  >
                    <X className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="border-teal-200 shadow-sm">
        <CardContent className="pt-4 sm:pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-teal-200 hover:border-teal-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <FileImage className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400 mx-auto mb-2 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium text-black mb-1 sm:mb-2">
              {isDragActive ? 'Kéo thả ảnh vào đây' : 'Tải Ảnh Khuôn Mặt'}
            </p>
            <p className="text-sm text-black mb-2 sm:mb-4">
              Kéo thả hoặc bấm để chọn ảnh từ thiết bị
            </p>
            <Button variant="outline" className="text-sm border-teal-200 text-black hover:bg-teal-50">
              <Plus className="h-4 w-4 mr-2" />
              Chọn Ảnh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <Card className="border-teal-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle className="text-sm text-emerald-800">
                Hàng Chờ Tải Lên ({uploads.length})
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={uploadAllImages}
                  disabled={hasUploading || allUploaded}
                  className="text-xs border-teal-200 text-black hover:bg-teal-50"
                >
                  {hasUploading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : allUploaded ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Đã tải hết
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Tải Lên Tất Cả
                    </>
                  )}
                </Button>
              </div>
            </div>
            {hasUploading && (
              <div className="mt-2">
                <Progress value={totalProgress} className="h-2 bg-emerald-100" />
                <p className="text-xs text-black mt-1">
                  Tiến độ tổng: {Math.round(totalProgress)}%
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 sm:p-3 border rounded-lg border-teal-100 bg-white">
                  <img
                    src={upload.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate text-black">{upload.file.name}</p>
                    <p className="text-xs text-black">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {upload.uploading && (
                      <div className="mt-2">
                        <Progress value={upload.progress} className="h-1 bg-emerald-100" />
                        <p className="text-xs text-black mt-1">
                          {upload.progress}% đã tải lên
                        </p>
                      </div>
                    )}
                    {upload.error && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {upload.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {upload.uploaded ? (
                      <Badge variant="default" className="bg-emerald-600 text-xs text-white">
                        <Check className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        Đã tải lên
                      </Badge>
                    ) : upload.uploading ? (
                      <Badge variant="secondary" className="text-xs text-black">
                        <RefreshCw className="h-2 w-2 sm:h-3 sm:w-3 mr-1 animate-spin" />
                        Đang tải lên
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => uploadImage(index)}
                        disabled={upload.uploading}
                        className="text-xs text-black"
                      >
                        <Upload className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        Tải Lên
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(index)}
                      disabled={upload.uploading}
                      className="p-1 text-black"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {uploadMethod === 'files' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {(existingImages.length > 0 || hasUploaded) && (
              <Button
                variant="outline"
                onClick={validateImages}
                disabled={validating}
                size="sm"
                className="text-xs border-teal-200 text-black hover:bg-teal-50"
              >
                {validating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Kiểm Tra Ảnh
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            {(hasUploaded || existingImages.length > 0) && (
              <Button onClick={onComplete} size="sm" className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <Check className="h-3 w-3 mr-1" />
                Hoàn Thành
              </Button>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default FaceImageUpload;