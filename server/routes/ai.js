import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

import axios from 'axios';

// Helper to generate cover letters dynamically from user profile and job requirements
function getFallbackCoverLetter(user, job, candidateSkills = []) {
  const skillsList = candidateSkills.length > 0 ? candidateSkills.join(', ') : (user?.skills || []).join(', ');
  const matchingReqs = (job?.requiredSkills || []).join(', ');
  const company = job?.company || 'your organization';
  const role = job?.title || 'Software Engineer';
  const location = job?.location || 'Remote';

  const introOptions = [
    `I am thrilled to submit my application for the ${role} position at ${company}. Having followed ${company}'s work in technical innovation, I am eager to contribute my background in ${user?.branch || 'Technology'} to your team in ${location}.`,
    `With strong enthusiasm, I am applying for the ${role} role at ${company}. My hands-on experience with ${skillsList || 'modern software development'} makes me a strong fit for your team's goals in ${location}.`,
    `I am writing to express my keen interest in joining ${company} as a ${role}. My technical trajectory in ${user?.branch || 'Computer Engineering'} and expertise in ${skillsList || 'software design'} closely align with the core requisites of this opening.`
  ];

  const bodyOptions = [
    `Reviewing the requirements for ${role}, I noted your focus on ${matchingReqs || 'core engineering principles'}. In my recent projects, I have successfully applied these exact technologies to solve complex problems and build scalable features. ${job?.description ? `I am particularly drawn to ${company}'s initiative: "${job.description.slice(0, 160)}..."` : ''}`,
    `Your team's technical focus on ${matchingReqs || 'modern stack architectures'} aligns directly with my engineering background. I have delivered production-grade features utilizing ${skillsList || 'full-stack workflows'}, ensuring performance, clean code standards, and reliable API integrations.`,
    `My technical skillset in ${skillsList || 'software engineering'} directly supports ${company}'s need for ${matchingReqs || 'scalable technical solutions'}. I thrive in collaborative environments where I can build impactful products and continuously refine code performance.`
  ];

  const outroOptions = [
    `I would welcome the opportunity to discuss how my technical skills and problem-solving mindset can contribute to ${company}'s ongoing success. Thank you for your time and consideration.`,
    `I am excited about the prospect of bringing my expertise in ${skillsList ? skillsList.split(',')[0] : 'software development'} to ${company}. Thank you for evaluating my application.`,
    `Thank you for reviewing my background. I look forward to connecting and sharing how my qualifications match the vision of your team at ${company}.`
  ];

  const randIdx = Math.floor(Math.random() * 3);
  const selectedIntro = introOptions[randIdx % introOptions.length];
  const selectedBody = bodyOptions[randIdx % bodyOptions.length];
  const selectedOutro = outroOptions[randIdx % outroOptions.length];

  return `Dear Hiring Manager,

${selectedIntro}

${selectedBody}

${selectedOutro}

Sincerely,
${user?.name || 'Applicant'}
${user?.email || ''} ${user?.phone ? `| ${user.phone}` : ''}`;
}

