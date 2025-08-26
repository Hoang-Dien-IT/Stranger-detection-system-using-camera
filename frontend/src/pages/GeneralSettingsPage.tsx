import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User, Save, Upload, RefreshCw, AlertCircle, ArrowLeft,
  Moon, Sun, Laptop, Globe, Clock, Monitor, Database
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { settingsService, UserSettings } from '@/services/settings.service';
import { userService, UserUpdate } from '@/services/user.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Interfaces
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
}

interface SystemPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  enable_animations: boolean;
  auto_save: boolean;
  show_tooltips: boolean;
  compact_mode: boolean;
}

const GeneralSettingsPage: React.FC = () => {
  // Đường dẫn base cho avatar
  const AVATAR_BASE_URL = "http://localhost:8000";
  const { user, updateUser } = useAuth();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [systemSaved, setSystemSaved] = useState(false);

  // Form States
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    job_title: '',
    company: ''
  });

  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>({
    theme: 'light',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    enable_animations: true,
    auto_save: true,
    show_tooltips: true,
    compact_mode: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        website: user.website || '',
        job_title: user.job_title || '',
        company: user.company || ''
      });
    }
  }, [user]);

  // Load system preferences
  useEffect(() => {
    const loadSystemPreferences = async () => {
      try {
        const settings = await settingsService.getUserSettings();
        setSystemPreferences(prev => ({
          ...prev,
          theme: settings.dark_mode ? 'dark' : 'light',
          language: settings.language || 'vi',
          timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
          enable_animations: true,
          auto_save: true,
          show_tooltips: true,
          compact_mode: false
        }));
      } catch (error) {
        console.error('Error loading system preferences:', error);
      }
    };

    loadSystemPreferences();
  }, []);

  // Validation
  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setLoading(true);
    try {
      const updateData: UserUpdate = {
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        website: profileData.website,
        job_title: profileData.job_title,
        company: profileData.company
      };
      await userService.updateProfile(updateData);
      // Lấy lại user mới nhất từ backend
      const currentUser = await userService.getCurrentUser();
      updateUser(currentUser);
      setProfileSaved(true);
      toast.success('Profile updated successfully');
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle system preferences save
  const handleSaveSystemPreferences = async () => {
    setLoading(true);
    try {
      const userSettings: Partial<UserSettings> = {
        dark_mode: systemPreferences.theme === 'dark',
        language: systemPreferences.language,
        timezone: systemPreferences.timezone
      };
      await settingsService.updateUserSettings(userSettings);
      setSystemSaved(true);
      toast.success('System preferences updated successfully');
      
      setTimeout(() => setSystemSaved(false), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update system preferences');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await userService.uploadAvatar(file);
      if (result.avatar_url) {
        // Update user with new avatar URL
        const currentUser = await userService.getCurrentUser();
        updateUser(currentUser);
        toast.success('Avatar updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/settings')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại cài đặt
            </Button>
            <div className="h-6 border-l border-slate-300" />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">Cài đặt chung</h1>
                <p className="text-sm text-slate-600">Quản lý thông tin cá nhân & tuỳ chọn hệ thống</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <motion.div {...fadeInUp}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold">Thông tin cá nhân</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      {(() => {
                        let avatarSrc: string | undefined = undefined;
                        if (user?.avatar_url) {
                          if (user.avatar_url.startsWith('http')) {
                            avatarSrc = user.avatar_url;
                          } else if (user.avatar_url.startsWith('/uploads/avatars/')) {
                            avatarSrc = AVATAR_BASE_URL + user.avatar_url;
                          } else {
                            avatarSrc = AVATAR_BASE_URL + '/uploads/avatars/' + user.avatar_url;
                          }
                        }
                        // Log kiểm tra giá trị avatar_url
                        // eslint-disable-next-line no-console
                        console.log('Avatar URL:', user?.avatar_url, '-> src:', avatarSrc);
                        // Nếu không có avatar, dùng ảnh mặc định
                        return <AvatarImage src={avatarSrc || '/default-avatar.png'} />;
                      })()}
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold">
                        {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NHD'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user?.full_name || 'Nguyễn Hoàng Diến'}</p>
                    <p className="text-sm text-gray-500">@{user?.username || 'user1'}</p>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        disabled={uploadingAvatar}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-xs text-slate-500 mt-1">Ảnh JPG, PNG hoặc WebP. Tối đa 5MB.</p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-medium">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={errors.full_name ? 'border-red-500' : ''}
                      placeholder="Nguyễn Hoàng Diến"
                    />
                    {errors.full_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-sm font-medium">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      className={errors.username ? 'border-red-500' : ''}
                      placeholder="user1"
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="nguyenhoangdienk@gmail.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="0944779744"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_title" className="text-sm font-medium">Chức vụ</Label>
                    <Input
                      id="job_title"
                      value={profileData.job_title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="AI Engineer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-sm font-medium">Công ty</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Địa chỉ</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Cần Thơ"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium">Giới thiệu</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Giới thiệu về bản thân..."
                    className="min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className={`w-full ${profileSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : profileSaved ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Đã lưu!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thông tin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Preferences */}
          <motion.div {...fadeInUp} className="transition-all duration-300 delay-100">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg font-semibold">Tuỳ chọn hệ thống</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <Label className="text-sm font-medium">Giao diện</Label>
                  </div>
                  <Select 
                    value={systemPreferences.theme} 
                    onValueChange={(value: 'light' | 'dark' | 'auto') => 
                      setSystemPreferences(prev => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4" />
                          <span>Sáng</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center space-x-2">
                          <Moon className="h-4 w-4" />
                          <span>Tối</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">
                        <div className="flex items-center space-x-2">
                          <Laptop className="h-4 w-4" />
                          <span>Hệ thống</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm font-medium">Ngôn ngữ</Label>
                  </div>
                  <Select 
                    value={systemPreferences.language} 
                    onValueChange={(value) => 
                      setSystemPreferences(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="h-4 w-4 text-green-500" />
                    <Label className="text-sm font-medium">Múi giờ</Label>
                  </div>
                  <Select 
                    value={systemPreferences.timezone} 
                    onValueChange={(value) => 
                      setSystemPreferences(prev => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">GMT+7 (Ho Chi Minh)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Tokyo">GMT+9 (Tokyo)</SelectItem>
                      <SelectItem value="America/New_York">GMT-5 (New York)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Switches */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="font-medium">Bật hiệu ứng</Label>
                        <p className="text-xs text-slate-500">Hiển thị hiệu ứng chuyển động mượt mà</p>
                      </div>
                    </div>
                    <Switch
                      checked={systemPreferences.enable_animations}
                      onCheckedChange={(checked) => 
                        setSystemPreferences(prev => ({ ...prev, enable_animations: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="font-medium">Tự động lưu</Label>
                        <p className="text-xs text-slate-500">Tự động lưu thay đổi</p>
                      </div>
                    </div>
                    <Switch
                      checked={systemPreferences.auto_save}
                      onCheckedChange={(checked) => 
                        setSystemPreferences(prev => ({ ...prev, auto_save: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="font-medium">Hiển thị gợi ý</Label>
                        <p className="text-xs text-slate-500">Hiển thị gợi ý khi di chuột</p>
                      </div>
                    </div>
                    <Switch
                      checked={systemPreferences.show_tooltips}
                      onCheckedChange={(checked) => 
                        setSystemPreferences(prev => ({ ...prev, show_tooltips: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="font-medium">Chế độ gọn nhẹ</Label>
                        <p className="text-xs text-slate-500">Giao diện tối giản, tiết kiệm không gian</p>
                      </div>
                    </div>
                    <Switch
                      checked={systemPreferences.compact_mode}
                      onCheckedChange={(checked) => 
                        setSystemPreferences(prev => ({ ...prev, compact_mode: checked }))
                      }
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSystemPreferences}
                  disabled={loading}
                  className={`w-full ${systemSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : systemSaved ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Đã lưu!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu tuỳ chọn hệ thống
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Status Messages */}
        {(profileSaved || systemSaved) && (
          <motion.div 
            {...fadeInUp}
            className="mt-6"
          >
            <Alert className="border-emerald-200 bg-emerald-50">
              <AlertCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Đã lưu cài đặt thành công!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
