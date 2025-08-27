# SafeFace - Hệ Thống Nhận Diện Khuôn Mặt Thông Minh

![SafeFace Logo](frontend/public/SafeFace.png)

## 🎯 Tổng Quan

SafeFace là một hệ thống nhận diện khuôn mặt thông minh được phát triển với mục tiêu bảo vệ an ninh tổ chức thông qua công nghệ AI tiên tiến. Hệ thống cung cấp khả năng phát hiện và nhận diện khuôn mặt theo thời gian thực, gửi cảnh báo tự động và quản lý dữ liệu một cách hiệu quả.

### ✨ Tính Năng Chính

- 🎥 **Giám Sát Camera Realtime**: Hỗ trợ camera IP (RTSP) và webcam USB
- 🧠 **Nhận Diện Khuôn Mặt AI**: Sử dụng mô hình InsightFace với độ chính xác cao (95%+)
- 📧 **Cảnh Báo Email Tự Động**: Gửi thông báo khi phát hiện người lạ
- 👥 **Quản Lý Người Dùng**: Phân quyền admin/user với giao diện thân thiện
- 📊 **Thống Kê & Báo Cáo**: Dashboard phân tích chi tiết
- ⚡ **Hiệu Suất Cao**: Tối ưu hóa cho xử lý đồng thời nhiều camera
- 🔒 **Bảo Mật**: Mã hóa dữ liệu và xác thực JWT

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **AI/ML**: InsightFace, OpenCV, FAISS
- **Authentication**: JWT Token
- **Email**: SMTP với Gmail

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Tailwind CSS + Shadcn/UI
- **State Management**: Context API
- **Build Tool**: Create React App với Craco
- **Animation**: Framer Motion

## 📋 Yêu Cầu Hệ Thống

### Tối Thiểu
- **OS**: Windows 10/11, Ubuntu 20.04+, macOS 10.15+
- **RAM**: 8GB
- **CPU**: Intel i5 hoặc AMD Ryzen 5
- **Storage**: 10GB trống
- **Python**: 3.8+
- **Node.js**: 16+

### Khuyến Nghị
- **RAM**: 16GB+
- **GPU**: NVIDIA RTX (CUDA support) cho xử lý nhanh hơn
- **Storage**: SSD cho hiệu suất tốt

## 🚀 Hướng Dẫn Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/your-username/SafeFace.git
cd SafeFace
```

### 2. Cài Đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# hoặc
venv\Scripts\activate     # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình environment
cp .env.example .env
# Chỉnh sửa file .env với thông tin cấu hình của bạn
```

### 3. Cấu Hình Database

```bash
# Khởi động MongoDB
sudo service mongod start  # Ubuntu
# hoặc
brew services start mongodb-community  # macOS
```

### 4. Cài Đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file cấu hình
cp .env.example .env
```

### 5. Khởi Động Ứng Dụng

```bash
# Terminal 1: Backend
cd backend
python start_server.py

# Terminal 2: Frontend
cd frontend
npm start
```

Truy cập ứng dụng tại: `http://localhost:3000`

## ⚙️ Cấu Hình

### Backend (.env)

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=SafeFace_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Face Recognition
FACE_SIMILARITY_THRESHOLD=0.6
FACE_DETECTION_THRESHOLD=0.5

# Alerts
ALERT_COOLDOWN_MINUTES=5
MAX_ALERTS_PER_HOUR=20
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_ENV=development
```

## 📚 Hướng Dẫn Sử Dụng

### 1. Đăng Ký Tài Khoản Admin

```bash
cd backend
python -c "
import asyncio
from app.services.auth_service import auth_service
from app.models.user import UserCreate

async def create_admin():
    user_data = UserCreate(
        username='admin',
        email='admin@safeface.com',
        password='admin123',
        full_name='Administrator',
        is_admin=True
    )
    user = await auth_service.create_user(user_data)
    print(f'Admin created: {user.username}')

asyncio.run(create_admin())
"
```

### 2. Thêm Camera

1. Đăng nhập với tài khoản admin
2. Vào **Quản Lý Camera** → **Thêm Camera Mới**
3. Nhập thông tin camera:
   - **Tên**: Tên mô tả camera
   - **URL Stream**: 
     - RTSP: `rtsp://username:password@ip:port/path`
     - HTTP: `http://ip:port/video`
     - Webcam: `0` (cho camera mặc định)

