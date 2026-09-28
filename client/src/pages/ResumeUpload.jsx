import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatUserError } from '../utils/errorFormatter';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiTrash2, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiHelpCircle,
  FiDownload,
  FiX
} from 'react-icons/fi';

const ResumeUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('hide_resume_guide') !== 'true';
  });

  useEffect(() => {
    // Check if user already has an uploaded resume
    const fetchResume = async () => {
      try {
        const res = await axios.get('http://localhost:5002/api/resumes/my-resume');
        setResumeData(res.data);
      } catch (err) {
        // Resume not found is normal for fresh users
      }
    };
    fetchResume();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file) => {
    setError('');
    setNotification('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      setError('Only PDF and DOCX file formats are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setNotification('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post('http://localhost:5002/api/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResumeData(res.data.resume);
      setFile(null);
      if (res.data.duplicate) {
        setNotification('This resume is already uploaded and processed. No reprocessing was required.');
      } else {
        setNotification('New resume uploaded and processed successfully.');
      }
    } catch (err) {
      setError(formatUserError(err, 'Failed to process resume. Please ensure your PDF or DOCX file is valid and try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your current resume?")) return;
    setError('');
    setNotification('');
    try {
      await axios.delete('http://localhost:5002/api/resumes/delete');
      setResumeData(null);
      setNotification('Resume deleted successfully.');
    } catch (err) {
      setError(formatUserError(err, 'Failed to delete resume. Please try again.'));
    }
  };

  const handleDownload = async () => {
    try {
      setError('');
      const res = await axios.get('http://localhost:5002/api/resumes/download', {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const disposition = res.headers['content-disposition'];
      let filename = resumeData?.fileName || 'resume.pdf';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const parts = disposition.split('filename=');
        if (parts[1]) filename = parts[1].replace(/['"]/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download resume file:", err);
      setError(formatUserError(err, 'Failed to download resume file. Please try again.'));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Resume Analyzer</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Upload your resume in PDF/DOCX format to calculate scores and check ATS metrics</p>
      </div>

      {/* Highlighted guidelines */}
      {showGuide && (
        <div className="bg-indigo-500/10 border-2 border-indigo-500/35 rounded-3xl p-6 shadow-sm relative">
          <button
            onClick={() => {
              localStorage.setItem('hide_resume_guide', 'true');
              setShowGuide(false);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 cursor-pointer transition-colors"
            title="Dismiss Instructions"
          >
            <FiX className="text-lg" />
          </button>
          <h3 className="text-sm font-extrabold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <FiHelpCircle className="text-lg" /> Resume Guidelines & Extraction Rules
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-200 list-disc pl-5 leading-relaxed font-semibold">
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Supported File Types:</span> Only standard <strong>PDF</strong> and <strong>DOCX</strong> files are accepted.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Max Size Limit:</span> Files up to <strong>10MB</strong> can be processed.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Dynamic Profile Build:</span> Extracted skills, education, projects, and contact info will auto-populate your user settings.</li>
            <li><span className="text-indigo-600 dark:text-cyan-400 font-bold">Recommender Link:</span> Extracted details prioritize relevant job suggestions matching your exact domain.</li>
          </ul>
        </div>
      )}

      {notification && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-cyan-400 text-sm font-semibold flex items-center justify-between">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification('')} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Main Upload Dropzone Panel */}
      {!resumeData ? (
        <div className="max-w-2xl mx-auto">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' 
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#121826]/40'
            }`}
          >
            <FiUploadCloud className="text-5xl text-slate-400 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 dark:text-white mb-2">Drag and drop your resume here</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Supports PDF & DOCX formats (Max size 10MB)</p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <label className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm cursor-pointer transition-colors">
                Browse Files
                <input type="file" onChange={handleFileChange} accept=".pdf,.docx" className="hidden" />
              </label>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="neon-btn px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Parsing Document...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Analyze</span>
                      <FiFileText />
                    </>
                  )}
                </button>
              )}
            </div>

            {file && (
              <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-sm truncate">
                <FiFileText />
                <span>Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Evaluation Results Dashboards */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores and ATS Checks */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Score circular progress */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm text-center">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-left">Resume Evaluation</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownload}
                    className="p-2 rounded-xl text-indigo-500 hover:bg-indigo-500/10 transition-colors flex items-center justify-center cursor-pointer"
                    title="Download original file"
                  >
                    <FiDownload className="text-lg" />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
                    title="Delete resume"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                {/* SVG Radial Score Tracker */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="transparent" 
                    stroke="var(--border-color)" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="transparent" 
                    stroke="url(#indigoCyanGrad)" 
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - (resumeData.resumeScoring?.overall_score || 0) / 100)}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="indigoCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{resumeData.resumeScoring?.overall_score}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Score</p>
                </div>
              </div>

              {/* Score breakdown parameters */}
              <div className="space-y-3.5 text-left">
                {resumeData.resumeScoring?.breakdown && Object.entries(resumeData.resumeScoring.breakdown).map(([key, val]) => {
                  if (key === 'total') return null;
                  const maxMap = { contact_info: 15, skills: 20, sections: 15, ats_compatibility: 10 };
                  const labelMap = { contact_info: 'Contact Fields', skills: 'Skill Coverage', sections: 'Section Structures', ats_compatibility: 'ATS Compliance' };
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>{labelMap[key] || key}</span>
                        <span>{val} / {maxMap[key] || 10}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                          style={{ width: `${(val / (maxMap[key] || 10)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ATS Checker log */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">ATS Audit</h3>
              
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  resumeData.atsAnalysis?.ats_friendly === 'YES' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {resumeData.atsAnalysis?.ats_friendly === 'YES' ? 'ATS Compliant' : 'Non-Compliant'}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Rating: {resumeData.atsAnalysis?.ats_score}%
                </span>
              </div>

              {resumeData.atsAnalysis?.issues?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiAlertTriangle className="text-rose-500" /> Improvement Issues ({resumeData.atsAnalysis.issues.length})
                  </p>
                  <div className="space-y-1.5">
                    {resumeData.atsAnalysis.issues.map((issue, idx) => (
                      <p key={idx} className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-white/5">
                        • {issue}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 text-xs">
                  <FiCheckCircle className="text-base flex-shrink-0 mt-0.5" />
                  <p>Congratulations! No significant ATS structural parser barriers were detected in your document layout.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Insights, Parsed Skills & Text */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Summary and suggestions */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">AI Resume Profile</h3>
              
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Summary</span>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                  {resumeData.summary}
                </p>
              </div>

              {resumeData.suggestions?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FiHelpCircle className="text-yellow-500 text-sm" /> Actionable Resume Upgrades
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resumeData.suggestions.map((sug, idx) => (
                      <div key={idx} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {sug}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parsed skill list */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Parsed Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resumeData.parsedData?.skills?.length > 0 ? (
                  resumeData.parsedData.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-bold border border-cyan-500/10">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No skills parsed from document.</p>
                )}
              </div>
            </div>

            {/* Section preview snippets */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Parsed Structure Sections</h3>
              
              <div className="space-y-4">
                {resumeData.parsedData?.sections && Object.entries(resumeData.parsedData.sections).map(([sec, text]) => {
                  if (!text || text.trim().length === 0) return null;
                  return (
                    <div key={sec} className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sec}</span>
                      <pre className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800/80 text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-line max-h-32">
                        {text}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
