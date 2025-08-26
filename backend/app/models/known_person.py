from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class FaceImage(BaseModel):
    image_path: str
    image_url: str
    uploaded_at: datetime
    embedding: Optional[List[float]] = None

class FaceImageResponse(BaseModel):
    image_url: str
    uploaded_at: datetime

class KnownPersonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name of the person")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")
    
    # ✅ Enhanced metadata fields for the form
    department: Optional[str] = Field(None, max_length=100, description="Department")
    employee_id: Optional[str] = Field(None, max_length=50, description="Employee ID")
    position: Optional[str] = Field(None, max_length=100, description="Job position")
    access_level: Optional[str] = Field(None, description="Access level")
    
    # ✅ Generic metadata for additional fields
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('metadata', pre=True, always=True)
    def ensure_metadata_dict(cls, v):
        if v is None:
            return {}
        if isinstance(v, dict):
            return v
        return {}

class KnownPersonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    department: Optional[str] = Field(None, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    access_level: Optional[str] = Field(None)
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class KnownPersonResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    # ✅ ADD: Include additional fields in response
    department: Optional[str] = None
    employee_id: Optional[str] = None
    position: Optional[str] = None
    access_level: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    face_images_count: int = 0
    
    # ✅ ADD: Face images list for detailed view
    face_images: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

# ✅ ADD: Missing KnownPerson model for database schema
class KnownPerson(BaseModel):
    """Database model for known persons"""
    id: Optional[str] = None
    user_id: str
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    position: Optional[str] = None
    access_level: Optional[str] = None
    face_images: List[str] = []  # Base64 encoded images
    face_embeddings: List[List[float]] = []  # Face embeddings
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = {}

class PersonDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    position: Optional[str] = None
    access_level: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    face_images: List[FaceImageResponse] = []
    metadata: Dict[str, Any] = {}

class AddFaceImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image")