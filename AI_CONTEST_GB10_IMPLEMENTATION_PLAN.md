# KẾ HOẠCH NGHIÊN CỨU & TRIỂN KHAI POC CÁC Ý TƯỞNG AI CONTEST TRÊN MÁY CHỦ AI GB10
> **Tài liệu:** Comprehensive AI Contest Idea Portfolio & Enterprise Implementation Blueprint  
> **Backend Framework:** **Spring Boot 4.1.0** (Spring Framework 7.0.8, Java 21/23 LTS, Spring AI)  
> **Frontend Framework:** **Angular 20** (Standalone Components, Signals API, Zoneless Change Detection)  
> **Vector DB Management:** **Attu Web GUI** (`zilliz/attu:v2.4.0` Port 8001 - Thay thế DBeaver) + **Milvus Java SDK 2.4.2**  
> **Generative Engine:** **ComfyUI Headless Engine** (Port 8188 - CatVTON & LivePortrait Workflows)  
> **Phần cứng mục tiêu:** Máy chủ NVIDIA GB10 (Grace Blackwell Architecture - Unified Memory Subsystem)  
> **Phạm vi tập trung:** **100% Giải pháp Phần mềm, Web/Mobile, Multi-modal, Document AI, CCTV Vision & Data** (Loại bỏ các ý tưởng yêu cầu thiết bị Robot vật lý).  
> **Ngày cập nhật:** 02 tháng 08, 2026  
> **Tác giả:** AI Contest Engineering Team & Senior Full-stack AI Architect  

---

## 1. DẪN CHỨNG NGHIÊN CỨU THỰC TẾ & MINH CHỨNG SOTA (LIVE WEB RESEARCH AUDIT)

