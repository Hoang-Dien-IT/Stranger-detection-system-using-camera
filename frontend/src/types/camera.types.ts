export interface Camera {
  id: string;
  name: string;
  description?: string;
  location?: string;
  // ✅ FIX: Align camera_type with all possible values used in your app
  camera_type: 'webcam' | 'ip_camera' | 'rtsp' | 'usb' | 'usb_camera';
  camera_url?: string;
  is_active: boolean;
  is_streaming: boolean;
  is_recording: boolean;
  detection_enabled: boolean;
  timezone?: string;
  stream_settings: {
    resolution?: string;
    fps?: number;
    quality?: string;
  };
  alert_settings: {
    email_alerts?: boolean;
    webhook_url?: string;
  };
  created_at: string;
  updated_at?: string;
  last_online?: string;
  tags?: string[];
}

export interface CameraCreate {
  name: string;
  description?: string;
  location?: string;
  // ✅ FIX: Same camera_type alignment
  camera_type: 'webcam' | 'ip_camera' | 'rtsp' | 'usb' | 'usb_camera';
  camera_url?: string;
  detection_enabled?: boolean;
  is_streaming?: boolean;
  tags?: string[];
  stream_settings?: {
    resolution?: string;
    fps?: number;
    quality?: string;
  };
  alert_settings?: {
    email_alerts?: boolean;
    webhook_url?: string;
  };
}

export interface CameraUpdate {
  name?: string;
  description?: string;
  location?: string;
  camera_url?: string;
  is_active?: boolean;
  is_streaming?: boolean;
  detection_enabled?: boolean;
  tags?: string[];
  stream_settings?: {
    resolution?: string;
    fps?: number;
    quality?: string;
  };
  alert_settings?: {
    email_alerts?: boolean;
    webhook_url?: string;
  };
}

export interface StreamInfo {
  camera_id: string;
  camera_name: string;
  camera_type: string;
  is_streaming: boolean;
  status: string;
  uptime: number;
  viewers_count: number;
  stream_url: string;
}

export interface CameraState {
  cameras: Camera[];
  activeStreams: StreamInfo[];
  selectedCamera: Camera | null;
  isLoading: boolean;
  error: string | null;
}

export interface CameraSettingsData {
  stream_settings?: {
    resolution?: string;
    fps?: number;
    bitrate?: number;
    quality?: 'auto' | 'high' | 'medium' | 'low';
    codec?: 'h264' | 'h265' | 'mjpeg';
    audio_enabled?: boolean;
    audio_bitrate?: number;
  };
  detection_settings?: {
    enabled?: boolean;
    confidence_threshold?: number;
    detection_frequency?: number;
    save_unknown_faces?: boolean;
    blur_unknown_faces?: boolean;
  };
  notification_settings?: {
    email_notifications?: boolean;
    webhook_url?: string;
    notification_cooldown?: number;
    notify_unknown_faces?: boolean;
    notify_known_faces?: boolean;
    notify_system_events?: boolean;
  };
  recording_settings?: {
    enabled?: boolean;
    record_on_detection?: boolean;
    record_duration?: number;
    max_storage_days?: number;
    compression_level?: number;
    record_audio?: boolean;
  };
}

export interface SystemInfo {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  uptime: number;
  network_speed: {
    upload: number;
    download: number;
  };
  firmware_version: string;
  last_maintenance: string;
}

export interface CameraTestResult {
  camera_id: string;
  is_connected: boolean;
  message: string;
  camera_type: string;
  camera_url?: string;
  status?: 'success' | 'error' | 'warning';
  connection_type?: string;
  error_details?: string;
  stream_info?: {
    resolution?: string;
    fps?: number;
    codec?: string;
    bitrate?: string;
  };
}

// ✅ Add CameraStats interface to types file
export interface CameraStats {
  total_cameras: number;
  active_cameras: number;
  streaming_cameras: number;
  offline_cameras: number;
}

export interface CameraMetadata {
  locations: string[];
  tags: string[];
  total_cameras: number;
}