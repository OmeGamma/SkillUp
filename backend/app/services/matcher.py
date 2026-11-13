from typing import Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.skill_catalog import normalize_skill, normalize_skill_list, SKILL_TAXONOMY

def compute_tfidf_similarity(candidate_text: str, job_text: str) -> float:
    """Compute cosine similarity between candidate resume/profile text and job description."""
    if not candidate_text.strip() or not job_text.strip():
        return 0.0
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([candidate_text, job_text])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(round(max(0.0, min(1.0, sim)) * 100, 1))
    except Exception:
        return 0.0

def match_candidate_to_job(
    candidate_profile: Dict[str, Any],
    job_requirements: Dict[str, Any],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Match a candidate profile to job requirements with complete transparency.
    
    Weights default:
    - required_coverage: 50%
    - preferred_coverage: 25%
    - text_similarity: 25%
    """
    if weights is None:
        weights = {
            "required": 0.50,
            "preferred": 0.25,
            "text_similarity": 0.25
        }
        
    required_skills = normalize_skill_list(job_requirements.get("required_skills", []))
    preferred_skills = normalize_skill_list(job_requirements.get("preferred_skills", []))
    
    # Candidate skills & evidence
    cand_skills_raw = candidate_profile.get("skills", [])
    cand_projects = candidate_profile.get("projects", [])
    cand_experience = candidate_profile.get("experience", [])
    cand_raw_text = candidate_profile.get("resume_raw_text", "") or ""
    
    # Map candidate skill names to details
    cand_skill_map = {}
    for s in cand_skills_raw:
        s_name = normalize_skill(s.get("name", ""))
        cand_skill_map[s_name.lower()] = s
        
    # Project evidence check
    project_tech_set = set()
    for p in cand_projects:
        desc = (p.get("description", "") + " " + p.get("title", "")).lower()
        for t in p.get("technologies", []):
            project_tech_set.add(normalize_skill(t).lower())
        for canonical, details in SKILL_TAXONOMY.items():
            if canonical.lower() in desc:
                project_tech_set.add(canonical.lower())
                
    # Match required skills
    matched_required = []
    missing_required = []
    
    for r in required_skills:
        r_lower = r.lower()
        if r_lower in cand_skill_map:
            c_skill = cand_skill_map[r_lower]
            has_project_evidence = r_lower in project_tech_set or c_skill.get("source") == "project" or c_skill.get("verified", False)
            matched_required.append({
                "skill": r,
                "category": SKILL_TAXONOMY.get(r, {}).get("category", "Technical"),
                "source": c_skill.get("source", "self"),
                "verified": has_project_evidence,
                "evidence_type": "Project Evidence" if has_project_evidence else "Self Reported / Resume Mention"
            })
        else:
            missing_required.append({
                "skill": r,
                "category": SKILL_TAXONOMY.get(r, {}).get("category", "Technical"),
                "priority": "High",
                "reason": "Explicitly required in job specification"
            })
            
    # Match preferred skills
    matched_preferred = []
    missing_preferred = []
    
    for p in preferred_skills:
        p_lower = p.lower()
        if p_lower in cand_skill_map:
            c_skill = cand_skill_map[p_lower]
            has_project_evidence = p_lower in project_tech_set or c_skill.get("source") == "project" or c_skill.get("verified", False)
            matched_preferred.append({
                "skill": p,
                "category": SKILL_TAXONOMY.get(p, {}).get("category", "Technical"),
                "source": c_skill.get("source", "self"),
                "verified": has_project_evidence,
                "evidence_type": "Project Evidence" if has_project_evidence else "Self Reported / Resume Mention"
            })
        else:
            missing_preferred.append({
                "skill": p,
                "category": SKILL_TAXONOMY.get(p, {}).get("category", "Technical"),
                "priority": "Medium",
                "reason": "Preferred advantage for this role"
            })
            
    # Calculate coverage percentages
    req_cov = (len(matched_required) / len(required_skills) * 100) if required_skills else 100.0
    pref_cov = (len(matched_preferred) / len(preferred_skills) * 100) if preferred_skills else 100.0
    
    # Compute TF-IDF similarity between candidate corpus and job text
    job_full_text = f"{job_requirements.get('title', '')} {job_requirements.get('description', '')} {' '.join(required_skills)} {' '.join(preferred_skills)}"
    
    cand_corpus = cand_raw_text
    if not cand_corpus:
        # Build textual representation
        cand_corpus = f"{candidate_profile.get('headline', '')} {candidate_profile.get('bio', '')} " + \
                      " ".join([s.get("name", "") for s in cand_skills_raw]) + " " + \
                      " ".join([p.get("title", "") + " " + p.get("description", "") for p in cand_projects])
                      
    tfidf_score = compute_tfidf_similarity(cand_corpus, job_full_text)
    
    # Weighted composite match score
    overall_score = round(
        (req_cov * weights["required"]) +
        (pref_cov * weights["preferred"]) +
        (tfidf_score * weights["text_similarity"]),
        1
    )
    
    # Evidence verification stats
    total_matched = matched_required + matched_preferred
    verified_count = sum(1 for s in total_matched if s["verified"])
    unverified_count = len(total_matched) - verified_count
    evidence_rate = round((verified_count / len(total_matched) * 100), 1) if total_matched else 0.0
    
    # Recommended learning activities for missing skills
    learning_recommendations = []
    for m in missing_required[:4]:
        learning_recommendations.append({
            "skill": m["skill"],
            "type": "Core Requirement",
            "action": f"Practice hands-on {m['skill']} fundamentals and build a mini-project demonstrating core capabilities.",
            "estimated_hours": "10-15 hours"
        })
    for m in missing_preferred[:3]:
        learning_recommendations.append({
            "skill": m["skill"],
            "type": "Competitive Edge",
            "action": f"Integrate {m['skill']} into an existing application to showcase end-to-end fluency.",
            "estimated_hours": "6-10 hours"
        })
        
    return {
        "overall_score": overall_score,
        "required_coverage": round(req_cov, 1),
        "preferred_coverage": round(pref_cov, 1),
        "text_similarity": tfidf_score,
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "evidence_stats": {
            "total_skills_matched": len(total_matched),
            "evidence_backed": verified_count,
            "unverified_or_self_reported": unverified_count,
            "evidence_verification_rate": evidence_rate
        },
        "learning_recommendations": learning_recommendations,
        "methodology": {
            "formula": "Composite Score = (50% * Required Skill Coverage) + (25% * Preferred Skill Coverage) + (25% * TF-IDF Cosine Similarity)",
            "weights": weights,
            "transparency_note": "Unverified or missing skills reflect absence of documented resume/project evidence in the current profile, not conclusive proof of candidate inability."
        }
    }
