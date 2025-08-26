from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ..models.user import User
from ..services.admin_service import admin_service
from ..services.auth_service import get_admin_user
from pydantic import BaseModel
import time
import time

router = APIRouter(prefix="/admin", tags=["admin"])

class ToggleStatusRequest(BaseModel):
    is_active: bool

class ToggleAdminRequest(BaseModel):
    is_admin: bool

@router.get("/dashboard")
async def get_dashboard_stats(
    current_admin: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Lấy thống kê tổng quan cho admin dashboard"""
    try:
        stats = await admin_service.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get dashboard stats: {str(e)}"
        )

@router.get("/users")
async def get_all_users(
    current_admin: User = Depends(get_admin_user)
) -> List[Dict[str, Any]]:
    """Lấy danh sách tất cả users"""
    try:
        users = await admin_service.get_all_users()
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get users: {str(e)}"
        )

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    request: ToggleStatusRequest,
    current_admin: User = Depends(get_admin_user)
):
    """Kích hoạt/Vô hiệu hóa user"""
    try:
        success = await admin_service.toggle_user_status(user_id, request.is_active)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        
        status_text = "activated" if request.is_active else "deactivated"
        return {
            "message": f"User {status_text} successfully",
            "user_id": user_id,
            "is_active": request.is_active
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update user status: {str(e)}"
        )

@router.post("/users/{user_id}/toggle-admin")
async def toggle_admin_role(
    user_id: str,
    request: ToggleAdminRequest,
    current_admin: User = Depends(get_admin_user)
):
    """Cấp/Thu hồi quyền admin"""
    try:
        success = await admin_service.toggle_admin_role(user_id, request.is_admin)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        
        role_text = "granted" if request.is_admin else "revoked"
        return {
            "message": f"Admin role {role_text} successfully",
            "user_id": user_id,
            "is_admin": request.is_admin
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update admin role: {str(e)}"
        )

@router.get("/health")
async def get_system_health(
    current_admin: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Lấy thông tin sức khỏe hệ thống"""
    try:
        health_info = await admin_service.get_system_health()
        return health_info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system health: {str(e)}"
        )

@router.get("/logs")
async def get_system_logs(
    limit: int = 100,
    current_admin: User = Depends(get_admin_user)
) -> List[Dict[str, Any]]:
    """Lấy system logs"""
    try:
        return await admin_service.get_system_logs(limit)
    except Exception as e:
        print(f"Error getting system logs: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system logs: {str(e)}"
        )

@router.get("/users/{user_id}/details")
async def get_user_details(
    user_id: str,
    current_admin: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Lấy thông tin chi tiết user"""
    try:
        user_details = await admin_service.get_user_details(user_id)
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to get user details: {str(e)}"
        )

@router.get("/detection-tracking")
async def get_detection_tracking_overview(
    current_admin: User = Depends(get_admin_user)
):
    """Lấy tổng quan về detection tracking trên toàn hệ thống"""
    try:
        from ..services.detection_tracker import detection_tracker
        
        # Lấy thông tin từ tất cả cameras
        total_presences = 0
        cameras_with_activity = 0
        tracking_details = {}
        
        # Iterate through all active cameras (you might want to get this from database)
        from ..database import get_database
        db = get_database()
        
        cameras_cursor = db.cameras.find({"is_active": True})
        
        async for camera in cameras_cursor:
            camera_id = str(camera["_id"])
            camera_name = camera.get("name", "Unknown")
            
            presence_info = detection_tracker.get_presence_info(camera_id)
            
            if presence_info:
                cameras_with_activity += 1
                total_presences += len(presence_info)
                
                tracking_details[camera_id] = {
                    "camera_name": camera_name,
                    "active_presences": len(presence_info),
                    "presences": presence_info
                }
        
        return {
            "total_presences": total_presences,
            "cameras_with_activity": cameras_with_activity,
            "tracking_details": tracking_details,
            "system_status": "active" if total_presences > 0 else "idle"
        }
        
    except Exception as e:
        print(f"❌ Error getting detection tracking overview: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get detection tracking overview: {str(e)}"
        )

@router.post("/detection-tracking/reset")
async def reset_detection_tracking(
    current_admin: User = Depends(get_admin_user)
):
    """Reset detection tracking (xóa tất cả presence tracking)"""
    try:
        from ..services.detection_tracker import detection_tracker
        
        # Reset all presences
        detection_tracker.presences.clear()
        
        return {
            "message": "Detection tracking reset successfully",
            "timestamp": time.time()
        }
        
    except Exception as e:
        print(f"❌ Error resetting detection tracking: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset detection tracking: {str(e)}"
        )