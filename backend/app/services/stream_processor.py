import cv2
import asyncio
import numpy as np
import json
from typing import Dict, Any, Optional, AsyncGenerator
from ..models.camera import CameraResponse
from ..services.face_processor import face_processor
from ..services.websocket_manager import websocket_manager
from ..services.detection_tracker import detection_tracker
from ..services.detection_optimizer_service import DetectionOptimizerService
from ..services.notification_service import notification_service
from ..utils.timezone_utils import vietnam_now
from datetime import datetime
import concurrent.futures
import time
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os
import asyncio
import numpy as np
from typing import Dict, Any, Optional, AsyncGenerator, List, List
from ..models.camera import CameraResponse
from ..services.face_processor import face_processor
from ..services.websocket_manager import websocket_manager
import concurrent.futures
import time
import base64
from io import BytesIO

class StreamProcessor:
    def __init__(self):
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
        self._frame_times: Dict[str, float] = {}  # Để tracking FPS

    async def get_stream_info(self, camera_id: str) -> Dict[str, Any]:
        """Lấy thông tin stream"""
        if camera_id in self.active_streams:
            stream = self.active_streams[camera_id]
            return {
                "is_streaming": stream.get("is_active", False),
                "status": "online" if stream.get("is_active") else "offline",
                "viewers_count": stream.get("viewers_count", 0),
                "uptime": time.time() - stream.get("start_time", time.time())
            }
        else:
            return {
                "is_streaming": False,
                "status": "offline",
                "viewers_count": 0,
                "uptime": 0
            }

    import threading
    import queue

    def _frame_reader(self, camera_id: str, camera: CameraResponse, frame_queue: 'queue.Queue', stop_event: 'threading.Event'):
        """Luồng đọc frame liên tục cho camera"""
        cap = None
        retry_count = 0
        max_retries = 3
        
        while not stop_event.is_set() and retry_count < max_retries:
            try:
                # Khởi tạo camera capture
                if camera.camera_type == "webcam":
                    cap = cv2.VideoCapture(0)
                elif camera.camera_url:
                    print(f"🔵 Attempting to connect to camera URL: {camera.camera_url}")
                    cap = cv2.VideoCapture(camera.camera_url)
                    # Thiết lập timeout cho IP camera
                    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)  # 5 giây timeout
                    cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000)  # 3 giây read timeout
                else:
                    cap = cv2.VideoCapture(0)
                
                if not cap.isOpened():
                    print(f"❌ Failed to open camera, retry {retry_count + 1}/{max_retries}")
                    retry_count += 1
                    time.sleep(2)  # Chờ 2 giây trước khi retry
                    continue
                
                print(f"✅ Camera connected successfully: {camera.name}")
                self.active_streams[camera_id]["cap"] = cap
                retry_count = 0  # Reset retry count khi kết nối thành công
                
                # Đọc frame liên tục
                consecutive_failures = 0
                max_consecutive_failures = 10
                
                while not stop_event.is_set():
                    ret, frame = cap.read()
                    if not ret:
                        consecutive_failures += 1
                        print(f"⚠️ Failed to read frame, consecutive failures: {consecutive_failures}")
                        
                        if consecutive_failures >= max_consecutive_failures:
                            print(f"❌ Too many consecutive failures, reconnecting...")
                            break  # Thoát vòng lặp để reconnect
                        
                        # Tạo dummy frame khi không đọc được
                        dummy_frame = self._create_dummy_frame(f"Camera {camera.name} - Connection Issue")
                        if not frame_queue.empty():
                            try:
                                frame_queue.get_nowait()
                            except:
                                pass
                        frame_queue.put(dummy_frame)
                        time.sleep(0.1)
                        continue
                    
                    consecutive_failures = 0  # Reset khi đọc thành công
                    
                    # Giữ queue chỉ 1 frame mới nhất (loại bỏ frame cũ)
                    if not frame_queue.empty():
                        try:
                            frame_queue.get_nowait()
                        except:
                            pass
                    frame_queue.put(frame)
                    
                cap.release()
                cap = None
                
            except Exception as e:
                print(f"❌ Error in frame reader: {e}")
                if cap:
                    cap.release()
                    cap = None
                retry_count += 1
                time.sleep(2)
        
        # Cleanup
        if cap:
            cap.release()
        
        # Đưa dummy frame cuối cùng vào queue
        if not stop_event.is_set():
            dummy_frame = self._create_dummy_frame(f"Camera {camera.name} - No Signal")
            if not frame_queue.empty():
                try:
                    frame_queue.get_nowait()
                except:
                    pass
            frame_queue.put(dummy_frame)
        
        print(f"🔴 Frame reader stopped for camera: {camera.name}")

    async def start_stream(self, camera_id: str, camera: CameraResponse) -> bool:
        """Bắt đầu stream camera (tối ưu đa luồng đọc frame)"""
        try:
            if camera_id in self.active_streams:
                return True  # Already streaming
            detection_tracker.start_cleanup_task()
            import threading
            import queue
            frame_queue = queue.Queue(maxsize=1)
            stop_event = threading.Event()
            reader_thread = threading.Thread(target=self._frame_reader, args=(camera_id, camera, frame_queue, stop_event), daemon=True)
            self.active_streams[camera_id] = {
                "camera": camera,
                "is_active": True,
                "start_time": time.time(),
                "viewers_count": 0,
                "cap": None,
                "frame_queue": frame_queue,
                "stop_event": stop_event,
                "reader_thread": reader_thread
            }
            reader_thread.start()
            print(f"Stream started for camera: {camera.name}")
            return True
        except Exception as e:
            print(f"Error starting stream: {e}")
            return False

    async def stop_stream(self, camera_id: str) -> bool:
        """Dừng stream camera (tối ưu đa luồng)"""
        try:
            if camera_id in self.active_streams:
                stream = self.active_streams[camera_id]
                stream["is_active"] = False
                # Stop frame reader thread
                if stream.get("stop_event"):
                    stream["stop_event"].set()
                if stream.get("reader_thread"):
                    stream["reader_thread"].join(timeout=1)
                # Close camera capture if exists
                if stream.get("cap"):
                    stream["cap"].release()
                del self.active_streams[camera_id]
                if not self.active_streams:
                    await detection_tracker.stop_cleanup_task()
                print(f"Stream stopped for camera: {camera_id}")
                return True
            return False
        except Exception as e:
            print(f"Error stopping stream: {e}")
            return False

    async def generate_video_stream(self, camera_id: str, camera: CameraResponse) -> AsyncGenerator[bytes, None]:
        """Generate video stream frames (tối ưu đa luồng, AI mỗi 5 frame)"""
        try:
            print(f"🔵 Starting video stream generation for camera: {camera.name}")
            
            # Bắt đầu stream
            stream_started = await self.start_stream(camera_id, camera)
            if not stream_started:
                print(f"❌ Failed to start stream for camera: {camera.name}")
                async for frame in self._generate_error_frames(f"Failed to start camera {camera.name}"):
                    yield frame
                return
            
            stream = self.active_streams.get(camera_id)
            if not stream or "frame_queue" not in stream:
                print(f"❌ Stream not found for camera: {camera.name}")
                async for frame in self._generate_error_frames(f"Stream not available for {camera.name}"):
                    yield frame
                return
            
            frame_queue = stream["frame_queue"]
            frame_count = 0
            last_ai_result = None
            no_frame_count = 0
            max_no_frame = 30  # Tối đa 30 lần không có frame trước khi báo lỗi
            
            print(f"✅ Video stream generation ready for camera: {camera.name}")
            
            while True:
                if camera_id not in self.active_streams or not self.active_streams[camera_id]["is_active"]:
                    print(f"🔴 Stream stopped for camera: {camera.name}")
                    break
                
                try:
                    # Thử lấy frame từ queue với timeout
                    frame = frame_queue.get(timeout=2)  # Tăng timeout lên 2 giây
                    no_frame_count = 0  # Reset counter khi có frame
                    
                except Exception as e:
                    no_frame_count += 1
                    print(f"⚠️ No frame from camera {camera.name}, count: {no_frame_count}")
                    
                    if no_frame_count >= max_no_frame:
                        # Quá nhiều lần không có frame, tạo error frame
                        frame = self._create_dummy_frame(f"Camera {camera.name} - Connection Lost")
                    else:
                        # Tạo dummy frame tạm thời
                        frame = self._create_dummy_frame(f"Camera {camera.name} - Connecting...")
                
                frame_count += 1
                
                # Chỉ xử lý AI mỗi 5 frame, các frame còn lại chỉ overlay lại kết quả AI cũ
                if camera.detection_enabled and frame_count % 5 == 0:
                    processed_frame = await self._process_frame(frame.copy(), camera_id, camera)
                    last_ai_result = processed_frame
                elif last_ai_result is not None:
                    processed_frame = last_ai_result.copy()
                    # Cập nhật overlay thời gian, FPS, camera name
                    current_time = time.time()
                    fps = 0
                    if hasattr(self, '_frame_times') and camera_id in self._frame_times:
                        fps = 1.0 / (current_time - self._frame_times[camera_id])
                        self._frame_times[camera_id] = current_time
                    cv2.putText(processed_frame, f"FPS: {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    cv2.putText(processed_frame, f"Camera: {camera.name}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    cv2.putText(processed_frame, timestamp, (10, processed_frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                else:
                    processed_frame = await self._process_frame(frame.copy(), camera_id, camera)
                
                # Encode frame thành JPEG
                _, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_bytes = buffer.tobytes()
                
                # Yield frame
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                await asyncio.sleep(0.001)  # sleep rất nhỏ để tránh block event loop
                
        except Exception as e:
            print(f"❌ Error in video stream generation: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            async for frame in self._generate_error_frames(f"Stream error: {str(e)}"):
                yield frame

    async def _process_frame(self, frame: np.ndarray, camera_id: str, camera: CameraResponse) -> np.ndarray:
        """Process frame (add overlays, detection, etc.) - theo code mẫu"""
        try:
            # Tính FPS giống code mẫu
            current_time = time.time()
            if not hasattr(self, '_frame_times'):
                self._frame_times = {}
            
            if camera_id not in self._frame_times:
                self._frame_times[camera_id] = current_time
                fps = 0
            else:
                fps = 1.0 / (current_time - self._frame_times[camera_id])
                self._frame_times[camera_id] = current_time
            
            # Hiển thị FPS lên góc trên bên trái giống code mẫu
            cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Add camera name
            cv2.putText(frame, f"Camera: {camera.name}", (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Add timestamp
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(frame, timestamp, (10, frame.shape[0] - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Face detection và recognition giống code mẫu
            if camera.detection_enabled:
                cv2.putText(frame, "DETECTION: ON", (frame.shape[1] - 150, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                
                try:
                    # Load known persons for recognition
                    known_persons = await self._get_known_persons_for_camera(camera_id)
                    
                    # Phát hiện và nhận dạng khuôn mặt với detection tracking
                    detections = await face_processor.detect_and_recognize_faces(frame, known_persons)
                    
                    # Sử dụng detection_tracker để quyết định có lưu detection hay không
                    for detection in detections:
                        person_name = detection.get('person_name', 'Unknown')
                        person_id = detection.get('person_id')
                        confidence = detection.get('confidence', 0)
                        
                        # Xác định loại detection
                        detection_type = "known_person" if person_name != "Unknown" else "stranger"
                        
                        # Sử dụng detection_tracker để quyết định có lưu hay không
                        should_save = detection_tracker.track_detection(
                            camera_id=camera_id,
                            person_id=person_id or f"unknown_{int(time.time())}",
                            person_name=person_name,
                            detection_type=detection_type,
                            confidence=confidence
                        )
                        
                        # Đánh dấu nếu cần lưu detection này
                        detection['should_save'] = should_save
                        detection['detection_type'] = detection_type
                    
                    # ===== PHÂN TÍCH KHUNG HÌNH CHO EMAIL NOTIFICATION =====
                    await self._analyze_frame_for_notifications(camera_id, detections, frame)
                
                    # Vẽ các khuôn mặt đã phát hiện và nhận dạng giống code mẫu
                    for detection in detections:
                        # Lấy bounding box
                        x, y, w, h = detection.get('bbox', [0, 0, 0, 0])
                        x1, y1, x2, y2 = x, y, x + w, y + h
                        
                        # Nhận dạng khuôn mặt
                        name = detection.get('person_name', 'Unknown')
                        confidence = detection.get('confidence', 0)
                        
                        # Màu khác nhau cho người đã biết và không xác định giống code mẫu
                        if name == "Unknown":
                            color = (0, 0, 255)  # Đỏ cho người lạ
                        else:
                            color = (0, 255, 0)  # Xanh lá cho người đã biết
                        
                        # Vẽ bounding box
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        
                        # Thêm tên và độ tin cậy giống code mẫu - sử dụng UTF-8 text
                        label = f"{name} ({confidence:.2f})"
                        
                        # Sử dụng function UTF-8 để vẽ tiếng Việt đúng
                        frame = self._draw_utf8_text(frame, label, (x1, y1 - 30), 
                                                   font_scale=0.8, color=color, thickness=2)
                        
                        # Chỉ lưu và gửi alert nếu detection_tracker cho phép
                        if detection.get('should_save'):
                            # Get region of interest (face crop)
                            x, y, w, h = detection.get('bbox', [0, 0, 0, 0])
                            face_frame = frame.copy()
                            # Chạy background task để không block video stream
                            detection_task = asyncio.create_task(
                                self._send_detection_alert(camera_id, detection, face_frame)
                            )
                            detection_task.add_done_callback(lambda t: None if not t.exception() else print(f"❌ Detection alert error: {t.exception()}"))
                    
                    # Add detection count overlay
                    detection_count = len(detections)
                    cv2.putText(frame, f"Faces: {detection_count}", (frame.shape[1] - 150, 60), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                    
                except Exception as detection_error:
                    print(f"Face detection error: {detection_error}")
                    cv2.putText(frame, "DETECTION: ERROR", (frame.shape[1] - 150, 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            else:
                cv2.putText(frame, "DETECTION: OFF", (frame.shape[1] - 150, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            
            return frame
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return frame

    def _create_dummy_frame(self, message: str = "No Camera") -> np.ndarray:
        """Create dummy frame when camera is not available"""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Thêm background màu đen với viền
        cv2.rectangle(frame, (20, 20), (620, 460), (50, 50, 50), -1)
        cv2.rectangle(frame, (20, 20), (620, 460), (255, 255, 255), 2)
        
        # Tiêu đề chính
        cv2.putText(frame, "SafeFace System", (40, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
        
        # Thông điệp lỗi
        lines = message.split(' - ')
        y_start = 120
        for i, line in enumerate(lines):
            cv2.putText(frame, line, (40, y_start + i * 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        # Thời gian hiện tại
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (40, 350), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Hướng dẫn
        cv2.putText(frame, "Checking camera connection...", (40, 390), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1)
        cv2.putText(frame, "Please verify camera URL and settings", (40, 420), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1)
        
        return frame

    async def _generate_dummy_frames(self) -> AsyncGenerator[bytes, None]:
        """Generate dummy frames for testing"""
        while True:
            frame = self._create_dummy_frame("Demo Camera - No Real Camera Connected")
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            await asyncio.sleep(1/30)  # 30 FPS

    async def _generate_error_frames(self, error_message: str) -> AsyncGenerator[bytes, None]:
        """Generate error frames"""
        for _ in range(10):  # Show error for a few frames
            frame = self._create_dummy_frame(f"Error: {error_message}")
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            await asyncio.sleep(1/5)  # 5 FPS for error

    async def capture_snapshot(self, camera_id: str, camera: CameraResponse) -> Optional[bytes]:
        """Chụp ảnh snapshot từ camera"""
        try:
            if camera.camera_type == "webcam":
                cap = cv2.VideoCapture(0)
            elif camera.camera_url:
                cap = cv2.VideoCapture(camera.camera_url)
            else:
                cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                # Return dummy image
                frame = self._create_dummy_frame(f"Snapshot - {camera.name}")
                _, buffer = cv2.imencode('.jpg', frame)
                return buffer.tobytes()
            
            ret, frame = cap.read()
            cap.release()
            
            if ret:
                # Process frame
                frame = await self._process_frame(frame, camera_id, camera)
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                return buffer.tobytes()
            else:
                return None
                
        except Exception as e:
            print(f"Error capturing snapshot: {e}")
            return None

    async def get_stream_status(self, camera_id: str) -> Dict[str, Any]:
        """Lấy trạng thái chi tiết của stream"""
        if camera_id in self.active_streams:
            stream = self.active_streams[camera_id]
            return {
                "is_streaming": stream.get("is_active", False),
                "is_recording": False,  # TODO: Implement recording
                "viewers_count": stream.get("viewers_count", 0),
                "uptime": time.time() - stream.get("start_time", time.time()),
                "frame_rate": 30,  # TODO: Calculate actual FPS
                "resolution": "640x480"  # TODO: Get actual resolution
            }
        else:
            return {
                "is_streaming": False,
                "is_recording": False,
                "viewers_count": 0,
                "uptime": 0,
                "frame_rate": 0,
                "resolution": "Unknown"
            }

    async def _send_detection_alert(self, camera_id: str, detection: Dict[str, Any], frame: np.ndarray = None):
        """Send detection alert via WebSocket and save to database"""
        try:
            # Get camera name
            from ..database import get_database
            from bson import ObjectId
            
            db = get_database()
            camera_data = await db.cameras.find_one({"_id": ObjectId(camera_id)})
            camera_name = camera_data.get("name", "Unknown Camera") if camera_data else "Unknown Camera"
            
            # Save to database using both methods for compatibility
            detection_id = None
            if frame is not None:
                # Use both detection optimizer and normal save for compatibility
                detection_id = await self._save_optimized_detection(camera_id, camera_name, detection, frame)
                if not detection_id:
                    # Fallback to traditional method if optimizer fails
                    detection_id = await self._save_detection_to_database(camera_id, camera_name, detection, frame)
            
            # Create WebSocket message
            alert_message = {
                "type": "detection_alert",
                "data": {
                    "id": detection_id,  # New ID from database
                    "camera_id": camera_id,
                    "camera_name": camera_name,
                    "detection_type": detection.get('detection_type', 'unknown'),
                    "person_id": detection.get('person_id'),
                    "person_name": detection.get('person_name', 'Unknown'),
                    "confidence": detection.get('confidence', 0),
                    "timestamp": time.time(),
                    "bbox": detection.get('bbox')
                }
            }
            
            # Send to all connected clients (you might want to filter by user)
            # Chạy background task để không block video stream
            websocket_task = asyncio.create_task(
                websocket_manager.broadcast(json.dumps(alert_message))
            )
            # Add error handling for websocket task
            websocket_task.add_done_callback(lambda t: None if not t.exception() else print(f"❌ WebSocket error: {t.exception()}"))
            print(f"✅ Detection alert sent via WebSocket: {detection.get('person_name', 'Unknown')}")
            
        except Exception as e:
            print(f"Error sending detection alert: {e}")

    async def _get_known_persons_for_camera(self, camera_id: str) -> List[dict]:
        """Get known persons data for face recognition"""
        try:
            # Import here to avoid circular imports
            from ..database import get_database
            from bson import ObjectId
            
            db = get_database()
            known_persons = []
            
            print(f"🔵 Loading known persons for camera {camera_id}...")
            
            # Get all known persons (you might want to filter by camera or user)
            async for person_data in db.known_persons.find({"is_active": True}):
                # Convert embeddings - backend lưu trong field 'face_embeddings'
                embeddings = []
                if 'face_embeddings' in person_data and person_data['face_embeddings']:
                    for emb_data in person_data['face_embeddings']:
                        if isinstance(emb_data, str) and emb_data:
                            # If stored as base64, decode it
                            try:
                                emb_bytes = base64.b64decode(emb_data)
                                emb_array = np.frombuffer(emb_bytes, dtype=np.float32)
                                embeddings.append(emb_array)
                            except Exception as e:
                                print(f"Error decoding base64 embedding: {e}")
                        elif isinstance(emb_data, list) and emb_data:
                            # If stored as list, convert to numpy array
                            try:
                                embeddings.append(np.array(emb_data, dtype=np.float32))
                            except Exception as e:
                                print(f"Error converting list to array: {e}")
                
                if embeddings:
                    # Đảm bảo name được encode/decode đúng UTF-8
                    person_name = person_data['name']
                    if isinstance(person_name, bytes):
                        person_name = person_name.decode('utf-8')
                    elif not isinstance(person_name, str):
                        person_name = str(person_name)
                    
                    known_persons.append({
                        'id': str(person_data['_id']),
                        'name': person_name,
                        'embeddings': embeddings
                    })
                    print(f"✅ Loaded person: {person_name} with {len(embeddings)} embeddings")
                else:
                    person_name = person_data['name']
                    if isinstance(person_name, bytes):
                        person_name = person_name.decode('utf-8')
                    print(f"⚠️ Person {person_name} has no valid embeddings")
            
            print(f"✅ Loaded {len(known_persons)} known persons for recognition")
            return known_persons
            
        except Exception as e:
            print(f"❌ Error loading known persons: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def _save_detection_to_database(self, camera_id: str, camera_name: str, detection: Dict[str, Any], frame: np.ndarray):
        """Save detection to database"""
        try:
            # Import here to avoid circular imports
            from ..database import get_database
            from bson import ObjectId
            from ..models.detection_log import DetectionLogCreate
            import base64
            import uuid
            import os
            
            # Get camera info
            db = get_database()
            camera_data = await db.cameras.find_one({"_id": ObjectId(camera_id)})
            if not camera_data:
                print(f"❌ Camera not found: {camera_id}")
                return None
                
            user_id = str(camera_data.get("user_id", ""))
            if not user_id:
                print(f"❌ No user_id found for camera: {camera_id}")
                return None
            
            # Convert frame to base64 for storage
            _, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            img_base64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')
            
            # Create detection document
            detection_type = "known_person" if detection.get("person_name") != "Unknown" else "stranger"
            
            # Ensure uploads directory exists
            upload_dir = "uploads/detections"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save image to file
            image_filename = f"detection_{uuid.uuid4()}.jpg"
            image_path = os.path.join(upload_dir, image_filename)
            with open(image_path, 'wb') as f:
                f.write(img_encoded.tobytes())
                
            # Create database entry
            detection_type = detection.get("detection_type", "unknown")
            detection_doc = {
                "user_id": ObjectId(user_id),
                "camera_id": ObjectId(camera_id),
                "detection_type": detection_type,
                "person_id": ObjectId(detection.get("person_id")) if detection.get("person_id") else None,
                "person_name": detection.get("person_name", "Unknown"),
                "confidence": float(detection.get("confidence", 0)),
                "similarity_score": float(detection.get("recognition_confidence", 0)),
                "image_path": image_path,
                "bbox": detection.get("bbox", [0, 0, 0, 0]),
                "timestamp": vietnam_now(),
                "is_alert_sent": detection_type in ["stranger", "unknown"],  # ✅ FIXED: True for alerts, False for known persons
                "alert_sent": detection_type in ["stranger", "unknown"],  # ✅ FIXED: Compatibility field
                "alert_methods": ["websocket"] if detection_type in ["stranger", "unknown"] else [],
                "metadata": {
                    "created_by": "stream_processor",
                    "detection_source": "live_stream"
                }
            }
            
            # Insert to database
            result = await db.detection_logs.insert_one(detection_doc)
            detection_id = str(result.inserted_id)
            
            print(f"✅ Saved detection to database: {detection_id}, type: {detection_type}")
            return detection_id
            
        except Exception as e:
            import traceback
            print(f"❌ Error saving detection to database: {e}")
            traceback.print_exc()
            return None

    async def _save_optimized_detection(self, camera_id: str, camera_name: str, detection: Dict[str, Any], frame: np.ndarray):
        """Lưu detection sử dụng Detection Optimizer Service"""
        try:
            # Import here to avoid circular imports
            from ..database import get_database
            from bson import ObjectId
            import base64
            import os
            import uuid
            
            # Get camera info
            db = get_database()
            camera_data = await db.cameras.find_one({"_id": ObjectId(camera_id)})
            if not camera_data:
                print(f"❌ Camera not found: {camera_id}")
                return None
                
            user_id = str(camera_data.get("user_id", ""))
            if not user_id:
                print(f"❌ No user_id found for camera: {camera_id}")
                return None
            
            # Convert frame to base64 for storage
            _, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            img_base64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')
            
            # Create detection document
            detection_type = "known_person" if detection.get("person_name") != "Unknown" else "stranger"
            
            # Ensure uploads directory exists
            upload_dir = "uploads/detections"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save image to file
            image_filename = f"detection_{uuid.uuid4()}.jpg"
            image_path = os.path.join(upload_dir, image_filename)
            with open(image_path, 'wb') as f:
                f.write(img_encoded.tobytes())
            
            # Prepare detection data for optimizer
            detection_data = {
                "user_id": user_id,
                "camera_id": camera_id,
                "detection_type": detection_type,
                "person_id": detection.get("person_id"),
                "person_name": detection.get("person_name", "Unknown"),
                "confidence": float(detection.get("confidence", 0)),
                "similarity_score": float(detection.get("recognition_confidence", 0)),
                "image_path": image_path,
                "bbox": detection.get("bbox", [0, 0, 0, 0]),
                "timestamp": vietnam_now(),
                "is_alert_sent": True,
                "alert_methods": ["websocket"],
                "notes": f"Detected by {camera_name}"
            }
            
            try:
                # Use the existing detection optimizer from router
                from ..routers.detection_optimizer import detection_optimizer
                
                if detection_optimizer is not None:
                    # Process detection with optimizer
                    detection_id = await detection_optimizer.process_detection(detection_data)
                else:
                    # Fall back to traditional save if optimizer isn't available
                    print("⚠️ Detection optimizer service not available, falling back to traditional save")
                    detection_id = None  # Will be saved by the original method
            except Exception as optimizer_error:
                print(f"⚠️ Error using detection optimizer: {optimizer_error}")
                detection_id = None  # Will be saved by the original method
            
            if detection_id:
                print(f"✅ Optimized detection saved: {detection.get('person_name')} - ID: {detection_id}")
            
            return detection_id
            
        except Exception as e:
            print(f"❌ Error saving optimized detection: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _draw_utf8_text(self, frame: np.ndarray, text: str, position: tuple, 
                       font_scale: float = 0.8, color: tuple = (0, 255, 0), thickness: int = 2) -> np.ndarray:
        """Draw UTF-8 text (including Vietnamese) on frame using PIL"""
        try:
            # Convert OpenCV frame (BGR) to PIL Image (RGB)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            draw = ImageDraw.Draw(pil_image)
            
            # Try to load a font that supports Vietnamese characters
            font_size = int(20 * font_scale)
            try:
                # Try to use a system font that supports Vietnamese
                if os.name == 'nt':  # Windows
                    font_path = "C:/Windows/Fonts/arial.ttf"
                else:  # Linux/Mac
                    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
                
                if os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, font_size)
                else:
                    font = ImageFont.load_default()
            except:
                font = ImageFont.load_default()
            
            # Convert BGR color to RGB for PIL
            pil_color = (color[2], color[1], color[0])
            
            # Draw text with PIL
            draw.text(position, text, font=font, fill=pil_color)
            
            # Convert back to OpenCV format (RGB to BGR)
            frame_with_text = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            return frame_with_text
            
        except Exception as e:
            print(f"Error drawing UTF-8 text: {e}")
            # Fallback to ASCII-only version if UTF-8 fails
            ascii_text = text.encode('ascii', 'ignore').decode('ascii')
            cv2.putText(frame, ascii_text, position, cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness)
            return frame

    async def _analyze_frame_for_notifications(self, camera_id: str, detections: List[Dict[str, Any]], frame: np.ndarray):
        """
        Phân tích khung hình để gửi thông báo email
        Chỉ gửi thông báo nếu trong khung hình chỉ có người lạ (không có người quen)
        """
        try:
            if not detections:
                return
            
            # Lấy user_id từ database
            from ..database import get_database
            from bson import ObjectId
            
            db = get_database()
            camera_data = await db.cameras.find_one({"_id": ObjectId(camera_id)})
            if not camera_data:
                print(f"[WARNING] Camera {camera_id} not found in database")
                return
                
            user_id = str(camera_data.get("user_id"))
            if not user_id:
                print(f"[WARNING] No user_id found for camera {camera_id}")
                return
            
            # Phân loại các detection trong khung hình hiện tại
            frame_strangers = []
            frame_known_persons = []
            
            for detection in detections:
                detection_type = detection.get('detection_type', 'unknown')
                if detection_type == 'stranger':
                    frame_strangers.append(detection)
                elif detection_type == 'known_person':
                    frame_known_persons.append(detection)
            
            # Chỉ xử lý nếu có người lạ trong khung hình
            if frame_strangers:
                print(f"🔍 Frame analysis - Strangers: {len(frame_strangers)}, Known: {len(frame_known_persons)}")
                
                # Chuyển đổi frame thành bytes để gửi email
                image_bytes = None
                try:
                    # Encode frame as JPEG
                    success, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    if success:
                        image_bytes = buffer.tobytes()
                except Exception as img_error:
                    print(f"⚠️ Error encoding frame for email: {img_error}")
                
                # Gửi thông báo với frame analysis (bao gồm cả stranger và known person detections)
                # Chạy background task để không block video stream
                email_task = asyncio.create_task(
                    notification_service.send_stranger_alert_with_frame_analysis(
                        user_id=user_id,
                        camera_id=camera_id,
                        all_detections=detections,  # Gửi tất cả detections để phân tích
                        image_data=image_bytes
                    )
                )
                # Add error handling for background task
                email_task.add_done_callback(lambda t: print(f"📧 Email task completed: {t.exception() if t.exception() else 'Success'}"))
                
                print(f"📧 Frame notification analysis completed - {len(frame_strangers)} strangers, {len(frame_known_persons)} known persons")
            
        except Exception as e:
            print(f"[ERROR] Frame notification analysis error: {e}")
            import traceback
            traceback.print_exc()

# Global instance
stream_processor = StreamProcessor()