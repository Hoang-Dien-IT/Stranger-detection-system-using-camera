import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PersonForm from '@/components/persons/PersonForm';
import PersonBulkImport from '@/components/persons/PersonBulkImport';

const PersonFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // ✅ FIX: Better route detection
  const isBulkImport = location.pathname.includes('bulk-import');
  const isEdit = Boolean(id && location.pathname.includes('edit'));

  console.log('🔍 PersonFormPage: Route analysis:', {
    pathname: location.pathname,
    id,
    isBulkImport,
    isEdit
  });

  // ✅ Show bulk import component for bulk-import route
  if (isBulkImport) {
    console.log('🔵 PersonFormPage: Rendering PersonBulkImport');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
        <PersonBulkImport />
      </div>
    );
  }

  // Show person form for create/edit
  const mode = isEdit ? 'edit' : 'create';
  
  console.log('🔵 PersonFormPage: Rendering PersonForm with mode:', mode);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      <PersonForm mode={mode} />
    </div>
  );
};

export default PersonFormPage;