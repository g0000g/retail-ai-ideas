# FRONTEND DESIGN SPECIFICATION — ANGULAR 20 UI ARCHITECTURE
> **Tài liệu:** Frontend System Architecture, Design Tokens, Demo Switcher & Universal Chat Assistant Spec  
> **Framework:** **Angular 20** (Standalone Components, Signals API, Zoneless Change Detection)  
> **Phong cách Thiết kế:** **Modern Enterprise Dark Mode + Glassmorphism UI**  
> **Ngày cập nhật:** 02 tháng 08, 2026  
> **Tác giả:** Lead UI/UX & Angular Architect  

---

## 1. TỔNG QUAN HỆ THỐNG GIAO DIỆN NGUYÊN MẪU (FRONTEND SPEC OVERVIEW)

Giao diện người dùng của hệ thống **Retail AI Platform (GB10)** được xây dựng 100% trên kiến trúc **Angular 20**, tận dụng tối đa sức mạnh của **Signals API** để quản lý trạng thái phản hồi cực nhanh (Reactive State), loại bỏ phụ thuộc vào `Zone.js` (Zoneless Change Detection) và bổ sung **Demo Switcher Navigation Bar** cùng **Universal AI Chat Copilot Panel**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               ANGULAR 20 FULL-STACK ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • Top Nav Demo Switcher:       Chuyển đổi 1-click giữa 5 Flagship Demos + AI Chat Copilot │
│ • Universal AI Chat Copilot:   Giao diện Chat tương tác đa năng với Qwen2.5/DeepSeek-R1  │
│ • Reactive Signals Core:       signal(), computed(), effect(), linkedSignal()           │
│ • State Management:            Angular 20 Signal Store (No NgRx Boilerplate required)   │
│ • Style System:                Vanilla CSS Custom Properties (Tokens) + HSL Palette     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHỨC NĂNG DEMO SWITCHER & UNIVERSAL AI CHAT ASSISTANT

### 2.1 Demo Switcher Bar (Thanh Điều Hướng Chuyển Đổi Demo 1-Click)
Thanh điều hướng cố định trên cùng màn hình cho phép Ban Giám Khảo chuyển đổi tức thì giữa các kịch bản trình diễn:
1. 🎙️ **Demo 1: Kiosk Giọng Nói Tiếng Việt (V09)** — `PhoWhisper-large` + `Qwen2.5-32B`.
2. 📅 **Demo 2: Lập Lịch Ca Nhân Viên (V02/V03)** — `Chronos-bolt` + `OR-Tools Java Solver`.
3. 👗 **Demo 3: Thử Đồ Ảo E-Commerce (C06/C01)** — `ComfyUI CatVTON Node`.
4. 📄 **Demo 4: Trích Xuất Hóa Đơn VAT (V07/C08)** — `Qwen2.5-VL-72B`.
5. 🌐 **Demo 5: ACP Gateway Tác Nhân (W03/I05)** — Cổng Agentic Commerce.
6. 💬 **Demo 6: Universal Retail AI Chat Copilot** — Trợ lý Chat siêu thị đa năng.

---

### 2.2 Universal Retail AI Chat Copilot Panel (`chat-copilot`)
Giao diện khung Chat thời gian thực kết nối với `Qwen2.5-32B` / `DeepSeek-R1-70B` trên GB10:
* **Hỗ trợ hội thoại đa lượt (Multi-turn chat history):** Lưu mảng tin nhắn qua `chatMessages = signal<ChatMessage[]>([])`.
* **Trích xuất ý định tự động:** Khi người dùng chat *"Tìm sữa Vinamilk có khuyến mãi gì?"*, backend Spring Boot 4.1 tự gọi vLLM và trả về phản hồi theo thời gian thực.

```typescript
// Signal State trong Angular 20
activeDemo = signal<DemoView>('voice-kiosk');
chatMessages = signal<ChatMessage[]>([
  { sender: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI Bán Lẻ chạy trực tiếp trên máy chủ GB10.', timestamp: new Date() }
]);

sendChatMessage() {
  const text = this.userChatInput;
  this.chatMessages.update(msgs => [...msgs, { sender: 'user', text, timestamp: new Date() }]);
  // Gọi Spring Boot 4.1.0 API...
}
```

---

## 3. THƯ MỤC CẤU TRÚC COMPONENT DỰ ÁN ANGULAR 20

```
frontend-angular20/src/app/
├── core/
│   ├── services/
│   │   ├── voice-kiosk.service.ts       # Kết nối Spring Boot 4.1 Voice API
│   │   ├── staff-scheduler.service.ts   # Kết nối OR-Tools Solver Service
│   │   ├── document-ai.service.ts       # Upload & trích xuất hóa đơn Qwen2.5-VL
│   │   └── comfyui.service.ts           # Gọi ComfyUI CatVTON & LivePortrait Workflows
│   └── stores/
│       └── ai-session.store.ts          # Central Signal Store quản lý trạng thái AI
└── app.component.ts                     # Main Layout bao gồm Demo Switcher & Universal Chat
```

---

## 4. DESIGN TOKENS & HỆ THỐNG MÀU SẮC (GLASSMORPHISM DESIGN SYSTEM)

```css
:root {
  --bg-app: hsl(222, 47%, 11%);          /* #0f172a Slate 900 */
  --bg-card: hsla(217, 33%, 17%, 0.7);    /* #1e293b Slate 800 (70% Opacity) */
  --primary-accent: hsl(199, 89%, 48%);  /* #0284c7 Sky Blue */
  --purple-accent: hsl(271, 91%, 65%);   /* #a855f7 Vivid Purple */
  --gradient-brand: linear-gradient(135deg, var(--primary-accent), var(--purple-accent));
}
```

---
*(Hết văn bản thiết kế Frontend Angular 20 - Sẵn sàng khởi chạy giao diện)*
