"""
Service layer for interacting with the HuggingFace Inference API.
"""

import json
import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions"
HF_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"


def _get_api_key() -> str:
    """Return the HuggingFace API key or raise a clear error."""
    if not HF_API_KEY:
        raise RuntimeError(
            "HF_API_KEY environment variable is not set. "
            "Create a .env file with your key — see .env.example."
        )
    return HF_API_KEY


def _query_huggingface(prompt: str, system_message: str = "You are a professional resume writer.") -> str:
    """Send a prompt to the HuggingFace Inference API and return the generated text."""

    api_key = _get_api_key()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 800,
        "temperature": 0.7,
    }

    response = requests.post(HF_CHAT_URL, headers=headers, json=payload, timeout=120)

    if response.status_code != 200:
        raise RuntimeError(
            f"HuggingFace API error ({response.status_code}). "
            "Check your HF_API_KEY and model availability."
        )

    result = response.json()

    try:
        return result["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError):
        raise RuntimeError(f"Unexpected HuggingFace API response format: {result}")


def _clean_json_response(raw: str) -> str:
    """
    Best-effort cleanup of an LLM response so it can be parsed by json.loads().

    Steps:
      1. Remove markdown code fences (```json … ```)
      2. Trim surrounding whitespace
      3. Extract the substring between the first '{' and last '}'
      4. Remove trailing commas before } or ]
      5. Replace single quotes with double quotes
    """

    text = raw.strip()

    # 1. Strip markdown fences
    if text.startswith("```"):
        text = text.split("\n", 1)[-1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # 2. Extract first '{' … last '}'
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace : last_brace + 1]

    # 3. Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)

    # 4. Replace single quotes with double quotes
    text = text.replace("'", '"')

    return text


def split_bullets(text: str) -> list[str]:
    """Split raw text by '.' into a list of trimmed, non-empty strings."""
    if not text:
        return []
    return [line.strip() for line in text.split(".") if line.strip()]


def split_list(text: str) -> list[str]:
    """Split raw text by ',' into a list of trimmed, non-empty strings."""
    if not text:
        return []
    return [item.strip() for item in text.split(",") if item.strip()]


def generate_resume_content(data: dict) -> tuple[dict, str]:
    """
    Generate a professional summary and cover letter via the HuggingFace
    Chat Completions API, then build the full resume structure
    deterministically from user input.

    Parameters
    ----------
    data : dict
        Must contain keys: name, skills, experience, education,
        target_job, job_description.  May also contain: projects,
        internships, certifications, achievements, tools,
        competitive_programming, extracurriculars.

    Returns
    -------
    tuple[dict, str]
        (structured_resume_dict, cover_letter_string)
    """

    # ------------------------------------------------------------------
    # STEP 1 — Ask AI for summary + cover_letter ONLY
    # ------------------------------------------------------------------
    prompt = f"""
You are a professional resume writer.

Return ONLY valid JSON with exactly two keys:

{{
  "summary": "A 2-3 sentence professional summary for the candidate.",
  "cover_letter": "A tailored cover letter for the target job."
}}

Candidate Data:
Name: {data["name"]}
Skills: {", ".join(data["skills"])}
Experience: {data["experience"]}
Education: {data["education"]}
Target Job: {data["target_job"]}
Job Description: {data["job_description"]}

Return ONLY valid JSON. No markdown. No explanation.
"""

    system_message = (
        "You are a professional resume writer. "
        "You must respond with ONLY valid JSON containing exactly "
        '"summary" and "cover_letter" keys. '
        "Do not include markdown formatting, code fences, or any explanation."
    )

    ai_summary = "Professional candidate."
    ai_cover_letter = ""

    try:
        raw_content = _query_huggingface(prompt, system_message)
        cleaned = _clean_json_response(raw_content)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            cleaned = cleaned.replace("\n", " ").replace("\t", " ")
            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                parsed = {}

        if isinstance(parsed.get("summary"), str) and parsed["summary"]:
            ai_summary = parsed["summary"]
        if isinstance(parsed.get("cover_letter"), str) and parsed["cover_letter"]:
            ai_cover_letter = parsed["cover_letter"]

    except RuntimeError:
        # API failure — continue with defaults; structure is still filled
        pass

    # ------------------------------------------------------------------
    # STEP 2 — Build resume structure deterministically from user input
    # ------------------------------------------------------------------
    resume = {
        "name": data["name"],
        "summary": ai_summary,
        "skills": data["skills"],
        "experience": [
            {
                "role": data["target_job"],
                "company": "",
                "duration": "",
                "points": split_bullets(data["experience"]),
            }
        ] if data.get("experience") else [],
        "education": data["education"],
        "projects": [
            {
                "title": p.strip(),
                "tech_stack": "",
                "points": [],
            }
            for p in split_bullets(data.get("projects", ""))
        ],
        "internships": [
            {
                "role": i.strip(),
                "organization": "",
                "duration": "",
                "points": [],
            }
            for i in split_bullets(data.get("internships", ""))
        ],
        "certifications": split_bullets(data.get("certifications", "")),
        "achievements": split_bullets(data.get("achievements", "")),
        "tools": split_list(data.get("tools", "")),
        "competitive_programming": split_bullets(data.get("competitive_programming", "")),
        "extracurriculars": split_bullets(data.get("extracurriculars", "")),
    }

    return resume, ai_cover_letter


def generate_cover_letter(data: dict) -> str:
    """
    Generate a structured professional cover letter using the HuggingFace
    Chat Completions API.

    Parameters
    ----------
    data : dict
        Must contain keys: name, target_job, company, hiring_manager,
        job_description, summary, experience, skills.

    Returns
    -------
    str
        The generated cover letter text.
    """

    prompt = f"""
Write a professional cover letter for the following candidate.

Candidate Name: {data["name"]}
Target Job: {data["target_job"]}
Company: {data["company"]}
Hiring Manager: {data["hiring_manager"]}
Job Description: {data["job_description"]}
Professional Summary: {data["summary"]}
Experience: {data["experience"]}
Skills: {", ".join(data["skills"])}

Write a complete, professional cover letter addressed to {data["hiring_manager"]}
at {data["company"]} for the {data["target_job"]} position.
Include an opening paragraph, body paragraphs highlighting relevant experience
and skills, and a closing paragraph.
Return ONLY the cover letter text. No JSON. No markdown.
"""

    system_message = (
        "You are a professional cover letter writer. "
        "Write polished, tailored cover letters. "
        "Return ONLY the cover letter text with no extra formatting."
    )

    try:
        cover_letter = _query_huggingface(prompt, system_message)
    except RuntimeError:
        # Fallback when the API is unreachable
        cover_letter = (
            f"Dear {data['hiring_manager']},\n\n"
            f"I am writing to express my interest in the {data['target_job']} "
            f"position at {data['company']}.\n\n"
            f"{data['summary']}\n\n"
            f"My experience includes: {data['experience']}.\n\n"
            f"Key skills: {', '.join(data['skills'])}.\n\n"
            f"I look forward to discussing how I can contribute to your team.\n\n"
            f"Sincerely,\n{data['name']}"
        )

    return cover_letter


