import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import faiss
from typing import List, Tuple, Optional
import asyncio
import concurrent.futures
import gc
import torch
import logging

logger = logging.getLogger(__name__)

class FaceProcessorService:
    def __init__(self):
        # Detect available providers and choose the best one
        available_providers = self._get_available_providers()
        logger.info(f"Available providers: {available_providers}")
        
        # Initialize face analysis with GPU if available
        self.face_app = FaceAnalysis(providers=available_providers)
        
        # Use GPU context if CUDA is available, otherwise CPU
        ctx_id = 0 if 'CUDAExecutionProvider' in available_providers else -1
        self.face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))
        
        # Adjust thread pool based on GPU availability
        max_workers = 4 if 'CUDAExecutionProvider' in available_providers else 2
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
        
        logger.info(f"FaceProcessor initialized with providers: {available_providers}")
        logger.info(f"Using context ID: {ctx_id} ({'GPU' if ctx_id >= 0 else 'CPU'})")
    
    def _get_available_providers(self) -> List[str]:
        """Get list of available execution providers, prioritizing GPU"""
        providers = []
        
        # Try to use CUDA if available
        try:
            import onnxruntime as ort
            available = ort.get_available_providers()
            
            if 'CUDAExecutionProvider' in available:
                providers.append('CUDAExecutionProvider')
                logger.info("✅ CUDA GPU support detected")
            elif 'DmlExecutionProvider' in available:
                providers.append('DmlExecutionProvider')
                logger.info("✅ DirectML GPU support detected")
            
            providers.append('CPUExecutionProvider')
            
        except Exception as e:
            logger.warning(f"Error detecting GPU providers: {e}")
            providers = ['CPUExecutionProvider']
        
        return providers

    def cleanup(self):
        """Giải phóng tài nguyên"""
        try:
            if hasattr(self, 'face_app'):
                del self.face_app
            if hasattr(self, 'executor'):
                self.executor.shutdown(wait=True)
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except:
            pass

    async def extract_face_embedding(self, image_data: bytes) -> Optional[np.ndarray]:
        """Trích xuất embedding từ ảnh"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, 
            self._extract_face_embedding_sync, 
            image_data
        )

    def _extract_face_embedding_sync(self, image_data: bytes) -> Optional[np.ndarray]:
        """Trích xuất embedding (sync version)"""
        try:
            print(f"🔵 FaceProcessor: Starting face embedding extraction, data size: {len(image_data)}")
            
            # Decode image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                print("❌ FaceProcessor: Failed to decode image")
                return None
            
            print(f"🔵 FaceProcessor: Image decoded successfully, shape: {img.shape}")

            faces = self.face_app.get(img)
            print(f"🔵 FaceProcessor: Detected {len(faces)} faces")
            
            if not faces:
                print("❌ FaceProcessor: No faces detected in image")
                return None

            # Lấy face có độ tin cậy cao nhất
            face = max(faces, key=lambda x: x.det_score)
            print(f"✅ FaceProcessor: Selected face with confidence: {face.det_score}")
            print(f"✅ FaceProcessor: Face embedding shape: {face.embedding.shape}")
            
            return face.embedding
        except Exception as e:
            print(f"❌ FaceProcessor: Error extracting face embedding: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def detect_faces_in_frame(self, frame: np.ndarray) -> List[dict]:
        """Phát hiện khuôn mặt trong frame"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self._detect_faces_sync,
            frame
        )

    def _detect_faces_sync(self, frame: np.ndarray) -> List[dict]:
        """Phát hiện khuôn mặt (sync version)"""
        try:
            faces = self.face_app.get(frame)
            result = []
            for face in faces:
                result.append({
                    'bbox': face.bbox.tolist(),
                    'embedding': face.embedding,
                    'confidence': float(face.det_score)
                })
            return result
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []

    async def detect_and_recognize_faces(self, frame: np.ndarray, known_persons: List[dict] = None) -> List[dict]:
        """Phát hiện và nhận dạng khuôn mặt trong frame cho streaming - dựa theo code mẫu"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self._detect_and_recognize_sync,
            frame,
            known_persons or []
        )

    def _detect_and_recognize_sync(self, frame: np.ndarray, known_persons: List[dict]) -> List[dict]:
        """Phát hiện và nhận dạng khuôn mặt (sync version) - tương tự code mẫu"""
        try:
            # Phát hiện khuôn mặt giống như code mẫu
            faces = self.face_app.get(frame)
            result = []
            
            # Tạo FAISS index từ known_persons nếu có
            face_db = []
            names = []
            
            for person in known_persons:
                if 'embeddings' in person and person['embeddings']:
                    person_name = person['name']
                    # Đảm bảo name là UTF-8 string đúng
                    if isinstance(person_name, bytes):
                        person_name = person_name.decode('utf-8')
                    elif not isinstance(person_name, str):
                        person_name = str(person_name)
                        
                    for embedding in person['embeddings']:
                        face_db.append(embedding)
                        names.append(person_name)
            
            # Chuyển sang numpy array để dùng với FAISS như code mẫu
            if face_db:
                face_db_array = np.array(face_db).astype('float32')
                
                # Tạo FAISS index
                index = faiss.IndexFlatIP(face_db_array.shape[1])
                # Chuẩn hóa vector về unit vector để dùng cosine similarity
                faiss.normalize_L2(face_db_array)
                index.add(face_db_array)
            else:
                index = None
            
            # Xử lý từng khuôn mặt được phát hiện
            for face in faces:
                # Lấy bounding box giống code mẫu
                x1, y1, x2, y2 = map(int, face.bbox)
                bbox = [x1, y1, x2 - x1, y2 - y1]  # [x, y, width, height]
                
                # Nhận dạng khuôn mặt giống code mẫu
                name = self._get_face_name(face.embedding, index, names)
                
                detection = {
                    'bbox': bbox,
                    'confidence': float(face.det_score),
                    'person_id': None,
                    'person_name': name,
                    'recognition_confidence': 0.0,
                    'is_new_detection': False
                }
                
                # Nếu là người đã biết, tìm person_id
                if name != "Unknown":
                    for person in known_persons:
                        if person['name'] == name:
                            detection['person_id'] = person['id']
                            detection['is_new_detection'] = True
                            break
                
                result.append(detection)
            
            return result
            
        except Exception as e:
            print(f"Error detecting and recognizing faces: {e}")
            return []

    def _get_face_name(self, face_embedding, index, names, recognition_threshold=0.6):
        """Nhận dạng tên khuôn mặt - tương tự code mẫu"""
        if index is None or len(names) == 0:
            return "Unknown"
        
        try:
            # Chuẩn hóa embedding giống code mẫu
            embedding = face_embedding.astype('float32').reshape(1, -1)
            faiss.normalize_L2(embedding)
            
            # Tìm vector gần nhất
            D, I = index.search(embedding, 1)
            max_similarity = D[0][0]
            max_index = I[0][0]
            
            if max_similarity > recognition_threshold:
                recognized_name = names[max_index]
                # Đảm bảo name là UTF-8 string đúng
                if isinstance(recognized_name, bytes):
                    recognized_name = recognized_name.decode('utf-8')
                elif not isinstance(recognized_name, str):
                    recognized_name = str(recognized_name)
                return recognized_name
            return "Unknown"
        except Exception as e:
            print(f"Error in face recognition: {e}")
            return "Unknown"

    def _calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Tính toán độ tương đồng giữa hai embeddings"""
        try:
            # Normalize embeddings
            emb1 = embedding1 / np.linalg.norm(embedding1)
            emb2 = embedding2 / np.linalg.norm(embedding2)
            
            # Calculate cosine similarity
            similarity = np.dot(emb1, emb2)
            return float(similarity)
        except:
            return 0.0

# Global instance
face_processor = FaceProcessorService()
import atexit
atexit.register(face_processor.cleanup)