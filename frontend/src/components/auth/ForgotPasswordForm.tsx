import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ForgotPasswordFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ForgotPasswordFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // ✅ FIX: Enhanced error handling
      await authService.forgotPassword(formData.email);
      setEmailSent(true);
      toast.success(
        'Gửi email đặt lại mật khẩu thành công', 
        {
          description: 'Vui lòng kiểm tra hộp thư đến và thư rác',
          duration: 5000
        }
      );
      
      // Start countdown for resend button
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ ForgotPasswordForm: Error sending reset email:', error);
      
      // ✅ FIX: Better error handling
      let errorMessage = 'Gửi email đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Set specific error for email field
      if (errorMessage.includes('email') || errorMessage.includes('account') || errorMessage.includes('found')) {
        setErrors({ email: errorMessage });
      }
      
      toast.error(errorMessage, {
        description: 'Vui lòng kiểm tra lại địa chỉ email và thử lại'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await authService.forgotPassword(formData.email);
      toast.success('Đã gửi lại email đặt lại mật khẩu', {
        description: 'Vui lòng kiểm tra hộp thư đến'
      });
      
      // Restart countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ ForgotPasswordForm: Error resending email:', error);
      toast.error('Gửi lại email thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Kiểm tra email của bạn
              </CardTitle>
              <CardDescription className="text-gray-600">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Hướng dẫn đặt lại mật khẩu đã được gửi tới{' '}
                <strong>{formData.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Không nhận được email? Kiểm tra thư rác hoặc{' '}
                {countdown > 0 ? (
                  <span className="text-gray-500 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    vui lòng đợi {countdown}s để gửi lại
                  </span>
                ) : (
                  <button
                    onClick={handleResendEmail}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    {loading ? 'Đang gửi...' : 'gửi lại email'}
                  </button>
                )}
              </p>

              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                  variant="default"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại đăng nhập
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setFormData({ email: '' });
                    setErrors({});
                    setCountdown(0);
                  }}
                  className="w-full"
                >
                  Thử email khác
                </Button>
              </div>
            </div>

            {/* ✅ FIX: Add development notice */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Thông báo phát triển:</strong> Đây là bản demo. 
                Chức năng đặt lại mật khẩu sẽ khả dụng khi backend hoàn thiện.
              </AlertDescription>
            </Alert>

            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Liên kết đặt lại mật khẩu sẽ hết hạn sau 24 giờ vì lý do bảo mật.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Quên mật khẩu?
            </CardTitle>
            <CardDescription className="text-gray-600">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Địa chỉ email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !formData.email.trim()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Gửi liên kết đặt lại</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Quay lại đăng nhập
            </Link>
          </div>

          {/* ✅ FIX: Enhanced alerts */}
          <div className="mt-4 space-y-3">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Nếu bạn chưa có tài khoản,{' '}
                <Link to="/register" className="font-medium underline hover:text-blue-600 transition-colors">
                  đăng ký tại đây
                </Link>
              </AlertDescription>
            </Alert>

            {/* ✅ FIX: Development notice */}
            <Alert className="bg-gray-50 border-gray-200">
              <Info className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-700 text-xs">
                <strong>Lưu ý:</strong> Tính năng này đang được phát triển. 
                Hiện tại, vui lòng liên hệ quản trị viên để đặt lại mật khẩu.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;