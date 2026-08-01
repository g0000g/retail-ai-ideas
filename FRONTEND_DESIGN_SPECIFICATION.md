# FRONTEND DESIGN SPECIFICATION — EXECUTIVE CLIENT DEMO SPECIFICATION
> **Tài liệu:** Frontend Executive Presentation Design System & Component Spec  
> **Mục tiêu:** **Demo Trực Tiếp Khách Hàng & Ban Giám Khảo (Executive Pitching & Client Demos)**  
> **Framework:** **Angular 20** (Standalone Components, Signals API, Zoneless Change Detection)  
> **Phong cách Thiết kế:** **High-End Enterprise Dark Mode, Glassmorphism HSL, Ambient Glow Orbs**  
> **Ngày cập nhật:** 02 tháng 08, 2026  
> **Tác giả:** Lead UI/UX & Angular Architect  

---

## 1. TỔNG QUAN THIẾT KẾ ĐẲNG CẤP CHO KHÁCH HÀNG (EXECUTIVE DEMO OVERVIEW)

Giao diện nguyên mẫu **Retail AI Platform (GB10)** được thiết kế để mang lại trải nghiệm thị giác **WOW Factor ngay từ giây đầu tiên** khi trình diễn trước Ban Giám Khảo và Đối Tác/Khách Hàng.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             EXECUTIVE CLIENT DEMO ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • System Telemetry Bar:        Hiển thị thời gian thực GPU Status, Unified Memory & Latency│
│ • Ambient Glow Orbs:           Hiệu ứng quầng sáng chuyển đổi theo HSL Palette            │
│ • Glassmorphism Panels:        `backdrop-filter: blur(20px)` với viền mỏng mờ phát sáng    │
│ • 1-Click Demo Switcher:       Chuyển đổi giữa 5 Flagship Showcase + AI Chat Copilot      │
│ • Preset Prompt Chips:         Cho phép bấm 1-click để AI trả về câu trả lời mẫu cho Khách │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DESIGN TOKENS & HỆ THỐNG MÀU SẮC DÀNH CHO DEMO KHÁCH HÀNG

```css
:root {
  /* Surface & Backgrounds */
  --bg-app: #090d16;                       /* Ultra Deep Slate */
  --bg-card: rgba(15, 23, 42, 0.75);       /* Slate 900 Glass 75% Opacity */
  --bg-inner: rgba(30, 41, 59, 0.6);       /* Slate 800 Glass 60% Opacity */

  /* Primary Brand Gradients */
  --gradient-brand: linear-gradient(135deg, #0284c7, #a855f7);
  --gradient-recording: linear-gradient(135deg, #dc2626, #ef4444);

  /* Highlights & Badges */
  --color-green-online: #4ade80;            /* Emerald Online Status */
  --color-sky-latency: #38bdf8;             /* Sky Blue Latency Highlight */
  --color-purple-accent: #a855f7;           /* Vivid Purple Glow */

  /* Glassmorphism Effects */
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-blur: blur(20px);
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}
```

---

## 3. DANH SÁCH 6 SHOWCASE DÀNH CHO DEMO KHÁCH HÀNG

1. **🎙️ Showcase 1: Kiosk Giọng Nói Tiếng Việt (PhoWhisper-large)**
   * *Điểm nhấn demo:* Nút Push-to-Talk phát sáng pulsing red khi thu âm, hiển thị sóng âm Audio Waveform và Card kết quả vị trí quầy/kệ hàng + Khuyến mãi.
2. **📅 Showcase 2: Lập Lịch Ca Nhân Viên & Dự Báo (Chronos + OR-Tools)**
   * *Điểm nhấn demo:* Trích xuất đơn nghỉ phép tự do bằng DeepSeek-R1 + Bảng phân lịch tuần tuân thủ 100% Luật Lao Động được giải trong 8.4s.
3. **👗 Showcase 3: Thử Đồ Ảo E-Commerce (ComfyUI CatVTON Engine)**
   * *Điểm nhấn demo:* So sánh ảnh Khách hàng + Trang phục mẫu -> Trạng thái Render mượt mà từ ComfyUI GPU Worker.
4. **📄 Showcase 4: Copilot Trích Xuất Chứng Từ VAT (Qwen2.5-VL-72B)**
   * *Điểm nhấn demo:* Bảng đối soát 3 bên (Hóa đơn - PO - Phiếu nhập kho GRN) với các biểu tượng Khớp Tuyệt Đối 🟢.
5. **🌐 Showcase 5: Cổng Tác Nhân Mua Sắm ACP Gateway (Spring Boot 4.1)**
   * *Điểm nhấn demo:* Trình diễn cổng API Gateway chuẩn ACP/UCP 2026 cho các AI Agent cá nhân.
6. **💬 Showcase 6: Universal Retail AI Chat Copilot**
   * *Điểm nhấn demo:* Khung Chat thời gian thực kèm các Prompt Chips bấm 1-click cho Khách hàng trải nghiệm không cần gõ phím.

---
*(Hết văn bản thiết kế Executive Demo — Sẵn sàng trình diễn)*
