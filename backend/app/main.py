from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .routers import auth, camera, person, admin, detection, stream, websocket, settings, alerts, detection_optimizer, user, test_email, notifications
from .database import startup_db_client, shutdown_db_client
import logging
import os
import time

# ✅ Setup enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SafeFace API",
    description="AI-powered face recognition security system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ✅ Add middleware to handle large request bodies
@app.middleware("http")
async def increase_body_size_limit(request: Request, call_next):
    # Set max request size to 50MB
    request.scope["body_size_limit"] = 50 * 1024 * 1024  # 50MB
    response = await call_next(request)
    return response

# ✅ Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

# ✅ Enhanced request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request với details
    client_ip = request.client.host if request.client else 'unknown'
    logger.info(f"🔵 {request.method} {request.url.path} - Client: {client_ip}")
    
    # Log auth header for debugging (chỉ first 20 chars cho security)
    auth_header = request.headers.get("authorization")
    if auth_header:
        logger.info(f"🔵 Auth header present: {auth_header[:20]}...")
    else:
        logger.info(f"🔵 No auth header")
    
    # Log query parameters
    if request.url.query:
        logger.info(f"🔵 Query params: {request.url.query}")
    
    # Process request
    try:
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        status_emoji = "✅" if response.status_code < 400 else "❌"
        logger.info(f"{status_emoji} {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"❌ {request.method} {request.url.path} - ERROR: {str(e)} ({process_time:.3f}s)")
        raise

# Database events
@app.on_event("startup")
async def startup_event():
    """Khởi tạo kết nối database khi start app"""
    try:
        await startup_db_client()
        logger.info("✅ Database connected successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Đóng kết nối database khi shutdown app"""
    try:
        await shutdown_db_client()
        logger.info("✅ Database disconnected successfully")
    except Exception as e:
        logger.error(f"❌ Database disconnection failed: {e}")

# ✅ Include routers với prefix /api
try:
    # Auth router - MUST BE FIRST
    app.include_router(auth.router, prefix="/api")
    logger.info("✅ Auth router included")
    
    # Specific routers with detailed endpoints
    app.include_router(detection.router, prefix="/api")
    logger.info("✅ Detection router included")
    
    # Detection Optimizer router
    app.include_router(detection_optimizer.router)
    logger.info("✅ Detection Optimizer router included")
    
    app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
    logger.info("✅ Alerts router included")
    
    app.include_router(camera.router, prefix="/api")
    logger.info("✅ Camera router included")
    
    app.include_router(person.router, prefix="/api")
    logger.info("✅ Person router included")
    
    app.include_router(settings.router, prefix="/api")
    logger.info("✅ Settings router included")
    
    app.include_router(user.router, prefix="/api")
    logger.info("✅ User router included")
    
    # Stream và WebSocket
    app.include_router(stream.router, prefix="/api")
    logger.info("✅ Stream router included")
    
    app.include_router(websocket.router, prefix="/api")
    logger.info("✅ WebSocket router included")
    
    # Admin router - LAST
    app.include_router(admin.router, prefix="/api")
    logger.info("✅ Admin router included")
    
    # Test email router
    app.include_router(test_email.router, prefix="/api")
    logger.info("✅ Test email router included")
    
    # Notifications router
    app.include_router(notifications.router)
    logger.info("✅ Notifications router included")
    
    logger.info("✅ All routers included successfully")
except Exception as e:
    logger.error(f"❌ Error including routers: {e}")
    raise

# Serve static files
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    logger.info(f"✅ Created uploads directory: {uploads_dir}")
    
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SafeFace API Server",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime": f"{time.time() - start_time:.2f} seconds" if 'start_time' in globals() else "unknown"
    }

# Debug endpoint
@app.get("/debug/headers")
async def debug_headers(request: Request):
    """Debug endpoint để check request headers"""
    return {
        "headers": dict(request.headers),
        "method": request.method,
        "url": str(request.url),
        "client": request.client.host if request.client else None,
        "query_params": dict(request.query_params)
    }

# ✅ Fixed exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    logger.warning(f"🔍 404 Not Found: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found", "path": request.url.path}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"💥 500 Internal Error: {request.method} {request.url.path} - {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": request.url.path}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"💥 Unhandled Exception: {request.method} {request.url.path} - {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "path": request.url.path}
    )

if __name__ == "__main__":
    import uvicorn
    
    # Record start time for uptime calculation
    start_time = time.time()
    
    logger.info("🚀 Starting SafeFace API Server...")
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )