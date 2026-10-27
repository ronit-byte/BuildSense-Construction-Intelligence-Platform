from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import io, re

app = FastAPI(title="Multimodal Construction Intelligence Platform", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {".txt", ".md", ".pdf", ".png", ".jpg", ".jpeg", ".webp"}

class TextRequest(BaseModel):
    text: str

def analyze_text(text: str):
    text = text or ""
    lower = text.lower()
    checks = [
        ("PPE / personal protective equipment", ["helmet", "hard hat", "safety vest", "ppe", "protective equipment"]),
        ("Working at height", ["scaffold", "scaffolding", "ladder", "working at height", "fall protection", "roof edge"]),
        ("Electrical safety", ["exposed wire", "live wire", "electrical hazard", "power cable", "electrocution"]),
        ("Housekeeping / trip hazards", ["debris", "trip hazard", "clutter", "obstructed walkway", "waste material"]),
        ("Fire safety", ["fire extinguisher", "flammable", "hot work", "fire hazard", "combustible"]),
        ("Structural / excavation safety", ["crack", "excavation", "trench", "unstable wall", "structural damage"]),
    ]
    findings = []
    for label, keywords in checks:
        matches = [kw for kw in keywords if kw in lower]
        if matches:
            findings.append({
                "category": label,
                "severity": "High" if label in ("Electrical safety", "Structural / excavation safety") else "Medium",
                "evidence": ", ".join(matches[:3]),
                "recommendation": {
                    "PPE / personal protective equipment": "Verify required PPE is available, correctly worn, and suitable for the task.",
                    "Working at height": "Inspect access equipment and edge protection; use approved fall protection where required.",
                    "Electrical safety": "Stop work near suspected electrical hazards and have a qualified person isolate and inspect the area.",
                    "Housekeeping / trip hazards": "Clear walkways, secure loose materials, and maintain designated access routes.",
                    "Fire safety": "Check hot-work controls, remove combustibles, and keep suitable fire equipment accessible.",
                    "Structural / excavation safety": "Restrict access until a competent person assesses stability and required protective measures.",
                }[label]
            })
    if not findings:
        findings.append({
            "category": "No keyword-based concern detected",
            "severity": "Info",
            "evidence": "No configured safety keywords found in extracted text.",
            "recommendation": "This is only a preliminary text scan. A competent site professional must verify actual site conditions."
        })
    return {
        "summary": f"Scanned {len(text.split())} words and identified {len([f for f in findings if f['severity'] != 'Info'])} potential topic(s).",
        "word_count": len(text.split()),
        "findings": findings,
        "disclaimer": "Prototype screening only; not a substitute for a qualified safety inspection or engineering assessment."
    }

def extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""

def extract_image(data: bytes) -> str:
    # OCR is optional. Install Tesseract separately for OCR support.
    try:
        from PIL import Image
        import pytesseract
        return pytesseract.image_to_string(Image.open(io.BytesIO(data)))
    except Exception:
        return ""

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Multimodal Construction Intelligence Platform"}

@app.post("/api/analyze-text")
def analyze_text_endpoint(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Please enter some text to analyze.")
    return analyze_text(req.text[:100_000])

@app.post("/api/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Use: {', '.join(sorted(ALLOWED))}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum upload size is 10 MB.")
    extracted = ""
    kind = "text"
    if suffix == ".pdf":
        extracted, kind = extract_pdf(data), "PDF document"
    elif suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        extracted, kind = extract_image(data), "image (OCR)"
    else:
        extracted = data.decode("utf-8", errors="replace")
    if not extracted.strip():
        extracted = ""
    result = analyze_text(extracted) if extracted else {
        "summary": "The file was uploaded, but no readable text was extracted.",
        "word_count": 0,
        "findings": [{
            "category": "Text extraction unavailable",
            "severity": "Info",
            "evidence": "PDF may be scanned, or image OCR dependencies may be missing.",
            "recommendation": "For PDF, ensure it contains selectable text. For image OCR, install Tesseract and the optional Python packages listed in README."
        }],
        "disclaimer": "Prototype screening only; not a substitute for a qualified safety inspection or engineering assessment."
    }
    result["file_name"] = file.filename
    result["file_type"] = kind
    result["extracted_text_preview"] = extracted[:1500]
    return result
