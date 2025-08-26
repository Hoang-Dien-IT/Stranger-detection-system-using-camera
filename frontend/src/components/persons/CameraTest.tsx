import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cameraService } from '@/services/camera.service';
import { Camera as CameraType } from '@/types/camera.types';
import { toast } from 'sonner';

interface CameraTestProps {
  cameras: CameraType[];
}

export const CameraTest: React.FC<CameraTestProps> = ({ cameras }) => {
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const testCamera = async (camera: CameraType) => {
    console.log('🧪 Testing camera:', camera.name, camera.id);
    setIsLoading(true);
    setSelectedCamera(camera);
    
    try {
      // Test single frame capture
      const result = await cameraService.captureFrame(camera.id);
      console.log('✅ Frame captured:', result);
      
      if (result.image_data) {
        const imageUrl = `data:image/jpeg;base64,${result.image_data}`;
        console.log('✅ Image URL created:', imageUrl.substring(0, 50) + '...');
        
        setCurrentFrame(imageUrl);
        toast.success('Camera test successful!');
      } else {
        throw new Error('No image data received');
      }
      
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      toast.error('Camera test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-cyan-200 bg-cyan-50">
      <CardHeader>
        <CardTitle className="text-cyan-800">Kiểm tra camera</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Camera Selection */}
          <div>
            <h3 className="font-medium mb-2 text-cyan-800">Chọn camera để kiểm tra:</h3>
            <div className="grid gap-2">
              {cameras.map((camera) => (
                <Button
                  key={camera.id}
                  onClick={() => testCamera(camera)}
                  disabled={isLoading}
                  variant={selectedCamera?.id === camera.id ? "default" : "outline"}
                  className={`justify-start ${selectedCamera?.id === camera.id ? 'bg-emerald-600 text-white' : 'border-cyan-400 text-black hover:bg-cyan-100'}`}
                >
                  {camera.name} ({camera.camera_type})
                  {isLoading && selectedCamera?.id === camera.id && " - Đang kiểm tra..."}
                </Button>
              ))}
            </div>
          </div>

          {/* Image Display */}
          {currentFrame && (
            <div>
              <h3 className="font-medium mb-2 text-cyan-800">Khung hình đã chụp:</h3>
              <div className="border border-cyan-200 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={currentFrame}
                  alt="Ảnh từ camera"
                  className="w-full h-auto"
                  onLoad={() => console.log('✅ Image loaded successfully')}
                  onError={(e) => console.error('❌ Image load error:', e)}
                />
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="text-sm text-black">
            <p>Camera đã chọn: {selectedCamera?.name || 'Chưa chọn'}</p>
            <p>Đã có khung hình: {currentFrame ? 'Có' : 'Chưa'}</p>
            <p>Độ dài dữ liệu ảnh: {currentFrame.length} ký tự</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
