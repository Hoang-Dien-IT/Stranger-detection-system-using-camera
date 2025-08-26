from typing import Optional, Dict, Any
from bson import ObjectId
from passlib.context import CryptContext
from ..database import get_database
from ..models.user import User
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    @property
    def db(self):
        return get_database()

    @property
    def collection(self):
        return self.db.users

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Lấy user theo ID"""
        try:
            user_doc = await self.collection.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                user_doc["id"] = str(user_doc["_id"])
                del user_doc["_id"]
                return user_doc
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cập nhật thông tin user"""
        try:
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            if not update_data:
                # Return current user if no updates
                return await self.get_user_by_id(user_id)
            
            # Update user
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return await self.get_user_by_id(user_id)
            else:
                # Return current user even if nothing was modified
                return await self.get_user_by_id(user_id)
                
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise Exception(f"Failed to update user: {str(e)}")

    async def verify_password(self, user_id: str, password: str) -> bool:
        """Xác thực mật khẩu hiện tại"""
        try:
            user_doc = await self.collection.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return False
            
            return self.pwd_context.verify(password, user_doc.get("hashed_password", ""))
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False

    async def update_password(self, user_id: str, new_password: str) -> bool:
        """Cập nhật mật khẩu mới"""
        try:
            # Hash new password
            hashed_password = self.pwd_context.hash(new_password)
            
            # Update password in database
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"hashed_password": hashed_password}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating password: {e}")
            raise Exception(f"Failed to update password: {str(e)}")

    async def update_avatar(self, user_id: str, avatar_url: str) -> bool:
        """Cập nhật avatar URL"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"avatar_url": avatar_url}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating avatar: {e}")
            return False

    async def get_user_activity(self, user_id: str, limit: int = 10):
        """Lấy hoạt động gần đây của user"""
        try:
            # This would typically come from an activity log collection
            # For now, return mock data
            return [
                {
                    "id": "1",
                    "action": "Login",
                    "description": "Logged in successfully",
                    "timestamp": "2024-01-01T12:00:00Z",
                    "ip_address": "192.168.1.100",
                    "user_agent": "Chrome/91.0"
                }
            ]
        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return []

# Global instance
user_service = UserService()
