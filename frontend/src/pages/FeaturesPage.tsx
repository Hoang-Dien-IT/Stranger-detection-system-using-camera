import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Eye,
  Brain,
  Zap,
  Camera,
  Globe,
  Target,
  Clock,
  Lock,
  Activity,
  CheckCircle,
  ArrowRight,
  Play,
  BarChart3,
  Settings,
  Smartphone,
  Cloud,
  Wifi,
  Database,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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

// const scaleOnHover = {
//   whileHover: { scale: 1.05 },
//   whileTap: { scale: 0.95 }
// };

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  category: string;
}

interface FeatureCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeaturesPage: React.FC = () => {
  const categories: FeatureCategory[] = [
    {
      id: 'ai-detection',
      title: 'Nhận diện AI',
      description: 'Thuật toán học máy tiên tiến',
      icon: <Brain className="h-6 w-6" />
    },
    {
      id: 'monitoring',
      title: 'Giám sát thời gian thực',
      description: 'Giám sát trực tiếp và cảnh báo',
      icon: <Eye className="h-6 w-6" />
    },
    {
      id: 'security',
      title: 'Bảo mật doanh nghiệp',
      description: 'Bảo vệ cấp ngân hàng',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 'integration',
      title: 'Tích hợp',
      description: 'Kết nối nền tảng liền mạch',
      icon: <Globe className="h-6 w-6" />
    }
  ];

  const features: Feature[] = [
    // AI Detection Features
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Nhận diện khuôn mặt",
      description: "Sử dụng thư viện OpenCV và mô hình học máy để nhận diện khuôn mặt với độ chính xác cao",
      benefits: [
        "Độ chính xác nhận diện ~95%",
        "Tốc độ xử lý 1-2 giây",
        "Hoạt động trong điều kiện ánh sáng tốt",
        "Phát hiện người lạ tự động",
      ],
      gradient: "from-emerald-500 to-teal-500",
      category: "ai-detection"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Quản lý danh sách người quen",
      description: "Thêm, sửa, xóa thông tin người quen với khả năng upload ảnh và quản lý thông tin cơ bản",
      benefits: [
        "Thêm người quen từ ảnh upload",
        "Quản lý thông tin cá nhân",
        "Chỉnh sửa danh sách dễ dàng",
        "Lưu trữ ảnh đại diện"
      ],
      gradient: "from-teal-500 to-emerald-500",
      category: "ai-detection"
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Lịch sử phát hiện",
      description: "Theo dõi tất cả các lần phát hiện với thời gian, ảnh chụp và thông tin người được nhận diện",
      benefits: [
        "Lưu trữ lịch sử phát hiện",
        "Hiển thị ảnh người được phát hiện",
        "Ghi nhận thời gian chính xác",
        "Phân biệt người quen và người lạ",
        "Xem chi tiết từng lần phát hiện"
      ],
      gradient: "from-emerald-600 to-green-500",
      category: "ai-detection"
    },

