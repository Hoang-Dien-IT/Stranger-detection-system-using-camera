from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class CameraType(str, Enum):
    webcam = "webcam"
    ip_camera = "ip_camera"
    rtsp = "rtsp"
    usb = "usb"

class StreamSettings(BaseModel):
    resolution: Optional[str] = "1920x1080"
    fps: Optional[int] = 30
    quality: Optional[str] = "medium"  # high, medium, low
    buffer_size: Optional[int] = 10

class AlertSettings(BaseModel):
    email_alerts: Optional[bool] = True
    web_notifications: Optional[bool] = True
    alert_threshold: Optional[float] = Field(0.7, ge=0.0, le=1.0)

class CameraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None  # Add this field
    camera_type: CameraType
    camera_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    detection_enabled: Optional[bool] = True
    stream_settings: Optional[StreamSettings] = None
    alert_settings: Optional[AlertSettings] = None
    tags: Optional[List[str]] = None  # Add this field


class CameraUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None  # Add this field
    camera_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_recording: Optional[bool] = None
    detection_enabled: Optional[bool] = None
    stream_settings: Optional[StreamSettings] = None
    alert_settings: Optional[AlertSettings] = None
    tags: Optional[List[str]] = None  # Add this field

class CameraResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None  # Add this field
    camera_type: CameraType
    camera_url: Optional[str] = None
    is_active: bool
    is_streaming: bool
    is_recording: bool
    detection_enabled: bool
    stream_settings: Dict[str, Any] = {}
    alert_settings: Dict[str, Any] = {}
    created_at: datetime
    last_online: Optional[datetime] = None
    tags: Optional[List[str]] = None  # Add this field

class CameraStreamInfo(BaseModel):
    camera_id: str
    is_active: bool
    fps: int
    resolution: str
    last_frame_time: Optional[datetime] = None

class Camera(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None  # Add this field
    camera_type: CameraType
    camera_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: bool = True
    is_streaming: bool = False
    is_recording: bool = False
    detection_enabled: bool = True
    stream_settings: Dict[str, Any] = {}
    alert_settings: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    last_online: Optional[datetime] = None
    tags: Optional[List[str]] = None  # Add this field

class CameraSettings(BaseModel):
    stream_settings: Optional[dict] = {}
    detection_settings: Optional[dict] = {}
    notification_settings: Optional[dict] = {}
    recording_settings: Optional[dict] = {}

class SystemInfo(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    temperature: Optional[float] = None
    uptime: int
    network_speed: dict
    firmware_version: str
    last_maintenance: Optional[str] = None