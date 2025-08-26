import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  LogIn, 
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SafeFaceLogo from '@/assets/images/Logo.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [rememberMe, setRememberMe] = useState(false);

  // Demo credentials
  const demoCredentials = [
    { username: 'user1', password: 'user12345678', role: 'User' },
    { username: 'admin', password: 'admin123', role: 'Admin' }
  ];

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('🔄 LoginPage: User already authenticated, redirecting...');
      const from = location.state?.from?.pathname;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.is_admin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/app/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      console.log('🔐 LoginPage: Submitting login form:', formData.username);
      
      const response = await login(formData);
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

      toast.success('🎉 Login successful! Welcome to SafeFace', {
        description: 'Redirecting to your dashboard...',
        duration: 3000
      });

      // Role-based redirect after login
      setTimeout(() => {
        const from = location.state?.from?.pathname;
        
        if (from) {
          navigate(from, { replace: true });
        } else {
          if (response?.user?.is_admin) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/app/dashboard', { replace: true });
          }
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ LoginPage: Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // ✅ FIX: Properly handle error response
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          // Handle FastAPI error format
          if (Array.isArray(error.response.data.detail)) {
            // Handle validation errors
            const validationErrors = error.response.data.detail.map((err: any) => {
              return `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`;
            }).join(', ');
            errorMessage = validationErrors;
          } else {
            errorMessage = error.response.data.detail;
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check your username and password format';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
      
      toast.error('❌ Login failed', {
        description: errorMessage,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demo: typeof demoCredentials[0]) => {
    setFormData({
      username: demo.username,
      password: demo.password
    });
    setErrors({});
    toast.info(`🎭 Demo credentials filled for ${demo.role}`, {
      description: 'Click Sign In to continue'
    });
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Custom background for loading */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-br from-slate-50 to-gray-100 transform skew-x-12"></div>
          <div className="absolute top-20 right-20 w-32 h-40 bg-teal-100/40 rounded-full transform rotate-45"></div>
          <div className="absolute bottom-32 left-32 w-24 h-32 bg-emerald-100/30 rounded-full transform -rotate-12"></div>
        </div>
        
        <div className="text-center space-y-6 max-w-md mx-auto px-6 relative z-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* SafeFace Logo */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={SafeFaceLogo} 
                alt="SafeFace Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              SafeFace
            </h1>
          </div>

          <div className="relative">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 animate-ping">
              <div className="w-12 h-12 border-2 border-teal-400 rounded-full opacity-20 mx-auto"></div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Đang kiểm tra xác thực
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Vui lòng đợi trong khi chúng tôi xác minh phiên của bạn...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Custom Background with Organic Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Asymmetric background sections */}
        <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-br from-slate-50 to-gray-100 transform skew-x-12"></div>
        <div className="absolute top-0 right-0 w-1/2 h-2/3 bg-gradient-to-bl from-teal-50 to-emerald-50 transform -skew-y-6"></div>
        <div className="absolute bottom-0 left-1/4 w-1/3 h-1/2 bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full transform rotate-12"></div>
        
        {/* Organic decorative shapes */}
        <div className="absolute top-20 left-20 w-32 h-40 bg-teal-100/40 rounded-full transform rotate-45"></div>
        <div className="absolute top-1/3 right-32 w-24 h-32 bg-emerald-100/30 rounded-full transform -rotate-12"></div>
        <div className="absolute bottom-32 right-20 w-40 h-24 bg-cyan-100/50 transform skew-x-12 rounded-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-blue-100/40 rounded-full"></div>
        
        {/* Scattered dots pattern */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-teal-300 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-cyan-300 rounded-full"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-300 rounded-full"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(156, 163, 175) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>
      {/* Left Side - Branding */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Custom background for left side */}
        <div className="absolute inset-0 bg-white rounded-r-[3rem] shadow-2xl">
          {/* Organic decorative elements */}
          <div className="absolute top-10 right-10 w-24 h-32 bg-teal-100/30 transform rotate-12 rounded-3xl"></div>
          <div className="absolute bottom-20 left-10 w-32 h-20 bg-emerald-100/40 transform -rotate-6 rounded-full"></div>
          <div className="absolute top-1/3 left-1/4 w-16 h-24 bg-cyan-100/20 transform skew-y-12 rounded-2xl"></div>
          
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100/50 to-transparent rounded-bl-[3rem]"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-100/30 to-transparent rounded-tr-[4rem]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          {/* SafeFace Logo Import */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
              <img 
                src={SafeFaceLogo} 
                alt="SafeFace Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Brand Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
              Safe<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Face</span>
            </h1>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full">
              <span className="text-teal-700 font-semibold text-sm">🤖 Nhận diện khuôn mặt AI</span>
            </div>
          </div>

          {/* Features with new styling */}
          <div className="space-y-6">
            {[
              {
                icon: <Brain className="h-6 w-6" />,
                title: "Nhận diện thông minh",
                description: "Độ chính xác cao với công nghệ OpenCV",
                color: "teal"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Giám sát thời gian thực",
                description: "Cảnh báo tức thì và theo dõi trực tiếp",
                color: "emerald"
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Truy cập từ xa",
                description: "Quản lý hệ thống từ mọi nơi",
                color: "cyan"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className={`p-3 bg-${feature.color}-100 text-${feature.color}-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10">
        {/* Header with asymmetric design */}
        <div className="flex items-center justify-between p-6 relative">
          {/* Decorative corner element */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-teal-100/30 to-transparent rounded-bl-3xl"></div>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm border border-gray-200/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            {/* Mobile logo with new design */}
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md lg:hidden">
              <img 
                src={SafeFaceLogo} 
                alt="SafeFace Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-gray-900 lg:hidden">SafeFace</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          {/* Background decoration for form area */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-10 w-16 h-20 bg-emerald-100/20 transform -rotate-12 rounded-2xl"></div>
            <div className="absolute bottom-1/3 left-8 w-12 h-16 bg-teal-100/30 transform rotate-45 rounded-full"></div>
          </div>
          
          <motion.div 
            className="w-full max-w-md relative z-10"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
              {/* Card decorative elements */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-100/40 to-transparent rounded-br-3xl"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-emerald-100/30 to-transparent rounded-tl-3xl"></div>
              
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="w-18 h-18 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-gray-100">
                  <Lock className="h-10 w-10 text-teal-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Đăng nhập
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Truy cập bảng điều khiển SafeFace của bạn
                </p>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                {/* Demo Credentials with new styling */}
                <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-semibold text-teal-900">Tài khoản demo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {demoCredentials.map((demo, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials(demo)}
                        className="text-xs bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-300 rounded-xl"
                      >
                        <Badge variant="outline" className="mr-1 text-xs bg-white border-teal-300 text-teal-700">
                          {demo.role}
                        </Badge>
                        Thử {demo.role}
                      </Button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* ✅ FIX: Proper error rendering */}
                  {errors.submit && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {/* ✅ Ensure we render string, not object */}
                          {typeof errors.submit === 'string' ? errors.submit : 'Login failed. Please try again.'}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Tên đăng nhập
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Nhập tên đăng nhập"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`pl-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.username 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                      />
                    </div>
                    {errors.username && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.username}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.password}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Đang đăng nhập...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span>Đăng nhập</span>
                      </div>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white px-2 text-xs text-gray-500">or</span>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Chưa có tài khoản?{' '}
                      <Link 
                        to="/register" 
                        className="text-teal-600 hover:text-teal-800 font-semibold hover:underline transition-colors"
                      >
                        Tạo tài khoản mới
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security Badge with new styling */}
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Mã hóa SSL 256-bit</span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Bảo mật cao</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  © 2025 SafeFace AI Technologies. Tất cả quyền được bảo lưu.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;