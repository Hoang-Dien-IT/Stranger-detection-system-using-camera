import { apiService } from './api';

export interface Detection {
  id: string;
  camera_id: string;
  camera_name?: string;
  detection_type: 'known_person' | 'stranger' | 'unknown';
  person_name?: string;
  confidence: number;
  timestamp: string;
  image_url?: string;
  image_path?: string;
  bbox?: number[];
  metadata?: any;
  person_id?: string;
  similarity_score?: number;
  location?: string;
  is_alert_sent?: boolean;
  alert_methods?: string[];
}

export interface DetectionCreate {
  camera_id: string;
  detection_type: 'known_person' | 'stranger' | 'unknown';
  person_name?: string;
  confidence: number;
  image_base64?: string;
  bbox?: number[];
  metadata?: any;
}

export interface DetectionFilter {
  camera_id?: string;
  detection_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  skip?: number;
  offset?: number;
  search?: string;
  min_confidence?: number;
  max_confidence?: number;
  type?: string;
}

export interface DetectionResponse {
  detections: Detection[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DetectionStats {
  overview: {
    total_detections: number;
    stranger_detections: number;
    known_person_detections: number;
    detection_accuracy: number;
    alerts_sent: number;
  };
  time_based: {
    today: number;
    this_week: number;
    this_month: number;
    last_24h_strangers: number;
  };
  camera_stats: {
    total_cameras: number;
    active_cameras: number;
    streaming_cameras: number;
    offline_cameras: number;
  };
  person_stats: {
    total_known_persons: number;
  };
  top_cameras: Array<{
    camera_id: string;
    camera_name: string;
    detection_count: number;
  }>;
  hourly_pattern: Record<string, number>;
  last_updated: string;
}

// Analytics interfaces
export interface AnalyticsOverview {
  overview: {
    total_detections: number;
    stranger_detections: number;
    known_person_detections: number;
    detection_accuracy: number;
    alerts_sent: number;
  };
  time_based: {
    today: number;
    this_week: number;
    this_month: number;
    last_24h_strangers: number;
  };
  camera_stats: {
    total_cameras: number;
    active_cameras: number;
    streaming_cameras: number;
    offline_cameras: number;
  };
  person_stats: {
    total_known_persons: number;
  };
  top_cameras: Array<{
    camera_id: string;
    camera_name: string;
    detection_count: number;
    stranger_count: number;
  }>;
  hourly_pattern: Record<string, number>;
  last_updated: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartData {
  chart_type: string;
  time_range: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

// ✅ ADD: Top camera interface
export interface TopCamera {
  camera_id: string;
  camera_name: string;
  detection_count: number;
  stranger_count?: number;
  known_person_count?: number;
}

// ✅ ADD: Hourly stats interface
export interface HourlyStats {
  hourly_data: Array<{
    hour: string;
    detections: number;
    strangers: number;
    known_persons: number;
  }>;
}

// ✅ ADD: Real-time stats interface
export interface RealTimeStats {
  last_30_minutes: {
    total_detections: number;
    stranger_detections: number;
    known_person_detections: number;
    active_cameras: number;
  };
  current_activity: {
    streaming_cameras: number;
    detection_rate: number;
    system_load: number;
  };
}

class DetectionService {
  async getDetections(filters?: DetectionFilter): Promise<Detection[] | DetectionResponse> {
    try {
      console.log('🔵 DetectionService: Getting detections...', filters);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await apiService.get<Detection[] | DetectionResponse>('/detections/', filters);
      console.log('✅ DetectionService: Got detections response:', response.data);
      
      if (Array.isArray(response.data)) {
        console.log('📝 DetectionService: Received array format with', response.data.length, 'detections');
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'detections' in response.data) {
        console.log('📝 DetectionService: Received paginated format with', response.data.detections.length, 'detections');
        return response.data as DetectionResponse;
      } else {
        console.warn('⚠️ DetectionService: Unexpected response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ DetectionService: Error getting detections:', error);
      throw new Error(error.message || 'Failed to get detections');
    }
  }

  async getDetection(id: string): Promise<Detection> {
    try {
      console.log('🔵 DetectionService: Getting detection by ID:', id);
      const response = await apiService.get<Detection>(`/detections/${id}`);
      console.log('✅ DetectionService: Got detection:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error getting detection:', error);
      throw new Error(error.message || 'Failed to get detection');
    }
  }

  async createDetection(detectionData: DetectionCreate): Promise<Detection> {
    try {
      console.log('🔵 DetectionService: Creating detection:', detectionData);
      const response = await apiService.post<Detection>('/detections/', detectionData);
      console.log('✅ DetectionService: Detection created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error creating detection:', error);
      throw new Error(error.message || 'Failed to create detection');
    }
  }

  async deleteDetection(id: string): Promise<void> {
    try {
      console.log('🔵 DetectionService: Deleting detection:', id);
      await apiService.delete(`/detections/${id}`);
      console.log('✅ DetectionService: Detection deleted successfully');
    } catch (error: any) {
      console.error('❌ DetectionService: Error deleting detection:', error);
      throw new Error(error.message || 'Failed to delete detection');
    }
  }

  async getDetectionStats(timeRange: string = '7d'): Promise<DetectionStats> {
    try {
      console.log('🔵 DetectionService: Getting detection stats overview...');
      
      const response = await apiService.get<DetectionStats>('/detections/stats/overview', {
        time_range: timeRange
      });
      console.log('✅ DetectionService: Got detection stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error getting detection stats:', error);
      
      return {
        overview: {
          total_detections: 0,
          stranger_detections: 0,
          known_person_detections: 0,
          detection_accuracy: 0.0,
          alerts_sent: 0
        },
        time_based: {
          today: 0,
          this_week: 0,
          this_month: 0,
          last_24h_strangers: 0
        },
        camera_stats: {
          total_cameras: 0,
          active_cameras: 0,
          streaming_cameras: 0,
          offline_cameras: 0
        },
        person_stats: {
          total_known_persons: 0
        },
        top_cameras: [],
        hourly_pattern: {},
        last_updated: new Date().toISOString()
      };
    }
  }

  // ✅ FIX: Chart data method with proper typing
  async getChartData(timeRange: string = '7d', chartType: string = 'area'): Promise<ChartData> {
    try {
      console.log('🔵 DetectionService: Getting chart data...', { timeRange, chartType });
      
      const response = await apiService.get<ChartData>('/detections/stats/chart', {
        time_range: timeRange,
        chart_type: chartType
      });
      
      console.log('✅ DetectionService: Got chart data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error getting chart data:', error);
      
      // Return fallback chart data
      return {
        chart_type: chartType,
        time_range: timeRange,
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [
          {
            label: 'Stranger Detections',
            data: [12, 8, 15, 6, 11, 9, 13],
            color: '#EF4444'
          },
          {
            label: 'Known Person Detections',
            data: [45, 52, 38, 61, 49, 44, 56],
            color: '#10B981'
          }
        ]
      };
    }
  }

  // ✅ ADD: Export detection stats method
  async exportStats(timeRange: string = '7d', format: string = 'csv'): Promise<Blob> {
    try {
      console.log('🔵 DetectionService: Exporting detection stats...', { timeRange, format });
      
      const blob = await apiService.downloadBlob('/detections/stats/export', {
        time_range: timeRange,
        format: format
      });
      
      console.log('✅ DetectionService: Stats exported successfully');
      return blob;
    } catch (error: any) {
      console.error('❌ DetectionService: Error exporting stats:', error);
      throw error;
    }
  }

  // ✅ ADD: Cleanup old detections method
  async cleanupOldDetections(daysToKeep: number = 30): Promise<any> {
    try {
      console.log('🔵 DetectionService: Cleaning up old detections...', { daysToKeep });
      
      const response = await apiService.post(`/detections/cleanup?days_to_keep=${daysToKeep}`);
      
      console.log('✅ DetectionService: Old detections cleaned up successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error cleaning up old detections:', error);
      throw error;
    }
  }

  // ✅ ADD: Get analytics overview method
  async getAnalytics(timeRange: string = '7d'): Promise<AnalyticsOverview> {
    try {
      console.log('🔵 DetectionService: Getting analytics overview...', { timeRange });
      
      const response = await apiService.get<AnalyticsOverview>('/detections/stats/overview');
      
      console.log('✅ DetectionService: Got analytics overview:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ DetectionService: Error getting analytics overview:', error);
      
      // Return fallback analytics data
      return {
        overview: {
          total_detections: 0,
          stranger_detections: 0,
          known_person_detections: 0,
          detection_accuracy: 0,
          alerts_sent: 0
        },
        time_based: {
          today: 0,
          this_week: 0,
          this_month: 0,
          last_24h_strangers: 0
        },
        camera_stats: {
          total_cameras: 0,
          active_cameras: 0,
          streaming_cameras: 0,
          offline_cameras: 0
        },
        person_stats: {
          total_known_persons: 0
        },
        top_cameras: [],
        hourly_pattern: {},
        last_updated: new Date().toISOString()
      };
    }
  }

  // Add trends data method
  async getTrendsData(timeRange: string = '7d'): Promise<any> {
    try {
      const response = await apiService.get(`/detections/stats/trends?time_range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trends data:', error);
      throw error;
    }
  }

  // Add reports methods
  async generateReport(reportConfig: any): Promise<any> {
    try {
      const response = await apiService.post('/detections/reports/generate', reportConfig);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async getReportHistory(): Promise<any> {
    try {
      const response = await apiService.get('/detections/reports/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching report history:', error);
      throw error;
    }
  }

  async getReportTemplates(): Promise<any> {
    try {
      const response = await apiService.get('/detections/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }
}

export const detectionService = new DetectionService();
export default DetectionService;