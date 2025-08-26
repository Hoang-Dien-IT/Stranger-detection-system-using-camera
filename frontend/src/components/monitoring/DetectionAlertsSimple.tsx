import React from 'react';

interface DetectionAlertsProps {
  className?: string;
  maxAlerts?: number;
  showOnlyUnread?: boolean;
}

const DetectionAlerts: React.FC<DetectionAlertsProps> = ({
  className = '',
  maxAlerts = 10,
  showOnlyUnread = false
}) => {
  return (
    <div className={`bg-cyan-50 border border-cyan-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-cyan-800">Cảnh báo nhận diện</h3>
      <div className="text-center py-8">
        <p className="text-cyan-500">Không có cảnh báo nhận diện</p>
        <p className="text-sm text-cyan-400">Hệ thống đang an toàn</p>
      </div>
    </div>
  );
};

export default DetectionAlerts;