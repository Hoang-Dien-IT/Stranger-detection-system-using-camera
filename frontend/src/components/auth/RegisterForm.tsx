import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Lock,
  Check,
  X,
  Info
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface RegisterFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'bg-gray-200'
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const navigate = useNavigate();

  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }
    
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    let color = 'bg-red-500';
    if (score >= 4) color = 'bg-green-500';
    else if (score >= 3) color = 'bg-yellow-500';
    else if (score >= 2) color = 'bg-orange-500';

    return { score, feedback, color };
  };

  // ✅ FIX: Enhanced debounced availability check functions
  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await authService.checkUsernameAvailability(username);
        setUsernameAvailable(response.available);
      } catch (error) {
        console.error('❌ RegisterForm: Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    },
    []
  );

  const checkEmailAvailability = useCallback(
    async (email: string) => {
      if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await authService.checkEmailAvailability(email);
        setEmailAvailable(response.available);
      } catch (error) {
        console.error('❌ RegisterForm: Error checking email:', error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    },
    []
  );

  // ✅ FIX: Debounced effect hooks for availability checks
  useEffect(() => {
    if (formData.username.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [formData.username, checkUsernameAvailability]);

  useEffect(() => {
    if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(formData.email);
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailAvailable(null);
    }
  }, [formData.email, checkEmailAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // Reset availability states immediately when values change
    if (name === 'username') {
      setUsernameAvailable(null);
    }

    if (name === 'email') {
      setEmailAvailable(null);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<RegisterFormData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Tên đăng nhập phải nhỏ hơn 50 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Tên đăng nhập đã được sử dụng';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    } else if (emailAvailable === false) {
      newErrors.email = 'Email đã được đăng ký';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Vui lòng nhập họ và tên';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (formData.full_name.length > 100) {
      newErrors.full_name = 'Họ và tên phải nhỏ hơn 100 ký tự';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Mật khẩu quá yếu. Vui lòng tăng cường bảo mật.';
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Wait for availability checks to complete
    if (checkingUsername || checkingEmail) {
      toast.info('Vui lòng chờ kiểm tra hợp lệ hoàn tất');
      return;
    }

    setLoading(true);
    try {
      console.log('🔵 RegisterForm: Submitting registration...');
      
      // ✅ FIX: Enhanced registration data matching backend UserCreate from #backend
      await authService.register({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        role: 'user', // Default role based on backend
        phone: undefined, // Optional field
        department: undefined, // Optional field
      });
      
      console.log('✅ RegisterForm: Registration successful');
      toast.success(
        'Tạo tài khoản thành công!', 
        {
          duration: 5000,
          description: 'Chào mừng bạn đến với SafeFace! Bạn có thể đăng nhập ngay.'
        }
      );
      
      // Navigate to login with success message
      navigate('/login', { 
        state: { 
          email: formData.email,
          message: 'Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản vừa tạo.'
        }
      });
      
    } catch (error: any) {
      console.error('❌ RegisterForm: Registration failed:', error);
      
      // ✅ FIX: Enhanced error handling based on backend response from #backend
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        
        // Handle specific backend errors from auth_service.py
        if (errorMessage.includes('already registered')) {
          if (errorMessage.includes('username')) {
            setErrors({ username: 'Tên đăng nhập đã được sử dụng' });
          } else if (errorMessage.includes('email')) {
            setErrors({ email: 'Email đã được đăng ký' });
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle field-specific errors
      if (error.response?.data?.field_errors) {
        setErrors(error.response.data.field_errors);
      }
      
      toast.error(errorMessage, {
        description: 'Vui lòng kiểm tra lại thông tin và thử lại'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1: return 'Rất yếu';
      case 2: return 'Yếu';
      case 3: return 'Trung bình';
      case 4: return 'Tốt';
      case 5: return 'Mạnh';
      default: return 'Rất yếu';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Tạo tài khoản
            </CardTitle>
            <CardDescription className="text-gray-600">
              Đăng ký tài khoản SafeFace - Hệ thống nhận diện khuôn mặt
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Chọn tên đăng nhập"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 pr-10 ${
                    errors.username ? 'border-red-500' : 
                    usernameAvailable === true ? 'border-green-500' :
                    usernameAvailable === false ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-3">
                  {checkingUsername ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : usernameAvailable === false ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              {errors.username && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.username}
                </p>
              )}
              {usernameAvailable === true && !errors.username && (
                <p className="text-sm text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tên đăng nhập khả dụng
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Địa chỉ email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 pr-10 ${
                    errors.email ? 'border-red-500' : 
                    emailAvailable === true ? 'border-green-500' :
                    emailAvailable === false ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-3">
                  {checkingEmail ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : emailAvailable === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : emailAvailable === false ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.email}
                </p>
              )}
              {emailAvailable === true && !errors.email && (
                <p className="text-sm text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Email khả dụng
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 ${errors.full_name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-full rounded transition-all ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Độ mạnh: {getStrengthLabel(passwordStrength.score)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {passwordStrength.score}/5
                    </p>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Thiếu: {passwordStrength.feedback.join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {formData.confirm_password && formData.password === formData.confirm_password && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Mật khẩu khớp</span>
                </div>
              )}
              
              {errors.confirm_password && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.confirm_password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={
                loading || 
                usernameAvailable === false || 
                emailAvailable === false ||
                checkingUsername ||
                checkingEmail ||
                passwordStrength.score < 3
              }
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo tài khoản</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <Separator />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>

            {/* ✅ FIX: Development notice */}
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                <strong>Lưu ý:</strong> Việc kiểm tra tên đăng nhập và email hiện chỉ là mô phỏng. 
                Một số tên như 'admin', 'test', 'demo' được giữ lại cho mục đích thử nghiệm.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;