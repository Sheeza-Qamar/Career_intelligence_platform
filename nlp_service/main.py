"""
NLP microservice for Phase 1: PDF text extraction + resume vs job-role analysis.
Node backend calls this over HTTP.
"""
import io
import os
import re
import tempfile
from typing import Optional

import pdfplumber
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import ATS analysis services
from app.services.resume_parser import ResumeParser
from app.services.ats_scorer import ATSScorer
from app.services.skill_extractor import SkillExtractor
from app.services.domain_classifier import DomainClassifier
from app.models.schemas import AnalysisResponse

app = FastAPI(title="Career Intelligence NLP Service", version="0.1.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ATS services
resume_parser = ResumeParser()
ats_scorer = ATSScorer()
skill_extractor = SkillExtractor()
domain_classifier = DomainClassifier()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


_HEADING_KEYWORDS = [
    "summary",
    "professional summary",
    "profile",
    "objective",
    "skills",
    "experience",
    "work experience",
    "education",
    "projects",
    "certifications",
]


def _extract_pdf_text(raw: bytes) -> str:
    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        parts = []
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
        return "\n\n".join(parts).strip() if parts else ""


def _detect_columns(words: list[dict]) -> bool:
    if len(words) < 40:
        return False
    x_positions = sorted(w.get("x0") for w in words if isinstance(w.get("x0"), (int, float)))
    if len(x_positions) < 40:
        return False
    gaps = [x_positions[i] - x_positions[i - 1] for i in range(1, len(x_positions))]
    max_gap = max(gaps) if gaps else 0
    if max_gap < 100:
        return False
    split_index = gaps.index(max_gap) + 1
    left = split_index
    right = len(x_positions) - split_index
    return left >= 10 and right >= 10


def _count_bullets(text: str) -> int:
    count = 0
    for line in text.splitlines():
        if re.match(r"^\s*([•\-\*])\s+", line):
            count += 1
    return count


def _extract_contact_signals(text: str) -> dict:
    email_match = re.search(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", text)
    return {
        "email": email_match.group(0) if email_match else None,
    }


def _ats_layout_from_pdf(raw: bytes) -> dict:
    flags = {"tables": False, "images": False, "columns": False, "standard_headings": False}
    issues = []
    headings_found = set()
    bullet_count = 0

    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            lower = text.lower()
            for heading in _HEADING_KEYWORDS:
                if heading in lower:
                    headings_found.add(heading)
            bullet_count += _count_bullets(text)

            if page.images:
                flags["images"] = True
            try:
                tables = page.extract_tables()
                if tables and any(len(t) > 0 for t in tables):
                    flags["tables"] = True
            except Exception:
                pass

            words = page.extract_words() or []
            if _detect_columns(words):
                flags["columns"] = True

    flags["standard_headings"] = len(headings_found) > 0

    score = 0
    if not flags["tables"]:
        score += 15
    else:
        issues.append("Tables detected")
    if not flags["images"]:
        score += 10
    else:
        issues.append("Images detected")
    if not flags["columns"]:
        score += 15
    else:
        issues.append("Multiple columns detected")
    if flags["standard_headings"]:
        score += 15
    else:
        issues.append("Standard section headings missing")
    if bullet_count >= 3:
        score += 10
    else:
        issues.append("Bullet points not detected")

    text = _extract_pdf_text(raw)
    contact = _extract_contact_signals(text)
    if contact.get("email"):
        score += 10
    else:
        issues.append("Contact email not detected")

    score = max(0, min(100, score))

    return {
        "ats_layout_score": score,
        "issues": issues,
        "flags": flags,
        "signals": {
            "bullet_count": bullet_count,
            "headings_found": sorted(headings_found),
            "email": contact.get("email"),
        },
    }


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
        text = _extract_pdf_text(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {e}") from e

    return {"text": text}


@app.post("/layout-check")
async def layout_check(file: UploadFile = File(...)):
    """Accept a PDF file, return ATS layout score + issues."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    try:
        raw = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}") from e
    finally:
        await file.close()

    try:
        result = _ats_layout_from_pdf(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Layout analysis failed: {e}") from e

    return result


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


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_resume(file: UploadFile = File(...)):
    """
    Analyze uploaded resume and return comprehensive ATS analysis
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5MB limit"
        )
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Parse resume
        parsed_data = resume_parser.parse(tmp_path, file_ext)
        
        # Get OCR metadata
        parsing_method = parsed_data.get("parsing_method", "standard")
        ocr_confidence = parsed_data.get("ocr_confidence")
        
        # Extract skills
        skills_data = skill_extractor.extract(parsed_data["raw_text"])
        
        # Classify domain
        domain_data = domain_classifier.classify(parsed_data["raw_text"], skills_data)
        
        # Calculate ATS score (OCR-aware)
        ats_analysis = ats_scorer.calculate_score(
            parsed_data, 
            skills_data, 
            domain_data,
            parsing_method=parsing_method,
            ocr_confidence=ocr_confidence
        )
        
        # Cleanup temporary file
        os.unlink(tmp_path)
        
        # Build response
        response = AnalysisResponse(
            success=True,
            candidate=parsed_data["candidate"],
            ats_score=ats_analysis["score"],
            score_breakdown=ats_analysis["breakdown"],
            score_category=ats_analysis["category"],
            domain=domain_data,
            skills=skills_data,
            projects=parsed_data["projects"],
            experience=parsed_data["experience"],
            education=parsed_data["education"],
            issues=ats_analysis["issues"],
            suggestions=ats_analysis["suggestions"],
            keywords_analysis=ats_analysis["keywords_analysis"],
            # OCR metadata
            parsing_method=parsing_method,
            ocr_confidence=ocr_confidence
        )
        
        return response
        
    except Exception as e:
        # Cleanup on error
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
