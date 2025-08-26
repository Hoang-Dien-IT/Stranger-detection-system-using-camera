import cv2
import asyncio
import numpy as np
from typing import Optional, Dict, AsyncGenerator, List
from ..services.camera_service import CameraService
from ..services.person_service import PersonService
from ..services.face_processor import face_processor
import logging


class StreamService:
    def __init__(self):
        self.active_streams: Dict[str, bool] = {}
        self.camera_captures: Dict[str, cv2.VideoCapture] = {}
    
    async def start_camera_stream(self, camera_id: str, user_id: str) -> bool:
        """Start camera streaming"""
        try:
            camera = await CameraService.get_camera(camera_id, user_id)
            if not camera:
                return False
            
            # Initialize camera capture
            if camera.camera_type == "webcam":
                cap = cv2.VideoCapture(int(camera.camera_url) if camera.camera_url.isdigit() else 0)
            else:
                # IP Camera
                cap = cv2.VideoCapture(camera.camera_url)
            
            if not cap.isOpened():
                return False
            
            self.camera_captures[camera_id] = cap
            self.active_streams[camera_id] = True
            
            return True
        except Exception as e:
            logging.error(f"Error starting camera stream: {e}")
            return False
    
    async def stop_camera_stream(self, camera_id: str) -> bool:
        """Stop camera streaming"""
        try:
            if camera_id in self.active_streams:
                self.active_streams[camera_id] = False
            
            if camera_id in self.camera_captures:
                self.camera_captures[camera_id].release()
                del self.camera_captures[camera_id]
            
            return True
        except Exception as e:
            logging.error(f"Error stopping camera stream: {e}")
            return False
    
    async def get_camera_frame(self, camera_id: str) -> Optional[np.ndarray]:
        """Get single frame from camera"""
        try:
            if camera_id not in self.camera_captures:
                return None
            
            cap = self.camera_captures[camera_id]
            ret, frame = cap.read()
            
            if ret:
                return frame
            return None
        except Exception as e:
            logging.error(f"Error getting camera frame: {e}")
            return None
    
    async def process_frame_for_recognition(
        self, 
        frame: np.ndarray, 
        user_id: str
    ) -> List[dict]:
        """Process frame for face recognition"""
        try:
            # Detect faces in frame
            faces = await face_processor.detect_faces_in_frame(frame)
            
            if not faces:
                return []
            
            # Get user's known persons embeddings
            known_embeddings = await PersonService.get_user_face_embeddings(user_id)
            
            if not known_embeddings:
                # No known persons, all faces are unknown
                return [{
                    "type": "unknown_person",
                    "confidence": face["confidence"],
                    "bbox": face["bbox"],
                    "person_name": "Unknown"
                } for face in faces]
            
            # Create FAISS index for known persons
            embeddings_list = [np.array(item["embedding"]) for item in known_embeddings]
            index = face_processor.create_face_index(embeddings_list)
            
            results = []
            for face in faces:
                # Search for similar face
                is_known, similarity = face_processor.search_similar_face(
                    np.array(face["embedding"]), 
                    index, 
                    threshold=0.6
                )
                
                if is_known:
                    # Find the person with highest similarity
                    best_match_idx = 0
                    for i, emb in enumerate(embeddings_list):
                        _, sim = face_processor.search_similar_face(
                            np.array(face["embedding"]), 
                            face_processor.create_face_index([emb])
                        )
                        if sim > similarity:
                            similarity = sim
                            best_match_idx = i
                    
                    results.append({
                        "type": "known_person",
                        "person_id": known_embeddings[best_match_idx]["person_id"],
                        "person_name": known_embeddings[best_match_idx]["person_name"],
                        "confidence": similarity,
                        "bbox": face["bbox"]
                    })
                else:
                    results.append({
                        "type": "unknown_person",
                        "confidence": face["confidence"],
                        "bbox": face["bbox"],
                        "person_name": "Unknown"
                    })
            
            return results
            
        except Exception as e:
            logging.error(f"Error processing frame: {e}")
            return []

# Global instance
stream_service = StreamService()