import { apiService } from './api';
import { 
  Camera, 
  CameraCreate, 
  CameraUpdate, 
  CameraStats,
  CameraMetadata,
  CameraTestResult 
} from '@/types/camera.types';
import { AUTH_CONFIG } from '@/lib/config';

class CameraService {

  async getCameras(): Promise<Camera[]> {
    try {
      console.log('🔵 CameraService: Getting cameras...');
      
      // ✅ Use correct endpoint from #backend/app/routers/camera.py
      const response = await apiService.get<Camera[]>('/cameras/');
      
      console.log('✅ CameraService: Raw camera response:', response.data);
      
      // ✅ Validate response format
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('⚠️ CameraService: Invalid cameras response format');
        return [];
      }
      
      // ✅ Transform and validate each camera
      const cameras = response.data.map(camera => ({
        id: camera.id,
        name: camera.name || 'Unknown Camera',
        camera_type: camera.camera_type || 'webcam',
        description: camera.description || '',
        location: camera.location || '',
        is_active: camera.is_active !== false, // Default to true
        is_streaming: camera.is_streaming || false,
        detection_enabled: camera.detection_enabled || false,
        is_recording: camera.is_recording || false,
        created_at: camera.created_at || new Date().toISOString(),
        updated_at: camera.updated_at,
        camera_url: camera.camera_url || '',
        stream_settings: camera.stream_settings || {
          resolution: '1920x1080',
          fps: 30,
          quality: 'high'
        },
        alert_settings: camera.alert_settings || {
          enabled: false,
          sensitivity: 'medium',
          zones: []
        }
      }));
      
      console.log('✅ CameraService: Processed cameras:', cameras.length);
      return cameras;
      
    } catch (error: any) {
      console.error('❌ CameraService: Error getting cameras:', error);
      
      // ✅ Enhanced error handling
      if (error.response?.status === 404) {
        console.log('ℹ️ CameraService: No cameras found');
        return [];
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to load cameras');
    }
  }


  async getCamera(id: string): Promise<Camera> {
    try {
      console.log('🔵 CameraService: Getting camera by ID:', id);
      const response = await apiService.get<Camera>(`/cameras/${id}`);
      console.log('✅ CameraService: Got camera:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting camera:', error);
      throw new Error(error.message || 'Failed to get camera');
    }
  }

  async createCamera(cameraData: CameraCreate): Promise<Camera> {
    try {
      console.log('🔵 CameraService: Creating camera:', cameraData);
      
      const validCameraTypes: Camera['camera_type'][] = ['webcam', 'ip_camera', 'rtsp', 'usb', 'usb_camera'];
      if (!validCameraTypes.includes(cameraData.camera_type)) {
        throw new Error(`Invalid camera type: ${cameraData.camera_type}`);
      }

      const response = await apiService.post<Camera>('/cameras/', cameraData);
      console.log('✅ CameraService: Camera created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error creating camera:', error);
      throw new Error(error.message || 'Failed to create camera');
    }
  }

  async updateCamera(id: string, cameraData: CameraUpdate): Promise<Camera> {
    try {
      console.log('🔵 CameraService: Updating camera:', id, cameraData);
      const response = await apiService.put<Camera>(`/cameras/${id}`, cameraData);
      console.log('✅ CameraService: Camera updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error updating camera:', error);
      throw new Error(error.message || 'Failed to update camera');
    }
  }

  async deleteCamera(id: string): Promise<void> {
    try {
      console.log('🔵 CameraService: Deleting camera:', id);
      await apiService.delete(`/cameras/${id}`);
      console.log('✅ CameraService: Camera deleted successfully');
    } catch (error: any) {
      console.error('❌ CameraService: Error deleting camera:', error);
      throw new Error(error.message || 'Failed to delete camera');
    }
  }

  // async testCamera(id: string): Promise<CameraTestResult> {
  //   try {
  //     console.log('🔵 CameraService: Testing camera connection:', id);
  //     const response = await apiService.post<any>(`/cameras/${id}/test`);
  //     console.log('✅ CameraService: Camera test response:', response.data);
      
  //     const result: CameraTestResult = {
  //       camera_id: response.data.camera_id || id,
  //       is_connected: response.data.is_connected || false,
  //       message: response.data.message || 'Test completed',
  //       camera_type: response.data.camera_type || 'unknown',
  //       camera_url: response.data.camera_url,
  //       status: response.data.is_connected 
  //         ? 'success' 
  //         : response.data.message?.includes('warning') 
  //           ? 'warning' 
  //           : 'error',
  //       connection_type: response.data.connection_type,
  //       error_details: response.data.error_details
  //     };
      
  //     return result;
  //   } catch (error: any) {
  //     console.error('❌ CameraService: Error testing camera:', error);
      
  //     return {
  //       camera_id: id,
  //       is_connected: false,
  //       message: error.message || 'Connection test failed',
  //       camera_type: 'unknown',
  //       status: 'error',
  //       error_details: error.response?.data?.detail || error.message
  //     };
  //   }
  // }
  
