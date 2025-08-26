from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..services.auth_service import get_current_active_user
from ..services.notification_service import notification_service

router = APIRouter(prefix="/test", tags=["test"])

@router.post("/email")
async def test_email_notification(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Test gửi email thông báo"""
    try:
        # Test basic email functionality
        result = await notification_service.test_email_configuration(current_user.id)
        
        if result["success"]:
            return {
                "success": True,
                "message": "Email test sent successfully!",
                "details": result["message"],
                "user_email": await notification_service._get_user_email(current_user.id)
            }
        else:
            return {
                "success": False,
                "error": result["error"],
                "user_email": await notification_service._get_user_email(current_user.id)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@router.post("/stranger-alert")
async def test_stranger_alert(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Test gửi cảnh báo phát hiện người lạ"""
    try:
        # Create fake camera info
        fake_camera_info = {
            "id": "test_camera_id",
            "name": "Test Camera",
            "camera_type": "webcam",
            "location": "Test Location"
        }
        
        # Create fake stranger detections
        fake_detections = [
            {
                "detection_type": "stranger",
                "person_name": "Unknown",
                "confidence": 0.85,
                "bbox": [100, 100, 200, 200]
            },
            {
                "detection_type": "stranger", 
                "person_name": "Unknown",
                "confidence": 0.92,
                "bbox": [300, 150, 400, 250]
            }
        ]
        
        # Create fake alert data
        alert_data = {
            "type": "stranger_only_alert",
            "severity": "high",
            "title": "🧪 TEST - PHÁT HIỆN NGƯỜI LẠ",
            "message": f"[TEST MODE] Phát hiện {len(fake_detections)} người lạ tại {fake_camera_info['name']} (không có người quen)",
            "stranger_count": len(fake_detections),
            "known_person_count": 0,
            "detections": fake_detections,
            "camera_info": fake_camera_info,
            "timestamp": "2025-01-01T12:00:00Z",
            "action_required": True,
            "alert_id": "test_alert_123"
        }
        
        # Send test stranger email
        await notification_service._send_stranger_email_with_image(
            current_user.id, 
            alert_data, 
            None  # No image for test
        )
        
        user_email = await notification_service._get_user_email(current_user.id)
        
        return {
            "success": True,
            "message": "Test stranger alert email sent successfully!",
            "user_email": user_email,
            "alert_details": {
                "stranger_count": alert_data["stranger_count"],
                "camera_name": fake_camera_info["name"],
                "detections": len(fake_detections)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stranger alert test failed: {str(e)}")

@router.get("/email-config")
async def check_email_config(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Kiểm tra cấu hình email"""
    try:
        from ..config import get_settings
        settings = get_settings()
        
        user_email = await notification_service._get_user_email(current_user.id)
        
        return {
            "smtp_configured": bool(settings.smtp_username and settings.smtp_password),
            "smtp_server": settings.smtp_server,
            "smtp_port": settings.smtp_port,
            "smtp_username": settings.smtp_username,
            "smtp_use_tls": settings.smtp_use_tls,
            "user_email": user_email,
            "user_has_email": bool(user_email),
            "recommendation": "Ensure SMTP credentials are set in .env file and user has email address" if not user_email else "Configuration looks good!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Config check failed: {str(e)}")
