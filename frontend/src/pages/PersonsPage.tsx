import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Upload,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { personService } from '@/services/person.service';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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

interface Person {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  face_images_count: number;
  created_at: string;
  metadata?: any;
}

const PersonsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; person: Person | null }>({
    open: false,
    person: null
  });

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await personService.getPersons();
      setPersons(response);
    } catch (error) {
      console.error('Error loading persons:', error);
      toast.error('Failed to load persons');
    } finally {
      setLoading(false);
    }
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePerson = async (person: Person) => {
    try {
      await personService.deletePerson(person.id);
      toast.success('Person deleted successfully');
      loadPersons();
      setDeleteDialog({ open: false, person: null });
    } catch (error) {
      toast.error('Failed to delete person');
    }
  };

  const handleToggleStatus = async (person: Person) => {
    try {
      await personService.updatePerson(person.id, { is_active: !person.is_active });
      toast.success(`Person ${person.is_active ? 'deactivated' : 'activated'} successfully`);
      loadPersons();
    } catch (error) {
      toast.error('Failed to update person status');
    }
  };

  const handleBulkImport = () => {
    console.log('🔵 PersonsPage: Bulk import button clicked');
    console.log('🔵 PersonsPage: Current path:', location.pathname);
    
    // ✅ Navigate to correct bulk-import path
    const targetPath = '/persons/bulk-import';
    console.log('🔵 PersonsPage: Navigating to:', targetPath);
    
    try {
      navigate(targetPath);
    } catch (error) {
      console.error('❌ PersonsPage: Navigation failed:', error);
      toast.error('Failed to navigate to bulk import');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-1">Người đã biết</h1>
            <p className="text-gray-500 text-base">Quản lý cơ sở dữ liệu người đã biết của bạn</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="w-4 h-4 mr-2" />
            Nhập nhiều
          </Button>
          <Button onClick={() => navigate('/persons/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm người
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm người..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Persons Grid */}
      {filteredPersons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPersons.map((person) => (
            <Card key={person.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/api/persons/${person.id}/avatar`} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {person.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{person.name}</CardTitle>
                      <div className="flex space-x-1 mt-1">
                        <Badge variant={person.is_active ? "default" : "secondary"}>
                          {person.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                        </Badge>
                        <Badge variant="outline">
                          {person.face_images_count} {person.face_images_count === 1 ? 'ảnh' : 'ảnh'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/persons/${person.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(person)}>
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
                        onClick={() => setDeleteDialog({ open: true, person })}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa người
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {person.description || 'Chưa có mô tả'}
                  </p>
                  {person.metadata && Object.keys(person.metadata).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(person.metadata).slice(0, 2).map(([key, value]) => (
                        <p key={key} className="text-xs text-gray-500">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400">
                    Ngày thêm: {new Date(person.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/persons/${person.id}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/persons/${person.id}/edit`)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người nào</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Không có người nào phù hợp với tiêu chí tìm kiếm.' : 'Hãy bắt đầu bằng cách thêm người đầu tiên.'}
            </p>
            <Button onClick={() => navigate('/persons/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm người
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, person: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{deleteDialog.person?.name}" không? Hành động này không thể hoàn tác.
              Tất cả ảnh khuôn mặt và lịch sử nhận diện liên quan cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.person && handleDeletePerson(deleteDialog.person)}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonsPage;