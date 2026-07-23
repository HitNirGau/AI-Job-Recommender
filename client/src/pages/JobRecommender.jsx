import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiSearch, 
  FiMapPin, 
  FiDollarSign, 
  FiCalendar, 
  FiCheck, 
  FiBookmark, 
  FiXCircle, 
  FiSliders,
  FiBriefcase,
  FiHelpCircle
} from 'react-icons/fi';

const JobRecommender = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState('');

  // Search & Filter state variables
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [experience, setExperience] = useState('');
  const [roleCategory, setRoleCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSkills, setHasSkills] = useState(true);
  
  // Tracker application tracking status states
  const [trackedJobIds, setTrackedJobIds] = useState(new Set());
  const [message, setMessage] = useState('');

  const fetchJobs = async (isSearch = false) => {
    setLoading(true);
    setUserError('');
    try {
      let endpoint = 'http://localhost:5002/api/jobs/recommend';
      const params = {};

      if (isSearch || search || location || type || experience || roleCategory) {
        endpoint = 'http://localhost:5002/api/jobs/search';
        if (search) params.search = search;
        if (location) params.location = location;
        if (type) params.type = type;
        if (experience) params.experience = experience;
        if (roleCategory) params.title = roleCategory;
      }

      const res = await axios.get(endpoint, { params });
      const payload = res.data;
      const fetchedJobs = Array.isArray(payload) ? payload : (payload.jobs || []);
      
      setAllJobs(fetchedJobs);
      setJobs(fetchedJobs);

      if (payload.hasResume !== undefined) {
        setHasSkills(payload.hasResume);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setUserError('Please wait... We are connecting to fetch the latest job recommendations. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/jobs/tracker');
      const ids = new Set(res.data.map(item => item.jobId?._id).filter(id => id));
      setTrackedJobIds(ids);
    } catch (err) {
      console.error("Error loading tracker jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchTrackedJobs();
  }, []);

  // Client-side real-time filtering as the user types
  useEffect(() => {
    if (!allJobs.length) {
      setJobs([]);
      return;
    }

    const searchQuery = search.toLowerCase().trim();
    const locationQuery = location.toLowerCase().trim();
    const roleQuery = roleCategory.toLowerCase().trim();

    const filtered = allJobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery) ||
        job.company.toLowerCase().includes(searchQuery) ||
        job.description.toLowerCase().includes(searchQuery) ||
        (job.requiredSkills && job.requiredSkills.some(skill => skill.toLowerCase().includes(searchQuery)));

      const matchesLocation = !locationQuery || 
        job.location.toLowerCase().includes(locationQuery);

      const matchesType = !type || 
        job.type === type;

      const matchesExperience = !experience || 
        job.experience.toLowerCase().includes(experience.toLowerCase());

      const matchesRole = !roleQuery || 
        job.title.toLowerCase().includes(roleQuery) ||
        job.description.toLowerCase().includes(roleQuery);

      return matchesSearch && matchesLocation && matchesType && matchesExperience && matchesRole;
    });

    setJobs(filtered);
  }, [search, location, type, experience, roleCategory, allJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(true);
  };

  const handleClearFilters = () => {
    setSearch('');
    setLocation('');
    setType('');
    setExperience('');
    setRoleCategory('');
    fetchJobs();
  };

  const handleTrackJob = async (jobId, status = 'Saved') => {
    try {
      await axios.post('http://localhost:5002/api/jobs/tracker', { jobId, status });
      setTrackedJobIds(prev => new Set([...prev, jobId]));
      setMessage('Job added to tracker!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Job Recommender</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Smart matching system evaluating job requisites against your skills</p>
        </div>
        
        {/* Toggle Filters Button */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm cursor-pointer"
        >
          <FiSliders />
          <span>Filters</span>
        </button>
      </div>

      {userError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
          ⚠️ {userError}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-sm font-medium">
          ✓ {message}
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#121826]/40 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm text-slate-800 dark:text-slate-100 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="neon-btn px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Search</span>
          </button>
        </div>

        {/* Extended Filters Drawer */}
        {showFilters && (
          <div className="p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-[#121826]/40 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-fadeIn">
            {/* Location filter */}
            {/* Location filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              />
            </div>

            {/* Workplace type filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Workplace Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            {/* Role Category filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Role Category</label>
              <select
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Any Role</option>
                <option value="Frontend">Frontend Developer</option>
                <option value="Backend">Backend Engineer</option>
                <option value="Full Stack">Full Stack Developer</option>
                <option value="DevOps">DevOps Engineer</option>
                <option value="AI">AI / ML Engineer</option>
                <option value="Data">Data Scientist / Analyst</option>
              </select>
            </div>

            {/* Experience level filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Experience</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Any</option>
                <option value="0-2 years">Entry Level (0-2 yrs)</option>
                <option value="1-3 years">Junior (1-3 yrs)</option>
                <option value="2-5 years">Mid-Level (2-5 yrs)</option>
                <option value="3+ years">Senior (3+ yrs)</option>
                <option value="5+ years">Lead (5+ yrs)</option>
              </select>
            </div>

            {/* Action filters */}
            <div className="flex items-end justify-start md:justify-end gap-2 pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => fetchJobs(true)}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </form>

      {!hasSkills && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
          💡 <strong>Tip:</strong> Upload a resume in the <strong>Resume Upload</strong> module to extract your skills automatically and see personalized job matches and match percentages.
        </div>
      )}

      {/* Recommended Jobs List */}
      {loading ? (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-xs font-semibold w-fit mx-auto animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Fetching job opportunities, please wait...</span>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200/50 dark:bg-slate-800/40 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => {
              const isTracked = trackedJobIds.has(job._id);
              const isLogoUrl = job.logo && (job.logo.startsWith('http://') || job.logo.startsWith('https://'));

              return (
                <div key={job._id} className="p-6 rounded-3xl bg-white dark:bg-[#121826]/60 border border-slate-200/50 dark:border-white/10 shadow-sm space-y-4 hover:border-indigo-500/30 transition-all">
                  {/* Card Header (Logo, title, company, match percentage) */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-cyan-400 overflow-hidden flex-shrink-0 relative">
                        {isLogoUrl ? (
                          <img 
                            src={job.logo} 
                            alt={job.company} 
                            className="w-full h-full object-contain p-1.5 bg-white dark:bg-slate-900 rounded-2xl absolute inset-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span>{job.company ? job.company.charAt(0).toUpperCase() : '🏢'}</span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base md:text-lg leading-tight">{job.title}</h3>
                        <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-extrabold shadow-sm ${
                        job.matchPercentage >= 75 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : job.matchPercentage >= 40 
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                      }`}>
                        {job.matchPercentage}% Skill Match
                      </span>
                    </div>
                  </div>

                  {/* Metadata Badges Row (Location, Type, Salary, Experience) */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"><FiMapPin className="text-indigo-500" /> {job.location || 'Remote'}</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"><FiCalendar className="text-indigo-500" /> {job.type || 'Full-time'}</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"><FiDollarSign className="text-emerald-500" /> {job.salary || 'Competitive'}</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"><FiBriefcase className="text-indigo-500" /> {job.experience || 'Entry level'}</span>
                  </div>

                  {/* Job description teaser */}
                  {job.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {job.description}
                    </p>
                  )}

                  {/* Skill breakdown tags */}
                  {job.requiredSkills?.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skill Matching Breakdown</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {job.matchedSkills?.length || 0} Matched • {job.missingSkills?.length || 0} Missing
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Render matched skills */}
                        {job.matchedSkills?.map((s, idx) => (
                          <span key={`match-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                            <FiCheck className="text-xs" /> {s}
                          </span>
                        ))}

                        {/* Render missing skills */}
                        {job.missingSkills?.map((s, idx) => (
                          <span key={`miss-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons (Apply, Save, Track) */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <a 
                      href={job.applyLink || '#'} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl border border-indigo-500 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      Apply Now ↗
                    </a>

                    {isTracked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-bold px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                        <FiCheck /> Application Tracked
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTrackJob(job._id, 'Saved')}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FiBookmark /> Save
                        </button>
                        <button
                          onClick={() => handleTrackJob(job._id, 'Applied')}
                          className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          Track Applied
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 text-slate-400">
              <p className="text-sm">No jobs match your search queries or filter details.</p>
              <button 
                onClick={handleClearFilters}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold mt-3 cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobRecommender;
