#!/bin/bash
# =================================================================
# SCRIPT TẢI TRƯỚC (PRE-PULL) CÁC MÔ HÌNH SOTA LOCAL NGUỒN MỞ VỀ MÁY CHỦ GB10
# =================================================================

set -e

echo "📥 [1/4] Kiểm tra thư viện HuggingFace CLI / Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 chưa được cài đặt trên Host. Container vLLM/PhoWhisper sẽ tự tải khi khởi chạy."
    exit 0
fi

pip3 install -q huggingface_hub

echo "🚀 [2/4] Bắt đầu tải các mô hình Local SOTA về ổ đĩa GB10 (/models)..."

# Tạo thư mục lưu mô hình tập trung
MODELS_DIR="/models"
mkdir -p "$MODELS_DIR"

echo "🔹 [2.1] Tải mô hình LLM chính: Qwen/Qwen2.5-32B-Instruct..."
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='Qwen/Qwen2.5-32B-Instruct', local_dir='$MODELS_DIR/Qwen2.5-32B-Instruct', resume_download=True)
print('✅ Tải thành công Qwen2.5-32B-Instruct!')
"

echo "🔹 [2.2] Tải mô hình ASR Tiếng Việt: vinai/PhoWhisper-large..."
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='vinai/PhoWhisper-large', local_dir='$MODELS_DIR/PhoWhisper-large', resume_download=True)
print('✅ Tải thành công PhoWhisper-large!')
"

echo "🔹 [2.3] Tải mô hình Dự báo Chuỗi thời gian: amazon/chronos-bolt-small..."
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='amazon/chronos-bolt-small', local_dir='$MODELS_DIR/chronos-bolt-small', resume_download=True)
print('✅ Tải thành công Chronos-bolt-small!')
"

echo "🔹 [2.4] Tải mô hình Embeddings & Vector Search: BAAI/bge-m3..."
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='BAAI/bge-m3', local_dir='$MODELS_DIR/bge-m3', resume_download=True)
print('✅ Tải thành công bge-m3!')
"

echo "🎉 [3/4] HOÀN TẤT! Tất cả các mô hình đã được tải và cache sẵn sàng tại $MODELS_DIR trên GB10."
