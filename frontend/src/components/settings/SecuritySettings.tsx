import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Monitor,
  Clock,
  Lock,
  Unlock,
  Settings,
  Activity,
  ExternalLink,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';

// ✅ Updated interfaces to match backend from #backend
interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface SecuritySettingsData {
  // ✅ Backend doesn't have these yet, so they're frontend-only
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  device_notifications: boolean;
  password_expiry: boolean;
  login_history_retention: number;
  suspicious_activity_alerts: boolean;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

interface SecuritySettingsProps {
  onSave?: (data: SecuritySettingsData) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // ✅ Initialize with backend-compatible default values
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsData>({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
    device_notifications: true,
    password_expiry: false,
    login_history_retention: 90,
    suspicious_activity_alerts: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // ✅ Mock sessions until backend implements session management
  const [activeSessions, setActiveSessions] = useState<LoginSession[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Ho Chi Minh City, Vietnam',
      ip_address: '192.168.1.100',
      last_active: new Date().toISOString(),
      is_current: true
    }
  ]);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  // ✅ Load security settings from backend (when available)
  const loadSecuritySettings = async () => {
    try {
      // For now, use mock data since backend doesn't have security settings endpoint yet
      console.log('🔵 SecuritySettings: Loading security settings...');
      
      // TODO: Replace with actual API call when backend implements:
      // const settings = await userService.getSecuritySettings();
      // setSecuritySettings(settings);
      
      console.log('✅ SecuritySettings: Security settings loaded (mock)');
    } catch (error) {
      console.error('❌ SecuritySettings: Error loading settings:', error);
      // Keep default settings on error
    }
  };

  // ✅ Enhanced password validation
  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Updated to use backend endpoint from #backend
  const handlePasswordChange = async () => {
    if (!validatePassword()) {
      toast.error('Please fix the password errors');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 SecuritySettings: Changing password...');
      
      // ✅ Use backend endpoint POST /auth/change-password
      await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      setErrors({});
      toast.success('Password changed successfully');
      console.log('✅ SecuritySettings: Password changed successfully');
    } catch (error: any) {
      console.error('❌ SecuritySettings: Error changing password:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to change password';
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('Current password is incorrect')) {
          setErrors({ current_password: 'Current password is incorrect' });
          errorMessage = 'Current password is incorrect';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsChange = (key: keyof SecuritySettingsData, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ Mock save settings (backend doesn't implement security settings yet)
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      console.log('🔵 SecuritySettings: Saving security settings...');
      
      // ✅ Mock implementation until backend adds security settings endpoint
      console.warn('⚠️ SecuritySettings: Security settings endpoint not implemented in backend yet');
      
      // TODO: Replace with actual API call when backend implements:
      // await userService.updateSecuritySettings(securitySettings);
      
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave?.(securitySettings);
      toast.success('Security settings updated successfully');
      console.log('✅ SecuritySettings: Security settings saved (mock)');
    } catch (error: any) {
      console.error('❌ SecuritySettings: Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mock session management (backend doesn't implement this yet)
  const handleTerminateSession = async (sessionId: string) => {
    try {
      console.log('🔵 SecuritySettings: Terminating session:', sessionId);
      
      // ✅ Mock implementation
      console.warn('⚠️ SecuritySettings: Session management not implemented in backend yet');
      
      // TODO: Replace with actual API call when backend implements:
      // await userService.terminateSession(sessionId);
      
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success('Session terminated successfully');
      console.log('✅ SecuritySettings: Session terminated (mock)');
    } catch (error) {
      console.error('❌ SecuritySettings: Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      console.log('🔵 SecuritySettings: Terminating all sessions...');
      
      // ✅ Mock implementation
      console.warn('⚠️ SecuritySettings: Session management not implemented in backend yet');
      
      // TODO: Replace with actual API call when backend implements:
      // await userService.terminateAllSessions();
      
      setActiveSessions(prev => prev.filter(session => session.is_current));
      toast.success('All other sessions terminated');
      console.log('✅ SecuritySettings: All sessions terminated (mock)');
    } catch (error) {
      console.error('❌ SecuritySettings: Error terminating all sessions:', error);
      toast.error('Failed to terminate sessions');
    }
  };

  // ✅ Export user data (mock until backend implements)
  const handleExportData = async () => {
    try {
      console.log('🔵 SecuritySettings: Exporting user data...');
      
      // ✅ Mock implementation
      console.warn('⚠️ SecuritySettings: Data export not implemented in backend yet');
      
      // TODO: Replace with actual API call when backend implements:
      // const blob = await userService.exportUserData('json');
      
      // Mock data export
      const userData = {
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          full_name: user?.full_name,
          created_at: user?.created_at
        },
        exported_at: new Date().toISOString(),
        data_types: ['profile', 'settings', 'activity_logs']
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safeface-data-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('User data exported successfully');
      console.log('✅ SecuritySettings: User data exported (mock)');
    } catch (error) {
      console.error('❌ SecuritySettings: Error exporting data:', error);
      toast.error('Failed to export user data');
    }
  };

  // ✅ Delete account (mock until backend implements)
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 SecuritySettings: Deleting account...');
      
      // ✅ Mock implementation
      console.warn('⚠️ SecuritySettings: Account deletion not implemented in backend yet');
      
      // TODO: Replace with actual API call when backend implements:
      // await userService.deleteAccount(passwordData.current_password);
      
      toast.error('Account deletion is not available yet');
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText('');
      console.log('✅ SecuritySettings: Account deletion attempted (mock)');
    } catch (error) {
      console.error('❌ SecuritySettings: Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, label: '', color: 'gray' };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*]/.test(password)) score += 1;

    const strength = [
      { label: 'Very Weak', color: 'red' },
      { label: 'Weak', color: 'orange' },
      { label: 'Fair', color: 'yellow' },
      { label: 'Good', color: 'blue' },
      { label: 'Strong', color: 'green' }
    ];

    return { score, ...strength[Math.min(score, 4)] };
  };

  return (
    <div className="space-y-6">
      {/* ✅ Enhanced Change Password */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Key className="h-5 w-5 text-cyan-600" />
            <span>Đổi mật khẩu</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-black">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, current_password: e.target.value }));
                  if (errors.current_password) {
                    setErrors(prev => ({ ...prev, current_password: '' }));
                  }
                }}
                placeholder="Nhập mật khẩu hiện tại"
                className={errors.current_password ? 'border-red-500 focus:border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.current_password && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.current_password}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-black">
              Mật khẩu mới <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, new_password: e.target.value }));
                  if (errors.new_password) {
                    setErrors(prev => ({ ...prev, new_password: '' }));
                  }
                }}
                placeholder="Nhập mật khẩu mới"
                className={errors.new_password ? 'border-red-500 focus:border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Enhanced Password Strength Indicator */}
            {passwordData.new_password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1 flex-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const strength = getPasswordStrength(passwordData.new_password);
                      return (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded transition-colors ${
                            level <= strength.score
                              ? strength.color === 'red' ? 'bg-red-500' :
                                strength.color === 'orange' ? 'bg-orange-500' :
                                strength.color === 'yellow' ? 'bg-yellow-500' :
                                strength.color === 'blue' ? 'bg-blue-500' :
                                'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className={`text-xs font-medium ${
                    getPasswordStrength(passwordData.new_password).color === 'red' ? 'text-red-600' :
                    getPasswordStrength(passwordData.new_password).color === 'orange' ? 'text-orange-600' :
                    getPasswordStrength(passwordData.new_password).color === 'yellow' ? 'text-yellow-600' :
                    getPasswordStrength(passwordData.new_password).color === 'blue' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {getPasswordStrength(passwordData.new_password).label}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Yêu cầu mật khẩu:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li className={passwordData.new_password.length >= 8 ? 'text-emerald-600' : 'text-gray-500'}>
                      Tối thiểu 8 ký tự
                    </li>
                    <li className={/[a-z]/.test(passwordData.new_password) ? 'text-emerald-600' : 'text-gray-500'}>
                      Chữ thường
                    </li>
                    <li className={/[A-Z]/.test(passwordData.new_password) ? 'text-emerald-600' : 'text-gray-500'}>
                      Chữ hoa
                    </li>
                    <li className={/\d/.test(passwordData.new_password) ? 'text-emerald-600' : 'text-gray-500'}>
                      Số
                    </li>
                    <li className={/[!@#$%^&*]/.test(passwordData.new_password) ? 'text-emerald-600' : 'text-gray-500'}>
                      Ký tự đặc biệt
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {errors.new_password && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.new_password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-black">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }));
                  if (errors.confirm_password) {
                    setErrors(prev => ({ ...prev, confirm_password: '' }));
                  }
                }}
                placeholder="Xác nhận mật khẩu mới"
                className={errors.confirm_password ? 'border-red-500 focus:border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.confirm_password}
              </p>
            )}
          </div>

          <Alert className="border-cyan-200 bg-cyan-50">
            <Shield className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-800">
              Hãy chọn mật khẩu mạnh gồm tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang đổi mật khẩu...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Two-Factor Authentication */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-emerald-900">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <span>Xác thực hai lớp (2FA)</span>
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
              Sắp ra mắt
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Bật xác thực 2 lớp</Label>
              <p className="text-sm text-black">
                Thêm lớp bảo mật cho tài khoản bằng ứng dụng xác thực
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={securitySettings.two_factor_enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShowTwoFactorDialog(true);
                  } else {
                    handleSecuritySettingsChange('two_factor_enabled', false);
                  }
                }}
                disabled // ✅ Disabled until backend implements 2FA
              />
              {securitySettings.two_factor_enabled && (
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đã bật
                  </Badge>
              )}
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Tính năng xác thực hai lớp sẽ có trong bản cập nhật tới. Vui lòng chờ để tăng cường bảo mật!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Login & Session Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Settings className="h-5 w-5 text-cyan-600" />
            <span>Cài đặt đăng nhập & phiên làm việc</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Thông báo đăng nhập</Label>
              <p className="text-sm text-black">
                Nhận thông báo khi có đăng nhập từ thiết bị mới
              </p>
            </div>
            <Switch
              checked={securitySettings.login_alerts}
              onCheckedChange={(checked) => handleSecuritySettingsChange('login_alerts', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Thông báo thiết bị</Label>
              <p className="text-sm text-black">
                Nhận thông báo khi có thiết bị mới truy cập tài khoản
              </p>
            </div>
            <Switch
              checked={securitySettings.device_notifications}
              onCheckedChange={(checked) => handleSecuritySettingsChange('device_notifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Cảnh báo hoạt động bất thường</Label>
              <p className="text-sm text-black">
                Nhận cảnh báo khi phát hiện đăng nhập hoặc sự kiện bất thường
              </p>
            </div>
            <Switch
              checked={securitySettings.suspicious_activity_alerts}
              onCheckedChange={(checked) => handleSecuritySettingsChange('suspicious_activity_alerts', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="session_timeout" className="text-black">
              <Clock className="h-4 w-4 inline mr-1" />
              Thời gian hết phiên (phút)
            </Label>
            <Input
              id="session_timeout"
              type="number"
              value={securitySettings.session_timeout}
              onChange={(e) => handleSecuritySettingsChange('session_timeout', parseInt(e.target.value) || 30)}
              min="5"
              max="480"
              className="w-32"
            />
            <p className="text-sm text-black">
              Tự động đăng xuất sau khoảng thời gian không hoạt động (5-480 phút)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Active Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-cyan-800">
              <Monitor className="h-5 w-5 text-cyan-600" />
              <span>Phiên hoạt động</span>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                Giới hạn
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTerminateAllSessions}
                className="text-red-600 hover:text-red-700 border-red-300"
              >
                <Unlock className="h-4 w-4 mr-2" />
                End All Others
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Monitor className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{session.device}</h4>
                      {session.is_current && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Phiên hiện tại
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-black">{session.location}</p>
                    <div className="flex items-center space-x-4 text-xs text-black mt-1">
                      <span>IP: {session.ip_address}</span>
                      <span>•</span>
                      <span>Hoạt động gần nhất: {new Date(session.last_active).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {!session.is_current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Kết thúc phiên
                  </Button>
                )}
              </div>
            ))}
            
            <Alert className="border-cyan-200 bg-cyan-50">
              <Monitor className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-cyan-800">
                Quản lý phiên hiện tại còn giới hạn. Tính năng đầy đủ sẽ có trong bản cập nhật tới.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Data & Privacy */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Activity className="h-5 w-5 text-cyan-600" />
            <span>Dữ liệu & quyền riêng tư</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Hết hạn mật khẩu</Label>
              <p className="text-sm text-black">
                Yêu cầu đổi mật khẩu mỗi 90 ngày để tăng bảo mật
              </p>
            </div>
            <Switch
              checked={securitySettings.password_expiry}
              onCheckedChange={(checked) => handleSecuritySettingsChange('password_expiry', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="history_retention" className="text-black">
              Thời gian lưu lịch sử đăng nhập (ngày)
            </Label>
            <Input
              id="history_retention"
              type="number"
              value={securitySettings.login_history_retention}
              onChange={(e) => handleSecuritySettingsChange('login_history_retention', parseInt(e.target.value) || 90)}
              min="30"
              max="365"
              className="w-32"
            />
            <p className="text-sm text-black">
              Thời gian lưu lịch sử đăng nhập (30-365 ngày)
            </p>
          </div>

          <Separator />

          {/* ✅ Data Export Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium text-black">Xuất dữ liệu cá nhân</Label>
              <p className="text-sm text-black mt-1">
                Tải về bản sao dữ liệu cá nhân của bạn trên SafeFace
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleExportData}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất dữ liệu (JSON)
            </Button>
          </div>

          <Separator />

          {/* ✅ Account Deletion Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium text-red-600">Vùng nguy hiểm</Label>
              <p className="text-sm text-black mt-1">
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteAccountDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa tài khoản
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Save Settings Button */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto text-black border-cyan-300 hover:bg-cyan-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Đặt lại
        </Button>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          className="w-full sm:w-auto min-w-32 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu cài đặt bảo mật
            </>
          )}
        </Button>
      </div>

      {/* ✅ Enhanced Two-Factor Setup Dialog */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-emerald-900">
              <Smartphone className="h-5 w-5" />
              <span>Thiết lập xác thực hai lớp</span>
            </DialogTitle>
            <DialogDescription className="text-black">
              Xác thực hai lớp giúp tăng cường bảo mật cho tài khoản của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Tính năng xác thực hai lớp chưa khả dụng. Sẽ được cập nhật trong thời gian tới.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <div className="w-32 h-32 bg-white mx-auto mb-4 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-black">
                Mã QR sẽ hiển thị tại đây khi 2FA được hỗ trợ
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification_code" className="text-black">Mã xác thực</Label>
              <Input
                id="verification_code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled
              />
              <p className="text-xs text-black">
                Sử dụng Google Authenticator, Authy hoặc ứng dụng tương tự
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTwoFactorDialog(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  toast.info('Two-factor authentication will be available soon');
                  setShowTwoFactorDialog(false);
                }}
                className="flex-1"
                disabled
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Bật 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Enhanced Delete Account Dialog */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Xóa tài khoản</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3 text-black">
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản? Hành động này không thể hoàn tác.
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-medium text-sm">Bạn sẽ mất vĩnh viễn:</p>
                <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                  <li>Hồ sơ và cài đặt người dùng</li>
                  <li>Tất cả camera và cấu hình</li>
                  <li>Tất cả người đã lưu và ảnh khuôn mặt</li>
                  <li>Tất cả nhật ký phát hiện và lịch sử</li>
                  <li>Tất cả tệp và dữ liệu đã tải lên</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete_confirm" className="text-black">
                  Nhập <strong>DELETE</strong> để xác nhận:
                </Label>
                <Input
                  id="delete_confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Nhập DELETE để xác nhận"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmText('');
                setShowDeleteAccountDialog(false);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa tài khoản
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecuritySettings;