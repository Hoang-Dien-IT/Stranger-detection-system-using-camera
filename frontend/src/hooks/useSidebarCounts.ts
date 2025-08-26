import { useState, useEffect } from 'react';
import { cameraService } from '@/services/camera.service';
import { detectionService } from '@/services/detection.service';
import { alertService } from '@/services/alert.service';
import { personService } from '@/services/person.service';

export interface SidebarCounts {
  totalCameras: number;
  activeCameras: number;
  totalPersons: number;
  todayDetections: number;
  unreadAlerts: number;
  isLoading: boolean;
}

export const useSidebarCounts = () => {
  const [counts, setCounts] = useState<SidebarCounts>({
    totalCameras: 0,
    activeCameras: 0,
    totalPersons: 0,
    todayDetections: 0,
    unreadAlerts: 0,
    isLoading: true,
  });

  const loadCounts = async () => {
    try {
      setCounts(prev => ({ ...prev, isLoading: true }));

      const [
        camerasResponse,
        personsResponse,
        detectionsResponse,
        alertsResponse
      ] = await Promise.allSettled([
        cameraService.getCameras(),
        personService.getPersons(),
        detectionService.getDetections(),
        alertService.getUnreadCount()
      ]);

      const cameras = camerasResponse.status === 'fulfilled' ? camerasResponse.value : [];
      const persons = personsResponse.status === 'fulfilled' ? personsResponse.value : [];
      const detections = detectionsResponse.status === 'fulfilled' ? detectionsResponse.value : [];
      const unreadAlerts = alertsResponse.status === 'fulfilled' ? alertsResponse.value : 0;

      // Calculate today's detections
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      let todayDetections = 0;
      if (Array.isArray(detections)) {
        todayDetections = detections.filter(d => {
          const detectionDate = new Date(d.timestamp || new Date());
          return detectionDate >= todayStart;
        }).length;
      }

      setCounts({
        totalCameras: Array.isArray(cameras) ? cameras.length : 0,
        activeCameras: Array.isArray(cameras) ? cameras.filter(c => c.is_active).length : 0,
        totalPersons: Array.isArray(persons) ? persons.filter(p => p.is_active).length : 0,
        todayDetections,
        unreadAlerts,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading sidebar counts:', error);
      setCounts(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    counts,
    refreshCounts: loadCounts,
  };
};