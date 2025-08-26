from typing import Dict, Any, Optional
from bson import ObjectId
from ..database import get_database
from datetime import datetime
from ..utils.timezone_utils import vietnam_now
from ..models.user import User

class SettingsService:
    @property
    def db(self):
        return get_database()
    
    @property
    def collection(self):
        return self.db.user_settings
    
    @property
    def users_collection(self):
        return self.db.users

    async def get_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Lấy cài đặt của user"""
        try:
            settings_data = await self.collection.find_one({"user_id": ObjectId(user_id)})
            
            if settings_data:
                # Remove MongoDB fields and return settings
                settings_data.pop("_id", None)
                settings_data.pop("user_id", None)
                settings_data.pop("created_at", None)
                settings_data.pop("updated_at", None)
                return settings_data
            else:
                # Return default settings
                return self._get_default_settings()
        except Exception as e:
            print(f"Error getting user settings: {e}")
            return self._get_default_settings()

    async def update_user_settings(self, user_id: str, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cập nhật cài đặt của user"""
        try:
            settings_doc = {
                **settings_data,
                "user_id": ObjectId(user_id),
                "updated_at": vietnam_now()
            }
            
            # Upsert settings
            result = await self.collection.update_one(
                {"user_id": ObjectId(user_id)},
                {
                    "$set": settings_doc,
                    "$setOnInsert": {"created_at": vietnam_now()}
                },
                upsert=True
            )
            
            return settings_data
        except Exception as e:
            raise ValueError(f"Failed to update settings: {str(e)}")

    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile information"""
        try:
            # Remove None values
            update_data = {k: v for k, v in profile_data.items() if v is not None}
            update_data["updated_at"] = vietnam_now()
            
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return False

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            # Get current user
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False
            
            # Verify current password
            if not pwd_context.verify(current_password, user.get("hashed_password", "")):
                return False
            
            # Hash new password
            hashed_password = pwd_context.hash(new_password)
            
            # Update password
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hashed_password": hashed_password,
                        "updated_at": vietnam_now()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error changing password: {e}")
            return False

    async def reset_user_settings(self, user_id: str) -> bool:
        """Reset cài đặt về mặc định"""
        try:
            default_settings = self._get_default_settings()
            await self.update_user_settings(user_id, default_settings)
            return True
        except Exception as e:
            print(f"Error resetting user settings: {e}")
            return False

    def _get_default_settings(self) -> Dict[str, Any]:
        """Lấy cài đặt mặc định"""
        return {
            # General Settings
            "timezone": "UTC+7",
            "language": "vi",
            "theme": "light",
            "enable_animations": True,
            "auto_save": True,
            
            # Notification Settings
            "email_notifications": True,
            "web_notifications": True,
            "detection_alerts": True,
            "stranger_alerts": True,
            "known_person_alerts": True,
            "camera_offline_alerts": True,
            "system_alerts": True,
            "alert_sound": True,
            "webhook_enabled": False,
            "notification_frequency": "immediate",
            "quiet_hours_enabled": False,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "alert_threshold": 0.7,
            
            # Face Recognition Settings
            "detection_enabled": True,
            "confidence_threshold": 0.7,
            "save_unknown_faces": True,
            "anti_spoofing_enabled": True,
            "real_time_processing": True,
            "stranger_alert_cooldown": 300,
            "detection_sensitivity": 0.7,
            "max_faces_per_frame": 10,
            "face_quality_threshold": 0.5,
            "enable_gender_detection": False,
            "enable_age_estimation": False,
            "enable_emotion_detection": False,
            
            # Security Settings
            "two_factor_enabled": False,
            "login_alerts": True,
            "session_timeout": 3600,
            "auto_logout": False,
            "device_management": True,
            "ip_whitelist_enabled": False,
            "ip_whitelist": [],
            "password_expiry_enabled": False,
            "password_expiry_days": 90,
            "login_attempts_limit": 5,
            "account_lockout_duration": 900,
            "require_password_change": False,
            "enable_session_recording": False,
            "audit_log_retention": 90,
            
            # System Settings
            "auto_delete_logs": False,
            "log_retention_days": 30,
            "stream_quality": "medium",
            "max_cameras": 5
        }

# Global instance
settings_service = SettingsService()