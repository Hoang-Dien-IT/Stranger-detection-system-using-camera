export interface Person {
  id: string;
  name: string;
  description?: string;
  // ✅ ADD: Additional information fields  
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  face_images_count: number;
  face_images?: Array<{
    image_url: string;
    created_at: string;
    is_primary: boolean;
  }>;
}

export interface PersonDetail {
  id: string;
  name: string;
  description?: string;
  // ✅ ADD: Additional information fields  
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  face_images_count: number;
  face_images?: Array<{
    image_url: string;
    created_at: string;
    is_primary: boolean;
  }>;
}
  
export interface FaceImage {
  image_url: string;
  uploaded_at: string;
}

export interface PersonCreate {
  name: string;
  description?: string;
  // ✅ ADD: Additional information fields
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  metadata?: Record<string, any>;
}
  
export interface PersonUpdate {
  name?: string;
  description?: string;
  // ✅ ADD: Additional information fields
  department?: string;
  employee_id?: string;
  position?: string;
  access_level?: string;
  metadata?: Record<string, any>;
  is_active?: boolean;
}
  
export interface PersonStats {
  total_persons: number;
  active_persons: number;
  total_face_images: number;
  recent_additions: number;
}
  
export interface PersonState {
  persons: Person[];
  selectedPerson: Person | null;
  stats: PersonStats | null;
  isLoading: boolean;
  error: string | null;
}
  
// ✅ Add the missing PersonDetailResponse interface
export interface PersonDetailResponse {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string; // Required field in detail response
  face_images_count: number;
  face_images: FaceImageResponse[]; // Full face images data
  metadata?: {
    department?: string;
    employee_id?: string;
    phone?: string;
    email?: string;
    position?: string;
    access_level?: string;
  };
}
  
// ✅ Add the FaceImageResponse interface
export interface FaceImageResponse {
  image_url: string;
  uploaded_at: string;
  is_primary?: boolean;
}