# FRONTEND DESIGN SPECIFICATION — ANGULAR 20 UI ARCHITECTURE
> **Tài liệu:** Frontend System Architecture, Design Tokens & Component Specification  
> **Framework:** **Angular 20** (Standalone Components, Signals API, Zoneless Change Detection)  
> **Phong cách Thiết kế:** **Modern Enterprise Dark Mode + Glassmorphism UI**  
> **Ngày cập nhật:** 02 tháng 08, 2026  
> **Tác giả:** Lead UI/UX & Angular Architect  

---

## 1. TỔNG QUAN HỆ THỐNG GIAO DIỆN NGUYÊN MẪU (FRONTEND SPEC OVERVIEW)

Giao diện người dùng của hệ thống **Retail AI Platform (GB10)** được xây dựng 100% trên kiến trúc **Angular 20**, tận dụng tối đa sức mạnh của **Signals API** để quản lý trạng thái phản hồi cực nhanh (Reactive State), loại bỏ phụ thuộc vào `Zone.js` (Zoneless Change Detection) và áp dụng thiết kế **Glassmorphism HSL Dark Mode** hiện đại nhằm gây ấn tượng mạnh (WOW Factor) với Ban Giám Khảo cuộc thi AI Contest.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               ANGULAR 20 STANDALONE ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • Reactive Signals Core:       signal(), computed(), effect(), linkedSignal()           │
│ • State Management:            Angular 20 Signal Store (No NgRx Boilerplate required)   │
│ • Routing & Layout:            Standalone Component Router + NGINX Edge Reverse Proxy     │
│ • Style System:                Vanilla CSS Custom Properties (Tokens) + HSL Palette     │
│ • Real-time Streaming:         WebFlux WebSocket Stream + Reactive Audio Visualizer     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DESIGN TOKENS & HỆ THỐNG MÀU SẮC (GLASSMORPHISM DESIGN SYSTEM)

### 2.1 Bảng Màu HSL & Tokens Chủ Đạo (Theme Palette)

```css
:root {
  /* Surface & Backgrounds */
  --bg-app: hsl(222, 47%, 11%);          /* #0f172a Slate 900 */
  --bg-card: hsla(217, 33%, 17%, 0.7);    /* #1e293b Slate 800 (70% Opacity) */
  --bg-card-hover: hsla(217, 33%, 22%, 0.85);

  /* Primary Brand Gradients */
  --primary-accent: hsl(199, 89%, 48%);  /* #0284c7 Sky Blue */
  --purple-accent: hsl(271, 91%, 65%);   /* #a855f7 Vivid Purple */
  --gradient-brand: linear-gradient(135deg, var(--primary-accent), var(--purple-accent));

  /* Status Colors */
  --color-success: hsl(142, 71%, 45%);  /* #22c55e Emerald Green */
  --color-warning: hsl(38, 92%, 50%);   /* #f59e0b Amber Warning */
  --color-danger: hsl(0, 84%, 60%);     /* #ef4444 Rose Red */

  /* Text & Typography */
  --text-main: hsl(210, 40%, 98%);      /* #f8fafc */
  --text-muted: hsl(215, 20%, 65%);     /* #94a3b8 */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* Glassmorphism Effects */
  --glass-border: 1px solid rgba(255, 255, 255, 0.12);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --glass-blur: blur(16px);
}
```

---

## 3. THƯ MỤC CẤU TRÚC COMPONENT DỰ ÁN ANGULAR 20

```
frontend-angular20/src/app/
├── core/
│   ├── services/
│   │   ├── voice-kiosk.service.ts       # Kết nối Spring Boot 4.1 Voice API & WebSocket
│   │   ├── staff-scheduler.service.ts   # Kết nối OR-Tools Solver Service
│   │   ├── document-ai.service.ts       # Upload & trích xuất hóa đơn Qwen2.5-VL
│   │   ├── comfyui.service.ts           # Gọi ComfyUI CatVTON & LivePortrait Workflows
│   │   └── agentic-commerce.service.ts  # Test cổng ACP API Gateway
│   └── stores/
│       └── ai-session.store.ts          # Central Signal Store quản lý trạng thái AI
├── shared/
│   ├── components/
│   │   ├── navbar/                      # Thanh điều hướng Header toàn trang
│   │   ├── audio-visualizer/            # Sóng âm thời gian thực cho Push-to-Talk
│   │   ├── glass-card/                  # Reusable Glassmorphism Card Container
│   │   └── json-viewer/                 # Code syntax highlighter cho AI JSON Output
└── pages/
    ├── dashboard/                       # Tổng quan hệ thống AI Platform
    ├── voice-kiosk/                     # View 1: Kiosk Giọng Nói Tiếng Việt (V09)
    ├── staff-scheduler/                 # View 2: Lập Lịch Ca Nhân Viên (V02)
    ├── virtual-tryon/                   # View 3: Thử Đồ Ảo E-Commerce (C06)
    ├── document-ai/                     # View 4: Đối Soát Chứng Từ VAT 3 Bên (V07)
    └── agentic-commerce/                # View 5: Cổng Tác Nhân Mua Sắm ACP (W03/I05)
```

