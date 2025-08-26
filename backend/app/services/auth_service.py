from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..database import get_database
from ..config import get_settings
from ..models.user import User, UserCreate, UserUpdate, UserResponse
import logging

logger = logging.getLogger(__name__)
settings = get_settings()
security = HTTPBearer()

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.secret_key
        self.algorithm = "HS256"

    @property
    def db(self):
        return get_database()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against its hash"""
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        try:
            return self.pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise HTTPException(status_code=500, detail="Password hashing failed")

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        try:
            db = self.db
            
            # Find user by username
            user_data = await db.users.find_one({"username": username})
            
            if not user_data:
                logger.warning(f"User not found: {username}")
                return None
            
            # Verify password
            if not self.verify_password(password, user_data["hashed_password"]):
                logger.warning(f"Password verification failed for: {username}")
                return None
            
            # Update last login
            await db.users.update_one(
                {"_id": user_data["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            # Convert to User model
            return User(
                id=str(user_data["_id"]),
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                is_admin=user_data.get("is_admin", False),
                created_at=user_data["created_at"],
                role=user_data.get("role", "user"),
                permissions=user_data.get("permissions", []),
                updated_at=user_data.get("updated_at"),
                last_login=user_data.get("last_login"),
                avatar_url=user_data.get("avatar_url"),
                phone=user_data.get("phone"),
                department=user_data.get("department"),
                location=user_data.get("location"),
                bio=user_data.get("bio"),
                website=user_data.get("website"),
                job_title=user_data.get("job_title"),
                company=user_data.get("company"),
                timezone=user_data.get("timezone", "UTC+7")
            )
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None

    async def update_user_avatar(self, user_id: str, avatar_url: str) -> None:
        """Update user avatar URL"""
        db = self.db
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"avatar_url": avatar_url, "updated_at": datetime.utcnow()}}
        )

    async def create_user(self, user_data: UserCreate) -> User:
        """Tạo user mới"""
        db = self.db
        
        # Check if user exists
        existing_user = await db.users.find_one({
            "$or": [
                {"username": user_data.username},
                {"email": user_data.email}
            ]
        })
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        # Hash password
        hashed_password = self.get_password_hash(user_data.password)
        
        # Set default permissions based on role
        default_permissions = self.get_default_permissions(user_data.role)
        
        # Create user document with all fields
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "is_active": True,
            "is_admin": user_data.role == "admin",
            "role": user_data.role,
            "permissions": user_data.permissions or default_permissions,
            "phone": user_data.phone,
            "department": user_data.department,
            # ✅ Initialize new profile fields
            "location": None,
            "bio": None,
            "website": None,
            "job_title": None,
            "company": None,
            "timezone": "UTC+7",
            "avatar_url": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
            "metadata": {}
        }
        
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Convert to User model
        user_doc["id"] = str(user_doc.pop("_id"))
        return User(**user_doc)

    def get_default_permissions(self, role: str) -> List[str]:
        """Lấy permissions mặc định theo role"""
        if role == "admin":
            return [
                "cameras:read", "cameras:write", "cameras:delete",
                "persons:read", "persons:write", "persons:delete",
                "detections:read", "detections:write", "detections:delete",
                "admin:read", "admin:write",
                "users:read", "users:write", "users:delete",
                "system:read", "system:write"
            ]
        elif role == "manager":
            return [
                "cameras:read", "cameras:write",
                "persons:read", "persons:write",
                "detections:read", "detections:write",
                "users:read"
            ]
        else:  # user
            return [
                "cameras:read", "cameras:write",
                "persons:read", "persons:write",
                "detections:read"
            ]

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        if not credentials:
            logger.warning("❌ No authorization credentials provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # ✅ Enhanced logging
            token_prefix = credentials.credentials[:20] if len(credentials.credentials) > 20 else credentials.credentials
            logger.info(f"🔵 Validating token: {token_prefix}...")
            
            # Decode JWT
            payload = jwt.decode(
                credentials.credentials, 
                self.secret_key,
                algorithms=[self.algorithm]
            )
            
            username: str = payload.get("sub")
            user_id: str = payload.get("user_id")
            exp: int = payload.get("exp")
            
            logger.info(f"🔵 Token payload - username: {username}, user_id: {user_id}, exp: {exp}")
            
            # Check token expiration
            if exp and datetime.utcnow().timestamp() > exp:
                logger.warning("❌ Token has expired")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if username is None or user_id is None:
                logger.warning("❌ Missing username or user_id in token")
                raise credentials_exception
                
            # Validate ObjectId format
            if not ObjectId.is_valid(user_id):
                logger.warning(f"❌ Invalid user_id format: {user_id}")
                raise credentials_exception
                
        except JWTError as e:
            logger.error(f"❌ JWT decode error: {e}")
            raise credentials_exception
        except ValueError as e:
            logger.error(f"❌ Token validation error: {e}")
            raise credentials_exception
        
        # Get user from database
        db = self.db
        try:
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            
            if user_data is None:
                logger.warning(f"❌ User not found in database: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
                
            if not user_data.get("is_active", True):
                logger.warning(f"❌ User is inactive: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is disabled"
                )
            
            logger.info(f"✅ User authenticated successfully: {username} (ID: {user_id})")
            
            return User(
                id=str(user_data["_id"]),
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                is_admin=user_data.get("is_admin", False),
                created_at=user_data["created_at"],
                role=user_data.get("role", "user"),
                permissions=user_data.get("permissions", []),
                updated_at=user_data.get("updated_at"),
                last_login=user_data.get("last_login"),
                avatar_url=user_data.get("avatar_url"),
                phone=user_data.get("phone"),
                department=user_data.get("department"),
                location=user_data.get("location"),
                bio=user_data.get("bio"),
                website=user_data.get("website"),
                job_title=user_data.get("job_title"),
                company=user_data.get("company"),
                timezone=user_data.get("timezone", "UTC+7")
            )
            
        except Exception as e:
            logger.error(f"❌ Database error during user lookup: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error during authentication"
            )
        
    async def update_user_profile(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        """Cập nhật profile của user"""
        try:
            db = self.db
            
            # Prepare update data
            update_data = {}
            for field, value in user_data.dict(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value
            
            if update_data:
                update_data["updated_at"] = datetime.utcnow()
                
                result = await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": update_data}
                )
                
                if result.modified_count == 0:
                    raise HTTPException(status_code=404, detail="User not found")
            
            # Get updated user
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user_data:
                raise HTTPException(status_code=404, detail="User not found")
            
            return UserResponse(
                id=str(user_data["_id"]),
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                is_admin=user_data.get("is_admin", False),
                role=user_data.get("role", "user"),
                permissions=user_data.get("permissions", []),
                created_at=user_data["created_at"],
                updated_at=user_data.get("updated_at"),
                last_login=user_data.get("last_login"),
                avatar_url=user_data.get("avatar_url"),
                phone=user_data.get("phone"),
                department=user_data.get("department"),
                location=user_data.get("location"),
                bio=user_data.get("bio"),
                website=user_data.get("website"),
                job_title=user_data.get("job_title"),
                company=user_data.get("company"),
                timezone=user_data.get("timezone", "UTC+7")
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise HTTPException(status_code=500, detail="Failed to update profile")

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Đổi mật khẩu của user"""
        try:
            db = self.db
            
            # Get user
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user_data:
                return False
            
            # Verify current password
            if not self.verify_password(current_password, user_data["hashed_password"]):
                return False
            
            # Update password
            new_hashed_password = self.get_password_hash(new_password)
            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return False

    async def verify_email(self, user_id: str, token: str) -> bool:
        """Xác thực email (placeholder implementation)"""
        try:
            # This is a placeholder - implement actual email verification logic
            db = self.db
            
            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "email_verified": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error verifying email: {e}")
            return False

    async def verify_token_from_query(self, token: str) -> User:
        """Verify JWT token from query parameter (for streaming endpoints)"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
        try:
            # Enhanced logging
            token_prefix = token[:20] if len(token) > 20 else token
            logger.info(f"🔵 Validating token from query: {token_prefix}...")
            
            # Decode JWT
            payload = jwt.decode(
                token, 
                self.secret_key,
                algorithms=[self.algorithm]
            )
            
            username: str = payload.get("sub")
            user_id: str = payload.get("user_id")
            exp: int = payload.get("exp")
            
            logger.info(f"🔵 Token payload - username: {username}, user_id: {user_id}, exp: {exp}")
            
            # Check token expiration
            if exp and datetime.utcnow().timestamp() > exp:
                logger.warning("❌ Token has expired")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                )
            
            if username is None or user_id is None:
                logger.warning("❌ Missing username or user_id in token")
                raise credentials_exception
                
            # Validate ObjectId format
            if not ObjectId.is_valid(user_id):
                logger.warning(f"❌ Invalid user_id format: {user_id}")
                raise credentials_exception
                
        except JWTError as e:
            logger.error(f"❌ JWT decode error: {e}")
            raise credentials_exception
        except ValueError as e:
            logger.error(f"❌ Token validation error: {e}")
            raise credentials_exception
        
        # Get user from database
        db = self.db
        try:
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            
            if user_data is None:
                logger.warning(f"❌ User not found in database: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
                
            if not user_data.get("is_active", True):
                logger.warning(f"❌ User is inactive: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is disabled"
                )
            
            logger.info(f"✅ User authenticated successfully via query token: {username} (ID: {user_id})")
            
            return User(
                id=str(user_data["_id"]),
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                is_admin=user_data.get("is_admin", False),
                created_at=user_data["created_at"],
                role=user_data.get("role", "user"),
                permissions=user_data.get("permissions", []),
                updated_at=user_data.get("updated_at"),
                last_login=user_data.get("last_login"),
                avatar_url=user_data.get("avatar_url"),
                phone=user_data.get("phone"),
                department=user_data.get("department"),
                location=user_data.get("location"),
                bio=user_data.get("bio"),
                website=user_data.get("website"),
                job_title=user_data.get("job_title"),
                company=user_data.get("company"),
                timezone=user_data.get("timezone", "UTC+7")
            )
            
        except Exception as e:
            logger.error(f"❌ Database error during user lookup: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error during authentication"
            )

# Global instance
auth_service = AuthService()

# Dependency functions for FastAPI
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency để lấy current user"""
    return await auth_service.get_current_user(credentials)

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency để lấy current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Dependency để kiểm tra admin user"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

