import io
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import fitz  # PyMuPDF
from docx import Document
from app.services.skill_catalog import ALIAS_MAP, SKILL_TAXONOMY

def extract_text_from_bytes(content: bytes, filename: str = "resume.pdf") -> str:
    """Extract plain text directly from in-memory bytes without writing to disk."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        text_parts = []
        with fitz.open(stream=content, filetype="pdf") as doc:
            for page_num in range(len(doc)):
                page = doc[page_num]
                text_parts.append(page.get_text("text"))
        return "\n".join(text_parts).strip()
    elif ext in [".docx", ".doc"]:
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text.strip())
        return "\n".join(paragraphs).strip()
    else:
        return content.decode("utf-8", errors="ignore").strip()

def extract_text_from_pdf(file_path: str) -> str:
    """Extract plain text from a PDF file using PyMuPDF locally."""
    text_parts = []
    with fitz.open(file_path) as doc:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_parts.append(page.get_text("text"))
    return "\n".join(text_parts).strip()

def extract_text_from_docx(file_path: str) -> str:
    """Extract plain text from a DOCX file using python-docx locally."""
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    # Also extract text from tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    paragraphs.append(cell.text.strip())
    return "\n".join(paragraphs).strip()

def extract_text(input_data: Union[str, bytes], filename: Optional[str] = None) -> str:
    """Detect input type and extract text locally in-memory or from path."""
    if isinstance(input_data, bytes):
        return extract_text_from_bytes(input_data, filename or "resume.pdf")
    
    if isinstance(input_data, str) and not os.path.exists(input_data) and ("\n" in input_data or len(input_data) > 80):
        return input_data.strip()

    ext = Path(str(input_data)).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(str(input_data))
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(str(input_data))
    else:
        with open(str(input_data), "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def extract_contact_info(text: str) -> Dict[str, Any]:
    """Extract email, phone, links from text using regex."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    
    phone_pattern = r'(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12})'
    phones = re.findall(phone_pattern, text)
    
    github_pattern = r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)'
    github_matches = re.findall(github_pattern, text, re.IGNORECASE)
    
    linkedin_pattern = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)'
    linkedin_matches = re.findall(linkedin_pattern, text, re.IGNORECASE)
    
    return {
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "github": f"https://github.com/{github_matches[0]}" if github_matches else None,
        "linkedin": f"https://linkedin.com/in/{linkedin_matches[0]}" if linkedin_matches else None,
    }

def extract_sections(text: str) -> Dict[str, str]:
    """Segment resume text into standard sections."""
    lines = text.split("\n")
    sections = {
        "summary": "",
        "skills": "",
        "experience": "",
        "projects": "",
        "education": "",
        "certifications": ""
    }
    
    section_headers = {
        "skills": [r'skills?', r'technical skills?', r'competencies', r'technologies', r'core competencies'],
        "experience": [r'experience', r'work experience', r'employment history', r'internships?', r'professional experience'],
        "projects": [r'projects?', r'personal projects?', r'academic projects?', r'key projects'],
        "education": [r'education', r'academic background', r'qualifications'],
        "certifications": [r'certifications?', r'licenses?', r'certificates', r'courses']
    }
    
    current_section = "summary"
    buffer = {k: [] for k in sections}
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if line looks like a header (short, capitalized or bold-like)
        if len(stripped.split()) <= 4 and len(stripped) < 40:
            header_detected = None
            for sec_name, patterns in section_headers.items():
                for pat in patterns:
                    if re.match(rf'^{pat}[:\s]*$', stripped, re.IGNORECASE):
                        header_detected = sec_name
                        break
                if header_detected:
                    break
            
            if header_detected:
                current_section = header_detected
                continue
                
        buffer[current_section].append(stripped)
        
    for k in sections:
        sections[k] = "\n".join(buffer[k])
        
    return sections

