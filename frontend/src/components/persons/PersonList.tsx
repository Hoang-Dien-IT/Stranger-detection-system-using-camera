import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Image,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Person {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  face_images_count: number; // ✅ Match backend
  metadata?: {
    department?: string;
    employee_id?: string;
    phone?: string;
    email?: string;
    position?: string;
    access_level?: string;
  };
}


interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewDetails: (person: Person) => void;
  onToggleStatus: (person: Person) => void;
  loading?: boolean;
}

const PersonList: React.FC<PersonListProps> = ({
  persons,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleStatus,
  loading = false
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (persons.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-emerald-900 mb-2">Chưa có hồ sơ nào</h3>
        <p className="text-black mb-6">Hãy thêm nhân sự vào hệ thống nhận diện khuôn mặt.</p>
        <Button className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm hồ sơ
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {persons.map((person) => (
        <Card key={person.id} className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12">
                    {/* ✅ Fix: Use gradient fallback since no primary image */}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-emerald-900 truncate">
                      {person.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={person.is_active ? "default" : "secondary"} className="text-black">
                        {person.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                      </Badge>
                      <div className="flex items-center text-xs text-black">
                        <Image className="h-3 w-3 mr-1" />
                        {person.face_images_count} ảnh
                      </div>
                    </div>
                  </div>
                </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(person)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(person)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(person)}>
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
                        onClick={() => onDelete(person)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
              {/* Description */}
              {person.description && (
                <p className="text-sm text-black line-clamp-2">
                  {person.description}
                </p>
              )}

              {/* Metadata */}
              {person.metadata && (
                <div className="space-y-1">
                  {person.metadata.department && (
                    <div className="text-xs text-black">
                      <span className="font-medium">Phòng ban:</span> {person.metadata.department}
                    </div>
                  )}
                  {person.metadata.employee_id && (
                    <div className="text-xs text-black">
                      <span className="font-medium">Mã NV:</span> {person.metadata.employee_id}
                    </div>
                  )}
                  {person.metadata.phone && (
                    <div className="text-xs text-black">
                      <span className="font-medium">Điện thoại:</span> {person.metadata.phone}
                    </div>
                  )}
                </div>
              )}

              {/* ✅ Remove images grid since backend doesn't provide images array */}
              {/* Face images count display instead */}
              {person.face_images_count > 0 && (
                <div className="flex items-center justify-center p-3 bg-cyan-50 rounded-lg">
                  <Image className="h-4 w-4 mr-2 text-cyan-600" />
                  <span className="text-sm text-black">
                    {person.face_images_count} ảnh khuôn mặt
                  </span>
                </div>
              )}

              {/* Action Buttons remain the same */}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(person)}
                  className="flex-1 text-black border-cyan-300 hover:bg-cyan-50"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Xem
                </Button>
                <Button
                  size="sm"
                  onClick={() => onEdit(person)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Chỉnh sửa
                </Button>
              </div>

              {/* Footer */}
              <div className="text-xs text-black pt-2 border-t flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-cyan-600" />
                  Thêm: {formatDate(person.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PersonList;