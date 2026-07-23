import express from 'express';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import auth from '../middleware/auth.js';
import { fetchLiveJobs } from '../services/jsearchService.js';

const router = express.Router();

// Helper to calculate match percentage in JS for performance
function calculateMatch(candidateSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  
  const cSet = new Set(candidateSkills.map(s => s.toLowerCase().trim()));
  const matched = [];
  const missing = [];

  jobSkills.forEach(skill => {
    if (cSet.has(skill.toLowerCase().trim())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const score = Math.round((matched.length / jobSkills.length) * 100);
  return { score, matched, missing };
}

// @route    GET api/jobs/search
// @desc     Manual job search with filters (JSearch Priority + Silent DB Fallback)
// @access   Private
router.get('/search', auth, async (req, res) => {
  const { title, location, type, experience, search } = req.query;
  const hasApiKey = !!process.env.JSEARCH_API_KEY;

  try {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ userId: req.user.id });
    const candidateSkills = Array.from(new Set([
      ...(resume?.parsedData?.skills || []),
      ...(user?.skills || [])
    ]));

    // Track user search in pastSearches history
    if (search && search.trim() && user) {
      const cleanSearch = search.trim();
      const updatedHistory = [cleanSearch, ...(user.pastSearches || []).filter(s => s.toLowerCase() !== cleanSearch.toLowerCase())].slice(0, 10);
      await User.findByIdAndUpdate(req.user.id, { pastSearches: updatedHistory });
    }

    let jobs = [];
    let isLive = false;

    // 1. FIRST PRIORITY: Attempt Live JSearch API call
    if (hasApiKey) {
      try {
        const searchQuery = search || title || 'Software Engineer';
        console.log(`[Job Search] Calling JSearch API (First Priority) with query: "${searchQuery}"...`);
        jobs = await fetchLiveJobs(searchQuery, location, type, experience);
        if (jobs.length > 0) {
          isLive = true;
        }
      } catch (liveError) {
        console.warn("[Server Console Only] Live JSearch search failed, falling back to local DB cache:", liveError.message);
      }
    }

    // 2. FALLBACK: Query local MongoDB Atlas if JSearch returned 0 or failed
    if (jobs.length === 0) {
      console.log('[Job Search] Falling back quietly to local database cache...');
      const query = {};
      if (title) query.title = new RegExp(title, 'i');
      if (location) query.location = new RegExp(location, 'i');
      if (type) query.type = type;
      if (experience) query.experience = experience;
      
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { company: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { location: new RegExp(search, 'i') }
        ];
      }
      jobs = await Job.find(query).sort({ createdAt: -1 });
    }

    const jobsWithScores = jobs.map(job => {
      const jobObj = job.toObject ? job.toObject() : job;
      const matchResult = calculateMatch(candidateSkills, jobObj.requiredSkills);
      return {
        ...jobObj,
        matchPercentage: matchResult.score,
        matchedSkills: matchResult.matched,
        missingSkills: matchResult.missing
      };
    });

    res.json({
      jobs: jobsWithScores
    });
  } catch (err) {
    console.error('[Server Console Only] Job search error:', err.message);
    res.status(500).json({ msg: 'Please wait, unable to complete job search right now. Please try again.' });
  }
});

// @route    GET api/jobs/recommend
// @desc     Get personalized AI job recommendations based on resume/skills or past user searches
// @access   Private
router.get('/recommend', auth, async (req, res) => {
  const hasApiKey = !!process.env.JSEARCH_API_KEY;

  try {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ userId: req.user.id });
    
    // Skills parsed directly from uploaded resume
    const resumeSkills = resume?.parsedData?.skills || [];
    const candidateSkills = Array.from(new Set([
      ...resumeSkills,
      ...(user?.skills || [])
    ]));

    let jobs = [];
    let isLive = false;
    const hasResume = !!resume && resumeSkills.length > 0;

    let searchQuery = '';
    if (hasResume) {
      // Build query dynamically using extracted skills from the resume + user profile branch
      const queryParts = [];
      if (resumeSkills.length > 0) {
        queryParts.push(resumeSkills.slice(0, 3).join(' '));
      }
      if (user?.branch) {
        queryParts.push(user.branch);
      }
      searchQuery = queryParts.join(' ') || 'Software Developer';
      
      console.log(`[Job Recommend] Resume detected. Calling JSearch API dynamically with query: "${searchQuery}"...`);

      if (hasApiKey) {
        try {
          jobs = await fetchLiveJobs(searchQuery);
          if (jobs.length > 0) {
            isLive = true;
          }
        } catch (liveError) {
          console.warn("[Server Console Only] JSearch API personalized recommendation failed, quietly falling back to local DB cache:", liveError.message);
        }
      }

      // Fallback: If JSearch fails, display manually inserted jobs from local DB
      if (jobs.length === 0) {
        console.log('[Job Recommend] JSearch unavailable. Showing manually inserted jobs from local database cache...');
        jobs = await Job.find().sort({ createdAt: -1 });
      }
    } else {
      // Build query dynamically based on user's location info and Computer Science domain
      let userLocation = 'India';
      const college = (user?.college || '').toLowerCase();
      if (college.includes('mumbai') || college.includes('bombay')) {
        userLocation = 'Mumbai';
      } else if (college.includes('delhi')) {
        userLocation = 'Delhi';
      } else if (college.includes('bangalore') || college.includes('bengaluru')) {
        userLocation = 'Bangalore';
      } else if (college.includes('pune')) {
        userLocation = 'Pune';
      } else if (college.includes('hyderabad')) {
        userLocation = 'Hyderabad';
      } else if (college.includes('chennai')) {
        userLocation = 'Chennai';
      } else {
        const phone = user?.phone || '';
        if (phone.startsWith('+91')) {
          userLocation = 'India';
        } else if (phone.startsWith('+1')) {
          userLocation = 'United States';
        } else if (phone.startsWith('+44')) {
          userLocation = 'United Kingdom';
        } else if (phone.startsWith('+61')) {
          userLocation = 'Australia';
        } else if (phone.startsWith('+65')) {
          userLocation = 'Singapore';
        }
      }

      searchQuery = `Computer Science Developer Jobs in ${userLocation}`;
      console.log(`[Job Recommend] No resume detected. Calling JSearch API dynamically for CS technical jobs based on location info: "${searchQuery}"...`);

      if (hasApiKey) {
        try {
          jobs = await fetchLiveJobs(searchQuery);
          if (jobs.length > 0) {
            isLive = true;
          }
        } catch (liveError) {
          console.warn("[Server Console Only] JSearch API previous interest recommendation failed, quietly falling back to local DB cache:", liveError.message);
        }
      }

      // Fallback: If JSearch fails, display jobs from local DB
      if (jobs.length === 0) {
        console.log('[Job Recommend] JSearch unavailable. Showing jobs from local database cache...');
        jobs = await Job.find().sort({ createdAt: -1 }).limit(20);
      }
    }

    // Score all jobs against candidate skills
    const recommended = jobs
      .map(job => {
        const jobObj = job.toObject ? job.toObject() : job;
        const matchResult = calculateMatch(candidateSkills, jobObj.requiredSkills);
        return {
          ...jobObj,
          matchPercentage: matchResult.score,
          matchedSkills: matchResult.matched,
          missingSkills: matchResult.missing
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 20);

    res.json({
      hasResume,
      jobs: recommended
    });
  } catch (err) {
    console.error('[Server Console Only] Job recommendation error:', err.message);
    res.status(500).json({ msg: 'Please wait, unable to fetch recommendations right now. Please try again.' });
  }
});

// ==========================================
// JOB TRACKER MODULE ROUTES
// ==========================================

// @route    GET api/jobs/tracker
// @desc     Get all tracked applications for user
// @access   Private
router.get('/tracker', auth, async (req, res) => {
  try {
    const trackerJobs = await Application.find({ userId: req.user.id })
      .populate('jobId')
      .sort({ updatedAt: -1 });
    res.json(trackerJobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/jobs/tracker
// @desc     Track a new job application (Save, Apply, etc.)
// @access   Private
router.post('/tracker', auth, async (req, res) => {
  const { jobId, status, notes } = req.body;

  try {
    let application = await Application.findOne({ userId: req.user.id, jobId });

    if (application) {
      return res.status(400).json({ msg: 'Job is already tracked in your dashboard' });
    }

    application = new Application({
      userId: req.user.id,
      jobId,
      status: status || 'Saved',
      notes: notes || '',
      appliedDate: status === 'Applied' ? new Date() : null
    });

    await application.save();
    
    const populated = await Application.findById(application._id).populate('jobId');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/jobs/tracker/:id
// @desc     Update tracked application status or notes
// @access   Private
router.put('/tracker/:id', auth, async (req, res) => {
  const { status, notes } = req.body;

  try {
    let application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Tracking record not found' });
    }

    // Verify ownership
    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (status) {
      // Update applied date if state switches to Applied
      if (status === 'Applied' && application.status !== 'Applied') {
        application.appliedDate = new Date();
      }
      application.status = status;
    }
    if (notes !== undefined) application.notes = notes;
    application.updatedAt = new Date();

    await application.save();

    const populated = await Application.findById(application._id).populate('jobId');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    DELETE api/jobs/tracker/:id
// @desc     Remove job application from tracking
// @access   Private
router.delete('/tracker/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Tracking record not found' });
    }

    // Verify ownership
    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Application.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Job removed from tracker' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
