from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import Request
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..models.detection_log import DetectionLogCreate, DetectionLogResponse, DetectionStats, DetectionFilter
from ..models.user import User
from ..services.detection_service import detection_service
from ..services.auth_service import get_current_active_user

router = APIRouter(prefix="/detections", tags=["detections"])

@router.post("/", response_model=dict)
async def create_detection(
    detection_data: DetectionLogCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Tạo detection log mới"""
    try:
        detection_id = await detection_service.create_detection(str(current_user.id), detection_data)
        return {
            "success": True,
            "message": "Detection logged successfully",
            "detection_id": detection_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error creating detection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create detection: {str(e)}")
    
# ✅ MAIN ROUTE - với trailing slash
@router.get("/", response_model=List[DetectionLogResponse])
async def get_detections(
    camera_id: Optional[str] = Query(None),
    detection_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=1000),  # Tăng limit lên 1000
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy danh sách detection logs"""
    try:
        print(f"🔵 Getting detections for user: {current_user.id}")
        print(f"🔵 Filters: camera_id={camera_id}, type={detection_type}, limit={limit}")

        # Parse date strings if provided
        start_datetime = None
        end_datetime = None

        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except:
                start_datetime = datetime.fromisoformat(start_date)
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except:
                end_datetime = datetime.fromisoformat(end_date)

        # Convert detection_type to proper enum value if provided
        detection_type_enum = None
        if detection_type:
            try:
                from ..models.detection_log import DetectionType
                # Check if it's a valid enum value
                if detection_type in [e.value for e in DetectionType]:
                    detection_type_enum = detection_type
                print(f"🔵 Converted detection_type: {detection_type} -> {detection_type_enum}")
            except Exception as e:
                print(f"❌ Error converting detection_type: {e}")

        filter_data = DetectionFilter(
            camera_id=camera_id,
            detection_type=detection_type_enum,
            start_date=start_datetime,
            end_date=end_datetime,
            limit=limit,
            offset=offset
        )

        detections = await detection_service.get_user_detections(str(current_user.id), filter_data)
        print(f"✅ Found {len(detections)} detections")

        # Debug: Log first detection details if any
        if detections:
            first_det = detections[0]
            print(f"🔍 First detection: ID={first_det.get('id')}, "
                  f"image_url='{first_det.get('image_url')}', "
                  f"confidence={first_det.get('confidence')}")

        # Ensure image_url and image_path are always present and correct for frontend
        for i, det in enumerate(detections):
            # If image_url is missing or empty, try to build from image_path
            if (not det.get('image_url')) and det.get('image_path'):
                det['image_url'] = f"/uploads/detections/{det['image_path'].split('/')[-1]}"
            # If image_path is missing but image_url exists, try to extract filename
            if (not det.get('image_path')) and det.get('image_url'):
                det['image_path'] = det['image_url'].split('/')[-1]
            # If both missing, set to empty string
            if not det.get('image_url'):
                det['image_url'] = ''
            if not det.get('image_path'):
                det['image_path'] = ''
                
            # Debug log for first 3 detections after processing
            if i < 3:
                print(f"🔍 Processed detection {i+1}: "
                      f"image_url='{det.get('image_url')}', "
                      f"image_path='{det.get('image_path')}'")

        return detections
    except Exception as e:
        print(f"❌ Error getting detections: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get detections")


@router.get("/stats/overview")
async def get_detection_stats_overview(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy thống kê tổng quan chi tiết"""
    try:
        print(f"🔵 Getting stats overview for user: {current_user.id}")
        stats = await detection_service.get_stats_overview(str(current_user.id))
        print(f"✅ Stats overview loaded successfully")
        return stats
    except Exception as e:
        print(f"❌ Error getting stats overview: {e}")
        import traceback
        traceback.print_exc()
        # Return default stats on error
        return {
            "overview": {
                "total_detections": 0,
                "stranger_detections": 0,
                "known_person_detections": 0,
                "detection_accuracy": 0.0,
                "alerts_sent": 0
            },
            "time_based": {
                "today": 0,
                "this_week": 0,
                "this_month": 0,
                "last_24h_strangers": 0
            },
            "camera_stats": {
                "total_cameras": 0,
                "active_cameras": 0,
                "streaming_cameras": 0,
                "offline_cameras": 0
            },
            "person_stats": {
                "total_known_persons": 0
            },
            "top_cameras": [],
            "hourly_pattern": {},
            "last_updated": datetime.utcnow().isoformat()
        }

@router.get("/stats")



@router.get("/{detection_id}")
async def get_detection_by_id(
    detection_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy detection log theo ID, trả về image_url đầy đủ domain"""
    try:
        print(f"🔍 Getting detection by ID: {detection_id} for user: {current_user.id}")
        detection = await detection_service.get_detection_by_id(detection_id, str(current_user.id), request=request)
        if not detection:
            print(f"🔍 404 Not Found: GET /api/detections/{detection_id}")
            raise HTTPException(status_code=404, detail="Detection not found")
        print(f"✅ Successfully retrieved detection: {detection_id}")
        return detection
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting detection by ID: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")
    # """Lấy detection log theo ID"""
    # try:
    #     detection = await detection_service.get_detection_by_id(detection_id, str(current_user.id))
    #     if not detection:
    #         raise HTTPException(status_code=404, detail="Detection not found")
    #     return detection
    # except HTTPException:
    #     raise
    # except Exception as e:
    #     print(f"❌ Error getting detection by ID: {e}")
    #     raise HTTPException(status_code=500, detail="Failed to get detection")

@router.delete("/{detection_id}")
async def delete_detection(
    detection_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Xóa detection log"""
    try:
        success = await detection_service.delete_detection(detection_id, str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="Detection not found")
        return {"message": "Detection deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting detection: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete detection")

@router.post("/cleanup")
async def cleanup_old_detections(
    days_to_keep: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user)
):
    """Dọn dẹp detection logs cũ"""
    try:
        deleted_count = await detection_service.cleanup_old_detections(str(current_user.id), days_to_keep)
        return {
            "message": f"Cleaned up {deleted_count} old detection logs",
            "deleted_count": deleted_count
        }
    except Exception as e:
        print(f"❌ Error cleaning up detections: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup detections")

@router.get("/stats/chart")
async def get_detection_chart_data(
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d)$"),
    chart_type: str = Query("area", regex="^(area|line|bar)$"),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy dữ liệu cho charts"""
    try:
        data = await detection_service.get_chart_data(
            str(current_user.id), 
            time_range, 
            chart_type
        )
        return data
    except Exception as e:
        print(f"❌ Error getting chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/export")
async def export_detection_stats(
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d)$"),
    format: str = Query("csv", regex="^(csv|json)$"),
    camera_id: Optional[str] = Query(None),
    detection_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Export thống kê detection"""
    try:
        from fastapi.responses import Response
        
        data = await detection_service.export_stats(
            str(current_user.id), 
            time_range, 
            format,
            camera_id,
            detection_type,
            start_date,
            end_date
        )
        
        if format == "csv":
            return Response(
                content=data,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=detections_{time_range}.csv"
                }
            )
        else:
            return Response(
                content=data,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=detections_{time_range}.json"
                }
            )
            
    except Exception as e:
        print(f"❌ Error exporting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tracking-status/{camera_id}")
async def get_detection_tracking_status(
    camera_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy trạng thái tracking detection cho camera"""
    try:
        from ..services.detection_tracker import detection_tracker
        
        presence_info = detection_tracker.get_presence_info(camera_id)
        
        return {
            "camera_id": camera_id,
            "active_presences": len(presence_info),
            "presences": presence_info,
            "tracking_active": True
        }
    except Exception as e:
        print(f"❌ Error getting tracking status: {e}")
        return {
            "camera_id": camera_id,
            "active_presences": 0,
            "presences": {},
            "tracking_active": False
        }

@router.get("/history")
async def get_detection_history(
    detection_type: Optional[str] = Query(None, regex="^(known_person|stranger)$"),
    camera_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy lịch sử detection"""
    try:
        filters = DetectionFilter(
            detection_type=detection_type,
            camera_id=camera_id,
            date_from=date_from,
            date_to=date_to,
            page=page,
            limit=limit
        )
        
        # Sử dụng detection_optimizer nếu có thể, nếu không, fallback về detection_service
        try:
            from ..routers.detection_optimizer import detection_optimizer
            
            if detection_optimizer is None:
                raise ImportError("Detection optimizer service not initialized")
            
            # Chuyển đổi filter format
            optimizer_filters = {}
            if detection_type:
                optimizer_filters["detection_type"] = detection_type
            if camera_id:
                optimizer_filters["camera_id"] = camera_id
            if date_from:
                optimizer_filters["date_from"] = date_from
            if date_to:
                optimizer_filters["date_to"] = date_to
                
            skip = (page - 1) * limit
            
            sessions = await detection_optimizer.get_sessions(
                user_id=current_user.id,
                filters=optimizer_filters,
                limit=limit,
                skip=skip
            )
            
            stats = await detection_optimizer.get_session_stats(user_id=current_user.id)
            
            # Format để tương thích với frontend
            detections = []
            for session in sessions:
                detection = {
                    "id": session.get("id"),
                    "camera_id": session.get("camera_id"),
                    "camera_name": session.get("camera_name"),
                    "detection_type": session.get("detection_type"),
                    "person_id": None,  # Temporarily not included
                    "person_name": session.get("person_name"),
                    "confidence": session.get("max_confidence"),
                    "timestamp": session.get("session_start"),
                    "image_path": "",  # Temporarily not included
                }
                detections.append(detection)
            
            return {
                "detections": detections,
                "total_count": stats.get("total_sessions", 0),
                "known_persons": stats.get("known_person_sessions", 0),
                "strangers": stats.get("stranger_sessions", 0),
                "page": page,
                "limit": limit
            }
            
        except Exception as optimizer_error:
            print(f"Warning: Detection optimizer failed, falling back to standard service: {optimizer_error}")
            # Fallback to regular detection service
            return await detection_service.get_detections(str(current_user.id), filters)
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get detection history: {str(e)}"
        )

@router.get("/stats/trends")
async def get_trends_data(
    time_range: str = Query("7d", regex="^(7d|30d|90d|1y)$"),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy dữ liệu trends với thống kê theo ngày"""
    try:
        print(f"🔵 Getting trends data for user: {current_user.id}, time_range: {time_range}")
        trends_data = await detection_service.get_trends_data(str(current_user.id), time_range)
        print(f"✅ Trends data loaded successfully")
        return trends_data
    except Exception as e:
        print(f"❌ Error getting trends data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/generate")
async def generate_report(
    report_config: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Tạo báo cáo với dữ liệu thực tế"""
    try:
        print(f"🔵 Generating report for user: {current_user.id}")
        report_data = await detection_service.generate_report_data(str(current_user.id), report_config)
        print(f"✅ Report generated successfully")
        return report_data
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/history")
async def get_report_history(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy lịch sử báo cáo đã tạo"""
    try:
        print(f"🔵 Getting report history for user: {current_user.id}")
        history = await detection_service.get_report_history(str(current_user.id))
        print(f"✅ Report history loaded successfully")
        return history
    except Exception as e:
        print(f"❌ Error getting report history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/templates")
async def get_report_templates(
    current_user: User = Depends(get_current_active_user)
):
    """Lấy danh sách template báo cáo có sẵn"""
    try:
        print(f"🔵 Getting report templates for user: {current_user.id}")
        templates = await detection_service.get_available_reports(str(current_user.id))
        print(f"✅ Report templates loaded successfully")
        return templates
    except Exception as e:
        print(f"❌ Error getting report templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))