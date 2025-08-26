from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from ..models.user import User
from ..services.auth_service import get_current_active_user
from ..services.detection_optimizer_service import DetectionOptimizerService

router = APIRouter(prefix="/api/detections", tags=["Detections"])

# Initialize service (but don't connect to database yet)
detection_optimizer = None

# Khởi động background tasks
@router.on_event("startup")
async def startup():
    global detection_optimizer
    detection_optimizer = DetectionOptimizerService()
    detection_optimizer.start_background_tasks()

@router.on_event("shutdown")
async def shutdown():
    await detection_optimizer.stop_background_tasks()

@router.post("/create-optimized")
async def create_optimized_detection(
    detection_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Tạo detection với logic tối ưu"""
    try:
        if detection_optimizer is None:
            raise HTTPException(status_code=503, detail="Detection optimizer service not initialized")
            
        # Add user_id to detection data
        detection_data["user_id"] = current_user.id
        
        # Process detection with optimizer
        detection_id = await detection_optimizer.process_detection(detection_data)
        
        return {
            "detection_id": detection_id,
            "message": "Detection processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create detection: {str(e)}"
        )

@router.get("/optimized-history")
async def get_optimized_detection_history(
    detection_type: Optional[str] = Query(None, regex="^(known_person|stranger)$"),
    camera_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    if detection_optimizer is None:
        raise HTTPException(status_code=503, detail="Detection optimizer service not initialized")
    """Lấy lịch sử detection tối ưu (sessions)"""
    try:
        filters = {}
        if detection_type:
            filters["detection_type"] = detection_type
        if camera_id:
            filters["camera_id"] = camera_id
        if date_from:
            filters["date_from"] = date_from
        if date_to:
            filters["date_to"] = date_to
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        sessions = await detection_optimizer.get_sessions(
            user_id=current_user.id,
            filters=filters,
            limit=limit,
            skip=skip
        )
        
        stats = await detection_optimizer.get_session_stats(
            user_id=current_user.id
        )
        
        return {
            "sessions": sessions,
            "stats": stats,
            "total_count": len(sessions),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimized detection history: {str(e)}"
        )

@router.post("/cleanup")
async def cleanup_old_detection_data(
    days_to_keep: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_active_user)
):
    """Dọn dẹp dữ liệu detection cũ"""
    if detection_optimizer is None:
        raise HTTPException(status_code=503, detail="Detection optimizer service not initialized")
    try:
        result = await detection_optimizer.cleanup_old_data(
            user_id=current_user.id,
            days_to_keep=days_to_keep
        )
        
        return {
            "message": f"Cleaned up old detection data: {result['sessions_deleted']} sessions, {result['detections_deleted']} detections",
            "sessions_deleted": result["sessions_deleted"],
            "detections_deleted": result["detections_deleted"],
            "days_kept": days_to_keep
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cleanup detection data: {str(e)}"
        )
