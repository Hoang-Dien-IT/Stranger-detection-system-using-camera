// src/types/common.types.ts
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }
  
  export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
  }
  
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  export interface SelectOption {
    label: string;
    value: string;
  }
  
  // Keep file as module
  export {};