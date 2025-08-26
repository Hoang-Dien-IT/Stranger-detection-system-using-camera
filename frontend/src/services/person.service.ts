import { apiService } from './api';

export interface FaceImage {
  id?: string;
  image_url: string;
  image_path?: string;
  confidence_score?: number;
  created_at: string;
  uploaded_at?: string; // For compatibility
  is_primary?: boolean; // For UI logic
}

export interface Person {
  id: string;
  name: string;
  description?: string;
  relationship?: string;
  is_active: boolean;
  face_images: FaceImage[];
  face_images_count: number;
  created_at: string;
  updated_at?: string;
  metadata?: any;
}

export interface PersonCreate {
  name: string;
  description?: string;
  relationship?: string;
  metadata?: any;
}

export interface PersonUpdate {
  name?: string;
  description?: string;
  relationship?: string;
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  is_active?: boolean;
  metadata?: any;
}

export interface AddFaceImageRequest {
  image_base64: string;
}

export interface FaceValidationResult {
  success: boolean;
  message: string;
  valid_images: number;
  invalid_images: number;
  details: any[];
}

export interface BulkImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  failed_count: number;
  errors: string[];
}

export interface PersonDetailResponse {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  face_images: Array<{
    image_url: string;
    uploaded_at: string;
    is_primary?: boolean;
  }>;
  face_images_count: number;
  metadata?: Record<string, any>;
}

export interface KnownPersonCreate {
  name: string;
  description?: string;
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  metadata?: Record<string, any>;
}

export interface KnownPersonResponse {
  id: string;
  name: string;
  description?: string;
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  face_images_count: number;
  metadata?: Record<string, any>;
}

export interface KnownPersonUpdate {
  name?: string;
  description?: string;
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}


class PersonService {
  async getPersons(includeInactive: boolean = false): Promise<Person[]> {
    try {
      console.log('🔵 PersonService: Getting persons...');
      
      // ✅ CRITICAL: Check auth token first
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('🔵 PersonService: Token found, making API call...');
      const response = await apiService.get<Person[]>('/persons', { 
        include_inactive: includeInactive 
      });
      console.log('✅ PersonService: Got persons:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error getting persons:', error);
      throw new Error(error.message || 'Failed to get persons');
    }
  }

  async getPerson(id: string): Promise<Person> {
    try {
      console.log('🔵 PersonService: Getting person by ID:', id);
      const response = await apiService.get<Person>(`/persons/${id}`);
      console.log('✅ PersonService: Got person:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error getting person:', error);
      throw new Error(error.message || 'Failed to get person');
    }
  }

  // async createPerson(personData: PersonCreate): Promise<Person> {
  //   try {
  //     console.log('🔵 PersonService: Creating person:', personData);
  //     const response = await apiService.post<Person>('/persons/', personData);
  //     console.log('✅ PersonService: Person created:', response.data);
  //     return response.data;
  //   } catch (error: any) {
  //     console.error('❌ PersonService: Error creating person:', error);
  //     throw new Error(error.message || 'Failed to create person');
  //   }
  // }

