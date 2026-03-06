# AI Resume & Cover Letter Generator

An AI-powered web application that generates ATS-optimized resumes and tailored cover letters using Meta's Llama 3 model via the HuggingFace Inference API. Built with a FastAPI backend and a responsive HTML/CSS/JavaScript frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [How It Works](#how-it-works)
4. [Tech Stack](#tech-stack)
5. [Security & Environment Variables](#security--environment-variables)
6. [Local Setup Instructions](#local-setup-instructions)
7. [Deployment Guide](#deployment-guide)
8. [Additional Security Notes](#additional-security-notes)
9. [Future Improvements](#future-improvements)
10. [Screenshots](#screenshots)
11. [License](#license)

---

## Project Overview

This project provides an end-to-end solution for job seekers to create professional, ATS-friendly resumes and cover letters. Users enter their personal details, work experience, skills, and target job information through an intuitive web interface. The backend sends structured prompts to Meta-Llama-3-8B-Instruct via HuggingFace's Inference API, processes the AI-generated content, calculates an ATS compatibility score, and returns polished documents available for live preview and PDF download.

### Key Features

| Feature | Description |
|---|---|
| **ATS-Optimized Resume Generation** | Produces resumes structured to pass Applicant Tracking Systems |
| **AI-Generated Professional Summary** | Creates a concise, impactful summary tailored to the target role |
| **AI-Generated Tailored Cover Letter** | Generates a cover letter aligned with the job description and user profile |
| **ATS Score Calculation** | Analyzes keyword match and formatting for ATS compatibility |
| **Classic & Modern Templates** | Two professionally designed resume layouts to choose from |
| **PDF Download** | One-click export of resumes and cover letters to PDF |
| **Live Preview** | Real-time HTML preview before downloading |
| **Environment Variable Security** | API keys stored securely via `.env`, never hardcoded |

---

## Architecture Diagram

```
                ┌──────────────────────┐
                │        User          │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Frontend            │
                │  (HTML / CSS / JS)   │
                └──────────┬───────────┘
                           │  HTTP POST
                           ▼
                ┌──────────────────────┐
                │  FastAPI Backend     │
                │  (main.py)           │
                └──────────┬───────────┘
                           │  HTTPS
                           ▼
                ┌──────────────────────┐
                │  HuggingFace LLM     │
                │  Meta-Llama-3-8B     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  ATS Scoring Logic   │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Jinja2 Templates    │
                │  (Classic / Modern)  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  PDF Output          │
                │  (xhtml2pdf)         │
                └──────────────────────┘
```

---

## How It Works

1. **User Input** — The user fills out the web form with personal details, work experience, education, skills, and the target job title/description.
2. **API Request** — The frontend sends a POST request to the FastAPI backend with the form data.
3. **Prompt Construction** — The backend builds a structured prompt and sends it to the HuggingFace Inference API (Meta-Llama-3-8B-Instruct).
4. **AI Generation** — The model returns AI-generated resume content or a tailored cover letter.
5. **Post-Processing** — The backend calculates an ATS score, injects the content into a Jinja2 HTML template (Classic or Modern), and returns the result.
6. **Preview & Download** — The frontend renders a live HTML preview. The user can download a PDF version via the `/generate-pdf` or `/generate-cover-letter-pdf` endpoints, which convert HTML to PDF using xhtml2pdf.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML, CSS, JavaScript | User interface and form handling |
| **Backend** | FastAPI (Python) | REST API and business logic |
| **AI Model** | Meta-Llama-3-8B-Instruct | Resume and cover letter text generation |
| **AI Gateway** | HuggingFace Inference API | Hosted model inference |
| **Templating** | Jinja2 | HTML resume/cover letter templates |
| **PDF Engine** | xhtml2pdf | HTML-to-PDF conversion |
| **Config** | python-dotenv | Environment variable management |

---

## Security & Environment Variables

### Setting Up Your Environment

All sensitive credentials are managed through environment variables using `python-dotenv`. **No API keys should ever be hardcoded in source code.**

#### Step 1 — Create a `.env` file inside the backend directory

```bash
cd ai_resume_backend
touch .env        # macOS / Linux
# or manually create the file on Windows
```

#### Step 2 — Add your HuggingFace API key

Open the `.env` file and add the following line:

```env
HF_API_KEY=your_huggingface_api_key_here
```

Replace `your_huggingface_api_key_here` with your actual token. A `.env.example` template is included in the repository for reference.

#### Step 3 — Never commit `.env` to version control

The `.gitignore` at the project root already excludes `.env`. Before pushing to any remote repository, verify the file is ignored:

```bash
git status
# .env should NOT appear in the list of tracked files
```

#### Step 4 — Use environment variables in production

When deploying to a hosted platform such as **Render**, do **not** upload a `.env` file. Instead, add the variable through the platform's dashboard:

1. Open your Render service → **Environment** tab.
2. Add a new entry:
   - **Key:** `HF_API_KEY`
   - **Value:** your actual HuggingFace API token
3. Save and redeploy.

This ensures secrets are injected at runtime without ever existing in the repository.

### Obtaining a HuggingFace API Key

1. Create an account at [huggingface.co](https://huggingface.co).
2. Navigate to **Settings → Access Tokens**.
3. Generate a new token with **read** permissions.
4. Paste the token into your `.env` file (local) or hosting dashboard (production).

> **⚠️ WARNING — Protect Your API Keys**
>
> Exposing API keys in public repositories, client-side code, or error logs can lead to unauthorized usage, unexpected billing, and account suspension. Always store keys server-side, rotate them periodically, and revoke any key you suspect has been compromised.

---

## Local Setup Instructions

### Prerequisites

- Python 3.10+
- pip
- A modern web browser

### Backend Setup

```bash
# Navigate to the backend directory
cd ai_resume_backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
# Edit .env and add your HuggingFace API key

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

The API will be available at `http://localhost:10000`. Interactive docs are at `http://localhost:10000/docs`.

### Frontend Setup

```bash
# Navigate to the frontend directory
cd "AI FRONTEND"

# Open index.html in your browser, or use a local server:
python -m http.server 5500
```

The frontend will be available at `http://localhost:5500`.

> **Note:** Update the API base URL in `script.js` to point to your local backend (`http://localhost:10000`) during development.

---

## Deployment Guide

### Backend — Render

[Render](https://render.com) provides free-tier hosting for Python web services with automatic deploys from GitHub.

**Step 1 — Push your backend to GitHub**

Ensure the backend directory (containing `main.py`, `requirements.txt`, and `.env.example`) is committed to a GitHub repository. Do **not** commit the `.env` file.

**Step 2 — Create a Render Web Service**

1. Sign in to [render.com](https://render.com) and click **New → Web Service**.
2. Connect your GitHub account and select the repository.
3. Set the **Root Directory** to the backend folder (e.g., `ai_resume_backend`).

**Step 3 — Configure Build & Start Commands**

| Setting | Value |
|---|---|
| **Runtime** | Python |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port 10000` |

**Step 4 — Add Environment Variables**

In the Render dashboard, navigate to your service's **Environment** tab and add:

| Key | Value |
|---|---|
| `HF_API_KEY` | your actual HuggingFace API key |

> Do **not** paste your key into any file that is committed to version control.

**Step 5 — Deploy**

Click **Deploy**. Render will install dependencies, start the server, and provide a public URL:

```
https://your-app.onrender.com
```

You can verify the deployment by visiting `https://your-app.onrender.com/docs` to see the interactive API documentation.

---

### Frontend — Vercel

[Vercel](https://vercel.com) offers zero-configuration hosting for static sites with instant deploys from GitHub.

**Step 1 — Push your frontend to GitHub**

Ensure the frontend directory (containing `index.html`, `style.css`, and `script.js`) is committed to a GitHub repository.

**Step 2 — Import the project on Vercel**

1. Sign in to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Connect your GitHub account and select the repository.
3. Set the **Root Directory** to the frontend folder (e.g., `AI FRONTEND`).

**Step 3 — Deploy**

No build command or framework preset is needed — Vercel detects a static site automatically. Click **Deploy**.

Vercel will provide a live URL:

```
https://your-app.vercel.app
```

**Step 4 — Update the API base URL**

Before deploying (or via a redeployment), update the `API_BASE_URL` constant in `script.js` to point to your Render backend:

```javascript
const API_BASE_URL = "https://your-app.onrender.com";
```

This ensures the frontend communicates with the production backend instead of `localhost`.

---

## Additional Security Notes

- Error responses from the backend are **sanitized** to prevent leaking API response bodies or internal details.
- A `.env.example` file is provided so collaborators know which variables are required without exposing real values.
- CORS should be configured appropriately for production to restrict allowed origins.

---

## Future Improvements

The following enhancements are planned to evolve the project from a standalone tool into a full-featured career platform.

| Priority | Feature | Description |
|---|---|---|
| **High** | User Authentication | Secure sign-up/login with OAuth or JWT so users can manage their own accounts |
| **High** | Resume History Database | Persistent storage (PostgreSQL / MongoDB) allowing users to save, edit, and revisit past resumes and cover letters |
| **High** | Improved ATS Algorithm | Weighted keyword matching, section-order analysis, and formatting checks for more accurate ATS scoring |
| **Medium** | Multi-Language Support | Generate resumes and cover letters in multiple languages to serve a global audience |
| **Medium** | Cloud Storage for PDFs | Store generated PDFs in AWS S3 or Azure Blob so users can download them from any device at any time |
| **Medium** | Tailwind-Based UI Redesign | Migrate the frontend to a Tailwind CSS utility-first design system for a modern, responsive, and maintainable interface |
| **Low** | Admin Dashboard | Internal panel for monitoring usage metrics, managing users, reviewing API consumption, and moderating generated content |

### Additional Ideas

- [ ] Multiple AI model options (GPT-4, Claude, Gemini) for varied writing styles
- [ ] Drag-and-drop resume section reordering
- [ ] Job description parser for automatic keyword extraction
- [ ] LinkedIn profile import
- [ ] Real-time collaborative editing
- [ ] Email delivery of generated documents

---

## Screenshots

> *Screenshots of the application will be added here.*

| View | Screenshot |
|---|---|
| Resume Form | *coming soon* |
| Live Preview | *coming soon* |
| Generated PDF | *coming soon* |
| Cover Letter | *coming soon* |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **ARPIT BHARDWAJ**

You are free to use, modify, and distribute this software for personal, academic, or commercial purposes, provided the original copyright notice and permission notice are included in all copies or substantial portions of the Software.

---

Built with purpose — helping job seekers present their best selves through AI-assisted, ATS-optimized professional documents.
