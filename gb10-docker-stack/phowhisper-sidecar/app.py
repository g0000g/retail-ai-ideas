import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from faster_whisper import WhisperModel
import uvicorn

app = FastAPI(title="VinAI PhoWhisper ASR Sidecar Service")

# Initialize VinAI PhoWhisper-large int8 model on CUDA GPU
MODEL_SIZE = os.getenv("PHOWHISPER_MODEL", "vinai/PhoWhisper-large")
print(f"Loading PhoWhisper model: {MODEL_SIZE} on CUDA...")
asr_model = WhisperModel(MODEL_SIZE, device="cuda", compute_type="int8")

DEFAULT_HOTWORDS = "Meiji, Vinamilk, TH True Milk, Omo, Comfort, Aquafina, Hảo Hảo, Cocacola, Size XL, Kiosk"

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": MODEL_SIZE}

@app.post("/asr/phowhisper")
async def transcribe_audio(
    file: UploadFile = File(...),
    hotwords: str = Form(DEFAULT_HOTWORDS)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        segments, info = asr_model.transcribe(
            tmp_path,
            language="vi",
            initial_prompt=hotwords,
            beam_size=5
        )
        transcribed_text = " ".join([segment.text for segment in segments]).strip()
        return {
            "status": "success",
            "transcribed_text": transcribed_text,
            "detected_language": info.language,
            "probability": info.language_probability
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8090)
