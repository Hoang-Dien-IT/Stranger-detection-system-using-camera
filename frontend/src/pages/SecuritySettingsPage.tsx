import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield, Lock, Key, Eye, EyeOff, AlertCircle, Save, RefreshCw,
  QrCode, Mail, Clock, Monitor, Settings,
  ShieldCheck, Globe, Database, History
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { settingsService, UserSettings } from '@/services/settings.service';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

interface SecuritySettings {
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  auto_logout: boolean;
  device_management: boolean;
  ip_whitelist_enabled: boolean;
  ip_whitelist: string[];
  password_expiry_enabled: boolean;
  password_expiry_days: number;
  login_attempts_limit: number;
  account_lockout_duration: number;
  require_password_change: boolean;
  enable_session_recording: boolean;
  audit_log_retention: number;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const SecuritySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [newIPAddress, setNewIPAddress] = useState('');

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
    auto_logout: true,
    device_management: true,
    ip_whitelist_enabled: false,
    ip_whitelist: [],
    password_expiry_enabled: false,
    password_expiry_days: 90,
    login_attempts_limit: 5,
    account_lockout_duration: 15,
    require_password_change: false,
    enable_session_recording: false,
    audit_log_retention: 30
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const userSettings = await settingsService.getUserSettings();
        
