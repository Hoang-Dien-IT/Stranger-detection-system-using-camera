from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import timedelta
from ..models.user import UserCreate, UserResponse, LoginResponse, Token, UserUpdate, PasswordChangeRequest
from ..services.auth_service import auth_service, get_current_user, get_current_active_user, get_admin_user
from ..config import get_settings
import logging
import time

logger = logging.getLogger(__name__)
settings = get_settings()

# ✅ Correct prefix
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Đăng ký user mới"""
    try:
        logger.info(f"🔵 Registration attempt for username: {user_data.username}")
        user = await auth_service.create_user(user_data)
        logger.info(f"✅ User registered successfully: {user.username}")
        return user
    except HTTPException as e:
        logger.warning(f"❌ Registration failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"❌ Registration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user với enhanced error handling"""
    try:
        logger.info(f"🔵 Login attempt for username: {form_data.username}")
        
        # Authenticate user
        user = await auth_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            logger.warning(f"❌ Authentication failed for: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            logger.warning(f"❌ Inactive user login attempt: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = auth_service.create_access_token(
            data={"sub": user.username, "user_id": str(user.id)},
            expires_delta=access_token_expires
        )
        
        logger.info(f"✅ Login successful for: {form_data.username}")
        
        # Create user response
        user_response = UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            role=getattr(user, 'role', 'user'),
            permissions=getattr(user, 'permissions', []),
            created_at=user.created_at,
            updated_at=getattr(user, 'updated_at', user.created_at),
            last_login=getattr(user, 'last_login', None),
            avatar_url=getattr(user, 'avatar_url', None),
            phone=getattr(user, 'phone', None),
            department=getattr(user, 'department', None),
            location=getattr(user, 'location', None),
            bio=getattr(user, 'bio', None),
            website=getattr(user, 'website', None),
            job_title=getattr(user, 'job_title', None),
            company=getattr(user, 'company', None),
            timezone=getattr(user, 'timezone', 'UTC+7')
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException as e:
        # Re-raise HTTP exceptions as-is
        raise e
    except Exception as e:
        logger.error(f"❌ Login error for {form_data.username}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user = Depends(get_current_user)):
    """Refresh access token"""
    try:
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = auth_service.create_access_token(
            data={"sub": current_user.username, "user_id": str(current_user.id)},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Token refresh failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_active_user)):
    """Lấy thông tin user hiện tại"""
    try:
        return UserResponse(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            is_admin=current_user.is_admin,
            role=getattr(current_user, 'role', 'user'),
            permissions=getattr(current_user, 'permissions', []),
            created_at=current_user.created_at,
            updated_at=getattr(current_user, 'updated_at', current_user.created_at),
            last_login=getattr(current_user, 'last_login', None),
            avatar_url=getattr(current_user, 'avatar_url', None),
            phone=getattr(current_user, 'phone', None),
            department=getattr(current_user, 'department', None),
            location=getattr(current_user, 'location', None),
            bio=getattr(current_user, 'bio', None),
            website=getattr(current_user, 'website', None),
            job_title=getattr(current_user, 'job_title', None),
            company=getattr(current_user, 'company', None),
            timezone=getattr(current_user, 'timezone', 'UTC+7')
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user info: {str(e)}"
        )

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.get("/health")
async def auth_health_check():
    """Check auth service health"""
    try:
        return {
            "status": "healthy",
            "service": "auth",
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "auth",
            "error": str(e),
            "timestamp": time.time()
        }

# ✅ Thêm endpoints mới cho user management - SỬA DEPENDENCIES
@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user = Depends(get_current_active_user)
):
    """Cập nhật profile user hiện tại"""
    try:
        updated_user = await auth_service.update_user_profile(str(current_user.id), user_data)
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_active_user)
):
    """Đổi mật khẩu"""
    try:
        success = await auth_service.change_password(
            str(current_user.id),
            password_data.current_password,
            password_data.new_password
        )
        if not success:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to change password: {str(e)}"
        )

@router.post("/verify-email")
async def verify_email(
    token: str,
    current_user = Depends(get_current_user)
):
    """Xác thực email"""
    try:
        success = await auth_service.verify_email(str(current_user.id), token)
        if not success:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        return {"message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Email verification failed: {str(e)}"
        )