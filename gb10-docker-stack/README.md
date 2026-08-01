# HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH BỘ DOCKER STACK TRÊN MÁY CHỦ GB10

Bộ tệp cài đặt này được thiết kế theo dạng **One-click Standalone Deployment**, sẵn sàng đóng gói và chạy ngay lập tức trên máy chủ GB10 bằng Docker Compose.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
gb10-docker-stack/
├── docker-compose.yml          # Cấu hình 6 Container Microservices tập trung
├── .env                        # Biến môi trường hệ thống & HF Token
├── setup-gb10.sh               # Script cài đặt & khởi chạy 1-click cho Linux
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
chmod +x setup-gb10.sh
```

### Bước 3: Chạy script cài đặt 1-click
```bash
./setup-gb10.sh
```

---

## 🌐 CÁC CỔNG DỊCH VỤ SAU KHI KHỞI CHẠY

| Dịch Vụ | Cổng Port | Mô Tả Chức Năng |
| :--- | :--- | :--- |
| **Frontend Web UI** | `http://<GB10-IP>:80` | Giao diện Angular 20 trải nghiệm Kiosk giọng nói & Dashboard |
| **Backend API** | `http://<GB10-IP>:8080` | Enterprise Backend Spring Boot 4.1.0 (Virtual Threads) |
| **vLLM AI Engine** | `http://<GB10-IP>:8000` | Serving LLM Qwen2.5 / DeepSeek-R1 qua OpenAI API |
| **PhoWhisper ASR** | `http://<GB10-IP>:8090` | Service ASR giọng nói tiếng Việt VinAI PhoWhisper-large |
| **ComfyUI Engine** | `http://<GB10-IP>:8188` | Headless Engine thử đồ ảo CatVTON & Video người ảo LivePortrait |
| **Milvus Vector DB**| `http://<GB10-IP>:19530` | Cơ sở dữ liệu Vector lưu trữ Embeddings sản phẩm |

---

## 🔧 LỆNH QUẢN LÝ DOCKER STACK

* **Xem nhật ký log hệ thống:**
  ```bash
  docker compose logs -f
  ```
* **Kiểm tra trạng thái các Container:**
  ```bash
  docker compose ps
  ```
* **Khởi động lại một dịch vụ (ví dụ Backend):**
  ```bash
  docker compose restart backend-spring-boot
  ```
* **Dừng toàn bộ hệ thống:**
  ```bash
  docker compose down
  ```
