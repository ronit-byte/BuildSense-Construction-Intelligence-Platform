# BuildSense — Multimodal Construction Intelligence Platform

A full-stack starter project for preliminary screening of construction site notes and documents. It accepts text, text-based PDFs, and images (optional OCR), then highlights configured safety-related topics and suggests follow-up actions.

## Important scope note
This is a **prototype**, not a validated AI model, engineering tool, or official safety inspection system. The initial analysis uses keyword rules. Image OCR is optional and extracts text only; it does not visually recognize hazards. Never use the output as the sole basis for safety decisions.

## Features
- React + Vite responsive dashboard
- FastAPI backend
- Text-note analysis endpoint
- PDF text extraction using `pypdf`
- Optional image OCR with Pillow + pytesseract + a local Tesseract installation
- Safety-topic findings, evidence keywords, and suggested next steps
- 10 MB upload limit and supported file validation

## Requirements
- Python 3.10+
- Node.js 18+
- Optional: Tesseract OCR installed on your computer for image OCR

## Run locally

### 1. Start the backend
From the project root:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. API docs: `http://127.0.0.1:8000/docs`.

### 2. Start the frontend
Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## API endpoints
- `GET /api/health` — health check
- `POST /api/analyze-text` — JSON body: `{"text":"..."}`
- `POST /api/analyze-file` — multipart upload field named `file`

## Optional OCR
Install Tesseract OCR for your operating system, then install the Python requirements (Pillow and pytesseract are listed). If OCR cannot run, the upload response explains that no text was extracted.

## Suggested next upgrades
1. Add a real vision model to inspect site photographs (with human verification).
2. Add authentication and role-based access.
3. Add project records and persistent database storage.
4. Add report export (PDF/CSV) and audit logging.
5. Add unit and integration tests.

## Project structure
```
backend/
  main.py
  requirements.txt
frontend/
  index.html
  package.json
  src/
    main.jsx
    style.css
README.md
```
