from fastapi import APIRouter, Depends, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from ..models.user import User
from ..models.camera import CameraResponse
from ..services.auth_service import get_current_active_user, auth_service
from ..services.camera_service import camera_service
from ..services.stream_processor import stream_processor
import cv2
import asyncio
from io import BytesIO

router = APIRouter(prefix="/stream", tags=["stream"])

# ✅ DI CHUYỂN ENDPOINT /active LÊN ĐẦU (trước /{camera_id})
# Chỉ thay thế method get_active_streams này:

@router.get("/active")
async def get_active_streams(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Lấy danh sách tất cả streams đang active của user"""
    try:
        # Lấy cameras từ database trực tiếp thay vì qua camera_service
        from ..database import get_database
        from bson import ObjectId
        
        db = get_database()
        cameras = []
        
        # Query cameras của user từ database
        async for camera_data in db.cameras.find({"user_id": ObjectId(current_user.id)}):
            cameras.append({
                "id": str(camera_data["_id"]),
                "name": camera_data["name"],
                "camera_type": camera_data.get("camera_type", "webcam"),
                "camera_url": camera_data.get("camera_url", ""),
                "is_active": camera_data.get("is_active", True)
            })
        
        active_streams = []
        
        for camera in cameras:
            # Kiểm tra stream status từ stream_processor
            stream_info = await stream_processor.get_stream_info(camera["id"])
            
            if stream_info.get("is_streaming", False):
                active_streams.append({
                    "camera_id": camera["id"],
                    "camera_name": camera["name"],
                    "camera_type": camera["camera_type"],
                    "is_streaming": True,
                    "status": stream_info.get("status", "online"),
                    "uptime": stream_info.get("uptime", 0),
                    "viewers_count": stream_info.get("viewers_count", 0),
                    "stream_url": f"/api/stream/{camera['id']}/video"
                })
        
        return {
            "success": True,
            "active_streams_count": len(active_streams),
            "active_streams": active_streams,
            "total_cameras": len(cameras)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{camera_id}")
async def get_stream_info(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Lấy thông tin stream của camera"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Get stream info
        stream_info = await stream_processor.get_stream_info(camera_id)
        
        return {
            "camera_id": camera_id,
            "camera_name": camera.name,
            "camera_type": camera.camera_type,
            "camera_url": camera.camera_url,
            "is_streaming": stream_info.get("is_streaming", False),
            "stream_url": f"/api/stream/{camera_id}/video",
            "websocket_url": f"/api/ws/{current_user.id}",
            "stream_settings": camera.stream_settings,
            "detection_enabled": camera.detection_enabled,
            "status": stream_info.get("status", "offline")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ... GIỮ NGUYÊN CÁC ENDPOINT KHÁC
@router.get("/{camera_id}/video")
async def stream_video(
    camera_id: str,
    token: Optional[str] = Query(None)
):
    """Stream video từ camera with authentication via query parameter"""
    try:
        # Authentication via query parameter
        if not token:
            raise HTTPException(status_code=401, detail="Token required for streaming")
        
        # Verify token and get user
        current_user = await auth_service.verify_token_from_query(token)
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"🔵 Streaming video for camera {camera_id}, user: {current_user.username}")
        
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found: {camera.name}, starting video stream...")
        
        # Start video stream
        return StreamingResponse(
            stream_processor.generate_video_stream(camera_id, camera),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in stream_video: {e}")
        raise HTTPException(status_code=500, detail=f"Stream error: {str(e)}")
        
        # Start video stream
        return StreamingResponse(
            stream_processor.generate_video_stream(camera_id, camera),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{camera_id}/start")
async def start_stream(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Bắt đầu stream camera"""
    try:
        print(f"🔵 Starting stream for camera: {camera_id}")
        
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            print(f"❌ Camera not found: {camera_id}")
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found: {camera.name}")
        
        # Start stream với stream processor
        print("🔵 Calling stream_processor.start_stream...")
        success = await stream_processor.start_stream(camera_id, camera)
        print(f"🔵 Stream processor result: {success}")
        
        if success:
            # Cập nhật trạng thái streaming trong database
            print("🔵 Updating camera streaming status in database...")
            try:
                await camera_service.start_streaming(camera_id, str(current_user.id))
                print("✅ Database updated successfully")
            except Exception as db_error:
                print(f"⚠️ Database update failed: {db_error}")
                # Continue anyway as stream was started successfully
            
            return {
                "message": "Stream started successfully",
                "camera_id": camera_id,
                "camera_name": camera.name,
                "stream_url": f"/api/stream/{camera_id}/video",
                "status": "streaming"
            }
        else:
            print("❌ Stream processor failed to start stream")
            raise HTTPException(status_code=400, detail="Failed to start stream")
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Unexpected error in start_stream: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{camera_id}/stop")
async def stop_stream(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Dừng stream camera"""
    try:
        print(f"🔵 Stopping stream for camera: {camera_id}")
        
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            print(f"❌ Camera not found: {camera_id}")
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found: {camera.name}")
        
        # Stop stream với stream processor
        print("🔵 Calling stream_processor.stop_stream...")
        success = await stream_processor.stop_stream(camera_id)
        print(f"🔵 Stream processor result: {success}")
        
        if success:
            # Cập nhật trạng thái streaming trong database
            print("🔵 Updating camera streaming status in database...")
            try:
                await camera_service.stop_streaming(camera_id, str(current_user.id))
                print("✅ Database updated successfully")
            except Exception as db_error:
                print(f"⚠️ Database update failed: {db_error}")
                # Continue anyway as stream was stopped successfully
            
            return {
                "message": "Stream stopped successfully",
                "camera_id": camera_id,
                "camera_name": camera.name,
                "status": "stopped"
            }
        else:
            print("❌ Stream processor failed to stop stream")
            raise HTTPException(status_code=400, detail="Failed to stop stream")
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Unexpected error in stop_stream: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{camera_id}/snapshot")
async def capture_snapshot(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Chụp ảnh snapshot từ camera"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Capture snapshot
        image_bytes = await stream_processor.capture_snapshot(camera_id, camera)
        
        if image_bytes:
            return Response(
                content=image_bytes,
                media_type="image/jpeg",
                headers={"Content-Disposition": f"attachment; filename=snapshot_{camera_id}.jpg"}
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to capture snapshot")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{camera_id}/status")
async def get_stream_status(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Lấy trạng thái stream"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Get stream status
        status = await stream_processor.get_stream_status(camera_id)
        
        return {
            "camera_id": camera_id,
            "camera_name": camera.name,
            "is_streaming": status.get("is_streaming", False),
            "is_recording": status.get("is_recording", False),
            "detection_enabled": camera.detection_enabled,
            "viewers_count": status.get("viewers_count", 0),
            "uptime": status.get("uptime", 0),
            "frame_rate": status.get("frame_rate", 0),
            "resolution": status.get("resolution", "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))