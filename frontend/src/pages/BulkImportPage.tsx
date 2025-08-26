import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Users, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';

const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleClear = () => {
    // Reset any import state or clear selected files
    console.log('🔵 BulkImportPage: Clearing import data');
  toast.success('Sẵn sàng cho lần nhập mới');
  };

  const handleImport = async () => {
    // Implementation here...
    setImporting(true);
    
    try {
      // ✅ Test API endpoint accessibility first
      console.log('🔵 BulkImportPage: Testing bulk import endpoint...');
      
      // Add your import logic here
  toast.success('Chức năng nhập đã sẵn sàng!');
      
    } catch (error: any) {
      console.error('❌ BulkImportPage: Import failed:', error);
  toast.error(`Nhập thất bại: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

    const handleBackToPersons = () => {
    console.log('🔵 PersonBulkImport: Navigating back to persons');
    navigate('/persons'); 
  };

  const handleGoToPersonsList = () => {
    console.log('🔵 PersonBulkImport: Going to persons list after import');
    navigate('/persons'); 
  };

  const downloadTemplate = () => {
    const template = [
      {
        "name": "John Doe",
        "description": "Employee",
        "metadata": {
          "department": "IT",
          "employee_id": "EMP001"
        },
        "face_images": ["data:image/jpeg;base64,..."]
      }
    ];
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_import_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  toast.success('Tải mẫu thành công!');
  };

  return (

    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackToPersons}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách người
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhập nhiều người cùng lúc</h1>
            <p className="text-gray-600">Nhập nhiều người đã biết từ tệp JSON</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Tải mẫu JSON
        </Button>
      </div>
      <div className="max-w-4xl mx-auto">
        {/* ✅ Header with back navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/persons')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách người</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhập nhiều người cùng lúc</h1>
            <p className="text-slate-600">Nhập nhiều người với dữ liệu khuôn mặt từ tệp JSON</p>
          </div>
        </div>

        {/* ✅ Rest of your existing BulkImportPage content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Tải tệp lên</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Kéo và thả tệp JSON vào đây hoặc bấm để chọn tệp</p>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Chọn tệp
                </Button>
              </div>
              
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                {importing ? 'Đang kiểm tra...' : 'Kiểm tra nhập dữ liệu'}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          {importResult && (
            <Card>
              <CardContent>
                {/* ... existing content ... */}
                
                {/* ✅ Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClear}>
                    Nhập thêm
                  </Button>
                  <Button onClick={handleGoToPersonsList}>
                    Đến danh sách người
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportPage;