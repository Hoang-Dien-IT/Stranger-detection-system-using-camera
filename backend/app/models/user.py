from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MANAGER = "manager"

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    permissions: Optional[List[str]] = Field(default=None, description="User permissions")
    phone: Optional[str] = Field(default=None, max_length=20, description="Phone number")
    department: Optional[str] = Field(default=None, max_length=100, description="Department")

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must be alphanumeric (underscore and dash allowed)')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    role: str = "user"
    permissions: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    timezone: str = "UTC+7"

class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    role: str = "user"
    permissions: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    timezone: str = "UTC+7"
    metadata: Dict[str, Any] = {}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ✅ FIX: Thêm LoginResponse model
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[str] = None

class UserProfile(BaseModel):
    """Model cho user profile với thông tin chi tiết"""
    id: str
    username: str
    email: str
    full_name: str
    role: str
    permissions: List[str]
    is_active: bool
    is_admin: bool
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    timezone: str = "UTC+7"
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    # Statistics
    total_cameras: int = 0
    total_persons: int = 0
    total_detections: int = 0
    recent_activity: List[Dict[str, Any]] = []

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    password: str = Field(..., min_length=6)

class UserStats(BaseModel):
    """User statistics model"""
    total_users: int
    active_users: int
    inactive_users: int
    admin_users: int
    recent_registrations: int
    users_by_role: Dict[str, int]
    users_by_department: Dict[str, int]

class UserActivity(BaseModel):
    """User activity log model"""
    id: str
    user_id: str
    username: str
    action: str
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class UserSession(BaseModel):
    """User session model"""
    session_id: str
    user_id: str
    username: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    is_active: bool = True


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    password: str = Field(..., min_length=6)