        setSecuritySettings(prev => ({
          ...prev,
          login_alerts: userSettings.email_alerts ?? true,
          session_timeout: 30, // Default since not in backend yet
          auto_logout: true // Default since not in backend yet
        }));

      } catch (error) {
        console.error('Error loading security settings:', error);
        toast.error('Failed to load security settings');
      }
    };

    loadData();
  }, [user]);

  // Validation
  const validatePasswordData = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.current_password.trim()) newErrors.current_password = 'Current password is required';
    if (!passwordData.new_password.trim()) newErrors.new_password = 'New password is required';
    else if (passwordData.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters';
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordData()) return;

    try {
      setLoading(true);
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('🔐 Password changed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '❌ Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsUpdate = async () => {
    try {
      setLoading(true);
      const userSettings: Partial<UserSettings> = {
        email_alerts: securitySettings.login_alerts
      };
      
      await settingsService.updateUserSettings(userSettings);
      toast.success('🔒 Security settings updated successfully');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('❌ Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      // Simulate 2FA setup
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecuritySettings(prev => ({ ...prev, two_factor_enabled: true }));
      setShow2FADialog(false);
      toast.success('🛡️ Two-factor authentication enabled');
    } catch (error) {
      toast.error('❌ Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecuritySettings(prev => ({ ...prev, two_factor_enabled: false }));
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error('❌ Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const addIPAddress = () => {
    if (newIPAddress && !securitySettings.ip_whitelist.includes(newIPAddress)) {
      setSecuritySettings(prev => ({
        ...prev,
        ip_whitelist: [...prev.ip_whitelist, newIPAddress]
      }));
      setNewIPAddress('');
    }
  };

  const removeIPAddress = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ip_whitelist: prev.ip_whitelist.filter(address => address !== ip)
    }));
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-emerald-900 mb-2">Cài đặt bảo mật</h1>
              <p className="text-slate-600">Quản lý bảo mật tài khoản, xác thực và quyền truy cập hệ thống SafeFace</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                isConnected 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app/settings')}
                className="flex items-center space-x-2 border-emerald-300 hover:bg-emerald-50 text-emerald-700"
              >
                <Settings className="h-4 w-4 text-emerald-700" />
                <span>Quay lại cài đặt</span>
              </Button>
            </div>
          </div>

          {/* Tổng quan bảo mật */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Xác thực 2 lớp</p>
                    <p className="text-lg font-semibold text-emerald-900">
                      {securitySettings.two_factor_enabled ? 'Đã bật' : 'Chưa bật'}
                    </p>
                  </div>
                  <ShieldCheck className={`h-8 w-8 ${securitySettings.two_factor_enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Cảnh báo đăng nhập</p>
                    <p className="text-lg font-semibold text-emerald-900">
                      {securitySettings.login_alerts ? 'Đang bật' : 'Đang tắt'}
                    </p>
                  </div>
                  <AlertCircle className={`h-8 w-8 ${securitySettings.login_alerts ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Thời gian hết phiên</p>
                    <p className="text-lg font-semibold text-emerald-900">{securitySettings.session_timeout} phút</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Danh sách IP cho phép</p>
                    <p className="text-lg font-semibold text-emerald-900">
                      {securitySettings.ip_whitelist_enabled ? `${securitySettings.ip_whitelist.length} IP` : 'Chưa bật'}
                    </p>
                  </div>
                  <Globe className={`h-8 w-8 ${securitySettings.ip_whitelist_enabled ? 'text-orange-600' : 'text-slate-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Settings */}
          <motion.div {...fadeInUp} className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <span>Xác thực & đăng nhập</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4" />
                      <span>Xác thực 2 lớp (2FA)</span>
                    </Label>
                    <p className="text-sm text-slate-600">Tăng bảo mật với xác thực hai lớp</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {securitySettings.two_factor_enabled ? (
                      <>
                        <Badge className="bg-emerald-100 text-emerald-800">Đã bật</Badge>
                        <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700" onClick={handleDisable2FA}>
                          Tắt 2FA
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => setShow2FADialog(true)}>
                        Bật 2FA
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Cảnh báo đăng nhập</span>
                    </Label>
                    <p className="text-sm text-slate-600">Nhận thông báo khi có đăng nhập mới</p>
                  </div>
                  <Switch
                    checked={securitySettings.login_alerts}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, login_alerts: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Thời gian hết phiên (phút)</Label>
                  <Select
                    value={securitySettings.session_timeout.toString()}
                    onValueChange={(value) => 
                      setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 phút</SelectItem>
                      <SelectItem value="30">30 phút</SelectItem>
                      <SelectItem value="60">1 giờ</SelectItem>
                      <SelectItem value="120">2 giờ</SelectItem>
                      <SelectItem value="480">8 giờ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <span>Tự động đăng xuất</span>
                    </Label>
                    <p className="text-sm text-slate-600">Tự động đăng xuất khi không hoạt động</p>
                  </div>
                  <Switch
                    checked={securitySettings.auto_logout}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, auto_logout: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-emerald-600" />
                  <span>Đổi mật khẩu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      className={errors.current_password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.current_password && (
                    <p className="text-sm text-red-600">{errors.current_password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className={errors.new_password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.new_password && (
                    <p className="text-sm text-red-600">{errors.new_password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className={errors.confirm_password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={loading} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Advanced Security */}
          <motion.div {...fadeInUp} className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>Kiểm soát truy cập</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Danh sách IP cho phép</span>
                    </Label>
                    <p className="text-sm text-slate-600">Chỉ cho phép truy cập từ các địa chỉ IP này</p>
                  </div>
                  <Switch
                    checked={securitySettings.ip_whitelist_enabled}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, ip_whitelist_enabled: checked }))
                    }
                  />
                </div>

                {securitySettings.ip_whitelist_enabled && (
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Nhập địa chỉ IP (vd: 192.168.1.1)"
                        value={newIPAddress}
                        onChange={(e) => setNewIPAddress(e.target.value)}
                      />
                      <Button onClick={addIPAddress} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        Thêm
                      </Button>
                    </div>
                    
                    {securitySettings.ip_whitelist.length > 0 && (
                      <div className="space-y-2">
                        <Label>Danh sách IP đã thêm</Label>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {securitySettings.ip_whitelist.map((ip, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <span className="text-sm font-mono">{ip}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeIPAddress(ip)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Xóa
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <Label>Giới hạn số lần đăng nhập sai</Label>
                  <Select
                    value={securitySettings.login_attempts_limit.toString()}
                    onValueChange={(value) => 
                      setSecuritySettings(prev => ({ ...prev, login_attempts_limit: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 lần</SelectItem>
                      <SelectItem value="5">5 lần</SelectItem>
                      <SelectItem value="10">10 lần</SelectItem>
                      <SelectItem value="0">Không giới hạn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Thời gian khóa tài khoản (phút)</Label>
                  <Select
                    value={securitySettings.account_lockout_duration.toString()}
                    onValueChange={(value) => {
                      setSecuritySettings(prev => ({ ...prev, account_lockout_duration: parseInt(value) }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 phút</SelectItem>
                      <SelectItem value="15">15 phút</SelectItem>
                      <SelectItem value="30">30 phút</SelectItem>
                      <SelectItem value="60">1 giờ</SelectItem>
                      <SelectItem value="1440">24 giờ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Audit & Monitoring */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-purple-600" />
                  <span>Giám sát & nhật ký</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span>Ghi lại phiên đăng nhập</span>
                    </Label>
                    <p className="text-sm text-slate-600">Lưu lại hoạt động người dùng để kiểm tra bảo mật</p>
                  </div>
                  <Switch
                    checked={securitySettings.enable_session_recording}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, enable_session_recording: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Thời gian lưu nhật ký (ngày)</Label>
                  <Select
                    value={securitySettings.audit_log_retention.toString()}
                    onValueChange={(value) => 
                      setSecuritySettings(prev => ({ ...prev, audit_log_retention: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                      <SelectItem value="365">1 năm</SelectItem>
                      <SelectItem value="-1">Vĩnh viễn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div {...fadeInUp} className="mt-8">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <Button 
                onClick={handleSecuritySettingsUpdate} 
                disabled={loading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu cài đặt bảo mật
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div {...fadeInUp} className="mt-8">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Khuyến nghị bảo mật:</strong> Hãy bật xác thực 2 lớp, sử dụng mật khẩu mạnh và thường xuyên kiểm tra lại cài đặt bảo mật. Nếu bạn truy cập từ địa chỉ cố định, hãy bật danh sách IP cho phép.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Kích hoạt xác thực 2 lớp (2FA)</span>
            </DialogTitle>
            <DialogDescription>
              Quét mã QR này bằng ứng dụng xác thực và nhập mã xác minh bên dưới.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
              <div className="w-32 h-32 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                <QrCode className="h-16 w-16 text-slate-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="2fa_code">Mã xác minh</Label>
              <Input
                id="2fa_code"
                placeholder="Nhập mã 6 số"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => setShow2FADialog(false)}>
              Hủy
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={handleEnable2FA} disabled={loading || twoFactorCode.length !== 6}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Kích hoạt 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecuritySettingsPage;
