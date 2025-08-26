from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DetectionType(str, Enum):
    known_person = "known_person"
    stranger = "stranger"
    unknown = "unknown"

class DetectionLogCreate(BaseModel):
    camera_id: str
    detection_type: DetectionType
    person_id: Optional[str] = None
    person_name: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    similarity_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    image_base64: str
    bbox: List[int] = Field(..., min_length=4, max_length=4)  # [x, y, width, height]

class DetectionLogResponse(BaseModel):
    id: str
    camera_name: str
    detection_type: DetectionType
    person_name: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    similarity_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    image_url: str
    bbox: List[int] = Field(default_factory=list)
    timestamp: datetime
    is_alert_sent: bool = False
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DetectionStats(BaseModel):
    total_detections: int
    stranger_detections: int
    known_person_detections: int
    today_detections: int
    this_week_detections: int
    this_month_detections: int
    cameras_active: int

class DetectionFilter(BaseModel):
    camera_id: Optional[str] = None
    detection_type: Optional[DetectionType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(50, ge=1, le=1000)  # Tăng limit lên 1000
    offset: int = Field(0, ge=0)

class DetectionLog(BaseModel):
    id: str
    user_id: str
    camera_id: str
    detection_type: DetectionType
    person_id: Optional[str] = None
    person_name: Optional[str] = None
    confidence: float
    similarity_score: Optional[float] = None
    image_path: str
    bbox: List[int]
    timestamp: datetime
    is_alert_sent: bool
    alert_methods: List[str] = []
    metadata: Dict[str, Any] = {}
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    has_known_person_in_frame: bool = False

    class Config:
        from_attributes = True