import { User } from '@/types/auth.types';

export const checkPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  if (user.is_admin) return true;
  return user.permissions?.includes(permission) || false;
};

export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  if (user.is_admin) return true;
  return permissions.some(permission => user.permissions?.includes(permission));
};

export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  if (user.is_admin) return true;
  return permissions.every(permission => user.permissions?.includes(permission));
};

export const getRolePermissions = (role: 'admin' | 'user' | 'viewer'): string[] => {
  const rolePermissions = {
    admin: [
      'admin.dashboard',
      'admin.users',
      'admin.system',
      'users.manage',
      'cameras.manage',
      'persons.manage',
      'detections.manage',
      'settings.manage'
    ],
    user: [
      'cameras.view',
      'cameras.create',
      'cameras.update',
      'cameras.delete',
      'persons.view',
      'persons.create',
      'persons.update',
      'persons.delete',
      'detections.view',
      'detections.delete',
      'settings.view',
      'settings.update'
    ],
    viewer: [
      'cameras.view',
      'persons.view',
      'detections.view'
    ]
  };
  
  return rolePermissions[role] || rolePermissions.user;
};