// Helper for interview questions dynamically customized to role and candidate skills
function getFallbackInterviewQuestions(user, job, candidateSkills = []) {
  const roleTitle = job?.title || 'Software Developer';
  const company = job?.company || 'the target company';
  const reqSkills = job?.requiredSkills || [];
  const primarySkill = reqSkills[0] || candidateSkills[0] || 'JavaScript';
  const secondarySkill = reqSkills[1] || candidateSkills[1] || 'Node.js';
  const tertiarySkill = reqSkills[2] || candidateSkills[2] || 'SQL';

  const roleLower = roleTitle.toLowerCase();

  let techQuestions = [];
  if (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('ui')) {
    techQuestions = [
      `How do you optimize state management and re-renders in a high-traffic ${primarySkill} application?`,
      `Explain your strategy for component modularity, CSS styling, and responsive layouts using ${secondarySkill}.`,
      `Walk through how you debug asynchronous network calls, CORS errors, and state hydration issues on the client side.`,
      `What techniques do you use to measure and improve Core Web Vitals (LCP, INP, CLS) in a modern frontend architecture?`,
      `How do you integrate authentication tokens (JWT/OAuth) securely within browser storage and API interceptors?`
    ];
  } else if (roleLower.includes('back') || roleLower.includes('node') || roleLower.includes('api') || roleLower.includes('python')) {
    techQuestions = [
      `How do you design and structure RESTful or GraphQL API endpoints in ${primarySkill} for optimal scalability?`,
      `Explain how you manage database transactions, indexing, and connection pooling when querying ${tertiarySkill}.`,
      `Walk me through your approach to error handling, centralized logging, and rate limiting in ${secondarySkill} microservices.`,
      `How do you secure backend endpoints against SQL injection, XSS, and unauthorized JWT access?`,
      `Describe how you implement background worker jobs, caching layers (Redis), and event-driven queues.`
    ];
  } else if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('ai') || roleLower.includes('python')) {
    techQuestions = [
      `How do you handle missing values, outliers, and data normalization using ${primarySkill} (Pandas/NumPy)?`,
      `Explain the differences between supervised vs. unsupervised models and how you prevent model overfitting.`,
      `How do you evaluate machine learning model performance (Precision, Recall, F1-Score, ROC-AUC)?`,
      `Describe how you deploy model endpoints with ${secondarySkill} (FastAPI/Flask) and package them in Docker.`,
      `What strategies do you use for feature engineering and handling high-dimensional datasets?`
    ];
  } else {
    techQuestions = [
      `How do you structure and optimize a production-ready application built with ${primarySkill}?`,
      `Walk me through how you implement secure data flows and state management using ${secondarySkill}.`,
      `Given the requirements for the ${roleTitle} role at ${company}, how would you handle high traffic or system scaling challenges?`,
      `Explain how you handle debugging, error logging, and performance bottlenecks in ${primarySkill} and ${tertiarySkill}.`,
      `How do you ensure code quality, writing reusable components/modules, and unit testing in your daily development workflow?`
    ];
  }

  const hrQuestions = [
    `Why are you passionate about joining ${company} as a ${roleTitle}?`,
    `Describe a challenging technical obstacle you solved using ${primarySkill} and what key lesson you learned.`,
    `How do you manage competing priorities when sudden changes occur in project scope or timelines?`,
    `Tell me about a time you collaborated with cross-functional engineers or design teams to deliver a feature under pressure.`,
    `How do you stay updated with emerging technologies and continuous learning in software engineering?`
  ];

  return { techQuestions, hrQuestions };
}

// Helper for skill roadmap dynamically customized to target role and current skills
function getFallbackRoadmap(targetRole, userSkills = []) {
  const role = (targetRole || 'Software Engineer').trim();
  const currentSkillsStr = userSkills.length > 0 ? userSkills.slice(0, 5).join(', ') : 'core technical fundamentals';

  return [
    { 
      step: `1. Core Foundations for ${role}`, 
      topics: [
        `Master fundamental principles and data structures relevant to ${role}`,
        "Learn Git workflow, pull requests, semantic versioning, and code review etiquette",
        "Understand networking protocol basics (HTTP/HTTPS, REST, headers, status codes)"
      ] 
    },
    { 
      step: `2. Primary Stack Mastery & Project Building`, 
      topics: [
        `Deepen hands-on proficiency in key frameworks for ${role}`,
        `Build full-stack applications connecting existing skills (${currentSkillsStr}) with industry standards`,
        "Implement robust input validation, environment configs, and secret management"
      ] 
    },
    { 
      step: `3. Database Architecture & Security Integration`, 
      topics: [
        "Design relational (SQL) and document (NoSQL) schemas with proper index strategies",
        "Implement secure authentication patterns (JWT, refresh tokens, password hashing with bcrypt)",
        "Optimize query performance and implement caching mechanisms using Redis"
      ] 
    },
    { 
      step: `4. DevOps, Automation & Testing`, 
      topics: [
        "Containerize services using Docker and orchestrate multi-container setups",
        "Automate CI/CD pipelines with GitHub Actions for automated linting and deployment",
        "Write unit, integration, and end-to-end tests using frameworks like Vitest, Jest, or PyTest"
      ] 
    },
    { 
      step: `5. Cloud Deployment & System Architecture`, 
      topics: [
        `Architect scalable microservices or serverless infrastructure for ${role} level applications`,
        "Deploy and monitor cloud applications on AWS, Vercel, GCP, or Render",
        "Configure error logging, telemetry monitoring, and performance profiling tools"
      ] 
    }
  ];
}

