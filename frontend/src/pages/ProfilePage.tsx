import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Settings,
  Shield,
  Bell,
  Lock,
  Eye,
  Calendar,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileSettings from '@/components/settings/ProfileSettings';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Đường dẫn base cho avatar (có thể điều chỉnh theo backend)
  const AVATAR_BASE_URL = "http://localhost:8000";
  // Xây dựng src cho avatar
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
  // eslint-disable-next-line no-console
  console.log('Avatar URL:', user?.avatar_url, '-> src:', avatarSrc);

  const handleProfileSave = (data: any) => {
    console.log('Profile saved:', data);
  };

  const getAccountBadge = () => {
    if (user?.is_admin) {
      return <Badge variant="default" className="bg-red-600"><Shield className="w-3 h-3 mr-1" />Quản trị viên</Badge>;
    }
    return <Badge variant="outline" className="border-emerald-400 text-emerald-700"><User className="w-3 h-3 mr-1" />Người dùng</Badge>;
  };

  const getAccountStats = () => {
    const createdDate = user?.created_at ? new Date(user.created_at) : new Date();
    const daysSinceJoined = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
    
    return {
      daysSinceJoined,
      lastLogin: user?.last_login ? new Date(user.last_login) : new Date(),
      accountStatus: user?.is_active ? 'Active' : 'Inactive'
    };
  };

  const stats = getAccountStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 border-b border-emerald-100 px-6 py-4 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại trang chủ
            </Button>
            
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-emerald-600" />
              <div>
                <h1 className="text-xl font-semibold text-emerald-900">Hồ sơ cá nhân</h1>
                <p className="text-sm text-slate-600">Quản lý thông tin và cài đặt tài khoản của bạn</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getAccountBadge()}
            <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50 text-emerald-700" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt hệ thống
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Overview Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Profile Summary Card */}
              <Card className="shadow-md border-emerald-100">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      {/* Avatar hiển thị ảnh nếu có, fallback nếu không */}
                      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-500">
                        <img
                          src={avatarSrc || '/default-avatar.png'}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={e => (e.currentTarget.src = '/default-avatar.png')}
                        />
                        {/* Nếu không có avatar, hiển thị chữ cái đầu */}
                        {!avatarSrc && (
                          <span className="absolute text-white text-2xl font-bold">
                            {user?.full_name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg text-emerald-900">{user?.full_name || 'Người dùng'}</CardTitle>
                  <p className="text-sm text-slate-600">@{user?.username}</p>
                  <div className="flex justify-center mt-2">
                    {getAccountBadge()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  
                  {/* Quick Stats */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Trạng thái tài khoản</span>
                      <Badge variant={user?.is_active ? "default" : "secondary"} className={user?.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}>
                        {user?.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Thành viên từ</span>
                      <span className="font-medium">{stats.daysSinceJoined} ngày</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Đăng nhập gần nhất</span>
                      <span className="font-medium">{stats.lastLogin.toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start border-emerald-300 text-emerald-700">
                      <Lock className="w-4 h-4 mr-2" />
                      Đổi mật khẩu
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start border-emerald-300 text-emerald-700">
                      <Bell className="w-4 h-4 mr-2" />
                      Thông báo
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start border-emerald-300 text-emerald-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Bảo mật & quyền riêng tư
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="shadow-md border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-900">Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {user?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.email}</span>
                    </div>
                  )}
                  
                  {user?.created_at && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Tham gia {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">ID: {user?.id?.slice(0, 8)}...</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card className="shadow-md border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-900">Bảo mật tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Xác thực 2 lớp</span>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">Chưa bật</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Độ mạnh mật khẩu</span>
                    <Badge variant="default" className="bg-emerald-500 text-white">Mạnh</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Phiên đăng nhập</span>
                    <span className="font-medium">1 hoạt động</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Profile Settings */}
          <div className="lg:col-span-3">
            <Card className="shadow-md border-emerald-100">
              <CardHeader>
                <CardTitle className="text-emerald-900">Cài đặt hồ sơ</CardTitle>
                <p className="text-sm text-slate-600">
                  Cập nhật thông tin cá nhân và cài đặt hồ sơ của bạn
                </p>
              </CardHeader>
              <CardContent>
                <ProfileSettings onSave={handleProfileSave} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-8 p-4 bg-white/90 rounded-lg border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-emerald-900">Cần hỗ trợ?</h3>
              <p className="text-sm text-slate-600">Liên hệ đội ngũ SafeFace để được trợ giúp</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => navigate('/help')}>
                Trợ giúp
              </Button>
              <Button variant="outline" className="border-emerald-300 text-emerald-700">
                Liên hệ hỗ trợ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;