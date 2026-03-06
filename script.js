/* ============================================================
   AI Resume Studio — Application Logic
   ============================================================ */

(function () {
  "use strict";

  // ─── API Configuration ───
  const API_BASE_URL = "http://127.0.0.1:8000";

  // ─── DOM References ───
  const form = document.getElementById("resumeForm");
  const generateBtn = document.getElementById("generateBtn");
  const btnText = generateBtn.querySelector(".btn-text");
  const spinner = document.getElementById("spinner");
  const downloadButtons = document.getElementById("downloadButtons");
  const downloadResumeBtn = document.getElementById("downloadResumeBtn");
  const downloadCoverBtn = document.getElementById("downloadCoverBtn");
  const emptyState = document.getElementById("emptyState");
  const resumeContent = document.getElementById("resumeContent");
  const toast = document.getElementById("toast");

  // Cover Letter DOM
  const clForm = document.getElementById("coverLetterForm");
  const generateCLBtn = document.getElementById("generateCLBtn");
  const clBtnText = generateCLBtn.querySelector(".btn-text");
  const clSpinner = document.getElementById("clSpinner");

  // Store latest merged data (API response + form inputs)
  let lastResumeData = null;
  let lastCoverLetterText = null;
  let lastSelectedTemplate = "classic";

  // Template selector logic
  const templateOptions = document.querySelectorAll(".template-option");
  templateOptions.forEach((option) => {
    option.addEventListener("click", () => {
      templateOptions.forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");
    });
  });

  // ─── Tab Switching ───
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ATS collapsible toggle
  const atsToggle = document.getElementById("atsToggle");
  const atsBody = document.getElementById("atsBody");
  const atsChevron = document.getElementById("atsChevron");
  if (atsToggle) {
    atsToggle.addEventListener("click", () => {
      atsBody.classList.toggle("hidden");
      atsChevron.classList.toggle("open");
    });
  }

  // ─── Helpers ───
  function showToast(message, type = "error") {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function setLoading(loading) {
    generateBtn.disabled = loading;
    btnText.textContent = loading ? "Generating…" : "Generate Resume";
    spinner.classList.toggle("hidden", !loading);
  }

  /** Normalise any value to a flat string array, filtering empties. */
  function toArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    return String(val).split(",").map((s) => s.trim()).filter(Boolean);
  }

  // ─── Build Request Payload ───
  function buildPayload() {
    return {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      linkedin: form.linkedin.value.trim(),
      github: form.github.value.trim(),
      skills: form.skills.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      experience: form.experience.value.trim(),
      education: form.education.value.trim(),
      target_job: form.target_job.value.trim(),
      job_description: form.job_description.value.trim(),
      template: document.querySelector('input[name="template"]:checked').value,
      projects: form.projects.value,
      internships: form.internships.value,
      certifications: form.certifications.value,
      achievements: form.achievements.value,
      tools: form.tools.value,
      competitive_programming: form.competitive_programming.value,
      extracurriculars: form.extracurriculars.value,
    };
  }

  // ─── Normalize Resume Data ───
  function normalizeResumeData(data) {
    return {
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      linkedin: data.linkedin || "",
      github: data.github || "",
      target_job: data.target_job || "",
      summary: data.summary || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: data.education || "",
      projects: Array.isArray(data.projects) ? data.projects : [],
      internships: Array.isArray(data.internships) ? data.internships : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
      tools: Array.isArray(data.tools) ? data.tools : [],
      competitive_programming: Array.isArray(data.competitive_programming) ? data.competitive_programming : [],
      extracurriculars: Array.isArray(data.extracurriculars) ? data.extracurriculars : [],
      cover_letter: data.cover_letter || data.coverLetter || "",
      ats_score: data.ats_score ?? data.atsScore ?? 0,
      missing_keywords: data.missing_keywords || data.missingKeywords || [],
    };
  }

  // ══════════════════════════════════════════════════════════
  //  RENDER PREVIEW  — inject data into static DOM template
  // ══════════════════════════════════════════════════════════
  function renderPreview(data) {
    const d = normalizeResumeData(data);

    // Show resume template, hide cover letter card if present
    const resumeTemplate = document.getElementById("resumeTemplate");
    resumeTemplate.classList.remove("hidden");
    const clCard = document.getElementById("coverLetterCard");
    if (clCard) clCard.classList.add("hidden");

    // ── Header ──
    document.getElementById("r_name").textContent = d.name || "\u2014";
    document.getElementById("r_title").textContent = d.target_job || "Professional";

    // ── Contact Info ──
    const contactEl = document.getElementById("r_contact");
    contactEl.innerHTML = "";
    const contactParts = [
      d.email,
      d.phone,
      d.linkedin ? `<a href="${d.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : "",
      d.github ? `<a href="${d.github}" target="_blank" rel="noopener">GitHub</a>` : "",
    ].filter(Boolean);
    contactEl.innerHTML = contactParts.join(" | ");
    contactEl.style.display = contactParts.length ? "" : "none";

    // ── Simple text sections (show/hide if empty) ──
    document.getElementById("r_summary").textContent = d.summary || "";
    document.getElementById("sec_summary").style.display = d.summary ? "" : "none";

    document.getElementById("r_education").textContent =
      Array.isArray(d.education) ? d.education.join(", ") : (d.education || "");
    document.getElementById("sec_education").style.display = d.education ? "" : "none";

    document.getElementById("r_skills").textContent =
      (d.skills || []).join(" \u2022 ");
    document.getElementById("sec_skills").style.display = d.skills.length ? "" : "none";

    document.getElementById("r_tools").textContent =
      (d.tools || []).join(" \u2022 ");
    document.getElementById("sec_tools").style.display = d.tools.length ? "" : "none";

    // ── Experience ──
    const expDiv = document.getElementById("r_experience");
    expDiv.innerHTML = "";
    (d.experience || []).forEach(exp => {
      if (typeof exp === "object" && exp !== null) {
        const role = exp.role || exp.title || exp.position || "";
        const company = exp.company || exp.organization || "";
        const duration = exp.duration || exp.date || "";
        const points = exp.bullets || exp.points || exp.responsibilities || [];

        const row = document.createElement("div");
        row.className = "job-row";
        row.innerHTML = `<span>${role}${company ? " \u2014 " + company : ""}</span><span style="font-weight:normal;font-style:italic;">${duration}</span>`;
        expDiv.appendChild(row);

        if (Array.isArray(points) && points.length) {
          const ul = document.createElement("ul");
          points.forEach(pt => { const li = document.createElement("li"); li.textContent = pt; ul.appendChild(li); });
          expDiv.appendChild(ul);
        } else if (exp.description) {
          const p = document.createElement("p"); p.textContent = exp.description; expDiv.appendChild(p);
        }
      } else {
        const p = document.createElement("p"); p.textContent = String(exp); expDiv.appendChild(p);
      }
    });
    document.getElementById("sec_experience").style.display = d.experience.length ? "" : "none";

    // ── Projects ──
    const projDiv = document.getElementById("r_projects");
    projDiv.innerHTML = "";
    (d.projects || []).forEach(proj => {
      if (typeof proj === "object" && proj !== null) {
        const title = proj.name || proj.title || "";
        const tech = proj.tech_stack || proj.technologies || "";
        const points = proj.bullets || proj.points || proj.details || [];

        const row = document.createElement("div");
        row.className = "job-row";
        row.innerHTML = `<span>${title}</span><span style="font-weight:normal;font-style:italic;">${tech}</span>`;
        projDiv.appendChild(row);

        if (Array.isArray(points) && points.length) {
          const ul = document.createElement("ul");
          points.forEach(pt => { const li = document.createElement("li"); li.textContent = pt; ul.appendChild(li); });
          projDiv.appendChild(ul);
        } else if (proj.description) {
          const p = document.createElement("p"); p.textContent = proj.description; projDiv.appendChild(p);
        }
      } else {
        const p = document.createElement("p"); p.textContent = String(proj); projDiv.appendChild(p);
      }
    });
    document.getElementById("sec_projects").style.display = d.projects.length ? "" : "none";

    // ── Internships ──
    const intDiv = document.getElementById("r_internships");
    intDiv.innerHTML = "";
    (d.internships || []).forEach(i => {
      if (typeof i === "object" && i !== null) {
        const role = i.role || i.title || i.position || "";
        const company = i.company || i.organization || "";
        const duration = i.duration || i.date || "";
        const points = i.bullets || i.points || i.responsibilities || [];

        const row = document.createElement("div");
        row.className = "job-row";
        row.innerHTML = `<span>${role}${company ? " \u2014 " + company : ""}</span><span style="font-weight:normal;font-style:italic;">${duration}</span>`;
        intDiv.appendChild(row);

        if (Array.isArray(points) && points.length) {
          const ul = document.createElement("ul");
          points.forEach(pt => { const li = document.createElement("li"); li.textContent = pt; ul.appendChild(li); });
          intDiv.appendChild(ul);
        } else if (i.description) {
          const p = document.createElement("p"); p.textContent = i.description; intDiv.appendChild(p);
        }
      } else {
        const p = document.createElement("p"); p.textContent = String(i); intDiv.appendChild(p);
      }
    });
    document.getElementById("sec_internships").style.display = d.internships.length ? "" : "none";

    // ── Certifications ──
    const certDiv = document.getElementById("r_certifications");
    certDiv.innerHTML = "";
    if (d.certifications.length) {
      const ul = document.createElement("ul");
      d.certifications.forEach(c => {
        const li = document.createElement("li");
        li.textContent = typeof c === "object" ? (c.name || c.title || JSON.stringify(c)) : c;
        ul.appendChild(li);
      });
      certDiv.appendChild(ul);
    }
    document.getElementById("sec_certifications").style.display = d.certifications.length ? "" : "none";

    // ── Achievements + Competitive Programming ──
    const achDiv = document.getElementById("r_achievements");
    achDiv.innerHTML = "";
    const allAch = [...d.achievements, ...d.competitive_programming];
    if (allAch.length) {
      const ul = document.createElement("ul");
      allAch.forEach(a => {
        const li = document.createElement("li");
        li.textContent = typeof a === "object" ? (a.name || a.title || JSON.stringify(a)) : a;
        ul.appendChild(li);
      });
      achDiv.appendChild(ul);
    }
    document.getElementById("sec_achievements").style.display = allAch.length ? "" : "none";

    // ── Extracurriculars ──
    const extraDiv = document.getElementById("r_extracurriculars");
    extraDiv.innerHTML = "";
    if (d.extracurriculars.length) {
      const ul = document.createElement("ul");
      d.extracurriculars.forEach(e => {
        const li = document.createElement("li");
        li.textContent = typeof e === "object" ? (e.name || e.title || JSON.stringify(e)) : e;
        ul.appendChild(li);
      });
      extraDiv.appendChild(ul);
    }
    document.getElementById("sec_extracurriculars").style.display = d.extracurriculars.length ? "" : "none";

    // ── Cover Letter ──
    const coverSec = document.getElementById("sec_cover");
    const coverDiv = document.getElementById("r_cover");
    coverDiv.innerHTML = "";
    if (d.cover_letter && d.cover_letter.trim()) {
      coverSec.style.display = "";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const dateP = document.createElement("p"); dateP.textContent = dateStr; dateP.style.fontSize = "11px"; dateP.style.color = "#666"; dateP.style.marginBottom = "10px"; coverDiv.appendChild(dateP);
      const greeting = document.createElement("p"); greeting.textContent = "Dear Hiring Manager,"; greeting.style.marginBottom = "8px"; coverDiv.appendChild(greeting);
      d.cover_letter.split(/\n\n|\n/).filter(Boolean).forEach(para => {
        const p = document.createElement("p"); p.textContent = para.trim(); p.style.textAlign = "justify"; p.style.marginBottom = "8px"; coverDiv.appendChild(p);
      });
      const closing = document.createElement("p"); closing.textContent = "Sincerely,"; closing.style.marginTop = "12px"; coverDiv.appendChild(closing);
      const sig = document.createElement("p"); sig.textContent = d.name; sig.style.fontWeight = "bold"; coverDiv.appendChild(sig);
    } else {
      coverSec.style.display = "none";
    }

    // ── ATS Collapsible ──
    const score = parseInt(d.ats_score, 10);
    const atsBarFill = document.getElementById("atsBarFill");
    const atsScoreLabel = document.getElementById("atsScoreLabel");
    atsBarFill.style.width = "0%";
    atsScoreLabel.textContent = "0%";

    const keywords = toArray(d.missing_keywords);
    const hasAts = score > 0 || keywords.length > 0;
    document.getElementById("atsCollapsible").style.display = hasAts ? "" : "none";

    if (score > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          atsBarFill.style.width = `${score}%`;
          animateCounter(atsScoreLabel, 0, score, 1000);
        }, 100);
      });
    }

    const kwContainer = document.getElementById("resMissingKeywords");
    kwContainer.innerHTML = "";
    keywords.forEach((kw) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = kw;
      kwContainer.appendChild(tag);
    });
    document.getElementById("keywordsWrapper").style.display = keywords.length ? "" : "none";

    // Reveal preview & buttons
    emptyState.classList.add("hidden");
    resumeContent.classList.remove("hidden");
    downloadButtons.classList.remove("hidden");
    downloadResumeBtn.classList.remove("hidden");

    // Show/hide cover letter button based on whether there is a cover letter
    downloadCoverBtn.classList.toggle("hidden", !d.cover_letter || !d.cover_letter.trim());
  }

  // ─── Animate Number Counter ───
  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(from + (to - from) * easeOutCubic(progress));
      el.textContent = `${value}%`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ══════════════════════════════════════════════════════════
  //  FORM SUBMIT
  // ══════════════════════════════════════════════════════════
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = buildPayload();

    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || `Server error ${response.status}`);
      }

      const data = await response.json();

      // Store the resume object and selected template from backend response
      // Merge contact fields from form into resume data so they persist for PDF download
      const formPayload = buildPayload();
      lastResumeData = {
        ...data.resume,
        email: formPayload.email,
        phone: formPayload.phone,
        linkedin: formPayload.linkedin,
        github: formPayload.github,
      };
      lastSelectedTemplate = document.querySelector('input[name="template"]:checked').value || "classic";

      // Render preview
      renderPreview(data.resume);

      // ── ATS Score Card ──
      const atsScore = parseInt(data.ats_score ?? data.resume?.ats_score ?? 0, 10);
      const atsCard = document.getElementById("atsCard");
      const atsScoreValue = document.getElementById("atsScoreValue");
      const atsProgressBar = document.getElementById("atsProgressBar");

      if (atsScore > 0) {
        atsCard.style.display = "";

        // Remove previous color classes
        const colorClasses = ["ats-high", "ats-medium", "ats-low"];
        colorClasses.forEach((c) => {
          atsScoreValue.classList.remove(c);
          atsProgressBar.classList.remove(c);
        });

        // Determine color class
        const colorClass = atsScore >= 75 ? "ats-high" : atsScore >= 50 ? "ats-medium" : "ats-low";
        atsScoreValue.classList.add(colorClass);
        atsProgressBar.classList.add(colorClass);

        // Animate bar width
        atsProgressBar.style.width = "0%";
        requestAnimationFrame(() => {
          setTimeout(() => {
            atsProgressBar.style.width = atsScore + "%";
          }, 50);
        });

        // Animate counter
        atsScoreValue.textContent = "0%";
        animateCounter(atsScoreValue, 0, atsScore, 800);
      } else {
        atsCard.style.display = "none";
      }

      showToast("Resume generated successfully!", "success");
    } catch (err) {
      console.error("Generation failed:", err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the API server. Make sure it is running on port 8000."
          : `Error: ${err.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  });

  // ══════════════════════════════════════════════════════════
  //  DOWNLOAD — PDF from backend /generate-pdf
  // ══════════════════════════════════════════════════════════
  async function downloadResume() {
    if (!lastResumeData) {
      alert("Generate resume first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: lastResumeData, template: lastSelectedTemplate }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast("Resume.pdf downloaded!", "success");
    } catch (err) {
      console.error("PDF download failed:", err);
      showToast("Failed to download PDF. Is the server running?", "error");
    }
  }

  downloadResumeBtn.addEventListener("click", downloadResume);

  downloadCoverBtn.addEventListener("click", async () => {
    if (!lastCoverLetterText) {
      alert("Generate a cover letter first.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/generate-cover-letter-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_letter: lastCoverLetterText }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CoverLetter.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("CoverLetter.pdf downloaded!", "success");
    } catch (err) {
      console.error("Cover letter PDF download failed:", err);
      showToast("Failed to download Cover Letter PDF. Is the server running?", "error");
    }
  });

  // ══════════════════════════════════════════════════════════
  //  COVER LETTER FORM SUBMIT
  // ══════════════════════════════════════════════════════════
  function setCLLoading(loading) {
    generateCLBtn.disabled = loading;
    clBtnText.textContent = loading ? "Generating…" : "Generate Cover Letter";
    clSpinner.classList.toggle("hidden", !loading);
  }

  clForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setCLLoading(true);

    const payload = {
      name: clForm.cl_name.value.trim(),
      target_job: clForm.cl_target_job.value.trim(),
      company: clForm.cl_company.value.trim(),
      hiring_manager: clForm.cl_hiring_manager.value.trim(),
      job_description: clForm.cl_job_description.value.trim(),
      summary: clForm.cl_summary.value.trim(),
      experience: clForm.cl_experience.value.trim(),
      skills: clForm.cl_skills.value.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || `Server error ${response.status}`);
      }

      const data = await response.json();
      const coverText = data.cover_letter || data.coverLetter || "";
      lastCoverLetterText = coverText;

      // Render cover letter in preview panel
      renderCoverLetterPreview(coverText, payload.name);
      showToast("Cover letter generated!", "success");
    } catch (err) {
      console.error("Cover letter generation failed:", err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the API server. Make sure it is running on port 8000."
          : `Error: ${err.message}`,
        "error"
      );
    } finally {
      setCLLoading(false);
    }
  });

  // ── Render Cover Letter in Preview ──
  function renderCoverLetterPreview(text, name) {
    // Hide resume template, show cover letter card
    const resumeTemplate = document.getElementById("resumeTemplate");
    const atsCollapsible = document.getElementById("atsCollapsible");
    resumeTemplate.classList.add("hidden");
    atsCollapsible.style.display = "none";

    // Create or reuse cover letter card
    let clCard = document.getElementById("coverLetterCard");
    if (!clCard) {
      clCard = document.createElement("div");
      clCard.id = "coverLetterCard";
      clCard.className = "cover-letter-card";
      resumeContent.insertBefore(clCard, atsCollapsible);
    }
    clCard.classList.remove("hidden");
    clCard.innerHTML = "";

    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dateP = document.createElement("p");
    dateP.textContent = dateStr;
    dateP.style.cssText = "font-size:11px;color:#666;margin-bottom:14px;";
    clCard.appendChild(dateP);

    text.split(/\n\n|\n/).filter(Boolean).forEach((para) => {
      const p = document.createElement("p");
      p.textContent = para.trim();
      p.style.cssText = "text-align:justify;margin-bottom:10px;";
      clCard.appendChild(p);
    });

    const sig = document.createElement("p");
    sig.textContent = name || "";
    sig.style.cssText = "font-weight:bold;margin-top:16px;";
    clCard.appendChild(sig);

    emptyState.classList.add("hidden");
    resumeContent.classList.remove("hidden");
    downloadButtons.classList.remove("hidden");
    downloadResumeBtn.classList.add("hidden");
    downloadCoverBtn.classList.remove("hidden");
  }
})();
