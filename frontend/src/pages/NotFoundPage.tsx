import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Home,
  ArrowLeft,
  Search,
  Camera,
  Users,
  Settings,
  HelpCircle,
  RefreshCw,
  MapPin,
  Compass,
  Star,
  Phone,
  Shield,
  BarChart3,
  Layers,
  DollarSign,
  LogIn,
  Monitor,
  FileText,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      if (user?.is_admin) {
        navigate('/admin'); // ✅ Admin dashboard
      } else {
        navigate('/app/dashboard'); // ✅ User dashboard
      }
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleGoHome();
    }
  };


  const quickActions = isAuthenticated ? (
    user?.is_admin ? [
      { label: 'Trang quản trị', icon: <Crown className="h-4 w-4" />, path: '/app/admin' },
      { label: 'Quản lý người dùng', icon: <Users className="h-4 w-4" />, path: '/app/admin/users' },
      { label: 'Giám sát hệ thống', icon: <Monitor className="h-4 w-4" />, path: '/app/admin/monitoring' },
      { label: 'Nhật ký hệ thống', icon: <FileText className="h-4 w-4" />, path: '/app/admin/logs' },
      { label: 'Bảng điều khiển người dùng', icon: <Home className="h-4 w-4" />, path: '/app/dashboard' },
      { label: 'Cài đặt', icon: <Settings className="h-4 w-4" />, path: '/app/settings' },
      { label: 'Trợ giúp', icon: <HelpCircle className="h-4 w-4" />, path: '/app/help' }
    ] : [
      { label: 'Bảng điều khiển', icon: <Home className="h-4 w-4" />, path: '/app/dashboard' },
      { label: 'Camera', icon: <Camera className="h-4 w-4" />, path: '/app/cameras' },
      { label: 'Người đã biết', icon: <Users className="h-4 w-4" />, path: '/app/persons' },
      { label: 'Nhận diện', icon: <Shield className="h-4 w-4" />, path: '/app/detections' },
      { label: 'Phân tích', icon: <BarChart3 className="h-4 w-4" />, path: '/app/analytics' },
      { label: 'Cài đặt', icon: <Settings className="h-4 w-4" />, path: '/app/settings' },
      { label: 'Trợ giúp', icon: <HelpCircle className="h-4 w-4" />, path: '/app/help' }
    ]
  ) : [
    { label: 'Trang chủ', icon: <Home className="h-4 w-4" />, path: '/' },
    { label: 'Tính năng', icon: <Star className="h-4 w-4" />, path: '/features' },
    { label: 'Liên hệ', icon: <Phone className="h-4 w-4" />, path: '/contact' },
    { label: 'Đăng nhập', icon: <LogIn className="h-4 w-4" />, path: '/login' },
    { label: 'Trợ giúp', icon: <HelpCircle className="h-4 w-4" />, path: '/help' }
  ];
  

  const animationVariants = {
    container: {
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.6,
          staggerChildren: 0.1
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-2xl w-full text-center space-y-8"
        variants={animationVariants.container}
        initial="initial"
        animate="animate"
      >
        {/* 404 Illustration */}
        <motion.div variants={animationVariants.item} className="relative">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-full"></div>
            <AlertTriangle className="w-16 h-16 text-white z-10" />
            
            {/* Floating elements */}
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
          
          {/* 404 Text */}
          <motion.div 
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            variants={animationVariants.item}
          >
            404
          </motion.div>
        </motion.div>

        {/* Error Message */}
        <motion.div variants={animationVariants.item} className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Ôi! Không tìm thấy trang
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang vị trí khác.
          </p>
          {/* Current path info */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">
              {location.pathname}
            </code>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={animationVariants.item} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleGoHome} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Home className="h-4 w-4 mr-2" />
            {isAuthenticated ? 'Về trang chính' : 'Về trang chủ'}
          </Button>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại trang
          </Button>
        </motion.div>

        {/* Quick Navigation */}
        <motion.div variants={animationVariants.item}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <Compass className="h-5 w-5 text-blue-600" />
                <span>Điều hướng nhanh</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50"
                    onClick={() => navigate(action.path)}
                  >
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div variants={animationVariants.item} className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cần trợ giúp?</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ đội ngũ hỗ trợ hoặc xem tài liệu trợ giúp của chúng tôi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/help')}>
              <Search className="h-4 w-4 mr-2" />
              Xem bài viết trợ giúp
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = 'mailto:support@safeface.ai'}>
              Liên hệ hỗ trợ
            </Button>
          </div>
        </motion.div>

        {/* User Info (if authenticated) */}
        {isAuthenticated && user && (
          <motion.div variants={animationVariants.item}>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>Đăng nhập với tư cách</span>
              <Badge variant="outline">
                {user.full_name || user.username}
              </Badge>
              {user.is_admin && (
                <Badge variant="default" className="bg-red-600">
                  Quản trị viên
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div variants={animationVariants.item} className="text-xs text-gray-400">
          <p>© 2024 SafeFace AI Technologies. Đã đăng ký bản quyền.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;