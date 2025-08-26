from typing import Dict, Optional, List
from datetime import datetime, timedelta
import asyncio
import uuid
from bson import ObjectId
from ..database import get_database

class DetectionOptimizerService:
    """
    Service tối ưu hóa việc lưu trữ lịch sử phát hiện (Detection History)
    
    Logic tối ưu:
    1. Gom nhóm detections liên tiếp của cùng một người trên một camera thành một session
    2. Lưu định kỳ theo quy tắc khác nhau cho người quen và người lạ
    3. Chỉ lưu chi tiết detection khi cần thiết, lưu tổng quan session luôn
    """
    
    def __init__(self):
        self._db = None
        self._detections_buffer: Dict[str, dict] = {}  # Buffer để gom nhóm detections
        self._buffer_timeout = timedelta(seconds=30)  # Timeout để xử lý buffer
        self._cleanup_task = None
    
    @property
    def db(self):
        if self._db is None:
            self._db = get_database()
        return self._db
    
    @property
    def collection_detections(self):
        return self.db.detection_logs
    
    @property
    def collection_sessions(self):
        return self.db.detection_sessions
    
    def start_background_tasks(self):
        """Khởi động background tasks"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            print("🔄 Detection optimizer background task started")
    
    async def stop_background_tasks(self):
        """Dừng background tasks"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
    
    async def _periodic_cleanup(self):
        """Task chạy định kỳ để xử lý buffer và lưu vào database"""
        while True:
            try:
                await asyncio.sleep(10)  # Kiểm tra mỗi 10 giây
                await self._process_buffer()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in buffer cleanup task: {e}")
    
    async def _process_buffer(self):
        """Xử lý buffer và lưu vào database khi đủ điều kiện"""
        now = datetime.now()
        keys_to_process = []
        
        # Tìm các buffer đã đủ điều kiện lưu
        for key, buffer in self._detections_buffer.items():
            last_updated = buffer.get('last_updated')
            if not last_updated:
                continue
            
            # Kiểm tra nếu buffer đã quá timeout
            if now - last_updated > self._buffer_timeout:
                keys_to_process.append(key)
        
        # Xử lý từng buffer
        for key in keys_to_process:
            buffer = self._detections_buffer.pop(key, None)
            if buffer:
                await self._save_detection_session(buffer)
    
    async def process_detection(self, detection_data: dict) -> Optional[str]:
        """
        Xử lý detection mới và quyết định cách lưu trữ
        
        Args:
            detection_data: Dữ liệu detection (camera_id, person_id, person_name, detection_type, ...)
            
        Returns:
            detection_id: ID của detection nếu được lưu, None nếu chỉ cập nhật buffer
        """
        try:
            # Extract key data
            camera_id = detection_data.get('camera_id')
            person_id = detection_data.get('person_id', 'unknown')
            person_name = detection_data.get('person_name', 'Unknown')
            detection_type = detection_data.get('detection_type', 'stranger')
            confidence = detection_data.get('confidence', 0.0)
            
            if not camera_id:
                return None
            
            # Create buffer key: camera_id + person_id
            buffer_key = f"{camera_id}_{person_id or 'unknown'}"
            now = datetime.now()
            
            # Check if there's an existing buffer for this person on this camera
            if buffer_key in self._detections_buffer:
                buffer = self._detections_buffer[buffer_key]
                
                # Update buffer data
                buffer['last_updated'] = now
                buffer['detection_count'] += 1
                buffer['last_detection_time'] = now
                
                # Update max confidence if higher
                if confidence > buffer.get('max_confidence', 0):
                    buffer['max_confidence'] = confidence
                    buffer['best_detection_data'] = detection_data.copy()
                
                # Calculate time since last save
                time_since_last_save = now - buffer.get('last_saved', datetime.min)
                
                # Decide if we should save based on type and time
                should_save = False
                
                if detection_type == 'known_person':
                    # For known people: save every 1 minute
                    should_save = time_since_last_save >= timedelta(minutes=1)
                else:
                    # For strangers: save every 30 seconds
                    should_save = time_since_last_save >= timedelta(seconds=30)
                
                # Additional save condition: high confidence detection
                high_confidence_threshold = 0.9 if detection_type == 'known_person' else 0.85
                if confidence >= high_confidence_threshold:
                    should_save = True
                
                if should_save:
                    # Save a new detection and update buffer's last_saved time
                    buffer['last_saved'] = now
                    
                    # Store this detection in database
                    detection_id = await self._save_detection_to_database(detection_data)
                    
                    # Update session data if needed
                    await self._update_session(buffer, detection_data)
                    
                    return detection_id
                
                # No need to save yet, just update buffer
                return None
                
            else:
                # New buffer for this person on this camera
                buffer = {
                    'camera_id': camera_id,
                    'person_id': person_id,
                    'person_name': person_name,
                    'detection_type': detection_type,
                    'first_detection_time': now,
                    'last_detection_time': now,
                    'last_updated': now,
                    'last_saved': now,
                    'detection_count': 1,
                    'max_confidence': confidence,
                    'best_detection_data': detection_data.copy(),
                    'session_id': str(uuid.uuid4())
                }
                
                self._detections_buffer[buffer_key] = buffer
                
                # Always save the first detection of a new person
                detection_id = await self._save_detection_to_database(detection_data)
                
                # Create a new session
                await self._create_session(buffer)
                
                return detection_id
        
        except Exception as e:
            print(f"Error processing detection: {e}")
            return None
    
    async def _save_detection_to_database(self, detection_data: dict) -> Optional[str]:
        """Lưu detection vào database"""
        try:
            # Prepare detection document for database
            detection_type = detection_data.get('detection_type', 'stranger')
            detection_doc = {
                "user_id": ObjectId(detection_data.get('user_id')),
                "camera_id": ObjectId(detection_data.get('camera_id')),
                "detection_type": detection_type,
                "person_id": ObjectId(detection_data.get('person_id')) if detection_data.get('person_id') else None,
                "person_name": detection_data.get('person_name', 'Unknown'),
                "confidence": detection_data.get('confidence', 0),
                "similarity_score": detection_data.get('similarity_score', 0),
                "image_path": detection_data.get('image_path', ''),
                "bbox": detection_data.get('bbox', [0, 0, 0, 0]),
                "timestamp": datetime.utcnow(),
                "is_alert_sent": detection_type in ["stranger", "unknown"],  # ✅ FIXED: True for alerts, False for known persons
                "alert_sent": detection_type in ["stranger", "unknown"],  # ✅ FIXED: Compatibility field
                "alert_methods": detection_data.get('alert_methods', []),
                "metadata": {
                    "created_by": "detection_optimizer_service",
                    "detection_source": "optimized_detection"
                },
                "notes": detection_data.get('notes', '')
            }
            
            # Insert into detection_logs collection
            result = await self.collection_detections.insert_one(detection_doc)
            detection_id = str(result.inserted_id)
            
            print(f"✅ Detection saved to database: {detection_data.get('person_name')} - ID: {detection_id}")
            return detection_id
            
        except Exception as e:
            print(f"Error saving detection to database: {e}")
            return None
    
    async def _create_session(self, buffer: dict) -> Optional[str]:
        """Tạo detection session mới"""
        try:
            # Extract data
            camera_id = buffer.get('camera_id')
            user_id = await self._get_user_id_from_camera(camera_id)
            
            if not user_id:
                return None
            
            # Prepare session document
            session_doc = {
                "user_id": ObjectId(user_id),
                "camera_id": ObjectId(camera_id),
                "session_id": buffer.get('session_id'),
                "detection_type": buffer.get('detection_type', 'stranger'),
                "person_id": ObjectId(buffer.get('person_id')) if buffer.get('person_id') else None,
                "person_name": buffer.get('person_name', 'Unknown'),
                
                # Session statistics
                "detection_count": buffer.get('detection_count', 1),
                "max_confidence": buffer.get('max_confidence', 0),
                
                # Time information
                "session_start": buffer.get('first_detection_time', datetime.utcnow()),
                "session_end": buffer.get('last_detection_time', datetime.utcnow()),
                "last_updated": datetime.utcnow(),
                
                # Status
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            # Insert into sessions collection
            result = await self.collection_sessions.insert_one(session_doc)
            session_id = str(result.inserted_id)
            
            print(f"✅ Session created: {buffer.get('person_name')} - ID: {session_id}")
            return session_id
            
        except Exception as e:
            print(f"Error creating session: {e}")
            return None
    
    async def _update_session(self, buffer: dict, latest_detection: dict) -> bool:
        """Cập nhật detection session hiện có"""
        try:
            session_id = buffer.get('session_id')
            if not session_id:
                return False
            
            # Update data
            update_data = {
                "detection_count": buffer.get('detection_count', 1),
                "max_confidence": buffer.get('max_confidence', 0),
                "session_end": buffer.get('last_detection_time', datetime.utcnow()),
                "last_updated": datetime.utcnow()
            }
            
            # Update session in database
            result = await self.collection_sessions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error updating session: {e}")
            return False
    
    async def _get_user_id_from_camera(self, camera_id: str) -> Optional[str]:
        """Lấy user_id từ camera_id"""
        try:
            camera = await self.db.cameras.find_one({"_id": ObjectId(camera_id)})
            if camera and "user_id" in camera:
                return str(camera["user_id"])
            return None
        except Exception as e:
            print(f"Error getting user_id from camera: {e}")
            return None
    
    async def get_sessions(self, user_id: str, filters: dict = None, limit: int = 50, skip: int = 0) -> List[dict]:
        """Lấy danh sách detection sessions với filters"""
        try:
            query = {"user_id": ObjectId(user_id)}
            
            if filters:
                if filters.get("detection_type"):
                    query["detection_type"] = filters["detection_type"]
                if filters.get("camera_id"):
                    query["camera_id"] = ObjectId(filters["camera_id"])
                if filters.get("date_from"):
                    query["session_start"] = {"$gte": filters["date_from"]}
                if filters.get("date_to"):
                    query.setdefault("session_start", {})["$lte"] = filters["date_to"]
            
            sessions = []
            cursor = self.collection_sessions.find(query).sort("session_start", -1).skip(skip).limit(limit)
            
            async for session in cursor:
                # Populate camera info
                camera = await self.db.cameras.find_one({"_id": session["camera_id"]})
                camera_name = camera.get("name", "Unknown") if camera else "Unknown"
                
                # Calculate duration in minutes
                start = session.get("session_start")
                end = session.get("session_end")
                duration_minutes = 0
                if start and end:
                    duration_seconds = (end - start).total_seconds()
                    duration_minutes = duration_seconds / 60
                
                sessions.append({
                    "id": str(session["_id"]),
                    "session_id": session.get("session_id"),
                    "camera_id": str(session["camera_id"]),
                    "camera_name": camera_name,
                    "detection_type": session.get("detection_type", "unknown"),
                    "person_name": session.get("person_name", "Unknown"),
                    "detection_count": session.get("detection_count", 0),
                    "max_confidence": session.get("max_confidence", 0),
                    "duration_minutes": duration_minutes,
                    "session_start": session.get("session_start"),
                    "session_end": session.get("session_end"),
                    "is_active": session.get("is_active", False)
                })
            
            return sessions
            
        except Exception as e:
            print(f"Error getting detection sessions: {e}")
            return []
    
    async def get_session_stats(self, user_id: str) -> dict:
        """Lấy thống kê sessions"""
        try:
            # Count total sessions
            total_sessions = await self.collection_sessions.count_documents({
                "user_id": ObjectId(user_id)
            })
            
            # Count sessions by type
            known_person_sessions = await self.collection_sessions.count_documents({
                "user_id": ObjectId(user_id),
                "detection_type": "known_person"
            })
            
            stranger_sessions = await self.collection_sessions.count_documents({
                "user_id": ObjectId(user_id),
                "detection_type": "stranger"
            })
            
            # Count detections
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id)}},
                {"$group": {
                    "_id": None,
                    "total_detections": {"$sum": "$detection_count"}
                }}
            ]
            
            result = await self.collection_sessions.aggregate(pipeline).to_list(1)
            total_detections = result[0]["total_detections"] if result else 0
            
            return {
                "total_sessions": total_sessions,
                "known_person_sessions": known_person_sessions,
                "stranger_sessions": stranger_sessions,
                "total_detections": total_detections
            }
            
        except Exception as e:
            print(f"Error getting session stats: {e}")
            return {
                "total_sessions": 0,
                "known_person_sessions": 0,
                "stranger_sessions": 0,
                "total_detections": 0
            }
    
    async def cleanup_old_data(self, user_id: str, days_to_keep: int = 30) -> dict:
        """Dọn dẹp dữ liệu cũ"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            # Delete old sessions
            session_result = await self.collection_sessions.delete_many({
                "user_id": ObjectId(user_id),
                "created_at": {"$lt": cutoff_date},
                "is_active": False
            })
            
            # Delete old detections
            detection_result = await self.collection_detections.delete_many({
                "user_id": ObjectId(user_id),
                "timestamp": {"$lt": cutoff_date}
            })
            
            return {
                "sessions_deleted": session_result.deleted_count,
                "detections_deleted": detection_result.deleted_count
            }
            
        except Exception as e:
            print(f"Error cleaning up old data: {e}")
            return {"sessions_deleted": 0, "detections_deleted": 0}
