import pypdf
import docx

def check_pdf_ats(stream, text):
    """Audits PDF files for ATS compatibility issues (images, layout, word count, sections)."""
    issues = []
    score = 100
    
    # 1. Word Count Check
    words = text.split()
    word_count = len(words)
    if word_count < 150:
        issues.append("Resume word count is very low. Aim for at least 200-600 words.")
        score -= 15
    elif word_count > 1000:
        issues.append("Resume is too wordy. Keep it concise, ideally under 800 words.")
        score -= 10
        
    # 2. Image Check (image-only PDFs cannot be read by ATS)
    try:
        reader = pypdf.PdfReader(stream)
        has_images = False
        text_length = len(text.strip())
        
        for page in reader.pages:
            if len(page.images) > 0:
                has_images = True
                break
                
        if has_images and text_length < 200:
            issues.append("The PDF seems to contain scanned image content without selectable text. ATS parsers will fail completely.")
            score -= 50
        elif has_images:
            issues.append("Found image elements. Some older ATS software might get confused by graphics or icons.")
            score -= 5
            
        # 3. Page Count Check
        page_count = len(reader.pages)
        if page_count > 2:
            issues.append("Resume is too long. A standard resume should be 1-2 pages maximum.")
            score -= 10
            
    except Exception as e:
        print(f"Error checking PDF layout: {e}")

        
    # 4. Standard Headings Checklist
    text_lower = text.lower()
    headings = {
        "experience": ["experience", "work history", "employment"],
        "education": ["education", "academic"],
        "skills": ["skills", "technical skills", "technologies"]
    }
    
    for section, keywords in headings.items():
        found = False
        for kw in keywords:
            if kw in text_lower:
                found = True
                break
        if not found:
            issues.append(f"Missing a clear '{section.title()}' header. ATS parsers look for standard headings.")
            score -= 15
            
    # 5. Tables & Special Characters Check
    if "table" in text_lower or "|" in text or "•" not in text and word_count > 300:
        # Just check if bullets are missing in a relatively long resume, since bullet lists are preferred
        pass
        
    score = max(0, score)
    return {
        "ats_friendly": "YES" if score >= 75 else "NO",
        "ats_score": score,
        "issues": issues,
        "details": {
            "word_count": word_count,
            "has_images": has_images if 'has_images' in locals() else False,
            "page_count": page_count if 'page_count' in locals() else 1
        }
    }

def check_docx_ats(stream, text):
    """Audits DOCX files for ATS compatibility."""
    issues = []
    score = 100
    
    words = text.split()
    word_count = len(words)
    if word_count < 150:
        issues.append("Resume word count is very low. Aim for at least 200-600 words.")
        score -= 15
    elif word_count > 1000:
        issues.append("Resume is too long. Keep it under 800 words.")
        score -= 10
        
    # DOCX files usually parse well, but tables can be problematic
    try:
        doc = docx.Document(stream)
        if len(doc.tables) > 0:
            issues.append("Contains tables. Some ATS systems struggle with text inside tables. Use simple paragraphs instead.")
            score -= 10
    except Exception as e:
        print(f"Error checking DOCX layout: {e}")
        
    # Headings check
    text_lower = text.lower()
    headings = {
        "experience": ["experience", "work history", "employment"],
        "education": ["education", "academic"],
        "skills": ["skills", "technical skills", "technologies"]
    }
    
    for section, keywords in headings.items():
        found = False
        for kw in keywords:
            if kw in text_lower:
                found = True
                break
        if not found:
            issues.append(f"Missing a clear '{section.title()}' header.")
            score -= 15
            
    score = max(0, score)
    return {
        "ats_friendly": "YES" if score >= 75 else "NO",
        "ats_score": score,
        "issues": issues,
        "details": {
            "word_count": word_count,
            "has_images": False, # Docx reader doesn't count images easily
            "page_count": int(word_count / 450) + 1 # Approximation
        }
    }