---

## 4. THIẾT KẾ CHI TIẾT GIAO DIỆN & TƯƠNG TÁC CHO 5 VIEW FLAGSHIP

---

### 4.1 VIEW 1: KIOSK GIỌNG NÓI TIẾNG VIỆT (VOICE KIOSK UI — V09)

#### A. Wireframe Layout
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  🛒 KIOSK SIÊU THỊ THÔNG MINH                                  🟢 Máy chủ GB10: Sẵn sàng  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [ Lời nói nhận diện (PhoWhisper-large) ]                                               │
│  "Cho tôi hỏi sữa Meiji 800g ở quầy nào và đang có khuyến mãi gì không?"                │
│                                                                                          │
├─────────────────────────────────────────┬────────────────────────────────────────────────┤
│  📍 VỊ TRÍ HÀNG HÓA                     │  🎁 CHƯƠNG TRÌNH KHUYẾN MÃI                    │
│  • Quầy: Sữa & Tã em bé (Aisle 4B)      │  • Mua 2 hộp tặng 1 gấu bông cao cấp           │
│  • Vị trí: Kệ thứ 3, Tầng trung tâm     │  • Giảm 10% cho hội viên V-Club                │
│  • Tồn kho: 24 hộp                      │  • Áp dụng đến: 31/08/2026                     │
├─────────────────────────────────────────┴────────────────────────────────────────────────┤
│                                                                                          │
│                  🎙️ [ GIỮ ĐỂ NÓI - PUSH TO TALK ] (Audio Waveform Active)               │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B. Angular 20 Component Implementation (`voice-kiosk.component.ts`)

```typescript
import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceKioskService } from '../../core/services/voice-kiosk.service';

@Component({
  selector: 'app-voice-kiosk',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kiosk-wrapper glassmorphism">
      <header class="kiosk-header">
        <h2 class="title">🛒 Kiosk Giọng Nói Tiếng Việt (PhoWhisper-large)</h2>
        <span class="status-pill" [class.recording]="isRecording()">
          {{ isRecording() ? '🔴 Đang thu âm...' : '🟢 Chờ tương tác' }}
        </span>
      </header>

      <section class="transcript-display">
        <p class="transcript-text">
          {{ currentTranscript() || 'Nhấn nút micro phía dưới và nói câu hỏi của bạn...' }}
        </p>
      </section>

      @if (aiResult()) {
        <div class="cards-grid">
          <div class="glass-card product-location">
            <h3>📍 Vị Trí Hàng Hóa</h3>
            <p>Sản phẩm: <strong>{{ aiResult().product_name }}</strong></p>
            <p>Dãy hàng: <span class="badge">{{ aiResult().aisle }}</span></p>
            <p>Số lượng tồn: {{ aiResult().stock_count }} hộp</p>
          </div>

          <div class="glass-card promotion-info">
            <h3>🎁 Khuyến Mãi Áp Dụng</h3>
            <p>{{ aiResult().promotion_title }}</p>
            <p class="discount-tag">Giảm {{ aiResult().discount_percent }}%</p>
          </div>
        </div>
      }

      <footer class="mic-controls">
        <button 
          class="btn-push-to-talk" 
          [class.active]="isRecording()"
          (mousedown)="startRecording()"
          (mouseup)="stopRecording()"
          (touchstart)="startRecording()"
          (touchend)="stopRecording()">
          <span class="icon">🎙️</span>
          <span>{{ isRecording() ? 'ĐANG THU ÂM (THẢ ĐỂ GỬI)' : 'GIỮ ĐỂ NÓI (PUSH-TO-TALK)' }}</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .kiosk-wrapper {
      background: var(--bg-card);
      border: var(--glass-border);
      backdrop-filter: var(--glass-blur);
      border-radius: 20px;
      padding: 32px;
      color: var(--text-main);
    }
    .status-pill {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
    }
    .status-pill.recording {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .btn-push-to-talk {
      width: 100%;
      background: var(--gradient-brand);
      border: none;
      color: white;
      padding: 20px;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.4);
      transition: transform 0.1s ease;
    }
    .btn-push-to-talk.active {
      transform: scale(0.98);
      filter: brightness(1.2);
    }
  `]
})
export class VoiceKioskComponent {
  private voiceService = inject(VoiceKioskService);

  // Angular 20 Signals
  isRecording = signal<boolean>(false);
  currentTranscript = signal<string>('');
  aiResult = signal<any>(null);

  startRecording() {
    this.isRecording.set(true);
    this.currentTranscript.set('Đang lắng nghe giọng nói...');
  }

