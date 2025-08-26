import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PersonDetails from '@/components/persons/PersonDetails';

const PersonDetailPage: React.FC = () => {
  // const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 border-b border-emerald-100 px-6 py-4 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/persons')}
              className="text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Button>
            <h1 className="text-xl font-semibold text-emerald-900">Chi tiết người dùng</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <PersonDetails />
      </div>
    </div>
  );
};

export default PersonDetailPage;