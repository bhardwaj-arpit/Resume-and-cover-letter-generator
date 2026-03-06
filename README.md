# 🧠 AI Resume & Cover Letter Generator

A production-ready **FastAPI** backend that generates **ATS-optimised resumes** and **tailored cover letters** using the **HuggingFace Inference API** (Meta-Llama-3-8B-Instruct), with professional **PDF export**.

---

## 📌 Project Overview

The backend accepts candidate details, leverages **Generative AI** to produce a professional summary and cover letter, builds the resume structure deterministically from user input, scores it against a job description using an **ATS keyword-match analyser**, and exports polished **PDF documents** via Jinja2 + xhtml2pdf.

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Resume Generation** | Structured JSON resume with summary, skills, experience, projects, certifications, and more |
| **AI Cover Letter** | Tailored cover letter generated via Meta-Llama-3-8B-Instruct |
| **ATS Scoring** | Keyword-match analyser compares resume content against the job description |
| **PDF Export** | Professional HTML → PDF rendering (Classic & Modern templates) |
| **Template Selection** | Choose between *Classic* (serif) and *Modern* (accent-colored) resume layouts |
| **Cover Letter PDF** | Separate cover letter PDF generation with sender/employer headers |
| **Structured JSON API** | Resume returned as structured dict — ready for any frontend |

---

## 🏗️ Architecture

```
Client (Postman / Browser / Frontend)
       │
       ▼  HTTP POST
  FastAPI Backend (localhost:8000)
       │
       ├── HuggingFace Inference API  →  AI Summary + Cover Letter
       ├── Deterministic Builder       →  Structured Resume JSON
       ├── ATS Analyser               →  Keyword Match Score
       └── xhtml2pdf + Jinja2         →  PDF Export
       │
       ▼
  JSON Response / PDF Download
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | [FastAPI](https://fastapi.tiangolo.com/) |
| AI Model | [Meta-Llama-3-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) via HuggingFace Chat Completions API |
| PDF Generation | [xhtml2pdf](https://xhtml2pdf.readthedocs.io/) + [Jinja2](https://jinja.palletsprojects.com/) |
| Validation | [Pydantic](https://docs.pydantic.dev/) |
| HTTP Client | [Requests](https://docs.python-requests.org/) |
| Env Management | [python-dotenv](https://pypi.org/project/python-dotenv/) |

---

## 📂 Project Structure

```
Resume-and-cover-letter-generator/
│
├── ai_resume_backend/
│   ├── main.py                          # FastAPI app & endpoint definitions
│   ├── models.py                        # Pydantic request/response schemas
│   ├── huggingface_service.py           # HuggingFace Inference API integration
│   ├── ats_analyzer.py                  # ATS keyword-match scoring logic
│   ├── requirements.txt                 # Python dependencies
│   └── templates/
│       ├── resume_classic.html          # Classic resume PDF template
│       ├── resume_modern.html           # Modern resume PDF template
│       └── cover_letter_template.html   # Cover letter PDF template
│
├── .env.example                         # Template for environment variables
├── .gitignore                           # Git ignore rules
├── LICENSE                              # MIT License
└── README.md                            # This file
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Generate structured resume + cover letter + ATS score |
| `POST` | `/generate-pdf` | Render resume to PDF (classic / modern template) |
| `POST` | `/generate-cover-letter` | Generate a standalone cover letter |
| `POST` | `/generate-cover-letter-pdf` | Render cover letter to PDF |

Interactive API docs: **http://localhost:8000/docs**

---

## ⚡ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/bhardwaj-arpit/Resume-and-cover-letter-generator.git
cd Resume-and-cover-letter-generator/ai_resume_backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file inside the `ai_resume_backend/` folder:

```
HF_API_KEY=your_huggingface_api_key_here
```

> 🔑 Get a free API key at: https://huggingface.co/settings/tokens

### 5. Run the backend server

```bash
uvicorn main:app --reload
```

The server starts at **http://localhost:8000**

Open **http://localhost:8000/docs** to explore the interactive Swagger API documentation.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HF_API_KEY` | ✅ | HuggingFace API token (free tier works) |

> ⚠️ **Never commit your `.env` file.** The `.gitignore` already excludes it.  
> A safe `.env.example` is included in the repository for reference.

---

## 🧪 Example Request

### POST `/generate`

```json
{
  "name": "Arpit Bhardwaj",
  "skills": ["Python", "FastAPI", "Machine Learning", "React"],
  "experience": "Built REST APIs for production systems. Led a team of 3 developers.",
  "education": "B.Tech in Computer Science, XYZ University, 2024",
  "target_job": "Software Engineer",
  "job_description": "Looking for a Python developer with REST API and ML experience.",
  "projects": "AI Resume Generator using FastAPI and HuggingFace. E-commerce website with React.",
  "certifications": "AWS Cloud Practitioner. Google Data Analytics.",
  "achievements": "Winner of college hackathon 2023.",
  "internships": "Software Intern at ABC Corp for 3 months.",
  "tools": "Git, Docker, VS Code, Postman",
  "competitive_programming": "Solved 300+ problems on LeetCode.",
  "extracurriculars": "Technical club coordinator. Organized coding workshops."
}
```

---

## 🚀 Future Improvements

- [ ] Frontend UI (React / Next.js)
- [ ] Multi-language resume support
- [ ] LinkedIn profile import
- [ ] Multiple AI model support
- [ ] Resume version history
- [ ] Cloud deployment (Render / Railway)

---

## 📄 License

MIT

---

> Built with ❤️ using FastAPI + HuggingFace AI
