"""
Simple ATS (Applicant Tracking System) keyword-match analyser.
"""

import re

# A small, manually curated set of common English stopwords.
STOPWORDS: set[str] = {
    "a", "an", "the", "and", "or", "but", "if", "in", "on", "at",
    "to", "for", "of", "with", "by", "from", "as", "is", "was",
    "are", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "shall", "can", "need", "must", "it", "its", "this",
    "that", "these", "those", "i", "we", "you", "he", "she", "they",
    "me", "us", "him", "her", "them", "my", "our", "your", "his",
    "their", "what", "which", "who", "whom", "where", "when", "how",
    "not", "no", "nor", "so", "too", "very", "just", "about", "above",
    "after", "before", "between", "into", "through", "during", "out",
    "up", "down", "over", "under", "again", "then", "once", "here",
    "there", "all", "each", "every", "both", "few", "more", "most",
    "other", "some", "such", "only", "own", "same", "than", "also",
}


def _extract_keywords(text: str) -> set[str]:
    """Tokenise text, remove stopwords, and return a set of meaningful keywords."""
    tokens = re.findall(r"[a-z0-9+#]+", text.lower())
    return {token for token in tokens if token not in STOPWORDS and len(token) > 1}


def calculate_ats_score(resume_text: str, job_description: str) -> tuple[int, list]:
    """
    Calculate a simple ATS compatibility score.

    Parameters
    ----------
    resume_text : str
        The generated resume text.
    job_description : str
        The target job description.

    Returns
    -------
    tuple[int, list]
        (ats_score, missing_keywords)
        - ats_score: integer percentage (0-100) of matched keywords.
        - missing_keywords: list of job-description keywords not found in the resume.
    """

    job_keywords = _extract_keywords(job_description)
    resume_keywords = _extract_keywords(resume_text)

    if not job_keywords:
        return 100, []

    matched = job_keywords & resume_keywords
    missing = job_keywords - resume_keywords

    ats_score = int((len(matched) / len(job_keywords)) * 100)

    return ats_score, sorted(missing)

