"""
FastAPI application – AI Resume & Cover Letter Generator.
"""

import io
import os

from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

load_dotenv()

from models import ResumeRequest, CoverLetterRequest, CoverLetterPDFRequest
from huggingface_service import generate_resume_content, generate_cover_letter
from ats_analyzer import calculate_ats_score

# ---------------------------------------------------------------------------
# Jinja2 template environment — templates live next to this file.
# ---------------------------------------------------------------------------
_TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
_jinja_env = Environment(loader=FileSystemLoader(_TEMPLATE_DIR))

app = FastAPI(
    title="AI Resume & Cover Letter Generator",
    version="1.0.0",
    description="Generate ATS-optimised resumes and tailored cover letters using HuggingFace Inference API.",
)

# ---------------------------------------------------------------------------
# CORS – allow any origin so a local frontend can connect without issues.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate")
async def generate(request: ResumeRequest):
    """
    Accept candidate details, generate a resume & cover letter via
    HuggingFace, compute an ATS score, and return everything as JSON.
    """

    data = request.model_dump()

    try:
        structured_resume, cover_letter = generate_resume_content(data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Build a flat text representation of the resume for ATS keyword matching
    resume = structured_resume
    resume_text = (
        resume.get("summary", "")
        + " ".join(resume.get("skills", []))
        + resume.get("education", "")
    )

    # Experience
    for exp in resume.get("experience", []):
        resume_text += " ".join(exp.get("points", []))

    # Projects
    for proj in resume.get("projects", []):
        resume_text += " ".join(proj.get("points", []))

    # Internships
    for intern in resume.get("internships", []):
        resume_text += " ".join(intern.get("points", []))

    resume_text += " ".join(resume.get("certifications", []))
    resume_text += " ".join(resume.get("achievements", []))
    resume_text += " ".join(resume.get("tools", []))
    resume_text += " ".join(resume.get("competitive_programming", []))
    resume_text += " ".join(resume.get("extracurriculars", []))

    ats_score, missing_keywords = calculate_ats_score(
        resume_text, data["job_description"]
    )

    return {
        "resume": structured_resume,
        "cover_letter": cover_letter,
        "ats_score": ats_score,
        "missing_keywords": missing_keywords,
    }


@app.post("/generate-pdf")
async def generate_pdf(payload: dict = Body(...)):
    """
    Accept resume data as JSON and return a rendered PDF.

    Payload format::

        {
            "resume": { ... },
            "template": "classic" | "modern"   // optional, defaults to "classic"
        }

    If the payload contains a ``"resume"`` key, that value is used as the
    template context; otherwise the entire payload is used directly.
    """

    resume_data = payload.get("resume", payload)
    template_name = payload.get("template", "classic")

    template_file = (
        "resume_modern.html" if template_name == "modern" else "resume_classic.html"
    )

    try:
        template = _jinja_env.get_template(template_file)
        rendered_html = template.render(**resume_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Template rendering failed: {exc}")

    try:
        buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(rendered_html), dest=buffer)
        if pisa_status.err:
            raise RuntimeError(f"xhtml2pdf reported {pisa_status.err} error(s)")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )


@app.post("/generate-cover-letter")
async def generate_cover_letter_endpoint(request: CoverLetterRequest):
    """
    Accept candidate details and generate a professional cover letter
    via HuggingFace.
    """

    data = request.model_dump()

    try:
        cover_letter = generate_cover_letter(data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {"cover_letter": cover_letter}


@app.post("/generate-cover-letter-pdf")
async def generate_cover_letter_pdf(request: CoverLetterPDFRequest):
    """
    Accept a cover letter string and return a rendered PDF.
    """

    try:
        template = _jinja_env.get_template("cover_letter_template.html")
        rendered_html = template.render(**request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Template rendering failed: {exc}")

    try:
        buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(rendered_html), dest=buffer)
        if pisa_status.err:
            raise RuntimeError(f"xhtml2pdf reported {pisa_status.err} error(s)")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="cover_letter.pdf"'},
    )


# ---------------------------------------------------------------------------
# Run with:  uvicorn main:app --reload
# Or:        python main.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

