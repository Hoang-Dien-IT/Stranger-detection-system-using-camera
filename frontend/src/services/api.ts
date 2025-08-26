import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, AUTH_CONFIG, ERROR_MESSAGES } from '@/lib/config';
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Debug logging for large requests
        if (config.data && JSON.stringify(config.data).length > 100000) {
          console.log('🔥 Large request detected:');
          console.log('URL:', config.url);
          console.log('Method:', config.method);
          console.log('Data size:', JSON.stringify(config.data).length);
          console.log('Headers:', config.headers);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor  
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Enhanced error logging for 431
        if (error.response?.status === 431) {
          console.error('🔥 431 Error - Request Header Fields Too Large:');
          console.error('URL:', error.config?.url);
          console.error('Method:', error.config?.method);
          console.error('Request headers:', error.config?.headers);
          console.error('Request data size:', error.config?.data ? JSON.stringify(error.config.data).length : 0);
        }
        
        if (error.response?.status === 401) {
          // Clear auth data and redirect to login
          localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
          localStorage.removeItem(AUTH_CONFIG.USER_KEY);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ✅ ENHANCED: Blob download method with better error handling
  async downloadBlob(url: string, params?: any, filename?: string): Promise<Blob> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        params,
        responseType: 'blob',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Accept': 'text/csv,application/json,*/*'
        },
      };
      
      console.log(`🔵 DOWNLOAD Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.get(url, config);
      
      // ✅ Ensure we return a proper Blob
      if (response.data instanceof Blob) {
        return response.data;
      } else {
        // Convert to blob if not already
        return new Blob([response.data], { 
          type: response.headers['content-type'] || 'application/octet-stream' 
        });
      }
    } catch (error: any) {
      console.error(`❌ DOWNLOAD Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  // ✅ ADD: Generic blob request method
  async getBlobResponse(url: string, params?: any, headers?: Record<string, string>): Promise<Blob> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        params,
        responseType: 'blob',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers
        },
      };
      
      console.log(`🔵 BLOB GET Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.get(url, config);
      
      if (response.data instanceof Blob) {
        return response.data;
      } else {
        return new Blob([response.data], { 
          type: response.headers['content-type'] || 'application/octet-stream' 
        });
      }
    } catch (error: any) {
      console.error(`❌ BLOB GET Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  async get<T>(url: string, params?: any): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        params,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      
      console.log(`🔵 GET Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.get<T>(url, config);
      return response;
    } catch (error: any) {
      console.error(`❌ GET Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const requestConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...config?.headers,
        },
      };
      
      console.log(`🔵 POST Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.post<T>(url, data, requestConfig);
      return response;
    } catch (error: any) {
      console.error(`❌ POST Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      
      console.log(`🔵 PUT Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.put<T>(url, data, config);
      return response;
    } catch (error: any) {
      console.error(`❌ PUT Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      
      console.log(`🔵 DELETE Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.delete<T>(url, config);
      return response;
    } catch (error: any) {
      console.error(`❌ DELETE Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  // ✅ Upload method with auth header
  async upload<T>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      
      console.log(`🔵 UPLOAD Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.post<T>(url, formData, config);
      return response;
    } catch (error: any) {
      console.error(`❌ UPLOAD Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    try {
      const token = localStorage.getItem('access_token');
      const config: AxiosRequestConfig = {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };
      
      console.log(`🔵 PATCH Request: ${url} - Auth: ${token ? '✅' : '❌'}`);
      const response = await this.api.patch<T>(url, data, config);
      return response;
    } catch (error: any) {
      console.error(`❌ PATCH Error: ${url}`, error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.detail || `HTTP ${error.response.status}`;
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error: No response received');
    } else {
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  // ✅ Method to manually set auth header globally
  setAuthHeader(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // ✅ Method to clear auth header
  clearAuthHeader(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // ✅ Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  getBaseURL(): string {
    return this.api.defaults.baseURL || '';
  }
}

export const apiService = new ApiService();