from typing import Dict, Any, List, Optional
from .websocket_manager import websocket_manager
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import json
import httpx
from datetime import datetime, timedelta
from ..config import get_settings
from ..database import get_database
from ..utils.timezone_utils import vietnam_now
from bson import ObjectId
import asyncio
import os
import base64

class NotificationService:
    def __init__(self):
        self.settings = get_settings()
        self.alert_cooldown: Dict[str, datetime] = {}  # Prevent spam alerts
        
    async def send_stranger_alert_with_frame_analysis(self, user_id: str, camera_id: str, 
                                                     all_detections: List[Dict[str, Any]], 
                                                     image_data: bytes = None):
        """
        Gửi cảnh báo phát hiện người lạ dựa trên phân tích toàn bộ khung hình
        Chỉ gửi nếu trong khung hình chỉ có người lạ (không có người quen)
        """
        try:
            # Phân tích các detection trong khung hình
            stranger_detections = []
            known_person_detections = []
            
            for detection in all_detections:
                if detection.get('detection_type') == 'stranger':
                    stranger_detections.append(detection)
                elif detection.get('detection_type') == 'known_person':
                    known_person_detections.append(detection)
            
            # Chỉ gửi cảnh báo nếu có người lạ NHƯNG KHÔNG có người quen
            if stranger_detections and not known_person_detections:
                print(f"🚨 ALERT CONDITION MET: Only strangers detected in frame!")
                print(f"   - Strangers: {len(stranger_detections)}")
                print(f"   - Known persons: {len(known_person_detections)}")
                
                # Check cooldown to prevent spam
                cooldown_key = f"{user_id}_{camera_id}_stranger_only"
                last_alert = self.alert_cooldown.get(cooldown_key)
                
                if last_alert and vietnam_now() - last_alert < timedelta(minutes=5):
                    print(f"[COOLDOWN] Alert cooldown active for {cooldown_key}")
                    return
                
                # Get camera info
                camera_info = await self._get_camera_info(camera_id)
                
                # Prepare alert data
                alert_data = {
                    "type": "stranger_only_alert",
                    "severity": "high",
                    "title": "⚠️ NGƯỜI LẠ PHÁT HIỆN",
                    "message": f"Phát hiện {len(stranger_detections)} người lạ tại {camera_info.get('name', 'Camera')} (không có người quen)",
                    "stranger_count": len(stranger_detections),
                    "known_person_count": len(known_person_detections),
                    "detections": stranger_detections,
                    "camera_info": camera_info,
                    "timestamp": vietnam_now().isoformat(),
                    "action_required": True,
                    "alert_id": f"stranger_alert_{int(vietnam_now().timestamp())}"
                }
                
                # Send WebSocket notification (real-time)
                await websocket_manager.send_detection_alert(user_id, alert_data)
                
                # Get user notification preferences
                user_settings = await self._get_user_notification_settings(user_id)
                
                # Send email if enabled
                if user_settings.get("email_alerts", True):
                    await self._send_stranger_email_with_image(user_id, alert_data, image_data)
                
                # Send webhook if configured
                if user_settings.get("webhook_url"):
                    await self._send_webhook_alert(user_settings["webhook_url"], alert_data)
                
                # Update cooldown
                self.alert_cooldown[cooldown_key] = vietnam_now()
                
                print(f"[SUCCESS] Stranger-only alert sent for user {user_id}")
                
            else:
                if known_person_detections:
                    print(f"ℹ️ No alert sent: Known persons present in frame ({len(known_person_detections)} known, {len(stranger_detections)} strangers)")
                elif not stranger_detections:
                    print(f"ℹ️ No alert sent: No strangers detected")
            
        except Exception as e:
            print(f"[ERROR] Error sending stranger frame analysis alert: {e}")
            import traceback
            traceback.print_exc()
        
    async def send_stranger_alert(self, user_id: str, detection_data: Dict[str, Any]):
        """Gửi cảnh báo phát hiện người lạ"""
        try:
            # Check cooldown to prevent spam
            cooldown_key = f"{user_id}_{detection_data.get('camera_id', '')}_stranger"
            last_alert = self.alert_cooldown.get(cooldown_key)
            
            if last_alert and vietnam_now() - last_alert < timedelta(minutes=5):
                print(f"[COOLDOWN] Alert cooldown active for {cooldown_key}")
                return
            
            # Prepare alert data
            alert_data = {
                "type": "stranger_alert",
                "severity": "high",
                "title": "STRANGER DETECTED",
                "message": f"Unknown person detected at {detection_data.get('camera_name', 'Camera')}",
                "detection_data": detection_data,
                "timestamp": datetime.utcnow().isoformat(),
                "action_required": True,
                "alert_id": f"alert_{int(datetime.utcnow().timestamp())}"
            }
            
            # Send WebSocket notification (real-time)
            await websocket_manager.send_detection_alert(user_id, alert_data)
            
            # Get user notification preferences
            user_settings = await self._get_user_notification_settings(user_id)
            
            # Send email if enabled
            if user_settings.get("email_alerts", True):
                await self._send_email_alert(user_id, alert_data)
            
            # Send webhook if configured
            if user_settings.get("webhook_url"):
                await self._send_webhook_alert(user_settings["webhook_url"], alert_data)
            
            # Update cooldown
            self.alert_cooldown[cooldown_key] = datetime.utcnow()
            
            print(f"[SUCCESS] Stranger alert sent for user {user_id}")
            
        except Exception as e:
            print(f"[ERROR] Error sending stranger alert: {e}")

    async def send_known_person_notification(self, user_id: str, detection_data: Dict[str, Any]):
        """Gửi thông báo phát hiện người quen"""
        try:
            alert_data = {
                "type": "known_person_detected",
                "severity": "info",
                "title": "Known Person Detected",
                "message": f"{detection_data.get('person_name', 'Known Person')} detected at {detection_data.get('camera_name', 'Camera')}",
                "detection_data": detection_data,
                "timestamp": datetime.utcnow().isoformat(),
                "action_required": False
            }
            
            # Send WebSocket notification
            await websocket_manager.send_detection_alert(user_id, alert_data)
            
            # Optional: Send email for known person (usually disabled)
            user_settings = await self._get_user_notification_settings(user_id)
            if user_settings.get("notify_known_persons", False):
                await self._send_email_alert(user_id, alert_data)
            
        except Exception as e:
            print(f"[ERROR] Error sending known person notification: {e}")

    async def _send_stranger_email_with_image(self, user_id: str, alert_data: Dict[str, Any], image_data: bytes = None):
        """Gửi email cảnh báo người lạ với hình ảnh đính kèm"""
        try:
            user_email = await self._get_user_email(user_id)
            if not user_email:
                print(f"[WARNING] No email found for user {user_id}")
                return
            
            if not self.settings.smtp_username or not self.settings.smtp_password:
                print("[WARNING] SMTP credentials not configured")
                return
            
            # Create email content
            subject = f"🚨 Cảnh báo an ninh - {alert_data['title']}"
            
            # Prepare detection details
            stranger_count = alert_data.get('stranger_count', 0)
            camera_name = alert_data.get('camera_info', {}).get('name', 'Camera không xác định')
            timestamp = datetime.fromisoformat(alert_data['timestamp'].replace('Z', '+00:00'))
            formatted_time = timestamp.strftime("%d/%m/%Y lúc %H:%M:%S")
            
            stranger_details = ""
            if alert_data.get('detections'):
                for i, detection in enumerate(alert_data['detections'][:5]):  # Limit to 5 detections
                    confidence = detection.get('confidence', 0) * 100
                    stranger_details += f"    • Người lạ #{i+1}: Độ tin cậy {confidence:.1f}%\n"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }}
                    .header {{ background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; }}
                    .header h1 {{ margin: 0; font-size: 24px; font-weight: bold; }}
                    .alert-icon {{ font-size: 48px; margin-bottom: 10px; }}
                    .content {{ padding: 30px; }}
                    .alert-box {{ background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                    .detail-section {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; }}
                    .detail-title {{ font-weight: bold; color: #495057; margin-bottom: 10px; font-size: 16px; }}
                    .detail-content {{ color: #6c757d; line-height: 1.6; }}
                    .timestamp {{ color: #6c757d; font-size: 14px; font-style: italic; }}
                    .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #dee2e6; }}
                    .urgent {{ color: #dc3545; font-weight: bold; }}
                    .image-note {{ background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 15px 0; color: #0c5460; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="alert-icon">🚨</div>
                        <h1>CẢNH BÁO AN NINH</h1>
                        <p class="timestamp">Ngày {formatted_time}</p>
                    </div>
                    
                    <div class="content">
                        <div class="alert-box">
                            <h2 class="urgent">⚠️ PHÁT HIỆN NGƯỜI LẠ</h2>
                            <p><strong>Tình huống:</strong> Hệ thống đã phát hiện <strong>{stranger_count} người lạ</strong> tại camera <strong>{camera_name}</strong> mà không có người quen nào trong khung hình.</p>
                        </div>
                        
                        <div class="detail-section">
                            <div class="detail-title">📍 Thông tin chi tiết:</div>
                            <div class="detail-content">
                                <p><strong>📹 Camera:</strong> {camera_name}</p>
                                <p><strong>🕒 Thời gian:</strong> {formatted_time}</p>
                                <p><strong>👥 Số người lạ:</strong> {stranger_count}</p>
                                <p><strong>✅ Người quen:</strong> Không có</p>
                            </div>
                        </div>
                        
                        {f'''
                        <div class="detail-section">
                            <div class="detail-title">🔍 Chi tiết phát hiện:</div>
                            <div class="detail-content">
                                <pre>{stranger_details}</pre>
                            </div>
                        </div>
                        ''' if stranger_details else ''}
                        
                        {'''
                        <div class="image-note">
                            <strong>📸 Hình ảnh:</strong> Hình ảnh hiện trường đã được đính kèm trong email này để bạn có thể xem chi tiết.
                        </div>
                        ''' if image_data else ''}
                        
                        <div class="alert-box">
                            <p class="urgent"><strong>🎯 Hành động cần thiết:</strong></p>
                            <p>Vui lòng kiểm tra camera ngay lập tức và thực hiện các biện pháp an ninh cần thiết.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>📱 Đây là cảnh báo tự động từ Hệ thống Nhận diện Khuôn mặt SafeFace.</p>
                        <p>🌐 Đăng nhập vào bảng điều khiển để xem thêm chi tiết và hình ảnh đã lưu.</p>
                        <p>⚙️ Bạn có thể thay đổi cài đặt thông báo trong phần cài đặt tài khoản.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email with attachment
            await self._send_email_with_image(user_email, subject, html_content, image_data)
            
        except Exception as e:
            print(f"[ERROR] Error sending stranger email with image: {e}")
            import traceback
            traceback.print_exc()

    async def _send_email_with_image(self, to_email: str, subject: str, html_content: str, image_data: bytes = None):
        """Send email with image attachment using aiosmtplib"""
        try:
            # Create message
            message = MIMEMultipart("mixed")
            message["Subject"] = subject
            message["From"] = self.settings.smtp_username
            message["To"] = to_email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html", "utf-8")
            message.attach(html_part)
            
            # Add image attachment if provided
            if image_data:
                try:
                    img_attachment = MIMEImage(image_data)
                    img_attachment.add_header(
                        'Content-Disposition',
                        'attachment',
                        filename=f'stranger_detection_{int(datetime.utcnow().timestamp())}.jpg'
                    )
                    message.attach(img_attachment)
                    print(f"📎 Image attachment added to email ({len(image_data)} bytes)")
                except Exception as img_error:
                    print(f"⚠️ Warning: Could not attach image: {img_error}")
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.settings.smtp_server,
                port=self.settings.smtp_port,
                start_tls=True,
                username=self.settings.smtp_username,
                password=self.settings.smtp_password,
                timeout=30
            )
            
            print(f"[SUCCESS] Email with image sent to {to_email}")
            
        except Exception as e:
            print(f"[ERROR] Error sending email with image: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to sending email without image
            try:
                await self._send_email(to_email, subject, html_content)
                print(f"[FALLBACK] Email sent without image to {to_email}")
            except Exception as fallback_error:
                print(f"[ERROR] Fallback email also failed: {fallback_error}")

    async def _send_email_alert(self, user_id: str, alert_data: Dict[str, Any]):
        """Gửi email alert với HTML template - Compatible với mọi loại alert_data"""
        try:
            user_email = await self._get_user_email(user_id)
            if not user_email:
                print(f"[WARNING] No email found for user {user_id}")
                return
            
            if not self.settings.smtp_username or not self.settings.smtp_password:
                print("[WARNING] SMTP credentials not configured")
                return
            
            # Create email content
            subject = f"Security Alert - {alert_data['title']}"
            
            # Get camera name from different possible sources
            camera_name = "Unknown"
            if alert_data.get('camera_info', {}).get('name'):
                camera_name = alert_data['camera_info']['name']
            elif alert_data.get('detection_data', {}).get('camera_name'):
                camera_name = alert_data['detection_data']['camera_name']
            
            # Get detection type
            detection_type = alert_data.get('type', alert_data.get('detection_data', {}).get('detection_type', 'Unknown'))
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ background-color: {'#dc3545' if alert_data.get('severity') == 'high' else '#007bff'}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                    .content {{ padding: 20px 0; }}
                    .detail-box {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }}
                    .footer {{ text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }}
                    .timestamp {{ color: #6c757d; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>{alert_data['title']}</h2>
                        <p class="timestamp">{alert_data['timestamp']}</p>
                    </div>
                    
                    <div class="content">
                        <p><strong>Alert:</strong> {alert_data['message']}</p>
                        
                        <div class="detail-box">
                            <h4>Detection Details:</h4>
                            <p><strong>Camera:</strong> {camera_name}</p>
                            <p><strong>Detection Type:</strong> {detection_type}</p>
                            <p><strong>Severity:</strong> {alert_data.get('severity', 'Unknown')}</p>
                            {f"<p><strong>Stranger Count:</strong> {alert_data.get('stranger_count', 'N/A')}</p>" if alert_data.get('stranger_count') is not None else ""}
                            {f"<p><strong>Known Persons:</strong> {alert_data.get('known_person_count', 'N/A')}</p>" if alert_data.get('known_person_count') is not None else ""}
                        </div>
                        
                        {f'<p style="color: red;"><strong>Action Required:</strong> Please check your camera feed immediately.</p>' if alert_data.get('action_required') else ''}
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated alert from your Face Recognition Security System.</p>
                        <p>Log in to your dashboard to view more details and captured images.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email
            await self._send_email(user_email, subject, html_content)
            
        except Exception as e:
            print(f"[ERROR] Error sending email alert: {e}")

    async def _send_email(self, to_email: str, subject: str, html_content: str):
        """Send email using aiosmtplib"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.settings.smtp_username
            message["To"] = to_email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.settings.smtp_server,
                port=self.settings.smtp_port,
                start_tls=True,
                username=self.settings.smtp_username,
                password=self.settings.smtp_password,
                timeout=30
            )
            
            print(f"[SUCCESS] Email sent to {to_email}")
            
        except Exception as e:
            print(f"[ERROR] Error sending email: {e}")

    async def _send_webhook_alert(self, webhook_url: str, alert_data: Dict[str, Any]):
        """Send webhook notification"""
        try:
            webhook_payload = {
                "event": "face_detection_alert",
                "data": alert_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=webhook_payload,
                    timeout=10.0,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print(f"[SUCCESS] Webhook sent successfully to {webhook_url}")
                else:
                    print(f"[WARNING] Webhook failed with status {response.status_code}")
                    
        except Exception as e:
            print(f"[ERROR] Error sending webhook: {e}")

    async def _get_user_notification_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user notification preferences"""
        try:
            db = get_database()
            settings = await db.user_settings.find_one({"user_id": ObjectId(user_id)})
            
            return {
                "email_alerts": settings.get("email_alerts", True) if settings else True,
                "stranger_only_alerts": settings.get("stranger_only_alerts", True) if settings else True,
                "webhook_url": settings.get("webhook_url") if settings else None,
                "notify_known_persons": settings.get("notify_known_persons", False) if settings else False,
                "alert_cooldown": settings.get("alert_cooldown", 300) if settings else 300
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting user notification settings: {e}")
            return {
                "email_alerts": True, 
                "stranger_only_alerts": True,
                "webhook_url": None, 
                "notify_known_persons": False, 
                "alert_cooldown": 300
            }

    async def _get_user_email(self, user_id: str) -> Optional[str]:
        """Get user email address"""
        try:
            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            return user.get("email") if user else None
            
        except Exception as e:
            print(f"[ERROR] Error getting user email: {e}")
            return None

    async def _get_camera_info(self, camera_id: str) -> Dict[str, Any]:
        """Get camera information"""
        try:
            db = get_database()
            camera = await db.cameras.find_one({"_id": ObjectId(camera_id)})
            
            if camera:
                return {
                    "id": str(camera["_id"]),
                    "name": camera.get("name", "Camera không xác định"),
                    "camera_type": camera.get("camera_type", "unknown"),
                    "location": camera.get("location", ""),
                    "description": camera.get("description", "")
                }
            else:
                return {
                    "id": camera_id,
                    "name": "Camera không xác định",
                    "camera_type": "unknown",
                    "location": "",
                    "description": ""
                }
                
        except Exception as e:
            print(f"[ERROR] Error getting camera info: {e}")
            return {
                "id": camera_id,
                "name": "Camera không xác định",
                "camera_type": "unknown",
                "location": "",
                "description": ""
            }

    async def send_system_notification(self, user_id: str, message: str, notification_type: str = "info"):
        """Send system notification"""
        try:
            notification_data = {
                "type": "system_notification",
                "notification_type": notification_type,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await websocket_manager.send_personal_message(
                json.dumps(notification_data), 
                user_id
            )
        except Exception as e:
            print(f"[ERROR] Error sending system notification: {e}")

    async def test_email_configuration(self, user_id: str) -> Dict[str, Any]:
        """Test email configuration by sending a test email"""
        try:
            user_email = await self._get_user_email(user_id)
            if not user_email:
                return {"success": False, "error": "No email found for user"}
            
            if not self.settings.smtp_username or not self.settings.smtp_password:
                return {"success": False, "error": "SMTP credentials not configured"}
            
            # Send test email
            subject = "🧪 Test Email - SafeFace Security System"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ background-color: #28a745; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }}
                    .content {{ padding: 20px 0; }}
                    .footer {{ text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>✅ Email Configuration Test</h2>
                    </div>
                    <div class="content">
                        <p>Congratulations! Your email notification system is working correctly.</p>
                        <p><strong>Test time:</strong> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")}</p>
                        <p>You will now receive security alerts when strangers are detected by your cameras.</p>
                    </div>
                    <div class="footer">
                        <p>SafeFace Security System - Email Test</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            await self._send_email(user_email, subject, html_content)
            
            return {"success": True, "message": f"Test email sent to {user_email}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Global instance
notification_service = NotificationService()
