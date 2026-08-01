#!/bin/bash
# =================================================================
# ONE-CLICK INSTALLATION & RUN SCRIPT FOR GB10 AI SERVER
# =================================================================

set -e

echo "🚀 [1/5] Checking NVIDIA Drivers & Docker Toolkit on GB10..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "❌ Error: NVIDIA Driver is not installed or nvidia-smi failed!"
    exit 1
fi

nvidia-smi

if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    exit 1
fi

echo "📥 [2/5] Checking Model Download Script..."
if [ -f "./download-models.sh" ]; then
    chmod +x ./download-models.sh
    echo "💡 Running pre-download models script..."
    ./download-models.sh || echo "⚠️ Note: Pre-download skipped or encountered warnings. Containers will auto-download missing models on startup."
fi

echo "📦 [3/5] Building and Launching GB10 Docker Stack..."
docker compose up -d --build

echo "⏳ [4/5] Waiting 15 seconds for services to initialize..."
sleep 15

echo "🔍 [5/5] Health Checking Services..."
echo "--- Docker Containers Status ---"
docker compose ps

echo ""
echo "✅ SUCCESS! GB10 AI Platform is running:"
echo "   • Frontend Angular 20 UI:      http://localhost (Port 80)"
echo "   • Backend Spring Boot 4.1.0:   http://localhost:8080 (Port 8080)"
echo "   • Attu Milvus Web GUI:         http://localhost:8001 (Port 8001 - Thay thế DBeaver)"
echo "   • vLLM Model Engine:           http://localhost:8000 (Port 8000)"
echo "   • PhoWhisper ASR Sidecar:      http://localhost:8090 (Port 8090)"
echo "   • ComfyUI Headless Engine:     http://localhost:8188 (Port 8188)"
echo "   • Milvus Vector Database:      http://localhost:19530 (Port 19530)"
echo ""
echo "🎉 Setup Complete! Open http://localhost in your browser to view the Angular 20 UI."