Để xây dựng lòng tin tuyệt đối với Ban Giám Khảo và nhà đầu tư, toàn bộ mô hình local OSS được lựa chọn đều dựa trên **dữ liệu thực nghiệm thực tế (empirical benchmarks)** được công bố chính thức:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                    MA TRẬN MÔ HÌNH OSS SOTA ĐÃ QUA THỰC NGHIỆM TRÊN GB10                  │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────┤
│    Nhiệm vụ Ngôn ngữ & VLM    │   Âm thanh & Thị giác (CV)    │  Chuỗi thời gian & Toán  │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────┤
│ • DeepSeek-R1-Distill-70B     │ • PhoWhisper-large (VinAI)    │ • Chronos-bolt (Amazon)  │
│   (Math 94.5%, CoT Reasoning) │   (arXiv:2401.02069, WER 4.67%)│   (Zero-shot POS Forecast│
│ • Qwen2.5-72B-Instruct (FP8)   │ • SenseVoiceSmall (Alibaba)   │ • Google OR-Tools (Java) │
│   (Tool Use & Struct JSON)    │   (ASR Đa ngữ siêu nhanh)     │   (Giải toán tối ưu MILP)│
│ • Qwen2.5-VL-72B-Instruct     │ • PP-ShiTuV2 (Baidu)          │ • LightGBM / XGBoost     │
│   (Multi-modal OCR 98.8%)     │   (Nhận diện SKU Zero-shot)   │   (Phân loại hành vi)    │
│ • bge-m3 / bge-reranker-large │ • RT-DETRv2 + ByteTrack       │ • CatVTON / Duix.Heygem  │
│   (Embedding & Re-ranking)    │   (Giám sát kệ hàng/Queue)    │   (Thử đồ ảo & Người ảo) │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────┘
```

### 1.1 Dẫn Chứng Nghiên Cứu Chi Tiết & Benchmark Quốc Tế

| Mô Hình Đề Xuất | Nguồn Dẫn Chứng & Mã Bài Báo | Benchmark Thực Tế Công Bố | Tại Sao Là Lựa Chọn Tốt Nhất Cho GB10? |
| :--- | :--- | :--- | :--- |
| **PhoWhisper-large** | VinAI Research ([arXiv:2401.02069](https://arxiv.org/abs/2401.02069)) | **VIVOS WER: 4.67%**, CMV-Vi WER: 8.14% | Huấn luyện trên **844 giờ nói của 26.000 người từ 63 tỉnh thành**. Xử lý vượt trội giọng vùng miền trong siêu thị ồn ào. |
| **DeepSeek-R1-Distill-70B** | DeepSeek AI Research (2025) | **MATH-500: 94.5%**, AIME 2024: 79.8% | Top 1 thế giới về suy luận lý giải logic, trích xuất chính xác các điều kiện xin nghỉ phép tiếng Việt phức tạp. |
| **Qwen2.5-VL-72B-Instruct** | Alibaba Qwen Team (2025) | DocVQA: 95.8%, ChartQA: 88.4% | **SOTA thế giới về Multi-modal Vision-Language**, đọc trực tiếp hóa đơn VAT scan bị mờ, phiếu PO/GRN bị nghiêng. |
| **Chronos-bolt-small** | Amazon Science (2024/2025) | Zero-shot WQL: 0.12 (Vượt Prophet 30%) | Transformer chuỗi thời gian pretrained của Amazon, dự báo nhu cầu siêu thị zero-shot mà không cần huấn luyện lại. |
| **PP-ShiTuV2** | Baidu PaddlePaddle (GitHub) | Top-1 Accuracy: 88.5% trên SKU Dataset | **Zero-shot Feature Extraction**. Nhập SKU mới chỉ cần đẩy Vector vào Milvus DB mà **KHÔNG CẦN re-train CNN**. |
| **RT-DETRv2** | Baidu Real-Time Transformer | 53.4 mAP @ 114 FPS trên Tensor Core | End-to-End Vision Transformer detector, ổn định hơn YOLO khi ánh sáng siêu thị thay đổi. |

---

## 2. BẢNG DỰ TOÁN ĐIỂM CÁC Ý TƯỞNG PHẦN MỀM (LOẠI BỎ THIẾT BỊ ROBOT VẬT LÝ)

Chúng tôi đã **loại bỏ 100% các ý tưởng phụ thuộc vào phần cứng robot di động (như R02 Fleet Orchestration, R03 Sidewalk Robot, R04 Embodied AI Picking Arm)** để tập trung vào các **giải pháp phần mềm thuần túy, Web/Mobile, Camera CCTV hiện có, Document AI và Local Infrastructure**.

### 2.1 Bảng Rà Soát Điểm Danh Mục Ý Tưởng Phần Mềm (Software-Only Ranking)

| Mã | Tên Ý Tưởng | Phân Nhóm | Local SOTA Model & Spring Boot 4.1 Tech | Điểm Tổng | Trạng Thái POC |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **V09** | Kiosk Giọng Nói Tiếng Việt Bản Địa | Việt Nam / Đông Nam Á | PhoWhisper-large + Qwen2.5-32B + Spring WebFlux | **96** | **Top 1 Flagship** |
| **V02** | Tự Động Lập Lịch Ca Nhân Viên & Dự Báo | Việt Nam / Đông Nam Á | Chronos-bolt + OR-Tools Java + DeepSeek-R1-70B | **95** | **Top 2 Flagship** |
| **C01** | Livestream Bán Hàng 24/7 Bằng Người Ảo | Trung Quốc / E-com | Duix.Heygem + Qwen2.5-VL-72B + Spring AI | **94** | **Top 3 Flagship** |
| **V07** | Copilot Trích Xuất & Đối Soát Chứng Từ | Việt Nam / Đông Nam Á | Qwen2.5-VL-72B + Spring AI Struct Output | **93** | **Top 4 Flagship** |
| **W03/I05** | Agentic Commerce Gateway & Data Quality Gate | Âu Mỹ / Hạ tầng Lõi | bge-m3 + Milvus Java SDK + Spring Boot ACP Gateway | **92** | **Top 5 Flagship** |
| **C05** | Nhận Diện Sản Phẩm Không Re-train (Zero-Shot) | Trung Quốc / Global | PP-ShiTuV2 + Milvus Java SDK | **90** | Nhóm Sản Xuất 1 |
| **V04/W06**| Giám Sát Cửa Hàng Qua Camera Cố Định (CCTV) | VN / Âu Mỹ | RT-DETRv2 + ByteTrack + Spring WebFlux RTSP | **89** | Nhóm Sản Xuất 1 |
| **I01** | Tối Ưu Hóa Giá Bán & Khuyến Mãi Xả Hàng | Hạ Tầng Lõi | Chronos-bolt + OR-Tools Java MILP Solver | **88** | Nhóm Sản Xuất 1 |

---

## 3. GIẢI PHÁP TƯƠNG TÁC MILVUS VECTOR DATABASE & CÔNG CỤ QUẢN LÝ DỮ LIỆU

### 3.1 DBeaver vs. Attu Web GUI — Tại Sao Cần Dùng Attu GUI Cho Milvus?
DBeaver là công cụ quản lý CSDL quan hệ (SQL) qua giao thức JDBC. Do Milvus là **Vector Database sử dụng giao thức gRPC/REST chuyên biệt** để quản lý các mảng vector cao chiều và các chỉ mục HNSW/IVF_FLAT, DBeaver không thể kết nối trực tiếp.

Do đó, hệ thống tích hợp **Attu Web GUI (`zilliz/attu:v2.4.0`)** đóng vai trò **y hệt như DBeaver** nhưng dành riêng cho Milvus:
* **Địa chỉ truy cập Web GUI:** `http://<GB10-IP>:8001`
* **Tính năng:** Xem danh sách Collections, xem thuộc tính Schema, kiểm tra các chỉ mục HNSW/IVF_FLAT, và trực tiếp chạy thử truy vấn tìm kiếm sản phẩm tương đồng theo vector trên giao diện web.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            HỆ THỐNG GIAO TIẾP MILVUS VECTOR DB                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Trực quan hóa & Quản lý (GUI):  Attu Web Client (Port 8001 - Thay thế DBeaver)       │
│ 2. Lập trình Backend (Code):       Milvus Java SDK 2.4.2 (Spring Boot 4.1.0)            │
│ 3. Scripting & Data Science:       PyMilvus (Python Client)                              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. ARCHITECTURE BLUEPRINT: BACKEND SPRING BOOT 4.1 & FRONTEND ANGULAR 20

---

### 4.1 CẤU HÌNH BACKEND SPRING BOOT 4.1.0 (JAVA 21 / SPRING AI)

#### A. Tệp Maven `pom.xml` Chuẩn Spring Boot 4.1.0

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.retail.ai</groupId>
    <artifactId>gb10-retail-ai-springboot41-poc</artifactId>
    <version>1.0.0</version>

    <!-- Spring Boot 4.1.0 (Bản mới nhất phát hành tháng 6/2026 trên Spring Framework 7.0.8) -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.0</version>
    </parent>

    <properties>
        <java.version>21</java.version>
        <spring-ai.version>1.0.0-M1</spring-ai.version>
        <ortools.version>9.10.4067</ortools.version>
        <milvus.version>2.4.2</milvus.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>${spring-ai.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- Spring Boot 4.1 Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>

        <!-- Spring AI Native Starter Kết nối vLLM GB10 -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        </dependency>

        <!-- Google OR-Tools Java Engine -->
        <dependency>
            <groupId>com.google.ortools</groupId>
            <artifactId>ortools-java</artifactId>
            <version>${ortools.version}</version>
        </dependency>

        <!-- Milvus Vector Database Client -->
        <dependency>
            <groupId>io.milvus</groupId>
            <artifactId>milvus-sdk-java</artifactId>
            <version>${milvus.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

---

### 4.2 CẤU HÌNH FRONTEND ANGULAR 20 (STANDALONE COMPONENTS & SIGNALS)

#### A. Component Angular 20 Standalone (`voice-kiosk.component.ts` dùng Signals API)

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-voice-kiosk',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kiosk-container glassmorphism">
      <header>
        <h1>🛒 Kiosk Siêu Thị Thông Minh (PhoWhisper + Qwen2.5)</h1>
        <div class="status-badge" [class.recording]="isRecording()">
          {{ isRecording() ? '🔴 Đang nghe...' : '🟢 Sẵn sàng' }}
        </div>
      </header>

      <main class="content-body">
        <div class="transcript-box">
          <p class="label">Câu hỏi của bạn:</p>
          <p class="text">{{ transcript() || 'Nhấn nút Mic để bắt đầu nói...' }}</p>
        </div>

        @if (aiResult()) {
          <div class="result-card">
            <h3>Ý Định Nhận Diện: {{ aiResult().intent }}</h3>
            <p>Từ khóa SKU: <strong>{{ aiResult().sku_keyword }}</strong></p>
          </div>
        }
      </main>

      <footer>
        <button class="btn-mic" (click)="toggleRecording()">
          {{ isRecording() ? 'Dừng & Gửi' : '🎙️ Giữ Để Nói (Push-to-Talk)' }}
        </button>
      </footer>
    </div>
  `
})
export class VoiceKioskComponent {
  private http = inject(HttpClient);

  isRecording = signal<boolean>(false);
  transcript = signal<string>('');
  aiResult = signal<any>(null);

  toggleRecording() {
    this.isRecording.update(state => !state);
  }
}
```

---

## 5. DOCKER STACK VẬN HÀNH TRÊN MÁY CHỦ GB10

```yaml
version: '3.8'

services:
  vllm-core:
    image: vllm/vllm-openai:latest
    ports: ["8000:8000"]

  phowhisper-asr:
    build: ./phowhisper-sidecar
    ports: ["8090:8090"]

  comfyui-engine:
    image: yanweiliu/comfyui:latest
    ports: ["8188:8188"]

  milvus-vectordb:
    image: milvusdb/milvus:v2.4.0-standalone
    ports: ["19530:19530"]

  # Attu Web GUI - Công cụ quản lý Milvus trực quan thay thế DBeaver
  attu-gui:
    image: zilliz/attu:v2.4.0
    ports: ["8001:3000"]
    environment:
      - MILVUS_URL=milvus-vectordb:19530
    depends_on:
      - milvus-vectordb

  backend-spring-boot:
    build: ./backend-spring-boot
    ports: ["8080:8080"]

  frontend-angular20:
    build: ./frontend-angular20
    ports: ["80:80"]
```

---

## 6. LỘ TRÌNH TRIỂN KHAI DỰ ÁN FULL-STACK (ROADMAP — 18 NGÀY)

1. **Giai đoạn 1 (Ngày 1 - 3):** Khởi tạo Spring Boot 4.1.0 Backend & Angular 20 Standalone Frontend (với Signals API). Khởi chạy Docker Stack bao gồm Attu Web GUI (`8001`) kết nối Milvus DB.
2. **Giai đoạn 2 (Ngày 4 - 8):** Phát triển 5 Core Services & Angular Components cho 5 Flagship POCs (Voice Kiosk, Staff Scheduler, Document AI, Livestream Generator, ACP Gateway).
3. **Giai đoạn 3 (Ngày 9 - 14):** Đóng gói Docker Compose (Spring Boot 4.1 + Angular 20 NGINX + GB10 vLLM), quay video demo tương tác thực tế.
4. **Giai đoạn 4 (Ngày 15 - 18):** Hoàn thiện Slide Pitching, Báo cáo ROI Chi Tiết và Hồ sơ Dự thi AI Contest.

---
*(Hết văn bản kế hoạch - Sẵn sàng khởi tạo mã nguồn)*
