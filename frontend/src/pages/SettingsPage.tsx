import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  User, Bell, Shield, Mail, Smartphone, Save, Eye, EyeOff, AlertCircle,
  Camera, Brain, Upload, Lock, Key, RefreshCw, Monitor, Volume2, VolumeX,
  Wifi, Users, ExternalLink, QrCode, Target, Zap,
  Moon, Sun, Laptop, Globe, Clock
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

// Interfaces cho SafeFace project
interface ProfileFormData {
  full_name: string;
  email: string;
  username: string;
  phone: string;
  location: string;
  bio: string;
  website: string;
  job_title: string;
  company: string;
  timezone: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  web_notifications: boolean;
  detection_alerts: boolean;
  stranger_alerts: boolean;
  known_person_alerts: boolean;
  camera_offline_alerts: boolean;
  system_alerts: boolean;
  alert_sound: boolean;
  webhook_url: string;
  webhook_enabled: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
}

interface FaceRecognitionSettings {
  detection_enabled: boolean;
  confidence_threshold: number;
  save_unknown_faces: boolean;
  anti_spoofing_enabled: boolean;
  real_time_processing: boolean;
}

interface SystemPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  enable_animations: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [qrCode,] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Form States
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: '', email: '', username: '', phone: '', location: '',
    bio: '', website: '', job_title: '', company: '', timezone: 'UTC+7'
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '', new_password: '', confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true, web_notifications: true, detection_alerts: true,
    stranger_alerts: true, known_person_alerts: false, camera_offline_alerts: true,
    system_alerts: true, alert_sound: true, webhook_url: '', webhook_enabled: false
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false, login_alerts: true, session_timeout: 30
  });

  const [faceRecognitionSettings, setFaceRecognitionSettings] = useState<FaceRecognitionSettings>({
    detection_enabled: true, confidence_threshold: 0.8, save_unknown_faces: true,
    anti_spoofing_enabled: true, real_time_processing: true
  });

  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>({
    theme: 'auto', language: 'en', timezone: 'UTC+7', enable_animations: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize data
  useEffect(() => {
    loadUserSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      // Load profile data
      setProfileData({
        full_name: user.full_name || '', email: user.email || '',
        username: user.username || '', phone: user.phone || '',
        location: user.location || '', bio: user.bio || '',
        website: user.website || '', job_title: user.job_title || '',
        company: user.company || '', timezone: user.timezone || 'UTC+7'
      });

      // Load user settings
      const userSettings = await settingsService.getUserSettings();
      
      setNotificationSettings(prev => ({
        ...prev,
        email_notifications: userSettings.email_notifications ?? true,
        web_notifications: userSettings.web_notifications ?? true,
        detection_alerts: userSettings.detection_sensitivity ? userSettings.detection_sensitivity > 0.5 : true,
        alert_sound: userSettings.alert_sound ?? true,
        webhook_url: userSettings.webhook_url || '',
        webhook_enabled: !!userSettings.webhook_url
      }));

      setSystemPreferences(prev => ({
        ...prev,
        theme: userSettings.dark_mode ? 'dark' : 'light',
        language: userSettings.language || 'en',
        timezone: userSettings.timezone || 'UTC+7'
      }));

      setFaceRecognitionSettings(prev => ({
        ...prev,
        detection_enabled: userSettings.face_recognition_enabled ?? true,
        confidence_threshold: userSettings.confidence_threshold || 0.8
      }));

    } catch (error) {
      console.error('Error loading user settings:', error);
      toast.error('Failed to load user settings');
    }
  };

  // Validation
  const validateProfileData = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profileData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!profileData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) newErrors.email = 'Invalid email';
    if (!profileData.username.trim()) newErrors.username = 'Username is required';
    else if (profileData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordData = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.current_password) newErrors.current_password = 'Current password is required';
    if (!passwordData.new_password) newErrors.new_password = 'New password is required';
    else if (passwordData.new_password.length < 6) newErrors.new_password = 'Password must be at least 6 characters';
    if (passwordData.new_password !== passwordData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update handlers
  const handleProfileUpdate = async () => {
    if (!validateProfileData()) return;
    try {
      setLoading(true);
      const updatedProfile = {
        full_name: profileData.full_name, email: profileData.email,
        phone: profileData.phone, location: profileData.location,
        bio: profileData.bio, website: profileData.website,
        job_title: profileData.job_title, company: profileData.company,
        timezone: profileData.timezone
      };
      await userService.updateProfile(updatedProfile);
      await updateUser(updatedProfile);
      toast.success('✅ Profile updated successfully');
      setErrors({});
    } catch (error: any) {
      toast.error('❌ Failed to update profile');
    } finally {
      setLoading(false);
    }
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
      toast.success('🔒 Password changed successfully');
      setErrors({});
    } catch (error: any) {
      toast.error(`❌ ${error.response?.data?.detail || 'Failed to change password'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    try {
      setLoading(true);
      const userSettings: Partial<UserSettings> = {
        email_notifications: notificationSettings.email_notifications,
        web_notifications: notificationSettings.web_notifications,
        detection_sensitivity: notificationSettings.detection_alerts ? 0.8 : 0.3,
        alert_sound: notificationSettings.alert_sound,
        webhook_url: notificationSettings.webhook_enabled ? notificationSettings.webhook_url : ''
      };
      await settingsService.updateUserSettings(userSettings);
      toast.success('🔔 Notification settings updated');
    } catch (error) {
      toast.error('❌ Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemPreferencesUpdate = async () => {
    try {
      setLoading(true);
      const userSettings: Partial<UserSettings> = {
        dark_mode: systemPreferences.theme === 'dark',
        language: systemPreferences.language,
        timezone: systemPreferences.timezone
      };
      await settingsService.updateUserSettings(userSettings);
      toast.success('⚙️ System preferences updated');
    } catch (error) {
      toast.error('❌ Failed to update system preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ Image size must be less than 5MB');
      return;
    }

    try {
      await userService.uploadAvatar(file);
      await updateUser({});
      toast.success('📸 Avatar updated successfully');
    } catch (error) {
      toast.error('❌ Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return { score };
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <motion.div 
        className="max-w-6xl mx-auto space-y-8"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl opacity-90"></div>
          <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Settings</h1>
                <p className="text-blue-100 text-lg">Manage your SafeFace account and preferences</p>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm font-medium">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-orange-600 hover:text-white transition-colors"
              onClick={() => navigate('/dashboard/settings/face-recognition')}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Settings</span>
            </Button>
            <TabsTrigger value="system" className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Picture</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="relative inline-block">
                    <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-lg">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                        {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                      <Camera className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{user?.full_name}</h3>
                    <p className="text-gray-600">@{user?.username}</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      {user?.is_admin ? 'Administrator' : 'User'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button variant="outline" className="w-full" disabled={loading}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Avatar
                      </Button>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 5MB.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information Card */}
              <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, full_name: e.target.value }));
                          if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
                        }}
                        placeholder="Enter your full name"
                        className={errors.full_name ? 'border-red-500' : ''}
                      />
                      {errors.full_name && (
                        <p className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.full_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, username: e.target.value }));
                          if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                        }}
                        placeholder="Choose a username"
                        className={errors.username ? 'border-red-500' : ''}
                      />
                      {errors.username && (
                        <p className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => {
                          setProfileData(prev => ({ ...prev, email: e.target.value }));
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="Enter your email"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+84 123 456 789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={profileData.job_title}
                        onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                        placeholder="Your job title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 text-right">{profileData.bio.length}/500 characters</p>
                  </div>

                  <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Profile Changes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Password Change Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password *</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => {
                          setPasswordData(prev => ({ ...prev, current_password: e.target.value }));
                          if (errors.current_password) setErrors(prev => ({ ...prev, current_password: '' }));
                        }}
                        placeholder="Enter current password"
                        className={`pr-10 ${errors.current_password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.current_password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.current_password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => {
                          setPasswordData(prev => ({ ...prev, new_password: e.target.value }));
                          if (errors.new_password) setErrors(prev => ({ ...prev, new_password: '' }));
                        }}
                        placeholder="Enter new password"
                        className={`pr-10 ${errors.new_password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.new_password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.new_password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => {
                          setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }));
                          if (errors.confirm_password) setErrors(prev => ({ ...prev, confirm_password: '' }));
                        }}
                        placeholder="Confirm new password"
                        className={`pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirm_password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.new_password && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Password Strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score >= 4 ? 'text-green-600' :
                        passwordStrength.score >= 3 ? 'text-yellow-600' :
                        passwordStrength.score >= 2 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.score >= 4 ? 'Strong' :
                         passwordStrength.score >= 3 ? 'Good' :
                         passwordStrength.score >= 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                    <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                  </div>
                )}

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={loading || !passwordData.current_password || !passwordData.new_password || passwordStrength.score < 3}
                  className="w-full"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Alert Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-orange-600" />
                        <span>Stranger Detection Alerts</span>
                      </Label>
                      <p className="text-sm text-gray-600">Get notified when unknown faces are detected</p>
                    </div>
                    <Switch
                      checked={notificationSettings.stranger_alerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, stranger_alerts: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span>Known Person Alerts</span>
                      </Label>
                      <p className="text-sm text-gray-600">Get notified when recognized faces are detected</p>
                    </div>
                    <Switch
                      checked={notificationSettings.known_person_alerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, known_person_alerts: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Camera Offline Alerts</span>
                      </Label>
                      <p className="text-sm text-gray-600">Get notified when cameras go offline</p>
                    </div>
                    <Switch
                      checked={notificationSettings.camera_offline_alerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, camera_offline_alerts: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        {notificationSettings.alert_sound ? 
                          <Volume2 className="w-4 h-4 text-blue-600" /> : 
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        }
                        <span>Alert Sound</span>
                      </Label>
                      <p className="text-sm text-gray-600">Play sound for alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.alert_sound}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, alert_sound: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Delivery Methods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Notifications</span>
                      </Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Web Notifications</span>
                      </Label>
                      <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={notificationSettings.web_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, web_notifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4" />
                          <span>Webhook Integration</span>
                        </Label>
                        <p className="text-sm text-gray-600">Send alerts to external webhook URL</p>
                      </div>
                      <Switch
                        checked={notificationSettings.webhook_enabled}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, webhook_enabled: checked }))
                        }
                      />
                    </div>

                    {notificationSettings.webhook_enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="webhook_url">Webhook URL</Label>
                        <Input
                          id="webhook_url"
                          value={notificationSettings.webhook_url}
                          onChange={(e) => 
                            setNotificationSettings(prev => ({ ...prev, webhook_url: e.target.value }))
                          }
                          placeholder="https://your-webhook-url.com/endpoint"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <Button onClick={handleNotificationSettingsUpdate} disabled={loading} className="w-full">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Authentication</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4" />
                        <span>Two-Factor Authentication</span>
                      </Label>
                      <p className="text-sm text-gray-600">Add extra security with 2FA</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {securitySettings.two_factor_enabled ? (
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      ) : (
                        <Button size="sm" onClick={() => setShow2FADialog(true)}>
                          Enable 2FA
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified of new logins</p>
                    </div>
                    <Switch
                      checked={securitySettings.login_alerts}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, login_alerts: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={securitySettings.session_timeout}
                      onChange={(e) => 
                        setSecuritySettings(prev => ({ 
                          ...prev, 
                          session_timeout: Math.max(5, parseInt(e.target.value) || 30) 
                        }))
                      }
                      min="5"
                      max="480"
                    />
                    <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Current session</p>
                          <p className="text-xs text-gray-500">Chrome • Windows</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Active</p>
                        <p className="text-xs text-gray-500">Now</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Previous session</p>
                          <p className="text-xs text-gray-500">Safari • iPhone</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Yesterday</p>
                        <p className="text-xs text-gray-500">18:30</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Preferences Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={systemPreferences.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => 
                      setSystemPreferences(prev => ({ ...prev, theme: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center space-x-2">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="auto">
                          <div className="flex items-center space-x-2">
                            <Laptop className="h-4 w-4" />
                            <span>System</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={systemPreferences.language} onValueChange={(value) => 
                      setSystemPreferences(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Animations</Label>
                      <p className="text-sm text-gray-600">Use smooth animations and transitions</p>
                    </div>
                    <Switch
                      checked={systemPreferences.enable_animations}
                      onCheckedChange={(checked) => 
                        setSystemPreferences(prev => ({ ...prev, enable_animations: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Regional Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={systemPreferences.timezone} onValueChange={(value) => 
                      setSystemPreferences(prev => ({ ...prev, timezone: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC+7">UTC+7 (Vietnam)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT)</SelectItem>
                        <SelectItem value="UTC-8">UTC-8 (PST)</SelectItem>
                        <SelectItem value="UTC-5">UTC-5 (EST)</SelectItem>
                        <SelectItem value="UTC+1">UTC+1 (CET)</SelectItem>
                        <SelectItem value="UTC+8">UTC+8 (Singapore)</SelectItem>
                        <SelectItem value="UTC+9">UTC+9 (Japan)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      Changes to language and timezone will take effect after page reload.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <Button onClick={handleSystemPreferencesUpdate} disabled={loading} className="w-full">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save System Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Scan the QR code with your authenticator app and enter the verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {qrCode && (
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              <div className="w-full space-y-2">
                <Label htmlFor="2fa_code">Verification Code</Label>
                <Input
                  id="2fa_code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setSecuritySettings(prev => ({ ...prev, two_factor_enabled: true }));
                  setShow2FADialog(false);
                  setTwoFactorCode('');
                  toast.success('🔐 Two-factor authentication enabled');
                }}
                disabled={!twoFactorCode || twoFactorCode.length !== 6}
              >
                Verify & Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default SettingsPage;