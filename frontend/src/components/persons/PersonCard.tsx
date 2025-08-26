import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Image,
  Calendar,
  UserCheck,
  UserX,
  Building,
  Badge as BadgeIcon,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface Person {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  face_images_count: number;
  created_at: string;
  updated_at?: string;
  metadata?: {
    department?: string;
    employee_id?: string;
    phone?: string;
    email?: string;
    position?: string;
    access_level?: string;
  };
}

interface PersonCardProps {
  person: Person;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onViewDetails?: (person: Person) => void;
  onToggleStatus?: (person: Person) => void;
  showActions?: boolean;
  compact?: boolean;
}


const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleStatus,
  showActions = true,
  compact = false
}) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAccessLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(person);
    } else {
      navigate(`/persons/${person.id}/edit`);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(person);
    } else {
      navigate(`/persons/${person.id}`);
    }
  };

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(person);
    } else {
      toast.info('Toggle status functionality not implemented');
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setIsLoading(true);
      try {
        await onDelete(person);
        setShowDeleteDialog(false);
        toast.success('Person deleted successfully');
      } catch (error) {
        toast.error('Failed to delete person');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`/api/persons/${person.id}/avatar`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-emerald-900 truncate">{person.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={person.is_active ? "default" : "secondary"} className="text-xs text-black">
                  {person.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </Badge>
                <span className="text-xs text-black">
                  {person.face_images_count} ảnh
                </span>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleStatus}>
                    {person.is_active ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Ngưng hoạt động
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Kích hoạt
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`/api/persons/${person.id}/avatar`} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {getInitials(person.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-900 truncate">{person.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={person.is_active ? "default" : "secondary"} className="text-black">
                    {person.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-black border-cyan-300">
                    <Image className="h-3 w-3 mr-1" />
                    {person.face_images_count} ảnh
                  </Badge>
                  {person.metadata?.access_level && (
                    <Badge className={`text-xs border-cyan-300 text-cyan-800 bg-cyan-100`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {person.metadata.access_level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Person
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleStatus}>
                    {person.is_active ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Person
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Description */}
          {person.description && (
            <p className="text-sm text-black line-clamp-2">
              {person.description}
            </p>
          )}

          {/* Metadata */}
          {person.metadata && (
            <div className="space-y-2">
              {person.metadata.department && (
                <div className="flex items-center text-xs text-black">
                  <Building className="h-3 w-3 mr-2" />
                  <span className="font-medium">Phòng ban:</span>
                  <span className="ml-1">{person.metadata.department}</span>
                </div>
              )}
              
              {person.metadata.employee_id && (
                <div className="flex items-center text-xs text-black">
                  <BadgeIcon className="h-3 w-3 mr-2" />
                  <span className="font-medium">Mã NV:</span>
                  <span className="ml-1">{person.metadata.employee_id}</span>
                </div>
              )}

              {person.metadata.position && (
                <div className="flex items-center text-xs text-black">
                  <User className="h-3 w-3 mr-2" />
                  <span className="font-medium">Chức vụ:</span>
                  <span className="ml-1">{person.metadata.position}</span>
                </div>
              )}

              {person.metadata.email && (
                <div className="flex items-center text-xs text-black">
                  <Mail className="h-3 w-3 mr-2" />
                  <span className="truncate">{person.metadata.email}</span>
                </div>
              )}

              {person.metadata.phone && (
                <div className="flex items-center text-xs text-black">
                  <Phone className="h-3 w-3 mr-2" />
                  <span>{person.metadata.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              className="flex-1 text-black border-cyan-300 hover:bg-cyan-50"
            >
              <Eye className="w-4 h-4 mr-1" />
              Xem
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
            >
              <Edit className="w-4 h-4 mr-1" />
              Chỉnh sửa
            </Button>
          </div>

          {/* Footer */}
          <div className="text-xs text-black pt-2 border-t flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Thêm: {formatDate(person.created_at)}
            </div>
            {person.updated_at && person.updated_at !== person.created_at && (
              <span>Cập nhật: {formatDate(person.updated_at)}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hồ sơ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{person.name}"? Thao tác này không thể hoàn tác và sẽ xóa toàn bộ ảnh khuôn mặt, lịch sử nhận diện liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PersonCard;