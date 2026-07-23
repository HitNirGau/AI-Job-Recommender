import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatUserError } from '../utils/errorFormatter';
import { 
  FiFileText, 
  FiBriefcase, 
  FiCheckCircle, 
  FiCopy, 
  FiCheck, 
  FiCompass, 
  FiHelpCircle,
  FiCpu,
  FiZap,
  FiX
} from 'react-icons/fi';

const AiAssistant = () => {
  const { user } = useAuth();
  const [trackerJobs, setTrackerJobs] = useState([]);
  
  // Tab states: 'cover-letter', 'interview', 'roadmap'
  const [activeTab, setActiveTab] = useState('cover-letter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiEngine, setAiEngine] = useState('');
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('hide_assistant_guide') !== 'true';
  });

  // 1. Cover Letter State variables
  const [clJobId, setClJobId] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [copiedCl, setCopiedCl] = useState(false);

  // 2. Interview Prep State variables
  const [intJobId, setIntJobId] = useState('');
  const [techQuestions, setTechQuestions] = useState([]);
  const [hrQuestions, setHrQuestions] = useState([]);

  // 3. Roadmap State variables
  const [targetRole, setTargetRole] = useState('Backend Developer');
  const [roadmapSteps, setRoadmapSteps] = useState([]);

  useEffect(() => {
    const fetchTrackerJobs = async () => {
      try {
        const res = await axios.get('http://localhost:5002/api/jobs/tracker');
        setTrackerJobs(res.data);
        if (res.data.length > 0) {
          setClJobId(res.data[0].jobId?._id || '');
          setIntJobId(res.data[0].jobId?._id || '');
        }
      } catch (err) {
        console.error("Error fetching tracker jobs:", err);
      }
    };
    fetchTrackerJobs();
  }, []);

  const handleGenerateCoverLetter = async () => {
    if (!clJobId) return setError('Please select a job application to continue.');
    setLoading(true);
    setError('');
    setGeneratedLetter('');
    setAiEngine('');

    try {
      const res = await axios.post('http://localhost:5002/api/ai/cover-letter', { jobId: clJobId });
      setGeneratedLetter(res.data.coverLetter);
      setAiEngine(res.data.aiEngine || (res.data.isMock ? 'Smart Template System' : 'Gemini 2.0 AI'));
    } catch (err) {
      setError(formatUserError(err, 'Unable to generate cover letter. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopiedCl(true);
    setTimeout(() => setCopiedCl(false), 2000);
  };

  const handleGenerateInterview = async () => {
    if (!intJobId) return setError('Please select a job application to continue.');
    setLoading(true);
    setError('');
    setTechQuestions([]);
    setHrQuestions([]);
    setAiEngine('');

    try {
      const res = await axios.post('http://localhost:5002/api/ai/interview-questions', { jobId: intJobId });
      setTechQuestions(res.data.techQuestions || []);
      setHrQuestions(res.data.hrQuestions || []);
      setAiEngine(res.data.aiEngine || (res.data.isMock ? 'Smart Template System' : 'Gemini 2.0 AI'));
    } catch (err) {
      setError(formatUserError(err, 'Unable to generate interview questions. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!targetRole.trim()) return setError('Please enter a target professional role.');
    setLoading(true);
    setError('');
    setRoadmapSteps([]);
    setAiEngine('');

    try {
      const res = await axios.post('http://localhost:5002/api/ai/roadmap', { targetRole });
      setRoadmapSteps(res.data.roadmap || []);
      setAiEngine(res.data.aiEngine || (res.data.isMock ? 'Smart Template System' : 'Gemini 2.0 AI'));
    } catch (err) {
      setError(formatUserError(err, 'Unable to build skill roadmap. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Career Assistant</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Leverage Generative AI algorithms to build custom cover letters, roadmaps, and interview prep guides</p>
      </div>

      {/* Highlighted guidelines */}
      {showGuide && (
        <div className="bg-indigo-500/10 border-2 border-indigo-500/35 rounded-3xl p-6 shadow-sm relative">
          <button
            onClick={() => {
              localStorage.setItem('hide_assistant_guide', 'true');
              setShowGuide(false);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 cursor-pointer transition-colors"
            title="Dismiss Instructions"
          >
            <FiX className="text-lg" />
          </button>
          <h3 className="text-sm font-extrabold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <FiHelpCircle className="text-lg" /> How to use AI Career Assistant
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-200 list-disc pl-5 leading-relaxed font-semibold">
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Tailored Cover Letter:</span> Select a saved job application from the dropdown, customize instructions, and generate a customized cover letter.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Dynamic Interview Prep:</span> Click "Interview Prep", select a saved job, and receive custom mock questions and answers.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Skill Roadmap Builder:</span> Enter a target role (e.g. "DevOps Engineer"), and build step-by-step guides for technical skills.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Real-time Generation:</span> All generated outcomes are produced in real-time using Google Gemini.</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs list navigation */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 w-fit">
        <button 
          onClick={() => { setActiveTab('cover-letter'); setError(''); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cover-letter' 
              ? 'bg-white dark:bg-[#121826] text-indigo-600 dark:text-cyan-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Cover Letter Generator
        </button>
        <button 
          onClick={() => { setActiveTab('interview'); setError(''); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'interview' 
              ? 'bg-white dark:bg-[#121826] text-indigo-600 dark:text-cyan-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Interview Prep
        </button>
        <button 
          onClick={() => { setActiveTab('roadmap'); setError(''); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'roadmap' 
              ? 'bg-white dark:bg-[#121826] text-indigo-600 dark:text-cyan-400 shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Skill Roadmap Builder
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {/* TAB 1: Cover Letter */}
        {activeTab === 'cover-letter' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><FiFileText /> Cover Letter Generator</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a tracked job to create a highly tailored cover letter</p>
              </div>
              <button
                onClick={handleGenerateCoverLetter}
                disabled={loading || trackerJobs.length === 0}
                className="neon-btn px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiFileText />
                    <span>Generate Cover Letter</span>
                  </>
                )}
              </button>
            </div>

            {trackerJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <p className="text-sm">Please save or track at least one job first to generate a letter.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="max-w-md space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Target Application</label>
                  <select
                    value={clJobId}
                    onChange={(e) => setClJobId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-200"
                  >
                    {trackerJobs.map((item) => (
                      <option key={item._id} value={item.jobId?._id}>
                        {item.jobId?.title} at {item.jobId?.company}
                      </option>
                    ))}
                  </select>
                </div>

                {generatedLetter && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Generated Cover Letter</span>
                        {aiEngine && (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-[10px] font-extrabold flex items-center gap-1 border border-indigo-500/20">
                            <FiCpu /> {aiEngine}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={handleCopyLetter}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-800"
                      >
                        {copiedCl ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                        <span>{copiedCl ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows="16"
                      value={generatedLetter}
                      className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800/80 focus:outline-none text-sm leading-relaxed font-sans text-slate-700 dark:text-slate-300"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Interview Prep */}
        {activeTab === 'interview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><FiBriefcase /> Interview prep Guide</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Get targeted behavioral and technical questions based on job description</p>
              </div>
              <button
                onClick={handleGenerateInterview}
                disabled={loading || trackerJobs.length === 0}
                className="neon-btn px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiBriefcase />
                    <span>Generate Questions</span>
                  </>
                )}
              </button>
            </div>

            {trackerJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <p className="text-sm">Please save or track at least one job first to generate guides.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-w-md space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Target Application</label>
                  <select
                    value={intJobId}
                    onChange={(e) => setIntJobId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-200"
                  >
                    {trackerJobs.map((item) => (
                      <option key={item._id} value={item.jobId?._id}>
                        {item.jobId?.title} at {item.jobId?.company}
                      </option>
                    ))}
                  </select>
                </div>

                {(techQuestions.length > 0 || hrQuestions.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Technical Segment */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Technical Questions
                      </h4>
                      <div className="space-y-3">
                        {techQuestions.map((q, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                            <span className="text-[10px] font-bold text-indigo-500 dark:text-cyan-400 uppercase tracking-wider">Question {idx + 1}</span>
                            <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HR Segment */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> HR & Behavioral
                      </h4>
                      <div className="space-y-3">
                        {hrQuestions.map((q, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                            <span className="text-[10px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider">Question {idx + 1}</span>
                            <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><FiCompass /> Skill Roadmap Builder</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Get an interactive visual curriculum to land a target career path</p>
              </div>
              <button
                onClick={handleGenerateRoadmap}
                disabled={loading || !targetRole.trim()}
                className="neon-btn px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiCompass />
                    <span>Build Roadmap</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              <div className="max-w-md space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Target Professional Role</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Developer, DevOps Specialist"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Roadmap Graphic render */}
              {roadmapSteps.length > 0 && (
                <div className="relative pl-8 md:pl-10 space-y-8 pt-4">
                  {/* Vertical Connection Line */}
                  <div className="absolute left-[15px] md:left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
                  
                  {roadmapSteps.map((step, idx) => (
                    <div key={idx} className="relative space-y-2">
                      {/* Radial dot overlay */}
                      <div className="absolute left-[-29px] md:left-[-35px] top-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-white dark:border-[#121826] bg-indigo-500 text-white font-extrabold text-[10px] md:text-xs flex items-center justify-center shadow">
                        {idx + 1}
                      </div>

                      {/* Content panel */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/25 border border-slate-200/50 dark:border-white/5 shadow-sm max-w-xl">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{step.step}</h4>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {step.topics?.map((topic, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-[10px] font-bold border border-indigo-500/10">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AiAssistant;
