import { apiService } from './api';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unread_count: number;
}

class AlertService {
  private baseURL = '/alerts';

  async getAlerts(params?: {
    page?: number;
    limit?: number;
    type?: Alert['type'];
    read?: boolean;
  }): Promise<AlertsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());

    const response = await apiService.get<AlertsResponse>(`${this.baseURL}?${queryParams}`);
    return response.data;
  }

  async markAsRead(alertId: string): Promise<void> {
    await apiService.patch(`${this.baseURL}/${alertId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await apiService.patch(`${this.baseURL}/read-all`);
  }

  async deleteAlert(alertId: string): Promise<void> {
    await apiService.delete(`${this.baseURL}/${alertId}`);
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<{ count: number }>(`${this.baseURL}/unread-count`);
    return response.data.count;
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'read'>): Promise<Alert> {
    const response = await apiService.post<Alert>(this.baseURL, alert);
    return response.data;
  }
}

export const alertService = new AlertService();