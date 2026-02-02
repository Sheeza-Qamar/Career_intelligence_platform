"""Shared PDF and analysis logic for Vercel serverless."""
import io
import re

import pdfplumber

_HEADING_KEYWORDS = [
    "summary", "professional summary", "profile", "objective",
    "skills", "experience", "work experience", "education",
    "projects", "certifications",
]


def extract_pdf_text(raw: bytes) -> str:
    with pdfplumber.open(io.BytesIO(raw)) as pdf:
        parts = []
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
        return "\n\n".join(parts).strip() if parts else ""


def _detect_columns(words: list) -> bool:
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
    return {"email": email_match.group(0) if email_match else None}


def ats_layout_from_pdf(raw: bytes) -> dict:
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
    text = extract_pdf_text(raw)
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


def analyze_skills(resume_text: str, job_role_skills: list, skill_dictionary: list = None):
    resume_lower = resume_text.strip().lower()
    resume_words = set(resume_lower.split())
    job_skills = [s.strip() for s in job_role_skills if s.strip()]
    skill_dict = skill_dictionary or job_skills
    matched = []
    missing = []
    for skill in job_skills:
        snorm = skill.strip().lower()
        skill_parts = set(snorm.split())
        if skill_parts & resume_words or any(p in resume_lower for p in skill_parts):
            matched.append(skill)
        else:
            missing.append(skill)
    total = len(job_skills) or 1
    match_score = round(100.0 * len(matched) / total, 1)
    roadmap = [{"skill": sk, "steps": [f"Course for {sk}", f"Project using {sk}"]} for sk in missing[:10]]
    return {
        "match_score": match_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "weak_skills": [],
        "roadmap": roadmap,
    }
