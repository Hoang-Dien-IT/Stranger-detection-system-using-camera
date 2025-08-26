import { apiService } from './api';

// ✅ Interface cho User Settings - match với backend UserSettings
export interface UserSettings {
  email_notifications: boolean;
  web_notifications: boolean;
  detection_sensitivity: number;
  auto_delete_logs: boolean;
  log_retention_days: number;
  stream_quality: 'low' | 'medium' | 'high' | 'auto';
  max_cameras: number;
  timezone: string;
  language: string;
  // ✅ Face Recognition specific settings
  face_recognition_enabled?: boolean;
  confidence_threshold?: number;
  stranger_alert_cooldown?: number;
  webhook_url?: string;
  email_alerts?: boolean;
  push_notifications?: boolean;
  alert_sound?: boolean;
  dark_mode?: boolean;
  auto_backup?: boolean;
  backup_frequency?: 'daily' | 'weekly' | 'monthly';
}

// ✅ Interface cho Camera Settings - match với backend CameraSettingsData
export interface CameraSettings {
  camera_id: string;
  stream_settings: {
    resolution: string;
    fps: number;
    bitrate: number;
    quality: string;
    codec: string;
    audio_enabled: boolean;
    audio_bitrate: number;
  };
  detection_settings: {
    enabled: boolean;
    confidence_threshold: number;
    detection_frequency: number;
    save_unknown_faces: boolean;
    blur_unknown_faces: boolean;
    detection_zones: Array<{
      name: string;
      coordinates: number[];
      enabled: boolean;
    }>;
    excluded_zones: Array<{
      name: string;
      coordinates: number[];
    }>;
  };
  notification_settings: {
    email_notifications: boolean;
    webhook_url: string;
    notification_cooldown: number;
    notify_unknown_faces: boolean;
    notify_known_faces: boolean;
    notify_system_events: boolean;
  };
  recording_settings: {
    enabled: boolean;
    record_on_detection: boolean;
    record_duration: number;
    max_storage_days: number;
    compression_level: number;
    record_audio: boolean;
  };
}

// ✅ Interface cho System Settings
export interface SystemSettings {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature?: number;
  uptime: number;
  network_speed: {
    upload: number;
    download: number;
  };
  firmware_version: string;
  last_maintenance?: string;
}