  async testCameraBeforeCreate(cameraData: {
    camera_type: string;
    camera_url?: string;
  }): Promise<{
    is_connected: boolean;
    message: string;
    camera_type: string;
    camera_url?: string;
    status?: string;
    connection_type?: string;
  }> {
    try {
      console.log('🔵 CameraService: Testing camera before create:', cameraData);
      
      // ✅ Call the new endpoint without camera_id
      const response = await apiService.post<any>('/cameras/test', cameraData);
      console.log('✅ CameraService: Camera test result:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error testing camera before create:', error);
      
      // Enhanced error handling
      let errorMessage = 'Connection test failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        is_connected: false,
        message: errorMessage,
        camera_type: cameraData.camera_type,
        camera_url: cameraData.camera_url,
        status: 'error'
      };
    }
  }

  
  
  async testCamera(cameraId: string): Promise<{
    camera_id: string;
    is_connected: boolean;
    message: string;
    camera_type: string;
    camera_url?: string;
    status?: string;
    connection_type?: string;
  }> {
    try {
      console.log('🔵 CameraService: Testing camera connection:', cameraId);
      
      // ✅ Include camera_id in URL path
      const response = await apiService.post<any>(`/cameras/${cameraId}/test`);
      console.log('✅ CameraService: Camera test result:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error testing camera:', error);
      
      let errorMessage = 'Connection test failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        camera_id: cameraId,
        is_connected: false,
        message: errorMessage,
        camera_type: 'unknown',
        status: 'error'
      };
    }
  }


  async testAllCameras(): Promise<Array<{
    camera_id: string;
    is_connected: boolean;
    message: string;
    camera_type: string;
  }>> {
    try {
      console.log('🔵 CameraService: Testing all cameras...');
      
      // Get all cameras first
      const cameras = await this.getCameras();
      
      // Test each camera individually
      const results = await Promise.all(
        cameras.map(camera => this.testCamera(camera.id))
      );
      
      console.log('✅ CameraService: All cameras tested:', results);
      return results;
    } catch (error: any) {
      console.error('❌ CameraService: Error testing all cameras:', error);
      throw error;
    }
  }
  
  async testCameraConnection(data: Partial<CameraCreate>): Promise<CameraTestResult> {
    try {
      console.log('🔍 Testing camera connection with data:', data);
      const response = await apiService.post<any>('/cameras/test', data);
      
      return {
        camera_id: response.data.camera_id || 'test',
        is_connected: response.data.is_connected || false,
        message: response.data.message || 'Test completed',
        camera_type: response.data.camera_type || data.camera_type || 'unknown',
        camera_url: response.data.camera_url || data.camera_url,
        status: response.data.is_connected ? 'success' : 'error',
        connection_type: response.data.connection_type
      };
    } catch (error: any) {
      console.error('❌ Camera test failed:', error);
      
      return {
        camera_id: 'test',
        is_connected: false,
        message: error.response?.data?.detail || error.message || 'Connection test failed',
        camera_type: data.camera_type || 'unknown',
        status: 'error',
        error_details: error.response?.data?.error_details
      };
    }
  }

  async getCameraStats(): Promise<CameraStats> {
    try {
      console.log('🔵 CameraService: Getting camera stats...');
      const response = await apiService.get<CameraStats>('/cameras/stats');
      console.log('✅ CameraService: Got camera stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting camera stats:', error);
      throw new Error(error.message || 'Failed to get camera stats');
    }
  }

  async getCameraMetadata(): Promise<CameraMetadata> {
    try {
      console.log('🔵 CameraService: Getting camera metadata...');
      const response = await apiService.get<CameraMetadata>('/cameras/metadata');
      console.log('✅ CameraService: Got camera metadata:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting camera metadata:', error);
      throw new Error(error.message || 'Failed to get camera metadata');
    }
  }

  // ✅ Streaming controls
  async startStreaming(id: string): Promise<any> {
    try {
      console.log('🔵 CameraService: Starting streaming for camera:', id);
      const response = await apiService.post(`/stream/${id}/start`);
      console.log('✅ CameraService: Streaming started:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error starting streaming:', error);
      throw new Error(error.message || 'Failed to start streaming');
    }
  }

  async stopStreaming(id: string): Promise<any> {
    try {
      console.log('🔵 CameraService: Stopping streaming for camera:', id);
      const response = await apiService.post(`/stream/${id}/stop`);
      console.log('✅ CameraService: Streaming stopped:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error stopping streaming:', error);
      throw new Error(error.message || 'Failed to stop streaming');
    }
  }

  async getStreamStatus(id: string): Promise<any> {
    try {
      console.log('🔵 CameraService: Getting stream status for camera:', id);
      const response = await apiService.get(`/stream/${id}/status`);
      console.log('✅ CameraService: Got stream status:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting stream status:', error);
      
      // ✅ Return fallback data instead of throwing error
      console.log('⚠️ CameraService: Using fallback stream status data');
      return {
        is_streaming: false,
        is_recording: false,
        viewers_count: 0,
        uptime: 0,
        frame_rate: 0,
        resolution: '640x480',
        bitrate: 0,
        bandwidth: '0 Mbps',
        latency: 0,
        quality_score: 0,
        packets_lost: 0,
        buffer_health: 0
      };
    }
  }

  // ✅ Detection controls
  async startDetection(id: string): Promise<any> {
    try {
      console.log('🔵 CameraService: Starting detection for camera:', id);
      const response = await apiService.post(`/cameras/${id}/start-detection`);
      console.log('✅ CameraService: Detection started:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error starting detection:', error);
      throw new Error(error.message || 'Failed to start detection');
    }
  }

  async stopDetection(id: string): Promise<any> {
    try {
      console.log('🔵 CameraService: Stopping detection for camera:', id);
      const response = await apiService.post(`/cameras/${id}/stop-detection`);
      console.log('✅ CameraService: Detection stopped:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error stopping detection:', error);
      throw new Error(error.message || 'Failed to stop detection');
    }
  }

  // ✅ Camera settings
  async getCameraSettings(id: string): Promise<any> {
    try {
      const response = await apiService.get(`/cameras/${id}/settings`);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting camera settings:', error);
      throw new Error(error.message || 'Failed to get camera settings');
    }
  }

  async updateCameraSettings(id: string, settings: any): Promise<any> {
    try {
      const response = await apiService.put(`/cameras/${id}/settings`, settings);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error updating camera settings:', error);
      throw new Error(error.message || 'Failed to update camera settings');
    }
  }

  // ✅ Additional utility methods
  async exportCameras(): Promise<any> {
    try {
      const response = await apiService.get('/cameras/export');
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error exporting cameras:', error);
      throw new Error(error.message || 'Failed to export cameras');
    }
  }

  async bulkUpdateCameras(cameraIds: string[], updateData: CameraUpdate): Promise<any> {
    try {
      const response = await apiService.post('/cameras/bulk-update', {
        camera_ids: cameraIds,
        update_data: updateData
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error bulk updating cameras:', error);
      throw new Error(error.message || 'Failed to bulk update cameras');
    }
  }

  async getUserCameras(): Promise<Camera[]> {
    try {
      const response = await apiService.get<Camera[]>('/cameras/user');
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting user cameras:', error);
      throw new Error(error.message || 'Failed to get user cameras');
    }
  }

  async takeSnapshot(id: string): Promise<any> {
    try {
      const response = await apiService.get(`/cameras/${id}/snapshot`);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error taking snapshot:', error);
      throw new Error(error.message || 'Failed to take snapshot');
    }
  }

  // ✅ Add system info method
  async getSystemInfo(id: string): Promise<any> {
    try {
      const response = await apiService.get(`/cameras/${id}/system-info`);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting system info:', error);
      throw new Error(error.message || 'Failed to get system info');
    }
  }

  // ✅ Add test connection method
  async testConnection(id: string): Promise<any> {
    try {
      const response = await apiService.post(`/cameras/${id}/test-connection`);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error testing connection:', error);
      throw new Error(error.message || 'Failed to test connection');
    }
  }

  // ✅ New methods for face capture functionality
  async getCameraStreamUrl(id: string): Promise<string> {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      // Use the API base URL directly since it already includes /api
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      return `${baseUrl}/cameras/${id}/capture-stream${token ? `?token=${token}` : ''}`;
    } catch (error: any) {
      console.error('❌ CameraService: Error getting camera stream URL:', error);
      throw new Error(error.message || 'Failed to get camera stream URL');
    }
  }

  async captureFrame(id: string): Promise<{ success: boolean; image_data: string; timestamp: string }> {
    try {
      console.log('🔵 CameraService: Capturing frame from camera:', id);
      // Use shorter timeout for camera capture to avoid long waits
      const response = await apiService.post<{ success: boolean; image_data: string; timestamp: string }>(
        `/cameras/${id}/capture-frame`, 
        {}, 
        { timeout: 5000 } // 5 second timeout instead of 30
      );
      console.log('✅ CameraService: Frame captured successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error capturing frame:', error);
      throw new Error(error.message || 'Failed to capture frame');
    }
  }

  async testCameraStream(id: string): Promise<{ success: boolean; message: string; camera_id: string; camera_name: string; timestamp?: string }> {
    try {
      console.log('🔵 CameraService: Testing camera stream:', id);
      const response = await apiService.get<{ success: boolean; message: string; camera_id: string; camera_name: string; timestamp?: string }>(`/cameras/${id}/test-stream`);
      console.log('✅ CameraService: Stream test completed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error testing camera stream:', error);
      throw new Error(error.message || 'Failed to test camera stream');
    }
  }

  async cleanupCameraCache(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔵 CameraService: Cleaning camera cache:', id);
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/cameras/${id}/cleanup-cache`, 
        {}, 
        { timeout: 3000 }
      );
      console.log('✅ CameraService: Camera cache cleaned successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ CameraService: Error cleaning camera cache:', error);
      throw new Error(error.message || 'Failed to clean camera cache');
    }
  }
}

export const cameraService = new CameraService();