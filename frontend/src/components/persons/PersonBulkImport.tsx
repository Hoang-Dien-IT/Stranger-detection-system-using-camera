import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Check,
  X,
  AlertTriangle,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { personService } from '@/services/person.service';
import { toast } from 'sonner';

// ✅ Updated interfaces to match backend
interface BulkImportPerson {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  face_images?: string[];
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

// ✅ Updated to match backend response from person_service.py
interface ImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors: string[];
  details?: Array<{
    person_name: string;
    success: boolean;
    error?: string;
  }>;
}

const PersonBulkImport: React.FC = () => {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<BulkImportPerson[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) {
              // ✅ Validate data structure
              const validPersons = data.filter(person => {
                if (typeof person !== 'object' || !person.name) {
                  console.warn('Invalid person object:', person);
                  return false;
                }
                return true;
              });

              if (validPersons.length === 0) {
                toast.error('No valid persons found in the JSON file');
                return;
              }

              setPersons(validPersons.map(person => ({ 
                ...person, 
                status: 'pending' as const,
                // ✅ Ensure metadata is object
                metadata: person.metadata || {}
              })));
              
              toast.success(`Loaded ${validPersons.length} valid persons from JSON file`);
              
              if (validPersons.length < data.length) {
                toast.warning(`${data.length - validPersons.length} invalid entries were skipped`);
              }
            } else {
              toast.error('Invalid JSON format. Expected an array of person objects.');
            }
          } catch (error) {
            console.error('JSON parse error:', error);
            toast.error('Failed to parse JSON file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      } else {
        toast.error('Please upload a JSON file');
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB limit
  });

  // ✅ Updated template to match backend KnownPersonCreate model
  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        description: "Employee - IT Department",
        metadata: {
          department: "IT",
          employee_id: "EMP001",
          position: "Software Engineer", 
          email: "john.doe@company.com",
          phone: "+1 (555) 123-4567",
          access_level: "medium"
        },
        face_images: [
          "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        ]
      },
      {
        name: "Jane Smith",
        description: "Manager - Marketing",
        metadata: {
          department: "Marketing",
          employee_id: "EMP002",
          position: "Marketing Manager",
          email: "jane.smith@company.com",
          access_level: "high"
        }
      },
      {
        name: "Bob Wilson",
        description: "Security Officer",
        metadata: {
          department: "Security",
          employee_id: "EMP003",
          position: "Security Officer",
          access_level: "high",
          shift: "night"
        },
        face_images: []
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'persons-import-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  // ✅ Enhanced validation following backend rules
  const validatePersons = (): boolean => {
    const errors: string[] = [];
    
    persons.forEach((person, index) => {
      // Name validation (required, min 1 char, max 100 chars from backend model)
      if (!person.name || typeof person.name !== 'string') {
        errors.push(`Person ${index + 1}: Name is required`);
      } else if (person.name.trim().length < 1) {
        errors.push(`Person ${index + 1}: Name cannot be empty`);
      } else if (person.name.length > 100) {
        errors.push(`Person ${index + 1}: Name must be less than 100 characters`);
      }
      
      // Description validation (optional)
      if (person.description && typeof person.description !== 'string') {
        errors.push(`Person ${index + 1}: Description must be a string`);
      }
      
      // Metadata validation
      if (person.metadata) {
        if (typeof person.metadata !== 'object') {
          errors.push(`Person ${index + 1}: Metadata must be an object`);
        } else {
          // Email validation in metadata
          if (person.metadata.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.metadata.email)) {
            errors.push(`Person ${index + 1}: Invalid email format in metadata`);
          }
        }
      }
      
      // Face images validation
      if (person.face_images) {
        if (!Array.isArray(person.face_images)) {
          errors.push(`Person ${index + 1}: face_images must be an array`);
        } else {
          person.face_images.forEach((image, imgIndex) => {
            if (typeof image !== 'string') {
              errors.push(`Person ${index + 1}, Image ${imgIndex + 1}: Image must be a string`);
            } else if (!image.startsWith('data:image/')) {
              errors.push(`Person ${index + 1}, Image ${imgIndex + 1}: Invalid image format (must be base64)`);
            }
          });
          
          // Check minimum images requirement (at least 8 images required)
          if (person.face_images.length < 8) {
            errors.push(`Person ${index + 1}: Minimum 8 face images required, found ${person.face_images.length}`);
          }
        }
      }
    });

    if (errors.length > 0) {
      toast.error(`Validation failed: ${errors[0]}`);
      console.warn('Validation errors:', errors);
      return false;
    }

    return true;
  };

  // ✅ Individual import method (fallback when bulk import not available)
  const handleIndividualImports = async (): Promise<ImportResult> => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const details: Array<{person_name: string; success: boolean; error?: string}> = [];

    for (let i = 0; i < persons.length; i++) {
      const person = persons[i];
      try {
        console.log(`🔵 PersonBulkImport: Creating person ${i + 1}/${persons.length}: ${person.name}`);
        
        // ✅ Create person using backend KnownPersonCreate structure
        const createdPerson = await personService.createPerson({
          name: person.name.trim(),
          description: person.description || undefined,
          metadata: person.metadata || {}
        });

        console.log(`✅ PersonBulkImport: Person created: ${createdPerson.id}`);

        // ✅ Add face images if provided (following backend add_face_image method)
        if (person.face_images && person.face_images.length > 0) {
          let imageSuccessCount = 0;
          for (const imageBase64 of person.face_images) {
            try {
              await personService.addFaceImage(createdPerson.id, imageBase64);
              imageSuccessCount++;
            } catch (imageError: any) {
              console.error(`Failed to add face image for ${person.name}:`, imageError);
              // Continue with other images even if one fails
            }
          }
          console.log(`✅ PersonBulkImport: Added ${imageSuccessCount}/${person.face_images.length} face images`);
        }

        // Update person status to success
        setPersons(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'success' as const } : p
        ));
        
        details.push({ person_name: person.name, success: true });
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ PersonBulkImport: Failed to import ${person.name}:`, error);
        
        const errorMsg = error.response?.data?.detail || error.message || 'Failed to import';
        errors.push(`${person.name}: ${errorMsg}`);
        
        // Update person status to error
        setPersons(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'error' as const, error: errorMsg } : p
        ));
        
        details.push({ person_name: person.name, success: false, error: errorMsg });
        failedCount++;
      }

      // Update progress
      const progress = ((i + 1) / persons.length) * 100;
      setImportProgress(progress);
    }

    return {
      success: failedCount === 0,
      imported_count: successCount,
      failed_count: failedCount,
      errors,
      details
    };
  };

  // ✅ Updated import handler with proper error handling
  const handleImport = async () => {
    if (persons.length === 0) {
      toast.error('No persons to import');
      return;
    }

    if (!validatePersons()) {
      return;
    }

    try {
      setImporting(true);
      setImportProgress(0);
      setImportResult(null);

      console.log(`🔵 PersonBulkImport: Starting import of ${persons.length} persons`);

      // ✅ Reset all persons status
      setPersons(prev => prev.map(p => ({ ...p, status: 'pending' as const, error: undefined })));

      // ✅ Try bulk import first (if backend supports it)
      try {
        console.log('🔵 PersonBulkImport: Attempting bulk import...');
        
        // Check if bulk import method exists
        if (typeof personService.bulkImportPersons === 'function') {
          const bulkResult = await personService.bulkImportPersons(persons);
          
          console.log('✅ PersonBulkImport: Bulk import completed:', bulkResult);

          // ✅ FIX: Handle backend response format with proper null coalescing
          const importResult: ImportResult = {
            success: bulkResult.success,
            imported_count: bulkResult.imported_count ?? 0,
            failed_count: bulkResult.failed_count ?? 0,
            errors: bulkResult.errors || []
          };

          setImportResult(importResult);

          // Update persons status based on bulk result
          if (bulkResult.success) {
            setPersons(prev => prev.map(p => ({ ...p, status: 'success' as const })));
            toast.success(`Successfully imported all ${importResult.imported_count} persons via bulk import`);
          } else {
            // For partial success in bulk import
            setPersons(prev => prev.map((p, index) => ({
              ...p,
              status: index < importResult.imported_count ? 'success' as const : 'error' as const,
              error: index >= importResult.imported_count ? 'Failed in bulk import' : undefined
            })));
            
            if (importResult.imported_count > 0) {
              toast.warning(`Bulk import partially succeeded: ${importResult.imported_count} imported, ${importResult.failed_count} failed`);
            } else {
              toast.error('Bulk import failed completely');
            }
          }
          
          setImportProgress(100);
          return; // Exit early on successful bulk import
        } else {
          console.warn('⚠️ PersonBulkImport: Bulk import method not available');
        }
        
      } catch (bulkError: any) {
        console.warn('⚠️ PersonBulkImport: Bulk import failed, falling back to individual imports:', bulkError);
      }

      // ✅ Fallback to individual imports
      console.log('🔵 PersonBulkImport: Using individual import fallback...');
      const individualResult = await handleIndividualImports();
      
      setImportResult(individualResult);

      if (individualResult.success) {
        toast.success(`Successfully imported all ${individualResult.imported_count} persons individually`);
      } else if (individualResult.imported_count > 0) {
        toast.warning(`Partially successful: ${individualResult.imported_count} imported, ${individualResult.failed_count} failed`);
      } else {
        toast.error('Import failed for all persons');
      }

    } catch (error: any) {
      console.error('❌ PersonBulkImport: Import process failed:', error);
      toast.error(`Import process failed: ${error.message || 'Unknown error'}`);
      
      // Set error result
      setImportResult({
        success: false,
        imported_count: 0,
        failed_count: persons.length,
        errors: [`Import process failed: ${error.message || 'Unknown error'}`]
      });
      
    } finally {
      setImporting(false);
      setImportProgress(100);
    }
  };

  // ✅ Helper functions for UI
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300 animate-pulse" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Pending</Badge>;
    }
  };

  // ✅ Clear function
  const handleClear = () => {
    setPersons([]);
    setImportResult(null);
    setImportProgress(0);
    toast.info('Cleared all persons');
  };

  return (

    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/persons')} className="text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Nhập hồ sơ hàng loạt</h1>
            <p className="text-black">Tải lên nhiều hồ sơ nhân sự từ tệp JSON theo mẫu chuẩn của hệ thống</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
          <Download className="h-4 w-4 mr-2" />
          Tải file mẫu
        </Button>
      </div>

      {/* Instructions */}
      <Alert className="border-cyan-200 bg-cyan-50">
        <FileText className="h-4 w-4 text-cyan-600" />
        <AlertDescription className="text-black">
          <b>Hướng dẫn:</b> Tải lên tệp JSON chứa danh sách hồ sơ nhân sự. <br />
          <span className="text-black">Mỗi hồ sơ <b>phải có</b> trường <b>"name"</b> (bắt buộc), có thể thêm <b>"description"</b>, <b>"metadata"</b>, <b>"face_images"</b>.<br />
          Xem file mẫu để biết định dạng chuẩn. Tối đa 10 ảnh khuôn mặt/người.</span>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card className="border-cyan-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-cyan-800">Tải lên tệp JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-cyan-400 bg-cyan-50' 
                : 'border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-cyan-700">Kéo thả tệp JSON vào đây...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-black mb-2">Kéo thả hoặc bấm để chọn tệp JSON</p>
                <p className="text-sm text-black">Chỉ chấp nhận tệp .json (tối đa 10MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ Preview & Import */}
      {persons.length > 0 && (
        <Card className="border-teal-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-emerald-800">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Xem Trước ({persons.length} hồ sơ)</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClear} disabled={importing} className="border-cyan-200 text-black hover:bg-cyan-50">
                  Xóa tất cả
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing || persons.length === 0}
                  className="min-w-32 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-md"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Đang nhập...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Nhập tất cả
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            {importing && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-700">Tiến Độ Nhập</span>
                  <span className="text-sm text-emerald-700">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2 bg-emerald-100" />
              </div>
            )}

            {/* Persons List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {persons.map((person, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg bg-white hover:bg-teal-50 border-teal-100 transition-colors">
                  <div className="flex-shrink-0">
                    {getStatusIcon(person.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-medium text-emerald-900 truncate">{person.name}</h4>
                      {getStatusBadge(person.status)}
                    </div>
                    <div className="text-sm text-black space-y-1">
                      {person.description && (
                        <p className="truncate text-black">{person.description}</p>
                      )}
                      <div className="flex items-center space-x-4 flex-wrap">
                        {person.metadata?.department && (
                          <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                            {person.metadata.department}
                          </span>
                        )}
                        {person.metadata?.employee_id && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">
                            Mã NV: {person.metadata.employee_id}
                          </span>
                        )}
                        {person.face_images && person.face_images.length > 0 && (
                          <span className="flex items-center bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {person.face_images.length} ảnh
                          </span>
                        )}
                      </div>
                      {person.error && (
                        <p className="text-red-600 text-xs flex items-start bg-red-50 p-2 rounded">
                          <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          {person.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Import Result */}
      {importResult && (
        <Card className="border-teal-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              {importResult.success ? (
                <Check className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span>Kết Quả Nhập Dữ Liệu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">
                  {importResult.imported_count}
                </div>
                <div className="text-sm text-black">Nhập thành công</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failed_count}
                </div>
                <div className="text-sm text-black">Thất bại</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-600">{persons.length}</div>
                <div className="text-sm text-black">Tổng số hồ sơ</div>
              </div>
            </div>

            {/* Errors Display */}
            {importResult.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Lỗi Khi Nhập Dữ Liệu ({importResult.errors.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-red-50 p-4 rounded-lg border border-red-200">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 flex items-start">
                      <span className="font-medium mr-2">{index + 1}.</span>
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClear} className="border-cyan-200 text-black hover:bg-cyan-50">
                Nhập thêm
              </Button>
              <Button onClick={() => navigate('/persons')} className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-md">
                Về danh sách hồ sơ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonBulkImport;