"""
NLP microservice for Phase 1: PDF text extraction + resume vs job-role analysis.
Node backend calls this over HTTP.
"""
import io
from typing import Optional

import pdfplumber
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

app = FastAPI(title="Career Intelligence NLP Service", version="0.1.0")


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Accept a PDF file, return extracted plain text."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    try:
        raw = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}") from e
    finally:
        await file.close()

    try:
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            parts = []
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    parts.append(t)
            text = "\n\n".join(parts).strip() if parts else ""
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {e}") from e

    return {"text": text}


class AnalyzeRequest(BaseModel):
    resume_text: str
    job_role_skills: list[str]
    skill_dictionary: Optional[list[str]] = None


class RoadmapItem(BaseModel):
    skill: str
    steps: list[str]


class AnalyzeResponse(BaseModel):
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    weak_skills: list[str]
    roadmap: list[RoadmapItem]


def _normalize(s: str) -> str:
    return s.strip().lower()


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest):
    """Stub: resume text + job role skills -> match score, matched/missing/weak, roadmap."""
    resume_lower = _normalize(body.resume_text)
    resume_words = set(resume_lower.split())
    job_skills = [s.strip() for s in body.job_role_skills if s.strip()]
    skill_dict = body.skill_dictionary or job_skills

    matched = []
    missing = []

    for skill in job_skills:
        snorm = _normalize(skill)
        skill_parts = set(snorm.split())
        if skill_parts & resume_words or any(p in resume_lower for p in skill_parts):
            matched.append(skill)
        else:
            missing.append(skill)

    total = len(job_skills) or 1
    match_score = round(100.0 * len(matched) / total, 1)
    roadmap = [
        RoadmapItem(skill=sk, steps=[f"Course for {sk}", f"Project using {sk}"])
        for sk in missing[:10]
    ]

    return AnalyzeResponse(
        match_score=match_score,
        matched_skills=matched,
        missing_skills=missing,
        weak_skills=[],
        roadmap=roadmap,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
