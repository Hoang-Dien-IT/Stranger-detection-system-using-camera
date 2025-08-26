from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..services.auth_service import get_current_active_user
from ..services.settings_service import settings_service
from ..services.notification_service import notification_service
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])

class UserSettings(BaseModel):
    email_notifications: bool = True
    web_notifications: bool = True
    detection_sensitivity: float = 0.7
    auto_delete_logs: bool = False
    log_retention_days: int = 30
    stream_quality: str = "medium"
    max_cameras: int = 5
    timezone: str = "UTC"
    language: str = "en"

@router.get("/", response_model=UserSettings)
async def get_user_settings(
    current_user: User = Depends(get_current_active_user)
) -> UserSettings:
    """Lấy cài đặt của user"""
    settings = await settings_service.get_user_settings(str(current_user.id))
    return UserSettings(**settings)

@router.put("/", response_model=UserSettings)
async def update_user_settings(
    settings_data: UserSettings,
    current_user: User = Depends(get_current_active_user)
) -> UserSettings:
    """Cập nhật cài đặt của user"""
    try:
        updated_settings = await settings_service.update_user_settings(
            str(current_user.id), 
            settings_data.model_dump()
        )
        return UserSettings(**updated_settings)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/default")
async def get_default_settings() -> UserSettings:
    """Lấy cài đặt mặc định"""
    return UserSettings()

@router.post("/reset")
async def reset_user_settings(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Reset cài đặt về mặc định"""
    try:
        success = await settings_service.reset_user_settings(str(current_user.id))
        if success:
            return {"message": "Settings reset to default successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to reset settings")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/notifications")
async def get_notification_settings(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get user notification settings"""
    try:
        user_settings = await settings_service.get_user_settings(str(current_user.id))
        
        # Map to notification settings format
        return {
            "global_enabled": True,
            "email_enabled": user_settings.get("email_notifications", False),
            "push_enabled": user_settings.get("web_notifications", False),
            "sound_enabled": user_settings.get("alert_sound", True),
            "detection_alerts": user_settings.get("email_alerts", True),
            "system_alerts": True,
            "security_alerts": True,
            "alert_threshold": user_settings.get("confidence_threshold", 0.7),
            "quiet_hours_enabled": False,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "channels": [],
            "rules": []
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/notifications")
async def update_notification_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Update notification settings"""
    try:
        # Map notification settings to user settings
        user_settings_update = {
            "email_notifications": settings_data.get("email_enabled", False),
            "web_notifications": settings_data.get("push_enabled", False),
            "alert_sound": settings_data.get("sound_enabled", True),
            "email_alerts": settings_data.get("detection_alerts", True),
            "confidence_threshold": settings_data.get("alert_threshold", 0.7)
        }
        
        await settings_service.update_user_settings(str(current_user.id), user_settings_update)
        return settings_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/notifications/test")
async def send_test_notification(
    current_user: User = Depends(get_current_active_user)
):
    """Send test notification"""
    try:
        await notification_service.send_test_notification(str(current_user.id))
        return {"message": "Test notification sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))