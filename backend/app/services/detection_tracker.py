from typing import Dict, Optional
from datetime import datetime, timedelta
import asyncio
import uuid
from ..utils.timezone_utils import vietnam_now

class PersonPresence:
    """Lưu trạng thái hiện diện của một người trên camera"""
    def __init__(self, person_id: str, person_name: str, detection_type: str, camera_id: str):
        self.person_id = person_id
        self.person_name = person_name
        self.detection_type = detection_type  # 'known_person' or 'stranger'
        self.camera_id = camera_id
        self.first_detected = vietnam_now()
        self.last_detected = vietnam_now()
        self.last_saved = vietnam_now()
        self.is_present = True
        self.detection_count = 0
        
    def update_detection(self):
        """Cập nhật thời gian phát hiện gần nhất"""
        self.last_detected = vietnam_now()
        self.detection_count += 1
        if not self.is_present:
            # Người này vừa quay trở lại
            self.is_present = True
            return True  # Cần lưu detection mới
        return False
        
    def mark_absent(self):
        """Đánh dấu người này không còn trong khung hình"""
        self.is_present = False
        
    def should_save_detection(self) -> bool:
        """Kiểm tra có nên lưu detection không dựa trên logic business"""
        now = vietnam_now()
        
        if not self.is_present:
            return False
            
        # Thời gian từ lần lưu cuối
        time_since_last_save = now - self.last_saved
        
        if self.detection_type == 'known_person':
            # Người quen: lưu mỗi 1 phút nếu xuất hiện quá lâu
            return time_since_last_save >= timedelta(minutes=1)
        else:
            # Người lạ: lưu mỗi 30 giây nếu xuất hiện quá lâu  
            return time_since_last_save >= timedelta(seconds=30)
            
    def mark_saved(self):
        """Đánh dấu đã lưu detection"""
        self.last_saved = vietnam_now()


class DetectionTracker:
    """Quản lý tracking detection để tối ưu việc lưu database"""
    
    def __init__(self):
        # Dictionary lưu trạng thái của từng người trên từng camera
        # Key: f"{camera_id}_{person_id}", Value: PersonPresence
        self.presences: Dict[str, PersonPresence] = {}
        
        # Thời gian timeout để coi như người đã rời khỏi camera (10 giây)
        self.absence_timeout = timedelta(seconds=10)
        
        # Task cleanup chạy định kỳ
        self._cleanup_task = None
        
    def start_cleanup_task(self):
        """Bắt đầu task cleanup định kỳ"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            
    async def stop_cleanup_task(self):
        """Dừng task cleanup"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
            
    async def _periodic_cleanup(self):
        """Task cleanup chạy định kỳ để đánh dấu người vắng mặt"""
        while True:
            try:
                await asyncio.sleep(5)  # Chạy mỗi 5 giây
                await self._cleanup_absent_persons()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in cleanup task: {e}")
                
    async def _cleanup_absent_persons(self):
        """Đánh dấu những người đã vắng mặt quá lâu"""
        now = vietnam_now()
        to_remove = []
        
        for key, presence in self.presences.items():
            if presence.is_present:
                # Kiểm tra nếu không phát hiện trong thời gian timeout
                if now - presence.last_detected > self.absence_timeout:
                    presence.mark_absent()
                    print(f"🔄 Marked absent: {presence.person_name} on camera {presence.camera_id}")
            else:
                # Xóa những presence đã vắng mặt quá lâu (1 phút)
                if now - presence.last_detected > timedelta(minutes=1):
                    to_remove.append(key)
                    
        for key in to_remove:
            del self.presences[key]
            print(f"🗑️ Cleaned up old presence: {key}")
            
    def track_detection(self, camera_id: str, person_id: str, person_name: str, 
                       detection_type: str, confidence: float) -> bool:
        """
        Track một detection và trả về True nếu cần lưu vào database
        
        Returns:
            bool: True nếu cần lưu detection này, False nếu không cần
        """
        key = f"{camera_id}_{person_id or 'unknown'}"
        now = vietnam_now()
        
        if key not in self.presences:
            # Lần đầu phát hiện người này trên camera này
            self.presences[key] = PersonPresence(
                person_id=person_id or str(uuid.uuid4()),
                person_name=person_name,
                detection_type=detection_type,
                camera_id=camera_id
            )
            print(f"🆕 New detection: {person_name} on camera {camera_id}")
            return True  # Lưu lần đầu
            
        presence = self.presences[key]
        
        # Cập nhật detection
        just_returned = presence.update_detection()
        
        if just_returned:
            # Người này vừa quay trở lại sau khi vắng mặt
            print(f"🔄 Person returned: {person_name} on camera {camera_id}")
            presence.mark_saved()
            return True
            
        # Kiểm tra có nên lưu theo logic thời gian
        should_save = presence.should_save_detection()
        
        if should_save:
            print(f"⏰ Periodic save: {person_name} on camera {camera_id} (type: {detection_type})")
            presence.mark_saved()
            return True
            
        return False
        
    def get_presence_info(self, camera_id: str) -> Dict[str, dict]:
        """Lấy thông tin về những người hiện diện trên camera"""
        camera_presences = {}
        for key, presence in self.presences.items():
            if presence.camera_id == camera_id and presence.is_present:
                camera_presences[key] = {
                    'person_name': presence.person_name,
                    'detection_type': presence.detection_type,
                    'first_detected': presence.first_detected,
                    'last_detected': presence.last_detected,
                    'duration': vietnam_now() - presence.first_detected,
                    'detection_count': presence.detection_count
                }
        return camera_presences

# Global instance
detection_tracker = DetectionTracker()
