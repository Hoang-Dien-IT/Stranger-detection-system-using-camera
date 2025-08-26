from typing import List, Optional, Dict, Any
from bson import ObjectId
from ..database import get_database
from ..models.detection_log import (
    DetectionLog, 
    DetectionLogCreate, 
    DetectionLogResponse, 
    DetectionStats,
    DetectionFilter
)
from datetime import datetime, timedelta
from ..utils.timezone_utils import vietnam_now
import asyncio
import base64
import os
import uuid

class DetectionService:
    @property
    def db(self):
        return get_database()
    
    @property
    def collection(self):
        return self.db.detection_logs

    async def create_detection(self, user_id: str, detection_data: DetectionLogCreate) -> str:
        """Tạo detection log mới - method được gọi từ router"""
        try:
            # Validate camera exists and belongs to user
            camera = await self.db.cameras.find_one({
                "_id": ObjectId(detection_data.camera_id),
                "user_id": ObjectId(user_id)
            })
            
            if not camera:
                raise ValueError("Camera not found or access denied")
            
            # Save image to file system
            image_filename = await self._save_detection_image(detection_data.image_base64)
            
            # Prepare detection document
            detection_dict = {
                "user_id": ObjectId(user_id),
                "camera_id": ObjectId(detection_data.camera_id),
                "detection_type": detection_data.detection_type,
                "person_id": ObjectId(detection_data.person_id) if detection_data.person_id else None,
                "person_name": detection_data.person_name,
                "confidence": detection_data.confidence,
                "similarity_score": detection_data.similarity_score,
                "image_path": image_filename,
                "image_base64": detection_data.image_base64,  # Keep for quick access
                "bbox": detection_data.bbox,
                "timestamp": vietnam_now(),
                "is_alert_sent": detection_data.detection_type == "stranger",  # ✅ FIXED: True for strangers, False for known persons
                "alert_sent": detection_data.detection_type == "stranger",  # ✅ FIXED: Compatibility field
                "alert_methods": ["websocket"] if detection_data.detection_type == "stranger" else [],
                "metadata": {
                    "created_by": "detection_service",
                    "detection_source": "manual_detection"
                }
            }
            
            # Insert to database
            result = await self.collection.insert_one(detection_dict)
            
            # Send notification if stranger detected
            if detection_data.detection_type == "stranger":
                await self._send_stranger_alert(user_id, {
                    "detection_id": str(result.inserted_id),
                    "camera_name": camera["name"],
                    "camera_id": str(camera["_id"]),
                    "confidence": detection_data.confidence,
                    "timestamp": detection_dict["timestamp"]
                })
            
            return str(result.inserted_id)
            
        except Exception as e:
            raise ValueError(f"Failed to create detection: {str(e)}")

    async def _save_detection_image(self, image_base64: str) -> str:
        """Lưu ảnh detection vào file system"""
        try:
            # Ensure upload directory exists
            upload_dir = "uploads/detections"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            image_filename = f"{uuid.uuid4()}.jpg"
            image_path = os.path.join(upload_dir, image_filename)
            
            # Decode base64 and save
            if image_base64.startswith('data:image/'):
                image_data = base64.b64decode(image_base64.split(',')[1])
            else:
                image_data = base64.b64decode(image_base64)
            
            with open(image_path, 'wb') as f:
                f.write(image_data)
            
            return image_path
            
        except Exception as e:
            print(f"Error saving detection image: {e}")
            return ""

    async def _send_stranger_alert(self, user_id: str, detection_data: Dict[str, Any]):
        """Gửi cảnh báo stranger (sẽ integrate với notification service sau)"""
        try:
            # Import here to avoid circular import
            from .notification_service import notification_service
            
            await notification_service.send_stranger_alert(user_id, detection_data)
            
            # Update detection log to mark alert sent
            await self.collection.update_one(
                {"_id": ObjectId(detection_data["detection_id"])},
                {
                    "$set": {
                        "is_alert_sent": True,
                        "alert_methods": ["websocket", "email"]
                    }
                }
            )
            
        except Exception as e:
            print(f"Error sending stranger alert: {e}")

    async def get_user_detections(self, user_id: str, filters: DetectionFilter) -> List[Dict[str, Any]]:
        """Lấy danh sách detections của user với các bộ lọc"""
        try:
            print(f"🔵 DetectionService: Getting detections for user {user_id} with filters: {filters}")
            
            # Build base query
            query = {"user_id": ObjectId(user_id)}
            
            # Apply filters
            if filters.camera_id:
                try:
                    query["camera_id"] = ObjectId(filters.camera_id)
                except:
                    # Handle case where ID is invalid
                    print(f"⚠️ Invalid camera_id format: {filters.camera_id}")
                    pass
                    
            if filters.detection_type:
                query["detection_type"] = filters.detection_type
                
            if filters.start_date:
                if not "timestamp" in query:
                    query["timestamp"] = {}
                query["timestamp"]["$gte"] = filters.start_date
                
            if filters.end_date:
                if not "timestamp" in query:
                    query["timestamp"] = {}
                query["timestamp"]["$lte"] = filters.end_date
                
            print(f"🔵 Final MongoDB query: {query}")
                
            # Execute query with pagination
            cursor = self.collection.find(query).sort("timestamp", -1).skip(filters.offset).limit(filters.limit)
            
            # Get camera name lookup dict for efficiency
            camera_dict = {}
            cameras_cursor = self.db.cameras.find({"user_id": ObjectId(user_id)})
            async for camera in cameras_cursor:
                camera_dict[str(camera["_id"])] = camera.get("name", "Unknown Camera")
                
            # Process results
            results = []
            async for detection in cursor:
                try:
                    # Validate required fields
                    if not detection.get("_id"):
                        print(f"⚠️ Skipping detection without _id")
                        continue
                        
                    if not detection.get("camera_id"):
                        print(f"⚠️ Detection {detection.get('_id')} missing camera_id")
                        continue
                    
                    # Get camera name
                    camera_id = str(detection.get("camera_id", ""))
                    camera_name = camera_dict.get(camera_id, "Unknown Camera")
                    
                    # Sanitize detection_type để đảm bảo tuân thủ enum
                    raw_detection_type = detection.get("detection_type", "unknown")
                    if raw_detection_type == "stranger_only_alert":
                        # Convert old data format to new format
                        sanitized_detection_type = "stranger"
                    elif raw_detection_type in ["known_person", "stranger", "unknown"]:
                        sanitized_detection_type = raw_detection_type
                    else:
                        # Default fallback for invalid data
                        sanitized_detection_type = "unknown"
                    
                    # Build image URL safely
                    image_path = detection.get("image_path", "")
                    image_url = ""
                    if image_path:
                        filename = os.path.basename(image_path)
                        if filename:
                            image_url = f"/uploads/detections/{filename}"
                    
                    # Format response
                    detection_response = {
                        "id": str(detection["_id"]),
                        "camera_id": camera_id,
                        "camera_name": camera_name,
                        "detection_type": sanitized_detection_type,  # Sử dụng detection_type đã sanitize
                        "person_id": str(detection.get("person_id")) if detection.get("person_id") else None,
                        "person_name": detection.get("person_name", "Unknown"),
                        "confidence": detection.get("confidence", 0.0),
                        "similarity_score": detection.get("similarity_score"),
                        "image_path": image_path,
                        "image_url": image_url,
                        "bbox": detection.get("bbox", [0, 0, 0, 0]),
                        "timestamp": detection.get("timestamp", vietnam_now()),
                        "is_alert_sent": detection.get("is_alert_sent", False),
                    }
                    results.append(detection_response)
                    
                    # Debug logging for first few items
                    if len(results) <= 3:
                        print(f"🔍 Detection {len(results)}: ID={detection_response['id']}, "
                              f"image_path='{detection_response['image_path']}', "
                              f"image_url='{detection_response['image_url']}', "
                              f"confidence={detection_response['confidence']}")
                              
                except Exception as e:
                    print(f"⚠️ Error processing detection {detection.get('_id', 'unknown')}: {e}")
                    continue
            
            print(f"✅ DetectionService: Found {len(results)} detections")
            return results
            
        except Exception as e:
            import traceback
            print(f"❌ Error getting user detections: {e}")
            traceback.print_exc()
            return []

    async def get_detection_stats(self, user_id: str) -> DetectionStats:
        """Lấy thống kê detection"""
        try:
            query = {"user_id": ObjectId(user_id)}
            
            # Basic counts
            total_detections = await self.collection.count_documents(query)
            stranger_detections = await self.collection.count_documents({
                **query, "detection_type": "stranger"
            })
            known_person_detections = await self.collection.count_documents({
                **query, "detection_type": "known_person"
            })
            
            # Time-based counts
            now = vietnam_now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=7)
            month_start = now - timedelta(days=30)
            
            today_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": today_start}
            })
            
            this_week_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": week_start}
            })
            
            this_month_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": month_start}
            })
            
            # Active cameras count
            cameras_active = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id),
                "is_active": True
            })
            
            return DetectionStats(
                total_detections=total_detections,
                stranger_detections=stranger_detections,
                known_person_detections=known_person_detections,
                today_detections=today_detections,
                this_week_detections=this_week_detections,
                this_month_detections=this_month_detections,
                cameras_active=cameras_active
            )
            
        except Exception as e:
            print(f"Error getting detection stats: {e}")
            return DetectionStats(
                total_detections=0,
                stranger_detections=0,
                known_person_detections=0,
                today_detections=0,
                this_week_detections=0,
                this_month_detections=0,
                cameras_active=0
            )

    async def get_detection_by_id(self, detection_id: str, user_id: str, request=None) -> Optional[DetectionLogResponse]:
        """Lấy detection log theo ID, trả về image_url đầy đủ domain"""
        try:
            print(f"🔍 Searching for detection ID: {detection_id} for user: {user_id}")
            
            # Validate ObjectId format
            if not ObjectId.is_valid(detection_id):
                print(f"❌ Invalid ObjectId format: {detection_id}")
                return None
                
            log_data = await self.collection.find_one({
                "_id": ObjectId(detection_id),
                "user_id": ObjectId(user_id)
            })
            
            if not log_data:
                print(f"❌ Detection not found in database: {detection_id}")
                return None
                
            print(f"✅ Found detection: {detection_id}")
            
            # Get camera info safely
            camera = None
            try:
                if log_data.get("camera_id"):
                    camera = await self.db.cameras.find_one({"_id": log_data["camera_id"]})
            except Exception as e:
                print(f"⚠️ Error getting camera info: {e}")
            
            camera_name = camera["name"] if camera else "Unknown Camera"
            
            # Lấy domain từ request nếu có
            base_url = ""
            if request is not None:
                base_url = str(request.base_url).rstrip("/")
                
            # Build image URL safely
            image_url = ""
            if log_data.get("image_path"):
                rel_path = f"/uploads/detections/{os.path.basename(log_data.get('image_path', ''))}"
                image_url = f"{base_url}{rel_path}" if base_url else rel_path
                
            # Validate detection_type
            detection_type = log_data.get("detection_type", "unknown")
            if detection_type not in ["known_person", "stranger", "unknown"]:
                detection_type = "unknown"
            
            return DetectionLogResponse(
                id=str(log_data["_id"]),
                camera_name=camera_name,
                detection_type=detection_type,
                person_name=log_data.get("person_name"),
                confidence=log_data.get("confidence", 0.0),
                similarity_score=log_data.get("similarity_score"),
                image_url=image_url,
                bbox=log_data.get("bbox", []),
                timestamp=log_data.get("timestamp", vietnam_now()),
                is_alert_sent=log_data.get("is_alert_sent", False)
            )
        except Exception as e:
            print(f"❌ Error getting detection by ID: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def delete_detection(self, detection_id: str, user_id: str) -> bool:
        """Xóa detection log"""
        try:
            # Get detection to delete image file
            detection = await self.collection.find_one({
                "_id": ObjectId(detection_id),
                "user_id": ObjectId(user_id)
            })
            
            if not detection:
                return False
            
            # Delete image file if exists
            if detection.get("image_path") and os.path.exists(detection["image_path"]):
                try:
                    os.remove(detection["image_path"])
                except:
                    pass
            
            # Delete from database
            result = await self.collection.delete_one({
                "_id": ObjectId(detection_id),
                "user_id": ObjectId(user_id)
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting detection: {e}")
            return False

    async def cleanup_old_detections(self, user_id: str, days_to_keep: int = 30) -> int:
        """Dọn dẹp detection logs cũ"""
        try:
            cutoff_date = vietnam_now() - timedelta(days=days_to_keep)
            
            # Get old detections to delete image files
            old_detections = []
            async for detection in self.collection.find({
                "user_id": ObjectId(user_id),
                "timestamp": {"$lt": cutoff_date}
            }):
                old_detections.append(detection)
            
            # Delete image files
            for detection in old_detections:
                if detection.get("image_path") and os.path.exists(detection["image_path"]):
                    try:
                        os.remove(detection["image_path"])
                    except:
                        pass
            
            # Delete from database
            result = await self.collection.delete_many({
                "user_id": ObjectId(user_id),
                "timestamp": {"$lt": cutoff_date}
            })
            
            return result.deleted_count
            
        except Exception as e:
            print(f"Error cleaning up old detections: {e}")
            return 0
        
    async def get_stats_overview(self, user_id: str) -> Dict[str, Any]:
        """Lấy thống kê tổng quan chi tiết"""
        try:
            query = {"user_id": ObjectId(user_id)}
            
            # Basic counts
            total_detections = await self.collection.count_documents(query)
            stranger_detections = await self.collection.count_documents({
                **query, "detection_type": "stranger"
            })
            known_person_detections = await self.collection.count_documents({
                **query, "detection_type": "known_person"
            })
            
            # Time-based statistics
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=7)
            month_start = now - timedelta(days=30)
            
            today_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": today_start}
            })
            
            this_week_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": week_start}
            })
            
            this_month_detections = await self.collection.count_documents({
                **query, "timestamp": {"$gte": month_start}
            })
            
            # Camera statistics
            total_cameras = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id)
            })
            
            active_cameras = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id),
                "is_active": True
            })
            
            streaming_cameras = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id),
                "is_streaming": True
            })
            
            # Person statistics
            total_persons = await self.db.known_persons.count_documents({
                "user_id": ObjectId(user_id),
                "is_active": True
            })
            
            # Recent activity (last 24 hours)
            yesterday = now - timedelta(hours=24)
            recent_stranger_alerts = await self.collection.count_documents({
                **query, 
                "detection_type": "stranger",
                "timestamp": {"$gte": yesterday}
            })
            
            # Detection accuracy (simple calculation)
            detection_accuracy = 0.0
            if total_detections > 0:
                detection_accuracy = (known_person_detections / total_detections) * 100
            
            # Alert statistics
            alerts_sent = await self.collection.count_documents({
                **query, 
                "is_alert_sent": True
            })
            
            # Top cameras by detections
            top_cameras = []
            camera_stats = await self.collection.aggregate([
                {"$match": query},
                {"$group": {
                    "_id": "$camera_id",
                    "detection_count": {"$sum": 1},
                    "stranger_count": {
                        "$sum": {"$cond": [{"$eq": ["$detection_type", "stranger"]}, 1, 0]}
                    }
                }},
                {"$sort": {"detection_count": -1}},
                {"$limit": 5}
            ]).to_list(length=5)
            
            for stat in camera_stats:
                camera_data = await self.db.cameras.find_one({"_id": stat["_id"]})
                if camera_data:
                    top_cameras.append({
                        "camera_id": str(stat["_id"]),
                        "camera_name": camera_data["name"],
                        "detection_count": stat["detection_count"],
                        "stranger_count": stat["stranger_count"]
                    })
            
            # Hourly detection pattern (last 24 hours)
            hourly_pattern = {}
            for hour in range(24):
                hour_start = today_start + timedelta(hours=hour)
                hour_end = hour_start + timedelta(hours=1)
                
                count = await self.collection.count_documents({
                    **query,
                    "timestamp": {"$gte": hour_start, "$lt": hour_end}
                })
                
                hourly_pattern[f"{hour:02d}:00"] = count
            
            return {
                "overview": {
                    "total_detections": total_detections,
                    "stranger_detections": stranger_detections,
                    "known_person_detections": known_person_detections,
                    "detection_accuracy": round(detection_accuracy, 2),
                    "alerts_sent": alerts_sent
                },
                "time_based": {
                    "today": today_detections,
                    "this_week": this_week_detections,
                    "this_month": this_month_detections,
                    "last_24h_strangers": recent_stranger_alerts
                },
                "camera_stats": {
                    "total_cameras": total_cameras,
                    "active_cameras": active_cameras,
                    "streaming_cameras": streaming_cameras,
                    "offline_cameras": total_cameras - active_cameras
                },
                "person_stats": {
                    "total_known_persons": total_persons
                },
                "top_cameras": top_cameras,
                "hourly_pattern": hourly_pattern,
                "last_updated": now.isoformat()
            }
            
        except Exception as e:
            print(f"Error getting stats overview: {e}")
            return {
                "overview": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0,
                    "detection_accuracy": 0.0,
                    "alerts_sent": 0
                },
                "time_based": {
                    "today": 0,
                    "this_week": 0,
                    "this_month": 0,
                    "last_24h_strangers": 0
                },
                "camera_stats": {
                    "total_cameras": 0,
                    "active_cameras": 0,
                    "streaming_cameras": 0,
                    "offline_cameras": 0
                },
                "person_stats": {
                    "total_known_persons": 0
                },
                "top_cameras": [],
                "hourly_pattern": {},
                "last_updated": datetime.utcnow().isoformat()
            }

    async def get_stats_by_camera(self, user_id: str, camera_id: str, time_range: str = "7d") -> Dict[str, Any]:
        """Lấy thống kê theo camera cụ thể"""
        try:
            # Parse time range
            days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(time_range, 7)
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = {
                "user_id": ObjectId(user_id),
                "camera_id": ObjectId(camera_id),
                "timestamp": {"$gte": start_date}
            }
            
            # Get camera info
            camera_data = await self.db.cameras.find_one({
                "_id": ObjectId(camera_id),
                "user_id": ObjectId(user_id)
            })
            
            if not camera_data:
                raise ValueError("Camera not found")
            
            # Basic stats
            total_detections = await self.collection.count_documents(query)
            stranger_detections = await self.collection.count_documents({
                **query, "detection_type": "stranger"
            })
            known_person_detections = await self.collection.count_documents({
                **query, "detection_type": "known_person"
            })
            
            return {
                "camera_info": {
                    "id": str(camera_data["_id"]),
                    "name": camera_data["name"],
                    "location": camera_data.get("location"),
                    "is_active": camera_data["is_active"],
                    "is_streaming": camera_data.get("is_streaming", False)
                },
                "time_range": time_range,
                "period": f"Last {days} days",
                "summary": {
                    "total_detections": total_detections,
                    "stranger_detections": stranger_detections,
                    "known_person_detections": known_person_detections,
                    "avg_detections_per_day": round(total_detections / days, 2)
                }
            }
            
        except Exception as e:
            print(f"Error getting camera stats: {e}")
            return {
                "error": str(e),
                "camera_info": None,
                "summary": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0,
                    "avg_detections_per_day": 0
                }
            }
        
    async def get_chart_data(self, user_id: str, time_range: str = "7d", chart_type: str = "area") -> Dict[str, Any]:
        """Lấy dữ liệu cho charts"""
        try:
            days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(time_range, 7)
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": start_date}
            }
            
            # Generate chart data based on time range
            if time_range == "24h":
                # Hourly data
                labels = []
                stranger_data = []
                known_data = []
                
                for hour in range(24):
                    hour_start = start_date + timedelta(hours=hour)
                    hour_end = hour_start + timedelta(hours=1)
                    
                    hour_query = {**query, "timestamp": {"$gte": hour_start, "$lt": hour_end}}
                    
                    strangers = await self.collection.count_documents({
                        **hour_query, "detection_type": "stranger"
                    })
                    known = await self.collection.count_documents({
                        **hour_query, "detection_type": "known_person"
                    })
                    
                    labels.append(f"{hour:02d}:00")
                    stranger_data.append(strangers)
                    known_data.append(known)
            else:
                # Daily data
                labels = []
                stranger_data = []
                known_data = []
                
                for i in range(days):
                    day_start = start_date + timedelta(days=i)
                    day_end = day_start + timedelta(days=1)
                    
                    day_query = {**query, "timestamp": {"$gte": day_start, "$lt": day_end}}
                    
                    strangers = await self.collection.count_documents({
                        **day_query, "detection_type": "stranger"
                    })
                    known = await self.collection.count_documents({
                        **day_query, "detection_type": "known_person"
                    })
                    
                    labels.append(day_start.strftime("%m/%d"))
                    stranger_data.append(strangers)
                    known_data.append(known)
            
            return {
                "chart_type": chart_type,
                "time_range": time_range,
                "labels": labels,
                "datasets": [
                    {
                        "label": "Stranger Detections",
                        "data": stranger_data,
                        "backgroundColor": "rgba(255, 99, 132, 0.2)",
                        "borderColor": "rgba(255, 99, 132, 1)",
                        "borderWidth": 2
                    },
                    {
                        "label": "Known Person Detections",
                        "data": known_data,
                        "backgroundColor": "rgba(54, 162, 235, 0.2)",
                        "borderColor": "rgba(54, 162, 235, 1)",
                        "borderWidth": 2
                    }
                ]
            }
            
        except Exception as e:
            print(f"Error getting chart data: {e}")
            return {
                "chart_type": chart_type,
                "time_range": time_range,
                "labels": [],
                "datasets": []
            }

    async def get_hourly_stats(self, user_id: str, date: str = None) -> Dict[str, Any]:
        """Lấy thống kê theo giờ cho một ngày cụ thể"""
        try:
            if date:
                target_date = datetime.strptime(date, "%Y-%m-%d")
            else:
                target_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            hourly_data = []
            for hour in range(24):
                hour_start = day_start + timedelta(hours=hour)
                hour_end = hour_start + timedelta(hours=1)
                
                query = {
                    "user_id": ObjectId(user_id),
                    "timestamp": {"$gte": hour_start, "$lt": hour_end}
                }
                
                total = await self.collection.count_documents(query)
                strangers = await self.collection.count_documents({
                    **query, "detection_type": "stranger"
                })
                known = await self.collection.count_documents({
                    **query, "detection_type": "known_person"
                })
                
                hourly_data.append({
                    "hour": f"{hour:02d}:00",
                    "total_detections": total,
                    "stranger_detections": strangers,
                    "known_person_detections": known
                })
            
            return {
                "date": target_date.strftime("%Y-%m-%d"),
                "hourly_stats": hourly_data,
                "daily_summary": {
                    "total_detections": sum(h["total_detections"] for h in hourly_data),
                    "stranger_detections": sum(h["stranger_detections"] for h in hourly_data),
                    "known_person_detections": sum(h["known_person_detections"] for h in hourly_data)
                }
            }
            
        except Exception as e:
            print(f"Error getting hourly stats: {e}")
            return {
                "date": date or datetime.utcnow().strftime("%Y-%m-%d"),
                "hourly_stats": [],
                "daily_summary": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0
                }
            }

    async def get_realtime_stats(self, user_id: str) -> Dict[str, Any]:
        """Lấy thống kê real-time (last 30 minutes)"""
        try:
            now = datetime.utcnow()
            last_30_min = now - timedelta(minutes=30)
            last_5_min = now - timedelta(minutes=5)
            
            query_30min = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": last_30_min}
            }
            
            query_5min = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": last_5_min}
            }
            
            # Last 30 minutes
            detections_30min = await self.collection.count_documents(query_30min)
            strangers_30min = await self.collection.count_documents({
                **query_30min, "detection_type": "stranger"
            })
            
            # Last 5 minutes
            detections_5min = await self.collection.count_documents(query_5min)
            strangers_5min = await self.collection.count_documents({
                **query_5min, "detection_type": "stranger"
            })
            
            # Active cameras
            active_cameras = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id),
                "is_active": True
            })
            
            streaming_cameras = await self.db.cameras.count_documents({
                "user_id": ObjectId(user_id),
                "is_streaming": True
            })
            
            return {
                "timestamp": now.isoformat(),
                "last_30_minutes": {
                    "total_detections": detections_30min,
                    "stranger_detections": strangers_30min,
                    "known_person_detections": detections_30min - strangers_30min
                },
                "last_5_minutes": {
                    "total_detections": detections_5min,
                    "stranger_detections": strangers_5min,
                    "known_person_detections": detections_5min - strangers_5min
                },
                "system_status": {
                    "active_cameras": active_cameras,
                    "streaming_cameras": streaming_cameras,
                    "detection_active": streaming_cameras > 0
                }
            }
            
        except Exception as e:
            print(f"Error getting realtime stats: {e}")
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "last_30_minutes": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0
                },
                "last_5_minutes": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0
                },
                "system_status": {
                    "active_cameras": 0,
                    "streaming_cameras": 0,
                    "detection_active": False
                }
            }

    async def export_stats(self, user_id: str, time_range: str = "7d", format: str = "csv") -> str:
        """Export thống kê detection"""
        try:
            days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(time_range, 7)
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": start_date}
            }
            
            # Get detection data
            detections = []
            async for detection in self.collection.find(query).sort("timestamp", -1):
                # Get camera name
                camera = await self.db.cameras.find_one({"_id": detection["camera_id"]})
                camera_name = camera["name"] if camera else "Unknown"
                
                detections.append({
                    "timestamp": detection["timestamp"].isoformat(),
                    "camera_name": camera_name,
                    "detection_type": detection["detection_type"],
                    "person_name": detection.get("person_name", "Unknown"),
                    "confidence": detection.get("confidence", 0.0),
                    "similarity_score": detection.get("similarity_score", 0)
                })
            
            if format == "csv":
                import csv
                import io
                
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=[
                    "timestamp", "camera_name", "detection_type", 
                    "person_name", "confidence", "similarity_score"
                ])
                writer.writeheader()
                writer.writerows(detections)
                return output.getvalue()
            
            elif format == "json":
                import json
                return json.dumps(detections, indent=2)
            
            else:
                return "Unsupported format"
                
        except Exception as e:
            print(f"Error exporting stats: {e}")
            return ""

    async def get_detections(self, user_id: str, filters: DetectionFilter) -> Dict[str, Any]:
        """Lấy danh sách các detection logs theo filter"""
        try:
            # Build query
            query = {"user_id": ObjectId(user_id)}
            
            if filters.detection_type:
                query["detection_type"] = filters.detection_type
                
            if filters.camera_id:
                query["camera_id"] = ObjectId(filters.camera_id)
                
            if filters.date_from or filters.date_to:
                query["timestamp"] = {}
                if filters.date_from:
                    query["timestamp"]["$gte"] = filters.date_from
                if filters.date_to:
                    query["timestamp"]["$lte"] = filters.date_to
            
            # Calculate pagination
            skip = (filters.page - 1) * filters.limit
            
            # Execute query
            cursor = self.collection.find(query).sort("timestamp", -1).skip(skip).limit(filters.limit)
            
            # Convert to list
            detections = []
            async for doc in cursor:
                # Get camera name if available
                camera_name = "Unknown"
                if "camera_id" in doc:
                    camera = await self.db.cameras.find_one({"_id": doc["camera_id"]})
                    if camera:
                        camera_name = camera.get("name", "Unknown")
                
                # Format detection
                detection = {
                    "id": str(doc["_id"]),
                    "camera_id": str(doc["camera_id"]),
                    "camera_name": camera_name,
                    "detection_type": doc.get("detection_type", "unknown"),
                    "person_id": str(doc["person_id"]) if doc.get("person_id") else None,
                    "person_name": doc.get("person_name", "Unknown"),
                    "confidence": doc.get("confidence", 0),
                    "timestamp": doc.get("timestamp", datetime.utcnow()),
                    "image_path": doc.get("image_path", "")
                }
                
                detections.append(detection)
            
            # Get counts
            total_count = await self.collection.count_documents(query)
            
            # Count by type
            query_known = {**query, "detection_type": "known_person"}
            known_persons = await self.collection.count_documents(query_known)
            
            query_stranger = {**query, "detection_type": "stranger"}
            strangers = await self.collection.count_documents(query_stranger)
            
            return {
                "detections": detections,
                "total_count": total_count,
                "known_persons": known_persons,
                "strangers": strangers,
                "page": filters.page,
                "limit": filters.limit
            }
            
        except Exception as e:
            print(f"Error getting detections: {e}")
            return {
                "detections": [],
                "total_count": 0,
                "known_persons": 0,
                "strangers": 0,
                "page": filters.page,
                "limit": filters.limit
            }
        
    async def get_trends_data(self, user_id: str, time_range: str = "7d") -> Dict[str, Any]:
        """Lấy dữ liệu trends với thống kê theo ngày"""
        try:
            # Parse time range
            days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(time_range, 7)
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": start_date}
            }
            
            # Daily statistics
            daily_stats = []
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_query = {
                    **query,
                    "timestamp": {"$gte": day_start, "$lt": day_end}
                }
                
                total_detections = await self.collection.count_documents(day_query)
                stranger_detections = await self.collection.count_documents({
                    **day_query, "detection_type": "stranger"
                })
                known_detections = await self.collection.count_documents({
                    **day_query, "detection_type": "known_person"
                })
                
                # Calculate accuracy for the day
                accuracy_rate = 0
                if total_detections > 0:
                    accuracy_rate = (known_detections / total_detections) * 100
                
                daily_stats.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "total_detections": total_detections,
                    "known_detections": known_detections,
                    "stranger_detections": stranger_detections,
                    "accuracy_rate": round(accuracy_rate, 1)
                })
            
            # Monthly comparison (last 6 months)
            monthly_stats = []
            current_date = datetime.utcnow()
            for i in range(6):
                month_start = current_date.replace(day=1) - timedelta(days=i * 30)
                month_end = month_start + timedelta(days=32)
                month_end = month_end.replace(day=1) - timedelta(days=1)
                
                month_query = {
                    **query,
                    "timestamp": {"$gte": month_start, "$lt": month_end}
                }
                
                current_month_detections = await self.collection.count_documents(month_query)
                
                # Previous year same month
                prev_year_start = month_start.replace(year=month_start.year - 1)
                prev_year_end = month_end.replace(year=month_end.year - 1)
                
                prev_year_query = {
                    "user_id": ObjectId(user_id),
                    "timestamp": {"$gte": prev_year_start, "$lt": prev_year_end}
                }
                
                prev_year_detections = await self.collection.count_documents(prev_year_query)
                
                # Calculate growth rate
                growth_rate = 0
                if prev_year_detections > 0:
                    growth_rate = ((current_month_detections - prev_year_detections) / prev_year_detections) * 100
                
                monthly_stats.append({
                    "month": month_start.strftime("%b"),
                    "current_year": current_month_detections,
                    "previous_year": prev_year_detections,
                    "growth_rate": round(growth_rate, 1)
                })
            
            monthly_stats.reverse()  # Show chronological order
            
            # Get basic overview for patterns
            overview_stats = await self.get_stats_overview(user_id)
            
            # Detection patterns
            total_detections = overview_stats["overview"]["total_detections"]
            known_detections = overview_stats["overview"]["known_person_detections"]
            stranger_detections = overview_stats["overview"]["stranger_detections"]
            
            detection_patterns = []
            if total_detections > 0:
                known_percentage = round((known_detections / total_detections) * 100, 1)
                stranger_percentage = round((stranger_detections / total_detections) * 100, 1)
                false_positive_percentage = max(0, 100 - known_percentage - stranger_percentage)
                false_positive_count = max(0, total_detections - known_detections - stranger_detections)
                
                detection_patterns = [
                    {
                        "pattern_type": "Known Persons",
                        "count": known_detections,
                        "percentage": known_percentage,
                        "color": "#10B981"
                    },
                    {
                        "pattern_type": "Strangers",
                        "count": stranger_detections,
                        "percentage": stranger_percentage,
                        "color": "#EF4444"
                    },
                    {
                        "pattern_type": "False Positives",
                        "count": false_positive_count,
                        "percentage": false_positive_percentage,
                        "color": "#F59E0B"
                    }
                ]
            
            # Performance metrics
            hourly_pattern = overview_stats["hourly_pattern"]
            peak_hour = "14"  # default
            if hourly_pattern:
                peak_hour = max(hourly_pattern.keys(), key=lambda x: hourly_pattern[x])
            
            # Calculate trends
            recent_detections = sum(day["total_detections"] for day in daily_stats[-7:])
            previous_detections = sum(day["total_detections"] for day in daily_stats[-14:-7]) if len(daily_stats) >= 14 else recent_detections
            
            detection_growth = 0
            if previous_detections > 0:
                detection_growth = ((recent_detections - previous_detections) / previous_detections) * 100
            
            accuracy_trend = 0
            if len(daily_stats) >= 7:
                recent_accuracy = sum(day["accuracy_rate"] for day in daily_stats[-7:]) / 7
                previous_accuracy = sum(day["accuracy_rate"] for day in daily_stats[-14:-7]) / 7 if len(daily_stats) >= 14 else recent_accuracy
                if previous_accuracy > 0:
                    accuracy_trend = recent_accuracy - previous_accuracy
            
            return {
                "daily_trends": daily_stats,
                "monthly_comparison": monthly_stats,
                "detection_patterns": detection_patterns,
                "hourly_pattern": hourly_pattern,
                "performance_metrics": {
                    "detection_growth": round(detection_growth, 1),
                    "accuracy_trend": round(accuracy_trend, 1),
                    "peak_detection_hour": f"{peak_hour}:00",
                    "avg_response_time": 0.85,  # Static for now
                    "most_active_day": "Wednesday"  # Static for now
                },
                "overview": overview_stats["overview"],
                "time_based": overview_stats["time_based"],
                "camera_stats": overview_stats["camera_stats"]
            }
            
        except Exception as e:
            print(f"Error getting trends data: {e}")
            import traceback
            traceback.print_exc()
            return {
                "daily_trends": [],
                "monthly_comparison": [],
                "detection_patterns": [],
                "hourly_pattern": {},
                "performance_metrics": {
                    "detection_growth": 0,
                    "accuracy_trend": 0,
                    "peak_detection_hour": "14:00",
                    "avg_response_time": 0.85,
                    "most_active_day": "Wednesday"
                },
                "overview": {
                    "total_detections": 0,
                    "stranger_detections": 0,
                    "known_person_detections": 0,
                    "detection_accuracy": 0.0,
                    "alerts_sent": 0
                },
                "time_based": {
                    "today": 0,
                    "this_week": 0,
                    "this_month": 0,
                    "last_24h_strangers": 0
                },
                "camera_stats": {
                    "total_cameras": 0,
                    "active_cameras": 0,
                    "streaming_cameras": 0,
                    "offline_cameras": 0
                }
            }

    async def generate_report_data(self, user_id: str, report_config: Dict[str, Any]) -> Dict[str, Any]:
        """Tạo dữ liệu báo cáo thực tế từ hệ thống"""
        try:
            start_date = datetime.fromisoformat(report_config.get('start_date', (datetime.utcnow() - timedelta(days=7)).isoformat()))
            end_date = datetime.fromisoformat(report_config.get('end_date', datetime.utcnow().isoformat()))
            detection_type = report_config.get('detection_type', 'all')
            
            # Base query
            query = {
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
            
            # Add detection type filter if specified
            if detection_type in ['known_person', 'stranger']:
                query["detection_type"] = detection_type
            
            # Get basic statistics
            total_detections = await self.collection.count_documents(query)
            
            stranger_query = {**query, "detection_type": "stranger"}
            known_query = {**query, "detection_type": "known_person"}
            
            stranger_detections = await self.collection.count_documents(stranger_query)
            known_detections = await self.collection.count_documents(known_query)
            
            # Calculate accuracy
            accuracy_rate = 0
            if total_detections > 0:
                accuracy_rate = (known_detections / total_detections) * 100
            
            # Get daily trend data
            daily_trends = []
            current_date = start_date
            while current_date <= end_date:
                day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                
                day_query = {
                    **query,
                    "timestamp": {"$gte": day_start, "$lt": day_end}
                }
                
                day_total = await self.collection.count_documents(day_query)
                day_strangers = await self.collection.count_documents({
                    **day_query, "detection_type": "stranger"
                })
                day_known = await self.collection.count_documents({
                    **day_query, "detection_type": "known_person"
                })
                
                daily_trends.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "detections": day_total,
                    "known": day_known,
                    "strangers": day_strangers
                })
                
                current_date += timedelta(days=1)
            
            # Get hourly pattern
            hourly_pattern = {}
            for hour in range(24):
                hour_start = start_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                
                hour_query = {
                    **query,
                    "timestamp": {"$gte": hour_start, "$lt": hour_end}
                }
                
                hour_count = await self.collection.count_documents(hour_query)
                hourly_pattern[f"{hour:02d}:00"] = hour_count
            
            # Get camera statistics
            camera_stats = await self.collection.aggregate([
                {"$match": query},
                {"$group": {
                    "_id": "$camera_id",
                    "detection_count": {"$sum": 1},
                    "stranger_count": {
                        "$sum": {"$cond": [{"$eq": ["$detection_type", "stranger"]}, 1, 0]}
                    },
                    "known_count": {
                        "$sum": {"$cond": [{"$eq": ["$detection_type", "known_person"]}, 1, 0]}
                    }
                }},
                {"$sort": {"detection_count": -1}},
                {"$limit": 10}
            ]).to_list(length=10)
            
            # Enrich camera data
            camera_performance = []
            for stat in camera_stats:
                camera_data = await self.db.cameras.find_one({"_id": stat["_id"]})
                if camera_data:
                    camera_performance.append({
                        "camera_id": str(stat["_id"]),
                        "camera_name": camera_data["name"],
                        "detection_count": stat["detection_count"],
                        "stranger_count": stat["stranger_count"],
                        "known_count": stat["known_count"],
                        "accuracy": (stat["known_count"] / stat["detection_count"] * 100) if stat["detection_count"] > 0 else 0
                    })
            
            # Get recent detections for timeline
            recent_detections = await self.collection.find(
                query,
                {"timestamp": 1, "detection_type": 1, "person_name": 1, "camera_id": 1}
            ).sort("timestamp", -1).limit(50).to_list(length=50)
            
            # Enrich recent detections with camera names
            detection_timeline = []
            for detection in recent_detections:
                camera_data = await self.db.cameras.find_one({"_id": detection["camera_id"]})
                detection_timeline.append({
                    "timestamp": detection["timestamp"].isoformat(),
                    "detection_type": detection["detection_type"],
                    "person_name": detection.get("person_name", "Unknown"),
                    "camera_name": camera_data["name"] if camera_data else "Unknown Camera"
                })
            
            return {
                "report_config": report_config,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": (end_date - start_date).days + 1
                },
                "summary": {
                    "total_detections": total_detections,
                    "known_detections": known_detections,
                    "stranger_detections": stranger_detections,
                    "accuracy_rate": round(accuracy_rate, 1),
                    "cameras_active": len(camera_performance),
                    "avg_detections_per_day": round(total_detections / max(1, (end_date - start_date).days + 1), 1)
                },
                "daily_trends": daily_trends,
                "hourly_pattern": hourly_pattern,
                "camera_performance": camera_performance,
                "detection_timeline": detection_timeline,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating report data: {e}")
            import traceback
            traceback.print_exc()
            return {
                "report_config": report_config,
                "period": {
                    "start_date": start_date.isoformat() if 'start_date' in locals() else None,
                    "end_date": end_date.isoformat() if 'end_date' in locals() else None,
                    "days": 0
                },
                "summary": {
                    "total_detections": 0,
                    "known_detections": 0,
                    "stranger_detections": 0,
                    "accuracy_rate": 0,
                    "cameras_active": 0,
                    "avg_detections_per_day": 0
                },
                "daily_trends": [],
                "hourly_pattern": {},
                "camera_performance": [],
                "detection_timeline": [],
                "generated_at": datetime.utcnow().isoformat()
            }

    async def get_available_reports(self, user_id: str) -> List[Dict[str, Any]]:
        """Lấy danh sách báo cáo có sẵn"""
        # This would typically come from a reports collection
        # For now, return mock data that represents actual report types
        return [
            {
                "id": "weekly_summary",
                "name": "Weekly Summary Report",
                "description": "Detection activity summary for the past week",
                "type": "weekly",
                "template": True,
                "config": {
                    "start_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
                    "end_date": datetime.utcnow().isoformat(),
                    "detection_type": "all"
                }
            },
            {
                "id": "monthly_analytics",
                "name": "Monthly Analytics Report",
                "description": "Comprehensive analytics for the past month",
                "type": "monthly",
                "template": True,
                "config": {
                    "start_date": (datetime.utcnow() - timedelta(days=30)).isoformat(),
                    "end_date": datetime.utcnow().isoformat(),
                    "detection_type": "all"
                }
            },
            {
                "id": "security_incidents",
                "name": "Security Incidents Report",
                "description": "Focus on stranger detections and security alerts",
                "type": "security",
                "template": True,
                "config": {
                    "start_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
                    "end_date": datetime.utcnow().isoformat(),
                    "detection_type": "stranger"
                }
            }
        ]

    async def get_report_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Lấy lịch sử báo cáo đã tạo"""
        try:
            # In a real implementation, this would query a reports collection
            # For now, return mock data representing recent reports
            return [
                {
                    "id": "report_001",
                    "name": "Weekly Detection Summary",
                    "description": "Detection activity summary for last week",
                    "type": "weekly",
                    "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "file_size": "2.4 MB",
                    "status": "ready"
                },
                {
                    "id": "report_002",
                    "name": "Monthly Analytics Report",
                    "description": "Comprehensive analytics for last month",
                    "type": "monthly",
                    "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                    "file_size": "8.7 MB",
                    "status": "ready"
                },
                {
                    "id": "report_003",
                    "name": "Security Incidents Report",
                    "description": "Stranger detection incidents",
                    "type": "security",
                    "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                    "file_size": "4.1 MB",
                    "status": "ready"
                }
            ]
        except Exception as e:
            print(f"❌ Error getting report history: {e}")
            return []

# Global instance
detection_service = DetectionService()