  async createPerson(personData: KnownPersonCreate): Promise<KnownPersonResponse> {
    try {
      console.log('🔵 PersonService: Creating person:', personData);
      
      // ✅ Prepare the payload to match backend model
      const payload: KnownPersonCreate = {
        name: personData.name.trim(),
        description: personData.description?.trim() || undefined,
        department: personData.department?.trim() || undefined,
        employee_id: personData.employee_id?.trim() || undefined,
        position: personData.position?.trim() || undefined,
        access_level: personData.access_level || undefined,
        metadata: personData.metadata || {}
      };
      
      // ✅ Remove undefined fields to avoid backend issues
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof KnownPersonCreate] === undefined) {
          delete payload[key as keyof KnownPersonCreate];
        }
      });
      
      console.log('🔵 PersonService: Final payload:', payload);
      
      const response = await apiService.post<KnownPersonResponse>('/persons/', payload);
      console.log('✅ PersonService: Person created successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error creating person:', error);
      
      // ✅ Enhanced error handling
      let errorMessage = 'Failed to create person';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async getPersonById(id: string): Promise<Person> {
    try {
      console.log('🔵 PersonService: Getting person by ID:', id);
      const response = await apiService.get<Person>(`/persons/${id}`);
      console.log('✅ PersonService: Got person:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error getting person by ID:', error);
      throw new Error(error.message || 'Failed to get person');
    }
  }

  async getPersonDetail(id: string): Promise<PersonDetailResponse> {
    try {
      console.log('🔵 PersonService: Getting person detail for:', id);
      
      // ✅ Try detailed endpoint first
      try {
        const response = await apiService.get<PersonDetailResponse>(`/persons/${id}/detail`);
        console.log('✅ PersonService: Got person detail:', response.data);
        return response.data;
      } catch (detailError) {
        // ✅ Fallback to regular endpoint and transform
        console.log('⚠️ PersonService: Detail endpoint not available, using regular endpoint');
        const person = await this.getPerson(id);
        
        return {
          ...person,
          face_images: person.face_images?.map((img: FaceImage) => ({
            image_url: img.image_url,
            uploaded_at: img.created_at || new Date().toISOString(),
            is_primary: false
          })) || [],
          face_images_count: person.face_images?.length || person.face_images_count || 0,
          updated_at: person.updated_at || person.created_at
        };
      }
    } catch (error: any) {
      console.error('❌ PersonService: Error getting person detail:', error);
      throw new Error(error.message || 'Failed to get person detail');
    }
  }

  async updatePerson(personId: string, personData: KnownPersonUpdate): Promise<KnownPersonResponse> {
    try {
      console.log('🔵 PersonService: Updating person:', personId, personData);
      
      // ✅ Enhanced validation
      if (!personId || personId.trim() === '') {
        throw new Error('Person ID is required for update');
      }
      
      if (!personData || Object.keys(personData).length === 0) {
        throw new Error('Update data is required');
      }
      
      // ✅ FIX: Build proper update payload - handle metadata properly
      const updatePayload: any = {};
      
      // Handle direct fields
      if (personData.name !== undefined) {
        updatePayload.name = personData.name?.trim() || '';
      }
      if (personData.description !== undefined) {
        updatePayload.description = personData.description?.trim() || '';
      }
      if (personData.is_active !== undefined) {
        updatePayload.is_active = personData.is_active;
      }
      
      // ✅ FIX: Handle department, employee_id, position, access_level as direct fields
      if (personData.department !== undefined) {
        updatePayload.department = personData.department?.trim() || '';
      }
      if (personData.employee_id !== undefined) {
        updatePayload.employee_id = personData.employee_id?.trim() || '';
      }
      if (personData.position !== undefined) {
        updatePayload.position = personData.position?.trim() || '';
      }
      if (personData.access_level !== undefined) {
        updatePayload.access_level = personData.access_level || '';
      }
      
      // ✅ Handle additional metadata if any
      if (personData.metadata !== undefined) {
        updatePayload.metadata = personData.metadata || {};
      }
      
      console.log('📤 PersonService: Final update payload:', updatePayload);
      console.log('📤 PersonService: API URL:', `/persons/${personId}`);
      
      const response = await apiService.put<KnownPersonResponse>(`/persons/${personId}`, updatePayload);
      
      console.log('✅ PersonService: API Response received:', response.data);
      console.log('✅ PersonService: Update successful - person data:', {
        id: response.data.id,
        name: response.data.name,
        department: response.data.department,
        employee_id: response.data.employee_id,
        position: response.data.position,
        access_level: response.data.access_level
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error updating person:', error);
      console.error('❌ PersonService: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        payload: error.config?.data
      });
      
      let errorMessage = 'Failed to update person';
      
      if (error.response?.status === 404) {
        errorMessage = 'Person not found. It may have been deleted or you may not have permission to edit it.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid update data';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async deletePerson(id: string, hardDelete: boolean = false): Promise<void> {
    try {
      console.log('🔵 PersonService: Deleting person:', id, { hardDelete });
      await apiService.delete(`/persons/${id}?hard_delete=${hardDelete}`);
      console.log('✅ PersonService: Person deleted successfully');
    } catch (error: any) {
      console.error('❌ PersonService: Error deleting person:', error);
      throw new Error(error.message || 'Failed to delete person');
    }
  }

  async addFaceImage(id: string, imageBase64: string): Promise<any> {
    try {
      console.log('🔵 PersonService: Adding face image to person:', id);
      console.log('🔵 PersonService: Image base64 length:', imageBase64.length);
      console.log('🔵 PersonService: Image base64 preview:', imageBase64.substring(0, 50) + '...');
      
      const payload = {
        image_base64: imageBase64
      };
      console.log('🔵 PersonService: Payload:', payload);
      
      const response = await apiService.post(`/persons/${id}/faces`, payload);
      console.log('✅ PersonService: Face image added:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error adding face image:', error);
      console.error('❌ PersonService: Error details:', error.response?.data);
      throw new Error(error.message || 'Failed to add face image');
    }
  }

  async uploadFaceImage(id: string, file: File): Promise<any> {
    try {
      console.log('🔵 PersonService: Uploading face image file to person:', id);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.upload(`/persons/${id}/upload-image`, formData);
      console.log('✅ PersonService: Face image uploaded:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error uploading face image:', error);
      throw new Error(error.message || 'Failed to upload face image');
    }
  }

  async regenerateFaceEmbeddings(personId: string): Promise<any> {
    try {
      console.log('🔵 PersonService: Regenerating face embeddings for person:', personId);
      
      const response = await apiService.post(`/persons/${personId}/regenerate-embeddings`);
      
      console.log('✅ PersonService: Face embeddings regenerated successfully:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ PersonService: Error regenerating face embeddings:', error);
      throw new Error(error.response?.data?.detail || 'Failed to regenerate face embeddings');
    }
  }

  async removeFaceImage(id: string, imageIndex: number): Promise<void> {
    try {
      console.log('🔵 PersonService: Removing face image:', id, imageIndex);
      await apiService.delete(`/persons/${id}/faces/${imageIndex}`);
      console.log('✅ PersonService: Face image removed successfully');
    } catch (error: any) {
      console.error('❌ PersonService: Error removing face image:', error);
      throw new Error(error.message || 'Failed to remove face image');
    }
  }

  // ✅ Validate face images
  async validateFaceImages(id: string): Promise<FaceValidationResult> {
    try {
      console.log('🔵 PersonService: Validating face images for person:', id);
      const response = await apiService.post<FaceValidationResult>(`/persons/${id}/validate`);
      console.log('✅ PersonService: Face images validated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error validating face images:', error);
      throw new Error(error.message || 'Failed to validate face images');
    }
  }

  // ✅ Bulk import persons
  async bulkImportPersons(personsData: any[]): Promise<BulkImportResult> {
    try {
      console.log('🔵 PersonService: Starting bulk import of', personsData.length, 'persons');
      console.log('🔵 PersonService: Sample person data:', personsData[0]);
      
      // ✅ Enhanced validation
      if (!Array.isArray(personsData) || personsData.length === 0) {
        throw new Error('No valid persons data provided');
      }
      
      // ✅ Validate each person has required fields
      const validatedPersons = personsData.map((person, index) => {
        if (!person.name || typeof person.name !== 'string') {
          throw new Error(`Person ${index + 1}: Name is required and must be a string`);
        }
        
        return {
          name: person.name.trim(),
          description: person.description || '',
          metadata: person.metadata || {},
          face_images: person.face_images || []
        };
      });
      
      console.log('🔵 PersonService: Validated persons data:', validatedPersons.length);
      
      const response = await apiService.post<BulkImportResult>('/persons/bulk-import', {
        persons: validatedPersons
      });
      
      console.log('✅ PersonService: Bulk import API response:', response.data);
      
      // ✅ Validate response format
      const result = {
        success: response.data.success || false,
        imported_count: response.data.imported_count || 0,
        failed_count: response.data.failed_count || 0,
        errors: response.data.errors || [],
        message: response.data.message || 'Import completed'
      };
      
      console.log('✅ PersonService: Normalized result:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ PersonService: Bulk import error:', error);
      console.error('❌ PersonService: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // ✅ Enhanced error handling
      let errorMessage = 'Failed to bulk import persons';
      
      if (error.response?.status === 404) {
        errorMessage = 'Bulk import endpoint not found. Please check backend configuration.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid request data';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // ✅ Export persons
  async exportPersons(): Promise<any> {
    try {
      console.log('🔵 PersonService: Exporting persons...');
      const response = await apiService.get('/persons/export');
      console.log('✅ PersonService: Persons exported:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error exporting persons:', error);
      throw new Error(error.message || 'Failed to export persons');
    }
  }

  // ✅ Search persons
  async searchPersons(query: string): Promise<Person[]> {
    try {
      console.log('🔵 PersonService: Searching persons with query:', query);
      const response = await apiService.get<Person[]>('/persons/search', { q: query });
      console.log('✅ PersonService: Search completed:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ PersonService: Error searching persons:', error);
      throw new Error(error.message || 'Failed to search persons');
    }
  }
}

export const personService = new PersonService();