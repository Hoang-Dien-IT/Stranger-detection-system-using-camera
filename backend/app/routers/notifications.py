from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..services.auth_service import get_current_user
from ..services.notification_service import notification_service
from ..models.user import User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.post("/test-email")
async def test_email_notification(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Test email notification configuration
    """
    try:
        result = await notification_service.test_email_configuration(str(current_user.id))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-stranger-alert")
async def test_stranger_alert(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Test stranger alert email with sample data
    """
    try:
        # Sample detection data
        sample_detections = [
            {
                "detection_type": "stranger",
                "person_name": "Unknown",
                "confidence": 0.85,
                "bbox": {"x": 100, "y": 50, "width": 200, "height": 250},
                "timestamp": "2025-08-04T10:30:00"
            }
        ]
        
        # Sample camera info
        camera_info = {
            "id": "test_camera_id",
            "name": "Camera Test",
            "location": "Cửa chính",
            "camera_type": "IP Camera",
            "description": "Test camera for email notification"
        }
        
        # Prepare alert data
        alert_data = {
            "type": "stranger_only_alert",
            "severity": "high",
            "title": "⚠️ NGƯỜI LẠ PHÁT HIỆN (TEST)",
            "message": "Test email notification - Phát hiện 1 người lạ tại Camera Test",
            "stranger_count": 1,
            "known_person_count": 0,
            "detections": sample_detections,
            "camera_info": camera_info,
            "timestamp": "2025-08-04T10:30:00",
            "action_required": True,
            "alert_id": "test_alert_123",
            "detection_log_id": "test_log_123",
            "system_stats": {
                "total_detections_24h": 5,
                "stranger_alerts_24h": 2,
                "avg_confidence_24h": 82.5,
                "max_confidence_24h": 95.0,
                "min_confidence_24h": 70.0,
                "total_cameras": 1,
                "known_persons_count": 3,
                "last_updated": "2025-08-04T10:30:00"
            }
        }
        
        # Send test email - DISABLED TO PREVENT SPAM
        print(f"⚠️ [DISABLED] Test email call disabled to prevent spam")
        email_sent = False
        # email_sent = await notification_service._send_stranger_email_with_image(
        #     user_id=str(current_user.id),
        #     alert_data=alert_data,
        #     image_data=None  # No image for test
        # )
        
        if email_sent:
            return {"success": True, "message": "Test stranger alert email sent successfully"}
        else:
            return {"success": False, "message": "Failed to send test email"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings")
async def get_notification_settings(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get user notification settings
    """
    try:
        settings = await notification_service._get_user_notification_settings(str(current_user.id))
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-cooldown")
async def reset_email_cooldown(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Reset email cooldown for testing purposes
    """
    try:
        # Clear cooldown for this user
        user_id = str(current_user.id)
        keys_to_remove = [key for key in notification_service.alert_cooldown.keys() if user_id in key]
        
        for key in keys_to_remove:
            del notification_service.alert_cooldown[key]
        
        return {
            "success": True, 
            "message": f"Email cooldown reset for user {current_user.email}",
            "cleared_keys": len(keys_to_remove)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/force-test-email")
async def force_test_stranger_email(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Force send test stranger email (bypass cooldown)
    """
    try:
        # Temporarily clear cooldown
        user_id = str(current_user.id)
        old_cooldowns = notification_service.alert_cooldown.copy()
        notification_service.alert_cooldown.clear()
        
        # Sample detection data
        sample_detections = [
            {
                "detection_type": "stranger",
                "person_name": "Unknown",
                "confidence": 0.85,
                "bbox": {"x": 100, "y": 50, "width": 200, "height": 250},
                "timestamp": "2025-08-04T10:30:00"
            }
        ]
        
        # Sample camera info
        camera_info = {
            "id": "test_camera_id",
            "name": "Camera Test (Force)",
            "location": "Test Location",
            "camera_type": "IP Camera",
            "description": "Force test email bypass cooldown"
        }
        
        # Prepare alert data
        alert_data = {
            "type": "stranger_only_alert",
            "severity": "high",
            "title": "⚠️ NGƯỜI LẠ PHÁT HIỆN (FORCE TEST)",
            "message": "Force test email - Bypass cooldown",
            "stranger_count": 1,
            "known_person_count": 0,
            "detections": sample_detections,
            "camera_info": camera_info,
            "timestamp": "2025-08-04T10:30:00",
            "action_required": True,
            "alert_id": "force_test_alert_123",
            "detection_log_id": "force_test_log_123",
            "system_stats": {
                "total_detections_24h": 5,
                "stranger_alerts_24h": 2,
                "avg_confidence_24h": 82.5,
                "max_confidence_24h": 95.0,
                "min_confidence_24h": 70.0,
                "total_cameras": 1,
                "known_persons_count": 3,
                "last_updated": "2025-08-04T10:30:00"
            }
        }
        
        # Send test email (cooldown cleared) - DISABLED TO PREVENT SPAM  
        print(f"⚠️ [DISABLED] Force test email call disabled to prevent spam")
        email_sent = False
        # email_sent = await notification_service._send_stranger_email_with_image(
        #     user_id=user_id,
        #     alert_data=alert_data,
        #     image_data=None
        # )
        
        # Restore original cooldowns (but not the test one)
        for key, value in old_cooldowns.items():
            if "force_test" not in key:
                notification_service.alert_cooldown[key] = value
        
        if email_sent:
            return {"success": True, "message": "Force test email sent successfully (bypassed cooldown)"}
        else:
            return {"success": False, "message": "Failed to send force test email"}
            
    except Exception as e:
        # Restore cooldowns on error
        notification_service.alert_cooldown = old_cooldowns
        raise HTTPException(status_code=500, detail=str(e))
