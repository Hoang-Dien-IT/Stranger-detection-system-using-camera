from typing import List, Optional, Dict, Any
from bson import ObjectId
from ..database import get_database
from ..models.camera import Camera, CameraCreate, CameraUpdate, CameraResponse, CameraStreamInfo
import cv2
import asyncio
from datetime import datetime
from ..utils.timezone_utils import vietnam_now
import socket
import urllib.parse
import re

class CameraService:
    def __init__(self):
        self.active_streams: Dict[str, CameraStreamInfo] = {}
    
    @property
    def db(self):
        return get_database()
    
    @property
    def collection(self):
        return self.db.cameras

    async def create_camera(self, user_id: str, camera_data: CameraCreate) -> CameraResponse:
        """Tạo camera mới"""
        try:
            # Chỉ test connection nếu không phải webcam và có URL
            if camera_data.camera_type != "webcam" and camera_data.camera_url:
                # Sử dụng async test connection
                is_connected = await self._async_test_camera_connection(camera_data.camera_url)
                if not is_connected:
                    # Warning thay vì raise error để cho phép tạo camera offline
                    print(f"Warning: Cannot connect to camera {camera_data.camera_url}, creating anyway")
            
            # Convert Pydantic models to dict để MongoDB có thể serialize
            stream_settings = {}
            if camera_data.stream_settings:
                stream_settings = camera_data.stream_settings.model_dump()
            else:
                stream_settings = {
                    "resolution": "1920x1080",
                    "fps": 30,
                    "quality": "medium",
                    "buffer_size": 10
                }
            
            alert_settings = {}
            if camera_data.alert_settings:
                alert_settings = camera_data.alert_settings.model_dump()
            else:
                alert_settings = {
                    "email_alerts": True,
                    "web_notifications": True,
                    "alert_threshold": 0.7
                }
            
            # Create camera document
            camera_dict = {
                "user_id": ObjectId(user_id),
                "name": camera_data.name,
                "description": camera_data.description,
                "location": camera_data.location,  # Thêm dòng này
                "camera_type": camera_data.camera_type,
                "camera_url": camera_data.camera_url,
                "username": camera_data.username,
                "password": camera_data.password,
                "is_active": True,
                "is_streaming": False,
                "is_recording": False,
                "detection_enabled": camera_data.detection_enabled if camera_data.detection_enabled is not None else True,
                "stream_settings": stream_settings,
                "alert_settings": alert_settings,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_online": None,
                "tags": camera_data.tags or []  # Thêm dòng này
            }
            
            result = await self.collection.insert_one(camera_dict)
            
            return CameraResponse(
                id=str(result.inserted_id),
                name=camera_dict["name"],
                description=camera_dict["description"],
                location=camera_dict["location"],  # Thêm dòng này
                camera_type=camera_dict["camera_type"],
                camera_url=camera_dict["camera_url"],
                is_active=camera_dict["is_active"],
                is_streaming=camera_dict["is_streaming"],
                is_recording=camera_dict["is_recording"],
                detection_enabled=camera_dict["detection_enabled"],
                stream_settings=camera_dict["stream_settings"],
                alert_settings=camera_dict["alert_settings"],
                created_at=camera_dict["created_at"],
                last_online=camera_dict.get("last_online"),
                tags=camera_dict["tags"]  # Thêm dòng này
            )
        except Exception as e:
            raise ValueError(f"Failed to create camera: {str(e)}")

    async def _async_test_camera_connection(self, camera_url: str) -> bool:
        """Test camera connection async với OpenCV"""
        try:
            if not camera_url:
                return False
            
            print(f"🔵 Testing camera connection: {camera_url}")
            
            # Chạy test OpenCV trong thread pool để tránh blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._test_opencv_connection, camera_url)
            
            if result:
                print(f"✅ Camera connection successful: {camera_url}")
            else:
                print(f"❌ Camera connection failed: {camera_url}")
            
            return result
            
        except Exception as e:
            print(f"❌ Connection test error: {e}")
            return False

    def _test_opencv_connection(self, camera_url: str) -> bool:
        """Test camera connection using OpenCV"""
        cap = None
        try:
            # Khởi tạo VideoCapture
            cap = cv2.VideoCapture(camera_url)
            
            if not cap.isOpened():
                return False
            
            # Thiết lập timeout cho IP camera
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)  # 5 giây timeout
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000)  # 3 giây read timeout
            
            # Thử đọc một frame
            ret, frame = cap.read()
            
            if ret and frame is not None:
                print(f"✅ Successfully read frame from camera, size: {frame.shape}")
                return True
            else:
                print(f"❌ Cannot read frame from camera")
                return False
                
        except Exception as e:
            print(f"❌ OpenCV connection error: {e}")
            return False
        finally:
            if cap:
                cap.release()

    def _test_socket_connection(self, host: str, port: int) -> bool:
        """Test socket connection to host:port (backup method)"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)  # 5 second timeout
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False

    async def _test_camera_connection(self, camera_url: str) -> bool:
        """Test camera connection (legacy method for compatibility)"""
        return await self._async_test_camera_connection(camera_url)

    async def get_user_cameras(self, user_id: str) -> List[CameraResponse]:
        """Lấy danh sách camera của user"""
        cameras = []
        async for camera_data in self.collection.find({"user_id": ObjectId(user_id)}).sort("created_at", -1):
            cameras.append(CameraResponse(
                id=str(camera_data["_id"]),
                name=camera_data["name"],
                description=camera_data.get("description"),
                location=camera_data.get("location"),  # Thêm dòng này
                camera_type=camera_data["camera_type"],
                camera_url=camera_data.get("camera_url"),
                is_active=camera_data["is_active"],
                is_streaming=camera_data.get("is_streaming", False),
                is_recording=camera_data.get("is_recording", False),
                detection_enabled=camera_data.get("detection_enabled", True),
                stream_settings=camera_data.get("stream_settings", {}),
                alert_settings=camera_data.get("alert_settings", {}),
                created_at=camera_data["created_at"],
                last_online=camera_data.get("last_online"),
                tags=camera_data.get("tags", [])  # Thêm dòng này
            ))
        return cameras

    async def get_camera_by_id(self, camera_id: str, user_id: str) -> Optional[CameraResponse]:
        """Lấy camera theo ID"""
        try:
            camera_data = await self.collection.find_one({
                "_id": ObjectId(camera_id),
                "user_id": ObjectId(user_id)
            })
            
            if camera_data:
                return CameraResponse(
                    id=str(camera_data["_id"]),
                    name=camera_data["name"],
                    description=camera_data.get("description"),
                    location=camera_data.get("location"),  # Thêm dòng này
                    camera_type=camera_data["camera_type"],
                    camera_url=camera_data.get("camera_url"),
                    is_active=camera_data["is_active"],
                    is_streaming=camera_data.get("is_streaming", False),
                    is_recording=camera_data.get("is_recording", False),
                    detection_enabled=camera_data.get("detection_enabled", True),
                    stream_settings=camera_data.get("stream_settings", {}),
                    alert_settings=camera_data.get("alert_settings", {}),
                    created_at=camera_data["created_at"],
                    last_online=camera_data.get("last_online"),
                    tags=camera_data.get("tags", [])  # Thêm dòng này
                )
        except Exception as e:
            print(f"Error getting camera: {e}")
        return None

    async def get_cameras_by_location(self, user_id: str, location: str) -> List[CameraResponse]:
        """Lấy camera theo location"""
        cameras = []
        async for camera_data in self.collection.find({
            "user_id": ObjectId(user_id),
            "location": {"$regex": location, "$options": "i"}  # Case insensitive search
        }).sort("created_at", -1):
            cameras.append(CameraResponse(
                id=str(camera_data["_id"]),
                name=camera_data["name"],
                description=camera_data.get("description"),
                location=camera_data.get("location"),
                camera_type=camera_data["camera_type"],
                camera_url=camera_data.get("camera_url"),
                is_active=camera_data["is_active"],
                is_streaming=camera_data.get("is_streaming", False),
                is_recording=camera_data.get("is_recording", False),
                detection_enabled=camera_data.get("detection_enabled", True),
                stream_settings=camera_data.get("stream_settings", {}),
                alert_settings=camera_data.get("alert_settings", {}),
                created_at=camera_data["created_at"],
                last_online=camera_data.get("last_online"),
                tags=camera_data.get("tags", [])
            ))
        return cameras

    async def get_cameras_by_tags(self, user_id: str, tags: List[str]) -> List[CameraResponse]:
        """Lấy camera theo tags"""
        cameras = []
        async for camera_data in self.collection.find({
            "user_id": ObjectId(user_id),
            "tags": {"$in": tags}  # Any of the provided tags
        }).sort("created_at", -1):
            cameras.append(CameraResponse(
                id=str(camera_data["_id"]),
                name=camera_data["name"],
                description=camera_data.get("description"),
                location=camera_data.get("location"),
                camera_type=camera_data["camera_type"],
                camera_url=camera_data.get("camera_url"),
                is_active=camera_data["is_active"],
                is_streaming=camera_data.get("is_streaming", False),
                is_recording=camera_data.get("is_recording", False),
                detection_enabled=camera_data.get("detection_enabled", True),
                stream_settings=camera_data.get("stream_settings", {}),
                alert_settings=camera_data.get("alert_settings", {}),
                created_at=camera_data["created_at"],
                last_online=camera_data.get("last_online"),
                tags=camera_data.get("tags", [])
            ))
        return cameras
    
    async def update_camera(self, camera_id: str, user_id: str, update_data: CameraUpdate) -> Optional[CameraResponse]:
        """Cập nhật camera"""
        try:
            # Convert Pydantic model to dict và loại bỏ None values
            update_dict = {}
            for key, value in update_data.model_dump().items():
                if value is not None:
                    # Convert nested Pydantic models to dict
                    if key == "stream_settings" and value is not None:
                        update_dict[key] = value if isinstance(value, dict) else value.model_dump()
                    elif key == "alert_settings" and value is not None:
                        update_dict[key] = value if isinstance(value, dict) else value.model_dump()
                    else:
                        update_dict[key] = value
            
            if not update_dict:
                return await self.get_camera_by_id(camera_id, user_id)
            
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(camera_id), "user_id": ObjectId(user_id)},
                {"$set": update_dict},
                return_document=True
            )
            
            if result:
                return CameraResponse(
                    id=str(result["_id"]),
                    name=result["name"],
                    description=result.get("description"),
                    location=result.get("location"),  # Thêm dòng này
                    camera_type=result["camera_type"],
                    camera_url=result.get("camera_url"),
                    is_active=result["is_active"],
                    is_streaming=result.get("is_streaming", False),
                    is_recording=result.get("is_recording", False),
                    detection_enabled=result.get("detection_enabled", True),
                    stream_settings=result.get("stream_settings", {}),
                    alert_settings=result.get("alert_settings", {}),
                    created_at=result["created_at"],
                    last_online=result.get("last_online"),
                    tags=result.get("tags", [])  # Thêm dòng này
                )
        except Exception as e:
            print(f"Error updating camera: {e}")
        return None

    async def delete_camera(self, camera_id: str, user_id: str) -> bool:
        """Xóa camera"""
        try:
            result = await self.collection.delete_one({
                "_id": ObjectId(camera_id),
                "user_id": ObjectId(user_id)
            })
            return result.deleted_count > 0
        except Exception:
            return False
        
    async def start_detection(self, camera_id: str, user_id: str) -> bool:
        """Bắt đầu detection cho camera"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(camera_id), "user_id": ObjectId(user_id)},
                {"$set": {"detection_enabled": True, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def stop_detection(self, camera_id: str) -> bool:
        """Dừng detection cho camera"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(camera_id)},
                {"$set": {"detection_enabled": False, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def test_camera_detailed(self, camera_id: str, user_id: str) -> Dict:
        """Test camera connection với thông tin chi tiết"""
        camera = await self.get_camera_by_id(camera_id, user_id)
        if not camera:
            return {"error": "Camera not found"}
        
        if camera.camera_type == "webcam":
            return {
                "status": "success",
                "message": "Webcam camera - no network test needed",
                "connection_type": "local"
            }
        
        if not camera.camera_url:
            return {
                "status": "warning",
                "message": "No camera URL configured",
                "connection_type": "none"
            }
        
        # Test network connection
        is_connected = await self._async_test_camera_connection(camera.camera_url)
        
        if is_connected:
            # Update last_online
            await self.collection.update_one(
                {"_id": ObjectId(camera_id)},
                {"$set": {"last_online": datetime.utcnow()}}
            )
            
            return {
                "status": "success",
                "message": "Camera network connection successful",
                "connection_type": "network",
                "url": camera.camera_url
            }
        else:
            return {
                "status": "error", 
                "message": "Cannot connect to camera network endpoint",
                "connection_type": "network",
                "url": camera.camera_url
            }

    async def get_camera_settings(self, camera_id: str) -> Dict[str, Any]:
        """Lấy cài đặt chi tiết của camera"""
        try:
            camera_data = await self.collection.find_one({"_id": ObjectId(camera_id)})
            if not camera_data:
                return {}
            
            return {
                "stream_settings": camera_data.get("stream_settings", {}),
                "detection_settings": camera_data.get("detection_settings", {}),
                "notification_settings": camera_data.get("notification_settings", {}),
                "recording_settings": camera_data.get("recording_settings", {})
            }
        except Exception as e:
            print(f"Error getting camera settings: {e}")
            return {}

    async def update_camera_settings(self, camera_id: str, settings_data: Dict[str, Any]) -> bool:
        """Cập nhật cài đặt chi tiết của camera"""
        try:
            update_dict = {
                "updated_at": datetime.utcnow()
            }
            
            # Merge settings data
            if "stream_settings" in settings_data:
                update_dict["stream_settings"] = settings_data["stream_settings"]
            if "detection_settings" in settings_data:
                update_dict["detection_settings"] = settings_data["detection_settings"]
                # Update detection_enabled if provided
                if "enabled" in settings_data["detection_settings"]:
                    update_dict["detection_enabled"] = settings_data["detection_settings"]["enabled"]
            if "notification_settings" in settings_data:
                update_dict["notification_settings"] = settings_data["notification_settings"]
            if "recording_settings" in settings_data:
                update_dict["recording_settings"] = settings_data["recording_settings"]
                # Update is_recording if provided
                if "enabled" in settings_data["recording_settings"]:
                    update_dict["is_recording"] = settings_data["recording_settings"]["enabled"]
            
            result = await self.collection.update_one(
                {"_id": ObjectId(camera_id)},
                {"$set": update_dict}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating camera settings: {e}")
            return False

    async def get_system_info(self, camera_id: str) -> Dict[str, Any]:
        """Lấy thông tin hệ thống của camera"""
        try:
            # This would typically connect to the camera's management interface
            # For now, return mock data
            import psutil
            import time
            
            # Get system stats (this would be camera-specific in real implementation)
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu_usage": cpu_percent,
                "memory_usage": memory.percent,
                "disk_usage": disk.percent,
                "temperature": 45.0,  # Mock temperature
                "uptime": int(time.time() - psutil.boot_time()),
                "network_speed": {
                    "upload": 10.5,
                    "download": 25.3
                },
                "firmware_version": "v1.2.3",
                "last_maintenance": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
            # Return default mock data
            return {
                "cpu_usage": 0.0,
                "memory_usage": 0.0,
                "disk_usage": 0.0,
                "temperature": None,
                "uptime": 0,
                "network_speed": {"upload": 0.0, "download": 0.0},
                "firmware_version": "unknown",
                "last_maintenance": None
            }


    async def start_streaming(self, camera_id: str, user_id: str) -> bool:
        """Bắt đầu streaming cho camera"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(camera_id), "user_id": ObjectId(user_id)},
                {"$set": {"is_streaming": True, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def stop_streaming(self, camera_id: str, user_id: str) -> bool:
        """Dừng streaming cho camera"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(camera_id), "user_id": ObjectId(user_id)},
                {"$set": {"is_streaming": False, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception:
            return False

    def get_raw_camera_stream(self, camera_id: str):
        """Generator cho raw camera stream (không có detection model)"""
        import cv2
        import base64
        import time
        
        cap = None
        try:
            # Get camera info - using sync database access
            from motor.motor_asyncio import AsyncIOMotorClient
            import pymongo
            from ..config import get_settings
            
            # Use sync connection for streaming
            settings = get_settings()
            client = pymongo.MongoClient(settings.mongodb_url)
            db = client[settings.database_name]
            collection = db.cameras
            
            camera_doc = collection.find_one({"_id": ObjectId(camera_id)})
            if not camera_doc:
                print(f"Camera {camera_id} not found")
                return
            
            print(f"🔵 Starting camera stream for: {camera_doc.get('name', camera_id)}")
            print(f"🔵 Camera type: {camera_doc.get('camera_type')}")
            
            # Initialize camera
            if camera_doc.get("camera_type") == "webcam":
                print("🔵 Initializing webcam (index 0)")
                cap = cv2.VideoCapture(0)
            else:
                camera_url = camera_doc.get("camera_url", "")
                print(f"🔵 Connecting to camera URL: {camera_url}")
                cap = cv2.VideoCapture(camera_url)
            
            if not cap.isOpened():
                print(f"❌ Cannot open camera {camera_id}")
                # Try with different backends for webcam
                if camera_doc.get("camera_type") == "webcam":
                    print("🔄 Trying with DirectShow backend...")
                    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                    if not cap.isOpened():
                        print("❌ Failed to open webcam with DirectShow")
                        return
                else:
                    return
            
            # Set resolution if specified
            stream_settings = camera_doc.get("stream_settings", {})
            if "resolution" in stream_settings:
                resolution = stream_settings["resolution"]
                if "x" in resolution:
                    try:
                        width, height = map(int, resolution.split("x"))
                        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                        print(f"🔵 Set resolution to {width}x{height}")
                    except ValueError:
                        print(f"⚠️ Invalid resolution format: {resolution}")
            
            # Set FPS
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            print(f"✅ Camera stream started successfully")
            frame_count = 0
            error_count = 0
            max_errors = 10
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    error_count += 1
                    print(f"❌ Failed to read frame {frame_count}, error count: {error_count}")
                    if error_count >= max_errors:
                        print(f"❌ Too many errors, stopping stream")
                        break
                    time.sleep(0.1)  # Wait a bit before retrying
                    continue
                
                error_count = 0  # Reset error count on successful read
                frame_count += 1
                
                if frame_count % 60 == 0:  # Log every 60 frames (2 seconds at 30fps)
                    print(f"🔵 Streaming frame {frame_count}")
                
                # Resize frame if too large
                height, width = frame.shape[:2]
                if width > 1280:
                    scale = 1280 / width
                    new_width = 1280
                    new_height = int(height * scale)
                    frame = cv2.resize(frame, (new_width, new_height))
                
                # Encode frame to JPEG with good quality
                ret_encode, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if not ret_encode:
                    print(f"❌ Failed to encode frame {frame_count}")
                    continue
                    
                frame_bytes = buffer.tobytes()
                
                # Create multipart response
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                # Control frame rate
                time.sleep(1/30)  # ~30 FPS
                
        except Exception as e:
            print(f"❌ Error in raw camera stream: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if cap:
                cap.release()
                print(f"🔵 Camera stream stopped for {camera_id}")

    async def capture_raw_frame(self, camera_id: str) -> Dict[str, Any]:
        """Capture một frame từ camera và trả về base64 - optimized version"""
        import cv2
        import base64
        
        # Use cached camera connection if available
        if hasattr(self, '_camera_cache') and camera_id in self._camera_cache:
            cap = self._camera_cache[camera_id]
        else:
            # Initialize new camera connection
            cap = None
            try:
                # Get camera info
                camera_doc = await self.collection.find_one({"_id": ObjectId(camera_id)})
                if not camera_doc:
                    raise ValueError("Camera not found")
                
                # Initialize camera
                if camera_doc.get("camera_type") == "webcam":
                    cap = cv2.VideoCapture(0)
                else:
                    cap = cv2.VideoCapture(camera_doc.get("camera_url", ""))
                
                if not cap.isOpened():
                    raise ValueError("Cannot open camera")
                
                # Set optimal properties for fast capture
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer for faster capture
                cap.set(cv2.CAP_PROP_FPS, 30)  # Set high FPS
                
                # Set resolution if specified
                stream_settings = camera_doc.get("stream_settings", {})
                if "resolution" in stream_settings:
                    resolution = stream_settings["resolution"]
                    if "x" in resolution:
                        width, height = map(int, resolution.split("x"))
                        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                
                # Cache the connection
                if not hasattr(self, '_camera_cache'):
                    self._camera_cache = {}
                self._camera_cache[camera_id] = cap
                
            except Exception as e:
                if cap:
                    cap.release()
                raise e
        
        try:
            # Capture frame with timeout
            ret, frame = cap.read()
            if not ret:
                # Try to reconnect if frame capture fails
                if hasattr(self, '_camera_cache') and camera_id in self._camera_cache:
                    self._camera_cache[camera_id].release()
                    del self._camera_cache[camera_id]
                raise ValueError("Failed to capture frame - camera may be disconnected")
            
            # Encode to base64 with lower quality for smaller size
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 60]  # Lower quality for smaller size
            _, buffer = cv2.imencode('.jpg', frame, encode_param)
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                "image_base64": image_base64,
                "timestamp": datetime.utcnow().isoformat(),
                "camera_id": camera_id
            }
            
        except Exception as e:
            print(f"Error capturing frame: {e}")
            # Clear cache on error
            if hasattr(self, '_camera_cache') and camera_id in self._camera_cache:
                self._camera_cache[camera_id].release()
                del self._camera_cache[camera_id]
            raise e

    def cleanup_camera_cache(self, camera_id: str = None):
        """Cleanup camera cache connections"""
        if hasattr(self, '_camera_cache'):
            if camera_id:
                # Clean specific camera
                if camera_id in self._camera_cache:
                    self._camera_cache[camera_id].release()
                    del self._camera_cache[camera_id]
                    print(f"🔵 Cleaned camera cache for {camera_id}")
            else:
                # Clean all cameras
                for cam_id, cap in self._camera_cache.items():
                    cap.release()
                self._camera_cache.clear()
                print("🔵 Cleaned all camera cache")

# Global instance
camera_service = CameraService()