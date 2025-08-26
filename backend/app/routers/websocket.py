from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Dict, Any
from ..services.websocket_manager import websocket_manager
from ..services.auth_service import get_current_active_user
from ..models.user import User
import json
import asyncio
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["websocket"])
security = HTTPBearer()

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint cho real-time notifications"""
    # Accept connection first
    await websocket.accept()
    
    try:
        # Connect to manager
        await websocket_manager.connect(websocket, user_id)
        
        # Send welcome message
        welcome_message = {
            "type": "connection",
            "message": f"Connected to SafeFace WebSocket",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(welcome_message))
        
        # Listen for messages
        while True:
            try:
                # Wait for any message from client (keep-alive, etc.)
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "ping":
                    pong_response = {
                        "type": "pong", 
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await websocket.send_text(json.dumps(pong_response))
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                continue
            except Exception as e:
                print(f"WebSocket error: {e}")
                break
                
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # Clean up connection
        websocket_manager.disconnect(websocket, user_id)

@router.get("/test/{user_id}")
async def test_websocket_connection(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Test endpoint để kiểm tra WebSocket"""
    try:
        # Verify user ownership
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=403, 
                detail="You can only test your own WebSocket connection"
            )
        
        # Send test message
        test_message = {
            "type": "test",
            "message": "Test message from API",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await websocket_manager.send_personal_message(
            json.dumps(test_message), 
            user_id
        )
        
        return {
            "message": "Test message sent successfully",
            "user_id": user_id,
            "websocket_url": f"ws://localhost:8000/api/ws/{user_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status/{user_id}")
async def get_websocket_status(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy trạng thái WebSocket connection"""
    try:
        # Verify user ownership
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=403, 
                detail="You can only check your own connection status"
            )
        
        connection_count = websocket_manager.get_user_connection_count(user_id)
        total_connections = websocket_manager.get_connection_count()
        
        return {
            "user_id": user_id,
            "is_connected": connection_count > 0,
            "connection_count": connection_count,
            "total_system_connections": total_connections,
            "websocket_url": f"ws://localhost:8000/api/ws/{user_id}",
            "status": "connected" if connection_count > 0 else "disconnected"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))