import axios from 'axios';
import Job from '../models/Job.js';

// Predefined set of common tech keywords to extract from job descriptions
const TECH_KEYWORDS = [
  "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Flask",
  "Spring Boot", "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
  "HTML", "CSS", "Tailwind", "Bootstrap", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "CI/CD", "Terraform",
  "Machine Learning", "Deep Learning", "NLP", "LLM", "TensorFlow", "PyTorch", "Pandas",
  "System Design", "Microservices", "REST API", "GraphQL"
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSkillsFromText(text) {
  if (!text) return [];
  const textLower = text.toLowerCase();
  const matched = [];
  
  TECH_KEYWORDS.forEach(keyword => {
    const escaped = escapeRegExp(keyword);
    // Use positive lookahead/lookbehind or boundaries to support symbols like C++ and C#
    const pattern = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
    if (pattern.test(textLower)) {
      matched.push(keyword);
    }
  });
  
  return matched;
}

export const fetchLiveJobs = async (searchQuery, locationFilter = '', employmentType = '', experienceLevel = '') => {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error('JSEARCH_API_KEY is not defined in environment variables.');
  }

  // Build a query string
  let query = searchQuery || 'Software Engineer';
  if (locationFilter) {
    query += ` in ${locationFilter}`;
  } else {
    query += ' in USA';
  }

  if (experienceLevel) {
    query += ` ${experienceLevel}`;
  }

  try {
    console.log(`[JSearch Service] Calling JSearch API (search-v2) with query: "${query}"...`);
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search-v2',
      params: {
        query,
        num_pages: '1',
        country: 'us'
      },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const rawData = response.data?.data;
    const apiJobs = Array.isArray(rawData) ? rawData : (rawData?.jobs || []);
    console.log(`[JSearch Service] Successfully received ${apiJobs.length} live jobs from RapidAPI.`);

    const savedJobs = [];

    // Parse and upsert each job into MongoDB
    for (const apiJob of apiJobs) {
      // Determine Workplace Type (Remote / Hybrid / Onsite)
      let type = 'Onsite';
      const descLower = (apiJob.job_description || '').toLowerCase();
      if (apiJob.job_is_remote || descLower.includes('remote') || descLower.includes('work from home')) {
        type = 'Remote';
      } else if (descLower.includes('hybrid')) {
        type = 'Hybrid';
      }

      // Format Salary string
      let salary = 'Not Specified';
      if (apiJob.job_min_salary && apiJob.job_max_salary) {
        salary = `$${apiJob.job_min_salary.toLocaleString()} - $${apiJob.job_max_salary.toLocaleString()} ${apiJob.job_salary_currency || 'USD'}`;
      } else if (apiJob.job_min_salary) {
        salary = `$${apiJob.job_min_salary.toLocaleString()}+ ${apiJob.job_salary_currency || 'USD'}`;
      } else if (apiJob.job_salary_string) {
        salary = apiJob.job_salary_string;
      }

      // Format Experience level
      let experience = 'Entry level';
      const months = apiJob.job_required_experience?.required_experience_in_months;
      if (months) {
        experience = `${(months / 12).toFixed(0)}+ years`;
      }

      // Parse Required Skills (JSearch sometimes returns null or empty list; extract from text if needed)
      let requiredSkills = apiJob.job_required_skills || [];
      if (requiredSkills.length === 0) {
        requiredSkills = extractSkillsFromText(apiJob.job_description);
      }
      
      // Fallback skills if none found
      if (requiredSkills.length === 0) {
        requiredSkills = ['JavaScript', 'Node.js', 'React', 'Git'];
      }

      const employer = apiJob.employer_name || apiJob.job_employer_name || 'Tech Company';
      const logo = apiJob.employer_logo || apiJob.job_employer_logo || '';
      const location = [apiJob.job_city, apiJob.job_state, apiJob.job_country].filter(Boolean).join(', ') || apiJob.job_location || 'Remote';

      // Build target object
      const jobData = {
        title: apiJob.job_title || 'Software Engineer',
        company: employer,
        logo: logo,
        salary,
        location,
        experience,
        type,
        description: apiJob.job_description || '',
        requiredSkills,
        applyLink: apiJob.job_apply_link || '#',
        source: 'jsearch'
      };

      // Upsert by matching Title + Company + Location to avoid duplicate inserts
      const jobDocument = await Job.findOneAndUpdate(
        { 
          title: jobData.title, 
          company: jobData.company, 
          location: jobData.location 
        },
        { $set: jobData },
        { upsert: true, new: true }
      );

      savedJobs.push(jobDocument);
    }

    return savedJobs;
  } catch (error) {
    const errorDetails = error.response ? (error.response.data?.message || JSON.stringify(error.response.data)) : error.message;
    console.error('[JSearch Service Error] Failed to fetch live jobs:', errorDetails);
    throw new Error(errorDetails);
  }
};
