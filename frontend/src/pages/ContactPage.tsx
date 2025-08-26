import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  ArrowRight,
  Headphones,
  Video,
  HelpCircle,
  Rocket,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface ContactForm {
  name: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  subject: string;
  message: string;
  inquiryType: string;
  preferredContact: string;
}

interface ContactMethod {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  action: string;
  available: string;
  gradient: string;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general',
    preferredContact: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  const contactMethods: ContactMethod[] = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Hỗ trợ Email',
      description: 'Gửi tin nhắn cho chúng tôi, phản hồi trong vòng 4 giờ',
      value: 'support@safeface.ai',
      action: 'Gửi Email',
      available: '< 4 giờ phản hồi',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Chat trực tuyến',
      description: 'Nhận hỗ trợ ngay lập tức từ đội ngũ kỹ thuật',
      value: 'Hỗ trợ 24/7',
      action: 'Bắt đầu chat',
      available: 'Phản hồi tức thì',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Hỗ trợ qua điện thoại',
      description: 'Trò chuyện trực tiếp với chuyên gia bảo mật',
      value: '+84 28 1234 5678',
      action: 'Gọi ngay',
      available: 'Thứ 2-6, 9h-18h',
      gradient: 'from-cyan-500 to-emerald-500'
    },
    {
      icon: <Video className="h-6 w-6" />,
      title: 'Đặt lịch Demo',
      description: 'Đặt lịch trình diễn sản phẩm cá nhân hóa',
      value: 'Miễn phí 30 phút',
      action: 'Đặt lịch',
      available: 'Linh hoạt theo lịch',
      gradient: 'from-teal-600 to-cyan-600'
    }
  ];

  const officeLocations = [
    {
      city: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
      address: '123 Đường Công Nghệ, Quận 1, TP.HCM',
      phone: '+84 28 1234 5678',
      email: 'hcm@safeface.ai',
      timezone: 'GMT+7',
      type: 'Trụ sở chính'
    },
    {
      city: 'Hà Nội',
      country: 'Việt Nam',
      address: '456 Đường Sáng Tạo, Quận Cầu Giấy, Hà Nội',
      phone: '+84 24 5678 1234',
      email: 'hanoi@safeface.ai',
      timezone: 'GMT+7',
      type: 'Văn phòng miền Bắc'
    },
    {
      city: 'Singapore',
      country: 'Singapore',
      address: '789 Business Blvd, Singapore 018956',
      phone: '+65 6123 4567',
      email: 'singapore@safeface.ai',
      timezone: 'SGT (UTC+8)',
      type: 'Văn phòng Châu Á'
    }
  ];

  const faqs = [
    {
      question: 'Tôi có thể bắt đầu sử dụng nhanh như thế nào?',
      answer: 'Bạn có thể sử dụng SafeFace ngay với gói miễn phí. Với gói trả phí, thời gian thiết lập thường từ 1-2 ngày làm việc sau khi đăng ký.',
      category: 'Bắt đầu'
    },
    {
      question: 'SafeFace có giải pháp doanh nghiệp tùy chỉnh không?',
      answer: 'Có, chúng tôi cung cấp giải pháp tùy chỉnh cho doanh nghiệp bao gồm triển khai tại chỗ, tích hợp riêng và hỗ trợ chuyên biệt.',
      category: 'Doanh nghiệp'
    },
    {
      question: 'Tôi nhận được hỗ trợ như thế nào?',
      answer: 'Chúng tôi hỗ trợ chat 24/7, email phản hồi <4 giờ, hỗ trợ điện thoại cho khách hàng doanh nghiệp và tài liệu đầy đủ.',
      category: 'Hỗ trợ'
    },
    {
      question: 'Dữ liệu của tôi có an toàn không?',
      answer: 'Chắc chắn. Chúng tôi mã hóa cấp ngân hàng, tuân thủ SOC 2 Type II và có tùy chọn triển khai tại chỗ cho bảo mật tối đa.',
      category: 'Bảo mật'
    },
    {
      question: 'Có thể tích hợp với hệ thống sẵn có không?',
      answer: 'Có, SafeFace cung cấp API, webhook và tích hợp sẵn với nhiều hệ thống bảo mật, kinh doanh phổ biến.',
      category: 'Tích hợp'
    },
    {
      question: 'Các gói giá như thế nào?',
      answer: 'Chúng tôi có gói miễn phí, gói chuyên nghiệp từ 690.000đ/tháng và gói doanh nghiệp tùy chỉnh. Tất cả đều bao gồm tính năng cốt lõi.',
      category: 'Giá cả'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.company.trim()) newErrors.company = 'Vui lòng nhập tên công ty';
    if (!formData.message.trim()) newErrors.message = 'Vui lòng nhập nội dung';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin trước khi gửi');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the form data to your backend
      console.log('Contact form submitted:', formData);
      
      setSubmitted(true);
      toast.success('Gửi thành công! Chúng tôi sẽ phản hồi sớm nhất.');
    } catch (error) {
      toast.error('Gửi thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'email':
        window.location.href = 'mailto:support@safeface.ai?subject=Hỗ trợ SafeFace';
        break;
      case 'chat':
        toast.info('Tính năng chat sẽ sớm ra mắt!');
        break;
      case 'phone':
        window.location.href = 'tel:+842812345678';
        break;
      case 'demo':
        toast.info('Tính năng đặt lịch demo sẽ sớm ra mắt!');
        break;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Gửi thành công!
              </h2>
              <p className="text-gray-600 mb-6">
                Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 4 giờ làm việc.
              </p>
              <div className="space-y-3">
                <Button onClick={() => setSubmitted(false)} className="w-full">
                  Gửi tin nhắn khác
                </Button>
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full">
                    Về trang chủ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Custom Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Organic shapes instead of gradient circles */}
        <div className="absolute top-20 right-10 w-64 h-80 bg-teal-100/20 transform rotate-12 rounded-[40px] blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-72 h-56 bg-emerald-100/15 transform -rotate-6 rounded-[50px] blur-2xl"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-cyan-100/10 transform rotate-45 rounded-[30px] blur-lg"></div>
        
        {/* Line patterns */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-teal-200/30 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-200/20 to-transparent"></div>
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(20, 184, 166, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 relative">
        {/* Section background with asymmetric design */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-br from-gray-50 to-teal-50/30 transform -skew-y-2 origin-top-left"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-gradient-to-tl from-emerald-50/40 to-transparent transform skew-x-3"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="inline-block mb-6">
              <div className="bg-white border-2 border-teal-200 text-teal-700 rounded-2xl px-6 py-3 shadow-sm">
                <span className="font-semibold">💬 Liên hệ ngay</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Hãy cùng
              <span className="relative inline-block ml-3">
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  trao đổi về bảo mật
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-teal-300/50 rounded-full transform rotate-1"></div>
              </span>
            </h1>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Sẵn sàng nâng cấp an ninh với nhận diện khuôn mặt AI? Chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" onClick={() => handleContactMethod('demo')} className="px-10 py-4 text-lg bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                <Video className="mr-2 h-5 w-5" />
                Đặt lịch Demo
              </Button>
              <Button variant="outline" size="lg" onClick={() => handleContactMethod('chat')} className="px-10 py-4 text-lg border-2 border-teal-200 text-teal-700 hover:border-teal-300 hover:bg-teal-50 rounded-xl transform hover:-translate-y-1 transition-all duration-300">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat trực tuyến
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 relative">
        {/* Custom section background */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-teal-200/50 rounded-3xl transform rotate-12"></div>
          <div className="absolute bottom-20 right-16 w-24 h-24 border-2 border-emerald-200/40 rounded-2xl transform -rotate-6"></div>
          <div className="absolute top-1/2 left-1/3 w-40 h-40 border border-cyan-200/30 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Chọn phương thức liên hệ phù hợp
            </h2>
            <div className="w-20 h-1 bg-teal-500 rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn qua nhiều kênh khác nhau.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => handleContactMethod(method.title.split(' ')[0].toLowerCase())}
              >
                <Card className="h-full border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-2xl">
                  {/* Custom corner decoration */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${method.gradient} opacity-20 rounded-bl-3xl`}></div>
                  
                  <CardContent className="p-8 text-center relative">
                    <div className={`w-18 h-18 bg-gradient-to-r ${method.gradient} rounded-3xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      {method.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {method.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {method.description}
                    </p>
                    <div className="space-y-2 mb-6">
                      <p className="font-semibold text-gray-900">{method.value}</p>
                      <div className="inline-block">
                        <div className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                          {method.available}
                        </div>
                      </div>
                    </div>
                    <Button className="w-full group-hover:scale-105 transition-transform rounded-xl shadow-md">
                      {method.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 relative">
        {/* Diagonal background element */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-bl from-gray-50 to-transparent transform skew-y-1"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="relative">
                {/* Background card */}
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl transform rotate-1"></div>
                <Card className="relative border-0 bg-white rounded-3xl shadow-xl">
                  <CardHeader className="p-8 pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Gửi tin nhắn cho chúng tôi
                    </CardTitle>
                    <p className="text-gray-600">
                      Điền form bên dưới, chúng tôi sẽ phản hồi trong vòng 4 giờ.
                    </p>
                  </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6 p-8 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                    <Label htmlFor="name">Họ tên *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nhập họ tên"
                      className={`rounded-xl ${errors.name ? 'border-red-500' : ''}`}
                    />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="nhap@email.com"
                          className={`rounded-xl ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Công ty *</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Tên công ty"
                          className={`rounded-xl ${errors.company ? 'border-red-500' : ''}`}
                        />
                        {errors.company && (
                          <p className="text-sm text-red-500">{errors.company}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Chức vụ</Label>
                        <Input
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          placeholder="VD: Quản lý an ninh"
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Số điện thoại liên hệ"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Loại yêu cầu</Label>
                        <Select
                          value={formData.inquiryType}
                          onValueChange={(value) => handleSelectChange('inquiryType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Tư vấn chung</SelectItem>
                            <SelectItem value="sales">Báo giá</SelectItem>
                            <SelectItem value="support">Hỗ trợ kỹ thuật</SelectItem>
                            <SelectItem value="partnership">Hợp tác</SelectItem>
                            <SelectItem value="enterprise">Giải pháp doanh nghiệp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Tiêu đề</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Tiêu đề ngắn gọn"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Mô tả nhu cầu bảo mật và cách chúng tôi có thể hỗ trợ..."
                        rows={6}
                        className={errors.message ? 'border-red-500' : ''}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500">{errors.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Phương thức liên hệ mong muốn</Label>
                      <Select
                        value={formData.preferredContact}
                        onValueChange={(value) => handleSelectChange('preferredContact', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Điện thoại</SelectItem>
                          <SelectItem value="either">Bất kỳ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Đang gửi...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Send className="mr-2 h-5 w-5" />
                          Gửi liên hệ
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              </div>
            </motion.div>

            {/* Office Locations */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-8 relative"
            >
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-6 left-1/4 w-20 h-28 bg-teal-100/30 transform rotate-12 rounded-3xl"></div>
                <div className="absolute top-1/3 right-1/6 w-16 h-24 bg-emerald-100/40 transform -rotate-6 rounded-2xl"></div>
                <div className="absolute bottom-1/4 left-1/6 w-24 h-16 bg-cyan-100/30 transform rotate-45 rounded-full"></div>
                
                {/* Decorative pattern */}
                <div className="absolute top-0 right-0 grid grid-cols-3 gap-3 opacity-20">
                  <div className="w-1 h-1 bg-teal-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Văn phòng toàn cầu
                </h3>
                <p className="text-gray-600 mb-8">
                  Chúng tôi có mặt tại nhiều quốc gia để phục vụ bạn tốt nhất.
                </p>

                <div className="space-y-6">
                  {officeLocations.map((office, index) => (
                    <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-100/60 to-transparent rounded-bl-3xl"></div>
                      
                      <CardHeader className="pb-4 relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                              {office.city}, {office.country}
                            </CardTitle>
                            <div className="mt-2 inline-block bg-teal-50 text-teal-700 text-xs px-3 py-1 rounded-full border border-teal-200/50">
                              {office.type}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                            <MapPin className="h-5 w-5 text-teal-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{office.address}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                              <Phone className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-600">{office.phone}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                              <Mail className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-600">{office.email}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                              <Clock className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-600">{office.timezone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Support Hours */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="relative"
            >
              {/* Background decoration */}
              <div className="absolute -top-4 right-4 w-16 h-20 bg-teal-100/30 transform rotate-12 rounded-2xl"></div>
              
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden relative">
                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-teal-100/50 to-emerald-100/50 rounded-br-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center">
                      <Headphones className="h-5 w-5 text-teal-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Thời gian hỗ trợ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Chat trực tuyến</span>
                        <div className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full font-medium">24/7</div>
                      </div>
                      <p className="text-sm text-gray-600">Hỗ trợ trực tuyến không giới hạn</p>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Hỗ trợ Email</span>
                        <div className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">24/7</div>
                      </div>
                      <p className="text-sm text-gray-600">Phản hồi trong 2 giờ</p>
                    </div>
                    
                    <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Hỗ trợ điện thoại</span>
                        <div className="bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-full font-medium">8:00-18:00</div>
                      </div>
                      <p className="text-sm text-gray-600">Thứ 2 - Chủ nhật</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-100/50">
                      <p className="text-sm text-gray-700 font-medium">
                        💎 Hỗ trợ ưu tiên 24/7 cho khách hàng doanh nghiệp
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Custom background with organic shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-20 w-64 h-32 bg-teal-100/10 transform -rotate-12 rounded-[40px] blur-lg"></div>
          <div className="absolute bottom-24 right-16 w-48 h-64 bg-emerald-100/15 transform rotate-6 rounded-[50px] blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-cyan-200/20 rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Câu hỏi thường gặp
            </h2>
            <div className="w-20 h-1 bg-emerald-500 rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              Giải đáp nhanh các thắc mắc về SafeFace.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
                  {/* Decorative corner */}
                  <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-br-2xl"></div>
                  
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 pr-4 leading-tight">
                        {faq.question}
                      </CardTitle>
                      <div className="bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full shrink-0">
                        {faq.category}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-12"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <p className="text-gray-600 mb-4">
              Không tìm thấy câu trả lời bạn cần?
            </p>
            <Link to="/help">
              <Button variant="outline">
                <HelpCircle className="mr-2 h-4 w-4" />
                Trung tâm trợ giúp
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-800 via-slate-700 to-teal-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-teal-900/50" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Sẵn sàng biến đổi
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                {' '}Hệ thống bảo mật?
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
              Tham gia cùng hơn 100,000+ tổ chức đang sử dụng SafeFace để bảo vệ những 
              gì quan trọng nhất. Bắt đầu ngay hôm nay và trải nghiệm tương lai của bảo mật 
              thông minh.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/register">
                <Button size="lg" className="px-8 py-3 text-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Rocket className="mr-2 h-5 w-5" />
                  Bắt đầu miễn phí
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => handleContactMethod('demo')} 
                className="px-8 py-3 text-lg border-gray-400 text-gray-300 hover:bg-white/10 hover:border-teal-400 hover:text-teal-400 transition-all duration-300"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Liên hệ tư vấn
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-teal-400" />
                <span>Hoàn toàn miễn phí</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-teal-400" />
                <span>Không phí cài đặt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-teal-400" />
                <span>Hủy bất cứ lúc nào</span>
              </div>
            </div>

            {/* Companies Trust Section */}
            <div className="mt-12 pt-8 border-t border-gray-600">
              <p className="text-sm text-gray-400 mb-4">Được tin tưởng bởi các doanh nghiệp hàng đầu</p>
              <div className="flex justify-center space-x-8 text-gray-500">
                <span className="text-lg font-bold">Doanh nghiệp+</span>
                <span className="text-lg font-bold">Fortune 500</span>
                <span className="text-lg font-bold">Bảo mật toàn cầu</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;