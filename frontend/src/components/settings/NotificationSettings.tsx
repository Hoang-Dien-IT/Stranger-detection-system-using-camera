import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  Clock,
  Plus,
  Camera,
  Trash2,
  Shield,
  AlertTriangle,
  Info,
  Volume2,
  VolumeX,
  Save,
  Zap,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { useAuth } from '@/contexts/AuthContext';
import { settingsService } from '@/services/settings.service';
import { toast } from 'sonner';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'push' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
}

interface NotificationRule {
  id: string;
  event_type: string;
  channels: string[];
  conditions: Record<string, any>;
  enabled: boolean;
  schedule?: {
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    days_of_week?: number[];
  };
}

interface NotificationSettingsData {
  global_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  detection_alerts: boolean;
  system_alerts: boolean;
  security_alerts: boolean;
  weekly_reports: boolean;
  immediate_alerts: boolean;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  alert_threshold: number;
  channels: NotificationChannel[];
  rules: NotificationRule[];
}

interface NotificationSettingsProps {
  onSave?: (data: NotificationSettingsData) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onSave }) => {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<NotificationSettingsData>({
    global_enabled: true,
    email_enabled: true,
    push_enabled: true,
    sound_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    detection_alerts: true,
    system_alerts: true,
    security_alerts: true,
    weekly_reports: true,
    immediate_alerts: true,
    digest_frequency: 'realtime',
    alert_threshold: 0.7,
    channels: [],
    rules: []
  });

  const [testNotification, setTestNotification] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getNotificationSettings();
      setSettings(response);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      await settingsService.updateNotificationSettings(settings);
      
      onSave?.(settings);
      toast.success('Notification settings saved successfully');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestNotification(true);
      await settingsService.sendTestNotification();
      toast.success('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTestNotification(false);
    }
  };

  const addNotificationChannel = () => {
    const newChannel: NotificationChannel = {
      id: Date.now().toString(),
      name: 'New Channel',
      type: 'email',
      enabled: true,
      config: {}
    };
    
    setSettings(prev => ({
      ...prev,
      channels: [...prev.channels, newChannel]
    }));
  };

  const removeNotificationChannel = (channelId: string) => {
    setSettings(prev => ({
      ...prev,
      channels: prev.channels.filter(c => c.id !== channelId)
    }));
  };


  const getChannelTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'webhook':
        return <Zap className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Bell className="h-5 w-5 text-cyan-600" />
            <span>Cài đặt thông báo chung</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium text-black">Bật thông báo</Label>
              <p className="text-sm text-black">
                Bật/tắt toàn bộ thông báo hệ thống
              </p>
            </div>
            <Switch
              checked={settings.global_enabled}
              onCheckedChange={(checked) => handleSettingChange('global_enabled', checked)}
            />
          </div>

          <Separator />

          {/* Channel Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Mail className="h-4 w-4 text-cyan-600" />
                  <span>Thông báo Email</span>
                </Label>
                <p className="text-sm text-black">
                  Nhận thông báo qua email
                </p>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Smartphone className="h-4 w-4 text-cyan-600" />
                  <span>Thông báo đẩy</span>
                </Label>
                <p className="text-sm text-black">
                  Nhận thông báo đẩy trên trình duyệt
                </p>
              </div>
              <Switch
                checked={settings.push_enabled}
                onCheckedChange={(checked) => handleSettingChange('push_enabled', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  {settings.sound_enabled ? <Volume2 className="h-4 w-4 text-cyan-600" /> : <VolumeX className="h-4 w-4 text-cyan-600" />}
                  <span>Cảnh báo âm thanh</span>
                </Label>
                <p className="text-sm text-black">
                  Phát âm thanh khi có thông báo
                </p>
              </div>
              <Switch
                checked={settings.sound_enabled}
                onCheckedChange={(checked) => handleSettingChange('sound_enabled', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <AlertTriangle className="h-4 w-4 text-cyan-600" />
                  <span>Cảnh báo khẩn cấp</span>
                </Label>
                <p className="text-sm text-black">
                  Thông báo ưu tiên cao, gửi ngay lập tức
                </p>
              </div>
              <Switch
                checked={settings.immediate_alerts}
                onCheckedChange={(checked) => handleSettingChange('immediate_alerts', checked)}
                disabled={!settings.global_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event-based Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Activity className="h-5 w-5 text-cyan-600" />
            <span>Thông báo sự kiện</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Camera className="h-4 w-4 text-cyan-600" />
                  <span>Cảnh báo phát hiện khuôn mặt</span>
                </Label>
                <p className="text-sm text-black">
                  Thông báo khi phát hiện khuôn mặt trên camera
                </p>
              </div>
              <Switch
                checked={settings.detection_alerts}
                onCheckedChange={(checked) => handleSettingChange('detection_alerts', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Settings className="h-4 w-4 text-cyan-600" />
                  <span>Cảnh báo hệ thống</span>
                </Label>
                <p className="text-sm text-black">
                  Thông báo về trạng thái và bảo trì hệ thống
                </p>
              </div>
              <Switch
                checked={settings.system_alerts}
                onCheckedChange={(checked) => handleSettingChange('system_alerts', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Shield className="h-4 w-4 text-cyan-600" />
                  <span>Cảnh báo bảo mật</span>
                </Label>
                <p className="text-sm text-black">
                  Thông báo về đăng nhập và sự kiện bảo mật
                </p>
              </div>
              <Switch
                checked={settings.security_alerts}
                onCheckedChange={(checked) => handleSettingChange('security_alerts', checked)}
                disabled={!settings.global_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center space-x-2 text-black">
                  <Mail className="h-4 w-4 text-cyan-600" />
                  <span>Báo cáo hàng tuần</span>
                </Label>
                <p className="text-sm text-black">
                  Tổng hợp hoạt động hàng tuần
                </p>
              </div>
              <Switch
                checked={settings.weekly_reports}
                onCheckedChange={(checked) => handleSettingChange('weekly_reports', checked)}
                disabled={!settings.global_enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Alert Threshold */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="alert_threshold" className="text-black">Ngưỡng tin cậy phát hiện</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Input
                  id="alert_threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.alert_threshold}
                  onChange={(e) => handleSettingChange('alert_threshold', parseFloat(e.target.value))}
                  className="w-32"
                  disabled={!settings.global_enabled}
                />
                <span className="text-sm text-black">
                  Chỉ gửi cảnh báo khi độ tin cậy vượt ngưỡng này
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="digest_frequency" className="text-black">Tần suất thông báo</Label>
              <Select 
                value={settings.digest_frequency} 
                onValueChange={(value) => handleSettingChange('digest_frequency', value)}
              >
                <SelectTrigger className="w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Theo thời gian thực</SelectItem>
                  <SelectItem value="hourly">Tổng hợp theo giờ</SelectItem>
                  <SelectItem value="daily">Tổng hợp theo ngày</SelectItem>
                  <SelectItem value="weekly">Tổng hợp theo tuần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Clock className="h-5 w-5 text-cyan-600" />
            <span>Khung giờ yên lặng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-black">Bật khung giờ yên lặng</Label>
              <p className="text-sm text-black">
                Tạm dừng thông báo không quan trọng trong khung giờ này
              </p>
            </div>
            <Switch
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => handleSettingChange('quiet_hours_enabled', checked)}
              disabled={!settings.global_enabled}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
              <div>
                <Label htmlFor="quiet_start" className="text-black">Bắt đầu</Label>
                <Input
                  id="quiet_start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quiet_end" className="text-black">Kết thúc</Label>
                <Input
                  id="quiet_end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-cyan-800">
              <Zap className="h-5 w-5 text-cyan-600" />
              <span>Kênh thông báo</span>
            </CardTitle>
            <Button size="sm" onClick={addNotificationChannel} className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Thêm kênh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.channels.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <p className="text-black">Chưa cấu hình kênh thông báo nào</p>
              <p className="text-sm text-black">Thêm các kênh như webhook hoặc tích hợp khác</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getChannelTypeIcon(channel.type)}
                    <div>
                      <h4 className="font-medium text-black">{channel.name}</h4>
                      <p className="text-sm text-black capitalize">Kênh: {channel.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(checked) => {
                        const updatedChannels = settings.channels.map(c =>
                          c.id === channel.id ? { ...c, enabled: checked } : c
                        );
                        handleSettingChange('channels', updatedChannels);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotificationChannel(channel.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-cyan-800">Kiểm tra & Lưu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-cyan-200 bg-cyan-50">
            <Info className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-black">
              Hãy kiểm tra thử trước khi lưu để đảm bảo cấu hình thông báo hoạt động đúng.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={testNotification || !settings.global_enabled}
              className="text-black border-cyan-300 hover:bg-cyan-50"
            >
              {testNotification ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Gửi thử thông báo
                </>
              )}
            </Button>

            <Button onClick={handleSaveSettings} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu cấu hình
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;