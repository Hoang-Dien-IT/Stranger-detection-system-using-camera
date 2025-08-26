import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const bugReportData = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy to clipboard for easy bug reporting
    navigator.clipboard.writeText(JSON.stringify(bugReportData, null, 2));
    alert('Error details copied to clipboard. Please share this with support.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center border-b border-slate-100 bg-gradient-to-r from-teal-100 to-emerald-50 rounded-t-2xl">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-rose-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-emerald-700">
                Có lỗi hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white/80 rounded-b-2xl">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription>
                  Đã xảy ra lỗi khi tải trang này. Vui lòng thử lại hoặc liên hệ quản trị viên nếu sự cố tiếp tục.
                </AlertDescription>
              </Alert>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-800 mb-2">Chi tiết lỗi kỹ thuật:</h4>
                  <pre className="text-sm text-rose-600 overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 border-0 shadow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tải lại trang
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1 border-teal-400 text-teal-700 hover:bg-teal-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>

                <Button 
                  variant="outline" 
                  onClick={this.handleReportBug}
                  className="flex-1 border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Báo lỗi kỹ thuật
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-600 mt-6">
                <p>
                  If this problem persists, please contact our support team at{' '}
                  <a 
                    href="mailto:support@facerecognition.com" 
                    className="text-blue-600 hover:underline"
                  >
                    support@facerecognition.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  };
};

// HOC version
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};