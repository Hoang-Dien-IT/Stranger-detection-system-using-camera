import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, fallback }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Hiển thị thông báo từ chối truy cập nếu không phải admin
  if (!user?.is_admin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="space-y-3">
                <Shield className="h-12 w-12 mx-auto text-red-500" />
                <div>
                  <h3 className="font-semibold text-lg">Từ chối truy cập</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Bạn không có quyền quản trị viên để truy cập trang này.
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Quay lại
                  </button>
                  <Navigate to="/dashboard" replace />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Render children if user is admin
  return <>{children}</>;
};

export default AdminRoute;