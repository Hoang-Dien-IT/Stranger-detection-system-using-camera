export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  avatar_url?: string;
  permissions?: string[];
  role?: 'admin' | 'user' | 'viewer';
  // ✅ Add missing fields from ProfileSettings
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user' | 'viewer'; // Add role to registration
  phone?: string; // Add phone to registration
  department?: string; // Add department to registration
  permissions?: string[]; // Add permissions to registration
}

export interface AuthResponse {
  [x: string]: any;
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}


export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}