import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  ChevronDown,
  Star,
  ArrowRight,
  
} from 'lucide-react';
import { useState } from 'react';
import SafeFaceLogo from '@/assets/images/SafeFace.png';

const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const location = useLocation();

  const navigationItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tính năng', href: 'features' },
    // { label: 'Giải pháp', href: '#solutions', 
    //   dropdown: [
    //     { label: 'Bảo mật doanh nghiệp', href: '/solutions/enterprise' },
    //     { label: 'Doanh nghiệp nhỏ', href: '/solutions/small-business' },
    //     { label: 'Giáo dục', href: '/solutions/education' },
    //     { label: 'Y tế', href: '/solutions/healthcare' }
    //   ]
    // },
    // { label: 'Tài nguyên', href: 'resources',
    //   dropdown: [
    //     { label: 'Tài liệu', href: '/docs' },
    //     { label: 'Tài liệu API', href: '/api-docs' },
    //     { label: 'Trung tâm trợ giúp', href: '/help' },
    //     { label: 'Blog', href: '/blog' }
    //   ]
    // },
    { label: 'Liên hệ', href: 'contact' }
  ];

  return (
  <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header */}
  <header className="bg-white/95 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 shadow-sm">
        {/* Top Bar */}
  <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>0944779743</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>nguyenhoanhdien1x@gmail.com</span>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Badge variant="secondary" className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-emerald-200 shadow">
                  🚀 Hoàn toàn miễn phí
                </Badge>
                <div className="flex items-center space-x-2">
                  <Facebook className="h-4 w-4 hover:text-teal-200 cursor-pointer" />
                  <Twitter className="h-4 w-4 hover:text-teal-200 cursor-pointer" />
                  <Linkedin className="h-4 w-4 hover:text-teal-200 cursor-pointer" />
                  <Youtube className="h-4 w-4 hover:text-teal-200 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={SafeFaceLogo} 
                alt="SafeFace Logo" 
                className="h-24 w-auto object-contain drop-shadow-lg"
                onError={(e) => {
                  // Fallback to original design if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'flex items-center space-x-2';
                  fallback.innerHTML = `
                    <div class="w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10.2V11.2C15.2 11.4 15.5 11.7 15.5 12.3V16.5C15.5 17.1 15.1 17.5 14.5 17.5H9.5C8.9 17.5 8.5 17.1 8.5 16.5V12.3C8.5 11.7 8.8 11.4 9.2 11.2V10.2C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10.2V11.2H13.5V10.2C13.5 8.7 12.8 8.2 12 8.2Z"/>
                      </svg>
                    </div>
                    <div>
                      <span class="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">SafeFace</span>
                      <div class="text-xs text-gray-500">Nền tảng bảo mật AI</div>
                    </div>
                  `;
                  e.currentTarget.parentNode?.appendChild(fallback);
                }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <div key={item.label} className="relative group">
                  <a
                    href={item.href}
                    className="flex items-center space-x-1 text-slate-700 hover:text-teal-600 font-semibold transition-colors"
                  >
                    <span>{item.label}</span>
                    {/* {item.dropdown && <ChevronDown className="h-4 w-4" />} */}
                  </a>
                  
                  {/* Dropdown Menu */}
                  {/* {item.dropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-2">
                        {item.dropdown.map((dropdownItem) => (
                          <a
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-md transition-colors"
                          >
                            {dropdownItem.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-teal-600 font-semibold">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 font-semibold shadow-lg">
                  Bắt đầu miễn phí
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-emerald-200">
            <div className="px-4 py-4 space-y-3">
              {navigationItems.map((item) => (
                <div key={item.label}>
                  <a
                    href={item.href}
                    className="block py-2 text-gray-700 hover:text-teal-600 font-medium"
                  >
                    {item.label}
                  </a>
                  {/* {item.dropdown && (
                    <div className="ml-4 space-y-1">
                      {item.dropdown.map((dropdownItem) => (
                        <a
                          key={dropdownItem.label}
                          href={dropdownItem.href}
                          className="block py-1 text-sm text-gray-600 hover:text-teal-600"
                        >
                          {dropdownItem.label}
                        </a>
                      ))}
                    </div>
                  )} */}
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full border-emerald-400 text-emerald-700 hover:bg-emerald-50 font-semibold">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 font-semibold shadow">
                    Bắt đầu miễn phí
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
  <footer className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <img 
                  src={SafeFaceLogo} 
                  alt="SafeFace Logo" 
                  className="h-32 w-auto object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Fallback to original design if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'flex items-center space-x-2';
                    fallback.innerHTML = `
                      <div class="w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10.2V11.2C15.2 11.4 15.5 11.7 15.5 12.3V16.5C15.5 17.1 15.1 17.5 14.5 17.5H9.5C8.9 17.5 8.5 17.1 8.5 16.5V12.3C8.5 11.7 8.8 11.4 9.2 11.2V10.2C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10.2V11.2H13.5V10.2C13.5 8.7 12.8 8.2 12 8.2Z"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-2xl font-bold">SafeFace</span>
                        <div class="text-sm text-gray-400">Nền tảng bảo mật AI</div>
                      </div>
                    `;
                    e.currentTarget.parentNode?.appendChild(fallback);
                  }}
                />
              </div>
              <p className="text-emerald-100 leading-relaxed mb-6 max-w-md">
                Nền tảng bảo mật nhận diện khuôn mặt AI thế hệ mới được tin tưởng bởi các tổ chức trên toàn thế giới. Bảo vệ những gì quan trọng nhất với công nghệ tiên tiến.
              </p>
              {/* Trust Badges */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current drop-shadow" />
                    <Star className="h-4 w-4 text-yellow-400 fill-current drop-shadow" />
                    <Star className="h-4 w-4 text-yellow-400 fill-current drop-shadow" />
                    <Star className="h-4 w-4 text-yellow-400 fill-current drop-shadow" />
                    <span className="text-sm text-emerald-100 ml-2">4/5 đánh giá</span>
                  </div>
              </div>
              {/* Contact Info */}
              <div className="space-y-2 text-sm text-emerald-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+84 (024) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@safeface.vn</span>
                </div>
              </div>
            </div>
            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-emerald-200">Sản phẩm</h3>
              <ul className="space-y-3 text-emerald-100">
                <li><a href="#features" className="hover:text-teal-300 transition-colors">Tính năng</a></li>
                {/* <li><a href="/api-docs" className="hover:text-teal-400 transition-colors">API</a></li>
                <li><a href="/integrations" className="hover:text-teal-400 transition-colors">Tích hợp</a></li>
                <li><a href="/security" className="hover:text-teal-400 transition-colors">Bảo mật</a></li>
                <li><a href="/changelog" className="hover:text-teal-400 transition-colors">Cập nhật</a></li> */}
              </ul>
            </div>
            {/* Solutions Links */}
            {/* <div>
              <h3 className="font-semibold text-lg mb-4">Giải pháp</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/solutions/enterprise" className="hover:text-teal-400 transition-colors">Doanh nghiệp</a></li>
                <li><a href="/solutions/small-business" className="hover:text-teal-400 transition-colors">Doanh nghiệp nhỏ</a></li>
                <li><a href="/solutions/education" className="hover:text-teal-400 transition-colors">Giáo dục</a></li>
                <li><a href="/solutions/healthcare" className="hover:text-teal-400 transition-colors">Y tế</a></li>
                <li><a href="/solutions/retail" className="hover:text-teal-400 transition-colors">Bán lẻ</a></li>
              </ul>
            </div> */}
            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-emerald-200">Hỗ trợ</h3>
              <ul className="space-y-3 text-emerald-100">
                {/* <li><a href="/help" className="hover:text-teal-400 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="/docs" className="hover:text-teal-400 transition-colors">Tài liệu</a></li> */}
                <li><a href="/contact" className="hover:text-teal-300 transition-colors">Liên hệ</a></li>
                {/* <li><a href="/status" className="hover:text-teal-400 transition-colors">Trạng thái hệ thống</a></li>
                <li><a href="/community" className="hover:text-teal-400 transition-colors">Cộng đồng</a></li>
                <li><a href="/training" className="hover:text-teal-400 transition-colors">Đào tạo</a></li> */}
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom Footer */}
  <div className="border-t border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <p className="text-emerald-100 text-sm">
                  © 2025 SafeFace AI Technologies. Tất cả quyền được bảo lưu.
                </p>
                <div className="flex items-center space-x-4 text-sm text-emerald-100">
                  <a href="/privacy" className="hover:text-teal-300 transition-colors">Chính sách bảo mật</a>
                  <a href="/terms" className="hover:text-teal-300 transition-colors">Điều khoản dịch vụ</a>
                  <a href="/cookies" className="hover:text-teal-300 transition-colors">Chính sách Cookie</a>
                </div>
              </div>
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <a href="https://facebook.com/safeface" className="text-emerald-100 hover:text-teal-300 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://twitter.com/safeface" className="text-emerald-100 hover:text-teal-300 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com/company/safeface" className="text-emerald-100 hover:text-teal-300 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://youtube.com/safeface" className="text-emerald-100 hover:text-teal-300 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="https://instagram.com/safeface" className="text-emerald-100 hover:text-teal-300 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;