// ✅ Interface cho Notification Settings
export interface NotificationSettingsData {
  global_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  detection_alerts: boolean;
  system_alerts: boolean;
  security_alerts: boolean;
  weekly_reports: boolean;
  immediate_alerts: boolean;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  alert_threshold: number;
  channels: NotificationChannel[];
  rules: NotificationRule[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'push' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationRule {
  id: string;
  event_type: string;
  channels: string[];
  conditions: Record<string, any>;
  enabled: boolean;
  schedule?: {
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    days_of_week?: number[];
  };
}

// ✅ Settings Service Class
class SettingsService {
  private readonly baseUrl = '/settings';
  private readonly cameraUrl = '/cameras';

  // ===== USER SETTINGS =====

  /**
   * Get user settings - theo backend endpoint
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      console.log('🔵 SettingsService: Getting user settings...');
      const response = await apiService.get<UserSettings>(this.baseUrl);
      console.log('✅ SettingsService: Got user settings');
      return response.data;
    } catch (error: any) {
      console.error('❌ SettingsService: Error fetching user settings:', error);
      // Return default settings on error
      return this.getDefaultSettings();
    }
  }

  /**
   * Update user settings - theo backend endpoint
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      console.log('🔵 SettingsService: Updating user settings...', settings);
      const response = await apiService.put<UserSettings>(this.baseUrl, settings);
      console.log('✅ SettingsService: Settings updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating user settings:', error);
      throw new Error(error.message || 'Failed to update settings');
    }
  }

  /**
   * Reset user settings to default - theo backend endpoint
   */
  async resetUserSettings(): Promise<UserSettings> {
    try {
      console.log('🔵 SettingsService: Resetting user settings...');
      const response = await apiService.post<UserSettings>(`${this.baseUrl}/reset`);
      console.log('✅ SettingsService: Settings reset to default');
      return response.data;
    } catch (error: any) {
      console.error('❌ SettingsService: Error resetting user settings:', error);
      throw new Error(error.message || 'Failed to reset settings');
    }
  }

  // ===== CAMERA SETTINGS =====

  /**
   * Get camera settings by ID - theo backend endpoint
   */
  async getCameraSettings(cameraId: string): Promise<CameraSettings> {
    try {
      console.log('🔵 SettingsService: Getting camera settings for:', cameraId);
      const response = await apiService.get<CameraSettings>(`${this.cameraUrl}/${cameraId}/settings`);
      console.log('✅ SettingsService: Got camera settings');
      return response.data;
    } catch (error: any) {
      console.error('❌ SettingsService: Error fetching camera settings:', error);
      throw new Error(error.message || 'Failed to load camera settings');
    }
  }

  /**
   * Update camera settings - theo backend endpoint
   */
  async updateCameraSettings(
    cameraId: string, 
    settings: Partial<CameraSettings>
  ): Promise<CameraSettings> {
    try {
      console.log('🔵 SettingsService: Updating camera settings for:', cameraId, settings);
      const response = await apiService.put<CameraSettings>(
        `${this.cameraUrl}/${cameraId}/settings`,
        settings
      );
      console.log('✅ SettingsService: Camera settings updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating camera settings:', error);
      throw new Error(error.message || 'Failed to update camera settings');
    }
  }

  /**
   * Get camera system info - theo backend endpoint (Camera.get_system_info)
   */
  async getCameraSystemInfo(cameraId: string): Promise<SystemSettings> {
    try {
      console.log('🔵 SettingsService: Getting camera system info for:', cameraId);
      
      // ✅ CRITICAL: Sử dụng endpoint thực tế từ backend
      // Backend có: camera_service.get_system_info(camera_id)
      // Nhưng chưa có router cho endpoint này
      
      // Tạm thời return mock data cho đến khi backend implement endpoint
      console.warn('⚠️ SettingsService: Camera system info endpoint not implemented in backend yet');
      
      return {
        cpu_usage: 45.2,
        memory_usage: 68.5,
        disk_usage: 72.1,
        temperature: 42.5,
        uptime: 86400,
        network_speed: {
          upload: 10.5,
          download: 25.3
        },
        firmware_version: 'v1.2.3',
        last_maintenance: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('❌ SettingsService: Error fetching camera system info:', error);
      throw new Error(error.message || 'Failed to load camera system info');
    }
  }

  /**
   * Test camera connection - theo backend endpoint
   */
  async testCameraConnection(cameraId: string): Promise<{
    status: 'success' | 'error' | 'warning';
    message: string;
    connection_type: string;
    url?: string;
    is_connected?: boolean; // ✅ ADD: Backend actually returns this
  }> {
    try {
      console.log('🔵 SettingsService: Testing camera connection for:', cameraId);
      const response = await apiService.post<{
        camera_id: string;
        is_connected: boolean;
        message: string;
        camera_type: string;
        camera_url?: string;
      }>(`/cameras/${cameraId}/test`);
      
      console.log('✅ SettingsService: Camera test completed:', response.data);
      
      // ✅ Transform response to match expected interface
      return {
        status: response.data.is_connected ? 'success' : 'error',
        message: response.data.message,
        connection_type: response.data.camera_type,
        url: response.data.camera_url,
        is_connected: response.data.is_connected
      };
    } catch (error: any) {
      console.error('❌ SettingsService: Error testing camera connection:', error);
      
      return {
        status: 'error',
        message: error.response?.data?.detail || error.message || 'Failed to test camera connection',
        connection_type: 'unknown',
        is_connected: false
      };
    }
  }

  // ===== FACE RECOGNITION SETTINGS =====

  /**
   * Update face recognition sensitivity
   */
  async updateDetectionSensitivity(sensitivity: number): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating detection sensitivity to:', sensitivity);
      await this.updateUserSettings({ detection_sensitivity: sensitivity });
      console.log('✅ SettingsService: Detection sensitivity updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating detection sensitivity:', error);
      throw new Error(error.message || 'Failed to update detection sensitivity');
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationSettings(settings: NotificationSettingsData): Promise<NotificationSettingsData> {
    try {
      console.log('🔵 SettingsService: Updating notification settings...', settings);
      
      // Map NotificationSettingsData back to UserSettings format
      const userSettingsUpdate = {
        email_notifications: settings.email_enabled,
        web_notifications: settings.push_enabled,
        alert_sound: settings.sound_enabled,
        email_alerts: settings.detection_alerts,
        confidence_threshold: settings.alert_threshold
      };
      
      await this.updateUserSettings(userSettingsUpdate);
      console.log('✅ SettingsService: Notification settings updated');
      return settings;
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating notification settings:', error);
      throw new Error(error.message || 'Failed to update notification settings');
    }
  }

  /**
   * Update stream quality preference
   */
  async updateStreamQuality(quality: UserSettings['stream_quality']): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating stream quality to:', quality);
      await this.updateUserSettings({ stream_quality: quality });
      console.log('✅ SettingsService: Stream quality updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating stream quality:', error);
      throw new Error(error.message || 'Failed to update stream quality');
    }
  }

  /**
   * Update log retention settings
   */
  async updateLogRetention(settings: {
    auto_delete_logs: boolean;
    log_retention_days: number;
  }): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating log retention settings...', settings);
      await this.updateUserSettings(settings);
      console.log('✅ SettingsService: Log retention settings updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating log retention:', error);
      throw new Error(error.message || 'Failed to update log retention settings');
    }
  }

  // ===== SYSTEM PREFERENCES =====

  /**
   * Update timezone
   */
  async updateTimezone(timezone: string): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating timezone to:', timezone);
      await this.updateUserSettings({ timezone });
      console.log('✅ SettingsService: Timezone updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating timezone:', error);
      throw new Error(error.message || 'Failed to update timezone');
    }
  }

  /**
   * Update language
   */
  async updateLanguage(language: string): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating language to:', language);
      await this.updateUserSettings({ language });
      console.log('✅ SettingsService: Language updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating language:', error);
      throw new Error(error.message || 'Failed to update language');
    }
  }

  /**
   * Update maximum cameras limit
   */
  async updateMaxCameras(maxCameras: number): Promise<void> {
    try {
      console.log('🔵 SettingsService: Updating max cameras to:', maxCameras);
      await this.updateUserSettings({ max_cameras: maxCameras });
      console.log('✅ SettingsService: Max cameras updated');
    } catch (error: any) {
      console.error('❌ SettingsService: Error updating max cameras:', error);
      throw new Error(error.message || 'Failed to update camera limit');
    }
  }

  // ===== NOTIFICATION SETTINGS =====

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettingsData> {
    try {
      console.log('🔵 SettingsService: Getting notification settings...');
      
      const userSettings = await this.getUserSettings();
      
      // Map UserSettings to NotificationSettingsData format
      const notificationSettings: NotificationSettingsData = {
        global_enabled: true,
        email_enabled: userSettings.email_notifications || false,
        push_enabled: userSettings.web_notifications || false,
        sound_enabled: userSettings.alert_sound || true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        detection_alerts: userSettings.email_alerts || true,
        system_alerts: true,
        security_alerts: true,
        weekly_reports: true,
        immediate_alerts: true,
        digest_frequency: 'realtime',
        alert_threshold: userSettings.confidence_threshold || 0.7,
        channels: [],
        rules: []
      };
      
      console.log('✅ SettingsService: Got notification settings');
      return notificationSettings;
    } catch (error: any) {
      console.error('❌ SettingsService: Error fetching notification settings:', error);
      throw new Error(error.message || 'Failed to get notification settings');
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      console.log('🔵 SettingsService: Sending test notification...');
      
      // Show browser notification if supported
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('SafeFace System', {
            body: 'This is a test notification from your SafeFace system',
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification('SafeFace System', {
              body: 'This is a test notification from your SafeFace system',
              icon: '/favicon.ico'
            });
          }
        }
      }
      
      console.log('✅ SettingsService: Test notification sent');
    } catch (error: any) {
      console.error('❌ SettingsService: Error sending test notification:', error);
      throw new Error(error.message || 'Failed to send test notification');
    }
  }

  // ===== BACKUP & EXPORT =====

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<Blob> {
    try {
      console.log('🔵 SettingsService: Exporting settings...');
      const settings = await this.getUserSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json'
      });
      console.log('✅ SettingsService: Settings exported');
      return blob;
    } catch (error: any) {
      console.error('❌ SettingsService: Error exporting settings:', error);
      throw new Error(error.message || 'Failed to export settings');
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(file: File): Promise<UserSettings> {
    try {
      console.log('🔵 SettingsService: Importing settings from file...');
      const text = await file.text();
      const settings = JSON.parse(text) as UserSettings;
      
      // Validate imported settings
      if (!this.validateSettings(settings)) {
        throw new Error('Invalid settings format');
      }

      const updatedSettings = await this.updateUserSettings(settings);
      console.log('✅ SettingsService: Settings imported successfully');
      return updatedSettings;
    } catch (error: any) {
      console.error('❌ SettingsService: Error importing settings:', error);
      throw new Error(error.message || 'Failed to import settings');
    }
  }

  // ===== PLACEHOLDER METHODS (Backend chưa implement) =====

  /**
   * Get notification channels - CHƯA CÓ TRONG BACKEND
   */
  async getNotificationChannels(): Promise<NotificationChannel[]> {
    console.warn('⚠️ SettingsService: getNotificationChannels not implemented in backend yet');
    return [];
  }

  /**
   * Create notification channel - CHƯA CÓ TRONG BACKEND
   */
  async createNotificationChannel(channel: Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
    console.warn('⚠️ SettingsService: createNotificationChannel not implemented in backend yet');
    throw new Error('Create notification channel functionality not implemented yet');
  }

  /**
   * Delete notification channel - CHƯA CÓ TRONG BACKEND
   */
  async deleteNotificationChannel(channelId: string): Promise<void> {
    console.warn('⚠️ SettingsService: deleteNotificationChannel not implemented in backend yet');
    throw new Error('Delete notification channel functionality not implemented yet');
  }

  // ===== VALIDATION & UTILITIES =====

  /**
   * Get default settings
   */
  private getDefaultSettings(): UserSettings {
    return {
      email_notifications: true,
      web_notifications: true,
      detection_sensitivity: 0.7,
      auto_delete_logs: false,
      log_retention_days: 30,
      stream_quality: 'medium',
      max_cameras: 5,
      timezone: 'UTC+7',
      language: 'en',
      face_recognition_enabled: true,
      confidence_threshold: 0.7,
      stranger_alert_cooldown: 300,
      webhook_url: '',
      email_alerts: true,
      push_notifications: true,
      alert_sound: true,
      dark_mode: false,
      auto_backup: false,
      backup_frequency: 'weekly'
    };
  }

  /**
   * Validate settings object
   */
  private validateSettings(settings: any): settings is UserSettings {
    const requiredFields = [
      'email_notifications',
      'web_notifications',
      'detection_sensitivity',
      'auto_delete_logs',
      'log_retention_days',
      'stream_quality',
      'max_cameras',
      'timezone',
      'language'
    ];

    return requiredFields.every(field => field in settings);
  }

  /**
   * Get available timezones
   */
  getAvailableTimezones(): string[] {
    return [
      'UTC',
      'UTC+7',
      'UTC+8',
      'UTC+9',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Ho_Chi_Minh',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
      { code: 'ko', name: '한국어' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' }
    ];
  }

  /**
   * Get stream quality options
   */
  getStreamQualityOptions(): Array<{ value: UserSettings['stream_quality']; label: string; description: string }> {
    return [
      { 
        value: 'low', 
        label: 'Low (480p)', 
        description: 'Lower bandwidth usage, suitable for slow connections' 
      },
      { 
        value: 'medium', 
        label: 'Medium (720p)', 
        description: 'Balanced quality and bandwidth usage' 
      },
      { 
        value: 'high', 
        label: 'High (1080p)', 
        description: 'Best quality, requires fast connection' 
      },
      { 
        value: 'auto', 
        label: 'Auto', 
        description: 'Automatically adjust based on connection speed' 
      }
    ];
  }

  /**
   * Get detection sensitivity presets
   */
  getDetectionSensitivityPresets(): Array<{ value: number; label: string; description: string }> {
    return [
      { 
        value: 0.5, 
        label: 'Low Sensitivity', 
        description: 'More accurate, may miss some faces' 
      },
      { 
        value: 0.7, 
        label: 'Medium Sensitivity', 
        description: 'Balanced accuracy and detection rate' 
      },
      { 
        value: 0.85, 
        label: 'High Sensitivity', 
        description: 'Detects more faces, may have false positives' 
      },
      { 
        value: 0.95, 
        label: 'Maximum Sensitivity', 
        description: 'Detects almost all faces, higher false positive rate' 
      }
    ];
  }
}

// ✅ Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;