import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kiosk-container">
      <header>
        <h1>🛒 GB10 Retail AI Platform</h1>
        <p class="subtitle">Powered by Spring Boot 4.1.0 · Angular 20 · PhoWhisper · Qwen2.5 · ComfyUI</p>
      </header>

      <main class="card-grid">
        <section class="card">
          <h2>🎙️ V09 — Kiosk Giọng Nói Tiếng Việt</h2>
          <p>Nhận diện giọng nói 63 tỉnh thành bằng <strong>PhoWhisper-large</strong> local trên GB10.</p>
          
          <div class="input-group">
            <button class="btn-primary" (click)="testVoiceIntent()">
              🧪 Test Gọi Intent ("Sữa Meiji 800g ở đâu?")
            </button>
          </div>

          @if (kioskResponse()) {
            <div class="response-box">
              <h4>Kết quả từ Máy Chủ GB10:</h4>
              <pre>{{ kioskResponse() | json }}</pre>
            </div>
          }
        </section>

        <section class="card">
          <h2>📅 V02 — Tự Động Lập Lịch Ca Ca Nhân Viên</h2>
          <p>Dự báo lượt khách bằng <strong>Chronos-bolt</strong> & giải toán ràng buộc bằng <strong>Google OR-Tools Java Engine</strong>.</p>
        </section>

        <section class="card">
          <h2>👗 C06 — Thử Đồ Ảo (Virtual Try-On)</h2>
          <p>Ghép trang phục tức thì qua <strong>ComfyUI CatVTON Node Engine</strong>.</p>
        </section>

        <section class="card">
          <h2>📄 V07 — Copilot Trích Xuất Chứng Từ VAT</h2>
          <p>Trích xuất JSON 100% từ ảnh hóa đơn mờ bằng <strong>Qwen2.5-VL-72B-Instruct</strong>.</p>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .kiosk-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #f8fafc;
    }
    header h1 {
      font-size: 2.5rem;
      color: #38bdf8;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 24px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #6366f1);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 16px;
    }
    .response-box {
      margin-top: 16px;
      background: #020617;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    pre {
      color: #4ade80;
      white-space: pre-wrap;
    }
  `]
})
export class AppComponent {
  private http = inject(HttpClient);
  kioskResponse = signal<any>(null);

  testVoiceIntent() {
    this.http.post<any>('/api/v1/kiosk/process-intent', {
      text: 'Sữa Meiji 800g ở quầy nào?'
    }).subscribe({
      next: (res) => this.kioskResponse.set(res),
      error: (err) => this.kioskResponse.set(err)
    });
  }
}
