from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from ..models.known_person import KnownPersonCreate, KnownPersonUpdate, KnownPersonResponse, AddFaceImageRequest
from ..models.user import User
from ..services.person_service import person_service
from ..services.auth_service import get_current_active_user

router = APIRouter(prefix="/persons", tags=["persons"])

@router.post("/", response_model=KnownPersonResponse)
async def create_person(
    person_data: KnownPersonCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Tạo known person mới"""
    try:
        print(f"🔵 Creating person for user: {current_user.id}")
        print(f"🔵 Person data received: {person_data}")
        
        # ✅ FIX: Correct parameter order - person_data first, user_id second
        person = await person_service.create_person(person_data, str(current_user.id))
        
        print(f"✅ Person created successfully: {person.id}")
        return person
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error creating person: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create person: {str(e)}")


# ✅ MAIN ROUTE - với trailing slash
@router.get("/", response_model=List[KnownPersonResponse])
async def get_persons(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_active_user)
):
    """Lấy danh sách known persons"""
    try:
        print(f"🔵 Getting persons for user: {current_user.id}, include_inactive: {include_inactive}")
        # ✅ FIX: Use correct method name
        persons = await person_service.get_persons_by_user(str(current_user.id), include_inactive)
        print(f"✅ Found {len(persons)} persons")
        return persons
    except Exception as e:
        print(f"❌ Error getting persons: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get persons")
    
    
# ... (rest of the person endpoints với dependency get_current_active_user)
@router.get("/{person_id}", response_model=KnownPersonResponse)
async def get_person(
    person_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lấy person details với face images"""
    try:
        person = await person_service.get_person_by_id(person_id, str(current_user.id))
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        return person
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting person: {e}")
        raise HTTPException(status_code=500, detail="Failed to get person")

@router.put("/{person_id}", response_model=KnownPersonResponse)
async def update_person(
    person_id: str,
    person_data: KnownPersonUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Cập nhật person"""
    try:
        # ✅ FIX: Validate ObjectId format
        try:
            ObjectId(person_id)
        except Exception:
            print(f"❌ Router: Invalid ObjectId format: {person_id}")
            raise HTTPException(status_code=400, detail="Invalid person ID format")
        
        print(f"🔵 Router: Updating person {person_id} for user {current_user.id}")
        print(f"🔵 Router: Update data: {person_data}")
        
        # ✅ FIX: Correct parameter order
        person = await person_service.update_person(person_id, str(current_user.id), person_data)
        
        if not person:
            print(f"❌ Router: Person {person_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Person not found or access denied")
            
        print(f"✅ Router: Person updated successfully")
        return person
    except HTTPException:
        raise
    except ValueError as e:
        print(f"❌ Router: Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Router: Error updating person: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update person")

@router.delete("/{person_id}")
async def delete_person(
    person_id: str,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Xóa person"""
    try:
        success = await person_service.delete_person(person_id, str(current_user.id), hard_delete)
        if not success:
            raise HTTPException(status_code=404, detail="Person not found")
        return {"message": "Person deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting person: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete person")

@router.post("/{person_id}/faces")
async def add_face_image(
    person_id: str,
    face_data: AddFaceImageRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Thêm ảnh khuôn mặt cho person"""
    try:
        print(f"🔵 Add face image - Person ID: {person_id}")
        print(f"🔵 Add face image - User ID: {current_user.id}")
        print(f"🔵 Add face image - Image base64 length: {len(face_data.image_base64)}")
        print(f"🔵 Add face image - Image base64 preview: {face_data.image_base64[:50]}...")
        
        result = await person_service.add_face_image(
            person_id, 
            face_data.image_base64, 
            str(current_user.id)
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error adding face image: {e}")
        raise HTTPException(status_code=500, detail="Failed to add face image")

@router.post("/{person_id}/upload-image")
async def upload_face_image(
    person_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload ảnh khuôn mặt từ file"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        content = await file.read()
        
        # Convert to base64
        import base64
        image_base64 = base64.b64encode(content).decode('utf-8')
        
        result = await person_service.add_face_image(
            person_id, 
            image_base64, 
            str(current_user.id)
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading face image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload face image")

@router.post("/{person_id}/regenerate-embeddings")
async def regenerate_face_embeddings(
    person_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Regenerate face embeddings cho tất cả face images"""
    try:
        result = await person_service.regenerate_face_embeddings(
            person_id, 
            str(current_user.id)
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error regenerating face embeddings: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate face embeddings")

@router.delete("/{person_id}/faces/{image_index}")
async def remove_face_image(
    person_id: str,
    image_index: int,
    current_user: User = Depends(get_current_active_user)
):
    """Xóa ảnh khuôn mặt theo index"""
    try:
        success = await person_service.remove_face_image(
            person_id, 
            image_index, 
            str(current_user.id)
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Face image not found or invalid index")
        
        return {"message": "Face image removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error removing face image: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove face image")

@router.post("/{person_id}/validate")
async def validate_face_images(
    person_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Validate tất cả face images của person"""
    try:
        result = await person_service.validate_face_images(person_id, str(current_user.id))
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error validating face images: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate face images")

@router.get("/{person_id}/check-minimum")
async def check_minimum_face_images(
    person_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Kiểm tra xem person có đủ tối thiểu 8 ảnh khuôn mặt không"""
    try:
        result = await person_service.check_minimum_face_images(person_id, str(current_user.id))
        return result
    except Exception as e:
        print(f"❌ Error checking minimum face images: {e}")
        raise HTTPException(status_code=500, detail="Failed to check minimum face images")
    
@router.post("/bulk-import")
async def bulk_import_persons(
    request: Dict[str, List[Dict[str, Any]]],
    current_user: User = Depends(get_current_active_user)
):
    """Bulk import persons từ JSON data"""
    try:
        print(f"🔵 Bulk import request for user: {current_user.id}")
        
        persons_data = request.get("persons", [])
        if not persons_data:
            raise HTTPException(status_code=400, detail="No persons data provided")
        
        print(f"🔵 Importing {len(persons_data)} persons")
        
        result = await person_service.bulk_import_persons(persons_data, str(current_user.id))
        
        print(f"✅ Bulk import completed: {result}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in bulk import: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Bulk import failed: {str(e)}")
    
# ✅ Add test endpoint for verification
@router.get("/bulk-import/test")
async def test_bulk_import(
    current_user: User = Depends(get_current_active_user)
):
    """Test endpoint để kiểm tra bulk import có hoạt động không"""
    try:
        return {
            "status": "success",
            "message": "Bulk import endpoint is accessible",
            "user_id": str(current_user.id),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))