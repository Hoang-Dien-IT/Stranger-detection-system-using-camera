import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Trash2,
  Eye,
  Download,
  Plus,
  Edit,
  X,
  RefreshCw,
  Calendar,
  Activity,
  Camera,
  UserIcon,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminService } from '@/services/admin.service';
// ✅ FIX: Import unified types instead of defining locally
import { User, UserDetails, UserCreate } from '@/types/admin.types';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ✅ REMOVE: Delete local interface definitions
// interface User { ... } - DELETED
// interface UserDetails { ... } - DELETED

interface UserManagementProps {
  users: User[];
  onToggleStatus: (user: User) => void;
  onToggleAdmin: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onViewDetails: (user: User) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onToggleStatus,
  onToggleAdmin,
  onDeleteUser,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [showEditUser, setShowEditUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'last_login' | 'login_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      const matchesRole = roleFilter === 'all' ||
        (roleFilter === 'admin' && user.is_admin) ||
        (roleFilter === 'user' && !user.is_admin);

      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.full_name.toLowerCase();
          valueB = b.full_name.toLowerCase();
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case 'last_login':
          valueA = a.last_login ? new Date(a.last_login).getTime() : 0;
          valueB = b.last_login ? new Date(b.last_login).getTime() : 0;
          break;
        case 'login_count':
          // ✅ FIX: Handle undefined login_count with fallback
          valueA = a.login_count || 0;
          valueB = b.login_count || 0;
          break;
        default:
          valueA = a.created_at;
          valueB = b.created_at;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'make_admin' | 'remove_admin') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action.replace('_', ' ')} ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        if (!user) continue;

        switch (action) {
          case 'activate':
          case 'deactivate':
            await onToggleStatus({ ...user, is_active: action === 'activate' });
            break;
          case 'make_admin':
          case 'remove_admin':
            await onToggleAdmin({ ...user, is_admin: action === 'make_admin' });
            break;
          case 'delete':
            await onDeleteUser(user);
            break;
        }
      }

      toast.success(`${selectedUsers.length} user(s) ${action.replace('_', ' ')}d successfully`);
      setSelectedUsers([]);
      onRefresh?.();
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')} users`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Username', 'Email', 'Status', 'Role', 'Created', 'Last Login', 'Login Count', 'Cameras', 'Persons', 'Detections'].join(','),
      ...filteredUsers.map(user => [
        user.full_name,
        user.username,
        user.email,
        user.is_active ? 'Active' : 'Inactive',
        user.is_admin ? 'Admin' : 'User',
        new Date(user.created_at).toLocaleDateString(),
        user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
        user.login_count || 0, // ✅ FIX: Handle undefined with fallback
        user.cameras_count || 0,
        user.persons_count || 0,
        user.detections_count || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never logged in';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityColor = (lastLogin?: string) => {
    if (!lastLogin) return 'text-gray-500';
    
    const diffInDays = Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 1) return 'text-green-500';
    if (diffInDays <= 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
          <p className="text-gray-600">Quản lý người dùng hệ thống và quyền hạn</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <CreateUserDialog onUserCreated={onRefresh} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Tổng số người dùng</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Người dùng hoạt động</p>
                <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Quản trị viên</p>
                <p className="text-2xl font-bold">{users.filter(u => u.is_admin).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Đăng nhập gần đây</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.last_login && 
                    (Date.now() - new Date(u.last_login).getTime()) < 7 * 24 * 60 * 60 * 1000
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Người dùng ({filteredUsers.length})</span>
            </CardTitle>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedUsers.length} đã chọn</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Thao tác hàng loạt
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Kích hoạt người dùng
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <UserX className="h-4 w-4 mr-2" />
                      Vô hiệu hóa người dùng
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('make_admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Đặt làm quản trị viên
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('remove_admin')}>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Gỡ quyền quản trị viên
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa người dùng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="created_at">Ngày tạo</SelectItem>
                <SelectItem value="last_login">Lần đăng nhập cuối</SelectItem>
                <SelectItem value="login_count">Số lần đăng nhập</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Users Table Header */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
            <Checkbox
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
              <div className="col-span-4">Người dùng</div>
              <div className="col-span-2 hidden md:block">Trạng thái</div>
              <div className="col-span-2 hidden lg:block">Hoạt động</div>
              <div className="col-span-2 hidden xl:block">Sử dụng</div>
              <div className="col-span-2">Thao tác</div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />

                  <div className="flex-1 grid grid-cols-12 gap-4">
                    {/* User Info */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.metadata?.avatar_url} alt={user.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                          {user.is_admin && (
                            <Badge variant="destructive" className="text-xs">Quản trị viên</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 hidden md:flex flex-col justify-center">
                      <Badge variant={user.is_active ? "default" : "secondary"} className="w-fit">
                        {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        Tham gia {formatDate(user.created_at)}
                      </div>
                    </div>

                    {/* Activity */}
                    <div className="col-span-2 hidden lg:flex flex-col justify-center">
                      <div className={`text-sm font-medium ${getActivityColor(user.last_login)}`}>
                        {formatLastLogin(user.last_login)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* ✅ FIX: Handle undefined login_count */}
                        {user.login_count || 0} lần đăng nhập
                      </div>
                    </div>

                    {/* Usage */}
                    <div className="col-span-2 hidden xl:flex flex-col justify-center text-xs text-gray-600">
                      <div>{user.cameras_count || 0} camera</div>
                      <div>{user.persons_count || 0} người</div>
                      <div>{user.detections_count || 0} phát hiện</div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUserDetails(user.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowUserDetails(user.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => setShowEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa người dùng
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => onToggleAdmin(user)}>
                            {user.is_admin ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Gỡ quyền quản trị viên
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Đặt làm quản trị viên
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onDeleteUser(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa người dùng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                    ? 'Thử điều chỉnh tiêu chí tìm kiếm của bạn.'
                    : 'Chưa có người dùng nào đăng ký.'}
                </p>
                {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
                  <CreateUserDialog onUserCreated={onRefresh} />
                )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {filteredUsers.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{filteredUsers.length}</div>
                  <div className="text-sm text-gray-600">Hiển thị</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredUsers.filter(u => u.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Hoạt động</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredUsers.filter(u => u.is_admin).length}
                  </div>
                  <div className="text-sm text-gray-600">Quản trị viên</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {/* ✅ FIX: Handle undefined login_count in calculation */}
                    {Math.round(filteredUsers.reduce((sum, u) => sum + (u.login_count || 0), 0) / filteredUsers.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">TB. Đăng nhập</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserDetails && (
        <UserDetailsModal
          userId={showUserDetails}
          onClose={() => setShowUserDetails(null)}
        />
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <EditUserModal
          user={showEditUser}
          onClose={() => setShowEditUser(null)}
          onUserUpdated={onRefresh}
        />
      )}
    </div>
  );
};

// Create User Dialog Component
const CreateUserDialog: React.FC<{ onUserCreated?: () => void }> = ({ onUserCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    is_admin: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.createUser(formData);
      toast.success('User created successfully');
      setOpen(false);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        is_admin: false
      });
      onUserCreated?.();
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo người dùng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo người dùng mới</DialogTitle>
          <DialogDescription>
            Thêm người dùng mới vào hệ thống
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_admin"
              checked={formData.is_admin}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_admin: checked as boolean }))}
            />
            <Label htmlFor="is_admin">Quyền quản trị viên</Label>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Create User
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit User Modal Component
const EditUserModal: React.FC<{
  user: User;
  onClose: () => void;
  onUserUpdated?: () => void;
}> = ({ user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    is_active: user.is_active,
    is_admin: user.is_admin
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.updateUser(user.id, formData);
      toast.success('User updated successfully');
      onClose();
      onUserUpdated?.();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit User</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Full Name</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_username">Username</Label>
            <Input
              id="edit_username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_email">Email</Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit_is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="edit_is_active">Active user</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit_is_admin"
              checked={formData.is_admin}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_admin: checked as boolean }))}
            />
            <Label htmlFor="edit_is_admin">Administrator privileges</Label>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Update User
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal: React.FC<{
  userId: string;
  onClose: () => void;
}> = ({ userId, onClose }) => {
  // ✅ FIX: Use the unified UserDetails type from admin.types.ts
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        // ✅ FIX: This now returns the correct UserDetails format with proper types
        const details = await adminService.getUserDetails(userId);
        console.log('✅ UserDetailsModal: Loaded user details:', details);
        setUserDetails(details); // ✅ Now types match perfectly!
      } catch (error) {
        console.error('❌ UserDetailsModal: Error loading user details:', error);
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">User Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-gray-900 font-medium">{userDetails.user.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Username</Label>
                  <p className="text-gray-900">@{userDetails.user.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-gray-900">{userDetails.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={userDetails.user.is_active ? "default" : "secondary"}>
                      {userDetails.user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {userDetails.user.is_admin && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined</Label>
                  <p className="text-gray-900">{new Date(userDetails.user.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                  <p className="text-gray-900">
                    {userDetails.user.last_login 
                      ? new Date(userDetails.user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Camera className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{userDetails.stats.total_cameras}</p>
                  <p className="text-sm text-gray-600">Total Cameras</p>
                  <p className="text-xs text-gray-500">{userDetails.stats.active_cameras} active</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{userDetails.stats.total_persons}</p>
                  <p className="text-sm text-gray-600">Known Persons</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{userDetails.stats.recent_detections}</p>
                  <p className="text-sm text-gray-600">Recent Detections</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  {/* ✅ FIX: Handle undefined login_count */}
                  <p className="text-2xl font-bold text-orange-600">{userDetails.user.login_count || 0}</p>
                  <p className="text-sm text-gray-600">Total Logins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cameras */}
          {userDetails.cameras && userDetails.cameras.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Camera ({userDetails.cameras.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userDetails.cameras.map((camera) => (
                    <div key={camera.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{camera.name}</p>
                        <p className="text-sm text-gray-600">
                          Thêm ngày {new Date(camera.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <Badge variant={camera.is_active ? "default" : "secondary"}>
                        {camera.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Persons */}
          {userDetails.persons && userDetails.persons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Người đã biết ({userDetails.persons.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userDetails.persons.map((person) => (
                    <div key={person.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-gray-600">
                          Thêm ngày {new Date(person.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{person.face_images_count}</p>
                        <p className="text-xs text-gray-500">hình ảnh khuôn mặt</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Login History */}
          {userDetails.stats.login_history && userDetails.stats.login_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Lịch sử đăng nhập gần đây</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userDetails.stats.login_history.slice(0, 10).map((login, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(login.timestamp).toLocaleString('vi-VN')}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {login.user_agent || 'Trình duyệt không xác định'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{login.ip_address || 'IP không xác định'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty States */}
          {(!userDetails.cameras || userDetails.cameras.length === 0) && 
           (!userDetails.persons || userDetails.persons.length === 0) && (
            <Card>
              <CardContent className="text-center py-8">
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                <p className="text-gray-600">
                  Người dùng này chưa thêm camera hoặc người nào.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;