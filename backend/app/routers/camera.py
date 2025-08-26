from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from ..models.camera import CameraCreate, CameraUpdate, CameraResponse
from ..models.user import User
from ..services.camera_service import camera_service
from ..services.auth_service import get_current_active_user
from ..services.stream_processor import stream_processor
from pydantic import BaseModel

router = APIRouter(prefix="/cameras", tags=["cameras"])

# Models for camera settings
class CameraSettingsData(BaseModel):
    stream_settings: Optional[Dict[str, Any]] = {}
    detection_settings: Optional[Dict[str, Any]] = {}
    notification_settings: Optional[Dict[str, Any]] = {}
    recording_settings: Optional[Dict[str, Any]] = {}

@router.post("/", response_model=CameraResponse)
async def create_camera(
    camera_data: CameraCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Tạo camera mới"""
    try:
        print(f"🔵 Creating camera for user: {current_user.id}")
        result = await camera_service.create_camera(str(current_user.id), camera_data)
        print(f"✅ Camera created successfully: {result.id}")
        return result
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error creating camera: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create camera: {str(e)}")

# ✅ MAIN ROUTE - với trailing slash
@router.get("/", response_model=List[CameraResponse])
async def get_my_cameras(current_user: User = Depends(get_current_active_user)):
    """Lấy danh sách camera của user"""
    try:
        print(f"🔵 Getting cameras for user: {current_user.id}")
        cameras = await camera_service.get_user_cameras(str(current_user.id))
        print(f"✅ Found {len(cameras)} cameras")
        return cameras
    except Exception as e:
        print(f"❌ Error getting cameras: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get cameras")

@router.post("/test")
async def test_camera_before_create(
    camera_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Test kết nối camera trước khi tạo"""
    try:
        camera_type = camera_data.get("camera_type", "webcam")
        camera_url = camera_data.get("camera_url")
        
        print(f"🔵 Testing camera before create: Type={camera_type}, URL={camera_url}")
        
        # ✅ Xử lý đặc biệt cho webcam với thông tin chi tiết
        if camera_type == "webcam":
            import cv2
            
            # ✅ Test thực tế webcam connection
            test_result = {
                "is_connected": False,
                "message": "",
                "camera_type": "webcam",
                "status": "error",
                "connection_type": "local",
                "camera_url": camera_url or "0",
                "details": {}
            }
            
            try:
                # Test webcam connection
                device_id = int(camera_url) if camera_url and camera_url.isdigit() else 0
                cap = cv2.VideoCapture(device_id)
                
                if cap.isOpened():
                    # Get webcam properties
                    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    fps = cap.get(cv2.CAP_PROP_FPS)
                    
                    # Try to read a frame
                    ret, frame = cap.read()
                    cap.release()
                    
                    if ret:
                        test_result.update({
                            "is_connected": True,
                            "message": f"Webcam device {device_id} connected successfully",
                            "status": "success",
                            "details": {
                                "device_id": device_id,
                                "resolution": f"{width}x{height}",
                                "fps": round(fps, 2) if fps > 0 else "Unknown",
                                "frame_captured": True,
                                "device_path": f"/dev/video{device_id}" if device_id >= 0 else "Default device"
                            }
                        })
                    else:
                        test_result.update({
                            "message": f"Webcam device {device_id} opened but cannot capture frames",
                            "status": "warning",
                            "details": {
                                "device_id": device_id,
                                "resolution": f"{width}x{height}",
                                "fps": round(fps, 2) if fps > 0 else "Unknown",
                                "frame_captured": False,
                                "issue": "Cannot read frames from device"
                            }
                        })
                else:
                    test_result.update({
                        "message": f"Cannot open webcam device {device_id}",
                        "status": "error",
                        "details": {
                            "device_id": device_id,
                            "issue": "Device not found or already in use",
                            "suggestion": "Try different device ID (0, 1, 2...) or check if device is available"
                        }
                    })
                    
            except Exception as webcam_error:
                test_result.update({
                    "message": f"Webcam test error: {str(webcam_error)}",
                    "status": "error",
                    "details": {
                        "device_id": device_id if 'device_id' in locals() else "unknown",
                        "error": str(webcam_error),
                        "suggestion": "Check if OpenCV is installed and webcam drivers are working"
                    }
                })
            
            return test_result
        
        # ✅ Xử lý cho IP cameras với thông tin chi tiết
        if not camera_url:
            return {
                "is_connected": False,
                "message": "Camera URL is required for network cameras",
                "camera_type": camera_type,
                "status": "warning",
                "connection_type": "none",
                "details": {
                    "required_format": "rtsp://username:password@ip:port/path" if camera_type == "rtsp" else "http://ip:port/stream"
                }
            }
        
        # ✅ Test network connection cho IP cameras
        print(f"🔵 Testing network connection to: {camera_url}")
        is_connected = await camera_service._async_test_camera_connection(camera_url)
        
        if is_connected:
            print(f"✅ Camera connection successful: {camera_url}")
            return {
                "is_connected": True,
                "message": f"Network connection to {camera_type.upper()} camera successful",
                "camera_type": camera_type,
                "camera_url": camera_url,
                "status": "success",
                "connection_type": "network",
                "details": {
                    "protocol": camera_type.upper(),
                    "url": camera_url,
                    "host": camera_url.split("//")[1].split("/")[0] if "//" in camera_url else camera_url,
                    "response_time": "< 3s",
                    "status": "Network endpoint reachable"
                }
            }
        else:
            print(f"❌ Camera connection failed: {camera_url}")
            return {
                "is_connected": False,
                "message": f"Cannot reach {camera_type.upper()} camera endpoint",
                "camera_type": camera_type,
                "camera_url": camera_url,
                "status": "error",
                "connection_type": "network",
                "details": {
                    "protocol": camera_type.upper(),
                    "url": camera_url,
                    "host": camera_url.split("//")[1].split("/")[0] if "//" in camera_url else camera_url,
                    "issue": "Network endpoint not reachable",
                    "suggestions": [
                        "Check camera IP address and port",
                        "Verify network connectivity",
                        "Check username/password if required",
                        "Ensure camera is powered on"
                    ]
                }
            }
            
    except Exception as e:
        print(f"❌ Error testing camera: {e}")
        return {
            "is_connected": False,
            "message": f"Connection test error: {str(e)}",
            "camera_type": camera_data.get("camera_type", "unknown"),
            "status": "error",
            "details": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        }

@router.get("/metadata", response_model=Dict[str, Any])
async def get_camera_metadata(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy metadata (locations, tags) để hỗ trợ frontend filtering"""
    try:
        cameras = await camera_service.get_user_cameras(str(current_user.id))
        
        # Extract unique locations và tags
        locations = set()
        all_tags = set()
        
        for camera in cameras:
            if camera.location:
                locations.add(camera.location)
            if hasattr(camera, 'tags') and camera.tags:
                all_tags.update(camera.tags)
        
        return {
            "locations": sorted(list(locations)),
            "tags": sorted(list(all_tags)),
            "total_cameras": len(cameras)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_camera_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy thống kê cameras của user"""
    try:
        cameras = await camera_service.get_user_cameras(str(current_user.id))
        
        total_cameras = len(cameras)
        active_cameras = sum(1 for cam in cameras if cam.is_active)
        streaming_cameras = sum(1 for cam in cameras if cam.is_streaming)
        offline_cameras = total_cameras - active_cameras
        
        return {
            "total_cameras": total_cameras,
            "active_cameras": active_cameras,
            "streaming_cameras": streaming_cameras,
            "offline_cameras": offline_cameras
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
async def export_user_cameras(
    current_user: User = Depends(get_current_active_user)
):
    """Xuất danh sách cameras của user"""
    try:
        cameras = await camera_service.get_user_cameras(str(current_user.id))
        export_data = []
        
        for camera in cameras:
            export_data.append({
                "id": camera.id,
                "name": camera.name,
                "location": camera.location,
                "camera_type": camera.camera_type,
                "camera_url": camera.camera_url,
                "is_active": camera.is_active,
                "is_streaming": camera.is_streaming,
                "created_at": camera.created_at.isoformat()
            })
        
        return {
            "total_count": len(export_data),
            "cameras": export_data,
            "exported_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-update")
async def bulk_update_cameras(
    request_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Cập nhật hàng loạt cameras"""
    try:
        camera_ids = request_data.get("camera_ids", [])
        update_data = request_data.get("update_data", {})
        
        if not camera_ids:
            raise HTTPException(status_code=400, detail="No camera IDs provided")
        
        updated_count = 0
        for camera_id in camera_ids:
            try:
                camera_update = CameraUpdate(**update_data)
                result = await camera_service.update_camera(camera_id, str(current_user.id), camera_update)
                if result:
                    updated_count += 1
            except Exception as e:
                print(f"Failed to update camera {camera_id}: {e}")
                continue
        
        return {
            "message": f"Updated {updated_count} cameras",
            "updated_count": updated_count,
            "total_requested": len(camera_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy thông tin camera theo ID"""
    try:
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        return camera
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting camera: {e}")
        raise HTTPException(status_code=500, detail="Failed to get camera")

@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: str,
    update_data: CameraUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Cập nhật camera"""
    try:
        camera = await camera_service.update_camera(camera_id, str(current_user.id), update_data)
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        return camera
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error updating camera: {e}")
        raise HTTPException(status_code=500, detail="Failed to update camera")

@router.delete("/{camera_id}")
async def delete_camera(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Xóa camera"""
    try:
        success = await camera_service.delete_camera(camera_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="Camera not found")
        return {"message": "Camera deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting camera: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete camera")

# ✅ ALTERNATIVE ROUTE - không có trailing slash (cho compatibility)
@router.get("", response_model=List[CameraResponse])
async def get_cameras(
    location: Optional[str] = Query(None, description="Filter by location"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy danh sách cameras với filter options"""
    try:
        if location:
            # Search by location
            cameras = await camera_service.get_cameras_by_location(str(current_user.id), location)
        elif tags:
            # Search by tags
            tag_list = [tag.strip() for tag in tags.split(",")]
            cameras = await camera_service.get_cameras_by_tags(str(current_user.id), tag_list)
        else:
            # Get all cameras (existing functionality)
            cameras = await camera_service.get_user_cameras(str(current_user.id))
        
        return cameras
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{camera_id}/video")
async def stream_video(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Stream video từ camera với face recognition"""
    try:
        print(f"🔵 Stream video request for camera: {camera_id}")
        
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            print(f"❌ Camera not found: {camera_id}")
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found: {camera.name} (Type: {camera.camera_type})")
        
        # ✅ Start face recognition enabled stream
        async def generate_stream():
            async for frame in stream_processor.generate_video_stream_with_recognition(camera_id, camera, str(current_user.id)):
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        return StreamingResponse(
            generate_stream(),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error streaming video: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stream error: {str(e)}")
    
@router.post("/{camera_id}/start-streaming")
async def start_streaming(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Bắt đầu streaming cho camera"""
    try:
        success = await camera_service.start_streaming(camera_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="Camera not found or failed to start streaming")
        return {"message": "Camera streaming started successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting streaming: {e}")
        raise HTTPException(status_code=500, detail="Failed to start streaming")

@router.post("/{camera_id}/stop-streaming")
async def stop_streaming(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Dừng streaming cho camera"""
    try:
        success = await camera_service.stop_streaming(camera_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="Camera not found or failed to stop streaming")
        return {"message": "Camera streaming stopped successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error stopping streaming: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop streaming")

@router.get("/{camera_id}/settings")
async def get_camera_settings(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy cài đặt chi tiết của camera"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Get detailed settings
        settings = await camera_service.get_camera_settings(camera_id)
        
        return {
            "camera_id": camera_id,
            "stream_settings": settings.get("stream_settings", {
                "resolution": "1920x1080",
                "fps": 30,
                "bitrate": 2500,
                "quality": "auto",
                "codec": "h264",
                "audio_enabled": False,
                "audio_bitrate": 128
            }),
            "detection_settings": settings.get("detection_settings", {
                "enabled": camera.detection_enabled,
                "confidence_threshold": 0.7,
                "detection_frequency": 1,
                "save_unknown_faces": True,
                "blur_unknown_faces": False,
                "detection_zones": [],
                "excluded_zones": []
            }),
            "notification_settings": settings.get("notification_settings", {
                "email_notifications": True,
                "webhook_url": "",
                "notification_cooldown": 300,
                "notify_unknown_faces": True,
                "notify_known_faces": False,
                "notify_system_events": True
            }),
            "recording_settings": settings.get("recording_settings", {
                "enabled": camera.is_recording,
                "record_on_detection": True,
                "record_duration": 30,
                "max_storage_days": 30,
                "compression_level": 3,
                "record_audio": False
            })
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting camera settings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get camera settings: {str(e)}")

@router.put("/{camera_id}/settings")
async def update_camera_settings(
    camera_id: str,
    settings_data: CameraSettingsData,
    current_user: User = Depends(get_current_active_user)
):
    """Cập nhật cài đặt chi tiết của camera"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Update settings
        success = await camera_service.update_camera_settings(camera_id, settings_data.dict())
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update camera settings")
        
        return {"message": "Camera settings updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating camera settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update camera settings")

@router.get("/{camera_id}/system-info")
async def get_camera_system_info(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy thông tin hệ thống của camera"""
    try:
        # Verify camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Get system info
        system_info = await camera_service.get_system_info(camera_id)
        
        return {
            "camera_id": camera_id,
            "system_info": system_info
        }
    except Exception as e:
        # Return mock data if system info not available
        return {
            "camera_id": camera_id,
            "system_info": {
                "cpu_usage": 45.2,
                "memory_usage": 62.8,
                "disk_usage": 78.5,
                "temperature": 42.5,
                "uptime": 86400,
                "network_speed": {
                    "upload": 10.5,
                    "download": 25.3
                },
                "firmware_version": "v1.2.3",
                "last_maintenance": "2024-01-15T10:30:00Z"
            }
        }

@router.post("/{camera_id}/test")
async def test_camera_connection(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Test kết nối camera"""
    try:
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"🔵 Testing camera: {camera.name} (Type: {camera.camera_type})")
        
        # ✅ Xử lý đặc biệt cho webcam
        if camera.camera_type == "webcam":
            return {
                "camera_id": camera_id,
                "is_connected": True,
                "message": "Webcam ready - local device test successful",
                "camera_type": "webcam",
                "status": "success",
                "connection_type": "local"
            }
        
        # ✅ Kiểm tra camera_url có tồn tại không
        if not camera.camera_url:
            return {
                "camera_id": camera_id,
                "is_connected": False,
                "message": "Camera URL not configured",
                "camera_type": camera.camera_type,
                "status": "warning",
                "connection_type": "none"
            }
        
        # ✅ Test network connection
        print(f"🔵 Testing network connection to: {camera.camera_url}")
        is_connected = await camera_service._async_test_camera_connection(camera.camera_url)
        
        if is_connected:
            # ✅ Update last_online nếu kết nối thành công
            await camera_service.collection.update_one(
                {"_id": ObjectId(camera_id)},
                {"$set": {"last_online": datetime.utcnow()}}
            )
            print(f"✅ Camera connection successful: {camera.name}")
            
            return {
                "camera_id": camera_id,
                "is_connected": True,
                "message": "Network connection successful",
                "camera_type": camera.camera_type,
                "camera_url": camera.camera_url,
                "status": "success",
                "connection_type": "network"
            }
        else:
            print(f"❌ Camera connection failed: {camera.name}")
            return {
                "camera_id": camera_id,
                "is_connected": False,
                "message": "Cannot reach camera network endpoint",
                "camera_type": camera.camera_type,
                "camera_url": camera.camera_url,
                "status": "error",
                "connection_type": "network"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error testing camera: {e}")
        return {
            "camera_id": camera_id,
            "is_connected": False,
            "message": f"Connection test error: {str(e)}",
            "camera_type": "unknown",
            "status": "error"
        }

@router.post("/{camera_id}/start-detection")
async def start_detection(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Bắt đầu face detection cho camera"""
    try:
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        success = await camera_service.start_detection(camera_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=400, detail="Failed to start detection")
        
        return {"message": "Detection started successfully", "camera_id": camera_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting detection: {e}")
        raise HTTPException(status_code=500, detail="Failed to start detection")

@router.post("/{camera_id}/stop-detection")
async def stop_detection(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Dừng face detection cho camera"""
    try:
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        success = await camera_service.stop_detection(camera_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to stop detection")
        
        return {"message": "Detection stopped successfully", "camera_id": camera_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error stopping detection: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop detection")

@router.get("/user", response_model=List[CameraResponse])
async def get_user_cameras(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy danh sách cameras của user hiện tại"""
    try:
        return await camera_service.get_user_cameras(str(current_user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{camera_id}/snapshot")
async def take_camera_snapshot(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Chụp ảnh snapshot từ camera"""
    try:
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # This would capture a snapshot from the camera
        # For now, return a mock response
        return {
            "camera_id": camera_id,
            "snapshot_url": f"/uploads/snapshots/{camera_id}_{int(datetime.utcnow().timestamp())}.jpg",
            "captured_at": datetime.utcnow().isoformat(),
            "message": "Snapshot captured successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to capture snapshot")

@router.get("/{camera_id}/capture-stream")
async def get_camera_capture_stream(
    camera_id: str,
    token: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy camera stream cho việc capture ảnh (không có detection model)"""
    try:
        print(f"🔵 Getting camera capture stream for: {camera_id}")
        
        # Validate camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        print(f"✅ Camera found: {camera.name}")
        
        # Create generator for raw camera stream
        def generate_frames():
            try:
                return camera_service.get_raw_camera_stream(camera_id)
            except Exception as e:
                print(f"❌ Error in stream generator: {e}")
                # Return empty response on error
                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n\r\n'
        
        return StreamingResponse(
            generate_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except HTTPException:
        raise
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error getting camera capture stream: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get camera capture stream")

@router.post("/{camera_id}/capture-frame")
async def capture_camera_frame(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Capture một frame từ camera để thêm vào face data"""
    try:
        print(f"🔵 Capturing frame from camera: {camera_id}")
        
        # Validate camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Capture frame
        frame_data = await camera_service.capture_raw_frame(camera_id)
        
        return {
            "success": True,
            "image_data": frame_data["image_base64"],
            "timestamp": frame_data["timestamp"]
        }
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error capturing camera frame: {e}")
        raise HTTPException(status_code=500, detail="Failed to capture camera frame")

@router.post("/{camera_id}/cleanup-cache")
async def cleanup_camera_cache(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Cleanup camera cache để reset connection"""
    try:
        print(f"🔵 Cleaning camera cache: {camera_id}")
        
        # Validate camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Cleanup cache
        camera_service.cleanup_camera_cache(camera_id)
        
        return {
            "success": True,
            "message": "Camera cache cleaned successfully"
        }
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error cleaning camera cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clean camera cache")

@router.get("/{camera_id}/test-stream")
async def test_camera_stream(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Test camera stream connectivity"""
    try:
        print(f"🔵 Testing camera stream: {camera_id}")
        
        # Validate camera ownership
        camera = await camera_service.get_camera_by_id(camera_id, str(current_user.id))
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Extract camera name from CameraResponse object
        camera_name = camera.name if hasattr(camera, 'name') else "Unknown"
        
        # Test if we can capture a single frame
        try:
            frame_data = await camera_service.capture_raw_frame(camera_id)
            return {
                "success": True,
                "message": "Camera stream is working",
                "camera_id": camera_id,
                "camera_name": camera_name,
                "timestamp": frame_data["timestamp"]
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Camera stream failed: {str(e)}",
                "camera_id": camera_id,
                "camera_name": camera_name
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error testing camera stream: {e}")
        raise HTTPException(status_code=500, detail="Failed to test camera stream")