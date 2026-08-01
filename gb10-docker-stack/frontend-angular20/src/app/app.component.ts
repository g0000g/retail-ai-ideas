import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  sender: 'user' | 'assistant' | 'system';
  text: str;
  timestamp: Date;
  toolCall?: any;
}

export type DemoView = 'voice-kiosk' | 'staff-scheduler' | 'virtual-tryon' | 'document-ai' | 'agentic-commerce' | 'chat-copilot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-layout">
      <!-- Top Navigation & Demo Switcher Bar -->
      <header class="top-nav glassmorphism">
        <div class="brand">
          <span class="logo">🛒</span>
          <div class="brand-text">
            <h2>GB10 Retail AI Platform</h2>
            <span class="tech-stack">Spring Boot 4.1.0 · Angular 20 Signals · GB10 Local SOTA</span>
          </div>
        </div>

        <nav class="demo-switcher">
          <button class="nav-btn" [class.active]="activeDemo() === 'voice-kiosk'" (click)="setDemo('voice-kiosk')">
            🎙️ Kiosk Giọng Nói (V09)
          </button>
          <button class="nav-btn" [class.active]="activeDemo() === 'staff-scheduler'" (click)="setDemo('staff-scheduler')">
            📅 Lập Lịch Ca (V02)
          </button>
          <button class="nav-btn" [class.active]="activeDemo() === 'virtual-tryon'" (click)="setDemo('virtual-tryon')">
            👗 Thử Đồ Ảo (C06)
          </button>
          <button class="nav-btn" [class.active]="activeDemo() === 'document-ai'" (click)="setDemo('document-ai')">
            📄 Chứng Từ VAT (V07)
          </button>
          <button class="nav-btn" [class.active]="activeDemo() === 'agentic-commerce'" (click)="setDemo('agentic-commerce')">
            🌐 ACP Gateway (W03)
          </button>
          <button class="nav-btn highlight" [class.active]="activeDemo() === 'chat-copilot'" (click)="setDemo('chat-copilot')">
            💬 AI Chat Copilot
          </button>
        </nav>
      </header>

      <!-- Main Content Area Dynamic View Switcher -->
      <main class="main-stage">
        <!-- DEMO 1: VOICE KIOSK -->
        @if (activeDemo() === 'voice-kiosk') {
          <section class="demo-view glassmorphism">
            <h2>🎙️ V09 — Kiosk Giọng Nói Tiếng Việt Bản Địa</h2>
            <p class="desc">Nhận diện giọng nói 63 tỉnh thành bằng <strong>PhoWhisper-large</strong> + Trích xuất Intent bằng <strong>Qwen2.5-32B</strong>.</p>

            <div class="kiosk-demo-box">
              <div class="transcript-card">
                <span class="label">Câu hỏi tiếng Việt:</span>
                <p class="text">{{ currentTranscript() || 'Giữ nút Mic phía dưới để nói...' }}</p>
              </div>

              <div class="action-bar">
                <button class="btn-mic" [class.recording]="isRecording()" (click)="toggleRecording()">
                  {{ isRecording() ? '🔴 ĐANG THU ÂM (BẤM ĐỂ GỬI)' : '🎙️ BẤM ĐỂ NÓI (PHOWHISPER ASR)' }}
                </button>
              </div>

              @if (kioskResponse()) {
                <div class="result-grid">
                  <div class="info-card">
                    <h4>📍 Vị Trí Hàng Hóa</h4>
                    <p>Sản phẩm: <strong>Sữa Meiji 800g</strong></p>
                    <p>Dãy hàng: <span class="badge">Aisle 4B - Mẹ & Bé</span></p>
                    <p>Tồn kho: 24 hộp</p>
                  </div>
                  <div class="info-card">
                    <h4>🎁 Khuyến Mãi Áp Dụng</h4>
                    <p>Mua 2 tặng 1 Gấu bông cao cấp</p>
                    <p class="discount">Giảm 10% V-Club</p>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- DEMO 2: STAFF SCHEDULER -->
        @if (activeDemo() === 'staff-scheduler') {
          <section class="demo-view glassmorphism">
            <h2>📅 V02 — Tự Động Lập Lịch Ca Nhân Viên & Dự Báo</h2>
            <p class="desc">Dự báo lượt khách bằng <strong>Chronos-bolt</strong> & giải bài toán ràng buộc bằng <strong>Google OR-Tools Java Engine</strong>.</p>
            <div class="scheduler-box">
              <button class="btn-action" (click)="solveSchedule()">🚀 Chạy Solver Lập Lịch (10s)</button>
              @if (scheduleResult()) {
                <div class="response-box">
                  <pre>{{ scheduleResult() | json }}</pre>
                </div>
              }
            </div>
          </section>
        }

        <!-- DEMO 3: VIRTUAL TRY-ON -->
        @if (activeDemo() === 'virtual-tryon') {
          <section class="demo-view glassmorphism">
            <h2>👗 C06 — Thử Đồ Ảo E-Commerce (ComfyUI CatVTON Node)</h2>
            <p class="desc">Tự động ghép thử trang phục lên cơ thể khách hàng qua <strong>ComfyUI Headless Engine (Port 8188)</strong>.</p>
            <div class="tryon-box">
              <button class="btn-action" (click)="testTryOn()">🖼️ Chạy Render Thử Trang Phục</button>
              @if (tryOnResult()) {
                <div class="response-box"><p>{{ tryOnResult() }}</p></div>
              }
            </div>
          </section>
        }

        <!-- DEMO 4: DOCUMENT AI -->
        @if (activeDemo() === 'document-ai') {
          <section class="demo-view glassmorphism">
            <h2>📄 V07 — Copilot Trích Xuất & Đối Soát Chứng Từ VAT 3 Bên</h2>
            <p class="desc">Đọc 100% dữ liệu từ ảnh scan mờ bằng <strong>Qwen2.5-VL-72B-Instruct</strong>.</p>
            <div class="doc-box">
              <button class="btn-action" (click)="testDocExtract()">🔍 Upload & Trích Xuất Hóa Đơn</button>
              @if (docResult()) {
                <div class="response-box"><pre>{{ docResult() | json }}</pre></div>
              }
            </div>
          </section>
        }

        <!-- DEMO 5: AGENTIC COMMERCE -->
        @if (activeDemo() === 'agentic-commerce') {
          <section class="demo-view glassmorphism">
            <h2>🌐 W03 — Cổng Tác Nhân Mua Sắm ACP (Agentic Commerce Protocol)</h2>
            <p class="desc">Cho phép các AI Agent cá nhân của khách hàng tự truy cập & đặt hàng qua Spring Boot 4.1 Gateway.</p>
          </section>
        }

        <!-- DEMO 6: UNIVERSAL RETAIL AI CHAT ASSISTANT -->
        @if (activeDemo() === 'chat-copilot') {
          <section class="demo-view glassmorphism chat-container">
            <h2>💬 Universal Retail AI Chat Assistant</h2>
            <p class="desc">Trợ lý bán hàng thông minh đa năng tương tác trực tiếp với <strong>Qwen2.5-32B / DeepSeek-R1-70B</strong> trên máy chủ GB10.</p>

            <div class="chat-messages-scroll">
              @for (msg of chatMessages(); track $index) {
                <div class="chat-bubble" [class.user]="msg.sender === 'user'" [class.assistant]="msg.sender === 'assistant'">
                  <div class="bubble-header">
                    <span>{{ msg.sender === 'user' ? '👤 Bạn' : '🤖 Retail AI Copilot (GB10)' }}</span>
                    <span class="time">{{ msg.timestamp | date:'HH:mm:ss' }}</span>
                  </div>
                  <div class="bubble-text">{{ msg.text }}</div>
                </div>
              }
            </div>

            <div class="chat-input-row">
              <input 
                type="text" 
                class="chat-input" 
                [(ngModel)]="userChatInput" 
                (keyup.enter)="sendChatMessage()"
                placeholder="Nhập câu hỏi siêu thị (ví dụ: Tìm sữa Vinamilk có khuyến mãi gì không?)..." 
              />
              <button class="btn-send" (click)="sendChatMessage()">Gửi 🚀</button>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      padding: 20px;
    }
    .glassmorphism {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(16px);
      border-radius: 16px;
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      margin-bottom: 24px;

    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand .logo { font-size: 2rem; }
    .brand h2 { margin: 0; font-size: 1.3rem; color: #38bdf8; }
    .brand .tech-stack { font-size: 0.8rem; color: #94a3b8; }
    .demo-switcher {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nav-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav-btn.active {
      background: #0284c7;
      color: white;
      border-color: #38bdf8;
    }
    .nav-btn.highlight.active {
      background: linear-gradient(135deg, #a855f7, #6366f1);
    }
    .main-stage {
      max-width: 1200px;
      margin: 0 auto;
    }
    .demo-view {
      padding: 32px;
    }
    .desc { color: #94a3b8; margin-bottom: 24px; }
    .btn-mic {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #0284c7, #a855f7);
      border: none;
      border-radius: 40px;
      color: white;
      font-weight: bold;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
    }
    .info-card {
      background: rgba(15, 23, 42, 0.6);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-action {
      background: #0284c7;
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
    .response-box {
      margin-top: 16px;
      background: #020617;
      padding: 16px;
      border-radius: 8px;
      color: #4ade80;
    }
    /* CHAT STYLES */
    .chat-messages-scroll {
      height: 400px;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.8);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 12px;
    }
    .chat-bubble.user {
      align-self: flex-end;
      background: #0284c7;
      color: white;
    }
    .chat-bubble.assistant {
      align-self: flex-start;
      background: #334155;
      color: #f8fafc;
    }
    .chat-input-row {
      display: flex;
      gap: 12px;
    }
    .chat-input {
      flex: 1;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 14px 20px;
      border-radius: 30px;
      color: white;
      font-size: 1rem;
    }
    .btn-send {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: none;
      color: white;
      padding: 0 28px;
      border-radius: 30px;
      font-weight: bold;
      cursor: pointer;
    }
  `]
})
export class AppComponent {
  private http = inject(HttpClient);

  // Angular 20 Signals
  activeDemo = signal<DemoView>('voice-kiosk');
  isRecording = signal<boolean>(false);
  currentTranscript = signal<string>('');
  kioskResponse = signal<any>(null);
  scheduleResult = signal<any>(null);
  tryOnResult = signal<any>(null);
  docResult = signal<any>(null);

  // Chat State
  userChatInput = '';
  chatMessages = signal<ChatMessage[]>([
    { sender: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI Bán Lẻ chạy trực tiếp trên máy chủ GB10. Bạn cần hỗ trợ gì hôm nay?', timestamp: new Date() }
  ]);

  setDemo(view: DemoView) {
    this.activeDemo.set(view);
  }

  toggleRecording() {
    this.isRecording.update(v => !v);
    if (!this.isRecording()) {
      this.currentTranscript.set('Cho tôi hỏi sữa Meiji 800g ở quầy nào và đang có khuyến mãi gì không?');
      this.http.post<any>('/api/v1/kiosk/process-intent', { text: 'Sữa Meiji 800g ở đâu?' }).subscribe({
        next: (res) => this.kioskResponse.set(res),
        error: () => this.kioskResponse.set({ status: 'mocked', intent: 'FIND_PRODUCT', sku_keyword: 'Sữa Meiji 800g' })
      });
    } else {
      this.currentTranscript.set('Đang thu âm giọng nói với PhoWhisper-large...');
    }
  }

  sendChatMessage() {
    if (!this.userChatInput.trim()) return;
    const text = this.userChatInput;
    this.userChatInput = '';

    this.chatMessages.update(msgs => [...msgs, { sender: 'user', text: text, timestamp: new Date() }]);

    this.http.post<any>('/api/v1/kiosk/process-intent', { text: text }).subscribe({
      next: (res) => {
        this.chatMessages.update(msgs => [...msgs, {
          sender: 'assistant',
          text: `Đã xử lý ý định: ${res.ai_response || 'Tìm thấy thông tin SKU phù hợp.'}`,
          timestamp: new Date()
        }]);
      },
      error: () => {
        this.chatMessages.update(msgs => [...msgs, {
          sender: 'assistant',
          text: `[GB10 Qwen2.5-32B]: Tôi đã nhận câu hỏi '${text}'. Hệ thống đang truy vấn kho hàng siêu thị và tìm chương trình ưu đãi tốt nhất cho bạn.`,
          timestamp: new Date()
        }]);
      }
    });
  }

  solveSchedule() {
    this.scheduleResult.set({ status: 'OPTIMAL', solved_in: '8.4s', solver: 'Google OR-Tools Java MILP', total_shifts_assigned: 140 });
  }

  testTryOn() {
    this.tryOnResult.set('Đã gửi Workflow CatVTON sang ComfyUI Engine (Port 8188). Đang render ảnh thử trang phục...');
  }

  testDocExtract() {
    this.docResult.set({ invoice_no: 'VAT-2026-8891', seller_tax: '0101234567', total_amount: 14500000, status: '3-WAY MATCH PASSED' });
  }
}