    // Real-time Monitoring Features
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Xem camera trực tiếp",
      description: "Xem video từ camera IP hoặc webcam với giao diện web, hỗ trợ nhiều định dạng camera phổ biến",
      benefits: [
        "Hỗ trợ camera IP (RTSP)",
        "Tương thích webcam USB",
        "Giao diện web thân thiện",
        "Xem trực tiếp qua trình duyệt",
        "Hỗ trợ độ phân giải HD"
      ],
      gradient: "from-cyan-500 to-blue-500",
      category: "monitoring"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Cảnh báo qua email",
      description: "Gửi email thông báo tự động khi phát hiện người lạ với ảnh đính kèm và thông tin chi tiết",
      benefits: [
        "Email thông báo tức thì",
        "Đính kèm ảnh người lạ",
        "Thông tin thời gian, địa điểm",
        "Cấu hình email người nhận",
        "Lịch sử email đã gửi"
      ],
      gradient: "from-blue-500 to-cyan-500",
      category: "monitoring"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Giám sát liên tục",
      description: "Hệ thống hoạt động 24/7 với khả năng ghi nhận và lưu trữ tất cả các sự kiện phát hiện",
      benefits: [
        "Hoạt động 24/7",
        "Ghi nhận mọi phát hiện",
        "Lưu trữ ảnh tự động",
        "Backup dữ liệu định kỳ",
        "Khôi phục sau sự cố"
      ],
      gradient: "from-cyan-600 to-blue-600",
      category: "monitoring"
    },

    // Security Features
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bảo mật cơ bản",
      description: "Hệ thống xác thực người dùng với mã hóa cơ bản để bảo vệ dữ liệu cá nhân",
      benefits: [
        "Đăng nhập bảo mật",
        "Mã hóa dữ liệu cơ bản",
        "Phân quyền người dùng",
        "Lưu trữ ảnh an toàn",
        "Bảo vệ thông tin cá nhân"
      ],
      gradient: "from-gray-600 to-slate-600",
      category: "security"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Quản lý người dùng",
      description: "Hệ thống đăng ký, đăng nhập với vai trò admin và user thông thường",
      benefits: [
        "Đăng ký tài khoản mới",
        "Đăng nhập an toàn",
        "Phân quyền admin/user",
        "Quản lý profile cá nhân",
        "Đổi mật khẩu"
      ],
      gradient: "from-slate-600 to-gray-700",
      category: "security"
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Lưu trữ dữ liệu",
      description: "Cơ sở dữ liệu MySQL lưu trữ thông tin người dùng, ảnh và lịch sử phát hiện",
      benefits: [
        "Cơ sở dữ liệu MySQL",
        "Lưu trữ ảnh local",
        "Backup dữ liệu thủ công",
        "Quản lý storage",
        "Tối ưu hiệu năng truy vấn"
      ],
      gradient: "from-gray-500 to-slate-500",
      category: "security"
    },

    // Integration Features
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Giao diện web",
      description: "Giao diện web responsive được xây dựng với React, có thể truy cập từ mọi thiết bị",
      benefits: [
        "Giao diện React hiện đại",
        "Responsive trên mọi thiết bị",
        "Truy cập qua trình duyệt",
        "Không cần cài đặt ứng dụng",
        "Cập nhật tự động"
      ],
      gradient: "from-purple-600 to-indigo-600",
      category: "integration"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Tương thích đa nền tảng",
      description: "Hỗ trợ truy cập từ máy tính, điện thoại, tablet với giao diện tối ưu cho từng thiết bị",
      benefits: [
        "Hoạt động trên Windows/Mac/Linux",
        "Tương thích mobile browser",
        "Giao diện tối ưu tablet",
        "Không cần app store",
        "Cập nhật real-time"
      ],
      gradient: "from-indigo-600 to-purple-600",
      category: "integration"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "API cơ bản",
      description: "REST API đơn giản để lấy dữ liệu phát hiện và quản lý thông tin người dùng",
      benefits: [
        "REST API cơ bản",
        "Lấy dữ liệu phát hiện",
        "Quản lý người dùng qua API",
        "Authentication token",
        "Tài liệu API đơn giản"
      ],
      gradient: "from-purple-500 to-indigo-500",
      category: "integration"
    }
  ];

  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-100/30 to-emerald-100/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-cyan-100/25 to-blue-100/15 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-emerald-100/20 to-teal-100/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-teal-300 rotate-45"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border-2 border-emerald-300 rotate-12"></div>
          <div className="absolute bottom-32 left-1/3 w-40 h-40 border-2 border-cyan-300 -rotate-12"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="inline-block mb-6">
              <div className="bg-white border border-teal-200 text-teal-700 rounded-full px-6 py-3 shadow-sm">
                <span className="font-medium">✨ Bộ tính năng hoàn chỉnh</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Hệ thống nhận diện cho{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Khu vực làm việc
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full transform -rotate-1"></div>
              </span>
            </h1>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Phát hiện người lạ trong khu vực làm việc với công nghệ nhận diện khuôn mặt, 
                cảnh báo thời gian thực và quản lý truy cập thông minh.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/register">
                <Button size="lg" className="px-10 py-4 text-lg bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  Bắt đầu miễn phí
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="px-10 py-4 text-lg text-teal-700 border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 transform hover:-translate-y-1 transition-all duration-300">
                <Play className="mr-2 h-5 w-5" />
                Xem Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="relative mt-16"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Custom Background */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl transform rotate-1"></div>
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 p-8 md:p-16 shadow-2xl">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { 
                    number: "95%", 
                    label: "Độ chính xác nhận diện",
                    icon: <Target className="h-8 w-8" />,
                    color: "from-teal-500 to-teal-600",
                    bgColor: "bg-teal-50"
                  },
                  { 
                    number: "1-2s", 
                    label: "Tốc độ phát hiện",
                    icon: <Zap className="h-8 w-8" />,
                    color: "from-emerald-500 to-emerald-600",
                    bgColor: "bg-emerald-50"
                  },
                  { 
                    number: "24/7", 
                    label: "Giám sát liên tục",
                    icon: <Eye className="h-8 w-8" />,
                    color: "from-cyan-500 to-cyan-600",
                    bgColor: "bg-cyan-50"
                  },
                  { 
                    number: "5+", 
                    label: "Camera hỗ trợ",
                    icon: <Camera className="h-8 w-8" />,
                    color: "from-blue-500 to-blue-600",
                    bgColor: "bg-blue-50"
                  }
                ].map((stat, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUp}
                    className="text-center group"
                  >
                    {/* Icon with Custom Design */}
                    <div className={`relative inline-flex items-center justify-center w-20 h-20 ${stat.bgColor} rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300`}>
                      <div className={`absolute inset-2 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                    </div>
                    
                    {/* Number */}
                    <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                      {stat.number}
                    </div>
                    
                    {/* Label */}
                    <div className="text-gray-600 font-medium text-sm lg:text-base">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-16 relative">
        {/* Diagonal Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white transform -skew-y-1 origin-top-left"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Khám phá theo danh mục
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Duyệt bộ tính năng toàn diện được tổ chức theo chức năng
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 ${
                selectedCategory === 'all' 
                  ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-lg transform -translate-y-1' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Tất cả tính năng</span>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? (() => {
                        switch(category.id) {
                          case 'ai-detection': return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-lg transform -translate-y-1';
                          case 'monitoring': return 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600 shadow-lg transform -translate-y-1';
                          case 'security': return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 shadow-lg transform -translate-y-1';
                          case 'integration': return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-lg transform -translate-y-1';
                          default: return 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-lg transform -translate-y-1';
                        }
                      })()
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1'
                }`}
              >
                <span>
                  {category.icon}
                </span>
                <span>{category.title}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative">
        {/* Asymmetric Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 border border-teal-100 rounded-full"></div>
          <div className="absolute bottom-40 left-20 w-48 h-48 border border-emerald-100 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-50 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                  {/* Decorative Corner */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${feature.gradient} opacity-10 rounded-bl-full`}></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                        Lợi ích chính:
                      </h4>
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 relative overflow-hidden">
        {/* Custom Dark Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-32 h-32 border border-gray-700 rounded-lg rotate-45 opacity-20"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 border border-gray-600 rounded-lg -rotate-12 opacity-30"></div>
          <div className="absolute top-1/2 right-20 w-40 h-40 border border-gray-700 rounded-lg rotate-12 opacity-15"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Thông số kỹ thuật
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full mx-auto mb-4"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Được xây dựng với công nghệ mã nguồn mở và các thư viện tin cậy cho dự án học tập và nghiên cứu
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Rocket className="h-8 w-8" />,
                title: "Hiệu năng",
                specs: [
                  "Độ chính xác ~95%",
                  "Tốc độ phát hiện 1-2s",
                  "Hỗ trợ 1000+ ảnh người quen",
                  "Xử lý video real-time"
                ],
                gradient: "from-teal-500 to-emerald-500"
              },
              {
                icon: <Camera className="h-8 w-8" />,
                title: "Hỗ trợ camera",
                specs: [
                  "Camera IP (RTSP)",
                  "Webcam USB",
                  "Độ phân giải HD (720p)",
                  "Tương thích OpenCV"
                ],
                gradient: "from-cyan-500 to-blue-500"
              },
              {
                icon: <Cloud className="h-8 w-8" />,
                title: "Hạ tầng",
                specs: [
                  "Triển khai local server",
                  "Hỗ trợ Linux/Windows",
                  "MySQL database",
                  "FastAPI backend"
                ],
                gradient: "from-purple-500 to-indigo-500"
              },
              {
                icon: <Wifi className="h-8 w-8" />,
                title: "Kết nối",
                specs: [
                  "REST API",
                  "WebSocket cho realtime",
                  "Email notifications",
                  "Web dashboard"
                ],
                gradient: "from-emerald-500 to-teal-500"
              }
            ].map((spec, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative group"
              >
                {/* Background Card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 h-full hover:bg-white/10 transition-all duration-300 group-hover:border-gray-600">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${spec.gradient} rounded-xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {spec.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-6 text-center">{spec.title}</h3>
                  
                  {/* Specs List */}
                  <ul className="space-y-3">
                    {spec.specs.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-300 flex items-start space-x-3">
                        <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Asymmetric Background */}
        <div className="absolute inset-0 bg-white"></div>
        <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-br from-teal-50 to-emerald-50 transform -skew-y-3 origin-top-left"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-12 lg:p-16 border border-gray-100 transform hover:scale-105 transition-transform duration-300">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Sẵn sàng bắt đầu?
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mx-auto mb-6"></div>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Thử nghiệm hệ thống nhận diện khuôn mặt SafeFace miễn phí và khám phá 
                các tính năng phát hiện người lạ trong khu vực làm việc.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/register">
                  <Button size="lg" className="px-10 py-4 text-lg bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    Bắt đầu miễn phí
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="px-10 py-4 text-lg border-2 border-teal-600 text-teal-600 hover:bg-teal-50 transform hover:-translate-y-1 transition-all duration-300">
                    Liên hệ tư vấn
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-teal-500" />
                    <span>Dùng thử miễn phí</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-teal-500" />
                    <span>Mã nguồn mở</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-teal-500" />
                    <span>Hỗ trợ học tập</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;