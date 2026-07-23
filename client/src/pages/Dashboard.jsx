import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  FiFileText, 
  FiBriefcase, 
  FiCheckCircle, 
  FiPercent, 
  FiCalendar, 
  FiArrowRight, 
  FiCheckSquare,
  FiHelpCircle,
  FiX
} from 'react-icons/fi';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [trackerJobs, setTrackerJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('hide_dashboard_guide') !== 'true';
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resume analysis
        const resResume = await axios.get('http://localhost:5002/api/resumes/my-resume').catch(() => null);
        if (resResume) setResume(resResume.data);

        // Fetch tracker jobs
        const resTracker = await axios.get('http://localhost:5002/api/jobs/tracker').catch(() => []);
        if (resTracker) setTrackerJobs(resTracker.data);

        // Fetch top recommendations
        const resRecs = await axios.get('http://localhost:5002/api/jobs/recommend').catch(() => null);
        if (resRecs && resRecs.data.jobs) {
          setRecommendations(resRecs.data.jobs.slice(0, 3));
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Compute status distributions for charts
  const statusCounts = {
    'Saved': 0,
    'Applied': 0,
    'Interview Scheduled': 0,
    'Rejected': 0,
    'Offer Received': 0
  };
  trackerJobs.forEach(job => {
    if (statusCounts[job.status] !== undefined) {
      statusCounts[job.status]++;
    }
  });

  const doughnutData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          '#64748b', // Slate
          '#6366f1', // Indigo
          '#0b849e', // Dark Cyan
          '#f43f5e', // Rose
          '#10b981'  // Emerald
        ],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['Saved', 'Applied', 'Interviews', 'Rejected', 'Offers'],
    datasets: [
      {
        label: 'Applications Status',
        data: [
          statusCounts['Saved'],
          statusCounts['Applied'],
          statusCounts['Interview Scheduled'],
          statusCounts['Rejected'],
          statusCounts['Offer Received']
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderRadius: 8,
      },
    ],
  };

  const stats = [
    {
      label: 'Resume Score',
      value: resume ? `${resume.resumeScoring?.overall_score || 0}/100` : 'N/A',
      desc: resume ? 'Overall evaluation' : 'Upload resume to score',
      icon: <FiFileText className="text-xl text-indigo-500" />,
      bg: 'bg-indigo-500/10'
    },
    {
      label: 'ATS Compliance',
      value: resume ? `${resume.atsAnalysis?.ats_score || 0}%` : 'N/A',
      desc: resume?.atsAnalysis?.ats_friendly === 'YES' ? 'ATS Friendly' : 'Requires fixes',
      icon: <FiCheckCircle className="text-xl text-emerald-500" />,
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Total Tracked Jobs',
      value: trackerJobs.length,
      desc: `${statusCounts['Interview Scheduled']} Interviews scheduled`,
      icon: <FiCheckSquare className="text-xl text-cyan-500" />,
      bg: 'bg-cyan-500/10'
    },
    {
      label: 'Top Match Percentage',
      value: recommendations.length > 0 ? `${recommendations[0].matchPercentage}%` : 'N/A',
      desc: 'Based on your skills',
      icon: <FiPercent className="text-xl text-rose-500" />,
      bg: 'bg-rose-500/10'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200/50 dark:bg-slate-800/40 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-3xl"></div>
          <div className="h-64 bg-slate-200/50 dark:bg-slate-800/40 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent border border-slate-200/30 dark:border-white/5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-indigo-500/10 to-transparent blur-3xl pointer-events-none"></div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {getGreeting()}, <span className="neon-text-gradient">{user?.name}</span> 👋
        </h1>
        <p className="text-slate-700 dark:text-slate-200 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
          Welcome to your smart career suite. Optimize your resume structure, track job applications, and generate customized AI tools to accelerate your path to recruitment.
        </p>
      </div>

      {/* High contrast quick start guide */}
      {showGuide && (
        <div className="bg-indigo-500/10 border-2 border-indigo-500/35 rounded-3xl p-6 shadow-sm relative">
          <button
            onClick={() => {
              localStorage.setItem('hide_dashboard_guide', 'true');
              setShowGuide(false);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 cursor-pointer transition-colors"
            title="Dismiss Instructions"
          >
            <FiX className="text-lg" />
          </button>
          <h3 className="text-sm font-extrabold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <FiHelpCircle className="text-lg" /> Quick Start Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-4 bg-white/40 dark:bg-[#121826]/30 border border-indigo-500/20 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">Step 1</span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">Upload Resume</h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-medium">Upload PDF/DOCX to get your ATS compatibility analysis and score instantly.</p>
            </div>
            <div className="p-4 bg-white/40 dark:bg-[#121826]/30 border border-indigo-500/20 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">Step 2</span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">Job Matches</h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-medium">Browse matching opportunities automatically custom-fit to your extracted skills.</p>
            </div>
            <div className="p-4 bg-white/40 dark:bg-[#121826]/30 border border-indigo-500/20 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">Step 3</span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">AI Career Assistant</h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-medium">Generate roadmaps, customize cover letters, and get interview prep help.</p>
            </div>
            <div className="p-4 bg-white/40 dark:bg-[#121826]/30 border border-indigo-500/20 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">Step 4</span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">Track Progress</h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-medium">Save matching job posts and monitor your pipeline (Interview, Offer, etc.).</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#121826]/60 border border-slate-200/30 dark:border-white/5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Pipeline Distribution</h3>
          {trackerJobs.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={doughnutData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11 }
                      }
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm">No applications added to the tracker yet.</p>
              <Link to="/tracker" className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold mt-3 flex items-center gap-1">
                Go to Tracker <FiArrowRight />
              </Link>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Status Overview</h3>
          {trackerJobs.length > 0 ? (
            <div className="h-64">
              <Bar 
                data={barData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { 
                      grid: { color: 'rgba(148, 163, 184, 0.08)' },
                      ticks: { stepSize: 1 } 
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm">No analytics to display.</p>
              <Link to="/jobs" className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold mt-3 flex items-center gap-1">
                Browse Recommended Jobs <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Layout */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121826]/40 border border-slate-200/30 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">Quick Navigation</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Access the main modules of the system immediately to optimize your job application workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/resume" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 border border-slate-150 dark:border-slate-800 transition-all group text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-200">ATS Resume Audit</span>
              <FiArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/assistant" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 border border-slate-150 dark:border-slate-800 transition-all group text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-200">Generate Cover Letters</span>
              <FiArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/assistant" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 border border-slate-150 dark:border-slate-800 transition-all group text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-200">Skill Learning Roadmaps</span>
              <FiArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
          Current system local time:<br/>
          <span className="font-mono text-[10px] text-slate-500 mt-1 inline-block">2026-07-22T00:29:25</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
