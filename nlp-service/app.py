import io
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

try:
    from .parser import extract_text_from_pdf, extract_text_from_docx, parse_contact_info, extract_skills_locally, parse_sections
    from .ats_checker import check_pdf_ats, check_docx_ats
    from .skill_matcher import match_skills, calculate_resume_score
except (ImportError, ValueError):
    from parser import extract_text_from_pdf, extract_text_from_docx, parse_contact_info, extract_skills_locally, parse_sections
    from ats_checker import check_pdf_ats, check_docx_ats
    from skill_matcher import match_skills, calculate_resume_score

app = FastAPI(title="AI Resume Matcher NLP Service", version="1.0.0")

# Enable CORS for local cross-origin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    candidate_skills: List[str]
    job_skills: List[str]

@app.get("/")
@app.get("/health")
def read_root():
    return {"status": "healthy", "service": "nlp-service"}

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Receives a resume file, extracts text, runs ATS audits, structures sections, and scores it."""
    filename = file.filename.lower()
    content = await file.read()
    
    # 1. Text Extraction
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(io.BytesIO(content))
        # Reset stream pointer for ATS analysis if needed
        stream = io.BytesIO(content)
        ats_results = check_pdf_ats(stream, text)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(io.BytesIO(content))
        stream = io.BytesIO(content)
        ats_results = check_docx_ats(stream, text)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF or DOCX file.")
        
    if not text.strip():
        raise HTTPException(status_code=422, detail="Unable to extract text from the document. Please ensure it is not password-protected or empty.")
        
    # 2. Local Section Parsing and Structural Analysis
    contact = parse_contact_info(text)
    skills = extract_skills_locally(text)
    sections = parse_sections(text)
    
    # 3. Overall Resume Scoring
    resume_scoring = calculate_resume_score(
        {"contact_info": contact, "skills": skills, "sections": sections},
        ats_results["ats_score"]
    )
    
    return {
        "success": True,
        "filename": file.filename,
        "text": text,  # Return full text so the node backend can feed it to Gemini if needed
        "parsed_data": {
            "contact_info": contact,
            "skills": skills,
            "sections": sections
        },
        "ats_analysis": ats_results,
        "resume_scoring": resume_scoring
    }

@app.post("/match")
def match_job_skills(req: MatchRequest):
    """Calculates matching score and lists overlapping vs missing skills."""
    result = match_skills(req.candidate_skills, req.job_skills)
    return {
        "success": True,
        "match_percentage": result["match_percentage"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"]
    }
