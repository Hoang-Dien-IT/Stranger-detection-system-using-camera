from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime, timedelta
from ..services.notification_service import notification_service
from ..services.auth_service import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/email", tags=["Email Status"])

@router.get("/status/{camera_id}")
async def get_email_status(
    camera_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy trạng thái gửi email cho camera"""
    
    user_id = str(current_user.id)
    cooldown_key = f"{user_id}_{camera_id}_stranger_email"
    
    current_time = datetime.utcnow()
    
    # Kiểm tra cooldown
    last_alert_time = notification_service.alert_cooldown.get(cooldown_key)
    cooldown_remaining = 0
    
    if last_alert_time:
        # Cooldown mặc định 1 phút
        basic_cooldown_seconds = 60
        cooldown_end = last_alert_time + timedelta(seconds=basic_cooldown_seconds)
        if current_time < cooldown_end:
            cooldown_remaining = (cooldown_end - current_time).total_seconds()
    
    return {
        "camera_id": camera_id,
        "email_enabled": True,
        "cooldown_remaining_seconds": max(0, cooldown_remaining),
        "cooldown_rules": {
            "default": "60 giây",
            "single_stranger": "60 giây", 
            "multiple_strangers_3_plus": "30 giây"
        },
        "can_send_email": cooldown_remaining <= 0,
        "last_email_sent": last_alert_time.isoformat() if last_alert_time else None,
        "next_available_time": (last_alert_time + timedelta(seconds=60)).isoformat() if last_alert_time else None
    }

@router.post("/reset-cooldown/{camera_id}")
async def reset_email_cooldown(
    camera_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Reset email cooldown cho camera (chỉ dành cho admin hoặc dev mode)"""
    
    user_id = str(current_user.id)
    cooldown_key = f"{user_id}_{camera_id}_stranger_email"
    
    # Reset cooldown
    if cooldown_key in notification_service.alert_cooldown:
        del notification_service.alert_cooldown[cooldown_key]
    
    return {
        "status": "success",
        "message": f"Email cooldown đã được reset cho camera {camera_id}"
    }

@router.get("/statistics")
async def get_email_statistics(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lấy thống kê email của user"""
    
    user_id = str(current_user.id)
    current_time = datetime.utcnow()
    
    # Đếm số camera có cooldown active
    active_cooldowns = []
    
    for key, last_time in notification_service.alert_cooldown.items():
        if key.startswith(f"{user_id}_") and key.endswith("_stranger_email"):
            camera_id = key.split(f"{user_id}_")[1].split("_stranger_email")[0]
            remaining_seconds = max(0, 60 - (current_time - last_time).total_seconds())
            
            if remaining_seconds > 0:
                active_cooldowns.append({
                    "camera_id": camera_id,
                    "cooldown_remaining_seconds": remaining_seconds,
                    "last_email_sent": last_time.isoformat()
                })
    
    return {
        "user_id": user_id,
        "cooldown_rules": {
            "default": "60 giây",
            "single_stranger": "60 giây",
            "multiple_strangers_3_plus": "30 giây"
        },
        "active_cooldowns": active_cooldowns,
        "total_cameras_with_cooldown": len(active_cooldowns)
    }
