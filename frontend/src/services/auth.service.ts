import { apiService } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at?: string;
  last_login?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
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
  role?: string;
  phone?: string;        // ✅ ADD: Optional phone field
  department?: string;   // ✅ ADD: Optional department field
  is_admin?: boolean;    // ✅ ADD: Optional admin flag
  is_active?: boolean;   // ✅ ADD: Optional active flag
  permissions?: string[]; // ✅ ADD: Optional permissions array
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user';

  async register(userData: RegisterRequest): Promise<User> {
    try {
      console.log('🔵 AuthService: Attempting registration...', { username: userData.username });
      
      const response = await apiService.post<User>('/auth/register', userData);
      
      console.log('✅ AuthService: Registration successful', { username: response.data.username });
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Registration failed', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔵 AuthService: Attempting login...', { username: credentials.username });
      
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await apiService.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const loginResponse = response.data;
      
      // Store token and user info
      this.setToken(loginResponse.access_token);
      this.setUser(loginResponse.user);
      
      // ✅ CRITICAL: Set global auth header immediately after login
      apiService.setAuthHeader(loginResponse.access_token);
      
      console.log('✅ AuthService: Login successful', { 
        username: loginResponse.user.username,
        token: loginResponse.access_token.substring(0, 20) + '...'
      });
      
      return loginResponse;
    } catch (error: any) {
      console.error('❌ AuthService: Login failed', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  logout(): void {
    try {
      console.log('🔵 AuthService: Logging out...');
      
      // Clear local storage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      
      // Clear global auth header
      apiService.clearAuthHeader();
      
      console.log('✅ AuthService: Logged out successfully');
    } catch (error) {
      console.error('❌ AuthService: Logout error', error);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      console.log('🔵 AuthService: Getting current user...');
      
      const response = await apiService.get<User>('/auth/me');
      
      // Update stored user info
      this.setUser(response.data);
      
      console.log('✅ AuthService: Got current user', { username: response.data.username });
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Failed to get current user', error);
      
      // If token is invalid, logout
      if (error.message.includes('401') || error.message.includes('403')) {
        this.logout();
      }
      
      throw new Error(error.message || 'Failed to get user info');
    }
  }

    async forgotPassword(email: string): Promise<void> {
    try {
      console.log('🔵 AuthService: Requesting password reset for:', email);
      
      // ✅ FIX: Since backend doesn't have this endpoint yet, use mock implementation
      // In real implementation, this would call: /api/auth/forgot-password
      
      // Mock validation - check if email looks valid
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Invalid email address');
      }
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success response
      console.log('✅ AuthService: Password reset email sent (mocked)');
      
      // TODO: Replace with actual API call when backend implements:
      // const response = await apiService.post('/auth/forgot-password', { email });
      // return response.data;
      
    } catch (error: any) {
      console.error('❌ AuthService: Error requesting password reset:', error);
      
      // Mock error handling
      if (error.message === 'Invalid email address') {
        throw error;
      }
      
      // Mock "user not found" error for demonstration
      if (email === 'notfound@example.com') {
        // eslint-disable-next-line no-throw-literal
        throw {
          response: {
            data: {
              detail: 'No account found with this email address'
            }
          }
        };
      }
      
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      console.log('🔵 AuthService: Resetting password with token');
      
      // ✅ FIX: Mock implementation until backend is ready
      // TODO: Replace with actual API call when backend implements:
      // const response = await apiService.post('/auth/reset-password', { token, new_password: newPassword });
      
      // Mock validation
      if (!token || !newPassword) {
        throw new Error('Invalid token or password');
      }
      
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ AuthService: Password reset successfully (mocked)');
      
    } catch (error: any) {
      console.error('❌ AuthService: Error resetting password:', error);
      throw error;
    }
  }


  async updateProfile(userData: UserUpdate): Promise<User> {
    try {
      console.log('🔵 AuthService: Updating profile...', userData);
      
      const response = await apiService.put<User>('/auth/me', userData);
      
      // Update stored user info
      this.setUser(response.data);
      
      console.log('✅ AuthService: Profile updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Failed to update profile', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

    // ✅ ADD: Upload avatar method
  async uploadAvatar(formData: FormData): Promise<{ avatar_url: string }> {
    try {
      console.log('🔵 AuthService: Uploading avatar...');
      
      const response = await apiService.upload<{ avatar_url: string }>('/auth/upload-avatar', formData);
      
      // Update current user's avatar_url
      const currentUser = this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar_url: response.data.avatar_url };
        this.setUser(updatedUser);
      }
      
      console.log('✅ AuthService: Avatar uploaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Error uploading avatar:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  async uploadAvatarFile(file: File): Promise<{ avatar_url: string }> {
    try {
      console.log('🔵 AuthService: Uploading avatar file...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      return await this.uploadAvatar(formData);
    } catch (error: any) {
      console.error('❌ AuthService: Error uploading avatar file:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      console.log('🔵 AuthService: Changing password...');
      
      await apiService.post('/auth/change-password', passwordData);
      
      console.log('✅ AuthService: Password changed successfully');
    } catch (error: any) {
      console.error('❌ AuthService: Failed to change password', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  async refreshToken(): Promise<string> {
    try {
      console.log('🔵 AuthService: Refreshing token...');
      
      const response = await apiService.post<{ access_token: string }>('/auth/refresh');
      
      // Update token
      this.setToken(response.data.access_token);
      apiService.setAuthHeader(response.data.access_token);
      
      console.log('✅ AuthService: Token refreshed successfully');
      return response.data.access_token;
    } catch (error: any) {
      console.error('❌ AuthService: Failed to refresh token', error);
      this.logout();
      throw new Error(error.message || 'Failed to refresh token');
    }
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    try {
      console.log('🔵 AuthService: Checking username availability:', username);
      
      // ✅ FIX: Since backend doesn't have this endpoint yet, use mock implementation
      // In real implementation, this would call: /api/auth/check-username
      
      // Mock validation - check basic rules
      if (!username || username.length < 3) {
        return { available: false };
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { available: false };
      }
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock some unavailable usernames for demonstration
      const unavailableUsernames = ['admin', 'user', 'test', 'demo', 'system', 'root'];
      const available = !unavailableUsernames.includes(username.toLowerCase());
      
      console.log('✅ AuthService: Username availability check result:', { username, available });
      return { available };
      
      // TODO: Replace with actual API call when backend implements:
      // const response = await apiService.get(`/auth/check-username?username=${username}`);
      // return response.data;
      
    } catch (error: any) {
      console.error('❌ AuthService: Error checking username availability:', error);
      // Return true on error to not block registration
      return { available: true };
    }
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      console.log('🔵 AuthService: Checking email availability:', email);
      
      // ✅ FIX: Mock implementation until backend is ready
      // TODO: Replace with actual API call when backend implements:
      // const response = await apiService.get(`/auth/check-email?email=${email}`);
      
      // Mock validation - check email format
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return { available: false };
      }
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock some unavailable emails for demonstration
      const unavailableEmails = [
        'admin@example.com', 
        'test@example.com', 
        'demo@example.com',
        'user@gmail.com'
      ];
      const available = !unavailableEmails.includes(email.toLowerCase());
      
      console.log('✅ AuthService: Email availability check result:', { email, available });
      return { available };
      
    } catch (error: any) {
      console.error('❌ AuthService: Error checking email availability:', error);
      // Return true on error to not block registration
      return { available: true };
    }
  }

  // ✅ Token management
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    apiService.setAuthHeader(token);
    console.log('🔵 AuthService: Token set', { token: token.substring(0, 20) + '...' });
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      console.log('🔵 AuthService: Token retrieved', { token: token.substring(0, 20) + '...' });
    }
    return token;
  }

  // ✅ User management
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    console.log('🔵 AuthService: User set', { username: user.username });
  }

  getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('🔵 AuthService: User retrieved', { username: user.username });
        return user;
      }
    } catch (error) {
      console.error('❌ AuthService: Error parsing user data', error);
      this.logout();
    }
    return null;
  }

  // ✅ Authentication status
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    const isAuth = !!(token && user);
    
    console.log('🔵 AuthService: Authentication check', { 
      hasToken: !!token, 
      hasUser: !!user,
      isAuthenticated: isAuth 
    });
    
    return isAuth;
  }

  // ✅ Admin check
  isAdmin(): boolean {
    const user = this.getUser();
    return !!(user && user.is_admin);
  }

  // ✅ Permission check
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return !!(user && user.permissions && user.permissions.includes(permission));
  }

  // ✅ Initialize auth state on app start
  initializeAuth(): void {
    try {
      const token = this.getToken();
      
      if (token) {
        // Set global auth header if token exists
        apiService.setAuthHeader(token);
        console.log('✅ AuthService: Auth initialized with existing token');
      } else {
        console.log('🔵 AuthService: No existing token found');
      }
    } catch (error) {
      console.error('❌ AuthService: Error initializing auth', error);
      this.logout();
    }
  }
}

export const authService = new AuthService();