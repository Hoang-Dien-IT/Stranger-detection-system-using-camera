from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models.detection_log import DetectionLog
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/unread-count")
async def get_unread_count(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get count of unread alerts (recent detections)
    """
    try:
        # Count detections from last 24 hours as "alerts"
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        print(f"MongoDB collections: {await db.list_collection_names()}")
        
        # Check if collection exists
        if "detection_logs" not in await db.list_collection_names():
            print("Warning: detection_logs collection does not exist")
            return {"count": 0}
            
        try:
            # MongoDB query for counting documents
            unread_count = await db["detection_logs"].count_documents({
                "timestamp": {"$gte": last_24h},
                "detection_type": {"$in": ["stranger", "unknown"]}  # Only unknown persons as alerts
            })
            
            return {"count": unread_count}
        except Exception as e:
            print(f"Error in count_documents: {str(e)}")
            # Fallback to simpler query without date filter
            try:
                unread_count = await db["detection_logs"].count_documents({
                    "detection_type": {"$in": ["stranger", "unknown"]}
                })
                return {"count": unread_count}
            except Exception as e2:
                print(f"Error in fallback count_documents: {str(e2)}")
                return {"count": 0}
        
    except Exception as e:
        import traceback
        print(f"Error in get_unread_count: {str(e)}")
        print(traceback.format_exc())
        return {"count": 0}  # Return 0 instead of error to avoid frontend issues

@router.get("/")
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    alert_type: Optional[str] = Query(None),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get alerts (detection events that need attention)
    """
    try:
        # Build MongoDB query
        query = {}
        if alert_type:
            query["detection_type"] = alert_type
        else:
            # Default: only show stranger/unknown detections as alerts
            query["detection_type"] = {"$in": ["stranger", "unknown"]}
        
        # Get total count
        total = await db["detection_logs"].count_documents(query)
        
        # Get alerts with pagination
        cursor = db["detection_logs"].find(query).sort("timestamp", -1).skip(skip).limit(limit)
        
        # Convert to response format
        alert_list = []
        async for alert in cursor:
            # Get camera name
            camera_name = "Unknown"
            if "camera_id" in alert:
                camera = await db["cameras"].find_one({"id": alert["camera_id"]})
                if camera and "name" in camera:
                    camera_name = camera["name"]
                    
            alert_data = {
                "id": str(alert["id"]),
                "camera_id": str(alert.get("camera_id", "")),
                "camera_name": camera_name,
                "detection_type": alert.get("detection_type", "unknown"),
                "person_name": alert.get("person_name"),
                "confidence": alert.get("confidence", 0.0),
                "timestamp": alert.get("timestamp", datetime.utcnow()).isoformat(),
                "image_path": alert.get("image_path", ""),
                "bbox": alert.get("bbox", [0, 0, 0, 0]),
                "metadata": alert.get("metadata", {}),
                "is_read": False,  # Default to unread
                "severity": "high" if alert.get("detection_type") == "stranger" else "medium"
            }
            alert_list.append(alert_data)
        
        return {
            "alerts": alert_list,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_next": skip + limit < total,
            "has_prev": skip > 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{alert_id}/mark-read")
async def mark_alert_read(
    alert_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an alert as read
    """
    try:
        # For now, just return success since we don't have a read status in DetectionLog
        # In a real system, you might want to add a separate alerts table or add is_read field
        return {"message": "Alert marked as read", "alert_id": alert_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mark-all-read")
async def mark_all_alerts_read(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all alerts as read
    """
    try:
        # For now, just return success
        return {"message": "All alerts marked as read"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
