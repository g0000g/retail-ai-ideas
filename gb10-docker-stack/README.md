# HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH BỘ DOCKER STACK TRÊN MÁY CHỦ GB10

Bộ tệp cài đặt này được thiết kế theo dạng **One-click Standalone Deployment**, sẵn sàng đóng gói và chạy ngay lập tức trên máy chủ GB10 bằng Docker Compose.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
gb10-docker-stack/
├── docker-compose.yml          # Cấu hình 7 Container Microservices tập trung
├── .env                        # Biến môi trường hệ thống & HF Token
├── setup-gb10.sh               # Script cài đặt & khởi chạy 1-click cho Linux
├── download-models.sh          # Script tải trước (Pre-pull) các mô hình SOTA về ổ đĩa
├── phowhisper-sidecar/         # Service ASR PhoWhisper-large (Python FastAPI + CUDA)
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── backend-spring-boot/        # Master Backend Application (Spring Boot 4.1.0 + Java 21)
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
└── frontend-angular20/         # Web UI Application (Angular 20 Standalone Signals + NGINX)
    ├── package.json
    ├── nginx.conf
    ├── Dockerfile
    └── src/
```

---

## 🤖 CÁC MÔ HÌNH SOTA ĐƯỢC TỰ ĐỘNG TẢI VỀ MÁY CHỦ GB10

Script `download-models.sh` tự động tải 4 mô hình cốt lõi lưu vào thư mục tập trung `/models`:
1. **`Qwen/Qwen2.5-32B-Instruct`** (Phân tích ngôn ngữ, JSON Schema, Tool calling).
2. **`vinai/PhoWhisper-large`** (Nhận diện giọng nói tiếng Việt 63 tỉnh thành).
3. **`amazon/chronos-bolt-small`** (Dự báo lượt khách & doanh số zero-shot).
4. **`BAAI/bge-m3`** (Trích xuất vector embeddings sản phẩm).

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT TRÊN MÁY CHỦ GB10 (3 BƯỚC)

### Bước 1: Sao chép thư mục lên máy chủ GB10
Copy toàn bộ thư mục `gb10-docker-stack` lên máy chủ GB10 qua SCP / SFTP / Git:
```bash
scp -r gb10-docker-stack testingcopilot@103.108.136.158:~/
```

### Bước 2: Phân quyền thực thi script setup
SSH vào máy chủ GB10 và di chuyển vào thư mục:
```bash
cd ~/gb10-docker-stack
chmod +x setup-gb10.sh download-models.sh
```

### Bước 3: Chạy script cài đặt 1-click
```bash
./setup-gb10.sh
```
*(Script sẽ tự động tải trước các mô hình SOTA và kích hoạt toàn bộ 7 container Docker).*

---

## 🌐 CÁC CỔNG DỊCH VỤ SAU KHI KHỞI CHẠY

| Dịch Vụ | Cổng Port | Mô Tả Chức Năng |
| :--- | :--- | :--- |
| **Frontend Web UI** | `http://<GB10-IP>:80` | Giao diện Angular 20 trải nghiệm Kiosk giọng nói & Dashboard |
| **Backend API** | `http://<GB10-IP>:8080` | Enterprise Backend Spring Boot 4.1.0 (Virtual Threads) |
| **Attu Milvus GUI**| `http://<GB10-IP>:8001` | Giao diện Web GUI quản lý Milvus Vector DB (Thay thế DBeaver) |
| **vLLM AI Engine** | `http://<GB10-IP>:8000` | Serving LLM Qwen2.5 / DeepSeek-R1 qua OpenAI API |
| **PhoWhisper ASR** | `http://<GB10-IP>:8090` | Service ASR giọng nói tiếng Việt VinAI PhoWhisper-large |
| **ComfyUI Engine** | `http://<GB10-IP>:8188` | Headless Engine thử đồ ảo CatVTON & Video người ảo LivePortrait |
| **Milvus Vector DB**| `http://<GB10-IP>:19530` | Cơ sở dữ liệu Vector lưu trữ Embeddings sản phẩm |