  stopRecording() {
    this.isRecording.set(false);
    this.currentTranscript.set('Đang phân tích âm thanh tiếng Việt với PhoWhisper-large...');

    // Gọi API Spring Boot 4.1
    this.voiceService.processVoiceIntent('Sữa Meiji 800g ở quầy nào?').subscribe({
      next: (data) => {
        this.currentTranscript.set('Sữa Meiji 800g ở quầy nào và đang có khuyến mãi gì không?');
        this.aiResult.set(data);
      }
    });
  }
}
```

---

### 4.2 VIEW 2: TỰ ĐỘNG LẬP LỊCH CA NHÂN VIÊN (STAFF SCHEDULER UI — V02)

#### A. Interactive Wireframe Flow
1. **Bảng Dự báo Chronos-bolt:** Hiển thị biểu đồ dạng nến/đường biểu diễn số lượng khách hàng dự báo theo từng khung giờ trong tuần.
2. **Khung Nhập Đơn Xin Nghỉ Phép Tiếng Việt:** Cho phép Paste các dòng tin nhắn nghỉ phép tự do từ Zalo/Facebook của nhân viên.
3. **Nút Thao Tác [ GIẢI BÀI TOÁN TỐI ƯU CÙNG GOOGLE OR-TOOLS ]:** Gọi Solver C++ Java Native và hiển thị bảng phân lịch chi tiết theo từng ca trong 3 giây.

---

### 4.3 VIEW 3: THỬ ĐỒ ẢO E-COMMERCE (VIRTUAL TRY-ON UI — C06)

#### A. Wireframe Layout
* **Khung Ảnh Bên Trái:** Drag & Drop ảnh người dùng.
* **Khung Ảnh Bên Phải:** Chọn mẫu trang phục từ Danh mục Siêu thị.
* **Khu Vực Kết Quả Trung Tâm:** Hiển thị tiến trình Render từ **ComfyUI CatVTON Node (`http://gb10-server:8188`)** và thanh Slider so sánh Trước/Sau (Before/After Slider).

---

### 4.4 VIEW 4: COPILOT TRÍCH XUẤT HÓA ĐƠN VAT 3 BÊN (DOCUMENT AI UI — V07)

#### A. Wireframe Layout
* **Khung Upload:** Cho phép tải lên file PDF/Ảnh scan Hóa đơn VAT bị mờ/nghiêng.
* **Khung Visual Overlay:** Vẽ bounding box màu vàng xung quanh các thông tin được **Qwen2.5-VL-72B** trích xuất (Mã số thuế, Tiền GTGT, Danh sách SKU).
* **Bảng Đối Soát 3 Bên (3-Way Matching Matrix):** So sánh từng dòng Hóa đơn (Invoice) vs. Đơn mua hàng (PO) vs. Phiếu nhập kho (GRN) với các biểu tượng Khớp 🟢 / Sai lệch 🔴.

---

## 5. QUẢN LÝ TRẠNG THÁI CENTRAL SIGNAL STORE (ANGULAR 20)

Dưới đây là thiết kế bộ lưu trữ trạng thái trung tâm `AiSessionStore` bằng **Angular 20 Signals**:

```typescript
// src/app/core/stores/ai-session.store.ts
import { Injectable, signal, computed } from '@angular/core';

export interface AISessionState {
  gb10ServerConnected: boolean;
  activeModel: string;
  totalTokensUsed: number;
  lastInferenceLatencyMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class AiSessionStore {

  // Primary State Signals
  private state = signal<AISessionState>({
    gb10ServerConnected: true,
    activeModel: 'Qwen/Qwen2.5-32B-Instruct',
    totalTokensUsed: 14250,
    lastInferenceLatencyMs: 420
  });

  // Computed Selectors
  readonly isConnected = computed(() => this.state().gb10ServerConnected);
  readonly currentModel = computed(() => this.state().activeModel);
  readonly latencyFormatted = computed(() => `${this.state().lastInferenceLatencyMs} ms`);

  // State Mutators
  updateLatency(latencyMs: number) {
    this.state.update(s => ({ ...s, lastInferenceLatencyMs: latencyMs }));
  }

  updateModel(newModel: string) {
    this.state.update(s => ({ ...s, activeModel: newModel }));
  }
}
```

---

## 6. QUY TRÌNH BUILD & DEPLOY DOCKER NGINX CHO FRONTEND ANGULAR 20

### 6.1 Tệp Cấu Hình NGINX Route Reverse Proxy (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Hỗ trợ HTML5 PushState Router cho Angular 20 Standalone
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy toàn bộ request API sang Spring Boot 4.1 Container
    location /api/ {
        proxy_pass http://backend-spring-boot:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Proxy WebSocket Stream cho PhoWhisper Audio
    location /ws/ {
        proxy_pass http://backend-spring-boot:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---
*(Hết văn bản thiết kế Frontend Angular 20 - Sẵn sàng cho việc tạo mã nguồn giao diện)*
