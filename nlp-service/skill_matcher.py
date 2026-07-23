def match_skills(candidate_skills, job_skills):
    """Compares candidate skills with required job skills, returns match stats."""
    candidate_set = {skill.strip().lower() for skill in candidate_skills}
    job_set = {skill.strip().lower() for skill in job_skills}
    
    if not job_set:
        return {
            "match_percentage": 100,
            "matched_skills": list(candidate_skills),
            "missing_skills": []
        }
        
    matched = candidate_set.intersection(job_set)
    missing = job_set.difference(candidate_set)
    
    # Map matched/missing back to original capitalizations from job_skills where possible
    matched_display = []
    missing_display = []
    
    for js in job_skills:
        js_lower = js.strip().lower()
        if js_lower in matched:
            matched_display.append(js)
        elif js_lower in missing:
            missing_display.append(js)
            
    # Calculate score
    score = int((len(matched) / len(job_set)) * 100) if job_set else 0
    
    return {
        "match_percentage": score,
        "matched_skills": matched_display,
        "missing_skills": missing_display
    }

def calculate_resume_score(parsed_data, ats_score):
    """Generates a composite resume score out of 100 based on structure, skills, projects, and contact info."""
    score = 40  # Base score
    deductions = 0
    breakdown = {}
    
    # Check contact info presence (up to 15 points)
    contact_info = parsed_data.get("contact_info", {})
    contact_score = 0
    if contact_info.get("email"): contact_score += 5
    if contact_info.get("phone"): contact_score += 5
    if contact_info.get("linkedin") or contact_info.get("github"): contact_score += 5
    breakdown["contact_info"] = contact_score
    score += contact_score
    
    # Check skills presence (up to 20 points)
    skills = parsed_data.get("skills", [])
    skills_score = min(20, len(skills) * 2) # 10 skills = 20 points
    breakdown["skills"] = skills_score
    score += skills_score
    
    # Check sections presence (up to 15 points)
    sections = parsed_data.get("sections", {})
    sections_score = 0
    if sections.get("experience") and len(sections["experience"].strip()) > 50:
        sections_score += 7
    if sections.get("projects") and len(sections["projects"].strip()) > 50:
        sections_score += 5
    if sections.get("education") and len(sections["education"].strip()) > 50:
        sections_score += 3
    breakdown["sections"] = sections_score
    score += sections_score
    
    # Incorporate ATS friendliness (up to 10 points)
    ats_contrib = int(ats_score * 0.1) # 10% of ATS score
    breakdown["ats_compatibility"] = ats_contrib
    score += ats_contrib
    
    score = min(100, score)
    breakdown["total"] = score
    
    return {
        "overall_score": score,
        "breakdown": breakdown
    }
