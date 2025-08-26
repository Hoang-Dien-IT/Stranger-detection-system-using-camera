from typing import List, Dict, Any, Optional
from bson import ObjectId
from ..database import get_database
from datetime import datetime, timedelta
import psutil
import os

class AdminService:
    @property
    def db(self):
        return get_database()

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Lấy thống kê tổng quan cho admin dashboard"""
        db = self.db
        
        # Count total users
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"is_active": True})
        admin_users = await db.users.count_documents({"is_admin": True})
        
        # Count total cameras
        total_cameras = await db.cameras.count_documents({})
        active_cameras = await db.cameras.count_documents({"is_active": True})
        
        # Count total persons
        total_persons = await db.known_persons.count_documents({"is_active": True})
        
        # Count detections today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_detections = await db.detection_logs.count_documents({
            "timestamp": {"$gte": today}
        })
        
        # Count detections this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_detections = await db.detection_logs.count_documents({
            "timestamp": {"$gte": week_ago}
        })
        
        return {
            # ✅ Flat structure for frontend compatibility
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "total_cameras": total_cameras,
            "active_cameras": active_cameras,
            "streaming_cameras": 0,  # Will be calculated later
            "total_persons": total_persons,
            "active_persons": total_persons,  # Same as total for now
            "total_detections": await db.detection_logs.count_documents({}),
            "stranger_detections": await db.detection_logs.count_documents({"person_type": "stranger"}),
            "known_person_detections": await db.detection_logs.count_documents({"person_type": "known"}),
            "today_detections": today_detections,
            "this_week_detections": week_detections,
            "recent_activity": [],  # Will add later
            "system_status": "healthy",
            "last_updated": datetime.utcnow().isoformat(),
            
            # ✅ Keep legacy nested structure for backward compatibility
            "users": {
                "total": total_users,
                "active": active_users,
                "admins": admin_users
            },
            "cameras": {
                "total": total_cameras,
                "active": active_cameras
            },
            "persons": {
                "total": total_persons
            },
            "detections": {
                "today": today_detections,
                "this_week": week_detections
            }
        }
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Lấy danh sách tất cả users với thống kê"""
        db = self.db
        users = []
        
        async for user_data in db.users.find().sort("created_at", -1):
            # Count user's cameras, persons, detections...
            camera_count = await db.cameras.count_documents({"user_id": user_data["_id"]})
            person_count = await db.known_persons.count_documents({
                "user_id": user_data["_id"],
                "is_active": True
            })
            detection_count = await db.detection_logs.count_documents({"user_id": user_data["_id"]})
            
            users.append({
                "id": str(user_data["_id"]),
                "username": user_data["username"],
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "is_active": user_data["is_active"],
                "is_admin": user_data["is_admin"],
                "role": user_data.get("role", "user"),
                "phone": user_data.get("phone"),
                "department": user_data.get("department"),
                # ✅ Add new profile fields
                "location": user_data.get("location"),
                "bio": user_data.get("bio"),
                "website": user_data.get("website"),
                "job_title": user_data.get("job_title"),
                "company": user_data.get("company"),
                "timezone": user_data.get("timezone", "UTC+7"),
                "avatar_url": user_data.get("avatar_url"),
                "created_at": user_data["created_at"],
                "updated_at": user_data.get("updated_at"),
                "last_login": user_data.get("last_login"),
                "stats": {
                    "cameras": camera_count,
                    "persons": person_count,
                    "detections": detection_count
                }
            })
        
        return users
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Lấy thông tin sức khỏe hệ thống"""
        db = self.db
        
        # Database health
        try:
            await db.command("ping")
            db_status = "healthy"
        except Exception as e:
            print(f"Database health check failed: {e}")
            db_status = "unhealthy"
        
        # System resources
        try:
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Fix disk usage for Windows
            try:
                if os.name == 'nt':  # Windows
                    disk = psutil.disk_usage('C:')
                else:
                    disk = psutil.disk_usage('/')
            except:
                # Fallback if disk check fails
                disk = type('obj', (object,), {'total': 0, 'used': 0, 'free': 0})()
            
            return {
                "database": db_status,
                "face_recognition": "healthy",
                "system": {
                    "memory": {
                        "total": memory.total,
                        "available": memory.available,
                        "used": memory.used,
                        "percent": memory.percent
                    },
                    "cpu": {
                        "percent": cpu_percent
                    },
                    "disk": {
                        "total": disk.total,
                        "used": disk.used,
                        "free": disk.free,
                        "percent": (disk.used / disk.total) * 100 if disk.total > 0 else 0
                    }
                },
                "uptime": "System running normally",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"System health check failed: {e}")
            return {
                "database": db_status,
                "face_recognition": "unknown",
                "system": {
                    "memory": {"error": "Unable to fetch"},
                    "cpu": {"error": "Unable to fetch"},
                    "disk": {"error": "Unable to fetch"}
                },
                "uptime": "Unknown",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    async def toggle_user_status(self, user_id: str, is_active: bool) -> bool:
        """Kích hoạt/Vô hiệu hóa user"""
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "is_active": is_active, 
                    "updated_at": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error toggling user status: {e}")
            return False
    
    async def toggle_admin_role(self, user_id: str, is_admin: bool) -> bool:
        """Cấp/Thu hồi quyền admin"""
        try:
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "is_admin": is_admin, 
                    "updated_at": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error toggling admin role: {e}")
            return False
    
    async def get_system_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Lấy system logs (sử dụng detection logs làm ví dụ)"""
        db = self.db
        logs = []
        
        try:
            async for log_data in db.detection_logs.find().sort("timestamp", -1).limit(limit):
                try:
                    # Get camera name safely
                    camera_data = None
                    if "camera_id" in log_data:
                        camera_data = await db.cameras.find_one({"_id": log_data["camera_id"]})
                    camera_name = camera_data["name"] if camera_data else "Unknown Camera"
                    
                    # Get user info safely
                    user_data = None
                    if "user_id" in log_data:
                        user_data = await db.users.find_one({"_id": log_data["user_id"]})
                    username = user_data["username"] if user_data else "Unknown User"
                    
                    logs.append({
                        "id": str(log_data["_id"]),
                        "timestamp": log_data.get("timestamp", datetime.utcnow()),
                        "type": "detection",
                        "username": username,
                        "camera_name": camera_name,
                        "detection_type": log_data.get("detection_type", "unknown"),
                        "person_name": log_data.get("person_name", "Unknown"),
                        "confidence": log_data.get("confidence", 0.0)  # Use .get() with default value
                    })
                except Exception as e:
                    # Skip invalid log entries but continue processing
                    print(f"Warning: Skipping invalid log entry {log_data.get('_id', 'unknown')}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error getting system logs: {e}")
            # Return empty logs instead of crashing
            return []
        
        return logs

    async def get_user_details(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin chi tiết user"""
        try:
            db = self.db
            
            # Get user info
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user_data:
                return None
            
            # Get user's cameras
            cameras = []
            async for camera in db.cameras.find({"user_id": ObjectId(user_id)}):
                cameras.append({
                    "id": str(camera["_id"]),
                    "name": camera["name"],
                    "camera_type": camera["camera_type"],
                    "is_active": camera["is_active"],
                    "created_at": camera["created_at"]
                })
            
            # Get user's persons
            persons = []
            async for person in db.known_persons.find({"user_id": ObjectId(user_id), "is_active": True}):
                persons.append({
                    "id": str(person["_id"]),
                    "name": person["name"],
                    "face_images_count": len(person.get("face_images", [])),
                    "created_at": person["created_at"]
                })
            
            # Get recent detections
            recent_detections = await db.detection_logs.count_documents({
                "user_id": ObjectId(user_id),
                "timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}
            })
            
            return {
                "user": {
                    "id": str(user_data["_id"]),
                    "username": user_data["username"],
                    "email": user_data["email"],
                    "full_name": user_data["full_name"],
                    "is_active": user_data["is_active"],
                    "is_admin": user_data["is_admin"],
                    "created_at": user_data["created_at"],
                    "updated_at": user_data.get("updated_at")
                },
                "cameras": cameras,
                "persons": persons,
                "stats": {
                    "total_cameras": len(cameras),
                    "total_persons": len(persons),
                    "recent_detections": recent_detections
                }
            }
        except Exception as e:
            print(f"Error getting user details: {e}")
            return None

# Global instance
admin_service = AdminService()