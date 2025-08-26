import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Image,
  Building,
  Phone,
  Mail,
  BadgeCheck
} from 'lucide-react';
import { personService } from '@/services/person.service';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FaceImageUpload from './FaceImageUpload';

interface PersonFormData {
  name: string;
  description: string;
  metadata: {
    department?: string;
    employee_id?: string;
    phone?: string;
    email?: string;
    position?: string;
    access_level?: string;
  };
}

interface PersonFormProps {
  mode?: 'create' | 'edit';
  onSuccess?: (person: any) => void;
  onCancel?: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ 
  mode = 'create', 
  onSuccess, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const { id: personId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [person, setPerson] = useState<any>(null);
  const [showFaceUpload, setShowFaceUpload] = useState(false);
  
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    description: '',
    metadata: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && personId) {
      loadPerson();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, personId]);

  const loadPerson = async () => {
    if (!personId) return;
    
    try {
      setLoading(true);
      // ✅ Fix: Use getPersonDetail for full person data
      const response = await personService.getPersonDetail(personId);
      setPerson(response);
      setFormData({
        name: response.name || '',
        description: response.description || '',
        metadata: response.metadata || {}
      });
    } catch (error) {
      console.error('Error loading person:', error);
      toast.error('Không thể tải thông tin hồ sơ cá nhân');
      navigate('/persons');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tên phải ít hơn 100 ký tự';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả phải ít hơn 500 ký tự';
    }

    if (formData.metadata.email && !isValidEmail(formData.metadata.email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (formData.metadata.phone && !isValidPhone(formData.metadata.phone)) {
      newErrors.phone = 'Vui lòng nhập số điện thoại hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[\d\s\-()]{8,}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng sửa các lỗi trước khi gửi');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined
      };

      let result;
      if (mode === 'create') {
        result = await personService.createPerson(submitData);
        toast.success('Tạo hồ sơ cá nhân thành công');
      } else {
        result = await personService.updatePerson(personId!, submitData);
        toast.success('Cập nhật hồ sơ cá nhân thành công');
      }

      if (mode === 'create') {
        // For new person, show face upload option
        setShowFaceUpload(true);
        setPerson(result);
      } else {
        onSuccess?.(result);
        if (!onSuccess) {
          navigate('/persons');
        }
      }
    } catch (error: any) {
      console.error('Error saving person:', error);
      toast.error(error.response?.data?.detail || 'Không thể lưu hồ sơ cá nhân');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/persons');
    }
  };

  const handleFaceUploadComplete = () => {
    setShowFaceUpload(false);
    toast.success('Tạo hồ sơ cá nhân và thêm ảnh khuôn mặt thành công');
    navigate('/persons');
  };

  const handleSkipFaceUpload = () => {
    setShowFaceUpload(false);
    toast.success('Tạo hồ sơ cá nhân thành công');
    navigate('/persons');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show face upload dialog for new person
  if (showFaceUpload && person) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-teal-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              <Image className="h-5 w-5 text-emerald-600" />
              <span>Thêm Ảnh Khuôn Mặt cho {person.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  Hồ sơ cá nhân đã được tạo thành công! Bạn có thể thêm ảnh khuôn mặt để kích hoạt tính năng nhận diện.
                </AlertDescription>
              </Alert>

              <FaceImageUpload
                personId={person.id}
                personName={person.name}
                onComplete={handleFaceUploadComplete}
                allowSkip={true}
              />

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleSkipFaceUpload} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                  Bỏ Qua Bây Giờ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-teal-600 hover:text-teal-800 hover:bg-teal-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay Lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">
                {mode === 'create' ? 'Thêm Hồ Sơ Cá Nhân' : `Chỉnh Sửa ${person?.name || 'Hồ Sơ'}`}
              </h1>
              <p className="text-emerald-600">
                {mode === 'create' 
                  ? 'Tạo hồ sơ cá nhân mới cho hệ thống nhận diện khuôn mặt'
                  : 'Cập nhật thông tin và cài đặt hồ sơ cá nhân'
                }
              </p>
            </div>
          </div>
          
          {mode === 'edit' && person && (
            <Badge variant={person.is_active ? "default" : "secondary"} className={person.is_active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-400"}>
              {person.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-teal-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-emerald-800">
                <User className="h-5 w-5 text-emerald-600" />
                <span>Thông Tin Cơ Bản</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-emerald-700 font-medium">
                  Họ và Tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className={errors.name ? 'border-red-500 focus:ring-red-500' : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'}
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-emerald-700 font-medium">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả hoặc ghi chú về người này (không bắt buộc)"
                  rows={3}
                  className={errors.description ? 'border-red-500 focus:ring-red-500' : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'}
                  disabled={submitting}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-emerald-600">
                  {formData.description.length}/500 ký tự
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-teal-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-emerald-800">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                <span>Thông Tin Bổ Sung</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-emerald-700 font-medium">
                    <Building className="h-4 w-4 inline mr-1" />
                    Phòng Ban
                  </Label>
                  <Input
                    id="department"
                    value={formData.metadata.department || ''}
                    onChange={(e) => handleInputChange('metadata.department', e.target.value)}
                    placeholder="VD: Kỹ thuật, Marketing"
                    className="border-teal-200 focus:ring-teal-500 focus:border-teal-500"
                    disabled={submitting}
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <Label htmlFor="employee_id" className="text-emerald-700 font-medium">Mã Nhân Viên</Label>
                  <Input
                    id="employee_id"
                    value={formData.metadata.employee_id || ''}
                    onChange={(e) => handleInputChange('metadata.employee_id', e.target.value)}
                    placeholder="VD: NV001"
                    className="border-teal-200 focus:ring-teal-500 focus:border-teal-500"
                    disabled={submitting}
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-emerald-700 font-medium">Chức Vụ</Label>
                  <Input
                    id="position"
                    value={formData.metadata.position || ''}
                    onChange={(e) => handleInputChange('metadata.position', e.target.value)}
                    placeholder="VD: Kỹ sư phần mềm"
                    className="border-teal-200 focus:ring-teal-500 focus:border-teal-500"
                    disabled={submitting}
                  />
                </div>

                {/* Access Level */}
                <div className="space-y-2">
                  <Label htmlFor="access_level" className="text-emerald-700 font-medium">Cấp Độ Truy Cập</Label>
                  <Select 
                    value={formData.metadata.access_level || ''} 
                    onValueChange={(value) => handleInputChange('metadata.access_level', value)}
                  >
                    <SelectTrigger className="border-teal-200 focus:ring-teal-500 focus:border-teal-500">
                      <SelectValue placeholder="Chọn cấp độ truy cập" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung Bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="admin">Quản Trị</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-emerald-700 font-medium">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.metadata.email || ''}
                    onChange={(e) => handleInputChange('metadata.email', e.target.value)}
                    placeholder="nguoi@congty.com"
                    className={errors.email ? 'border-red-500 focus:ring-red-500' : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'}
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-emerald-700 font-medium">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Điện Thoại
                  </Label>
                  <Input
                    id="phone"
                    value={formData.metadata.phone || ''}
                    onChange={(e) => handleInputChange('metadata.phone', e.target.value)}
                    placeholder="+84 (0) 123 456 789"
                    className={errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-teal-200 focus:ring-teal-500 focus:border-teal-500'}
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-32 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang Lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Tạo Hồ Sơ' : 'Cập Nhật Hồ Sơ'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonForm;