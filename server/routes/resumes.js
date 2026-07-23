import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

// Load environment variables immediately
dotenv.config();

// Setup Cloudinary Configuration if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const router = express.Router();

// Setup Multer Storage (saving to uploads/ folder)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function for dynamic AI resume analysis fallback
function getDynamicFallbackInsights(rawText = '', parsedSkills = []) {
  const textLower = (rawText || '').toLowerCase();
  const suggestions = [];

  // 1. Check for contact links (GitHub / LinkedIn)
  const hasGitHub = textLower.includes('github.com');
  const hasLinkedIn = textLower.includes('linkedin.com');
  if (!hasGitHub || !hasLinkedIn) {
    suggestions.push(`Add direct hyperlinks to your ${!hasGitHub ? 'GitHub portfolio' : ''}${!hasGitHub && !hasLinkedIn ? ' and ' : ''}${!hasLinkedIn ? 'LinkedIn profile' : ''} in the contact header.`);
  }

  // 2. Check for quantifiable metrics
  const hasMetrics = /[\d]+%|\$[\d]+|\b(increased|improved|reduced|decreased|accelerated|scaled|boosted)\b/.test(textLower);
  if (!hasMetrics) {
    suggestions.push("Quantify your bullet points with measurable impact (e.g. 'Optimized API response latency by 35%' or 'Scaled microservices for 10k+ active users').");
  }

  // 3. Check for action verbs
  const hasActionVerbs = /\b(architected|engineered|implemented|developed|refactored|spearheaded|orchestrated|deployed)\b/.test(textLower);
  if (!hasActionVerbs) {
    suggestions.push("Begin bullet points under Work Experience and Projects with strong technical action verbs (e.g., 'Architected', 'Orchestrated', 'Refactored').");
  }

  // 4. Check skills count & formatting
  if (parsedSkills.length < 6) {
    suggestions.push("Expand your Technical Skills section by categorizing skills into distinct subheadings (e.g. Languages, Frameworks, Databases, Cloud/DevOps).");
  } else {
    suggestions.push("Ensure your core tech stack matches ATS keyword standards by avoiding abbreviations and placing primary skills near top section headers.");
  }

  // 5. Check formatting & ATS single-column structure
  suggestions.push("Format your resume as a clean, single-column document without embedded graphic elements or multi-column tables to maximize ATS parser compatibility.");

  const topSkillsStr = parsedSkills.slice(0, 5).join(', ');
  const summary = `Accomplished engineering candidate with demonstrated technical proficiency in ${topSkillsStr || 'modern software development'}. Experienced in implementing core application features, building functional projects, and applying technical principles to solve software problems.`;

  return { summary, suggestions: suggestions.slice(0, 5) };
}

// Helper function to call Gemini API for resume summary and high-accuracy suggestions
async function getGeminiInsights(rawText, parsedSkills = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = getDynamicFallbackInsights(rawText, parsedSkills);

  if (!apiKey) {
    console.warn("[Resume AI Notice] GEMINI_API_KEY is not defined in server/.env.");
    return fallback;
  }

  const prompt = `
    You are a principal tech recruiter and ATS optimization expert at a top software company.
    Analyze the following candidate resume text with extreme accuracy and generate:
    1. A compelling 3-4 sentence professional summary highlighting the candidate's core domain, experience level, and top technical strengths.
    2. Five (5) specific, highly actionable ATS and resume enhancement suggestions strictly tailored to the candidate's actual text.

    Resume Text:
    """
    ${rawText.slice(0, 3500)}
    """

    Return ONLY raw valid JSON with no markdown brackets matching this structure:
    {
      "summary": "Professional summary paragraph...",
      "suggestions": [
        "Suggestion 1...",
        "Suggestion 2...",
        "Suggestion 3...",
        "Suggestion 4...",
        "Suggestion 5..."
      ]
    }
  `;

  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-3.5-flash'];
  
  // 1. Try SDK Call
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let resultText = result.response.text().trim();
        
        if (resultText.startsWith('```json')) {
          resultText = resultText.substring(7, resultText.length - 3).trim();
        } else if (resultText.startsWith('```')) {
          resultText = resultText.substring(3, resultText.length - 3).trim();
        }

        const data = JSON.parse(resultText);
        if (data.summary && data.suggestions) {
          console.log(`[Resume AI SDK Success] Model ${modelName}`);
          return { summary: data.summary, suggestions: data.suggestions };
        }
      } catch (err) {
        console.warn(`Gemini SDK model ${modelName} notice:`, err.message);
      }
    }
  } catch (sdkErr) {
    console.warn("Gemini SDK init notice:", sdkErr.message);
  }

  // 2. Try direct REST API Call
  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }, { timeout: 12000 });

      let resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (resultText.startsWith('```json')) {
        resultText = resultText.substring(7, resultText.length - 3).trim();
      } else if (resultText.startsWith('```')) {
        resultText = resultText.substring(3, resultText.length - 3).trim();
      }

      const data = JSON.parse(resultText);
      if (data.summary && data.suggestions) {
        console.log(`[Resume AI REST Success] Model ${modelName}`);
        return { summary: data.summary, suggestions: data.suggestions };
      }
    } catch (restErr) {
      console.warn(`Gemini REST model ${modelName} notice:`, restErr.response?.data?.error?.message || restErr.message);
    }
  }

  return fallback;
}

// Helper function to delete old resume assets from Cloudinary or local disk
async function deleteResumeAsset(resume) {
  if (!resume) return;

  // 1. Delete from Cloudinary if it exists
  if (resume.cloudinaryId) {
    try {
      console.log(`Deleting previous asset from Cloudinary: ${resume.cloudinaryId}`);
      
      // Configure dynamically on-demand
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      await cloudinary.uploader.destroy(resume.cloudinaryId, { resource_type: 'raw' });
    } catch (err) {
      console.error("Failed to delete asset from Cloudinary:", err);
    }
  }

  // 2. Delete from local disk if it exists
  if (resume.filePath && resume.filePath.startsWith('/uploads/')) {
    const localPath = resume.filePath.substring(1);
    if (fs.existsSync(localPath)) {
      try {
        console.log(`Deleting previous local asset: ${localPath}`);
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error("Failed to delete local asset:", err);
      }
    }
  }
}

// @route    POST api/resumes/upload
// @desc     Upload and parse resume
// @access   Private
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'Please upload a file' });
  }

  const filePath = req.file.path;
  const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    // 1. Call Python NLP Service
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log(`Sending file to NLP service at ${nlpServiceUrl}/parse...`);
    const nlpResponse = await axios.post(`${nlpServiceUrl}/parse`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const parsedDataResult = nlpResponse.data;

    // 2. Query Gemini API for AI suggestions and summary
    const extractedSkillsList = parsedDataResult.parsed_data?.skills || [];
    const geminiData = await getGeminiInsights(parsedDataResult.text, extractedSkillsList);

    // 3. Save to MongoDB based on dynamic storage strategy
    let resume = await Resume.findOne({ userId: req.user.id });

    const storageType = process.env.RESUME_STORAGE_TYPE || 'local';
    let finalFilePath = `/${filePath}`;
    let cloudinaryId = undefined;
    let fileData = undefined;
    let fileMimeType = undefined;

    if (storageType === 'database') {
      const fileBuffer = fs.readFileSync(filePath);
      fileData = fileBuffer.toString('base64');
      fileMimeType = req.file.mimetype;
      finalFilePath = '/api/resumes/download'; // Virtual download path

      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    } else if (storageType === 'cloudinary') {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary credentials are not configured in environment variables');
      }

      // Configure dynamically on-demand
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder: 'resumes'
      });

      finalFilePath = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;

      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }

    const resumeData = {
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: finalFilePath,
      cloudinaryId,
      fileData,
      fileMimeType,
      rawText: parsedDataResult.text,
      parsedData: parsedDataResult.parsed_data,
      atsAnalysis: parsedDataResult.ats_analysis,
      resumeScoring: parsedDataResult.resume_scoring,
      summary: geminiData.summary,
      suggestions: geminiData.suggestions
    };

    if (resume) {
      // Overwrite previous file by deleting existing assets first
      await deleteResumeAsset(resume);

      resume = await Resume.findOneAndUpdate(
        { userId: req.user.id },
        { $set: resumeData },
        { new: true }
      );
    } else {
      resume = new Resume(resumeData);
      await resume.save();
    }

    // 4. Update the User profile skills if skills are parsed
    const extractedSkills = parsedDataResult.parsed_data.skills || [];
    if (extractedSkills.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { skills: { $each: extractedSkills } }
      });
    }

    res.json({
      msg: 'Resume uploaded and parsed successfully',
      resume
    });
  } catch (err) {
    console.error("Upload/Parsing Error:", err.message);
    res.status(500).json({ error: 'Unable to process resume document. Please verify your PDF or DOCX file and try again.' });
  }
});

// @route    GET api/resumes/my-resume
// @desc     Get current user's resume analysis
// @access   Private
router.get('/my-resume', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ msg: 'No resume found for this user' });
    }
    res.json(resume);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/resumes/download
// @desc     Download current user's uploaded resume
// @access   Private
router.get('/download', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    // 1. If it's database storage (fileData exists)
    if (resume.fileData) {
      const fileBuffer = Buffer.from(resume.fileData, 'base64');
      const filename = resume.fileName || 'resume.pdf';
      const isPdf = filename.toLowerCase().endsWith('.pdf');
      
      res.setHeader('Content-Type', resume.fileMimeType || (isPdf ? 'application/pdf' : 'application/octet-stream'));
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(fileBuffer);
    }

    // 2. If it's Cloudinary storage
    if (resume.cloudinaryId || (resume.filePath && resume.filePath.startsWith('http'))) {
      try {
        const response = await axios({
          method: 'get',
          url: resume.filePath,
          responseType: 'stream'
        });
        const filename = resume.fileName || 'resume.pdf';
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        res.setHeader('Content-Type', response.headers['content-type'] || (isPdf ? 'application/pdf' : 'application/octet-stream'));
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return response.data.pipe(res);
      } catch (err) {
        console.error("Cloudinary stream error:", err);
        return res.redirect(resume.filePath);
      }
    }

    // 3. Default: Local disk storage
    if (resume.filePath) {
      const localPath = resume.filePath.substring(1); // Remove leading slash
      if (fs.existsSync(localPath)) {
        const filename = resume.fileName || path.basename(localPath);
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return fs.createReadStream(localPath).pipe(res);
      }
    }

    return res.status(404).json({ error: 'Resume file asset not found' });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

// @route    DELETE api/resumes/delete
// @desc     Delete current user's resume
// @access   Private
router.delete('/delete', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ msg: 'No resume found to delete' });
    }

    // Delete associated assets (local file or Cloudinary)
    await deleteResumeAsset(resume);

    await Resume.deleteOne({ userId: req.user.id });
    res.json({ msg: 'Resume deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