### 3. Thêm Người Quen

1. Vào **Quản Lý Người** → **Thêm Người Mới**
2. Nhập thông tin cá nhân
3. Upload ảnh khuôn mặt (3-10 ảnh khác góc độ)
4. Bấm **Tạo Dữ Liệu Nhận Diện**

### 4. Cấu Hình Email

1. Vào **Cài Đặt** → **Thông Báo**
2. Bật **Gửi Email Cảnh Báo**
3. Cấu hình email nhận thông báo
4. Test email để đảm bảo hoạt động

## 🔧 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### Camera Management

```http
GET /api/cameras/
POST /api/cameras/
PUT /api/cameras/{id}
DELETE /api/cameras/{id}
GET /api/cameras/{id}/stream
```

### Person Management

```http
GET /api/persons/
POST /api/persons/
PUT /api/persons/{id}
DELETE /api/persons/{id}
POST /api/persons/{id}/faces
```

### Detection History

```http
GET /api/detections/history
GET /api/detections/optimized-history
POST /api/detections/cleanup
```

### Notifications

```http
GET /api/notifications/settings
PUT /api/notifications/settings
POST /api/notifications/test-email
```

Tài liệu API chi tiết: `http://localhost:8000/docs`

## 🧪 Testing

### Test Email Notification

```bash
cd backend
python quick_test_email.py
```

### Test Face Recognition

```bash
cd backend
python test_face_recognition.py
```

### Test Camera Connection

```bash
cd backend
python test_camera_setup.py --action test --camera_id your_camera_id
```

## 📊 Tối Ưu Hóa Hiệu Suất

### 1. Cấu Hình GPU (Khuyến Nghị)

```bash
# Kiểm tra GPU
cd backend
python check_gpu.py

# Cài đặt CUDA support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 2. Tối Ưu Database

```bash
# Tạo index cho MongoDB
python -c "
import asyncio
from app.database import get_database

async def create_indexes():
    db = get_database()
    await db.detection_logs.create_index('camera_id')
    await db.detection_logs.create_index('timestamp')
    await db.detection_logs.create_index('detection_type')
    print('Indexes created')

asyncio.run(create_indexes())
"
```

### 3. Cấu Hình Production

```nginx
# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/safeface/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Troubleshooting

### Camera Không Kết Nối

```bash
# Test RTSP URL
ffmpeg -i "rtsp://username:password@ip:port/path" -t 10 -f null -

# Kiểm tra network
ping camera_ip
telnet camera_ip camera_port
```

### Email Không Gửi Được

1. Kiểm tra file `.env` có đúng thông tin SMTP
2. Đảm bảo Gmail App Password được tạo đúng
3. Kiểm tra tường lửa không chặn port 587

```bash
cd backend
python test_anti_spam_email.py
```

### Lỗi Memory

```bash
# Giảm số lượng worker processes
export WORKER_COUNT=2

# Tối ưu face detection
export FACE_DETECTION_THRESHOLD=0.7
export FACE_SIMILARITY_THRESHOLD=0.7
```

## 📈 Roadmap

### Version 2.0
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics Dashboard
- [ ] Multi-tenant Architecture
- [ ] Cloud Storage Integration
- [ ] Advanced AI Models

### Version 2.1
- [ ] Video Analytics
- [ ] Behavior Analysis
- [ ] Integration với hệ thống CCTV hiện có
- [ ] RESTful API cho third-party

## 🤝 Đóng Góp

1. Fork repository
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file LICENSE để biết thêm chi tiết.

## 👥 Tác Giả

- **Tên tác giả** - *Developer* - [GitHub Profile](https://github.com/your-username)

## 🙏 Acknowledgments

- [InsightFace](https://github.com/deepinsight/insightface) - Face Recognition Model
- [FastAPI](https://fastapi.tiangolo.com/) - Backend Framework
- [React](https://reactjs.org/) - Frontend Framework
- [Tailwind CSS](https://tailwindcss.com/) - UI Styling