// Helper to execute Gemini generation across active model versions
async function generateGeminiContent(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini Notice] GEMINI_API_KEY is not defined in server/.env.");
    return null;
  }

  // 1. Try Google Generative AI SDK
  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-3.5-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        console.log(`[Gemini SDK Success] Model ${modelName}`);
        return text.trim();
      }
    } catch (err) {
      if (err.message.includes('Quota exceeded') || err.message.includes('limit: 0')) {
        console.warn(`[Gemini Key Warning] GEMINI_API_KEY returned quota limit 0. If your key in .env does not start with "AIzaSy...", please replace it with a free Google AI Studio key from https://aistudio.google.com/app/apikey.`);
      } else {
        console.warn(`Gemini SDK model ${modelName} notice:`, err.message);
      }
    }
  }

  // 2. Try direct REST API execution if SDK encounters model name deprecations
  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }, { timeout: 12000 });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[Gemini REST Success] Model ${modelName}`);
        return text.trim();
      }
    } catch (restErr) {
      console.warn(`Gemini REST model ${modelName} notice:`, restErr.response?.data?.error?.message || restErr.message);
    }
  }

  return null;
}

// @route    POST api/ai/cover-letter
// @desc     Generate custom cover letter
// @access   Private
router.post('/cover-letter', auth, async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ msg: 'Please select a valid job application.' });
  }

  try {
    const user = await User.findById(req.user.id);
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ msg: 'Selected job application was not found.' });
    }

    const resume = await Resume.findOne({ userId: req.user.id });
    const candidateSkills = Array.from(new Set([
      ...(resume?.parsedData?.skills || []),
      ...(user?.skills || [])
    ]));
    const resumeText = resume?.rawText || '';

    const prompt = `
      You are an expert career consultant and executive resume writer. Generate an exceptional, highly tailored cover letter.
      
      Candidate Profile:
      Name: ${user.name}
      Email: ${user.email}
      Branch/Degree: ${user.branch || 'Technology'}
      Candidate Skills: ${candidateSkills.join(', ') || 'Software Development'}
      Resume Excerpt: ${resumeText.substring(0, 2500)}
      
      Target Position:
      Job Title: ${job.title}
      Company: ${job.company}
      Location: ${job.location}
      Required Skills: ${job.requiredSkills?.join(', ')}
      Job Description: ${job.description}
      
      Instructions:
      1. Write a professional, punchy, persuasive 3-paragraph cover letter (approx 300 words).
      2. Highlight specific technical skills that directly match the job requirements.
      3. Do NOT use placeholder text (e.g. "[Date]", "[Hiring Manager Name]"). Start directly with "Dear Hiring Manager,".
      4. End professionally with candidate contact details.
    `;

    const aiOutput = await generateGeminiContent(prompt);

    if (aiOutput) {
      return res.json({ coverLetter: aiOutput, isMock: false, aiEngine: 'Gemini AI (Dynamic)' });
    }

    // Dynamic Personal Engine Fallback
    const coverLetter = getFallbackCoverLetter(user, job, candidateSkills);
    return res.json({ coverLetter, isMock: true, aiEngine: 'AI Personal Engine' });
  } catch (err) {
    console.error("Cover Letter generation error:", err.message);
    try {
      const user = await User.findById(req.user.id);
      const job = await Job.findById(jobId);
      const resume = await Resume.findOne({ userId: req.user.id });
      const candidateSkills = resume?.parsedData?.skills || user.skills || [];
      const coverLetter = getFallbackCoverLetter(user, job, candidateSkills);
      res.json({ coverLetter, isMock: true, aiEngine: 'AI Personal Engine' });
    } catch (fallbackErr) {
      res.status(500).json({ msg: 'Unable to generate cover letter right now. Please try again.' });
    }
  }
});

// @route    POST api/ai/interview-questions
// @desc     Generate targeted interview questions
// @access   Private
router.post('/interview-questions', auth, async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ msg: 'Please select a valid job application.' });
  }

  let job = null;
  try {
    const user = await User.findById(req.user.id);
    job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ msg: 'Selected job application was not found.' });
    }

    const resume = await Resume.findOne({ userId: req.user.id });
    const candidateSkills = Array.from(new Set([
      ...(resume?.parsedData?.skills || []),
      ...(user?.skills || [])
    ]));

    const prompt = `
      You are an expert technical interviewer at a top technology company.
      Based on candidate skills and job requirements, generate:
      1. Five (5) specific technical interview questions relevant to the target stack (${job.title}).
      2. Five (5) behavioral / HR interview questions assessing communication, problem-solving, and adaptability.
      
      Candidate Skills: ${candidateSkills.join(', ')}
      Target Role: ${job.title} at ${job.company}
      Job Required Skills: ${job.requiredSkills?.join(', ')}
      Description: ${job.description}
      
      Return ONLY raw, valid JSON matching this exact structure with no markdown or formatting wrapper:
      {
        "techQuestions": [
          "Technical Question 1...",
          "Technical Question 2...",
          "Technical Question 3...",
          "Technical Question 4...",
          "Technical Question 5..."
        ],
        "hrQuestions": [
          "HR Question 1...",
          "HR Question 2...",
          "HR Question 3...",
          "HR Question 4...",
          "HR Question 5..."
        ]
      }
    `;

    const aiOutput = await generateGeminiContent(prompt);

    if (aiOutput) {
      try {
        let cleanText = aiOutput;
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3, cleanText.length - 3).trim();
        }
        const data = JSON.parse(cleanText);
        if (data.techQuestions && data.hrQuestions) {
          return res.json({
            techQuestions: data.techQuestions,
            hrQuestions: data.hrQuestions,
            isMock: false,
            aiEngine: 'Gemini AI (Dynamic)'
          });
        }
      } catch (parseErr) {
        console.warn("JSON parsing for Gemini interview output failed, using fallback:", parseErr.message);
      }
    }

    const fallback = getFallbackInterviewQuestions(user, job, candidateSkills);
    res.json({ ...fallback, isMock: true, aiEngine: 'AI Personal Engine' });
  } catch (err) {
    console.error("Interview Question generation error:", err.message);
    const fallback = getFallbackInterviewQuestions(null, job || { title: '', company: '' }, []);
    res.json({ ...fallback, isMock: true, aiEngine: 'AI Personal Engine' });
  }
});

// @route    POST api/ai/roadmap
// @desc     Generate targeted skill learning roadmap
// @access   Private
router.post('/roadmap', auth, async (req, res) => {
  const { targetRole } = req.body;
  if (!targetRole || !targetRole.trim()) {
    return res.status(400).json({ msg: 'Please specify a target professional role.' });
  }

  try {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ userId: req.user.id });
    const candidateSkills = resume?.parsedData?.skills || user.skills || [];

    const prompt = `
      You are a senior tech career counselor. Build a step-by-step learning roadmap for a candidate transitioning to the role of "${targetRole}".
      
      Candidate Current Skills: ${candidateSkills.join(', ')}
      
      Requirements:
      1. Provide a 5-step sequential roadmap from beginner to advanced topics needed for "${targetRole}".
      2. For each step, provide a clear "step" title and a list of 3-4 specific "topics".
      
      Return ONLY raw, valid JSON matching this exact structure with no markdown code blocks:
      {
        "roadmap": [
          {
            "step": "1. Foundation & Core Technologies",
            "topics": ["Topic 1", "Topic 2", "Topic 3"]
          },
          {
            "step": "2. Intermediate Frameworks",
            "topics": ["Topic 4", "Topic 5", "Topic 6"]
          }
        ]
      }
    `;

    const aiOutput = await generateGeminiContent(prompt);

    if (aiOutput) {
      try {
        let cleanText = aiOutput;
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3, cleanText.length - 3).trim();
        }
        const data = JSON.parse(cleanText);
        if (data.roadmap && Array.isArray(data.roadmap)) {
          return res.json({ roadmap: data.roadmap, isMock: false, aiEngine: 'Gemini 2.0 AI' });
        }
      } catch (parseErr) {
        console.warn("JSON parsing for Gemini roadmap output failed, using fallback:", parseErr.message);
      }
    }

    const fallback = getFallbackRoadmap(targetRole, candidateSkills);
    res.json({ roadmap: fallback, isMock: true, aiEngine: 'Smart Template System' });
  } catch (err) {
    console.error("Roadmap generation error:", err.message);
    const fallback = getFallbackRoadmap(targetRole, []);
    res.json({ roadmap: fallback, isMock: true, aiEngine: 'Smart Template System' });
  }
});

export default router;
