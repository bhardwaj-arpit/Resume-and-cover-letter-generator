"""
Pydantic models for request/response validation.
"""

from pydantic import BaseModel
from typing import List, Optional


class ResumeRequest(BaseModel):
    """Schema for the resume generation request payload."""

    name: str
    skills: List[str]
    experience: str
    education: str
    target_job: str
    job_description: str

    # NEW STRUCTURED FIELDS
    projects: Optional[str] = ""
    certifications: Optional[str] = ""
    achievements: Optional[str] = ""
    internships: Optional[str] = ""
    tools: Optional[str] = ""
    competitive_programming: Optional[str] = ""
    extracurriculars: Optional[str] = ""


class CoverLetterRequest(BaseModel):
    """Schema for the standalone cover letter generation request."""

    name: str
    target_job: str
    company: str
    hiring_manager: str
    job_description: str
    summary: str
    experience: str
    skills: List[str]


class CoverLetterPDFRequest(BaseModel):
    """Schema for the cover letter PDF generation request."""

    cover_letter: str

    # Sender details (optional — rendered in header when provided)
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    linkedin: Optional[str] = ""
    address: Optional[str] = ""
    city_state_zip: Optional[str] = ""

    # Employer details (optional — rendered in employer block when provided)
    hiring_manager: Optional[str] = ""
    company: Optional[str] = ""
    company_address: Optional[str] = ""
    company_city_state: Optional[str] = ""


