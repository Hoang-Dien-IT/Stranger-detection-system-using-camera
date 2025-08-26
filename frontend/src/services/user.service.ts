import { apiService } from './api';

// ===== INTERFACES =====

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
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role?: string;
  permissions?: string[];
  phone?: string;
  department?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  role?: string;
  phone?: string;
  department?: string;
  permissions?: string[];
  avatar_url?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

export interface UserStats {
  cameras: number;
  persons: number;
  detections: number;
}

export interface UserWithStats extends User {
  stats: UserStats;
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
  user_agent?: string;
  created_at?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  details?: Record<string, any>;
}

// ===== USER SERVICE CLASS =====

class UserService {
  private readonly baseUrl = '/users';

  // ===== USER MANAGEMENT =====

  /**
   * Get current user profile - theo backend endpoint
   */
  async getCurrentUser(): Promise<User> {
    try {
      console.log('🔵 UserService: Getting current user...');
      const response = await apiService.get<User>('/auth/me');
      console.log('✅ UserService: Got current user:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('❌ UserService: Error fetching current user:', error);
      throw new Error(error.message || 'Failed to get current user');
    }
  }

  /**
   * Update current user profile - theo backend endpoint
   */
  async updateProfile(userData: UserUpdate): Promise<User> {
    try {
      console.log('🔵 UserService: Updating profile...', userData);
      const response = await apiService.put<User>('/users/profile', userData);
      console.log('✅ UserService: Profile updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ UserService: Error updating profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Change password - theo backend endpoint
   */
  async changePassword(passwordData: PasswordChangeData): Promise<void> {
    try {
      console.log('🔵 UserService: Changing password...');
      await apiService.post('/users/change-password', passwordData);
      console.log('✅ UserService: Password changed successfully');
    } catch (error: any) {
      console.error('❌ UserService: Error changing password:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Upload user avatar - theo backend endpoint
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    try {
      console.log('🔵 UserService: Uploading avatar...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.upload<{ avatar_url: string }>('/users/upload-avatar', formData);
      console.log('✅ UserService: Avatar uploaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ UserService: Error uploading avatar:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  // ===== USER SESSIONS - CHƯA CÓ TRONG BACKEND =====

  /**
   * Get user active sessions - CHƯA CÓ TRONG BACKEND
   */
  async getUserSessions(): Promise<UserSession[]> {
    console.warn('⚠️ UserService: getUserSessions not implemented in backend yet');
    return [];
  }

  /**
   * Terminate specific session - CHƯA CÓ TRONG BACKEND
   */
  async terminateSession(sessionId: string): Promise<void> {
    console.warn('⚠️ UserService: terminateSession not implemented in backend yet');
    throw new Error('Session management functionality not implemented yet');
  }

  /**
   * Terminate all other sessions - CHƯA CÓ TRONG BACKEND
   */
  async terminateAllSessions(): Promise<void> {
    console.warn('⚠️ UserService: terminateAllSessions not implemented in backend yet');
    throw new Error('Session management functionality not implemented yet');
  }

  // ===== USER ACTIVITY - CHƯA CÓ TRONG BACKEND =====

  /**
   * Get user activity logs - CHƯA CÓ TRONG BACKEND
   */
  async getUserActivity(
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActivityLog[]> {
    console.warn('⚠️ UserService: getUserActivity not implemented in backend yet');
    return [];
  }

  /**
   * Log user activity (internal) - CHƯA CÓ TRONG BACKEND
   */
  async logActivity(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    console.warn('⚠️ UserService: logActivity not implemented in backend yet');
    // Don't throw error to avoid breaking main functionality
  }

  // ===== USER PREFERENCES - CHƯA CÓ TRONG BACKEND =====

  /**
   * Get user preferences - CHƯA CÓ TRONG BACKEND
   */
  async getUserPreferences(): Promise<Record<string, any>> {
    console.warn('⚠️ UserService: getUserPreferences not implemented in backend yet');
    return {};
  }

  /**
   * Update user preferences - CHƯA CÓ TRONG BACKEND
   */
  async updateUserPreferences(preferences: Record<string, any>): Promise<void> {
    console.warn('⚠️ UserService: updateUserPreferences not implemented in backend yet');
    throw new Error('User preferences functionality not implemented yet');
  }

  // ===== USER STATISTICS - CHƯA CÓ TRONG BACKEND =====

  /**
   * Get user dashboard statistics - CHƯA CÓ TRONG BACKEND
   */
  async getUserStats(): Promise<UserStats> {
    console.warn('⚠️ UserService: getUserStats not implemented in backend yet');
    return {
      cameras: 0,
      persons: 0,
      detections: 0
    };
  }

  /**
   * Get user detailed statistics - CHƯA CÓ TRONG BACKEND
   */
  async getUserDetailedStats(): Promise<Record<string, any>> {
    console.warn('⚠️ UserService: getUserDetailedStats not implemented in backend yet');
    return {};
  }

  // ===== DATA EXPORT - CHƯA CÓ TRONG BACKEND =====

  /**
   * Export user data - CHƯA CÓ TRONG BACKEND
   */
  async exportUserData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    console.warn('⚠️ UserService: exportUserData not implemented in backend yet');
    throw new Error('Data export functionality not implemented yet');
  }

  /**
   * Download user data export - CHƯA CÓ TRONG BACKEND
   */
  async downloadUserData(format: 'json' | 'csv' = 'json'): Promise<void> {
    console.warn('⚠️ UserService: downloadUserData not implemented in backend yet');
    throw new Error('Data export functionality not implemented yet');
  }

  // ===== ACCOUNT MANAGEMENT - CHƯA CÓ TRONG BACKEND =====

  /**
   * Delete user account - CHƯA CÓ TRONG BACKEND
   */
  async deleteAccount(password: string): Promise<void> {
    console.warn('⚠️ UserService: deleteAccount not implemented in backend yet');
    throw new Error('Account deletion functionality not implemented yet');
  }

  /**
   * Request account data deletion (GDPR compliance) - CHƯA CÓ TRONG BACKEND
   */
  async requestDataDeletion(): Promise<void> {
    console.warn('⚠️ UserService: requestDataDeletion not implemented in backend yet');
    throw new Error('Data deletion request functionality not implemented yet');
  }

  // ===== TWO-FACTOR AUTHENTICATION - CHƯA CÓ TRONG BACKEND =====

  /**
   * Setup two-factor authentication - CHƯA CÓ TRONG BACKEND
   */
  async setupTwoFactor(): Promise<{ qr_code: string; secret: string }> {
    console.warn('⚠️ UserService: setupTwoFactor not implemented in backend yet');
    throw new Error('Two-factor authentication functionality not implemented yet');
  }

  /**
   * Verify two-factor authentication - CHƯA CÓ TRONG BACKEND
   */
  async verifyTwoFactor(code: string): Promise<void> {
    console.warn('⚠️ UserService: verifyTwoFactor not implemented in backend yet');
    throw new Error('Two-factor authentication functionality not implemented yet');
  }

  /**
   * Disable two-factor authentication - CHƯA CÓ TRONG BACKEND
   */
  async disableTwoFactor(password: string): Promise<void> {
    console.warn('⚠️ UserService: disableTwoFactor not implemented in backend yet');
    throw new Error('Two-factor authentication functionality not implemented yet');
  }

  // ===== ADMIN USER MANAGEMENT - SỬ DỤNG ADMIN SERVICE =====

  /**
   * Get all users (admin only) - theo backend endpoint
   */
  async getAllUsers(): Promise<UserWithStats[]> {
    try {
      console.log('🔵 UserService: Getting all users...');
      const response = await apiService.get<UserWithStats[]>('/admin/users');
      console.log('✅ UserService: Got all users:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ UserService: Error fetching all users:', error);
      throw new Error(error.message || 'Failed to get all users');
    }
  }

  /**
   * Get user by ID (admin only) - theo backend endpoint
   */
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('🔵 UserService: Getting user by ID:', userId);
      const response = await apiService.get<{ user: User }>(`/admin/users/${userId}/details`);
      console.log('✅ UserService: Got user details');
      return response.data.user;
    } catch (error: any) {
      console.error('❌ UserService: Error fetching user by ID:', error);
      throw new Error(error.message || 'Failed to get user details');
    }
  }

  /**
   * Create new user (admin only) - CHƯA CÓ TRONG BACKEND
   */
  async createUser(userData: UserCreate): Promise<User> {
    console.warn('⚠️ UserService: createUser not implemented in backend yet');
    throw new Error('Create user functionality not implemented yet');
  }

  /**
   * Update user (admin only) - CHƯA CÓ TRONG BACKEND
   */
  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    console.warn('⚠️ UserService: updateUser not implemented in backend yet');
    throw new Error('Update user functionality not implemented yet');
  }

  /**
   * Toggle user status (admin only) - theo backend endpoint
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      console.log('🔵 UserService: Toggling user status:', { userId, isActive });
      await apiService.post(`/admin/users/${userId}/toggle-status`, { is_active: isActive });
      console.log('✅ UserService: User status toggled successfully');
    } catch (error: any) {
      console.error('❌ UserService: Error toggling user status:', error);
      throw new Error(error.message || 'Failed to update user status');
    }
  }

  /**
   * Toggle admin role (admin only) - theo backend endpoint
   */
  async toggleAdminRole(userId: string, isAdmin: boolean): Promise<void> {
    try {
      console.log('🔵 UserService: Toggling admin role:', { userId, isAdmin });
      await apiService.post(`/admin/users/${userId}/toggle-admin`, { is_admin: isAdmin });
      console.log('✅ UserService: Admin role toggled successfully');
    } catch (error: any) {
      console.error('❌ UserService: Error toggling admin role:', error);
      throw new Error(error.message || 'Failed to update admin role');
    }
  }

  // ===== UTILITY METHODS - CHƯA CÓ TRONG BACKEND =====

  /**
   * Validate username availability - CHƯA CÓ TRONG BACKEND
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    console.warn('⚠️ UserService: checkUsernameAvailability not implemented in backend yet');
    return true; // Default to available
  }

  /**
   * Validate email availability - CHƯA CÓ TRONG BACKEND
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    console.warn('⚠️ UserService: checkEmailAvailability not implemented in backend yet');
    return true; // Default to available
  }

  /**
   * Send password reset email - CHƯA CÓ TRONG BACKEND
   */
  async requestPasswordReset(email: string): Promise<void> {
    console.warn('⚠️ UserService: requestPasswordReset not implemented in backend yet');
    throw new Error('Password reset functionality not implemented yet');
  }

  /**
   * Reset password with token - CHƯA CÓ TRONG BACKEND
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    console.warn('⚠️ UserService: resetPassword not implemented in backend yet');
    throw new Error('Password reset functionality not implemented yet');
  }

  /**
   * Refresh user token - theo backend endpoint
   */
  async refreshToken(): Promise<{ access_token: string }> {
    try {
      console.log('🔵 UserService: Refreshing token...');
      const response = await apiService.post<{ access_token: string }>('/auth/refresh');
      console.log('✅ UserService: Token refreshed successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ UserService: Error refreshing token:', error);
      throw new Error(error.message || 'Failed to refresh token');
    }
  }

  // ===== ENHANCED UTILITY METHODS =====

  /**
   * Get user profile with stats - combine existing APIs
   */
  async getUserProfileWithStats(): Promise<UserWithStats> {
    try {
      const user = await this.getCurrentUser();
      const stats = await this.getUserStats();
      
      return {
        ...user,
        stats
      };
    } catch (error: any) {
      console.error('❌ UserService: Error getting user profile with stats:', error);
      throw new Error(error.message || 'Failed to get user profile with stats');
    }
  }

  /**
   * Update user avatar and profile - combine APIs
   */
  async updateProfileWithAvatar(userData: UserUpdate, avatarFile?: File): Promise<User> {
    try {
      let updatedUser = await this.updateProfile(userData);
      
      if (avatarFile) {
        const avatarResult = await this.uploadAvatar(avatarFile);
        updatedUser = await this.updateProfile({ avatar_url: avatarResult.avatar_url });
      }
      
      return updatedUser;
    } catch (error: any) {
      console.error('❌ UserService: Error updating profile with avatar:', error);
      throw new Error(error.message || 'Failed to update profile with avatar');
    }
  }

  /**
   * Check if current user is admin
   */
  isCurrentUserAdmin(): boolean {
    try {
      const user = this.getCurrentUserFromStorage();
      return user?.is_admin || false;
    } catch {
      return false;
    }
  }

  /**
   * Get current user from localStorage (sync)
   */
  getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('❌ UserService: Error parsing user from storage:', error);
    }
    return null;
  }

  /**
   * Set user in localStorage
   */
  setCurrentUserInStorage(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('🔵 UserService: User stored in localStorage');
    } catch (error) {
      console.error('❌ UserService: Error storing user in localStorage:', error);
    }
  }

  /**
   * Clear user from localStorage
   */
  clearCurrentUserFromStorage(): void {
    try {
      localStorage.removeItem('user');
      console.log('🔵 UserService: User cleared from localStorage');
    } catch (error) {
      console.error('❌ UserService: Error clearing user from localStorage:', error);
    }
  }

  /**
   * Validate user session
   */
  async validateUserSession(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user timezone or default
   */
  getUserTimezone(): string {
    const user = this.getCurrentUserFromStorage();
    return user?.timezone || 'UTC+7';
  }

  /**
   * Format user display name
   */
  formatUserDisplayName(user?: User): string {
    const targetUser = user || this.getCurrentUserFromStorage();
    if (!targetUser) return 'Unknown User';
    
    return targetUser.full_name || targetUser.username || 'Unknown User';
  }

  /**
   * Check user permissions
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUserFromStorage();
    if (!user) return false;
    
    // Admin has all permissions
    if (user.is_admin) return true;
    
    // Check specific permission
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Get user role display name
   */
  getUserRoleDisplay(user?: User): string {
    const targetUser = user || this.getCurrentUserFromStorage();
    if (!targetUser) return 'Unknown';
    
    if (targetUser.is_admin) return 'Admin';
    return targetUser.role || 'User';
  }
}

// ===== SINGLETON EXPORT =====

export const userService = new UserService();
export default userService;