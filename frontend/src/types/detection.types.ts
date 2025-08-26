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
  // ✅ ADD: Additional fields from your DetectionsPage
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
  offset?: number;
  search?: string;
  min_confidence?: number;
  max_confidence?: number;
}

// ✅ ADD: Paginated response interface
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