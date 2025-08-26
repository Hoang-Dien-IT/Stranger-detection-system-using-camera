from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from pydantic import BaseModel
from ..models.user import User
from ..services.auth_service import get_current_active_user
from ..services.user_service import user_service
import uuid
import os
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

class ProfileUpdateData(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    timezone: Optional[str] = None

class PasswordChangeData(BaseModel):
    current_password: str
    new_password: str

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy thông tin profile của user hiện tại"""
    try:
        # Return current user data
        return {
            "id": str(current_user.id),
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": getattr(current_user, 'phone', ''),
            "location": getattr(current_user, 'location', ''),
            "bio": getattr(current_user, 'bio', ''),
            "website": getattr(current_user, 'website', ''),
            "job_title": getattr(current_user, 'job_title', ''),
            "company": getattr(current_user, 'company', ''),
            "timezone": getattr(current_user, 'timezone', 'UTC+7'),
            "avatar_url": getattr(current_user, 'avatar_url', ''),
            "is_admin": current_user.is_admin,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": getattr(current_user, 'last_login', None)
        }
    except Exception as e:
        print(f"❌ Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdateData,
    current_user: User = Depends(get_current_active_user)
):
    """Cập nhật thông tin profile"""
    try:
        # Get current user data from database
        user_dict = await user_service.get_user_by_id(str(current_user.id))
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update only provided fields
        update_data = {}
        if profile_data.full_name is not None:
            update_data['full_name'] = profile_data.full_name
        if profile_data.email is not None:
            update_data['email'] = profile_data.email
        if profile_data.phone is not None:
            update_data['phone'] = profile_data.phone
        if profile_data.location is not None:
            update_data['location'] = profile_data.location
        if profile_data.bio is not None:
            update_data['bio'] = profile_data.bio
        if profile_data.website is not None:
            update_data['website'] = profile_data.website
        if profile_data.job_title is not None:
            update_data['job_title'] = profile_data.job_title
        if profile_data.company is not None:
            update_data['company'] = profile_data.company
        if profile_data.timezone is not None:
            update_data['timezone'] = profile_data.timezone
        
        # Update user in database
        updated_user = await user_service.update_user(str(current_user.id), update_data)
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": updated_user
        }
    except Exception as e:
        print(f"❌ Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeData,
    current_user: User = Depends(get_current_active_user)
):
    """Đổi mật khẩu"""
    try:
        # Verify current password
        is_valid = await user_service.verify_password(str(current_user.id), password_data.current_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password
        await user_service.update_password(str(current_user.id), password_data.new_password)
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload avatar cho user"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (5MB max)
        if file.size and file.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update user avatar URL
        avatar_url = f"/uploads/avatars/{filename}"
        await user_service.update_user(str(current_user.id), {"avatar_url": avatar_url})
        
        return {
            "success": True,
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity")
async def get_user_activity(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy hoạt động gần đây của user"""
    try:
        # This would typically come from an activity log
        # For now, return mock data
        return [
            {
                "id": "1",
                "action": "Login",
                "description": "Logged in from Chrome on Windows",
                "ip_address": "192.168.1.100",
                "user_agent": "Chrome 91.0",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success"
            },
            {
                "id": "2", 
                "action": "Profile Update",
                "description": "Updated profile information",
                "ip_address": "192.168.1.100",
                "user_agent": "Chrome 91.0",
                "timestamp": (datetime.utcnow()).isoformat(),
                "status": "success"
            }
        ]
    except Exception as e:
        print(f"❌ Error getting user activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