def extract_skills_from_text(text: str) -> List[Dict[str, Any]]:
    """Scan text for known taxonomy skills and aliases using word boundary regex."""
    found_skills = {}
    lower_text = text.lower()
    
    # Sort aliases by length descending so longer phrases match first (e.g. "machine learning" before "ml")
    sorted_aliases = sorted(ALIAS_MAP.keys(), key=lambda x: len(x), reverse=True)
    
    for alias in sorted_aliases:
        canonical = ALIAS_MAP[alias]
        if canonical in found_skills:
            continue
            
        # Match using word boundary if alphanumeric, or escape symbols like C++
        if re.match(r'^[a-z0-9\s]+$', alias):
            pattern = rf'\b{re.escape(alias)}\b'
        else:
            pattern = re.escape(alias)
            
        if re.search(pattern, lower_text):
            category = SKILL_TAXONOMY.get(canonical, {}).get("category", "General")
            found_skills[canonical] = {
                "name": canonical,
                "category": category,
                "source": "resume",
                "verified": False,
                "level": "intermediate"
            }
            
    return list(found_skills.values())

def parse_resume(input_data: Union[str, bytes], filename: Optional[str] = None) -> Dict[str, Any]:
    """Complete in-memory resume parser producing structured extraction without local file storage."""
    raw_text = extract_text(input_data, filename=filename)
    contact = extract_contact_info(raw_text)
    sections = extract_sections(raw_text)
    
    # Extract skills from entire text and specifically from sections
    all_skills = extract_skills_from_text(raw_text)
    project_skills = extract_skills_from_text(sections["projects"])
    project_skill_names = {s["name"] for s in project_skills}
    
    # Annotate skills supported by project evidence!
    for s in all_skills:
        if s["name"] in project_skill_names:
            s["source"] = "project"  # Evidence supported!
            s["verified"] = True
    
    # Extract candidate name approximation from first few non-empty lines
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    candidate_name = ""
    for line in lines[:5]:
        # If line has 2-4 words and no symbols/emails/digits, good candidate for name
        if 2 <= len(line.split()) <= 4 and not re.search(r'[@\d\/:;]', line) and len(line) < 40:
            candidate_name = line.title()
            break
            
    # Extract basic education items
    education_entries = []
    edu_text = sections["education"] or raw_text
    degree_patterns = [
        (r'\b(b\.?tech|bachelor of technology|b\.?e\.?|bachelor of engineering)\b', "B.Tech / B.E.", "Computer Science & Engineering"),
        (r'\b(m\.?tech|master of technology|m\.?s\.?|master of science)\b', "M.Tech / M.S.", "Computer Science"),
        (r'\b(b\.?c\.?a\.?|bachelor of computer applications)\b', "B.C.A.", "Computer Applications"),
        (r'\b(b\.?sc|bachelor of science)\b', "B.Sc", "Computer Science / IT")
    ]
    for deg_pat, deg_name, def_field in degree_patterns:
        if re.search(deg_pat, edu_text, re.IGNORECASE):
            # Try to find year
            year_match = re.search(r'\b(20\d\d)\s*[-–to]*\s*(20\d\d|present)?\b', edu_text, re.IGNORECASE)
            start_yr = int(year_match.group(1)) if year_match else 2022
            end_yr = int(year_match.group(2)) if year_match and year_match.group(2) and year_match.group(2).isdigit() else 2026
            education_entries.append({
                "institution": "Technical University / College",
                "degree": deg_name,
                "field_of_study": def_field,
                "start_year": start_yr,
                "end_year": end_yr,
                "grade": "First Class"
            })
            break
            
    # Extract projects from project section
    project_entries = []
    proj_lines = [p.strip() for p in sections["projects"].split("\n") if p.strip()]
    current_proj = None
    for p_line in proj_lines:
        if len(p_line) < 60 and not p_line.startswith(('-', '•', '*')):
            if current_proj:
                project_entries.append(current_proj)
            current_proj = {
                "title": p_line,
                "description": "",
                "technologies": [s["name"] for s in extract_skills_from_text(p_line)],
                "github_url": "",
                "link": ""
            }
        elif current_proj:
            current_proj["description"] += " " + p_line
            matched_tech = [s["name"] for s in extract_skills_from_text(p_line)]
            current_proj["technologies"] = list(set(current_proj["technologies"] + matched_tech))
            
    if current_proj:
        project_entries.append(current_proj)

    return {
        "candidate_name": candidate_name,
        "contact": contact,
        "skills": all_skills,
        "education": education_entries,
        "projects": project_entries,
        "sections": sections,
        "raw_text": raw_text[:8000] # preview text
    }
