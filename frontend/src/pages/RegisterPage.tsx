import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Mail, 
  UserPlus, 
  CheckCircle,
  AlertTriangle,
  Phone,
  Building
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SafeFaceLogo from '@/assets/images/Logo.png';

// ✅ FIX: Interface để match với backend UserCreate từ #backend
interface RegisterFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  department?: string;
  role: 'user' | 'admin'; // ✅ Thêm role field từ backend
}

interface FormErrors {
  [key: string]: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ✅ FIX: Enhanced form data với proper typing và default values
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    role: 'user' // ✅ Default role
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: 'gray'
  });

  // ✅ Enhanced input change handler với password strength
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // ✅ Check password strength real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // ✅ Enhanced password strength checker
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = '';
    let color = 'red';

    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak password';
        color = 'red';
        break;
      case 2:
        feedback = 'Weak password';
        color = 'orange';
        break;
      case 3:
        feedback = 'Fair password';
        color = 'yellow';
        break;
      case 4:
        feedback = 'Good password';
        color = 'blue';
        break;
      case 5:
        feedback = 'Strong password';
        color = 'green';
        break;
      default:
        feedback = '';
        color = 'gray';
    }

    setPasswordStrength({ score, feedback, color });
  };

  // ✅ Enhanced form validation với chi tiết hơn
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email must be less than 255 characters';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    } else if (formData.full_name.length > 100) {
      newErrors.full_name = 'Full name must be less than 100 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Please use a stronger password';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional)
    if (formData.phone && formData.phone.trim()) {
      if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Enhanced submit handler với better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔵 RegisterPage: Attempting to register user...');
      
      // ✅ FIX: Prepare data theo backend UserCreate schema từ #backend
      const registerData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        full_name: formData.full_name.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        department: formData.department?.trim() || undefined,
        role: formData.role
      };

      console.log('📤 RegisterPage: Sending registration data:', { 
        ...registerData, 
        password: '[HIDDEN]' 
      });
      
      // ✅ Call auth service với correct data structure
      const result = await authService.register(registerData);
      console.log('✅ RegisterPage: Registration successful:', result);
      
      // ✅ Enhanced success handling
      toast.success(
        'Account created successfully! Welcome to SafeFace!', 
        {
          duration: 5000,
          description: 'You can now sign in with your credentials'
        }
      );
      
      // ✅ Navigate với success state
      navigate('/login', { 
        state: { 
          email: formData.email,
          message: 'Registration successful! Please sign in.'
        }
      });
      
    } catch (error: any) {
      console.error('❌ RegisterPage: Registration failed:', error);
      
      // ✅ Enhanced error handling dựa trên backend response
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.detail) {
        // Backend trả về detail message
        errorMessage = error.response.data.detail;
        
        // Handle specific backend errors từ #backend/app/services/auth_service.py
        if (errorMessage.includes('already registered')) {
          if (errorMessage.includes('username')) {
            setErrors({ username: 'This username is already taken' });
          } else if (errorMessage.includes('email')) {
            setErrors({ email: 'This email is already registered' });
          } else {
            setErrors({ submit: 'Username or email already exists' });
          }
        } else {
          setErrors({ submit: errorMessage });
        }
      } else if (error.message) {
        errorMessage = error.message;
        setErrors({ submit: errorMessage });
      } else {
        setErrors({ submit: 'Network error. Please check your connection.' });
      }
      
      toast.error(errorMessage, {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Password strength bar component
  const PasswordStrengthBar = () => {
    if (!formData.password) return null;
    
    const getBarColor = () => {
      switch (passwordStrength.color) {
        case 'red': return 'bg-red-500';
        case 'orange': return 'bg-orange-500';
        case 'yellow': return 'bg-yellow-500';
        case 'blue': return 'bg-blue-500';
        case 'green': return 'bg-green-500';
        default: return 'bg-gray-300';
      }
    };

    return (
      <div className="mt-2">
        <div className="flex space-x-1 mb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i <= passwordStrength.score ? getBarColor() : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs text-${passwordStrength.color}-600`}>
          {passwordStrength.feedback}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Custom Asymmetric Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Irregular background sections */}
        <div className="absolute top-0 right-0 w-3/5 h-full bg-gradient-to-bl from-teal-50 to-emerald-50 transform -skew-x-12"></div>
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-gradient-to-tr from-cyan-50 to-teal-50 transform skew-y-6 rounded-tr-[5rem]"></div>
        <div className="absolute top-1/4 left-1/3 w-1/4 h-1/3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full transform rotate-45"></div>
        
        {/* Organic decorative shapes */}
        <div className="absolute top-16 right-16 w-28 h-36 bg-teal-100/40 rounded-full transform -rotate-12"></div>
        <div className="absolute top-2/3 left-20 w-32 h-24 bg-emerald-100/30 transform skew-x-12 rounded-3xl"></div>
        <div className="absolute bottom-24 right-32 w-20 h-28 bg-cyan-100/50 rounded-full transform rotate-24"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-20 bg-teal-100/40 transform -skew-y-12 rounded-2xl"></div>
        
        {/* Scattered geometric elements */}
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-teal-300 rounded-full"></div>
        <div className="absolute bottom-1/2 right-1/3 w-2 h-2 bg-emerald-300 rounded-full"></div>
        <div className="absolute top-3/4 left-1/2 w-4 h-4 bg-cyan-300 transform rotate-45"></div>
        <div className="absolute bottom-1/4 left-3/4 w-1.5 h-1.5 bg-teal-300 rounded-full"></div>
        
        {/* Irregular grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgb(20, 184, 166) 35px, rgb(20, 184, 166) 36px)`,
          }}></div>
        </div>
      </div>

      {/* Left Side - Enhanced Branding */}
      <motion.div 
        className="hidden lg:flex lg:w-2/5 relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Custom background for left side */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm transform skew-x-3 shadow-2xl">
          {/* Organic decorative elements inside */}
          <div className="absolute top-20 left-8 w-20 h-28 bg-teal-100/20 transform -rotate-12 rounded-2xl"></div>
          <div className="absolute bottom-32 right-12 w-24 h-16 bg-emerald-100/30 transform rotate-6 rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-20 bg-cyan-100/25 transform skew-y-6 rounded-xl"></div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-teal-100/40 to-transparent rounded-br-[2rem]"></div>
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-gradient-to-tl from-emerald-100/30 to-transparent rounded-tl-[3rem]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-10 w-full transform -skew-x-3">
          {/* Enhanced Logo Section */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-teal-100 to-emerald-100 p-3">
              <img 
                src={SafeFaceLogo} 
                alt="SafeFace Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-3">
              Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">SafeFace</span>
            </h1>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full">
              <span className="text-teal-700 font-semibold text-sm">🚀 Tạo tài khoản mới</span>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              {
                icon: "🔐",
                title: "Bảo mật tuyệt đối",
                description: "Mã hóa end-to-end và xác thực 2 lớp",
                bgColor: "bg-teal-50",
                borderColor: "border-teal-200"
              },
              {
                icon: "⚡",
                title: "Khởi tạo nhanh chóng", 
                description: "Thiết lập tài khoản chỉ trong 2 phút",
                bgColor: "bg-emerald-50",
                borderColor: "border-emerald-200"
              },
              {
                icon: "🎯",
                title: "Trải nghiệm cá nhân hóa",
                description: "Dashboard tùy chỉnh theo nhu cầu",
                bgColor: "bg-cyan-50",
                borderColor: "border-cyan-200"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className={`${feature.bgColor} p-4 rounded-2xl border ${feature.borderColor} group hover:shadow-md transition-all duration-300`}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>99.9% Uptime</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>ISO 27001</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>GDPR Ready</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Hơn 10,000+ người dùng tin tưởng SafeFace
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 relative z-10">
        {/* Background decoration for form area */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-12 w-14 h-18 bg-teal-100/20 transform rotate-12 rounded-xl"></div>
          <div className="absolute bottom-1/4 right-16 w-16 h-12 bg-emerald-100/30 transform -rotate-6 rounded-2xl"></div>
          <div className="absolute top-1/6 right-1/3 w-10 h-14 bg-cyan-100/25 transform skew-x-12 rounded-lg"></div>
        </div>
        
        <motion.div 
          className="w-full max-w-lg relative z-10"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Enhanced Header with Vietnamese */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-18 h-18 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl mb-4 shadow-xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <UserPlus className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng ký tài khoản
            </h1>
            <p className="text-gray-600">Tham gia cộng đồng SafeFace ngay hôm nay</p>
          </div>

          {/* Enhanced Card với asymmetric design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden relative">
              {/* Asymmetric decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100/30 to-transparent rounded-bl-[4rem]"></div>
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-tr-[3rem]"></div>
              <div className="absolute top-1/3 right-8 w-6 h-8 bg-teal-200/20 transform -rotate-12 rounded-lg"></div>
              <div className="absolute bottom-1/4 left-12 w-8 h-6 bg-emerald-200/30 transform rotate-45 rounded-full"></div>
              
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-teal-200/50">
                  <Lock className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Tạo tài khoản</CardTitle>
                <p className="text-gray-600 text-sm mt-2">Điền thông tin để bắt đầu</p>
              </CardHeader>

              <CardContent className="space-y-5 relative z-10">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Enhanced Error Alert */}
                  {errors.submit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {errors.submit}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Chọn tên đăng nhập duy nhất"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`pl-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.username 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                        autoComplete="username"
                      />
                    </div>
                    {errors.username && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.username}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Nhập địa chỉ email của bạn"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.email}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className={`pl-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.full_name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                        autoComplete="name"
                      />
                    </div>
                    {errors.full_name && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.full_name}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Additional Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone Field */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Số điện thoại
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+84..."
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`pl-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                            errors.phone 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                          }`}
                          disabled={loading}
                          autoComplete="tel"
                        />
                      </div>
                      {errors.phone && (
                        <motion.p 
                          className="text-sm text-red-600 flex items-center space-x-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>{errors.phone}</span>
                        </motion.p>
                      )}
                    </div>

                    {/* Department Field */}
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                        Phòng ban
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="department"
                          name="department"
                          type="text"
                          placeholder="IT, Bảo vệ, v.v."
                          value={formData.department}
                          onChange={handleInputChange}
                          className="pl-10 h-12 rounded-xl border-2 transition-all duration-300 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tạo mật khẩu mạnh"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    <PasswordStrengthBar />
                    
                    {errors.password && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.password}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 h-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.confirmPassword 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : formData.confirmPassword && formData.password === formData.confirmPassword
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'
                        }`}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className="flex items-center text-xs">
                        {formData.password === formData.confirmPassword ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mật khẩu khớp
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Mật khẩu không khớp
                          </div>
                        )}
                      </div>
                    )}
                    
                    {errors.confirmPassword && (
                      <motion.p 
                        className="text-sm text-red-600 flex items-center space-x-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.confirmPassword}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <input 
                      type="checkbox" 
                      id="terms"
                      className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                      required 
                      disabled={loading}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                      Tôi đồng ý với{' '}
                      <Link to="/terms" className="text-teal-600 hover:text-teal-800 underline font-medium">
                        Điều khoản dịch vụ
                      </Link>{' '}
                      và{' '}
                      <Link to="/privacy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                        Chính sách bảo mật
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Đang tạo tài khoản...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4" />
                        <span>Tạo tài khoản</span>
                      </div>
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Đã có tài khoản?{' '}
                      <Link 
                        to="/login" 
                        className="text-teal-600 hover:text-teal-800 underline font-medium transition-colors"
                      >
                        Đăng nhập tại đây
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Footer */}
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Mã hóa SSL 256-bit</span>
                </div>
                <div className="w-px h-3 bg-gray-300"></div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Dữ liệu bảo mật</span>
                </div>
                <div className="w-px h-3 bg-gray-300"></div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>GDPR Tuân thủ</span>
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
  );
};

export default RegisterPage;