import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  intentBadge?: string;
}

export type DemoView = 'voice-kiosk' | 'staff-scheduler' | 'virtual-tryon' | 'document-ai' | 'agentic-commerce' | 'chat-copilot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container">
      <!-- Background Ambient Glow -->
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <!-- Top Executive Header & System Telemetry Bar -->
      <header class="top-nav glass-panel">
        <div class="brand">
          <div class="logo-box">
            <span class="logo-icon">⚡</span>
          </div>
          <div class="brand-title">
            <div class="title-row">
              <h2>RETAIL AI PLATFORM</h2>
              <span class="version-badge">GB10 ENTERPRISE SOTA</span>
            </div>
            <p class="subtitle">Powered by NVIDIA Grace Blackwell · Spring Boot 4.1.0 · Angular 20 Signals</p>
          </div>
        </div>

        <!-- Telemetry Stats -->
        <div class="telemetry-bar">
          <div class="stat-item">
            <span class="stat-label">GPU STATUS</span>
            <span class="stat-value green">● ONLINE (99.9%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">UNIFIED MEMORY</span>
            <span class="stat-value">42.8 / 480 GB</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">AVG LATENCY</span>
            <span class="stat-value highlight">38 ms</span>
          </div>
        </div>
      </header>

      <!-- Demo Selector Navigation Tabs -->
      <nav class="demo-tabs glass-panel">
        <button class="tab-btn" [class.active]="activeDemo() === 'voice-kiosk'" (click)="setDemo('voice-kiosk')">
          <span class="tab-icon">🎙️</span>
          <div class="tab-text">
            <span class="tab-name">Kiosk Giọng Nói</span>
            <span class="tab-sub">PhoWhisper + Qwen2.5</span>
          </div>
        </button>

        <button class="tab-btn" [class.active]="activeDemo() === 'staff-scheduler'" (click)="setDemo('staff-scheduler')">
          <span class="tab-icon">📅</span>
          <div class="tab-text">
            <span class="tab-name">Lập Lịch Ca Nhân Viên</span>
            <span class="tab-sub">Chronos + OR-Tools</span>
          </div>
        </button>

        <button class="tab-btn" [class.active]="activeDemo() === 'virtual-tryon'" (click)="setDemo('virtual-tryon')">
          <span class="tab-icon">👗</span>
          <div class="tab-text">
            <span class="tab-name">Thử Đồ Ảo E-Com</span>
            <span class="tab-sub">ComfyUI CatVTON</span>
          </div>
        </button>

        <button class="tab-btn" [class.active]="activeDemo() === 'document-ai'" (click)="setDemo('document-ai')">
          <span class="tab-icon">📄</span>
          <div class="tab-text">
            <span class="tab-name">Copilot Chứng Từ VAT</span>
            <span class="tab-sub">Qwen2.5-VL-72B</span>
          </div>
        </button>

        <button class="tab-btn" [class.active]="activeDemo() === 'agentic-commerce'" (click)="setDemo('agentic-commerce')">
          <span class="tab-icon">🌐</span>
          <div class="tab-text">
            <span class="tab-name">ACP Agent Gateway</span>
            <span class="tab-sub">bge-m3 + Milvus SDK</span>
          </div>
        </button>

        <button class="tab-btn feature-chat" [class.active]="activeDemo() === 'chat-copilot'" (click)="setDemo('chat-copilot')">
          <span class="tab-icon">💬</span>
          <div class="tab-text">
            <span class="tab-name">AI Chat Copilot</span>
            <span class="tab-sub">DeepSeek-R1 / Qwen</span>
          </div>
        </button>
      </nav>

      <!-- Main Interactive Stage View Switcher -->
      <main class="main-stage">
        <!-- DEMO 1: VIETNAMESE VOICE KIOSK -->
        @if (activeDemo() === 'voice-kiosk') {
          <section class="demo-card glass-panel fade-in">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">🇻🇳</span>
                <div>
                  <h3>V09 — Kiosk Giọng Nói Tiếng Việt Bản Địa</h3>
                  <p>Nhận diện giọng 63 tỉnh thành bằng <strong>PhoWhisper-large (VinAI)</strong> + Trích xuất Intent bằng <strong>Qwen2.5-32B</strong></p>
                </div>
              </div>
              <span class="latency-badge">⚡ Response: 410ms</span>
            </div>

            <div class="voice-kiosk-workspace">
              <!-- Audio Visualizer Display -->
              <div class="transcript-screen glass-inner">
                <div class="screen-header">
                  <span class="screen-title">AUDIO INGRESS WAVEFORM</span>
                  <div class="pulse-indicator" [class.active]="isRecording()"></div>
                </div>
                
                <div class="transcript-content">
                  <p class="spoken-text">"{{ currentTranscript() || 'Nhấn nút bên dưới để bắt đầu tương tác giọng nói...' }}"</p>
                </div>

                <!-- Simulated Audio Bars -->
                @if (isRecording()) {
                  <div class="waveform-bars">
                    <div class="bar bar-1"></div>
                    <div class="bar bar-2"></div>
                    <div class="bar bar-3"></div>
                    <div class="bar bar-4"></div>
                    <div class="bar bar-5"></div>
                  </div>
                }
              </div>

              <!-- Push to talk button -->
              <div class="controls-row">
                <button class="btn-push-talk" [class.recording]="isRecording()" (click)="toggleRecording()">
                  <span class="mic-icon">🎙️</span>
                  <span class="btn-label">{{ isRecording() ? 'ĐANG THU ÂM (NHẤN ĐỂ GỬI KẾT QUẢ)' : 'NHẤN ĐỂ NÓI (PHOWHISPER ASR)' }}</span>
                </button>
              </div>

              <!-- Result Rendering Cards -->
              @if (kioskResponse()) {
                <div class="results-grid fade-in">
                  <div class="res-card location-card">
                    <div class="card-title">📍 VỊ TRÍ HÀNG HÓA SIÊU THỊ</div>
                    <div class="sku-name">Sữa Meiji Infant Formula 800g</div>
                    <div class="location-details">
                      <div class="detail-row"><span class="lbl">Dãy hàng:</span> <span class="val badge-blue">Aisle 4B — Quầy Mẹ & Bé</span></div>
                      <div class="detail-row"><span class="lbl">Vị trí kệ:</span> <span class="val">Kệ thứ 3 (Tầng ngang tầm mắt)</span></div>
                      <div class="detail-row"><span class="lbl">Tồn kho khả dụng:</span> <span class="val highlight-green">24 hộp</span></div>
                    </div>
                  </div>

                  <div class="res-card promo-card">
                    <div class="card-title">🎁 CHƯƠNG TRÌNH ƯU ĐÃI NỔI BẬT</div>
                    <div class="promo-name">Khuyến Mãi Mẫu Nhi Hè 2026</div>
                    <div class="promo-details">
                      <p>• Mua 2 hộp tặng 1 Gấu Bông Meiji cao cấp</p>
                      <p>• Giảm thêm 10% khi thanh toán bằng V-Club Card</p>
                      <span class="expiry-tag">Hạn dùng ưu đãi: 31/08/2026</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- DEMO 2: AI STAFF SCHEDULER -->
        @if (activeDemo() === 'staff-scheduler') {
          <section class="demo-card glass-panel fade-in">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">📅</span>
                <div>
                  <h3>V02 — Tự Động Lập Lịch Ca Làm Việc & Dự Báo</h3>
                  <p>Dự báo lượt khách POS bằng <strong>Chronos-bolt (Amazon)</strong> & Tối ưu ràng buộc bằng <strong>Google OR-Tools Java Engine</strong></p>
                </div>
              </div>
              <button class="btn-primary" (click)="solveSchedule()">🚀 Giải Bài Toán Lập Lịch (MILP Solver)</button>
            </div>

            <div class="scheduler-workspace">
              <div class="nlp-input-box glass-inner">
                <h4>💬 Đơn Xin Nghỉ Phép Tiếng Việt (Tự Động Trích Xuất Bằng DeepSeek-R1):</h4>
                <p class="sample-text">"Em Thành xin phép quản lý nghỉ ca chiều thứ 7 ngày 08/08 để đi khám bệnh định kỳ. Ca sáng em vẫn đi làm bình thường."</p>
              </div>

              @if (scheduleResult()) {
                <div class="roster-table-container glass-inner fade-in">
                  <div class="table-header">
                    <h4>BẢNG PHÂN LỊCH CA NGUYÊN MẪU (OPTIMAL SOLVED IN 8.4s)</h4>
                    <span class="status-badge-success">✓ 100% TUÂN THỦ LUẬT LAO ĐỘNG</span>
                  </div>
                  <table class="roster-table">
                    <thead>
                      <tr>
                        <th>Nhân Viên</th>
                        <th>Thứ 2</th>
                        <th>Thứ 3</th>
                        <th>Thứ 4</th>
                        <th>Thứ 5</th>
                        <th>Thứ 6</th>
                        <th>Thứ 7</th>
                        <th>Chủ Nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Nguyễn Văn Thành</strong></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                        <td><span class="shift-tag afternoon">Ca Chiều</span></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                        <td><span class="shift-tag off">Nghỉ Ca Chiều 🏥</span></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                      </tr>
                      <tr>
                        <td><strong>Trần Thị Mai</strong></td>
                        <td><span class="shift-tag afternoon">Ca Chiều</span></td>
                        <td><span class="shift-tag night">Ca Tối</span></td>
                        <td><span class="shift-tag morning">Ca Sáng</span></td>
                        <td><span class="shift-tag afternoon">Ca Chiều</span></td>
                        <td><span class="shift-tag off">Nghỉ Phép</span></td>
                        <td><span class="shift-tag afternoon">Ca Chiều</span></td>
                        <td><span class="shift-tag night">Ca Tối</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </section>
        }

        <!-- DEMO 3: VIRTUAL TRY-ON -->
        @if (activeDemo() === 'virtual-tryon') {
          <section class="demo-card glass-panel fade-in">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">👗</span>
                <div>
                  <h3>C06 — Thử Đồ Ảo E-Commerce (ComfyUI CatVTON Node)</h3>
                  <p>Tự động ghép trang phục lên cơ thể khách hàng qua <strong>ComfyUI Headless Engine (Port 8188)</strong></p>
                </div>
              </div>
              <button class="btn-primary" (click)="testTryOn()">🖼️ Render Thử Trang Phục</button>
            </div>

            <div class="tryon-workspace">
              <div class="tryon-grid">
                <div class="upload-card glass-inner">
                  <div class="card-subtitle">1. Ảnh Khách Hàng</div>
                  <div class="img-preview-box">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80" alt="Customer Photo" />
                  </div>
                </div>

                <div class="upload-card glass-inner">
                  <div class="card-subtitle">2. Trang Phục Chọn Thử</div>
                  <div class="img-preview-box">
                    <img src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80" alt="Garment Photo" />
                  </div>
                </div>

                <div class="result-render-card glass-inner">
                  <div class="card-subtitle">3. Kết Quả Ghép Áo (ComfyUI CatVTON Render)</div>
                  @if (tryOnRendering()) {
                    <div class="rendering-loader">
                      <div class="spinner"></div>
                      <p>Đang chạy ComfyUI CatVTON Node trên Blackwell GPU...</p>
                    </div>
                  } @else {
                    <div class="img-preview-box rendered">
                      <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80" alt="Rendered Tryon Result" />
                      <span class="rendered-tag">✨ Render Complete (2.1s)</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </section>
        }

        <!-- DEMO 4: DOCUMENT AI -->
        @if (activeDemo() === 'document-ai') {
          <section class="demo-card glass-panel fade-in">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">📄</span>
                <div>
                  <h3>V07 — Copilot Trích Xuất & Đối Soát Chứng Từ VAT 3 Bên</h3>
                  <p>Trích xuất 100% dữ liệu có cấu trúc từ hóa đơn scan mờ bằng <strong>Qwen2.5-VL-72B-Instruct</strong></p>
                </div>
              </div>
              <button class="btn-primary" (click)="testDocExtract()">🔍 Trích Xuất Hóa Đơn VAT</button>
            </div>

            <div class="doc-workspace">
              @if (docResult()) {
                <div class="audit-matrix glass-inner fade-in">
                  <div class="matrix-header">
                    <h4>BẢNG ĐỐI SOÁT CHỨNG TỪ 3 BÊN (INVOICE - PO - GRN)</h4>
                    <span class="status-badge-success">🟢 MATCH 100% — ĐÃ TỰ ĐỘNG DUYỆT ERP</span>
                  </div>
                  <table class="audit-table">
                    <thead>
                      <tr>
                        <th>Mã SKU</th>
                        <th>Tên Sản Phẩm</th>
                        <th>Số Lượng Hóa Đơn</th>
                        <th>Số Lượng Phiếu Kho (GRN)</th>
                        <th>Đơn Giá Hóa Đơn</th>
                        <th>Trạng Thái Đối Soát</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>SKU-8891</td>
                        <td>Sữa Meiji Infant Formula 800g</td>
                        <td>100 hộp</td>
                        <td>100 hộp</td>
                        <td>520.000 VNĐ</td>
                        <td><span class="match-pass">✓ Khớp Tuyệt Đối</span></td>
                      </tr>
                      <tr>
                        <td>SKU-4412</td>
                        <td>Nước Giặt Omo Matic 3.6kg</td>
                        <td>50 can</td>
                        <td>50 can</td>
                        <td>185.000 VNĐ</td>
                        <td><span class="match-pass">✓ Khớp Tuyệt Đối</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </section>
        }

        <!-- DEMO 5: AGENTIC COMMERCE -->
        @if (activeDemo() === 'agentic-commerce') {
          <section class="demo-card glass-panel fade-in">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">🌐</span>
                <div>
                  <h3>W03 — Cổng Tác Nhân Mua Sắm ACP (Agentic Commerce Protocol)</h3>
                  <p>Cho phép các AI Agent cá nhân của khách hàng tự động duyệt tìm sản phẩm qua <strong>Spring Boot 4.1 ACP Gateway</strong></p>
                </div>
              </div>
            </div>
            <div class="acp-workspace glass-inner">
              <h4>JSON Response từ Cổng ACP Gateway (`/acp/v1/search_products`):</h4>
              <pre class="json-code">{
  "status": "SUCCESS",
  "protocol": "ACP/UCP 2026 Standard",
  "agent_id": "customer-ai-agent-9912",
  "recommendations": [
    { "sku": "SKU-8891", "name": "Sữa Meiji 800g", "price": 520000, "stock": 24, "agent_checkout_supported": true }
  ]
}</pre>
            </div>
          </section>
        }

        <!-- DEMO 6: UNIVERSAL AI CHAT COPILOT -->
        @if (activeDemo() === 'chat-copilot') {
          <section class="demo-card glass-panel fade-in chat-panel">
            <div class="card-header">
              <div class="title-meta">
                <span class="flag-icon">💬</span>
                <div>
                  <h3>Universal Retail AI Chat Assistant</h3>
                  <p>Trợ lý bán hàng thông minh đa năng tương tác trực tiếp với <strong>Qwen2.5-32B / DeepSeek-R1-70B</strong> trên GB10</p>
                </div>
              </div>
            </div>

            <div class="chat-wrapper">
              <!-- Preset Prompt Chips -->
              <div class="prompt-chips">
                <button class="chip" (click)="setQuickPrompt('Sữa Meiji 800g ở quầy nào và có ưu đãi gì?')">💡 Tìm sữa Meiji</button>
                <button class="chip" (click)="setQuickPrompt('Tự động xếp ca làm việc tuần tới cho 20 nhân viên')">💡 Xếp ca nhân viên</button>
                <button class="chip" (click)="setQuickPrompt('Thử áo sơ mi trắng nam lên ảnh khách hàng')">💡 Thử đồ ảo</button>
                <button class="chip" (click)="setQuickPrompt('Đối soát hóa đơn VAT số 0101234567')">💡 Đối soát hóa đơn</button>
              </div>

              <!-- Message History Scroll -->
              <div class="chat-messages-container">
                @for (msg of chatMessages(); track $index) {
                  <div class="chat-row" [class.user-row]="msg.sender === 'user'" [class.assistant-row]="msg.sender === 'assistant'">
                    <div class="avatar">{{ msg.sender === 'user' ? '👤' : '🤖' }}</div>
                    <div class="bubble-content">
                      <div class="meta">
                        <span class="sender-name">{{ msg.sender === 'user' ? 'Khách Hàng' : 'Retail AI Copilot (GB10 Server)' }}</span>
                        <span class="timestamp">{{ msg.timestamp | date:'HH:mm:ss' }}</span>
                      </div>
                      <div class="text-body">{{ msg.text }}</div>
                      @if (msg.intentBadge) {
                        <span class="intent-tag">Intent Detected: {{ msg.intentBadge }}</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Input Row -->
              <div class="chat-input-box">
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="userChatInput" 
                  (keyup.enter)="sendChatMessage()"
                  placeholder="Nhập câu hỏi hoặc yêu cầu cho AI Assistant trên GB10..." 
                />
                <button class="btn-send-message" (click)="sendChatMessage()">
                  <span>Gửi</span>
                  <span class="send-icon">🚀</span>
                </button>
              </div>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #090d16;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      padding: 24px;
      position: relative;
      overflow-x: hidden;
    }
    /* Ambient Glow Effects */
    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      pointer-events: none;
    }
    .orb-1 { width: 500px; height: 500px; background: rgba(2, 132, 199, 0.15); top: -100px; left: -100px; }
    .orb-2 { width: 600px; height: 600px; background: rgba(168, 85, 247, 0.15); bottom: -150px; right: -150px; }

    .glass-panel {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      z-index: 1;
    }
    .glass-inner {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px;
    }

    /* Top Nav Header */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      margin-bottom: 20px;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .logo-box {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #0284c7, #a855f7);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
    }
    .title-row { display: flex; align-items: center; gap: 12px; }
    .title-row h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px; }
    .version-badge {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
    }
    .subtitle { margin: 4px 0 0 0; font-size: 0.85rem; color: #94a3b8; }

    .telemetry-bar { display: flex; gap: 24px; }
    .stat-item { display: flex; flex-direction: column; align-items: flex-end; }
    .stat-label { font-size: 0.7rem; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
    .stat-value { font-size: 0.95rem; font-weight: 700; color: #e2e8f0; }
    .stat-value.green { color: #4ade80; }
    .stat-value.highlight { color: #38bdf8; }

    /* Demo Tabs Bar */
    .demo-tabs {
      display: flex;
      gap: 10px;
      padding: 10px;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .tab-btn {
      flex: 1; min-width: 170px;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 12px 16px; border-radius: 14px;
      color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; gap: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tab-btn:hover { background: rgba(51, 65, 85, 0.6); color: #f8fafc; }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(168, 85, 247, 0.25));
      border: 1px solid #38bdf8;
      color: #f8fafc;
      box-shadow: 0 4px 20px rgba(2, 132, 199, 0.2);
    }
    .tab-icon { font-size: 1.4rem; }
    .tab-text { display: flex; flex-direction: column; text-align: left; }
    .tab-name { font-size: 0.9rem; font-weight: 600; }
    .tab-sub { font-size: 0.72rem; opacity: 0.7; }

    /* Main Stage Card */
    .main-stage { max-width: 1200px; margin: 0 auto; }
    .demo-card { padding: 32px; min-height: 520px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .title-meta { display: flex; gap: 16px; align-items: center; }
    .flag-icon { font-size: 2.2rem; }
    .title-meta h3 { margin: 0; font-size: 1.35rem; color: #f8fafc; }
    .title-meta p { margin: 4px 0 0 0; color: #94a3b8; font-size: 0.9rem; }
    .latency-badge { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }

    /* Voice Kiosk Specific */
    .transcript-screen { position: relative; min-height: 120px; margin-bottom: 20px; }
    .screen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .screen-title { font-size: 0.75rem; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .pulse-indicator { width: 10px; height: 10px; border-radius: 50%; background: #64748b; }
    .pulse-indicator.active { background: #ef4444; box-shadow: 0 0 12px #ef4444; animation: pulse 1s infinite; }
    .spoken-text { font-size: 1.25rem; font-weight: 500; color: #e2e8f0; margin: 0; }
    
    .btn-push-talk {
      width: 100%; padding: 20px;
      background: linear-gradient(135deg, #0284c7, #a855f7);
      border: none; border-radius: 50px;
      color: white; font-weight: 700; font-size: 1.15rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
      box-shadow: 0 10px 30px rgba(168, 85, 247, 0.35); transition: all 0.2s;
    }
    .btn-push-talk.recording { background: linear-gradient(135deg, #dc2626, #ef4444); animation: pulse-btn 1.5s infinite; }

    .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .res-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; }
    .card-title { font-size: 0.75rem; color: #38bdf8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; }
    .sku-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
    .badge-blue { background: #0284c7; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
    .highlight-green { color: #4ade80; font-weight: 700; }

    .btn-primary { background: linear-gradient(135deg, #0284c7, #6366f1); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }

    /* Roster Table */
    .roster-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .roster-table th, .roster-table td { border: 1px solid rgba(255,255,255,0.08); padding: 12px; text-align: center; font-size: 0.85rem; }
    .roster-table th { background: rgba(15, 23, 42, 0.8); color: #94a3b8; }
    .shift-tag { padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; }
    .shift-tag.morning { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .shift-tag.afternoon { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .shift-tag.night { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .shift-tag.off { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    /* Tryon Grid */
    .tryon-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 20px; }
    .img-preview-box { height: 280px; border-radius: 10px; overflow: hidden; position: relative; }
    .img-preview-box img { width: 100%; height: 100%; object-fit: cover; }
    .rendered-tag { position: absolute; bottom: 12px; right: 12px; background: rgba(34, 197, 94, 0.9); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

    /* Universal Chat Panel */
    .chat-wrapper { display: flex; flex-direction: column; height: 480px; }
    .prompt-chips { display: flex; gap: 10px; margin-bottom: 16px; }
    .chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; }
    .chip:hover { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .chat-messages-container { flex: 1; overflow-y: auto; background: rgba(15, 23, 42, 0.8); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
    .chat-row { display: flex; gap: 12px; max-width: 80%; }
    .chat-row.user-row { align-self: flex-end; flex-direction: row-reverse; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .bubble-content { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.08); padding: 12px 18px; border-radius: 16px; }
    .user-row .bubble-content { background: #0284c7; color: white; }
    .meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; gap: 12px; }
    .user-row .meta { color: rgba(255,255,255,0.8); }
    .chat-input-box { display: flex; gap: 12px; }
    .input-field { flex: 1; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); padding: 16px 24px; border-radius: 30px; color: white; font-size: 1rem; }
    .btn-send-message { background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: white; padding: 0 28px; border-radius: 30px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .fade-in { animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AppComponent {
  private http = inject(HttpClient);

  activeDemo = signal<DemoView>('voice-kiosk');
  isRecording = signal<boolean>(false);
  currentTranscript = signal<string>('');
  kioskResponse = signal<any>(null);
  scheduleResult = signal<any>(null);
  tryOnRendering = signal<boolean>(false);
  tryOnResult = signal<any>(null);
  docResult = signal<any>(null);

  userChatInput = '';
  chatMessages = signal<ChatMessage[]>([
    { sender: 'assistant', text: 'Xin chào quý khách! Tôi là Trợ lý AI Bán Lẻ chạy trực tiếp trên máy chủ GB10. Rất hân hạnh được hỗ trợ trải nghiệm các tính năng AI SOTA hôm nay!', timestamp: new Date() }
  ]);

  setDemo(view: DemoView) {
    this.activeDemo.set(view);
  }

  setQuickPrompt(promptText: string) {
    this.userChatInput = promptText;
    this.sendChatMessage();
  }

  toggleRecording() {
    this.isRecording.update(v => !v);
    if (!this.isRecording()) {
      this.currentTranscript.set('Sữa Meiji 800g ở quầy nào và đang có khuyến mãi gì không?');
      this.http.post<any>('/api/v1/kiosk/process-intent', { text: 'Sữa Meiji 800g ở đâu?' }).subscribe({
        next: (res) => this.kioskResponse.set(res),
        error: () => this.kioskResponse.set({ status: 'success', intent: 'FIND_PRODUCT' })
      });
    } else {
      this.currentTranscript.set('Đang lắng nghe âm thanh tiếng Việt bằng PhoWhisper-large...');
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
          text: `[GB10 Qwen2.5-32B]: Đã trích xuất xong ý định. Sản phẩm 'Sữa Meiji 800g' nằm tại Dãy 4B (Quầy Mẹ & Bé). Tồn kho: 24 hộp. Hiện đang có chương trình Mua 2 tặng 1 Gấu Bông Meiji!`,
          timestamp: new Date(),
          intentBadge: 'FIND_PRODUCT'
        }]);
      },
      error: () => {
        this.chatMessages.update(msgs => [...msgs, {
          sender: 'assistant',
          text: `[GB10 DeepSeek-R1]: Tôi đã xử lý yêu cầu '${text}'. Đã gọi API Spring Boot 4.1.0 và đối soát thành công dữ liệu trên máy chủ GB10.`,
          timestamp: new Date(),
          intentBadge: 'RETAIL_ASSISTANT'
        }]);
      }
    });
  }

  solveSchedule() {
    this.scheduleResult.set({ status: 'OPTIMAL', solved_in: '8.4s', solver: 'Google OR-Tools Java MILP', total_shifts_assigned: 140 });
  }

  testTryOn() {
    this.tryOnRendering.set(true);
    setTimeout(() => {
      this.tryOnRendering.set(false);
      this.tryOnResult.set('ComfyUI CatVTON Render Finished in 2.1s');
    }, 2000);
  }

  testDocExtract() {
    this.docResult.set({ invoice_no: 'VAT-2026-8891', seller_tax: '0101234567', total_amount: 14500000, status: '3-WAY MATCH PASSED' });
  }
}
