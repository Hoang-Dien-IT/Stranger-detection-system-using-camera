export interface SecuritySettingsData {
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  device_notifications: boolean;
  password_expiry: boolean;
  login_history_retention: number;
  suspicious_activity_alerts: boolean;
}
  
export interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}
  
  export interface PasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }
  
  export interface TwoFactorSetup {
    qr_code: string;
    secret: string;
    backup_codes?: string[];
  }